import redis.asyncio as aioredis
from typing import Any
import json
from app.core.config import settings

class RedisManager:
    def __init__(self):
        self.redis: aioredis.Redis | None = None

    async def connect(self) -> aioredis.Redis:
        if self.redis is None:
            self.redis = aioredis.from_url(
                settings.REDIS_CONNECTION_URL,
                decode_responses=True,
                socket_timeout=5.0
            )
        return self.redis

    async def close(self):
        if self.redis:
            await self.redis.aclose()
            self.redis = None

    async def ping(self) -> bool:
        client = await self.connect()
        res = await client.ping()
        return bool(res)

    async def get_json(self, key: str) -> Any | None:
        client = await self.connect()
        data = await client.get(key)
        if data:
            try:
                return json.loads(data)
            except Exception:
                return data
        return None

    async def set_json(self, key: str, value: Any, ex: int | None = None):
        client = await self.connect()
        serialized = json.dumps(value, ensure_ascii=False)
        await client.set(key, serialized, ex=ex)

    async def delete(self, *keys: str):
        if not keys:
            return
        client = await self.connect()
        await client.delete(*keys)

    async def delete_pattern(self, pattern: str):
        client = await self.connect()
        async for key in client.scan_iter(match=pattern):
            await client.delete(key)

redis_manager = RedisManager()

async def get_redis() -> aioredis.Redis:
    return await redis_manager.connect()
