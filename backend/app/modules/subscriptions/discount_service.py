"""User-bound discount engine, bulk promo assignment, and checkout integration."""
from datetime import datetime, timedelta, timezone
from typing import Any
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, BadRequestError
from app.modules.subscriptions.models import UserDiscount
from app.modules.users.models import User


class UserDiscountService:
    @staticmethod
    async def create_bulk_user_discounts(
        db: AsyncSession,
        user_ids: list[int],
        discount_percent: int,
        duration_days: int,
        title: str,
        applicable_tier_codes: list[str] | None = None,
        max_discount_toman: int | None = None,
        admin_id: int | None = None,
    ) -> list[UserDiscount]:
        """
        Assign user-bound promotion discounts to multiple users simultaneously.
        """
        if not user_ids:
            raise BadRequestError("حداقل یک کاربر باید برای اعطای تخفیف انتخاب شود.")

        if not (1 <= discount_percent <= 100):
            raise BadRequestError("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.")

        if duration_days < 1:
            raise BadRequestError("مدت اعتبار تخفیف باید حداقل ۱ روز باشد.")

        # Validate existence of users
        users_stmt = select(User.id).where(User.id.in_(user_ids))
        valid_user_ids = set((await db.execute(users_stmt)).scalars().all())

        if not valid_user_ids:
            raise BadRequestError("هیچ کاربر معتبری از شناسه‌های ارسال‌شده یافت نشد.")

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=duration_days)

        created_discounts: list[UserDiscount] = []
        for uid in valid_user_ids:
            discount = UserDiscount(
                user_id=uid,
                title=title or f"تخفیف ویژه {discount_percent}٪ اشتراک",
                discount_percent=discount_percent,
                max_discount_toman=max_discount_toman,
                applicable_tier_codes=applicable_tier_codes or [],
                starts_at=now,
                expires_at=expires_at,
                is_used=False,
                is_active=True,
                created_by_admin_id=admin_id,
                created_at=now,
            )
            db.add(discount)
            created_discounts.append(discount)

        await db.commit()
        for d in created_discounts:
            await db.refresh(d)

        return created_discounts

    @staticmethod
    async def get_active_user_discount(
        db: AsyncSession,
        user_id: int,
        tier_code: str | None = None,
    ) -> UserDiscount | None:
        """
        Fetch the active, valid, unconsumed user discount with the highest percentage.
        """
        now = datetime.now(timezone.utc)
        stmt = (
            select(UserDiscount)
            .where(
                UserDiscount.user_id == user_id,
                UserDiscount.is_active == True,
                UserDiscount.is_used == False,
                UserDiscount.starts_at <= now,
                UserDiscount.expires_at > now,
            )
            .order_by(desc(UserDiscount.discount_percent), UserDiscount.expires_at.asc())
        )
        candidates = (await db.execute(stmt)).scalars().all()

        for d in candidates:
            # Check tier applicability
            if tier_code and d.applicable_tier_codes:
                if tier_code not in d.applicable_tier_codes:
                    continue
            return d

        return None

    @staticmethod
    async def consume_user_discount(
        db: AsyncSession,
        discount_id: int,
        order_payment_id: int,
    ) -> None:
        """Mark user discount as consumed by an order payment."""
        stmt = select(UserDiscount).where(UserDiscount.id == discount_id)
        discount = (await db.execute(stmt)).scalar_one_or_none()
        if discount:
            discount.is_used = True
            discount.used_at = datetime.now(timezone.utc)
            discount.order_payment_id = order_payment_id
            await db.commit()

    @staticmethod
    async def list_user_discounts(
        db: AsyncSession,
        user_id: int | None = None,
        is_active: bool | None = None,
        is_used: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """List user-bound discounts for admin management."""
        offset = (page - 1) * page_size
        query = select(UserDiscount, User.username, User.full_name).join(
            User, UserDiscount.user_id == User.id, isouter=True
        )

        if user_id:
            query = query.where(UserDiscount.user_id == user_id)
        if is_active is not None:
            query = query.where(UserDiscount.is_active == is_active)
        if is_used is not None:
            query = query.where(UserDiscount.is_used == is_used)

        total_stmt = select(func.count(UserDiscount.id))
        if user_id:
            total_stmt = total_stmt.where(UserDiscount.user_id == user_id)
        if is_active is not None:
            total_stmt = total_stmt.where(UserDiscount.is_active == is_active)
        if is_used is not None:
            total_stmt = total_stmt.where(UserDiscount.is_used == is_used)

        total = (await db.execute(total_stmt)).scalar() or 0

        rows = (
            await db.execute(
                query.order_by(desc(UserDiscount.created_at)).offset(offset).limit(page_size)
            )
        ).all()

        items = []
        for d, uname, fname in rows:
            items.append(
                {
                    "id": d.id,
                    "user_id": d.user_id,
                    "username": uname or f"user_{d.user_id}",
                    "full_name": fname or "",
                    "title": d.title,
                    "discount_percent": d.discount_percent,
                    "max_discount_toman": d.max_discount_toman,
                    "applicable_tier_codes": d.applicable_tier_codes or [],
                    "starts_at": d.starts_at,
                    "expires_at": d.expires_at,
                    "is_used": d.is_used,
                    "used_at": d.used_at,
                    "order_payment_id": d.order_payment_id,
                    "is_active": d.is_active,
                    "created_at": d.created_at,
                }
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def cancel_user_discount(db: AsyncSession, discount_id: int) -> dict[str, Any]:
        """Cancel or deactivate an unconsumed user discount."""
        stmt = select(UserDiscount).where(UserDiscount.id == discount_id)
        discount = (await db.execute(stmt)).scalar_one_or_none()
        if not discount:
            raise NotFoundError("تخفیف کاربر مورد نظر یافت نشد.")

        discount.is_active = False
        await db.commit()
        return {"status": "success", "message": "تخفیف کاربر با موفقیت غیرفعال شد."}
