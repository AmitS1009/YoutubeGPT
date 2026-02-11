import os
from typing import List, Dict, Any
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class PDFProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ".", " ", ""]
        )

    def process_pdf(self, file_path: str, filename: str) -> List[Dict[str, Any]]:
        """
        Loads a PDF and returns chunks using the standard splitting logic.
        """
        logger.info(f"Processing PDF: {filename}")
        
        try:
            loader = PyPDFLoader(file_path)
            pages = loader.load()
            
            # Split documents
            docs = self.text_splitter.split_documents(pages)
            
            chunks = []
            for i, doc in enumerate(docs):
                chunks.append({
                    "text": doc.page_content,
                    "source": filename,
                    "page": doc.metadata.get("page", 0),
                    "chunk_index": i,
                    "type": "pdf" 
                })
                
            logger.info(f"Generated {len(chunks)} chunks from {filename}")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to process PDF {filename}: {e}")
            raise e
