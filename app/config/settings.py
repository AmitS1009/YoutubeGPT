import os
from dotenv import load_dotenv


# Validating loading by checking file existence
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

class Settings:
    # Paths
    BASE_DIR = BASE_DIR
    DATA_DIR = os.path.join(BASE_DIR, "data")
    TRANSCRIPTS_DIR = os.path.join(DATA_DIR, "transcripts")
    CHUNKS_DIR = os.path.join(DATA_DIR, "processed_chunks")
    VECTORSTORE_DIR = os.path.join(DATA_DIR, "faiss_index")

    # API Keys
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    HF_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN")

    print(f"DEBUG: GROQ_KEY Loaded? {bool(GROQ_API_KEY)}")
    print(f"DEBUG: GOOGLE_KEY Loaded? {bool(GOOGLE_API_KEY)}")

    # Models
    LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")
    GROQ_MODEL = os.getenv("GROQ_MODEL_NAME", "llama-3.1-8b-instant")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

    # RAG Parameters
    CHUNK_SIZE = 1000  # characters
    CHUNK_OVERLAP = 200 # characters, approx 20-30%
    TIME_WINDOW_SECONDS = 300 # 5 minutes
    
    RETRIEVAL_TOP_K = 25
    RERANK_TOP_K = 8
    
    SIMILARITY_THRESHOLD = 0.3

    # Infrastructure
    DATABASE_URL = os.getenv("DATABASE_URL")
    REDIS_URL = os.getenv("REDIS_URL")
    QDRANT_URL = os.getenv("QDRANT_URL")
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

    # Security
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

settings = Settings()
