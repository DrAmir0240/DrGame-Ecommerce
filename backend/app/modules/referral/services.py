from decimal import Decimal
import random
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.referral.models import ReferralPayout
from app.modules.referral.schemas import PayoutRequestOut, ReferralSummaryOut
from app.modules.users.models import User, UserProfile


class ReferralService:
    @staticmethod
    async def get_summary(db: AsyncSession, user: Optional[User]) -> ReferralSummaryOut:
        user_id = user.id if user else 1
        invite_code = f"DG-USER{user_id}"

        # Fetch wallet balance if available
        res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        prof = res.scalar_one_or_none()
        balance = int(prof.wallet_balance) if prof and prof.wallet_balance else 2450000

        return ReferralSummaryOut(
            invite_code=invite_code,
            withdrawable_balance=balance,
            pending_balance=780000,
            total_invited=18,
            commission_rate_percent=21.0,
        )

    @staticmethod
    async def create_payout_request(
        db: AsyncSession,
        user: Optional[User],
        iban: str,
        account_holder: str,
        amount: int,
    ) -> PayoutRequestOut:
        user_id = user.id if user else 1
        tracking_id = f"STL-{random.randint(1000, 9999)}"

        payout = ReferralPayout(
            user_id=user_id,
            tracking_id=tracking_id,
            iban=iban,
            account_holder=account_holder,
            amount=Decimal(amount),
            status="PENDING",
        )
        db.add(payout)
        await db.commit()

        return PayoutRequestOut(
            success=True,
            tracking_id=tracking_id,
            amount=amount,
            status="PENDING",
            message="درخواست تسویه با موفقیت در کارتابل پرداخت ثبت شد.",
        )
