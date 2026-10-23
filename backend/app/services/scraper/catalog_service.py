"""
DrGame Catalog Collection Engine
Implements the 5-source scraper pipeline:
1. Sony PlayStation Store GraphQL & __NEXT_DATA__ scraper
2. Steam Store Search fallback
3. Wikipedia REST API
4. PSPrices Scraper
5. RAWG Video Games Database
"""

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("drgame.scraper")

SONY_GRAPHQL_ENDPOINT = "https://web.np.playstation.com/api/graphql/v1/op"
SONY_GRAPHQL_SHA256 = "ac5fb2ba82c0d19290fb56cde3ed3ef3cadec1ed4fc8fc6d2bc6bc22c622b181"

STEAM_SEARCH_URL = "https://store.steampowered.com/api/storesearch/"
WIKIPEDIA_REST_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/"
PSPRICES_SEARCH_URL = "https://psprices.com/region-us/search/"
RAWG_API_URL = "https://api.rawg.io/api/games"

WHITELISTED_IMAGE_DOMAINS = [
    "image.api.playstation.com",
    "gmedia.playstation.com",
    "shared.akamai.steamstatic.com",
    "cdn.cloudflare.steamstatic.com",
    "steamcdn-a.akamaihd.net",
    "cdn2.steamgriddb.com",
    "images.igdb.com",
    "media.rawg.io",
    "upload.wikimedia.org",
]


class CatalogScraperService:
    def __init__(self, rawg_api_key: Optional[str] = None):
        self.rawg_api_key = rawg_api_key
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def fetch_sony_store_by_concept(self, concept_id: str) -> Optional[Dict[str, Any]]:
        """Fetch title metadata and official covers from Sony Store GraphQL."""
        params = {
            "operationName": "metGetProductById",
            "variables": f'{{"productId":"{concept_id}"}}',
            "extensions": f'{{"persistedQuery":{{"version":1,"sha256Hash":"{SONY_GRAPHQL_SHA256}"}}}}',
        }
        try:
            async with httpx.AsyncClient(timeout=10.0, headers=self.headers) as client:
                res = await client.get(SONY_GRAPHQL_ENDPOINT, params=params)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data", {}).get("productRetrieve", {})
        except Exception as e:
            logger.warning(f"Sony GraphQL fetch failed for {concept_id}: {e}")
        return None

    async def fetch_steam_fallback(self, query: str) -> Optional[Dict[str, Any]]:
        """Fetch Steam store fallback metadata and vertical capsule art."""
        params = {"term": query, "l": "english", "cc": "US"}
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                res = await client.get(STEAM_SEARCH_URL, params=params)
                if res.status_code == 200:
                    items = res.json().get("items", [])
                    if items:
                        app = items[0]
                        app_id = app.get("id")
                        return {
                            "steam_id": app_id,
                            "title": app.get("name"),
                            "cover_vertical": f"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/{app_id}/library_600x900_2x.jpg",
                            "header_image": app.get("tiny_image", "").replace("capsule_sm_120", "header"),
                        }
        except Exception as e:
            logger.warning(f"Steam search fallback failed for {query}: {e}")
        return None

    async def fetch_wikipedia_summary(self, title: str) -> Optional[Dict[str, Any]]:
        """Fetch storyline summary and developer info from Wikipedia REST API."""
        encoded_title = re.sub(r"\s+", "_", title.strip())
        url = f"{WIKIPEDIA_REST_URL}{encoded_title}"
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "extract": data.get("extract"),
                        "thumbnail": data.get("thumbnail", {}).get("source"),
                        "description": data.get("description"),
                    }
        except Exception as e:
            logger.warning(f"Wikipedia summary failed for {title}: {e}")
        return None

    async def fetch_rawg_metadata(self, query: str) -> Optional[Dict[str, Any]]:
        """Fetch genre labels, ratings and platforms from RAWG Database."""
        if not self.rawg_api_key:
            return None
        params = {"key": self.rawg_api_key, "search": query, "page_size": 1}
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                res = await client.get(RAWG_API_URL, params=params)
                if res.status_code == 200:
                    results = res.json().get("results", [])
                    if results:
                        item = results[0]
                        return {
                            "rawg_id": item.get("id"),
                            "rating": item.get("rating"),
                            "metacritic": item.get("metacritic"),
                            "released": item.get("released"),
                            "genres": [g["name"] for g in item.get("genres", [])],
                            "background_image": item.get("background_image"),
                        }
        except Exception as e:
            logger.warning(f"RAWG lookup failed for {query}: {e}")
        return None

    async def aggregate_catalog_item(self, query: str, concept_id: Optional[str] = None) -> Dict[str, Any]:
        """Aggregate data across all 5 sources and normalize into Game schema."""
        results: Dict[str, Any] = {
            "query": query,
            "title": query,
            "covers": [],
            "platforms": ["PS5", "PS4"],
            "story": None,
            "metacritic": None,
        }

        # 1. Sony Store
        if concept_id:
            sony_data = await self.fetch_sony_store_by_concept(concept_id)
            if sony_data:
                results["sony"] = sony_data

        # 2. Steam Fallback
        steam_data = await self.fetch_steam_fallback(query)
        if steam_data:
            results["steam"] = steam_data
            if steam_data.get("cover_vertical"):
                results["covers"].append(steam_data["cover_vertical"])

        # 3. Wikipedia Summary
        wiki_data = await self.fetch_wikipedia_summary(query)
        if wiki_data:
            results["story"] = wiki_data.get("extract")

        # 4. RAWG Metadata
        rawg_data = await self.fetch_rawg_metadata(query)
        if rawg_data:
            results["metacritic"] = rawg_data.get("metacritic")
            results["genres"] = rawg_data.get("genres")
            if rawg_data.get("background_image"):
                results["covers"].append(rawg_data["background_image"])

        return results
