import redis.asyncio as redis
from app.config.settings import settings

class RedisClient:
    _instance = None

    def __init__(self):
        self.redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def close(self):
        await self.redis.close()
        
    # Helper methods for Session/Cache
    async def set_value(self, key: str, value: str, expire: int = None):
        if expire:
            await self.redis.setex(key, expire, value)
        else:
            await self.redis.set(key, value)
            
    async def get_value(self, key: str):
        return await self.redis.get(key)
        
    async def delete_value(self, key: str):
        await self.redis.delete(key)

# Singleton dependency
redis_client = RedisClient()

async def get_redis():
    return redis_client
