import json
from typing import Any, Optional
import redis.asyncio as aioredis
from app.core.config import settings

redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=20,
)

redis_client = aioredis.Redis(connection_pool=redis_pool)


class RedisService:
    @staticmethod
    async def get(key: str) -> Optional[Any]:
        try:
            val = await redis_client.get(key)
            if val is not None:
                try:
                    return json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    return val
            return None
        except Exception:
            return None

    @staticmethod
    async def set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            val = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
            await redis_client.set(key, val, ex=ttl)
            return True
        except Exception:
            return False

    @staticmethod
    async def delete(key: str) -> bool:
        try:
            await redis_client.delete(key)
            return True
        except Exception:
            return False

    @staticmethod
    async def ping() -> bool:
        try:
            res = await redis_client.ping()
            return bool(res)
        except Exception:
            return False


async def get_redis() -> aioredis.Redis:
    return redis_client
