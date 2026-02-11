from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.config.settings import settings

from app.vectorstore.faiss_store import FaissVectorStore
from app.retrieval.dense_retriever import DenseRetriever
from app.retrieval.sparse_retriever import SparseRetriever
from app.retrieval.reranker import Reranker
from app.retrieval.hybrid_retriever import HybridRetriever
from app.reasoning.query_rewriter import QueryRewriter
from app.reasoning.context_compressor import ContextCompressor
from app.llm.answer_generator import AnswerGenerator

class PipelineComponents:
    def __init__(self):
        self.vector_store = FaissVectorStore()
        self.sparse_retriever = SparseRetriever()
        self.reranker = Reranker()
        self.dense_retriever = DenseRetriever(self.vector_store)
        self.hybrid_retriever = HybridRetriever(self.dense_retriever, self.sparse_retriever, self.reranker)
        self.query_rewriter = QueryRewriter()
        self.context_compressor = ContextCompressor()
        self.answer_generator = AnswerGenerator()

@lru_cache()
def get_pipeline():
    return PipelineComponents()

# --- Authentication Dependency ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Check DB
    try:
        # User ID in token is UUID string
        import uuid
        uuid_obj = uuid.UUID(user_id)
        result = await db.execute(select(User).where(User.id == uuid_obj))
        user = result.scalar_one_or_none()
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception
