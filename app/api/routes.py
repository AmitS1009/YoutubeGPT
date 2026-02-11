import shutil
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.api.schemas import ProcessVideoRequest, ChatRequest
from app.api.deps import get_pipeline, PipelineComponents, get_current_user
from app.ingestion.youtube_loader import YoutubeTranscriptLoader
from app.ingestion.text_cleaner import TextCleaner
from app.ingestion.chunker import TimeAwareChunker
from app.ingestion.pdf_loader import PDFProcessor
from app.evaluation.confidence_scorer import ConfidenceScorer
from langchain_core.documents import Document
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter()

@router.post("/ingest/youtube")
async def ingest_youtube(request: ProcessVideoRequest, pipeline: PipelineComponents = Depends(get_pipeline)):
    loader = YoutubeTranscriptLoader()
    video_id = loader.extract_video_id(request.youtube_url)
    
    # Check if already processed (This is in-memory only, lost on restart)
    # Ideally checking the vector store would be better, but for now we loosely check memory
    # or just allow re-processing (update).
    
    transcript = loader.load_transcript(request.youtube_url)
    if not transcript:
        raise HTTPException(status_code=400, detail="Failed to fetch transcript.")
        
    cleaner = TextCleaner()
    for item in transcript:
        item['text'] = cleaner.clean_text(item['text'])
        
    chunker = TimeAwareChunker()
    chunks = chunker.create_chunks(transcript, video_id=video_id)
    
    # Vector Indexing
    pipeline.vector_store.create_index(chunks) # Note: FAISS create_index overwrites or adds? 
    # Current implementation of create_index calls FAISS.from_documents which creates a NEW index
    # We should use add_documents if possible, or check if faiss_store.py supports updating.
    # faiss_store.py has add_documents.
    
    pipeline.vector_store.add_documents(chunks)
    
    # Sparse Indexing
    docs = [Document(page_content=c['text'], metadata={k:v for k,v in c.items() if k!='text'}) for c in chunks]
    pipeline.sparse_retriever.add_documents(docs)
    
    return {"status": "success", "video_id": video_id, "chunks": len(chunks)}

@router.post("/ingest/pdf")
async def ingest_pdf(file: UploadFile = File(...), pipeline: PipelineComponents = Depends(get_pipeline)):
    processor = PDFProcessor()
    
    # Save temp file
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = f"{temp_dir}/{uuid.uuid4()}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        chunks = processor.process_pdf(file_path, file.filename)
        
        # Add to stores
        pipeline.vector_store.add_documents(chunks)
        
        docs = [Document(page_content=c['text'], metadata={k:v for k,v in c.items() if k!='text'}) for c in chunks]
        # Append logic
        pipeline.sparse_retriever.add_documents(docs) 
        
        return {"status": "success", "filename": file.filename, "chunks": len(chunks)}
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/chat")
async def chat(request: ChatRequest, 
               pipeline: PipelineComponents = Depends(get_pipeline), 
               db: AsyncSession = Depends(get_db),
               current_user = Depends(get_current_user)): # Secure Endpoint
    
    # 1. Fetch History from DB (Conversational Memory)
    chat_history = []
    
    # We assume request.session_id is a valid UUID (Thread ID)
    valid_uuid = False
    uuid_obj = None
    try:
        uuid_obj = uuid.UUID(request.session_id)
        valid_uuid = True
    except:
        pass

    if valid_uuid:
        from app.models.chat import Message, Thread
        from sqlalchemy.future import select
        
        # SECURITY CHECK: Ensure Thread belongs to Current User
        thread_result = await db.execute(select(Thread).where(Thread.id == uuid_obj))
        thread = thread_result.scalar_one_or_none()
        
        if not thread:
             # If thread doesn't exist but ID is valid UUID, maybe create it?
             # OR reject. For strict isolation, we reject or auto-create LINKED TO USER.
             # Let's auto-create if missing for robustness, but ownership is key.
             # Actually, if frontend generated it randomly, we MUST claim it for this user.
             new_thread = Thread(id=uuid_obj, user_id=current_user.id, title="New Chat")
             db.add(new_thread)
             await db.commit()
        elif thread.user_id != current_user.id:
             # CRITICAL: Attempt to access another user's thread
             raise HTTPException(status_code=403, detail="Access denied to this chat session")
        
        # Fetch last 6 messages for context
        stmt = select(Message).where(Message.thread_id == uuid_obj).order_by(Message.created_at.desc()).limit(6)
        result = await db.execute(stmt)
        msgs = result.scalars().all()[::-1] 
        
        for i in range(0, len(msgs) - 1, 2):
            if msgs[i].role == 'user' and msgs[i+1].role == 'assistant':
                chat_history.append((msgs[i].content, msgs[i+1].content))
        
    
    # 2. Rewrite Query
    rewritten_query = pipeline.query_rewriter.rewrite(request.message, chat_history=chat_history)
    
    # 3. Search
    raw_docs = pipeline.hybrid_retriever.search(rewritten_query)
    
    # 4. Compress
    compressed_docs = pipeline.context_compressor.compress(raw_docs)
    
    # Save User Message to DB
    if valid_uuid:
        from app.models.chat import Message
        user_msg = Message(thread_id=uuid_obj, role='user', content=request.message)
        db.add(user_msg)
        await db.commit()
    
    # 5. Generate & Stream
    async def event_generator():
        full_answer = ""
        generator = pipeline.answer_generator.generate_answer(request.message, compressed_docs)
        
        for chunk in generator:
            full_answer += chunk
            yield chunk
            
        # Save Assistant Message
        if valid_uuid:
            try:
                ai_msg = Message(thread_id=uuid_obj, role='assistant', content=full_answer)
                db.add(ai_msg)
                await db.commit() 
            except Exception as e:
                pass

    return StreamingResponse(event_generator(), media_type="text/plain")

# --- session / thread management ---
from typing import Dict
from app.models.chat import Thread

@router.post("/threads", response_model=Dict[str, str])
async def create_thread(
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """
    Creates a new chat session linked to the current user.
    """
    new_id = uuid.uuid4()
    title = "New Chat"
    
    new_thread = Thread(
        id=new_id,
        user_id=current_user.id,
        title=title
    )
    db.add(new_thread)
    await db.commit()
    
    return {"thread_id": str(new_id), "title": title}

from typing import List
@router.get("/threads", response_model=List[Dict[str, str]])
async def get_threads(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Fetches all threads for the current user.
    """
    from sqlalchemy.future import select
    result = await db.execute(select(Thread).where(Thread.user_id == current_user.id).order_by(Thread.created_at.desc()))
    threads = result.scalars().all()
    
    return [{"id": str(t.id), "title": t.title or "New Chat"} for t in threads]

