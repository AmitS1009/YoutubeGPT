from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.routes import router
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

from app.api.auth import router as auth_router

app = FastAPI(title="YoutubeGPT API", description="Production RAG with Long-term Memory")

# CORS
# CORS
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(router)

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Generic RAG Agent"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
