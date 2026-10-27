"""Subscription management, discount validation, checkout processing, and 30-day lifecycle."""
from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.exceptions import NotFoundError, BadRequestError
from app.modules.subscriptions.models import (
    SubscriptionTier,
    UserSubscription,
    DiscountCode,
    OrderPayment,
)
from app.modules.quota.services import QuotaService

DEFAULT_TIERS = [
    {
        "code": "free",
        "name_fa": "اشتراک رایگان (دمو)",
        "name_en": "Free Tier",
        "price_toman": 0,
        "price_usd": 0.0,
        "quota_gb": 0,
        "speed_limit_mbps": 20,
        "allowed_platforms": ["PS4", "PS5"],
        "allow_dlc": False,
        "allow_subtitles": False,
        "allow_themes": False,
    },
    {
        "code": "bronze",
        "name_fa": "اشتراک برنز",
        "name_en": "Bronze Tier",
        "price_toman": 700000,
        "price_usd": 10.0,
        "quota_gb": 500,
        "speed_limit_mbps": 60,
        "allowed_platforms": ["PS4", "PS5"],
        "allow_dlc": False,
        "allow_subtitles": False,
        "allow_themes": False,
    },
    {
        "code": "silver",
        "name_fa": "اشتراک نقره‌ای",
        "name_en": "Silver Tier",
        "price_toman": 1500000,
        "price_usd": 22.0,
        "quota_gb": 1000,
        "speed_limit_mbps": 120,
        "allowed_platforms": ["PS3", "PS4", "PS5"],
        "allow_dlc": True,
        "allow_subtitles": True,
        "allow_themes": False,
    },
    {
        "code": "gold",
        "name_fa": "اشتراک طلایی (VIP)",
        "name_en": "Gold Tier",
        "price_toman": 3000000,
        "price_usd": 45.0,
        "quota_gb": 2200,
        "speed_limit_mbps": 300,
        "allowed_platforms": ["PS1", "PS2", "PS3", "PS4", "PS5", "Xbox", "Switch"],
        "allow_dlc": True,
        "allow_subtitles": True,
        "allow_themes": True,
    },
]

DURATION_CONFIG = {
    1: {"name": "۱ ماهه", "months": 1, "days": 30, "multiplier": 1.0, "discount_percent": 0},
    3: {"name": "۳ ماهه", "months": 3, "days": 90, "multiplier": 2.7, "discount_percent": 10},
    6: {"name": "۶ ماهه", "months": 6, "days": 180, "multiplier": 4.8, "discount_percent": 20},
}

class SubscriptionService:

    @staticmethod
    async def seed_tiers(db: AsyncSession) -> None:
        """Seed default 4 tiers if they do not exist."""
        for t_data in DEFAULT_TIERS:
            existing = await db.scalar(
                select(SubscriptionTier).where(SubscriptionTier.code == t_data["code"])
            )
            if not existing:
                tier = SubscriptionTier(**t_data)
                db.add(tier)
        await db.commit()

    @staticmethod
    async def get_all_tiers(db: AsyncSession) -> list[SubscriptionTier]:
        """Fetch all active tiers with 1, 3, and 6 month pricing duration breakdowns."""
        await SubscriptionService.seed_tiers(db)
        stmt = select(SubscriptionTier).where(SubscriptionTier.is_active == True).order_by(SubscriptionTier.price_toman.asc())
        result = await db.execute(stmt)
        tiers = list(result.scalars().all())

        for t in tiers:
            durations = {}
            for m, cfg in DURATION_CONFIG.items():
                durations[f"{m}_month" if m == 1 else f"{m}_months"] = {
                    "months": m,
                    "days": cfg["days"],
                    "price_toman": int(t.price_toman * cfg["multiplier"]),
                    "quota_gb": int(t.quota_gb * m),
                    "discount_percent": cfg["discount_percent"],
                }
            setattr(t, "durations", durations)

        return tiers

    @staticmethod
    async def get_user_active_subscription(db: AsyncSession, user_id: int) -> UserSubscription | None:
        """Fetch currently active subscription for user."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(UserSubscription)
            .where(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active",
                UserSubscription.end_date > now
            )
            .order_by(UserSubscription.end_date.desc())
        )
        return await db.scalar(stmt)

    @staticmethod
    async def validate_discount_code(
        db: AsyncSession,
        code: str,
        original_price: int
    ) -> dict:
        """Validate discount code and calculate discount amount."""
        clean_code = code.strip().upper()
        discount = await db.scalar(
            select(DiscountCode).where(
                DiscountCode.code == clean_code,
                DiscountCode.is_active == True
            )
        )
        if not discount:
            raise BadRequestError("کد تخفیف نامعتبر است.")

        now = datetime.now(timezone.utc)
        if discount.expires_at and discount.expires_at < now:
            raise BadRequestError("مهلت استفاده از این کد تخفیف به پایان رسیده است.")

        if discount.used_count >= discount.usage_limit:
            raise BadRequestError("تعداد دفعات استفاده از این کد تخفیف تکمیل شده است.")

        discount_amount = 0
        if discount.discount_percent > 0:
            calc = int(original_price * (discount.discount_percent / 100))
            if discount.max_discount_toman:
                calc = min(calc, discount.max_discount_toman)
            discount_amount = calc
        elif discount.fixed_discount_toman > 0:
            discount_amount = min(discount.fixed_discount_toman, original_price)

        final_price = max(0, original_price - discount_amount)

        return {
            "valid": True,
            "code": clean_code,
            "discount_amount": discount_amount,
            "final_price": final_price
        }

    @staticmethod
    async def process_checkout(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int,
        tier_code: str,
        duration_months: int = 1,
        discount_code: str | None = None,
        payment_method: str = "simulation"
    ) -> dict:
        """Process checkout for 1, 3, or 6 months subscription, register and charge quota."""
        if duration_months not in (1, 3, 6):
            raise BadRequestError("دوره اشتراک انتخابی نامعتبر است (تنها ۱، ۳ یا ۶ ماهه مجاز می‌باشد).")

        cfg = DURATION_CONFIG[duration_months]

        tier = await db.scalar(
            select(SubscriptionTier).where(SubscriptionTier.code == tier_code, SubscriptionTier.is_active == True)
        )
        if not tier:
            await SubscriptionService.seed_tiers(db)
            tier = await db.scalar(
                select(SubscriptionTier).where(SubscriptionTier.code == tier_code, SubscriptionTier.is_active == True)
            )

        if not tier:
            raise NotFoundError("پلن اشتراک انتخابی معتبر نیست.")

        original_price = int(tier.price_toman * cfg["multiplier"])
        quota_to_add = int(tier.quota_gb * duration_months)
        discount_amount = 0
        used_code = None

        if discount_code and original_price > 0:
            disc_res = await SubscriptionService.validate_discount_code(db, discount_code, original_price)
            discount_amount = disc_res["discount_amount"]
            used_code = disc_res["code"]

            dc_record = await db.scalar(select(DiscountCode).where(DiscountCode.code == used_code))
            if dc_record:
                dc_record.used_count += 1

        final_price = max(0, original_price - discount_amount)
        tx_ref = f"DRG-{uuid.uuid4().hex[:10].upper()}"

        payment = OrderPayment(
            user_id=user_id,
            tier_code=tier.code,
            original_price=original_price,
            discount_amount=discount_amount,
            final_price=final_price,
            discount_code_used=used_code,
            payment_method=payment_method,
            transaction_ref=tx_ref,
            status="paid"
        )
        db.add(payment)
        await db.flush()

        now = datetime.now(timezone.utc)
        end_date = now + timedelta(days=cfg["days"])

        # Deactivate existing active subscriptions
        existing_subs = (
            await db.execute(
                select(UserSubscription).where(
                    UserSubscription.user_id == user_id,
                    UserSubscription.status == "active"
                )
            )
        ).scalars().all()
        for sub in existing_subs:
            sub.status = "superseded"

        new_sub = UserSubscription(
            user_id=user_id,
            tier_code=tier.code,
            start_date=now,
            end_date=end_date,
            status="active",
            payment_id=payment.id
        )
        db.add(new_sub)
        await db.commit()
        await db.refresh(new_sub)

        # Charge quota if non-free
        if quota_to_add > 0:
            await QuotaService.charge_user_quota(db, redis, user_id, float(quota_to_add))

        # Trigger referral commission waterfall if payment was made
        if payment.final_price > 0:
            try:
                from app.modules.wallet.services import WalletService
                await WalletService.process_commission_waterfall(db, payment)
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("Commission waterfall error: %s", e)

        quota_status = await QuotaService.get_user_quota(db, redis, user_id)

        return {
            "status": "success",
            "transaction_ref": tx_ref,
            "tier_code": tier.code,
            "tier_name": tier.name_fa,
            "duration_months": duration_months,
            "end_date": end_date.isoformat(),
            "quota": quota_status
        }

    @staticmethod
    async def get_free_tier_games(db: AsyncSession) -> list[int]:
        """Fetch all active game IDs allowed in free tier."""
        from app.modules.subscriptions.models import FreeTierAllowedGame
        stmt = select(FreeTierAllowedGame.game_id).where(FreeTierAllowedGame.is_active == True)
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def is_game_allowed_in_free_tier(db: AsyncSession, game_id: int) -> bool:
        """Check if a specific game is accessible under the free tier."""
        from app.modules.subscriptions.models import FreeTierAllowedGame
        stmt = select(FreeTierAllowedGame).where(
            FreeTierAllowedGame.game_id == game_id,
            FreeTierAllowedGame.is_active == True,
        )
        return (await db.execute(stmt)).scalar_one_or_none() is not None

    @staticmethod
    async def set_free_tier_games(db: AsyncSession, game_ids: list[int]) -> list[int]:
        """Update allowed free tier games dynamically (maximum 5 games)."""
        from app.modules.subscriptions.models import FreeTierAllowedGame
        from app.modules.games.models import Game

        valid_games_stmt = select(Game.id).where(Game.id.in_(game_ids[:5]))
        valid_ids = list((await db.execute(valid_games_stmt)).scalars().all())

        # Clean existing entries
        existing = list((await db.execute(select(FreeTierAllowedGame))).scalars().all())
        for row in existing:
            await db.delete(row)
        await db.flush()

        for gid in valid_ids:
            db.add(FreeTierAllowedGame(game_id=gid, is_active=True))

        await db.commit()
        return valid_ids

