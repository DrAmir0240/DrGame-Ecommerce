"""RAWG API asynchronous client with rate-limiting support."""
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger("drgame.rawg")

class RawgClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or settings.RAWG_API_KEY
        self.base_url = (base_url or settings.RAWG_BASE_URL).rstrip("/")
        self.timeout = httpx.Timeout(15.0, connect=10.0)

    async def get_genres(self) -> list[dict]:
        """Fetch all genres from RAWG."""
        url = f"{self.base_url}/genres"
        params = {"key": self.api_key, "page_size": 40}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    return res.json().get("results", [])
                logger.error(f"RAWG get_genres returned status {res.status_code}")
                return []
            except Exception as e:
                logger.error(f"Error calling RAWG get_genres: {e}")
                return []

    async def get_games(
        self,
        page: int = 1,
        page_size: int = 40,
        ordering: str = "-rating",
        platforms: str = "187,18,16,15,27"  # PS5, PS4, PS3, Xbox One, Xbox Series S/X
    ) -> dict:
        """Fetch paginated games from RAWG."""
        url = f"{self.base_url}/games"
        params = {
            "key": self.api_key,
            "page": page,
            "page_size": page_size,
            "ordering": ordering,
            "platforms": platforms,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    return res.json()
                logger.error(f"RAWG get_games returned status {res.status_code}")
                return {"results": [], "count": 0}
            except Exception as e:
                logger.error(f"Error calling RAWG get_games: {e}")
                return {"results": [], "count": 0}

    async def get_game_details(self, rawg_id: int) -> dict | None:
        """Fetch complete metadata for a single game."""
        url = f"{self.base_url}/games/{rawg_id}"
        params = {"key": self.api_key}
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    return res.json()
                return None
            except Exception as e:
                logger.error(f"Error calling RAWG get_game_details for {rawg_id}: {e}")
                return None
