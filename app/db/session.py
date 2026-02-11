from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config.settings import settings

# Ensure async driver is used
db_url = settings.DATABASE_URL
engine_args = {
    "echo": False,
    "future": True
}

if db_url:
    # 1. Driver Correction
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # 2. SSL Handling for Cloud DBs (Neon, etc)
    # asyncpg doesn't like 'sslmode' in query params when used via SQLAlchemy sometimes.
    # It prefers connect_args={"ssl": ...}
    
    if "sslmode" in db_url or "channel_binding" in db_url:
        # Strip all query params to be safe, assuming they are related to SSL/Auth
        # which we handle via connect_args or base DSN
        if "?" in db_url:
            db_url = db_url.split("?")[0]
        
        # Enforce SSL in connect_args
        engine_args["connect_args"] = {"ssl": "require"}

# Create Async Engine
engine = create_async_engine(
    db_url,
    **engine_args
)

# Create Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Dependency for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
