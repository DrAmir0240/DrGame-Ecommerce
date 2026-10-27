"""Quota router: personal quota status and secure external download webhook."""
from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.quota.schemas import (
    UserQuotaOut,
    QuotaCallbackRequest,
    QuotaCallbackResponse,
)
from app.modules.quota.services import QuotaService

router = APIRouter(tags=["Quota"])

@router.get("/me", response_model=UserQuotaOut, status_code=status.HTTP_200_OK)
async def get_my_quota(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Retrieve active quota status for currently authenticated user."""
    data = await QuotaService.get_user_quota(db, redis, current_user.id)
    return UserQuotaOut(**data)

@router.post("/callback/consume", response_model=QuotaCallbackResponse, status_code=status.HTTP_200_OK)
async def consume_quota_callback(
    payload: QuotaCallbackRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """
    Webhook endpoint invoked by download server/proxy with HMAC-SHA256 signature.
    Deducts actual transferred bytes from user quota and registers consumption log.
    """
    res = await QuotaService.consume_quota_from_webhook(
        db=db,
        redis=redis,
        user_id=payload.user_id,
        game_id=payload.game_id,
        bytes_downloaded=payload.bytes_downloaded,
        download_server_id=payload.download_server_id,
        signature=payload.signature
    )
    return QuotaCallbackResponse(**res)
