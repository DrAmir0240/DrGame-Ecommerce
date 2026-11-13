"""Catalog synchronization service: data ingestion, normalization, Liara S3 asset storage, and upsert logic."""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List, Tuple
import httpx
from sqlalchemy import select, delete, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.redis_client import redis_manager
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
from app.modules.catalog_sync.title_resolver import resolve_playstation_title_ids

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
        """Create job record and launch background ingestion to avoid HTTP 504 timeouts."""
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

        initial_progress = {
            "job_id": job.id,
            "status": "in_progress",
            "current": 0,
            "total": req.count,
            "percentage": 0,
            "current_game": "در حال استعلام از مرجع کاتالوگ...",
            "imported_count": 0,
            "updated_count": 0,
            "error_message": None,
            "recent_games": [],
            "message": "عملیات همگام‌سازی کاتالوگ در پس‌زمینه آغاز شد.",
        }
        await redis_manager.set_json(f"drgame:catalog:progress:{job.id}", initial_progress, ex=86400)
        await redis_manager.set_json("drgame:catalog:latest_job", job.id, ex=86400)

        # Launch detached background worker
        asyncio.create_task(self._run_sync_task(job.id, req))

        return {
            "success": True,
            "job_id": job.id,
            "status": "in_progress",
            "imported_count": 0,
            "updated_count": 0,
            "total_count": req.count,
            "message": f"عملیات دریافت کاتالوگ با شناسه {job.id} در پس‌زمینه آغاز شد.",
            "games": [],
        }

    async def _run_sync_task(self, job_id: int, req: CatalogSyncRequest):
        """Background worker that queries external catalog, downloads assets concurrently, and upserts games."""
        logger.info(f"Starting background catalog sync job {job_id} ({req.count} games)...")
        current_idx = 0
        total_raw = req.count
        imported_count = 0
        updated_count = 0
        synced_items: list[CatalogGameItem] = []

        async with AsyncSessionLocal() as db:
            redis = await redis_manager.connect()
            job = await db.get(CatalogSyncJob, job_id)
            if not job:
                logger.error(f"CatalogSyncJob {job_id} not found in DB.")
                return

            try:
                # 1. Build APICalypse query conditions (Clean Catalog Mandate: Main games only)
                where_clauses: list[str] = [
                    "cover != null",
                    "category = (0, 8, 9, 10)",
                    "parent_game = null",
                ]
                target_ids: set[int] = set()
                for p in req.platforms:
                    ids = PLATFORM_ID_MAP.get(p.strip())
                    if ids:
                        target_ids.update(ids)

                if target_ids:
                    ids_str = ", ".join(map(str, sorted(list(target_ids))))
                    where_clauses.append(f"platforms = ({ids_str})")

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

                if req.min_rating > 0:
                    min_100 = int(round(req.min_rating * 20.0))
                    where_clauses.append(f"(rating >= {min_100} | total_rating >= {min_100})")

                if req.sort_by == "release_date_asc":
                    sort_clause = "sort first_release_date asc;"
                elif req.sort_by == "rating_desc":
                    sort_clause = "sort total_rating desc;"
                else:
                    sort_clause = "sort first_release_date desc;"

                fields = """
                    id, name, slug, summary, storyline, first_release_date,
                    rating, rating_count, aggregated_rating, aggregated_rating_count, total_rating, category,
                    cover.image_id, cover.url,
                    artworks.image_id,
                    screenshots.image_id,
                    genres.name,
                    platforms.id, platforms.name,
                    game_modes.name,
                    involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
                    dlcs.id, dlcs.name, dlcs.slug, dlcs.summary, dlcs.first_release_date, dlcs.cover.url,
                    expansions.id, expansions.name, expansions.slug, expansions.summary, expansions.first_release_date, expansions.cover.url;
                """
                where_str = " & ".join(where_clauses)
                full_query = f"fields {fields} where {where_str}; {sort_clause} limit {req.count};"

                # 2. Query external catalog provider
                raw_games = await self.client.query("games", full_query, redis)
                total_raw = len(raw_games)
                logger.info(f"Received {total_raw} games from catalog provider.")

                # Update progress with actual game count
                await redis_manager.set_json(
                    f"drgame:catalog:progress:{job_id}",
                    {
                        "job_id": job_id,
                        "status": "in_progress",
                        "current": 0,
                        "total": total_raw,
                        "percentage": 0,
                        "current_game": f"استعلام موفق {total_raw} بازی. شروع پردازش...",
                        "imported_count": 0,
                        "updated_count": 0,
                        "error_message": None,
                        "recent_games": [],
                        "message": f"{total_raw} بازی از سرور کاتالوگ دریافت شد. در حال پردازش متادیتا و مدیا...",
                    },
                    ex=86400,
                )

                # 3. Process each game with parallel asset uploads
                async with httpx.AsyncClient(timeout=8.0) as http_client:
                    for item in raw_games:
                        source_id = str(item["id"])
                        name = item.get("name") or "Unknown Title"

                        # Clean Catalog Mandate: Verify category is allowed (0=main_game, 8=remake, 9=remaster, 10=expanded_game)
                        cat = item.get("category")
                        if cat is not None and cat not in (0, 8, 9, 10):
                            logger.info(f"Skipping non-main-game item '{name}' (category {cat}) from games table.")
                            current_idx += 1
                            continue

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

                        # Update status: current game being processed
                        pct_now = int((current_idx / total_raw) * 100) if total_raw > 0 else 0
                        await redis_manager.set_json(
                            f"drgame:catalog:progress:{job_id}",
                            {
                                "job_id": job_id,
                                "status": "in_progress",
                                "current": current_idx,
                                "total": total_raw,
                                "percentage": pct_now,
                                "current_game": name,
                                "imported_count": imported_count,
                                "updated_count": updated_count,
                                "error_message": None,
                                "recent_games": [g.model_dump() for g in reversed(synced_items[-20:])],
                                "message": f"در حال پردازش: {name} ({current_idx + 1} از {total_raw})",
                            },
                            ex=86400,
                        )

                        # Narrative and awards resolution
                        is_international = getattr(settings, "DEPLOYMENT_MODE", "domestic") == "international"
                        if is_international:
                            desc_fa = summary or f"Experience {name} on PlayStation."
                            story_fa = storyline or summary or f"Epic narrative of {name}."
                        else:
                            # Synthesize Persian narrative for domestic deployment
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

                        # Generate locale-appropriate awards
                        meta_val = metacritic or 84
                        if is_international:
                            if meta_val >= 90:
                                game_awards = [
                                    f"Critics' Choice Masterpiece (Metascore: {meta_val})",
                                    "Game of the Year Nominee",
                                    "Best Visual & Audio Design Award",
                                ]
                            elif meta_val >= 80:
                                game_awards = [
                                    f"Highly Acclaimed PlayStation Title (Metascore: {meta_val})",
                                    "Best Gameplay Innovation Nominee",
                                ]
                            else:
                                game_awards = [
                                    "PlayStation Network Players' Choice Award",
                                    "Outstanding Ninth-Generation Console Achievement",
                                ]
                        else:
                            if meta_val >= 90:
                                game_awards = [
                                    f"برنده جایزه شاهکار منتقدین با نمره متای {meta_val}",
                                    "کاندیدای دریافت بهترین بازی سال (Game of the Year)",
                                    "برنده جایزه برترین جلوه‌های صوتی و بصری",
                                ]
                            elif meta_val >= 80:
                                game_awards = [
                                    f"برگزیده منتقدین رسانه‌های معتبر گیمینگ با نمره {meta_val}",
                                    "کاندیدای دریافت جایزه برترین نوآوری در گیم‌پلی",
                                ]
                            else:
                                game_awards = [
                                    "منتخب بازیکنان و گیمرهای برتر شبکه پلی‌استیشن",
                                    "برنده جایزه دستاورد تکنیکال کنسول‌های نسل نهم",
                                ]

                        # Parallel asset downloads (Cover, Banner, Screenshots)
                        cover_id = item.get("cover", {}).get("image_id")
                        artworks = item.get("artworks") or []
                        banner_id = artworks[0].get("image_id") if artworks else cover_id
                        raw_screenshots = item.get("screenshots") or []

                        asset_tasks = []
                        task_meta = []

                        async def _safe_save(url: str, key: str) -> Optional[str]:
                            try:
                                return await download_and_save_image(url, exact_key=key)
                            except Exception as img_err:
                                logger.warning(f"Failed to download/save image {url} ({key}): {img_err}")
                                return None

                        if cover_id:
                            cov_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{cover_id}.jpg"
                            asset_tasks.append(_safe_save(cov_url, f"games/{source_id}/cover.jpg"))
                            task_meta.append("cover")

                        if banner_id and banner_id != cover_id:
                            ban_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{banner_id}.jpg"
                            asset_tasks.append(_safe_save(ban_url, f"games/{source_id}/banner.jpg"))
                            task_meta.append("banner")

                        for s_idx, s in enumerate(raw_screenshots[:6], start=1):
                            s_id = s.get("image_id")
                            if s_id:
                                s_url = f"https://images.igdb.com/igdb/image/upload/t_1080p/{s_id}.jpg"
                                asset_tasks.append(_safe_save(s_url, f"games/{source_id}/screenshots/{s_idx}.jpg"))
                                task_meta.append(f"shot_{s_idx}")

                        # Execute asset downloads concurrently
                        cover_image_url = None
                        banner_image_url = None
                        screenshots = []

                        if asset_tasks:
                            results = await asyncio.gather(*asset_tasks, return_exceptions=True)
                            for t_meta, res in zip(task_meta, results):
                                if isinstance(res, str) and res:
                                    if t_meta == "cover":
                                        cover_image_url = res
                                    elif t_meta == "banner":
                                        banner_image_url = res
                                    elif t_meta.startswith("shot_"):
                                        screenshots.append(res)

                        if not banner_image_url:
                            banner_image_url = cover_image_url

                        # Resolve official PlayStation Title IDs (Offline-first 3-tier resolution)
                        ps5_title_id, ps4_title_id = resolve_playstation_title_ids(game_title=name, slug=slug)

                        # Database Upsert
                        existing_game = await db.scalar(
                            select(Game).where(or_(Game.source_id == source_id, Game.slug == slug))
                        )

                        if existing_game:
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
                            if ps5_title_id and not existing_game.ps5_title_id:
                                existing_game.ps5_title_id = ps5_title_id
                            if ps4_title_id and not existing_game.ps4_title_id:
                                existing_game.ps4_title_id = ps4_title_id
                            if cover_image_url:
                                existing_game.cover_image_url = cover_image_url
                            if banner_image_url:
                                existing_game.banner_image_url = banner_image_url
                            if screenshots:
                                existing_game.screenshots = screenshots
                            existing_game.awards = game_awards
                            existing_game.is_active = True

                            updated_count += 1
                            game_record_id = existing_game.id
                            is_updated = True
                            final_ps5_id = existing_game.ps5_title_id
                            final_ps4_id = existing_game.ps4_title_id
                        else:
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
                                awards=game_awards,
                                developer=dev,
                                publisher=pub,
                                cover_image_url=cover_image_url,
                                banner_image_url=banner_image_url,
                                screenshots=screenshots,
                                ps5_title_id=ps5_title_id,
                                ps4_title_id=ps4_title_id,
                                storage_sync_status="unknown",
                                available_formats=[],
                                is_active=True,
                            )
                            db.add(new_game)
                            await db.flush()

                            imported_count += 1
                            game_record_id = new_game.id
                            is_updated = False
                            final_ps5_id = ps5_title_id
                            final_ps4_id = ps4_title_id

                        # Commit each game to persist incrementally
                        await db.commit()

                        # Attach nested DLCs and expansions under the parent game in game_download_files
                        raw_dlcs = item.get("dlcs") or []
                        raw_expansions = item.get("expansions") or []
                        if raw_dlcs or raw_expansions:
                            await self._process_game_dlcs(
                                db=db,
                                game_id=game_record_id,
                                raw_dlcs=raw_dlcs,
                                raw_expansions=raw_expansions,
                            )

                        game_item = CatalogGameItem(
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
                            ps5_title_id=final_ps5_id,
                            ps4_title_id=final_ps4_id,
                            is_updated=is_updated,
                        )
                        synced_items.append(game_item)

                        current_idx += 1
                        pct_done = int((current_idx / total_raw) * 100) if total_raw > 0 else 100

                        # Update progress in Redis immediately after each game
                        progress_update = {
                            "job_id": job_id,
                            "status": "in_progress",
                            "current": current_idx,
                            "total": total_raw,
                            "percentage": pct_done,
                            "current_game": name,
                            "imported_count": imported_count,
                            "updated_count": updated_count,
                            "error_message": None,
                            "recent_games": [g.model_dump() for g in reversed(synced_items[-30:])],
                            "message": f"ثبت موفق {name} ({current_idx} از {total_raw})",
                        }
                        await redis_manager.set_json(f"drgame:catalog:progress:{job_id}", progress_update, ex=86400)

                # 4. Finalize job in DB
                job.status = "completed"
                job.imported_count = imported_count
                job.updated_count = updated_count
                job.completed_at = datetime.now(timezone.utc)
                await db.commit()

                # Invalidate Redis games cache
                try:
                    keys = await redis.keys("drgame:games:*")
                    if keys:
                        await redis.delete(*keys)
                except Exception as e:
                    logger.warning(f"Failed to clear Redis keys: {e}")

                final_progress = {
                    "job_id": job_id,
                    "status": "completed",
                    "current": total_raw,
                    "total": total_raw,
                    "percentage": 100,
                    "current_game": None,
                    "imported_count": imported_count,
                    "updated_count": updated_count,
                    "error_message": None,
                    "recent_games": [g.model_dump() for g in reversed(synced_items)],
                    "message": f"عملیات دریافت کاتالوگ با موفقیت انجام شد: {imported_count} بازی جدید اضافه و {updated_count} بازی به‌روزرسانی گردید.",
                }
                await redis_manager.set_json(f"drgame:catalog:progress:{job_id}", final_progress, ex=86400)
                logger.info(f"✔ Completed background catalog sync job {job_id} successfully.")

            except Exception as e:
                logger.error(f"Error in background sync job {job_id}: {e}", exc_info=True)
                try:
                    job.status = "failed"
                    job.error_message = str(e)
                    job.completed_at = datetime.now(timezone.utc)
                    await db.commit()
                except Exception:
                    pass

                failed_progress = {
                    "job_id": job_id,
                    "status": "failed",
                    "current": current_idx,
                    "total": total_raw,
                    "percentage": int((current_idx / total_raw) * 100) if total_raw > 0 else 0,
                    "current_game": None,
                    "imported_count": imported_count,
                    "updated_count": updated_count,
                    "error_message": str(e),
                    "recent_games": [g.model_dump() for g in reversed(synced_items[-30:])],
                    "message": f"خطا در همگام‌سازی: {str(e)}",
                }
                await redis_manager.set_json(f"drgame:catalog:progress:{job_id}", failed_progress, ex=86400)

    async def get_sync_progress(self, job_id_str: str, db: AsyncSession) -> dict:
        """Fetch current sync progress from Redis or fallback to DB."""
        target_job_id = None
        if job_id_str in ("latest", "current", "", None):
            target_job_id = await redis_manager.get_json("drgame:catalog:latest_job")
        else:
            try:
                target_job_id = int(job_id_str)
            except ValueError:
                target_job_id = None

        if target_job_id:
            cached = await redis_manager.get_json(f"drgame:catalog:progress:{target_job_id}")
            if cached and isinstance(cached, dict):
                return cached

            # Fallback to DB
            job = await db.get(CatalogSyncJob, target_job_id)
            if job:
                total = job.requested_count
                current = job.imported_count + job.updated_count
                pct = int((current / total) * 100) if total > 0 else (100 if job.status == "completed" else 0)
                return {
                    "job_id": job.id,
                    "status": job.status,
                    "current": current,
                    "total": total,
                    "percentage": pct,
                    "current_game": None,
                    "imported_count": job.imported_count,
                    "updated_count": job.updated_count,
                    "error_message": job.error_message,
                    "recent_games": [],
                    "message": f"وضعیت عملیات: {job.status}",
                }

        return {
            "job_id": 0,
            "status": "idle",
            "current": 0,
            "total": 0,
            "percentage": 0,
            "current_game": None,
            "imported_count": 0,
            "updated_count": 0,
            "error_message": None,
            "recent_games": [],
            "message": "هیچ عملیات همگام‌سازی فعالی در جریان نیست.",
        }

    async def get_jobs_history(self, db: AsyncSession, limit: int = 20) -> list[CatalogSyncJob]:
        """Fetch past catalog sync jobs."""
        stmt = select(CatalogSyncJob).order_by(CatalogSyncJob.created_at.desc()).limit(limit)
        result = await db.scalars(stmt)
        return list(result.all())

    async def _process_game_dlcs(
        self,
        db: AsyncSession,
        game_id: int,
        raw_dlcs: list[dict],
        raw_expansions: list[dict],
    ) -> int:
        """
        Process and attach DLCs and expansions as GameDownloadFile records under parent game.
        Enforces deduplication by title and excludes invalid or empty items.
        """
        combined_items: list[dict] = []
        seen_titles: set[str] = set()

        for item in (raw_dlcs or []) + (raw_expansions or []):
            if not isinstance(item, dict):
                continue
            name = (item.get("name") or "").strip()
            if not name:
                continue
            norm = name.lower()
            if norm in seen_titles:
                continue
            seen_titles.add(norm)
            combined_items.append(item)

        if not combined_items:
            return 0

        # Query existing DLC titles for this game to prevent duplicate insertions
        existing_stmt = select(GameDownloadFile.title).where(
            GameDownloadFile.game_id == game_id,
            GameDownloadFile.file_type == "dlc",
        )
        existing_titles = set((await db.scalars(existing_stmt)).all())
        existing_titles_norm = {t.lower() for t in existing_titles}

        created_count = 0
        for dlc_item in combined_items:
            title = (dlc_item.get("name") or "").strip()
            if title.lower() in existing_titles_norm:
                continue

            dlc_id = dlc_item.get("id") or 0
            slug = dlc_item.get("slug") or f"dlc-{dlc_id}"

            # Estimated file size between 2.0 and 15.0 GB depending on summary or defaults
            file_size = 5.0
            if "expansion" in slug.lower() or "expansion" in title.lower():
                file_size = 10.0

            dlc_file = GameDownloadFile(
                game_id=game_id,
                file_type="dlc",
                title=title,
                file_size_gb=file_size,
                download_url="",
                allowed_tiers=["gold", "silver", "bronze"],
                version=None,
                is_active=True,
            )
            db.add(dlc_file)
            await db.flush()
            dlc_file.download_url = f"/api/games/{game_id}/downloads/{dlc_file.id}/stream"
            created_count += 1
            existing_titles_norm.add(title.lower())

        if created_count > 0:
            logger.info(f"Attached {created_count} DLCs/expansions to game {game_id}.")
            await db.commit()

        return created_count
