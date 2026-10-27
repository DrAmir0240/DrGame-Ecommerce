"""RAWG synchronization trigger router."""
from typing import Annotated
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.modules.auth.schemas import MessageResponse
from app.modules.rawg_sync.services import RawgSyncService

router = APIRouter(tags=["RAWG Sync"])

@router.post("/sync", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def trigger_sync(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    count: int = Query(50, ge=1, le=500, description="Target number of games to sync"),
):
    """Trigger manual synchronization of games and genres from RAWG."""
    sync_service = RawgSyncService()
    saved = await sync_service.seed_games(db, redis, target_count=count)
    return MessageResponse(
        message=f"همگام‌سازی با موفقیت انجام شد. تعداد {saved} بازی در پایگاه داده ثبت/به‌روزرسانی گردید."
    )
