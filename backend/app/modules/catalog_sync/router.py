"""FastAPI router for catalog synchronization in Content Admin department."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.admin_dependencies import require_content_admin
from app.modules.admin.models import ContentAdmin
from app.modules.catalog_sync.schemas import (
    CatalogSyncRequest,
    CatalogSyncResponse,
    CatalogSyncJobResponse,
    CatalogProgressResponse,
    CatalogWipeResponse,
)
from app.modules.catalog_sync.services import CatalogSyncService

router = APIRouter(prefix="/api/admin-content/catalog", tags=["Admin: Catalog Synchronization"])


@router.post("/sync", response_model=CatalogSyncResponse, status_code=status.HTTP_200_OK)
async def sync_catalog_games(
    payload: CatalogSyncRequest,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    admin: ContentAdmin = Depends(require_content_admin()),
):
    """Trigger ingestion and upsert of games from external provider based on requested filters."""
    service = CatalogSyncService()
    try:
        result = await service.sync_catalog(db, redis, payload)
        return CatalogSyncResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در همگام‌سازی کاتالوگ: {str(e)}",
        )


@router.get("/progress/{job_id}", response_model=CatalogProgressResponse, status_code=status.HTTP_200_OK)
async def get_sync_progress(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    admin: ContentAdmin = Depends(require_content_admin()),
):
    """Retrieve real-time progress for a given job ID or 'latest'."""
    service = CatalogSyncService()
    progress = await service.get_sync_progress(job_id, db)
    return CatalogProgressResponse(**progress)


@router.get("/history", response_model=List[CatalogSyncJobResponse], status_code=status.HTTP_200_OK)
async def get_sync_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: ContentAdmin = Depends(require_content_admin()),
):
    """Retrieve history of past catalog synchronization jobs."""
    service = CatalogSyncService()
    jobs = await service.get_jobs_history(db, limit=limit)
    return [
        CatalogSyncJobResponse(
            id=j.id,
            status=j.status,
            platforms=j.platforms or [],
            date_from=j.date_from,
            date_to=j.date_to,
            min_rating=j.min_rating or 0.0,
            sort_by=j.sort_by,
            requested_count=j.requested_count,
            imported_count=j.imported_count,
            updated_count=j.updated_count,
            error_message=j.error_message,
            created_at=j.created_at,
            completed_at=j.completed_at,
        )
        for j in jobs
    ]


@router.delete("/wipe", response_model=CatalogWipeResponse, status_code=status.HTTP_200_OK)
async def wipe_catalog_games(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
    admin: ContentAdmin = Depends(require_content_admin()),
):
    """Completely wipe all existing games and dependent records from database."""
    service = CatalogSyncService()
    try:
        deleted_count = await service.wipe_catalog(db, redis)
        return CatalogWipeResponse(
            success=True,
            deleted_games_count=deleted_count,
            message=f"کاتالوگ بازی‌ها به طور کامل پاک‌سازی شد. تعداد {deleted_count} بازی حذف گردید.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطا در پاک‌سازی کاتالوگ: {str(e)}",
        )
