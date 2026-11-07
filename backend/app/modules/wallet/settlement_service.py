"""Weekly settlement service, commission aggregation, and network pedigree analytics."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, BadRequestException
from app.modules.wallet.models import (
    UserWallet,
    ReferralChain,
    CommissionLedger,
    SettlementBatch,
)
from app.modules.users.models import User
from app.modules.subscriptions.models import UserSubscription


def mask_username(username: str | None) -> str:
    """Mask username for privacy (e.g. 'johndoe' -> 'joh***oe')."""
    if not username:
        return "کاربر***"
    if len(username) <= 3:
        return f"{username[0]}***"
    return f"{username[:3]}***{username[-2:] if len(username) > 5 else ''}"


def mask_phone(phone: str | None) -> str | None:
    """Mask phone for privacy (e.g. '09123456789' -> '0912***6789')."""
    if not phone or len(phone) < 7:
        return None
    return f"{phone[:4]}***{phone[-4:]}"


def calculate_next_settlement_date() -> datetime:
    """Calculate the next Friday 23:59:59 UTC settlement cycle target."""
    now = datetime.now(timezone.utc)
    # Friday is weekday 4
    days_ahead = (4 - now.weekday()) % 7
    if days_ahead == 0 and (now.hour > 23 or (now.hour == 23 and now.minute >= 59)):
        days_ahead = 7
    target = now + timedelta(days=days_ahead)
    return target.replace(hour=23, minute=59, second=59, microsecond=0)


class WeeklySettlementService:
    @staticmethod
    async def preview_weekly_settlement(db: AsyncSession) -> dict[str, Any]:
        """
        Inspect all currently pending commissions and provide a preview summary
        without modifying wallet balances or ledger state.
        """
        # Select all pending user commissions
        stmt = (
            select(
                CommissionLedger.user_id,
                func.sum(CommissionLedger.amount_toman).label("total_pending"),
                func.count(CommissionLedger.id).label("tx_count"),
            )
            .where(
                CommissionLedger.settlement_status == "pending",
                CommissionLedger.beneficiary_type == "user",
                CommissionLedger.user_id.is_not(None),
            )
            .group_by(CommissionLedger.user_id)
        )
        rows = (await db.execute(stmt)).all()

        total_pending_amount = 0
        total_tx_count = 0
        beneficiaries = []

        if rows:
            user_ids = [r.user_id for r in rows]
            users_stmt = select(User.id, User.username, User.full_name).where(User.id.in_(user_ids))
            users_map = {u.id: u for u in (await db.execute(users_stmt)).all()}

            for r in rows:
                user_info = users_map.get(r.user_id)
                pending_toman = int(r.total_pending or 0)
                tx_c = int(r.tx_count or 0)
                total_pending_amount += pending_toman
                total_tx_count += tx_c

                beneficiaries.append(
                    {
                        "user_id": r.user_id,
                        "username": user_info.username if user_info else f"user_{r.user_id}",
                        "full_name": user_info.full_name if user_info else "",
                        "pending_amount_toman": pending_toman,
                        "transactions_count": tx_c,
                    }
                )

        now = datetime.now(timezone.utc)
        return {
            "total_pending_amount_toman": total_pending_amount,
            "total_pending_transactions": total_tx_count,
            "total_beneficiaries": len(beneficiaries),
            "beneficiaries": beneficiaries,
            "period_end": now,
        }

    @staticmethod
    async def execute_weekly_settlement(
        db: AsyncSession,
        executed_by_admin_id: int | None = None,
        executed_by_type: str = "admin",
    ) -> dict[str, Any]:
        """
        Atomically settle all pending user commissions:
        - Transfer pending_balance_toman to withdrawable_balance_toman
        - Update commission ledger status to 'settled'
        - Create a persistent SettlementBatch record
        """
        now = datetime.now(timezone.utc)
        batch_code = f"SETTLE-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

        # Fetch all pending ledgers
        ledgers_stmt = (
            select(CommissionLedger)
            .where(
                CommissionLedger.settlement_status == "pending",
                CommissionLedger.beneficiary_type == "user",
                CommissionLedger.user_id.is_not(None),
            )
            .with_for_update()
        )
        ledgers = (await db.execute(ledgers_stmt)).scalars().all()

        if not ledgers:
            return {
                "status": "empty",
                "message": "تراکنش معوقه‌ای برای تسویه هفتگی یافت نشد.",
                "settled_amount_toman": 0,
                "transactions_count": 0,
                "beneficiaries_count": 0,
                "batch_code": None,
            }

        # Group by user_id
        user_sums: dict[int, int] = {}
        earliest_time = now
        for l in ledgers:
            user_sums[l.user_id] = user_sums.get(l.user_id, 0) + l.amount_toman
            l_time = l.created_at
            if l_time.tzinfo is None:
                l_time = l_time.replace(tzinfo=timezone.utc)
            if l_time < earliest_time:
                earliest_time = l_time

        # Update wallets
        for user_id, amount in user_sums.items():
            wallet_stmt = select(UserWallet).where(UserWallet.user_id == user_id).with_for_update()
            wallet = (await db.execute(wallet_stmt)).scalar_one_or_none()
            if not wallet:
                wallet = UserWallet(
                    user_id=user_id,
                    withdrawable_balance_toman=0,
                    pending_balance_toman=0,
                    total_earned_toman=0,
                    total_withdrawn_toman=0,
                )
                db.add(wallet)
                await db.flush()

            wallet.withdrawable_balance_toman += amount
            wallet.total_earned_toman += amount
            wallet.pending_balance_toman = max(0, wallet.pending_balance_toman - amount)

        # Update ledgers
        total_settled_amount = sum(user_sums.values())
        for l in ledgers:
            l.settlement_status = "settled"
            l.settled_at = now
            l.settlement_batch_id = batch_code

        # Create batch record
        batch = SettlementBatch(
            batch_code=batch_code,
            total_amount_toman=total_settled_amount,
            total_transactions_count=len(ledgers),
            beneficiaries_count=len(user_sums),
            executed_by_type=executed_by_type,
            executed_by_admin_id=executed_by_admin_id,
            period_start=earliest_time,
            period_end=now,
            created_at=now,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        return {
            "status": "success",
            "message": f"تسویه هفتگی با موفقیت انجام شد. کد بچ: {batch_code}",
            "batch_code": batch.batch_code,
            "settled_amount_toman": batch.total_amount_toman,
            "transactions_count": batch.total_transactions_count,
            "beneficiaries_count": batch.beneficiaries_count,
            "executed_by_type": batch.executed_by_type,
            "executed_at": batch.created_at.isoformat(),
        }

    @staticmethod
    async def get_settlement_history(
        db: AsyncSession, page: int = 1, page_size: int = 20
    ) -> dict[str, Any]:
        """Fetch paginated settlement batches."""
        offset = (page - 1) * page_size
        stmt = select(SettlementBatch).order_by(desc(SettlementBatch.created_at)).offset(offset).limit(page_size)
        items = (await db.execute(stmt)).scalars().all()

        count_stmt = select(func.count(SettlementBatch.id))
        total = (await db.execute(count_stmt)).scalar() or 0

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def get_batch_details(db: AsyncSession, batch_code: str) -> dict[str, Any]:
        """Fetch details of a single settlement batch and its ledger entries."""
        batch_stmt = select(SettlementBatch).where(SettlementBatch.batch_code == batch_code)
        batch = (await db.execute(batch_stmt)).scalar_one_or_none()
        if not batch:
            raise NotFoundException("بچ تسویه مورد نظر یافت نشد.")

        ledgers_stmt = (
            select(CommissionLedger)
            .where(CommissionLedger.settlement_batch_id == batch_code)
            .order_by(desc(CommissionLedger.amount_toman))
        )
        ledgers = (await db.execute(ledgers_stmt)).scalars().all()

        return {
            "batch": batch,
            "ledgers": ledgers,
        }

    @staticmethod
    async def get_user_network_tree(db: AsyncSession, user_id: int) -> dict[str, Any]:
        """
        Analyze multi-tier network downlines for user using recursive traversal:
        Layer 1: 50% commission fraction (10.5% of order)
        Layer 2: 25% commission fraction (5.25% of order)
        Layer 3: 12.5% commission fraction (2.625% of order)
        Layer 4: 6.25% commission fraction (1.3125% of order)
        Layer 5+: halving cascade
        """
        # Recursive CTE for downlines
        sql_downlines = text(
            """
            WITH RECURSIVE downlines AS (
                SELECT user_id, 1 AS level
                FROM referral_chains
                WHERE referrer_id = :user_id
                UNION ALL
                SELECT rc.user_id, d.level + 1
                FROM referral_chains rc
                JOIN downlines d ON rc.referrer_id = d.user_id
                WHERE d.level < 20
            )
            SELECT d.user_id, d.level,
                   EXISTS(
                       SELECT 1 FROM user_subscriptions us
                       WHERE us.user_id = d.user_id
                         AND us.status = 'active'
                         AND us.end_date > CURRENT_TIMESTAMP
                         AND us.tier_code != 'free'
                   ) AS is_active
            FROM downlines d;
            """
        )
        rows = (await db.execute(sql_downlines, {"user_id": user_id})).fetchall()

        # Query earnings per level for this user
        earnings_sql = text(
            """
            SELECT tier_level, COALESCE(SUM(amount_toman), 0) AS total_earned
            FROM commission_ledgers
            WHERE user_id = :user_id AND beneficiary_type = 'user'
            GROUP BY tier_level;
            """
        )
        earnings_rows = (await db.execute(earnings_sql, {"user_id": user_id})).fetchall()
        earnings_map = {int(r.tier_level): int(r.total_earned) for r in earnings_rows}

        # Aggregate counts by level
        level_counts: dict[int, dict[str, int]] = {}
        total_members = 0
        total_active_subs = 0

        for r in rows:
            lvl = int(r.level)
            is_active = bool(r.is_active)
            total_members += 1
            if is_active:
                total_active_subs += 1

            if lvl not in level_counts:
                level_counts[lvl] = {"members": 0, "active": 0}
            level_counts[lvl]["members"] += 1
            if is_active:
                level_counts[lvl]["active"] += 1

        # Base percentages calculation
        # Base commission budget is 21%. Level 1 gets 50% of budget = 10.5%, Level 2 gets 25% = 5.25%, etc.
        level_stats = []
        active_levels = set(level_counts.keys()) | set(earnings_map.keys())
        max_level_seen = max(active_levels) if active_levels else 0

        if max_level_seen > 0:
            for lvl in range(1, max_level_seen + 1):
                fraction_percent = round(21.0 / (2**lvl), 3)  # 10.5, 5.25, 2.625, 1.313...
                counts = level_counts.get(lvl, {"members": 0, "active": 0})
                earned = earnings_map.get(lvl, 0)

                level_stats.append(
                    {
                        "level": lvl,
                        "percentage": fraction_percent,
                        "members_count": counts["members"],
                        "active_subscribers_count": counts["active"],
                        "total_earned_toman": earned,
                    }
                )

        return {
            "total_members": total_members,
            "total_active_subscribers": total_active_subs,
            "levels": level_stats,
        }

    @staticmethod
    async def get_user_downline_members(
        db: AsyncSession,
        user_id: int,
        level: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict[str, Any]:
        """
        Return masked member roster for user's referral downlines.
        """
        sql_members = text(
            """
            WITH RECURSIVE downlines AS (
                SELECT user_id, 1 AS level
                FROM referral_chains
                WHERE referrer_id = :user_id
                UNION ALL
                SELECT rc.user_id, d.level + 1
                FROM referral_chains rc
                JOIN downlines d ON rc.referrer_id = d.user_id
                WHERE d.level < 20
            )
            SELECT d.user_id, d.level, u.username, u.phone, u.created_at,
                   EXISTS(
                       SELECT 1 FROM user_subscriptions us
                       WHERE us.user_id = d.user_id
                         AND us.status = 'active'
                         AND us.end_date > CURRENT_TIMESTAMP
                         AND us.tier_code != 'free'
                   ) AS is_active,
                   COALESCE((
                       SELECT SUM(cl.amount_toman)
                       FROM commission_ledgers cl
                       WHERE cl.user_id = :user_id
                         AND cl.order_payment_id IN (
                             SELECT op.id FROM order_payments op WHERE op.user_id = d.user_id
                         )
                   ), 0) AS commission_earned
            FROM downlines d
            JOIN users u ON d.user_id = u.id
            WHERE (:level_filter IS NULL OR d.level = :level_filter)
            ORDER BY d.level ASC, u.created_at DESC;
            """
        )
        rows = (
            await db.execute(
                sql_members,
                {"user_id": user_id, "level_filter": level if level and level > 0 else None},
            )
        ).fetchall()

        total = len(rows)
        offset = (page - 1) * page_size
        paged_rows = rows[offset : offset + page_size]

        items = []
        for r in paged_rows:
            items.append(
                {
                    "user_id": r.user_id,
                    "masked_username": mask_username(r.username),
                    "masked_phone": mask_phone(r.phone),
                    "level": r.level,
                    "joined_at": r.created_at,
                    "has_active_subscription": bool(r.is_active),
                    "total_contributed_commission_toman": int(r.commission_earned or 0),
                }
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def get_admin_user_tree(db: AsyncSession, user_id: int) -> dict[str, Any]:
        """
        Admin pedigree explorer: retrieve complete upline chain and immediate downlines
        for a specific user with their referral hide status.
        """
        user_stmt = select(User).where(User.id == user_id)
        user = (await db.execute(user_stmt)).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        # Uplines (including hidden users for admin inspection)
        uplines: list[dict[str, Any]] = []
        curr_id = user_id
        for lvl in range(1, 20):
            chain_stmt = select(ReferralChain.referrer_id).where(ReferralChain.user_id == curr_id)
            ref_id = (await db.execute(chain_stmt)).scalar_one_or_none()
            if not ref_id:
                break
            ref_user = (await db.execute(select(User).where(User.id == ref_id))).scalar_one_or_none()
            if not ref_user:
                break
            uplines.append(
                {
                    "level": lvl,
                    "user_id": ref_user.id,
                    "username": ref_user.username,
                    "full_name": ref_user.full_name,
                    "phone": ref_user.phone,
                    "is_referral_hidden": ref_user.is_referral_hidden,
                }
            )
            curr_id = ref_id

        # Direct downlines (Level 1)
        downline_chains = (
            await db.execute(select(ReferralChain.user_id).where(ReferralChain.referrer_id == user_id))
        ).scalars().all()

        downline_users: list[dict[str, Any]] = []
        if downline_chains:
            users_list = (
                await db.execute(select(User).where(User.id.in_(downline_chains)))
            ).scalars().all()
            for u in users_list:
                downline_users.append(
                    {
                        "user_id": u.id,
                        "username": u.username,
                        "full_name": u.full_name,
                        "phone": u.phone,
                        "is_referral_hidden": u.is_referral_hidden,
                        "created_at": u.created_at,
                    }
                )

        wallet_stmt = select(UserWallet).where(UserWallet.user_id == user_id)
        wallet = (await db.execute(wallet_stmt)).scalar_one_or_none()

        return {
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "phone": user.phone,
                "referral_code": user.referral_code,
                "is_referral_hidden": user.is_referral_hidden,
            },
            "wallet": {
                "withdrawable_balance_toman": wallet.withdrawable_balance_toman if wallet else 0,
                "pending_balance_toman": wallet.pending_balance_toman if wallet else 0,
                "total_earned_toman": wallet.total_earned_toman if wallet else 0,
            },
            "uplines": uplines,
            "direct_downlines": downline_users,
        }
