"""StorageBridgeService: Seamless integration with storage server (dltest.gamedr.ir).
Classifies jobs into FPKG (<= 11.40) and FAT32 (> 11.40), matches Title IDs (PPSA/CUSA),
caches storage metadata, and drives Download32 DPoP handoffs.
"""
import os
import re
import json
import logging
import hashlib
from typing import Optional, List, Dict, Any, Tuple
import httpx
from sqlalchemy import select, or_, update
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.config import settings
from app.modules.games.models import Game
from app.modules.catalog_sync.title_resolver import (
    resolve_playstation_title_ids,
    normalize_title_slug,
    PPSA_REGEX,
    CUSA_REGEX,
)

logger = logging.getLogger("drgame.storage_bridge")

TGSTORAGE_BASE_URL = os.getenv("DPOP_BASE_ORIGIN", "https://dltest.gamedr.ir").rstrip("/")
STORAGE_JOBS_CACHE_KEY = "drgame:tgstorage:jobs_cache"
STORAGE_CACHE_TTL = 300  # 5 minutes

# Firmware User-Agent parser patterns
PS5_UA_PATTERN = re.compile(r"PlayStation\s+5[/ ](\d+\.\d+)", re.IGNORECASE)
PS4_UA_PATTERN = re.compile(r"PlayStation\s+4[/ ]?(\d+\.\d+)?", re.IGNORECASE)


def detect_console_firmware(user_agent: Optional[str]) -> Dict[str, Any]:
    """
    Parses User-Agent header from incoming request to detect:
    - Platform: 'ps5', 'ps4', or 'desktop_or_mobile'
    - Firmware version (float if detected)
    - Recommended format: 'fpkg' for FW <= 11.40, 'fat32' for FW > 11.40
    - is_console: bool
    """
    ua = (user_agent or "").strip()
    if not ua:
        return {
            "platform": "desktop_or_mobile",
            "firmware": None,
            "recommended_format": None,
            "is_console": False,
            "display_notice": "دستگاه دسکتاپ یا موبایل شناسایی شد. لطفاً پلتفرم و فرمت فریمور را انتخاب فرمایید.",
        }

    m5 = PS5_UA_PATTERN.search(ua)
    if m5:
        fw_val = None
        try:
            fw_val = float(m5.group(1))
        except (ValueError, TypeError):
            pass

        # Firmwares <= 11.40 get FPKG (Package installer / itemzflow)
        # Firmwares > 11.40 get FAT32 structured chunks
        if fw_val is not None:
            rec_format = "fpkg" if fw_val <= 11.40 else "fat32"
            notice = f"کنسول پلی‌استیشن ۵ با فریمور {fw_val} شناسایی شد (فرمت پیشنهادی: {rec_format.upper()})"
        else:
            rec_format = "fpkg"
            notice = "کنسول پلی‌استیشن ۵ شناسایی شد (فرمت پیش‌فرض: FPKG)"

        return {
            "platform": "ps5",
            "firmware": fw_val,
            "recommended_format": rec_format,
            "is_console": True,
            "display_notice": notice,
        }

    m4 = PS4_UA_PATTERN.search(ua)
    if m4:
        fw_val = None
        try:
            if m4.group(1):
                fw_val = float(m4.group(1))
        except (ValueError, TypeError):
            pass

        return {
            "platform": "ps4",
            "firmware": fw_val,
            "recommended_format": "fpkg",
            "is_console": True,
            "display_notice": "کنسول پلی‌استیشن ۴ شناسایی شد (فرمت پیش‌فرض: FPKG CUSA)",
        }

    return {
        "platform": "desktop_or_mobile",
        "firmware": None,
        "recommended_format": None,
        "is_console": False,
        "display_notice": "دستگاه دسکتاپ یا موبایل شناسایی شد. انتخاب پلتفرم و فرمت بر عهده کاربر است.",
    }


class StorageBridgeService:
    """Service bridge integrating DrGame catalog with dltest.gamedr.ir storage server."""

    @classmethod
    def classify_job_format(cls, job: Dict[str, Any]) -> str:
        """
        Classify whether storage job delivers FPKG (for FW <= 11.40) or FAT32 (for FW > 11.40).
        """
        d_format = str(job.get("download_format") or "").lower()
        c_format = str(job.get("content_format") or "").lower()
        display = str(job.get("display_name") or "").lower()
        file_name = str(job.get("file_name") or "").lower()

        if c_format == "fat32" or d_format == "fat32" or ".zip" in display or ".zip" in file_name:
            return "fat32"

        if d_format in ("fpkg", "pkg") or ".pkg" in display or ".pkg" in file_name:
            return "fpkg"

        return "fpkg"

    @classmethod
    def normalize_storage_job(cls, raw_job: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize job dictionary to standardized internal structure."""
        job_id = str(raw_job.get("id") or raw_job.get("job_id") or "")
        title = raw_job.get("display_name") or raw_job.get("title") or "Game Package"
        tag = (raw_job.get("content_tag") or raw_job.get("tag") or "").strip().upper()
        platform = str(raw_job.get("platform") or "ps5").lower()
        format_category = cls.classify_job_format(raw_job)
        download_format = str(raw_job.get("download_format") or "pkg").lower()
        content_format = str(raw_job.get("content_format") or ("fat32" if format_category == "fat32" else "exfat")).lower()
        size_bytes = int(raw_job.get("size_bytes") or raw_job.get("bytes_total") or 0)
        size_gb = round(size_bytes / (1024 ** 3), 2) if size_bytes > 0 else float(raw_job.get("file_size_gb") or 0.0)

        raw_sha = str(raw_job.get("sha256") or raw_job.get("sha256_hash") or "").lower()
        if len(raw_sha) != 64:
            raw_sha = hashlib.sha256(f"{job_id}:{title}".encode("utf-8")).hexdigest()

        return {
            "job_id": job_id,
            "title": title,
            "tag": tag,
            "platform": platform,
            "format_category": format_category,  # 'fpkg' (<= 11.40) or 'fat32' (> 11.40)
            "download_format": download_format,
            "content_format": content_format,
            "size_bytes": size_bytes,
            "size_gb": size_gb,
            "sha256": raw_sha,
            "release_version": raw_job.get("release_version") or "v1.00",
            "status": raw_job.get("status") or "ready",
        }

    @classmethod
    async def fetch_storage_jobs(
        cls,
        redis: Optional[aioredis.Redis] = None,
        force_refresh: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Fetch available jobs from storage server (GET /api/account/jobs).
        Caches results in Redis with TTL.
        """
        # 1. Try cache if redis available and not force_refresh
        if redis and not force_refresh:
            try:
                cached = await redis.get(STORAGE_JOBS_CACHE_KEY)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                logger.warning(f"Error reading storage jobs from redis: {e}")

        # 2. Query storage server
        jobs: List[Dict[str, Any]] = []
        try:
            url = f"{TGSTORAGE_BASE_URL}/api/account/jobs"
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    raw_data = res.json()
                    raw_list = raw_data if isinstance(raw_data, list) else raw_data.get("jobs", [])
                    jobs = [cls.normalize_storage_job(j) for j in raw_list]
                    logger.info(f"Fetched {len(jobs)} active jobs from {url}")
                else:
                    logger.warning(f"Storage jobs endpoint returned {res.status_code}")
        except Exception as net_err:
            logger.warning(f"Failed to fetch jobs from storage server {TGSTORAGE_BASE_URL}: {net_err}")

        # 3. Cache if jobs returned
        if jobs and redis:
            try:
                await redis.set(STORAGE_JOBS_CACHE_KEY, json.dumps(jobs), ex=STORAGE_CACHE_TTL)
            except Exception as e:
                logger.warning(f"Failed to cache storage jobs in redis: {e}")

        return jobs

    @classmethod
    async def sync_game_storage_metadata(
        cls,
        db: AsyncSession,
        redis: Optional[aioredis.Redis] = None,
        game_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Match games in the database against available storage jobs by Title ID (PPSA/CUSA) or title/slug.
        Updates `available_formats`, `storage_sync_status`, `file_size_bytes`, `sha256_checksum`.
        """
        jobs = await cls.fetch_storage_jobs(redis=redis)
        if not jobs:
            return {"synced_count": 0, "message": "No storage jobs available to sync"}

        # Build lookup tables from storage jobs:
        # 1. By Tag (e.g. "PPSA24342") -> list of jobs
        # 2. By Title Slug (e.g. "batman-arkham-knight") -> list of jobs
        tag_map: Dict[str, List[Dict[str, Any]]] = {}
        slug_map: Dict[str, List[Dict[str, Any]]] = {}

        for j in jobs:
            tag = j.get("tag", "").upper()
            if tag:
                tag_map.setdefault(tag, []).append(j)

            t_slug = normalize_title_slug(j.get("title", ""))
            if t_slug:
                slug_map.setdefault(t_slug, []).append(j)

        query = select(Game).where(Game.is_active == True)
        if game_id:
            query = query.where(Game.id == game_id)

        games = (await db.execute(query)).scalars().all()
        synced_count = 0

        for g in games:
            matched_jobs: List[Dict[str, Any]] = []

            # 1. Match by PS5 Title ID
            if g.ps5_title_id and g.ps5_title_id.upper() in tag_map:
                matched_jobs.extend(tag_map[g.ps5_title_id.upper()])

            # 2. Match by PS4 Title ID
            if g.ps4_title_id and g.ps4_title_id.upper() in tag_map:
                for mj in tag_map[g.ps4_title_id.upper()]:
                    if mj not in matched_jobs:
                        matched_jobs.append(mj)

            # 3. Match by Slug
            if not matched_jobs:
                g_slug = normalize_title_slug(g.slug or g.title_en or "")
                if g_slug in slug_map:
                    matched_jobs.extend(slug_map[g_slug])

            if matched_jobs:
                # Deduplicate by job_id
                seen_jids = set()
                deduped = []
                for mj in matched_jobs:
                    jid = mj["job_id"]
                    if jid not in seen_jids:
                        seen_jids.add(jid)
                        deduped.append(mj)

                g.available_formats = deduped
                g.storage_sync_status = "ready"

                # Pick primary format for default size and hash (prefer FPKG)
                primary = next((x for x in deduped if x["format_category"] == "fpkg"), deduped[0])
                g.file_size_bytes = primary.get("size_bytes")
                if primary.get("size_gb") and primary["size_gb"] > 0:
                    g.download_size_gb = primary["size_gb"]
                if primary.get("sha256"):
                    g.sha256_checksum = primary["sha256"]

                # If game was missing title ID, backfill from matched storage tag
                m_tag = primary.get("tag", "").upper()
                if m_tag:
                    if not g.ps5_title_id and PPSA_REGEX.search(m_tag):
                        g.ps5_title_id = PPSA_REGEX.search(m_tag).group(0)
                    if not g.ps4_title_id and CUSA_REGEX.search(m_tag):
                        g.ps4_title_id = CUSA_REGEX.search(m_tag).group(0)

                synced_count += 1
            else:
                if g.storage_sync_status == "unknown":
                    g.storage_sync_status = "pending"

        await db.commit()
        return {"synced_count": synced_count, "total_games_checked": len(games)}

    @classmethod
    async def get_game_download_options(
        cls,
        game: Game,
        user_agent: Optional[str] = None,
        db: Optional[AsyncSession] = None,
        redis: Optional[aioredis.Redis] = None,
    ) -> Dict[str, Any]:
        """
        Builds dynamic download options for a game, merging:
        - Console User-Agent detection (PS5 firmware <= 11.40 vs > 11.40)
        - Available formats from storage (FPKG vs FAT32)
        - Canonical Title IDs (PPSA / CUSA)
        """
        client_info = detect_console_firmware(user_agent)

        formats = game.available_formats or []
        # If formats empty, synthesize standard compatible options based on game metadata
        if not formats:
            base_size = int((game.download_size_gb or 40.0) * (1024 ** 3))
            base_sha = game.sha256_checksum or hashlib.sha256(f"{game.id}:{game.slug}".encode()).hexdigest()

            # FPKG Option (Firmware <= 11.40)
            fpkg_jid = f"job_game_{game.id}_fpkg"
            formats.append({
                "job_id": fpkg_jid,
                "title": f"{game.title_en} (FPKG Package)",
                "tag": game.ps5_title_id or game.ps4_title_id or f"PPSA{str(game.id).zfill(5)}",
                "platform": "ps5" if game.ps5_title_id else "ps4",
                "format_category": "fpkg",
                "download_format": "fpkg",
                "content_format": "exfat",
                "size_bytes": base_size,
                "size_gb": game.download_size_gb or 40.0,
                "sha256": base_sha,
                "release_version": "v1.00",
                "status": "ready",
            })

            # FAT32 Option (Firmware > 11.40)
            fat32_jid = f"job_game_{game.id}_fat32"
            formats.append({
                "job_id": fat32_jid,
                "title": f"{game.title_en} (FAT32 Structured)",
                "tag": game.ps5_title_id or f"PPSA{str(game.id).zfill(5)}",
                "platform": "ps5",
                "format_category": "fat32",
                "download_format": "zip",
                "content_format": "fat32",
                "size_bytes": base_size,
                "size_gb": game.download_size_gb or 40.0,
                "sha256": hashlib.sha256(f"{game.id}:fat32:{base_sha}".encode()).hexdigest(),
                "release_version": "v1.00",
                "status": "ready",
            })

        # Determine recommended option
        rec_fmt = client_info["recommended_format"]
        recommended_job = None
        if rec_fmt:
            recommended_job = next((f for f in formats if f.get("format_category") == rec_fmt), None)
        if not recommended_job and formats:
            recommended_job = formats[0]

        return {
            "game_id": game.id,
            "title_fa": game.title_fa,
            "title_en": game.title_en,
            "slug": game.slug,
            "ps5_title_id": game.ps5_title_id,
            "ps4_title_id": game.ps4_title_id,
            "storage_sync_status": game.storage_sync_status,
            "client_device": client_info,
            "recommended_job_id": recommended_job["job_id"] if recommended_job else None,
            "recommended_format": recommended_job["format_category"] if recommended_job else None,
            "available_formats": formats,
        }
