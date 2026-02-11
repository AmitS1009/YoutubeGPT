from qdrant_client import AsyncQdrantClient, models
from app.config.settings import settings

class QdrantManager:
    def __init__(self):
        self.client = AsyncQdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )

    async def create_collection_if_not_exists(self, collection_name: str, vector_size: int = 384):
        exists = await self.client.collection_exists(collection_name)
        if not exists:
            await self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            )

    async def get_client(self):
        return self.client

# Singleton
qdrant_manager = QdrantManager()

async def get_qdrant():
    return qdrant_manager
