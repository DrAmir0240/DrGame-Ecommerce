"""Catalog synchronization service: data ingestion, normalization, Liara S3 asset storage, and upsert logic."""
import logging
from datetime import datetime, timezone
from typing import Optional, List, Tuple
import httpx
from sqlalchemy import select, delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.storage import download_and_save_image
from app.modules.catalog_sync.narrative import synthesize_game_narrative
from app.modules.games.models import (
    Game,
    Genre,
    CatalogSyncJob,
    GameInteraction,
    GameDownloadLink,
)
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory
from app.modules.catalog_sync.client import CatalogClient
from app.modules.catalog_sync.schemas import CatalogSyncRequest, CatalogGameItem

logger = logging.getLogger("drgame.catalog_sync")

PLATFORM_ID_MAP = {
    "PS5": [167],
    "PS4": [48],
    "Xbox": [169, 49],
    "Switch": [130, 508],
}


def map_platforms(platform_list: list[dict]) -> tuple[list[str], bool]:
    """Map platform objects to standardized label list and detect VR capability."""
    labels = set()
    has_vr = False
    for p in platform_list:
        p_id = p.get("id")
        name = p.get("name", "").lower()
        if p_id == 167 or "playstation 5" in name or "ps5" in name:
            labels.add("PS5")
        if p_id == 48 or "playstation 4" in name or "ps4" in name:
            labels.add("PS4")
        if p_id in (169, 49) or "xbox" in name:
            labels.add("Xbox")
        if p_id in (130, 508) or "switch" in name or "nintendo" in name:
            labels.add("Switch")
        if p_id in (165, 390) or "vr" in name:
            has_vr = True

    if not labels:
        labels = {"PS5", "PS4"}
    return sorted(list(labels)), has_vr


def extract_companies(companies: list[dict]) -> tuple[Optional[str], Optional[str]]:
    """Extract developer and publisher from involved_companies."""
    dev = None
    pub = None
    for item in companies:
        c_name = item.get("company", {}).get("name")
        if not c_name:
            continue
        if item.get("developer"):
            dev = c_name
        if item.get("publisher"):
            pub = c_name
    return dev, pub


def detect_two_player(game_modes: list[dict]) -> bool:
    """Check if game modes indicate co-op or multiplayer."""
    for m in game_modes:
        name = m.get("name", "").lower()
        if any(keyword in name for keyword in ["co-operative", "multiplayer", "split screen"]):
            return True
    return False


def format_release_date(timestamp: Optional[int]) -> Optional[str]:
    """Format Unix timestamp to YYYY-MM-DD."""
    if not timestamp:
        return None
    try:
        return datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return None


class CatalogSyncService:
    """Service handling catalog ingestion, storage synchronization, and database upserts."""

    def __init__(self, client: Optional[CatalogClient] = None):
        self.client = client or CatalogClient()

    async def wipe_catalog(self, db: AsyncSession, redis: aioredis.Redis) -> int:
        """Completely wipe all games and related dependent records for a clean catalog test."""
        logger.warning("Initiating full wipe of games catalog and all dependent tables...")

        # 1. Delete dependent tables
        await db.execute(delete(GameInteraction))
        await db.execute(delete(GameDownloadLink))
        await db.execute(delete(GameDownloadFile))
        await db.execute(delete(UserDownloadHistory))

        # 2. Count and delete games
        count = await db.scalar(select(func.count(Game.id))) or 0
        await db.execute(delete(Game))

        await db.commit()

        # 3. Invalidate Redis catalog cache
        try:
            keys = await redis.keys("drgame:games:*")
            if keys:
                await redis.delete(*keys)
        except Exception as e:
            logger.warning(f"Failed to clear Redis keys during wipe: {e}")

        logger.info(f"✔ Full catalog wipe complete. Deleted {count} games.")
        return count

    async def sync_catalog(
        self,
        db: AsyncSession,
        redis: aioredis.Redis,
        req: CatalogSyncRequest,
    ) -> dict:
        """Query external catalog provider with requested filters, upload assets to Liara S3, and upsert games."""
        # 1. Create a job record in DB
        job = CatalogSyncJob(
            status="in_progress",
            platforms=req.platforms,
            date_from=req.date_from,
            date_to=req.date_to,
            min_rating=req.min_rating,
            sort_by=req.sort_by,
            requested_count=req.count,
            imported_count=0,
            updated_count=0,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        try:
            # 2. Build APICalypse query conditions
            where_clauses: list[str] = ["cover != null"]

            # Platforms filter
            target_ids: set[int] = set()
            for p in req.platforms:
                ids = PLATFORM_ID_MAP.get(p.strip())
                if ids:
                    target_ids.update(ids)

            if target_ids:
                ids_str = ", ".join(map(str, sorted(list(target_ids))))
                where_clauses.append(f"platforms = ({ids_str})")

            # Date range filter
            if req.date_from:
                try:
                    start_dt = datetime.strptime(req.date_from, "%Y-%m-%d")
                    start_ts = int(start_dt.replace(tzinfo=timezone.utc).timestamp())
                    where_clauses.append(f"first_release_date >= {start_ts}")
                except Exception as e:
                    logger.warning(f"Invalid date_from format: {req.date_from} ({e})")

            if req.date_to:
                try:
                    end_dt = datetime.strptime(req.date_to, "%Y-%m-%d")
                    end_ts = int(end_dt.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc).timestamp())
                    where_clauses.append(f"first_release_date <= {end_ts}")
                except Exception as e:
                    logger.warning(f"Invalid date_to format: {req.date_to} ({e})")

            # Min rating filter (convert 0-5 to 0-100 integer for APICalypse parser)
            if req.min_rating > 0:
                min_100 = int(round(req.min_rating * 20.0))
                where_clauses.append(f"(rating >= {min_100} | total_rating >= {min_100})")

            # Sorting clause
            if req.sort_by == "release_date_asc":
                sort_clause = "sort first_release_date asc;"
            elif req.sort_by == "rating_desc":
                sort_clause = "sort total_rating desc;"
            else:  # release_date_desc (default)
                sort_clause = "sort first_release_date desc;"

            fields = """
                id, name, slug, summary, storyline, first_release_date,
                rating, rating_count, aggregated_rating, aggregated_rating_count, total_rating,
                cover.image_id, cover.url,
                artworks.image_id,
                screenshots.image_id,
                genres.name,
                platforms.id, platforms.name,
                game_modes.name,
                involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
            """
            where_str = " & ".join(where_clauses)
            full_query = f"fields {fields} where {where_str}; {sort_clause} limit {req.count};"

            logger.info(f"Executing APICalypse query: where {where_str}; {sort_clause} limit {req.count};")

            # 3. Query external provider
            raw_games = await self.client.query("games", full_query, redis)
            logger.info(f"Received {len(raw_games)} games from catalog provider.")

            imported_count = 0
            updated_count = 0
            synced_items: list[CatalogGameItem] = []

            # 4. Upsert each game into DB & upload assets to S3
            async with httpx.AsyncClient(timeout=6.0) as http_client:
                for item in raw_games:
                    source_id = str(item["id"])
                    name = item.get("name") or "Unknown Title"
                    slug = item.get("slug") or f"game-{source_id}"
                    summary = item.get("summary")
                    storyline = item.get("storyline")
                    released = format_release_date(item.get("first_release_date"))

                    raw_rating = item.get("rating")
                    rating_5 = round(raw_rating / 20.0, 1) if raw_rating else 0.0

                    raw_meta = item.get("aggregated_rating")
                    metacritic = round(raw_meta) if raw_meta else None

                    platforms, has_vr = map_platforms(item.get("platforms") or [])
                    is_two_player = detect_two_player(item.get("game_modes") or [])
                    genres = [g["name"] for g in item.get("genres") or [] if "name" in g]
                    dev, pub = extract_companies(item.get("involved_companies") or [])

                    # Synthesize rich Persian narrative & description (minimum 10 lines storyline)
                    try:
                        desc_fa, story_fa = await synthesize_game_narrative(
                            title=name,
                            summary=summary,
                            storyline=storyline,
                            genres=genres,
                            platforms=platforms,
                            developer=dev,
                            publisher=pub,
                            client=http_client,
                        )
                    except Exception as narrative_err:
                        logger.warning(f"Failed to synthesize narrative for {name}: {narrative_err}")
                        desc_fa = f"بازی {name} برای کنسول‌های بازی."
                        story_fa = storyline

                    # Upload assets to Liara S3 (games/{source_id}/...)
                    cover_id = item.get("cover", {}).get("image_id")
                    cover_image_url = None
                    if cover_id:
                        cover_source_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{cover_id}.jpg"
                        cover_image_url = await download_and_save_image(
                            cover_source_url, exact_key=f"games/{source_id}/cover.jpg"
                        )

                    artworks = item.get("artworks") or []
                    banner_id = artworks[0].get("image_id") if artworks else cover_id
                    banner_image_url = cover_image_url
                    if banner_id and banner_id != cover_id:
                        banner_source_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{banner_id}.jpg"
                        banner_image_url = await download_and_save_image(
                            banner_source_url, exact_key=f"games/{source_id}/banner.jpg"
                        )

                    raw_screenshots = item.get("screenshots") or []
                    screenshots = []
                    for s_idx, s in enumerate(raw_screenshots[:6], start=1):
                        s_id = s.get("image_id")
                        if s_id:
                            s_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{s_id}.jpg"
                            s3_shot = await download_and_save_image(
                                s_url, exact_key=f"games/{source_id}/screenshots/{s_idx}.jpg"
                            )
                            screenshots.append(s3_shot)

                    # Check if game already exists in DB
                    existing_game = await db.scalar(
                        select(Game).where(or_(Game.source_id == source_id, Game.slug == slug))
                    )

                    if existing_game:
                        # UPDATE existing game
                        existing_game.source_id = source_id
                        existing_game.title_en = name
                        existing_game.title_fa = name
                        existing_game.description_en = summary
                        existing_game.description_fa = desc_fa
                        existing_game.storyline_fa = story_fa
                        existing_game.released = released
                        existing_game.rating = rating_5
                        existing_game.metacritic = metacritic
                        existing_game.platforms = platforms
                        existing_game.genres = genres
                        existing_game.developer = dev
                        existing_game.publisher = pub
                        existing_game.is_two_player = is_two_player
                        existing_game.has_vr = has_vr
                        if cover_image_url:
                            existing_game.cover_image_url = cover_image_url
                        if banner_image_url:
                            existing_game.banner_image_url = banner_image_url
                        if screenshots:
                            existing_game.screenshots = screenshots
                        existing_game.is_active = True

                        updated_count += 1
                        game_record_id = existing_game.id
                        is_updated = True
                    else:
                        # INSERT new game (NO download parts generated!)
                        new_game = Game(
                            source_id=source_id,
                            title_fa=name,
                            title_en=name,
                            slug=slug,
                            description_en=summary or f"Experience the incredible adventure of {name}.",
                            description_fa=desc_fa,
                            storyline_fa=story_fa,
                            released=released,
                            rating=rating_5,
                            metacritic=metacritic,
                            download_size_gb=40.0,
                            is_two_player=is_two_player,
                            has_vr=has_vr,
                            platforms=platforms,
                            genres=genres,
                            developer=dev,
                            publisher=pub,
                            cover_image_url=cover_image_url,
                            banner_image_url=banner_image_url,
                            screenshots=screenshots,
                            is_active=True,
                        )
                        db.add(new_game)
                        await db.flush()

                        imported_count += 1
                        game_record_id = new_game.id
                        is_updated = False

                synced_items.append(
                    CatalogGameItem(
                        id=game_record_id,
                        source_id=source_id,
                        title_en=name,
                        slug=slug,
                        released=released,
                        rating=rating_5,
                        metacritic=metacritic,
                        platforms=platforms,
                        genres=genres,
                        cover_image_url=cover_image_url,
                        is_updated=is_updated,
                    )
                )

            # 5. Commit all changes to DB
            await db.commit()

            # 6. Update job record
            job.status = "completed"
            job.imported_count = imported_count
            job.updated_count = updated_count
            job.completed_at = datetime.now(timezone.utc)
            await db.commit()

            # 7. Invalidate Redis catalog cache
            try:
                keys = await redis.keys("drgame:games:*")
                if keys:
                    await redis.delete(*keys)
            except Exception as e:
                logger.warning(f"Failed to clear Redis keys: {e}")

            return {
                "success": True,
                "job_id": job.id,
                "imported_count": imported_count,
                "updated_count": updated_count,
                "total_count": len(synced_items),
                "message": f"عملیات دریافت کاتالوگ با موفقیت انجام شد: {imported_count} بازی جدید اضافه و {updated_count} بازی به‌روزرسانی گردید.",
                "games": synced_items,
            }

        except Exception as e:
            logger.error(f"Error executing catalog sync: {e}", exc_info=True)
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            await db.commit()
            raise

    async def get_jobs_history(self, db: AsyncSession, limit: int = 20) -> list[CatalogSyncJob]:
        """Fetch past catalog sync jobs."""
        stmt = select(CatalogSyncJob).order_by(CatalogSyncJob.created_at.desc()).limit(limit)
        result = await db.scalars(stmt)
        return list(result.all())
