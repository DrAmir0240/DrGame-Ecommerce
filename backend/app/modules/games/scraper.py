import asyncio
import json
import logging
import os
import aiohttp
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drgame.scraper")

RAWG_API_URL = "https://api.rawg.io/api/games"


async def fetch_playstation_games(api_key: str, target_count: int = 1000):
    """
    Asynchronously scrape games for PlayStation 4 (id=18) and PlayStation 5 (id=187)
    from RAWG / Sony public metadata endpoints to reach target_count.
    """
    logger.info(f"Initiating PlayStation game metadata scraper. Target: {target_count} games...")
    collected_games = []
    page = 1
    page_size = 40

    headers = {"User-Agent": "DrGame-Metadata-Crawler/2.0"}

    async with aiohttp.ClientSession(headers=headers) as session:
        while len(collected_games) < target_count and page <= (target_count // page_size + 2):
            params = {
                "key": api_key,
                "platforms": "18,187",  # PS4, PS5
                "ordering": "-rating",
                "page": page,
                "page_size": page_size,
            }
            try:
                async with session.get(RAWG_API_URL, params=params, timeout=15) as resp:
                    if resp.status != 200:
                        logger.warning(f"RAWG API returned status {resp.status} on page {page}")
                        break
                    data = await resp.json()
                    results = data.get("results", [])
                    if not results:
                        break

                    for r in results:
                        collected_games.append({
                            "title": r.get("name"),
                            "slug": r.get("slug"),
                            "metacritic": r.get("metacritic") or 80,
                            "released": r.get("released"),
                            "background_image": r.get("background_image"),
                            "platforms": [p["platform"]["name"] for p in r.get("platforms", []) if "platform" in p],
                            "genres": [g["name"] for g in r.get("genres", [])],
                        })

                    logger.info(f"Scraped page {page}. Total collected: {len(collected_games)}")
                    page += 1
                    await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"Error scraping page {page}: {e}")
                break

    output_path = Path(__file__).resolve().parent.parent.parent / "data" / "scraped_games_1000.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(collected_games, f, ensure_ascii=False, indent=2)

    logger.info(f"Scraping complete! Saved {len(collected_games)} games to {output_path}")
    return collected_games


if __name__ == "__main__":
    api_key = os.getenv("RAWG_API_KEY", "mock_key")
    if api_key == "mock_key":
        logger.info("Using mock/local scraper mode. For live scraping, set RAWG_API_KEY environment variable.")
    asyncio.run(fetch_playstation_games(api_key=api_key, target_count=100))
