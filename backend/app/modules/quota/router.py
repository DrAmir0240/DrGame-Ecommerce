from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.modules.quota.schemas import QuotaStatusOut
from app.modules.quota.services import QuotaService
from app.modules.users.models import User

router = APIRouter(prefix="/quota", tags=["Quota Engine"])


@router.get("/status", response_model=QuotaStatusOut)
async def get_quota_status(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await QuotaService.get_user_quota_status(db, user)
