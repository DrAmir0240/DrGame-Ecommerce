from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.subscriptions.schemas import SubscriptionTierOut
from app.modules.subscriptions.services import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions & Tiers"])


@router.get("/tiers", response_model=List[SubscriptionTierOut])
async def get_tiers(db: AsyncSession = Depends(get_db)):
    return await SubscriptionService.get_all_tiers(db)
