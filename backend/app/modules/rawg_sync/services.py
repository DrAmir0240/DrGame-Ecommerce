"""RAWG synchronization engine: data normalization, 2P/VR tagging, and catalog seeding."""
import logging
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.modules.games.models import Game, Genre, GameDownloadLink
from app.modules.rawg_sync.client import RawgClient

logger = logging.getLogger("drgame.rawg_sync")

GENRE_FA_MAP = {
    "action": "اکشن",
    "indie": "مستقل",
    "adventure": "ماجراجویی",
    "role-playing-games-rpg": "نقش‌آفرینی",
    "strategy": "استراتژی",
    "shooter": "شوتر و تیراندازی",
    "casual": "تفنی",
    "simulation": "شبیه‌سازی",
    "puzzle": "معمایی و فکری",
    "arcade": "آرکید",
    "platformer": "پلتفرمر",
    "racing": "مسابقه‌ای و اتومبیل‌رانی",
    "massively-multiplayer": "چندنفره آنلاین",
    "sports": "ورزشی",
    "fighting": "مبارزه‌ای",
    "family": "خانوادگی",
}

def map_rawg_platforms(platforms_data: list[dict]) -> list[str]:
    """Map RAWG platform data to standardized string labels."""
    result: set[str] = set()
    for item in platforms_data:
        p = item.get("platform", {})
        slug = p.get("slug", "").lower()
        if "playstation5" in slug or "ps5" in slug:
            result.add("PS5")
        elif "playstation4" in slug or "ps4" in slug:
            result.add("PS4")
        elif "xbox" in slug:
            result.add("Xbox")
        elif "nintendo-switch" in slug or "switch" in slug:
            result.add("Switch")

    if not result:
        result = {"PS5", "PS4"}
    return sorted(list(result))

def detect_two_player_and_vr(game_data: dict) -> tuple[bool, bool]:
    """Determine whether a game supports 2-players (co-op) or VR from RAWG tags and properties."""
    is_two_player = False
    has_vr = False

    tags = game_data.get("tags") or []
    for tag in tags:
        slug = tag.get("slug", "").lower()
        name = tag.get("name", "").lower()

        if any(term in slug or term in name for term in ["co-op", "multiplayer", "local-co-op", "split-screen", "two-player"]):
            is_two_player = True

        if any(term in slug or term in name for term in ["vr", "virtual-reality", "psvr", "playstation-vr"]):
            has_vr = True

    return is_two_player, has_vr

class RawgSyncService:
    def __init__(self, client: RawgClient | None = None):
        self.client = client or RawgClient()

    async def sync_genres(self, db: AsyncSession) -> int:
        """Fetch and persist all genres from RAWG."""
        raw_genres = await self.client.get_genres()
        count = 0
        for item in raw_genres:
            rawg_id = item["id"]
            slug = item["slug"]
            name_en = item["name"]
            name_fa = GENRE_FA_MAP.get(slug, name_en)
            bg = item.get("image_background")

            existing = await db.scalar(select(Genre).where(Genre.rawg_id == rawg_id))
            if not existing:
                genre = Genre(
                    rawg_id=rawg_id,
                    name_fa=name_fa,
                    name_en=name_en,
                    slug=slug,
                    image_background=bg
                )
                db.add(genre)
                count += 1
        await db.commit()
        return count

    async def save_or_update_game(self, db: AsyncSession, item: dict) -> Game:
        """Normalize raw RAWG game payload and persist to PostgreSQL."""
        rawg_id = item["id"]
        title_en = item.get("name") or "Unknown Game"
        slug = item.get("slug") or f"game-{rawg_id}"
        rating = float(item.get("rating") or 0.0)
        metacritic = item.get("metacritic")
        released = item.get("released")
        cover_image = item.get("background_image")

        platforms = map_rawg_platforms(item.get("platforms") or [])
        is_two_player, has_vr = detect_two_player_and_vr(item)

        # Genres
        genres_list = [g.get("name") for g in item.get("genres", []) if g.get("name")]

        # Screenshots
        screenshots = [s.get("image") for s in item.get("short_screenshots", []) if s.get("image")]

        # Download size estimate (GB)
        base_size = 45.0 + (float(rawg_id % 45))
        download_size = round(base_size, 1)

        # Persian Title
        title_fa = title_en

        game = await db.scalar(select(Game).where(Game.rawg_id == rawg_id))
        if not game:
            game = Game(
                rawg_id=rawg_id,
                title_fa=title_fa,
                title_en=title_en,
                slug=slug,
                description_en=item.get("description_raw") or f"Experience the incredible adventure of {title_en}.",
                description_fa=f"تجربه بی‌نظیر و هیجان‌انگیز بازی {title_en} با پشتیبانی کامل از کنسول‌های پلی‌استیشن.",
                released=released,
                rating=rating,
                metacritic=metacritic,
                download_size_gb=download_size,
                is_two_player=is_two_player,
                has_vr=has_vr,
                platforms=platforms,
                genres=genres_list,
                cover_image_url=cover_image,
                banner_image_url=cover_image,
                screenshots=screenshots,
                is_active=True
            )
            db.add(game)
            await db.flush()

            # Create default 5-part download links
            part_size = round(download_size / 5, 1)
            for part in range(1, 6):
                link = GameDownloadLink(
                    game_id=game.id,
                    part_number=part,
                    part_name=f"پارت {part} دیتای بازی",
                    file_size_gb=part_size,
                    download_url=f"https://dl.drgame.ir/data/{slug}/part_{part}.pkg",
                    is_active=True
                )
                db.add(link)
        else:
            game.rating = rating
            game.metacritic = metacritic
            game.cover_image_url = cover_image or game.cover_image_url

        return game

    async def seed_games(self, db: AsyncSession, redis: aioredis.Redis, target_count: int = 50) -> int:
        """Fetch multiple pages of games from RAWG and save to DB."""
        await self.sync_genres(db)

        saved_count = 0
        page = 1
        while saved_count < target_count and page <= 5:
            res = await self.client.get_games(page=page, page_size=20)
            results = res.get("results", [])
            if not results:
                break

            for item in results:
                await self.save_or_update_game(db, item)
                saved_count += 1
                if saved_count >= target_count:
                    break

            page += 1

        await db.commit()

        # Invalidate all games catalog caches
        keys = await redis.keys("drgame:games:*")
        if keys:
            await redis.delete(*keys)

        return saved_count
