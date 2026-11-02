"""High-performance async client for catalog data provider with Redis token caching."""
import logging
import asyncio
import httpx
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("drgame.catalog_sync")

REDIS_TOKEN_KEY = "drgame:igdb:access_token"


class CatalogClient:
    """Async client with OAuth2 client-credentials flow, exact-TTL Redis caching and APICalypse queries."""

    def __init__(self):
        self.client_id = settings.IGDB_CLIENT_ID
        self.client_secret = settings.IGDB_CLIENT_SECRET
        self.base_url = settings.IGDB_BASE_URL.rstrip("/")
        self.token_url = settings.IGDB_TOKEN_URL

    async def get_access_token(self, redis: aioredis.Redis) -> str:
        """Fetch access token from Redis cache, or renew from Twitch OAuth if expired."""
        cached_token = await redis.get(REDIS_TOKEN_KEY)
        if cached_token:
            if isinstance(cached_token, bytes):
                return cached_token.decode("utf-8")
            return str(cached_token)

        logger.info("IGDB OAuth token not found in Redis or expired. Requesting a new token from Twitch OAuth...")
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials",
        }

        async with httpx.AsyncClient(timeout=15.0) as http_client:
            resp = await http_client.post(self.token_url, params=params)
            if resp.status_code != 200:
                logger.error(f"Failed to obtain Twitch OAuth token: HTTP {resp.status_code} - {resp.text}")
                raise RuntimeError(f"Authentication with catalog provider failed: {resp.status_code}")

            data = resp.json()
            access_token = data.get("access_token")
            expires_in = data.get("expires_in", 5184000)  # ~60 days

            if not access_token:
                raise RuntimeError("No access_token returned by OAuth provider.")

            # Cache in Redis with the exact TTL provided by Twitch
            await redis.set(REDIS_TOKEN_KEY, access_token, ex=expires_in)
            logger.info(f"✔ Successfully cached new IGDB token in Redis with TTL={expires_in}s (~{expires_in // 86400} days).")
            return access_token

    async def query(self, endpoint: str, apicalypse_query: str, redis: aioredis.Redis) -> list[dict]:
        """Execute APICalypse query with automatic 401 token invalidation and retry."""
        token = await self.get_access_token(redis)
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        headers = {
            "Client-ID": self.client_id,
            "Authorization": f"Bearer {token}",
            "Content-Type": "text/plain",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as http_client:
            resp = await http_client.post(url, headers=headers, content=apicalypse_query.encode("utf-8"))

            # Auto-retry on 401 Unauthorized
            if resp.status_code == 401:
                logger.warning("Received 401 Unauthorized from catalog API. Invalidating cached token and retrying...")
                await redis.delete(REDIS_TOKEN_KEY)
                token = await self.get_access_token(redis)
                headers["Authorization"] = f"Bearer {token}"
                resp = await http_client.post(url, headers=headers, content=apicalypse_query.encode("utf-8"))

            # Backoff and retry on 429 Too Many Requests
            if resp.status_code == 429:
                logger.warning("Rate limit hit (429). Sleeping for 1.2s before retry...")
                await asyncio.sleep(1.2)
                resp = await http_client.post(url, headers=headers, content=apicalypse_query.encode("utf-8"))

            if resp.status_code != 200:
                logger.error(f"Catalog API error on {endpoint}: HTTP {resp.status_code} - {resp.text}")
                raise RuntimeError(f"Catalog query failed: HTTP {resp.status_code} - {resp.text}")

            return resp.json()
