import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="YoutubeGPT API",
    description="Production RAG with Long-term Memory"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "healthy"}

# IMPORTANT: Lazy import routers AFTER app creation
try:
    from app.api.auth import router as auth_router
    from app.api.routes import router

    app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
    app.include_router(router)

except Exception as e:
    print("Router load failed:", e)
