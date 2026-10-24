from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.modules.referral.schemas import PayoutRequestIn, PayoutRequestOut, ReferralSummaryOut
from app.modules.referral.services import ReferralService
from app.modules.users.models import User

router = APIRouter(prefix="/referral", tags=["Referral & Affiliate Ledger"])


@router.get("/summary", response_model=ReferralSummaryOut)
async def get_referral_summary(
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await ReferralService.get_summary(db, user)


@router.post("/payout-request", response_model=PayoutRequestOut)
async def request_payout(
    body: PayoutRequestIn,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    return await ReferralService.create_payout_request(
        db=db,
        user=user,
        iban=body.iban,
        account_holder=body.account_holder,
        amount=body.amount,
    )
