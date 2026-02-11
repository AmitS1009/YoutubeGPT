from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ProcessVideoRequest(BaseModel):
    youtube_url: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    model_name: Optional[str] = "groq-llama3"  # Default model

class Source(BaseModel):
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]] = []

# Auth Schemas
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: str
    full_name: Optional[str] = None
