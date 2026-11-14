"""Weekly settlement service, commission aggregation, and network pedigree analytics."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any
from sqlalchemy import select, func, desc, text, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, BadRequestException
from app.modules.wallet.models import (
    UserWallet,
    ReferralChain,
    CommissionLedger,
    SettlementBatch,
    SettlementAccount,
    WithdrawalRequest,
    ReferralBlacklist,
)
from app.modules.wallet.treasury_models import ReferralTreasuryPool, TreasuryLog
from app.modules.users.models import User
from app.modules.subscriptions.models import UserSubscription, OrderPayment


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _build_chain_adjacency(edges: list[tuple[int, int]]) -> tuple[dict[int, int], dict[int, list[int]]]:
    """Build parent lookup (user -> referrer) and children lookup (referrer -> children)."""
    parent_of: dict[int, int] = {}
    children_of: dict[int, list[int]] = {}
    for uid, ref_id in edges:
        parent_of[uid] = ref_id
        children_of.setdefault(ref_id, []).append(uid)
    return parent_of, children_of


def _compute_subtree_ids(root_id: int, children_of: dict[int, list[int]]) -> set[int]:
    """Breadth-first collection of all descendant IDs beneath root_id with cycle guard."""
    visited: set[int] = set()
    queue = list(children_of.get(root_id, []))
    while queue:
        cid = queue.pop(0)
        if cid in visited or cid == root_id:
            continue
        visited.add(cid)
        queue.extend(children_of.get(cid, []))
    return visited


def _find_root_and_depth(user_id: int, parent_of: dict[int, int], max_depth: int = 50) -> tuple[int, int]:
    """Walk upward to the root ancestor of user_id and return (root_id, depth_from_root)."""
    curr = user_id
    visited = {curr}
    depth = 0
    while curr in parent_of and depth < max_depth:
        parent = parent_of[curr]
        if parent in visited:
            break
        visited.add(parent)
        curr = parent
        depth += 1
    return curr, depth


def _compute_node_anomaly_flags(
    user: User,
    direct_children_ids: list[int],
    active_sub_ids: set[int],
    zero_commission: bool = False,
) -> list[str]:
    """Compute concise fraud/structural diagnostic flags for a user node."""
    flags: list[str] = []
    if user.is_referral_blocked:
        flags.append("blocked_in_chain")
    if user.is_referral_hidden:
        flags.append("hidden_pass_through")
    if user.is_subscription_banned:
        flags.append("subscription_banned")
    inactive_children = sum(1 for cid in direct_children_ids if cid not in active_sub_ids)
    if inactive_children >= 5:
        flags.append("many_inactive_downlines")
    if zero_commission and len(direct_children_ids) >= 5:
        flags.append("zero_commission_cluster")
    return flags


async def _get_active_sub_user_ids(db: AsyncSession, user_ids: set[int] | list[int]) -> set[int]:
    """Return subset of user_ids that currently hold an active paid subscription."""
    uid_list = list(user_ids)
    if not uid_list:
        return set()
    now = datetime.now(timezone.utc)
    rows = (
        await db.execute(
            select(UserSubscription.user_id, UserSubscription.end_date).where(
                UserSubscription.user_id.in_(uid_list),
                UserSubscription.status == "active",
                UserSubscription.tier_code != "free",
            )
        )
    ).all()
    active_ids: set[int] = set()
    for uid, end_date in rows:
        aware_end = _ensure_utc(end_date)
        if aware_end and aware_end > now:
            active_ids.add(uid)
    return active_ids


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
    async def preview_weekly_settlement(
        db: AsyncSession,
        search: str | None = None,
        sort_by: str = "amount_desc",
    ) -> dict[str, Any]:
        """
        Inspect all currently pending commissions and provide a preview summary
        without modifying wallet balances or ledger state.
        """
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
        beneficiaries: list[dict[str, Any]] = []

        if rows:
            user_ids = [r.user_id for r in rows]
            users_stmt = select(User).where(User.id.in_(user_ids))
            users_map = {u.id: u for u in (await db.execute(users_stmt)).scalars().all()}

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
                        "phone": user_info.phone if user_info else None,
                        "is_referral_blocked": bool(user_info.is_referral_blocked) if user_info else False,
                        "is_referral_hidden": bool(user_info.is_referral_hidden) if user_info else False,
                        "pending_amount_toman": pending_toman,
                        "transactions_count": tx_c,
                    }
                )

        total_beneficiaries_all = len(beneficiaries)
        if search and search.strip():
            q = search.strip().lower()
            beneficiaries = [
                b
                for b in beneficiaries
                if q in str(b["user_id"])
                or q in (b["username"] or "").lower()
                or q in (b["full_name"] or "").lower()
                or q in (b["phone"] or "").lower()
            ]

        sort_key = (sort_by or "amount_desc").strip().lower()
        if sort_key == "amount_asc":
            beneficiaries.sort(key=lambda b: (b["pending_amount_toman"], b["transactions_count"]))
        elif sort_key == "tx_desc":
            beneficiaries.sort(key=lambda b: (b["transactions_count"], b["pending_amount_toman"]), reverse=True)
        else:
            beneficiaries.sort(key=lambda b: (b["pending_amount_toman"], b["transactions_count"]), reverse=True)

        now = datetime.now(timezone.utc)
        return {
            "total_pending_amount_toman": total_pending_amount,
            "total_pending_transactions": total_tx_count,
            "total_beneficiaries": total_beneficiaries_all,
            "filtered_beneficiaries_count": len(beneficiaries),
            "beneficiaries": beneficiaries,
            "period_end": now,
        }

    @staticmethod
    async def _settle_ledger_rows(
        db: AsyncSession,
        ledgers: list[CommissionLedger],
        batch_code: str,
        executed_by_type: str,
        executed_by_admin_id: int | None = None,
    ) -> tuple[SettlementBatch, dict[int, UserWallet]]:
        """Transfer grouped ledger totals from pending to withdrawable wallet balance and create batch record."""
        now = datetime.now(timezone.utc)
        user_sums: dict[int, int] = {}
        earliest_time = now

        for l in ledgers:
            if l.user_id is None:
                continue
            user_sums[l.user_id] = user_sums.get(l.user_id, 0) + l.amount_toman
            l_time = l.created_at
            if l_time.tzinfo is None:
                l_time = l_time.replace(tzinfo=timezone.utc)
            if l_time < earliest_time:
                earliest_time = l_time

        updated_wallets: dict[int, UserWallet] = {}
        for uid, amount in user_sums.items():
            wallet_stmt = select(UserWallet).where(UserWallet.user_id == uid).with_for_update()
            wallet = (await db.execute(wallet_stmt)).scalar_one_or_none()
            if not wallet:
                wallet = UserWallet(
                    user_id=uid,
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
            updated_wallets[uid] = wallet

        total_settled_amount = sum(user_sums.values())
        for l in ledgers:
            l.settlement_status = "settled"
            l.settled_at = now
            l.settlement_batch_id = batch_code

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
        return batch, updated_wallets

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

        ledgers_stmt = (
            select(CommissionLedger)
            .where(
                CommissionLedger.settlement_status == "pending",
                CommissionLedger.beneficiary_type == "user",
                CommissionLedger.user_id.is_not(None),
            )
            .with_for_update()
        )
        ledgers = list((await db.execute(ledgers_stmt)).scalars().all())

        if not ledgers:
            return {
                "status": "empty",
                "message": "تراکنش معوقه‌ای برای تسویه هفتگی یافت نشد.",
                "settled_amount_toman": 0,
                "transactions_count": 0,
                "beneficiaries_count": 0,
                "batch_code": None,
            }

        batch, _ = await WeeklySettlementService._settle_ledger_rows(
            db=db,
            ledgers=ledgers,
            batch_code=batch_code,
            executed_by_type=executed_by_type,
            executed_by_admin_id=executed_by_admin_id,
        )

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
    async def release_user_pending_commission(
        db: AsyncSession,
        user_id: int,
        executed_by_admin_id: int | None = None,
    ) -> dict[str, Any]:
        """Release all pending referral commissions for a specific user immediately into withdrawable balance."""
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        ledgers_stmt = (
            select(CommissionLedger)
            .where(
                CommissionLedger.user_id == user_id,
                CommissionLedger.settlement_status == "pending",
                CommissionLedger.beneficiary_type == "user",
            )
            .with_for_update()
        )
        ledgers = list((await db.execute(ledgers_stmt)).scalars().all())

        if not ledgers:
            wallet = (await db.execute(select(UserWallet).where(UserWallet.user_id == user_id))).scalar_one_or_none()
            return {
                "status": "empty",
                "message": "پورسانت معوقه‌ای برای این کاربر یافت نشد.",
                "user_id": user_id,
                "batch_code": None,
                "settled_amount_toman": 0,
                "transactions_count": 0,
                "new_withdrawable_balance": wallet.withdrawable_balance_toman if wallet else 0,
            }

        now = datetime.now(timezone.utc)
        batch_code = f"USER-SETTLE-{user_id}-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        batch, updated_wallets = await WeeklySettlementService._settle_ledger_rows(
            db=db,
            ledgers=ledgers,
            batch_code=batch_code,
            executed_by_type="admin",
            executed_by_admin_id=executed_by_admin_id,
        )
        wallet = updated_wallets[user_id]
        await db.refresh(wallet)

        return {
            "status": "success",
            "message": "پورسانت‌های معوقه کاربر با موفقیت رفع تعویق و به موجودی قابل برداشت واریز شد.",
            "user_id": user_id,
            "batch_code": batch.batch_code,
            "settled_amount_toman": batch.total_amount_toman,
            "transactions_count": batch.total_transactions_count,
            "new_withdrawable_balance": wallet.withdrawable_balance_toman,
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
                         AND cl.beneficiary_type = 'user'
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
    async def release_selected_commissions(
        db: AsyncSession,
        user_ids: list[int],
        executed_by_admin_id: int | None = None,
    ) -> dict[str, Any]:
        """Release pending commissions for a selected subset of beneficiary users in one batch."""
        unique_ids = list({int(uid) for uid in user_ids if uid})
        if not unique_ids:
            raise BadRequestException("حداقل یک کاربر باید انتخاب شود.")

        ledgers_stmt = (
            select(CommissionLedger)
            .where(
                CommissionLedger.user_id.in_(unique_ids),
                CommissionLedger.settlement_status == "pending",
                CommissionLedger.beneficiary_type == "user",
            )
            .with_for_update()
        )
        ledgers = list((await db.execute(ledgers_stmt)).scalars().all())
        if not ledgers:
            return {
                "status": "empty",
                "message": "پورسانت معوقه‌ای برای کاربران منتخب یافت نشد.",
                "batch_code": None,
                "settled_amount_toman": 0,
                "transactions_count": 0,
                "beneficiaries_count": 0,
            }

        now = datetime.now(timezone.utc)
        batch_code = f"SELECT-SETTLE-{now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"
        batch, _ = await WeeklySettlementService._settle_ledger_rows(
            db=db,
            ledgers=ledgers,
            batch_code=batch_code,
            executed_by_type="admin",
            executed_by_admin_id=executed_by_admin_id,
        )
        return {
            "status": "success",
            "message": f"تسویه گروهی کاربران منتخب با موفقیت انجام شد. کد بچ: {batch.batch_code}",
            "batch_code": batch.batch_code,
            "settled_amount_toman": batch.total_amount_toman,
            "transactions_count": batch.total_transactions_count,
            "beneficiaries_count": batch.beneficiaries_count,
            "executed_at": batch.created_at.isoformat(),
        }

    @staticmethod
    async def get_referral_overview(db: AsyncSession) -> dict[str, Any]:
        """Unified live operational metrics and action queues for Referral Department overview."""
        pending_stats = (
            await db.execute(
                select(
                    func.coalesce(func.sum(CommissionLedger.amount_toman), 0),
                    func.count(func.distinct(CommissionLedger.user_id)),
                    func.count(CommissionLedger.id),
                ).where(
                    CommissionLedger.settlement_status == "pending",
                    CommissionLedger.beneficiary_type == "user",
                    CommissionLedger.user_id.is_not(None),
                )
            )
        ).one()

        pending_payout_stats = (
            await db.execute(
                select(
                    func.count(WithdrawalRequest.id),
                    func.coalesce(func.sum(WithdrawalRequest.amount_toman), 0),
                ).where(WithdrawalRequest.status == "pending")
            )
        ).one()

        total_accounts = (await db.execute(select(func.count(SettlementAccount.id)))).scalar() or 0
        unverified_accounts = (
            await db.execute(
                select(func.count(SettlementAccount.id)).where(SettlementAccount.is_verified == False)
            )
        ).scalar() or 0

        pool = (await db.execute(select(ReferralTreasuryPool).limit(1))).scalar_one_or_none()
        total_chains = (await db.execute(select(func.count(ReferralChain.id)))).scalar() or 0
        active_blacklist = (
            await db.execute(
                select(func.count(ReferralBlacklist.id)).where(ReferralBlacklist.is_active == True)
            )
        ).scalar() or 0

        pending_payout_rows = (
            await db.execute(
                select(WithdrawalRequest, User, SettlementAccount)
                .outerjoin(User, WithdrawalRequest.user_id == User.id)
                .outerjoin(SettlementAccount, WithdrawalRequest.settlement_account_id == SettlementAccount.id)
                .where(WithdrawalRequest.status == "pending")
                .order_by(desc(WithdrawalRequest.created_at))
                .limit(5)
            )
        ).all()

        recent_pending_payouts = [
            {
                "id": req.id,
                "user_id": req.user_id,
                "user_username": user.username if user else f"user_{req.user_id}",
                "user_name": user.full_name if user else "",
                "amount_toman": req.amount_toman,
                "account_type": acc.account_type if acc else "unknown",
                "bank_name": acc.bank_name if acc else None,
                "created_at": req.created_at,
            }
            for req, user, acc in pending_payout_rows
        ]

        pending_account_rows = (
            await db.execute(
                select(SettlementAccount, User)
                .outerjoin(User, SettlementAccount.user_id == User.id)
                .where(SettlementAccount.is_verified == False)
                .order_by(desc(SettlementAccount.created_at))
                .limit(5)
            )
        ).all()

        recent_pending_accounts = [
            {
                "id": acc.id,
                "user_id": acc.user_id,
                "username": user.username if user else f"user_{acc.user_id}",
                "user_full_name": user.full_name if user else "",
                "account_holder": acc.account_holder,
                "account_type": acc.account_type,
                "bank_name": acc.bank_name,
                "sheba_number": acc.sheba_number,
                "crypto_wallet_address": acc.crypto_wallet_address,
                "created_at": acc.created_at,
            }
            for acc, user in pending_account_rows
        ]

        recent_batches_rows = (
            await db.execute(select(SettlementBatch).order_by(desc(SettlementBatch.created_at)).limit(5))
        ).scalars().all()
        recent_batches = [
            {
                "id": b.id,
                "batch_code": b.batch_code,
                "total_amount_toman": b.total_amount_toman,
                "total_transactions_count": b.total_transactions_count,
                "beneficiaries_count": b.beneficiaries_count,
                "executed_by_type": b.executed_by_type,
                "created_at": b.created_at,
            }
            for b in recent_batches_rows
        ]

        return {
            "metrics": {
                "pending_commissions_toman": int(pending_stats[0] or 0),
                "pending_beneficiaries_count": int(pending_stats[1] or 0),
                "pending_transactions_count": int(pending_stats[2] or 0),
                "next_settlement_date": calculate_next_settlement_date().isoformat(),
                "pending_payouts_count": int(pending_payout_stats[0] or 0),
                "pending_payouts_amount_toman": int(pending_payout_stats[1] or 0),
                "unverified_accounts_count": int(unverified_accounts),
                "total_accounts_count": int(total_accounts),
                "treasury_balance_toman": int(pool.balance_toman if pool else 0),
                "treasury_total_collected_toman": int(pool.total_collected_toman if pool else 0),
                "treasury_total_distributed_toman": int(pool.total_distributed_toman if pool else 0),
                "total_chains_count": int(total_chains),
                "active_blacklist_count": int(active_blacklist),
            },
            "recent_pending_payouts": recent_pending_payouts,
            "recent_pending_accounts": recent_pending_accounts,
            "recent_batches": recent_batches,
        }

    @staticmethod
    async def search_users(db: AsyncSession, q: str, limit: int = 15) -> list[dict[str, Any]]:
        """Autocomplete search across users by username, name, phone, referral code, national code, or numeric ID."""
        clean = (q or "").strip()
        if not clean:
            rows = (
                await db.execute(select(User).order_by(desc(User.created_at)).limit(limit))
            ).scalars().all()
        else:
            term = f"%{clean}%"
            nat_acc_uids = (
                await db.execute(
                    select(SettlementAccount.user_id).where(SettlementAccount.national_code.ilike(term))
                )
            ).scalars().all()
            bl_nat_uids = (
                await db.execute(
                    select(ReferralBlacklist.user_id).where(ReferralBlacklist.blocked_national_code.ilike(term))
                )
            ).scalars().all()
            matched_ids = set(nat_acc_uids) | set(bl_nat_uids)

            conditions = [
                User.username.ilike(term),
                User.full_name.ilike(term),
                User.phone.ilike(term),
                User.referral_code.ilike(term),
            ]
            if clean.isdigit():
                conditions.append(User.id == int(clean))
            if matched_ids:
                conditions.append(User.id.in_(list(matched_ids)))

            rows = (
                await db.execute(select(User).where(or_(*conditions)).order_by(User.id.desc()).limit(limit))
            ).scalars().all()

        if not rows:
            return []

        found_ids = [u.id for u in rows]
        has_ref_ids = set(
            (
                await db.execute(
                    select(ReferralChain.user_id).where(ReferralChain.user_id.in_(found_ids))
                )
            ).scalars().all()
        )
        return [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "phone": u.phone,
                "referral_code": u.referral_code,
                "is_referral_hidden": bool(u.is_referral_hidden),
                "is_referral_blocked": bool(u.is_referral_blocked),
                "is_subscription_banned": bool(u.is_subscription_banned),
                "has_referrer": u.id in has_ref_ids,
            }
            for u in rows
        ]

    @staticmethod
    async def get_network_roots(db: AsyncSession, page: int = 1, limit: int = 15) -> dict[str, Any]:
        """List top network root referrers (referrers with no upline referrer) ranked by subtree size."""
        edges = (await db.execute(select(ReferralChain.user_id, ReferralChain.referrer_id))).all()
        if not edges:
            return {"items": [], "total": 0, "page": page, "page_size": limit}

        parent_of, children_of = _build_chain_adjacency([(int(u), int(r)) for u, r in edges])
        root_ids = sorted(set(children_of.keys()) - set(parent_of.keys()))
        total = len(root_ids)
        if total == 0:
            return {"items": [], "total": 0, "page": page, "page_size": limit}

        root_stats: list[tuple[int, int, int]] = []
        for rid in root_ids:
            direct_c = len(children_of.get(rid, []))
            subtree_c = len(_compute_subtree_ids(rid, children_of))
            root_stats.append((rid, direct_c, subtree_c))

        root_stats.sort(key=lambda item: (-item[2], -item[1], item[0]))
        offset = (page - 1) * limit
        paged_stats = root_stats[offset : offset + limit]
        paged_ids = [r[0] for r in paged_stats]

        if not paged_ids:
            return {"items": [], "total": total, "page": page, "page_size": limit}

        users_map = {
            u.id: u
            for u in (await db.execute(select(User).where(User.id.in_(paged_ids)))).scalars().all()
        }
        wallets_map = {
            w.user_id: w
            for w in (await db.execute(select(UserWallet).where(UserWallet.user_id.in_(paged_ids)))).scalars().all()
        }
        sub_check_ids = set(paged_ids)
        for rid in paged_ids:
            sub_check_ids.update(children_of.get(rid, []))
        active_sub_ids = await _get_active_sub_user_ids(db, sub_check_ids)

        pending_rows = (
            await db.execute(
                select(CommissionLedger.user_id, func.coalesce(func.sum(CommissionLedger.amount_toman), 0))
                .where(
                    CommissionLedger.user_id.in_(paged_ids),
                    CommissionLedger.beneficiary_type == "user",
                    CommissionLedger.settlement_status == "pending",
                )
                .group_by(CommissionLedger.user_id)
            )
        ).all()
        pending_map = {int(uid): int(amt or 0) for uid, amt in pending_rows}

        earned_rows = (
            await db.execute(
                select(CommissionLedger.user_id, func.coalesce(func.sum(CommissionLedger.amount_toman), 0))
                .where(
                    CommissionLedger.user_id.in_(paged_ids),
                    CommissionLedger.beneficiary_type == "user",
                )
                .group_by(CommissionLedger.user_id)
            )
        ).all()
        earned_map = {int(uid): int(amt or 0) for uid, amt in earned_rows}

        items = []
        for rid, direct_c, subtree_c in paged_stats:
            u = users_map.get(rid)
            if not u:
                continue
            w = wallets_map.get(rid)
            direct_children = children_of.get(rid, [])
            earned = max(int(w.total_earned_toman) if w else 0, earned_map.get(rid, 0))
            flags = _compute_node_anomaly_flags(
                u,
                direct_children,
                active_sub_ids,
                zero_commission=(earned == 0 and pending_map.get(rid, 0) == 0),
            )
            items.append(
                {
                    "user_id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "phone": u.phone,
                    "referral_code": u.referral_code,
                    "is_referral_hidden": bool(u.is_referral_hidden),
                    "is_referral_blocked": bool(u.is_referral_blocked),
                    "is_subscription_banned": bool(u.is_subscription_banned),
                    "has_active_subscription": u.id in active_sub_ids,
                    "direct_downlines_count": direct_c,
                    "total_subtree_count": subtree_c,
                    "total_earned_toman": earned,
                    "pending_commission_toman": pending_map.get(rid, 0),
                    "anomaly_flags": flags,
                }
            )

        return {"items": items, "total": total, "page": page, "page_size": limit}

    @staticmethod
    async def _enrich_downline_nodes(
        db: AsyncSession,
        target_users: list[User],
        children_of: dict[int, list[int]],
    ) -> list[dict[str, Any]]:
        """Attach subtree sizes, active subscription state, commission contribution, and anomaly flags to child users."""
        if not target_users:
            return []

        child_ids = [u.id for u in target_users]
        check_sub_ids: set[int] = set(child_ids)
        for cid in child_ids:
            check_sub_ids.update(children_of.get(cid, []))
        active_sub_ids = await _get_active_sub_user_ids(db, check_sub_ids)

        # Pending commission held by each child
        pending_rows = (
            await db.execute(
                select(CommissionLedger.user_id, func.coalesce(func.sum(CommissionLedger.amount_toman), 0))
                .where(
                    CommissionLedger.user_id.in_(child_ids),
                    CommissionLedger.beneficiary_type == "user",
                    CommissionLedger.settlement_status == "pending",
                )
                .group_by(CommissionLedger.user_id)
            )
        ).all()
        pending_map = {int(uid): int(amt or 0) for uid, amt in pending_rows}

        # Commission generated from purchases placed by each child
        contrib_rows = (
            await db.execute(
                select(OrderPayment.user_id, func.coalesce(func.sum(CommissionLedger.amount_toman), 0))
                .join(CommissionLedger, CommissionLedger.order_payment_id == OrderPayment.id)
                .where(OrderPayment.user_id.in_(child_ids), CommissionLedger.beneficiary_type == "user")
                .group_by(OrderPayment.user_id)
            )
        ).all()
        contrib_map = {int(uid): int(amt or 0) for uid, amt in contrib_rows}

        enriched: list[dict[str, Any]] = []
        for u in target_users:
            direct_children = children_of.get(u.id, [])
            subtree_count = len(_compute_subtree_ids(u.id, children_of))
            contributed = contrib_map.get(u.id, 0)
            pending_amt = pending_map.get(u.id, 0)
            flags = _compute_node_anomaly_flags(
                u,
                direct_children,
                active_sub_ids,
                zero_commission=(contributed == 0 and pending_amt == 0),
            )
            enriched.append(
                {
                    "user_id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "phone": u.phone,
                    "referral_code": u.referral_code,
                    "is_referral_hidden": bool(u.is_referral_hidden),
                    "is_referral_blocked": bool(u.is_referral_blocked),
                    "is_subscription_banned": bool(u.is_subscription_banned),
                    "has_active_subscription": u.id in active_sub_ids,
                    "direct_children_count": len(direct_children),
                    "total_subtree_count": subtree_count,
                    "contributed_commission_toman": contributed,
                    "pending_commission_toman": pending_amt,
                    "anomaly_flags": flags,
                    "created_at": u.created_at,
                }
            )
        return enriched

    @staticmethod
    async def get_admin_user_tree(
        db: AsyncSession,
        user_id: int,
        downline_limit: int = 50,
    ) -> dict[str, Any]:
        """
        Admin pedigree explorer: retrieve complete upline chain with pass-through effective layers,
        enriched direct downlines, wallet, settlement accounts, blacklist status, and recent orders.
        """
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        edges = (await db.execute(select(ReferralChain.user_id, ReferralChain.referrer_id))).all()
        parent_of, children_of = _build_chain_adjacency([(int(u), int(r)) for u, r in edges])

        # Walk upward (cycle-guarded) collecting raw chain from immediate referrer to root
        raw_upline_ids: list[int] = []
        visited = {user_id}
        curr_id = user_id
        for _ in range(50):
            ref_id = parent_of.get(curr_id)
            if not ref_id or ref_id in visited:
                break
            visited.add(ref_id)
            raw_upline_ids.append(ref_id)
            curr_id = ref_id

        upline_users_map: dict[int, User] = {}
        if raw_upline_ids:
            upline_users_map = {
                u.id: u
                for u in (await db.execute(select(User).where(User.id.in_(raw_upline_ids)))).scalars().all()
            }

        upline_sub_ids = await _get_active_sub_user_ids(db, set(raw_upline_ids) | {user_id} | set(children_of.get(user_id, [])))

        uplines: list[dict[str, Any]] = []
        effective_counter = 0
        for lvl, ref_id in enumerate(raw_upline_ids, start=1):
            ref_user = upline_users_map.get(ref_id)
            if not ref_user:
                break
            if ref_user.is_referral_hidden:
                eff_layer = None
                share_pct = 0.0
            else:
                effective_counter += 1
                eff_layer = effective_counter
                share_pct = round(21.0 / (2 ** eff_layer), 4)
            uplines.append(
                {
                    "level": lvl,
                    "effective_layer": eff_layer,
                    "nominal_share_percent": share_pct,
                    "user_id": ref_user.id,
                    "username": ref_user.username,
                    "full_name": ref_user.full_name,
                    "phone": ref_user.phone,
                    "is_referral_hidden": bool(ref_user.is_referral_hidden),
                    "is_referral_blocked": bool(ref_user.is_referral_blocked),
                    "is_subscription_banned": bool(ref_user.is_subscription_banned),
                    "has_active_subscription": ref_user.id in upline_sub_ids,
                }
            )

        # Enriched first page of direct downlines
        direct_child_ids = children_of.get(user_id, [])
        downline_users: list[dict[str, Any]] = []
        if direct_child_ids:
            child_rows = (
                await db.execute(
                    select(User)
                    .where(User.id.in_(direct_child_ids))
                    .order_by(desc(User.created_at))
                    .limit(downline_limit)
                )
            ).scalars().all()
            downline_users = await WeeklySettlementService._enrich_downline_nodes(
                db, list(child_rows), children_of
            )

        wallet = (await db.execute(select(UserWallet).where(UserWallet.user_id == user_id))).scalar_one_or_none()
        accounts_rows = (
            await db.execute(
                select(SettlementAccount)
                .where(SettlementAccount.user_id == user_id, SettlementAccount.is_active == True)
                .order_by(desc(SettlementAccount.created_at))
            )
        ).scalars().all()
        settlement_accounts = [
            {
                "id": a.id,
                "account_type": a.account_type,
                "account_holder": a.account_holder,
                "bank_name": a.bank_name,
                "sheba_number": a.sheba_number,
                "card_number": a.card_number,
                "crypto_wallet_address": a.crypto_wallet_address,
                "crypto_network": a.crypto_network,
                "national_code": a.national_code,
                "is_verified": bool(a.is_verified),
            }
            for a in accounts_rows
        ]

        active_bl = (
            await db.execute(
                select(ReferralBlacklist)
                .where(ReferralBlacklist.user_id == user_id, ReferralBlacklist.is_active == True)
                .order_by(desc(ReferralBlacklist.created_at))
                .limit(1)
            )
        ).scalar_one_or_none()

        recent_orders_rows = (
            await db.execute(
                select(OrderPayment)
                .where(OrderPayment.user_id == user_id)
                .order_by(desc(OrderPayment.created_at))
                .limit(5)
            )
        ).scalars().all()
        recent_orders = [
            {
                "id": o.id,
                "tier_code": o.tier_code,
                "original_price": o.original_price,
                "discount_amount": o.discount_amount,
                "final_price": o.final_price,
                "payment_method": o.payment_method,
                "status": o.status,
                "created_at": o.created_at,
            }
            for o in recent_orders_rows
        ]

        root_flags = _compute_node_anomaly_flags(
            user,
            direct_child_ids,
            upline_sub_ids,
            zero_commission=False,
        )

        return {
            "user": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "phone": user.phone,
                "referral_code": user.referral_code,
                "is_referral_hidden": bool(user.is_referral_hidden),
                "is_referral_blocked": bool(user.is_referral_blocked),
                "is_subscription_banned": bool(user.is_subscription_banned),
                "has_active_subscription": user.id in upline_sub_ids,
                "direct_children_count": len(direct_child_ids),
                "total_subtree_count": len(_compute_subtree_ids(user_id, children_of)),
                "anomaly_flags": root_flags,
                "created_at": user.created_at,
            },
            "wallet": {
                "withdrawable_balance_toman": wallet.withdrawable_balance_toman if wallet else 0,
                "pending_balance_toman": wallet.pending_balance_toman if wallet else 0,
                "total_earned_toman": wallet.total_earned_toman if wallet else 0,
                "total_withdrawn_toman": wallet.total_withdrawn_toman if wallet else 0,
            },
            "uplines": uplines,
            "direct_downlines": downline_users,
            "direct_downlines_total": len(direct_child_ids),
            "settlement_accounts": settlement_accounts,
            "active_blacklist": (
                {
                    "id": active_bl.id,
                    "block_referral": active_bl.block_referral,
                    "block_subscription": active_bl.block_subscription,
                    "reason": active_bl.reason,
                    "blocked_at": active_bl.created_at,
                }
                if active_bl
                else None
            ),
            "recent_orders": recent_orders,
        }

    @staticmethod
    async def get_admin_tree_children(
        db: AsyncSession,
        user_id: int,
        page: int = 1,
        limit: int = 50,
    ) -> dict[str, Any]:
        """Lazy-load paginated direct downline nodes for multi-depth tree expansion."""
        user = (await db.execute(select(User.id).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        edges = (await db.execute(select(ReferralChain.user_id, ReferralChain.referrer_id))).all()
        _, children_of = _build_chain_adjacency([(int(u), int(r)) for u, r in edges])
        direct_child_ids = children_of.get(user_id, [])
        total = len(direct_child_ids)

        if total == 0:
            return {
                "parent_user_id": user_id,
                "items": [],
                "total": 0,
                "page": page,
                "page_size": limit,
            }

        child_rows = (
            await db.execute(
                select(User)
                .where(User.id.in_(direct_child_ids))
                .order_by(desc(User.created_at))
                .offset((page - 1) * limit)
                .limit(limit)
            )
        ).scalars().all()
        items = await WeeklySettlementService._enrich_downline_nodes(db, list(child_rows), children_of)
        return {
            "parent_user_id": user_id,
            "items": items,
            "total": total,
            "page": page,
            "page_size": limit,
        }

    @staticmethod
    async def get_recent_commission_orders(
        db: AsyncSession,
        user_id: int | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """List recent subscription orders for quick commission waterfall tracing."""
        stmt = select(OrderPayment, User).outerjoin(User, OrderPayment.user_id == User.id)
        if user_id is not None:
            edges = (await db.execute(select(ReferralChain.user_id, ReferralChain.referrer_id))).all()
            _, children_of = _build_chain_adjacency([(int(u), int(r)) for u, r in edges])
            subtree = _compute_subtree_ids(user_id, children_of)
            relevant_buyers = list(subtree | {user_id})
            ledger_order_ids = (
                await db.execute(
                    select(CommissionLedger.order_payment_id).where(
                        CommissionLedger.user_id == user_id,
                        CommissionLedger.order_payment_id > 0,
                    )
                )
            ).scalars().all()
            conditions = [OrderPayment.user_id.in_(relevant_buyers)]
            if ledger_order_ids:
                conditions.append(OrderPayment.id.in_(list(set(ledger_order_ids))))
            stmt = stmt.where(or_(*conditions))

        rows = (await db.execute(stmt.order_by(desc(OrderPayment.created_at)).limit(limit))).all()
        if not rows:
            return []

        order_ids = [o.id for o, _ in rows]
        ledger_rows = (
            await db.execute(
                select(
                    CommissionLedger.order_payment_id,
                    CommissionLedger.beneficiary_type,
                    func.coalesce(func.sum(CommissionLedger.amount_toman), 0),
                    func.count(CommissionLedger.id),
                )
                .where(CommissionLedger.order_payment_id.in_(order_ids))
                .group_by(CommissionLedger.order_payment_id, CommissionLedger.beneficiary_type)
            )
        ).all()
        agg: dict[int, dict[str, int]] = {}
        for oid, btype, amt, cnt in ledger_rows:
            entry = agg.setdefault(oid, {"user_toman": 0, "treasury_toman": 0, "ledger_count": 0})
            entry["ledger_count"] += int(cnt or 0)
            if btype == "user":
                entry["user_toman"] += int(amt or 0)
            elif btype == "treasury":
                entry["treasury_toman"] += int(amt or 0)

        items = []
        for o, buyer in rows:
            stats = agg.get(o.id, {"user_toman": 0, "treasury_toman": 0, "ledger_count": 0})
            items.append(
                {
                    "order_payment_id": o.id,
                    "buyer_user_id": o.user_id,
                    "buyer_username": buyer.username if buyer else f"user_{o.user_id}",
                    "buyer_full_name": buyer.full_name if buyer else "",
                    "tier_code": o.tier_code,
                    "final_price": o.final_price,
                    "budget_21_toman": int((o.final_price * 21.0) / 100.0),
                    "user_commission_toman": stats["user_toman"],
                    "treasury_commission_toman": stats["treasury_toman"],
                    "ledger_count": stats["ledger_count"],
                    "status": o.status,
                    "payment_method": o.payment_method,
                    "created_at": o.created_at,
                }
            )
        return items

    @staticmethod
    async def trace_order_waterfall(db: AsyncSession, order_payment_id: int) -> dict[str, Any]:
        """Trace the 21% referral commission waterfall and recorded CommissionLedger rows for an order."""
        order = (
            await db.execute(select(OrderPayment).where(OrderPayment.id == order_payment_id))
        ).scalar_one_or_none()
        if not order:
            raise NotFoundException("سفارش پرداختی با این شناسه یافت نشد.")

        buyer = (await db.execute(select(User).where(User.id == order.user_id))).scalar_one_or_none()
        budget_toman = int((order.final_price * 21.0) / 100.0)

        # Recorded CommissionLedger rows
        ledgers = (
            await db.execute(
                select(CommissionLedger)
                .where(CommissionLedger.order_payment_id == order_payment_id)
                .order_by(CommissionLedger.tier_level.asc(), CommissionLedger.id.asc())
            )
        ).scalars().all()

        ledger_uid_set = {l.user_id for l in ledgers if l.user_id is not None}

        # Current buyer upline path for visual comparison
        edges = (await db.execute(select(ReferralChain.user_id, ReferralChain.referrer_id))).all()
        parent_of, _ = _build_chain_adjacency([(int(u), int(r)) for u, r in edges])
        upline_ids: list[int] = []
        visited = {order.user_id}
        curr = order.user_id
        for _ in range(50):
            ref = parent_of.get(curr)
            if not ref or ref in visited:
                break
            visited.add(ref)
            upline_ids.append(ref)
            curr = ref

        all_uid_set = ledger_uid_set | set(upline_ids)
        users_map: dict[int, User] = {}
        if all_uid_set:
            users_map = {
                u.id: u
                for u in (await db.execute(select(User).where(User.id.in_(list(all_uid_set))))).scalars().all()
            }
        active_sub_ids = await _get_active_sub_user_ids(db, all_uid_set)

        current_upline_path: list[dict[str, Any]] = []
        eff_layer = 0
        rem_pool = budget_toman
        for raw_lvl, uid in enumerate(upline_ids, start=1):
            u = users_map.get(uid)
            if not u:
                continue
            if u.is_referral_hidden:
                current_upline_path.append(
                    {
                        "raw_level": raw_lvl,
                        "effective_layer": None,
                        "user_id": u.id,
                        "username": u.username,
                        "full_name": u.full_name,
                        "is_referral_hidden": True,
                        "is_referral_blocked": bool(u.is_referral_blocked),
                        "has_active_subscription": u.id in active_sub_ids,
                        "expected_share_percent": 0.0,
                        "expected_share_toman": 0,
                        "node_mode": "bypass_hidden",
                    }
                )
                continue

            eff_layer += 1
            share = rem_pool // 2
            rem_pool -= share if share >= 1 else 0
            mode = "ghosted_to_treasury" if u.is_referral_blocked else "active_user"
            current_upline_path.append(
                {
                    "raw_level": raw_lvl,
                    "effective_layer": eff_layer,
                    "user_id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "is_referral_hidden": False,
                    "is_referral_blocked": bool(u.is_referral_blocked),
                    "has_active_subscription": u.id in active_sub_ids,
                    "expected_share_percent": round(21.0 / (2 ** eff_layer), 4),
                    "expected_share_toman": share if share >= 1 else 0,
                    "node_mode": mode,
                }
            )

        recorded_ledgers = []
        total_user_toman = 0
        total_treasury_toman = 0
        total_settled_toman = 0
        total_pending_toman = 0
        for l in ledgers:
            u = users_map.get(l.user_id) if l.user_id else None
            if l.beneficiary_type == "user":
                total_user_toman += l.amount_toman
                if l.settlement_status == "settled":
                    total_settled_toman += l.amount_toman
                elif l.settlement_status == "pending":
                    total_pending_toman += l.amount_toman
            elif l.beneficiary_type == "treasury":
                total_treasury_toman += l.amount_toman
            recorded_ledgers.append(
                {
                    "id": l.id,
                    "beneficiary_type": l.beneficiary_type,
                    "user_id": l.user_id,
                    "username": u.username if u else None,
                    "full_name": u.full_name if u else None,
                    "tier_level": l.tier_level,
                    "amount_toman": l.amount_toman,
                    "settlement_status": l.settlement_status,
                    "settlement_batch_id": l.settlement_batch_id,
                    "description": l.description,
                    "created_at": l.created_at,
                }
            )

        t_logs = (
            await db.execute(
                select(TreasuryLog)
                .where(TreasuryLog.order_id == order_payment_id)
                .order_by(TreasuryLog.id.asc())
            )
        ).scalars().all()
        treasury_logs = [
            {
                "id": tl.id,
                "action_type": tl.action_type,
                "amount_toman": tl.amount_toman,
                "description": tl.description,
                "created_at": tl.created_at,
            }
            for tl in t_logs
        ]

        return {
            "order": {
                "id": order.id,
                "tier_code": order.tier_code,
                "original_price": order.original_price,
                "discount_amount": order.discount_amount,
                "final_price": order.final_price,
                "payment_method": order.payment_method,
                "transaction_ref": order.transaction_ref,
                "status": order.status,
                "created_at": order.created_at,
                "buyer": {
                    "id": order.user_id,
                    "username": buyer.username if buyer else f"user_{order.user_id}",
                    "full_name": buyer.full_name if buyer else "",
                    "phone": buyer.phone if buyer else None,
                },
            },
            "summary": {
                "budget_21_toman": budget_toman,
                "shop_share_79_toman": order.final_price - budget_toman,
                "user_distributed_toman": total_user_toman,
                "treasury_diverted_toman": total_treasury_toman,
                "settled_toman": total_settled_toman,
                "pending_toman": total_pending_toman,
            },
            "current_upline_path": current_upline_path,
            "recorded_ledgers": recorded_ledgers,
            "treasury_logs": treasury_logs,
        }

    @staticmethod
    async def simulate_order_waterfall(
        db: AsyncSession,
        buyer_id: int,
        amount_toman: int = 1_000_000,
        require_active_subscription: bool = False,
    ) -> dict[str, Any]:
        """Dry-run waterfall commission simulation without writing to database."""
        if amount_toman <= 0:
            raise BadRequestException("مبلغ شبیه‌سازی باید بزرگ‌تر از صفر باشد.")

        buyer = (await db.execute(select(User).where(User.id == buyer_id))).scalar_one_or_none()
        if not buyer:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        edges = (await db.execute(select(ReferralChain.user_id, ReferralChain.referrer_id))).all()
        parent_of, _ = _build_chain_adjacency([(int(u), int(r)) for u, r in edges])
        upline_ids: list[int] = []
        visited = {buyer_id}
        curr = buyer_id
        for _ in range(50):
            ref = parent_of.get(curr)
            if not ref or ref in visited:
                break
            visited.add(ref)
            upline_ids.append(ref)
            curr = ref

        users_map: dict[int, User] = {}
        if upline_ids:
            users_map = {
                u.id: u
                for u in (await db.execute(select(User).where(User.id.in_(upline_ids)))).scalars().all()
            }
        active_sub_ids = await _get_active_sub_user_ids(db, upline_ids)

        budget_toman = int((amount_toman * 21.0) / 100.0)
        current_pool = budget_toman
        distributed_sum = 0
        user_credited_toman = 0
        ghosted_treasury_toman = 0
        inactive_treasury_toman = 0
        steps: list[dict[str, Any]] = []
        effective_level = 0

        for raw_lvl, uid in enumerate(upline_ids, start=1):
            u = users_map.get(uid)
            if not u:
                continue
            if u.is_referral_hidden:
                steps.append(
                    {
                        "raw_level": raw_lvl,
                        "effective_layer": None,
                        "user_id": u.id,
                        "username": u.username,
                        "full_name": u.full_name,
                        "is_referral_hidden": True,
                        "is_referral_blocked": bool(u.is_referral_blocked),
                        "has_active_subscription": u.id in active_sub_ids,
                        "action": "bypass_hidden",
                        "recipient_type": "pass_through",
                        "share_percent": 0.0,
                        "amount_toman": 0,
                        "reason": "کاربر مخفی (Pass-Through) — از این گره عبور و لایه جایگزین به معرف بالاتر منتقل می‌شود",
                    }
                )
                continue

            share = current_pool // 2
            if share < 1:
                break
            current_pool -= share
            effective_level += 1
            pct = round(21.0 / (2 ** effective_level), 4)

            if u.is_referral_blocked:
                distributed_sum += share
                ghosted_treasury_toman += share
                steps.append(
                    {
                        "raw_level": raw_lvl,
                        "effective_layer": effective_level,
                        "user_id": u.id,
                        "username": u.username,
                        "full_name": u.full_name,
                        "is_referral_hidden": False,
                        "is_referral_blocked": True,
                        "has_active_subscription": u.id in active_sub_ids,
                        "action": "ghosted_to_treasury",
                        "recipient_type": "treasury",
                        "share_percent": pct,
                        "amount_toman": share,
                        "reason": f"کاربر روح‌شده (مسدود) در لایه {effective_level} — سهم مستقیماً به صندوق کل منتقل می‌شود",
                    }
                )
                continue

            has_sub = True
            if require_active_subscription:
                has_sub = u.id in active_sub_ids

            if has_sub:
                distributed_sum += share
                user_credited_toman += share
                steps.append(
                    {
                        "raw_level": raw_lvl,
                        "effective_layer": effective_level,
                        "user_id": u.id,
                        "username": u.username,
                        "full_name": u.full_name,
                        "is_referral_hidden": False,
                        "is_referral_blocked": False,
                        "has_active_subscription": u.id in active_sub_ids,
                        "action": "credit_user",
                        "recipient_type": "user",
                        "share_percent": pct,
                        "amount_toman": share,
                        "reason": f"واریز پورسانت لایه {effective_level} به کیف پول در انتظار تسویه",
                    }
                )
            else:
                inactive_treasury_toman += share
                steps.append(
                    {
                        "raw_level": raw_lvl,
                        "effective_layer": effective_level,
                        "user_id": u.id,
                        "username": u.username,
                        "full_name": u.full_name,
                        "is_referral_hidden": False,
                        "is_referral_blocked": False,
                        "has_active_subscription": False,
                        "action": "inactive_sub_to_treasury",
                        "recipient_type": "treasury",
                        "share_percent": pct,
                        "amount_toman": share,
                        "reason": f"عدم اشتراک فعال در لایه {effective_level} — سهم به صندوق کل منتقل می‌شود",
                    }
                )

        leftover_toman = max(0, budget_toman - distributed_sum)
        return {
            "buyer": {
                "id": buyer.id,
                "username": buyer.username,
                "full_name": buyer.full_name,
            },
            "amount_toman": amount_toman,
            "budget_21_toman": budget_toman,
            "shop_share_79_toman": amount_toman - budget_toman,
            "user_credited_toman": user_credited_toman,
            "ghosted_treasury_toman": ghosted_treasury_toman,
            "inactive_treasury_toman": inactive_treasury_toman,
            "leftover_treasury_toman": leftover_toman,
            "total_treasury_toman": ghosted_treasury_toman + leftover_toman,
            "steps": steps,
        }

    @staticmethod
    async def list_admin_chains_enriched(
        db: AsyncSession,
        page: int = 1,
        limit: int = 25,
        search: str | None = None,
        status_filter: str | None = None,
    ) -> dict[str, Any]:
        """List referral chain links enriched with tree root, depth from root, status flags, and fraud warnings."""
        all_chains = (
            await db.execute(select(ReferralChain).order_by(ReferralChain.created_at.desc()))
        ).scalars().all()
        if not all_chains:
            return {"items": [], "total": 0, "page": page, "page_size": limit}

        parent_of, children_of = _build_chain_adjacency([(c.user_id, c.referrer_id) for c in all_chains])
        all_uid_set: set[int] = set()
        root_depth_map: dict[int, tuple[int, int]] = {}
        for c in all_chains:
            all_uid_set.add(c.user_id)
            all_uid_set.add(c.referrer_id)
            root_id, depth = _find_root_and_depth(c.user_id, parent_of)
            root_depth_map[c.user_id] = (root_id, depth)
            all_uid_set.add(root_id)

        users_map = {
            u.id: u
            for u in (await db.execute(select(User).where(User.id.in_(list(all_uid_set))))).scalars().all()
        }
        active_sub_ids = await _get_active_sub_user_ids(db, all_uid_set)

        # Aggregate earned user commission counts to detect zero-commission clusters
        earned_rows = (
            await db.execute(
                select(CommissionLedger.user_id, func.coalesce(func.sum(CommissionLedger.amount_toman), 0))
                .where(CommissionLedger.user_id.in_(list(all_uid_set)), CommissionLedger.beneficiary_type == "user")
                .group_by(CommissionLedger.user_id)
            )
        ).all()
        earned_map = {int(uid): int(amt or 0) for uid, amt in earned_rows}

        q = (search or "").strip().lower()
        sf = (status_filter or "all").strip().lower()

        filtered_rows: list[dict[str, Any]] = []
        for c in all_chains:
            child = users_map.get(c.user_id)
            ref = users_map.get(c.referrer_id)
            root_id, depth_from_root = root_depth_map.get(c.user_id, (c.referrer_id, 1))
            root_user = users_map.get(root_id)

            flags: set[str] = set()
            if child:
                flags.update(
                    _compute_node_anomaly_flags(
                        child,
                        children_of.get(child.id, []),
                        active_sub_ids,
                        zero_commission=(earned_map.get(child.id, 0) == 0),
                    )
                )
            if ref:
                flags.update(
                    _compute_node_anomaly_flags(
                        ref,
                        children_of.get(ref.id, []),
                        active_sub_ids,
                        zero_commission=(earned_map.get(ref.id, 0) == 0),
                    )
                )

            item = {
                "id": c.id,
                "user_id": c.user_id,
                "referrer_id": c.referrer_id,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "user_username": child.username if child else f"user_{c.user_id}",
                "user_full_name": child.full_name if child else "",
                "user_phone": child.phone if child else None,
                "user_is_referral_hidden": bool(child.is_referral_hidden) if child else False,
                "user_is_referral_blocked": bool(child.is_referral_blocked) if child else False,
                "user_is_subscription_banned": bool(child.is_subscription_banned) if child else False,
                "user_has_active_subscription": c.user_id in active_sub_ids,
                "referrer_username": ref.username if ref else f"user_{c.referrer_id}",
                "referrer_full_name": ref.full_name if ref else "",
                "referrer_phone": ref.phone if ref else None,
                "referrer_is_referral_hidden": bool(ref.is_referral_hidden) if ref else False,
                "referrer_is_referral_blocked": bool(ref.is_referral_blocked) if ref else False,
                "referrer_is_subscription_banned": bool(ref.is_subscription_banned) if ref else False,
                "root_user_id": root_id,
                "root_username": root_user.username if root_user else f"user_{root_id}",
                "depth_from_root": depth_from_root,
                "anomaly_flags": sorted(flags),
            }

            if sf == "blocked" and not (item["user_is_referral_blocked"] or item["referrer_is_referral_blocked"]):
                continue
            elif sf == "hidden" and not (item["user_is_referral_hidden"] or item["referrer_is_referral_hidden"]):
                continue
            elif sf == "banned" and not (item["user_is_subscription_banned"] or item["referrer_is_subscription_banned"]):
                continue
            elif sf == "anomaly" and not item["anomaly_flags"]:
                continue

            if q:
                haystack = " ".join(
                    str(v or "").lower()
                    for v in [
                        item["user_id"],
                        item["user_username"],
                        item["user_full_name"],
                        item["user_phone"],
                        item["referrer_id"],
                        item["referrer_username"],
                        item["referrer_full_name"],
                        item["referrer_phone"],
                        item["root_username"],
                    ]
                )
                if q not in haystack:
                    continue

            filtered_rows.append(item)

        total = len(filtered_rows)
        offset = (page - 1) * limit
        return {
            "items": filtered_rows[offset : offset + limit],
            "total": total,
            "page": page,
            "page_size": limit,
        }
