import asyncio
from app.db.session import engine
from app.db.base import Base
# Import models so they are registered with Base
from app.models.user import User
from app.models.chat import Thread, Message

async def init_models():
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # WARNING: DELETES DATA. Uncomment only for fresh start.
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
