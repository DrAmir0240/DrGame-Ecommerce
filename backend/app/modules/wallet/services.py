"""Wallet and referral waterfall commission services."""
import re
from datetime import datetime, timezone
from sqlalchemy import select, func, desc, update, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
    ForbiddenException,
)
from app.modules.wallet.models import (
    UserWallet,
    ReferralChain,
    CommissionLedger,
    SettlementAccount,
    WithdrawalRequest,
    ReferralBlacklist,
)
from app.modules.wallet.treasury_models import ReferralTreasuryPool, TreasuryLog
from app.modules.subscriptions.models import UserSubscription, OrderPayment
from app.modules.users.models import User


def _normalize_identity_name(value: str | None) -> str:
    """Normalize Persian/Arabic letters and whitespace for blacklist matching."""
    if not value:
        return ""
    cleaned = value.replace("\u200c", " ").replace("ي", "ی").replace("ك", "ک")
    return re.sub(r"\s+", " ", cleaned).strip().lower()


def _normalize_national_code(value: str | None) -> str:
    """Normalize Persian/Arabic numerals to ASCII digits for national code checks."""
    if not value:
        return ""
    trans = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
    return value.translate(trans).strip()


class WalletService:
    @staticmethod
    async def get_or_create_wallet(db: AsyncSession, user_id: int) -> UserWallet:
        """Fetch existing wallet or initialize a new zero-balance wallet for user."""
        stmt = select(UserWallet).where(UserWallet.user_id == user_id)
        result = await db.execute(stmt)
        wallet = result.scalar_one_or_none()

        if not wallet:
            wallet = UserWallet(
                user_id=user_id,
                withdrawable_balance_toman=0,
                total_earned_toman=0,
                total_withdrawn_toman=0,
            )
            db.add(wallet)
            await db.commit()
            await db.refresh(wallet)

        return wallet

    @staticmethod
    async def get_or_create_treasury_pool(db: AsyncSession) -> ReferralTreasuryPool:
        """Fetch the platform treasury pool singleton or initialize a new one."""
        stmt = select(ReferralTreasuryPool).limit(1)
        pool = (await db.execute(stmt)).scalar_one_or_none()
        if not pool:
            pool = ReferralTreasuryPool(
                balance_toman=0,
                total_collected_toman=0,
                total_distributed_toman=0,
            )
            db.add(pool)
            await db.commit()
            await db.refresh(pool)
        return pool

    @classmethod
    async def credit_treasury_pool(
        cls,
        db: AsyncSession,
        amount_toman: int,
        action_type: str = "deposit_leftover",
        order_id: int | None = None,
        description: str = "",
    ) -> ReferralTreasuryPool:
        """Credit funds to the platform treasury pool and append audit log."""
        pool = await cls.get_or_create_treasury_pool(db)
        pool.balance_toman += amount_toman
        pool.total_collected_toman += amount_toman

        log = TreasuryLog(
            amount_toman=amount_toman,
            action_type=action_type,
            order_id=order_id,
            description=description or "واریز به صندوق تجمیع پلتفرم",
        )
        db.add(log)
        return pool

    @classmethod
    async def admin_reset_treasury(
        cls, db: AsyncSession, description: str = "صفر کردن موجودی صندوق توسط ادمین"
    ) -> dict:
        """Reset the platform treasury pool balance to zero with audit trail."""
        pool = await cls.get_or_create_treasury_pool(db)
        old_balance = pool.balance_toman
        pool.balance_toman = 0

        log = TreasuryLog(
            amount_toman=-old_balance,
            action_type="admin_reset",
            order_id=None,
            description=description,
        )
        db.add(log)
        await db.commit()
        return {"status": "success", "reset_amount": old_balance, "current_balance": 0}

    @classmethod
    async def admin_grant_treasury_reward(
        cls, db: AsyncSession, user_id: int, amount_toman: int, description: str = ""
    ) -> dict:
        """Grant a reward from the treasury pool directly to a user wallet."""
        if amount_toman <= 0:
            raise BadRequestException("مبلغ پاداش باید بزرگتر از صفر باشد.")

        pool = await cls.get_or_create_treasury_pool(db)
        if pool.balance_toman < amount_toman:
            raise BadRequestException("موجودی صندوق پلتفرم کافی نیست.")

        pool.balance_toman -= amount_toman
        pool.total_distributed_toman += amount_toman

        wallet = await cls.get_or_create_wallet(db, user_id)
        wallet.withdrawable_balance_toman += amount_toman
        wallet.total_earned_toman += amount_toman

        log = TreasuryLog(
            amount_toman=-amount_toman,
            action_type="admin_reward",
            order_id=None,
            description=description or f"اعطای پاداش به کاربر {user_id}",
        )
        db.add(log)

        ledger = CommissionLedger(
            order_payment_id=0,
            beneficiary_type="user",
            user_id=user_id,
            tier_level=0,
            amount_toman=amount_toman,
            description=f"پاداش ویژه از صندوق پلتفرم: {description or 'جایزه ادمین'}",
            settlement_status="settled",
            settled_at=datetime.now(timezone.utc),
        )
        db.add(ledger)

        await db.commit()
        return {
            "status": "success",
            "user_id": user_id,
            "granted_amount": amount_toman,
            "remaining_treasury_balance": pool.balance_toman,
        }

    @staticmethod
    async def bind_referral(
        db: AsyncSession, user_id: int, referral_code: str
    ) -> ReferralChain | None:
        """Link a newly registered user to an existing referrer using their referral code."""
        if not referral_code or not referral_code.strip():
            return None

        # Check if user is already linked
        existing_chain_stmt = select(ReferralChain).where(ReferralChain.user_id == user_id)
        existing_chain = (await db.execute(existing_chain_stmt)).scalar_one_or_none()
        if existing_chain:
            return existing_chain

        # Find referrer by code (case-insensitive)
        clean_code = referral_code.strip().upper()
        referrer_stmt = select(User).where(func.upper(User.referral_code) == clean_code)
        referrer = (await db.execute(referrer_stmt)).scalar_one_or_none()

        # Cannot refer oneself
        if not referrer or referrer.id == user_id:
            return None

        chain = ReferralChain(
            user_id=user_id,
            referrer_id=referrer.id,
        )
        db.add(chain)
        await db.commit()
        await db.refresh(chain)
        return chain

    @staticmethod
    async def get_upline_chain(
        db: AsyncSession, user_id: int, max_levels: int = 50, include_hidden: bool = False
    ) -> list[int]:
        """Traverse the upline chain and return referrer IDs from Level 1 upwards.
        If include_hidden is False, users with is_referral_hidden=True are bypassed (pass-through).
        """
        uplines: list[int] = []
        current_id = user_id

        for _ in range(max_levels):
            stmt = select(ReferralChain.referrer_id).where(ReferralChain.user_id == current_id)
            referrer_id = (await db.execute(stmt)).scalar_one_or_none()
            if not referrer_id or referrer_id in uplines:
                break

            if not include_hidden:
                user_stmt = select(User.is_referral_hidden).where(User.id == referrer_id)
                is_hidden = (await db.execute(user_stmt)).scalar_one_or_none() or False
                if is_hidden:
                    # Pass-through: bypass this hidden user and check their upline
                    current_id = referrer_id
                    continue

            uplines.append(referrer_id)
            current_id = referrer_id

        return uplines

    @staticmethod
    async def is_subscription_active(db: AsyncSession, user_id: int) -> bool:
        """Check if user has an active paid subscription at this moment."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(UserSubscription)
            .where(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active",
                UserSubscription.end_date > now,
                UserSubscription.tier_code != "free",
            )
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none() is not None

    @classmethod
    async def distribute_referral_commission(
        cls,
        db: AsyncSession,
        buyer_id: int,
        order_amount_toman: int,
        order_payment_id: int | None = None,
        base_commission_percent: float = 21.0,
        require_active_subscription: bool = False,
    ) -> dict:
        """
        Execute infinite halving referral commission chain:
        Layer 1: 50% of commission budget (10% of order if base is 20%)
        Layer 2: 25% of commission budget (5% of order)
        Layer 3: 12.5% of commission budget (2.5% of order)
        Layer n: commission_{n-1} / 2
        Leftover / unallocated pool: Deposited to ReferralTreasuryPool.
        Hidden users (is_referral_hidden=True) are bypassed seamlessly.
        """
        if order_amount_toman <= 0:
            return {"status": "zero_amount", "distributed_sum": 0, "leftover_amount": 0}

        total_commission_budget = int((order_amount_toman * base_commission_percent) / 100.0)
        distributed_sum = 0
        current_fraction_pool = total_commission_budget

        # Fetch visible upline chain with pass-through bypass for hidden referrers.
        # Ghosted/blocked referrers stay in the chain so higher tiers keep their normal level,
        # while the blocked user's share goes directly to ReferralTreasuryPool.
        uplines = await cls.get_upline_chain(db, buyer_id, max_levels=50, include_hidden=False)

        blocked_map: dict[int, bool] = {}
        if uplines:
            blocked_rows = (
                await db.execute(
                    select(User.id, User.is_referral_blocked).where(User.id.in_(uplines))
                )
            ).all()
            blocked_map = {row.id: bool(row.is_referral_blocked) for row in blocked_rows}

        for level, upline_id in enumerate(uplines, start=1):
            share = current_fraction_pool // 2
            if share < 1:
                break

            current_fraction_pool -= share

            # Ghosting check: blocked referrer receives 0 and tier share diverts to Treasury
            if blocked_map.get(upline_id, False):
                distributed_sum += share
                await cls.credit_treasury_pool(
                    db,
                    amount_toman=share,
                    action_type="ghosted_referral_divert",
                    order_id=order_payment_id,
                    description=f"واریز سهم لایه {level} کاربر مسدودشده #{upline_id} به صندوق کل پلتفرم",
                )
                db.add(
                    CommissionLedger(
                        order_payment_id=order_payment_id or 0,
                        beneficiary_type="treasury",
                        user_id=upline_id,
                        tier_level=level,
                        amount_toman=share,
                        settlement_status="settled",
                        settled_at=datetime.now(timezone.utc),
                        description=f"پورسانت لایه {level} به دلیل مسدودیت کاربر #{upline_id} به صندوق کل پلتفرم منتقل شد",
                    )
                )
                continue

            # Check subscription if required
            has_sub = True
            if require_active_subscription:
                has_sub = await cls.is_subscription_active(db, upline_id)

            if has_sub:
                distributed_sum += share

                # Credit to upline user wallet as weekly pending balance
                wallet = await cls.get_or_create_wallet(db, upline_id)
                wallet.pending_balance_toman += share

                ledger = CommissionLedger(
                    order_payment_id=order_payment_id or 0,
                    beneficiary_type="user",
                    user_id=upline_id,
                    tier_level=level,
                    amount_toman=share,
                    settlement_status="pending",
                    description=f"پورسانت ارجاع سطح {level} از سفارش {order_payment_id or buyer_id}",
                )
                db.add(ledger)
            else:
                # Inactive subscription: share goes to platform treasury ledger
                ledger = CommissionLedger(
                    order_payment_id=order_payment_id or 0,
                    beneficiary_type="treasury",
                    user_id=None,
                    tier_level=level,
                    amount_toman=share,
                    settlement_status="settled",
                    settled_at=datetime.now(timezone.utc),
                    description=f"سهم سطح {level} به علت عدم اشتراک فعال به صندوق پلتفرم منظور شد",
                )
                db.add(ledger)

        # Deposit leftover into ReferralTreasuryPool
        leftover_amount = total_commission_budget - distributed_sum
        if leftover_amount > 0:
            await cls.credit_treasury_pool(
                db,
                amount_toman=leftover_amount,
                action_type="deposit_leftover",
                order_id=order_payment_id,
                description=f"مانده پورسانت رفرال سفارش {order_payment_id or buyer_id}",
            )
            db.add(
                CommissionLedger(
                    order_payment_id=order_payment_id or 0,
                    beneficiary_type="treasury",
                    user_id=None,
                    tier_level=0,
                    amount_toman=leftover_amount,
                    settlement_status="settled",
                    settled_at=datetime.now(timezone.utc),
                    description="انتقال مانده تقسیم‌نشده پورسانت به صندوق پلتفرم",
                )
            )

        await db.commit()
        return {
            "status": "success",
            "amount_toman": order_amount_toman,
            "order_amount_toman": order_amount_toman,
            "shop_share": int(order_amount_toman * 0.79),
            "commission_pool": total_commission_budget,
            "total_commission_budget": total_commission_budget,
            "distributed_sum": distributed_sum,
            "leftover_amount": leftover_amount,
            "layers_processed": len(uplines),
        }

    @classmethod
    async def process_commission_waterfall(
        cls, db: AsyncSession, order_payment: OrderPayment
    ) -> dict:
        """Process referral commission for a paid order payment."""
        paid_amount = order_payment.final_price
        amount_toman = int(paid_amount)
        if amount_toman <= 0:
            return {"status": "zero_amount"}

        return await cls.distribute_referral_commission(
            db=db,
            buyer_id=order_payment.user_id,
            order_amount_toman=amount_toman,
            order_payment_id=order_payment.id,
            base_commission_percent=21.0,
            require_active_subscription=True,
        )

    @classmethod
    async def get_referral_summary(cls, db: AsyncSession, user_id: int) -> dict:
        """Fetch full referral statistics, counts, balances, and network levels for user."""
        user_stmt = select(User).where(User.id == user_id)
        user = (await db.execute(user_stmt)).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        wallet = await cls.get_or_create_wallet(db, user_id)

        # Count direct referrals
        direct_count_stmt = select(func.count(ReferralChain.id)).where(
            ReferralChain.referrer_id == user_id
        )
        direct_count = (await db.execute(direct_count_stmt)).scalar() or 0

        # Calculate active subscribers among direct referrals
        direct_users_stmt = select(ReferralChain.user_id).where(
            ReferralChain.referrer_id == user_id
        )
        direct_user_ids = (await db.execute(direct_users_stmt)).scalars().all()

        active_subs_count = 0
        if direct_user_ids:
            now = datetime.now(timezone.utc)
            subs_stmt = select(func.count(UserSubscription.id)).where(
                UserSubscription.user_id.in_(direct_user_ids),
                UserSubscription.status == "active",
                UserSubscription.end_date > now,
                UserSubscription.tier_code != "free",
            )
            active_subs_count = (await db.execute(subs_stmt)).scalar() or 0

        from app.modules.wallet.settlement_service import calculate_next_settlement_date

        return {
            "referral_code": user.referral_code,
            "withdrawable_balance_toman": wallet.withdrawable_balance_toman,
            "pending_balance_toman": wallet.pending_balance_toman,
            "next_settlement_date": calculate_next_settlement_date().isoformat(),
            "total_earned_toman": wallet.total_earned_toman,
            "total_withdrawn_toman": wallet.total_withdrawn_toman,
            "direct_referrals_count": direct_count,
            "active_subscriptions_count": active_subs_count,
        }

    @staticmethod
    async def list_transactions(
        db: AsyncSession, user_id: int, page: int = 1, page_size: int = 20
    ) -> dict:
        """Return paginated commission transactions for the user."""
        offset = (page - 1) * page_size
        stmt = (
            select(CommissionLedger)
            .where(
                CommissionLedger.user_id == user_id,
                CommissionLedger.beneficiary_type == "user",
            )
            .order_by(desc(CommissionLedger.created_at))
            .offset(offset)
            .limit(page_size)
        )
        items = (await db.execute(stmt)).scalars().all()

        count_stmt = select(func.count(CommissionLedger.id)).where(
            CommissionLedger.user_id == user_id,
            CommissionLedger.beneficiary_type == "user",
        )
        total = (await db.execute(count_stmt)).scalar() or 0

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def add_settlement_account(
        db: AsyncSession,
        user_id: int,
        account_type: str,
        sheba_number: str | None = None,
        card_number: str | None = None,
        account_holder: str | None = None,
        bank_name: str | None = None,
        national_code: str | None = None,
        phone: str | None = None,
        otp_code: str | None = None,
        crypto_wallet_address: str | None = None,
        crypto_network: str | None = None,
    ) -> SettlementAccount:
        """Register a new domestic bank account or international crypto wallet with identity verification."""
        from app.modules.auth.identity_service import IdentityService

        await WalletService._ensure_not_blacklisted_for_account(
            db=db,
            user_id=user_id,
            account_holder=account_holder,
            national_code=national_code,
        )

        is_verified = False

        if account_type == "bank_iran":
            if not sheba_number or not account_holder:
                raise BadRequestException("شماره شبا و نام صاحب حساب الزامی است.")
            if national_code and phone:
                # Verify OTP if provided
                if otp_code:
                    otp_valid = await IdentityService.verify_phone_otp(phone=phone, code=otp_code)
                    if not otp_valid:
                        raise BadRequestException("کد تایید پیامک‌شده (OTP) نامعتبر یا منقضی شده است.")

                # Verify national identity simulation (Shahkar)
                await IdentityService.verify_national_identity(
                    national_code=national_code,
                    phone=phone,
                    iban=sheba_number,
                    card_number=card_number,
                )
                is_verified = bool(otp_code)
        elif account_type == "crypto":
            if not crypto_wallet_address or not crypto_network:
                raise BadRequestException("آدرس کیف پول و نام شبکه رمزارز الزامی است.")
        else:
            raise BadRequestException("نوع حساب نامعتبر است.")

        account = SettlementAccount(
            user_id=user_id,
            account_type=account_type,
            sheba_number=sheba_number.strip() if sheba_number else None,
            card_number=card_number.strip() if card_number else None,
            account_holder=account_holder.strip() if account_holder else None,
            bank_name=bank_name.strip() if bank_name else None,
            national_code=national_code.strip() if national_code else None,
            phone=phone.strip() if phone else None,
            crypto_wallet_address=crypto_wallet_address.strip() if crypto_wallet_address else None,
            crypto_network=crypto_network.strip() if crypto_network else None,
            is_verified=is_verified,
            is_active=True,
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)
        return account

    @staticmethod
    async def list_settlement_accounts(
        db: AsyncSession, user_id: int
    ) -> list[SettlementAccount]:
        """List active settlement accounts of a user."""
        stmt = (
            select(SettlementAccount)
            .where(SettlementAccount.user_id == user_id, SettlementAccount.is_active == True)
            .order_by(desc(SettlementAccount.created_at))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def request_payout(
        db: AsyncSession, user_id: int, settlement_account_id: int, amount_toman: int
    ) -> WithdrawalRequest:
        """Deduct balance and queue a withdrawal payout request."""
        MIN_WITHDRAWAL_TOMAN = 50000

        if amount_toman < MIN_WITHDRAWAL_TOMAN:
            raise BadRequestException(f"حداقل مبلغ برداشت {MIN_WITHDRAWAL_TOMAN:,} تومان می‌باشد.")

        # Verify account belongs to user
        account_stmt = select(SettlementAccount).where(
            SettlementAccount.id == settlement_account_id,
            SettlementAccount.user_id == user_id,
            SettlementAccount.is_active == True,
        )
        account = (await db.execute(account_stmt)).scalar_one_or_none()
        if not account:
            raise NotFoundException("حساب تسویه مورد نظر یافت نشد یا غیرفعال است.")

        wallet = await WalletService.get_or_create_wallet(db, user_id)
        if wallet.withdrawable_balance_toman < amount_toman:
            raise BadRequestException("موجودی قابل برداشت کیف پول کافی نیست.")

        # Deduct balance
        wallet.withdrawable_balance_toman -= amount_toman
        wallet.total_withdrawn_toman += amount_toman

        withdrawal = WithdrawalRequest(
            user_id=user_id,
            settlement_account_id=settlement_account_id,
            amount_toman=amount_toman,
            status="pending",
        )
        db.add(withdrawal)
        await db.commit()
        await db.refresh(withdrawal)
        return withdrawal

    @staticmethod
    async def list_user_withdrawals(
        db: AsyncSession, user_id: int, page: int = 1, page_size: int = 20
    ) -> list[dict]:
        """Fetch withdrawal history for user dashboard."""
        stmt = (
            select(WithdrawalRequest, SettlementAccount)
            .outerjoin(SettlementAccount, WithdrawalRequest.settlement_account_id == SettlementAccount.id)
            .where(WithdrawalRequest.user_id == user_id)
            .order_by(desc(WithdrawalRequest.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        rows = (await db.execute(stmt)).all()

        results = []
        for w, acc in rows:
            card_or_sheba = None
            settlement_title = "حساب پیش‌فرض"
            account_type = "bank_iran"
            if acc:
                account_type = acc.account_type
                if acc.account_type == "bank_iran":
                    settlement_title = f"{acc.bank_name or 'بانک'} - {acc.account_holder or ''}"
                    card_or_sheba = acc.sheba_number or acc.card_number
                else:
                    settlement_title = f"کیف پول {acc.crypto_network or 'USDT'}"
                    card_or_sheba = acc.crypto_wallet_address

            results.append({
                "id": w.id,
                "amount_toman": w.amount_toman,
                "settlement_account_id": w.settlement_account_id,
                "settlement_title": settlement_title,
                "account_type": account_type,
                "card_or_sheba": card_or_sheba,
                "status": w.status,
                "admin_note": getattr(w, "admin_note", None),
                "created_at": w.created_at,
                "processed_at": getattr(w, "processed_at", None),
            })
        return results

    @staticmethod
    async def update_settlement_account(
        db: AsyncSession, user_id: int, account_id: int, data
    ) -> SettlementAccount:
        """Update settlement account details."""
        stmt = select(SettlementAccount).where(
            SettlementAccount.id == account_id,
            SettlementAccount.user_id == user_id,
        )
        acc = (await db.execute(stmt)).scalar_one_or_none()
        if not acc:
            raise NotFoundException("حساب تسویه مورد نظر یافت نشد.")

        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            if v is not None:
                setattr(acc, k, v)

        await db.commit()
        await db.refresh(acc)
        return acc

    @staticmethod
    async def delete_settlement_account(db: AsyncSession, user_id: int, account_id: int) -> dict:
        """Deactivate or remove user settlement account."""
        stmt = select(SettlementAccount).where(
            SettlementAccount.id == account_id,
            SettlementAccount.user_id == user_id,
        )
        acc = (await db.execute(stmt)).scalar_one_or_none()
        if not acc:
            raise NotFoundException("حساب تسویه مورد نظر یافت نشد.")

        # Check for pending withdrawals
        pending = (await db.execute(
            select(func.count(WithdrawalRequest.id)).where(
                WithdrawalRequest.settlement_account_id == account_id,
                WithdrawalRequest.status == "pending",
            )
        )).scalar() or 0
        if pending > 0:
            raise BadRequestException("امکان حذف حسابی که درخواست تسویه در صف انتظار دارد وجود ندارد.")

        acc.is_active = False
        await db.commit()
        return {"status": "success", "message": "حساب با موفقیت غیرفعال و حذف شد."}

    @staticmethod
    async def list_all_settlement_accounts_admin(
        db: AsyncSession, status_filter: str | None = None, page: int = 1, page_size: int = 50
    ) -> list[dict]:
        """List all settlement accounts for admin panel verification."""
        stmt = select(SettlementAccount, User).join(User, SettlementAccount.user_id == User.id)
        if status_filter == "verified":
            stmt = stmt.where(SettlementAccount.is_verified == True)
        elif status_filter == "pending":
            stmt = stmt.where(SettlementAccount.is_verified == False)

        stmt = stmt.order_by(desc(SettlementAccount.created_at)).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(stmt)).all()

        results = []
        for acc, user in rows:
            results.append({
                "id": acc.id,
                "user_id": acc.user_id,
                "user_name": user.full_name or user.username,
                "user_phone": user.phone,
                "account_type": acc.account_type,
                "sheba_number": acc.sheba_number,
                "card_number": acc.card_number,
                "account_holder": acc.account_holder,
                "bank_name": acc.bank_name,
                "national_code": acc.national_code,
                "phone": acc.phone,
                "crypto_wallet_address": acc.crypto_wallet_address,
                "crypto_network": acc.crypto_network,
                "is_verified": acc.is_verified,
                "is_active": acc.is_active,
                "created_at": acc.created_at,
            })
        return results

    @staticmethod
    async def _ensure_not_blacklisted_for_account(
        db: AsyncSession,
        user_id: int,
        account_holder: str | None = None,
        national_code: str | None = None,
    ) -> None:
        """Prevent blacklisted users or anyone using a blacklisted holder name/national code from adding payout accounts."""
        norm_holder = _normalize_identity_name(account_holder)
        norm_nc = _normalize_national_code(national_code)

        active_entries = (
            await db.execute(
                select(ReferralBlacklist).where(ReferralBlacklist.is_active == True)
            )
        ).scalars().all()

        for entry in active_entries:
            if entry.user_id == user_id:
                raise BadRequestException(
                    "امکان ثبت حساب تسویه وجود ندارد؛ حساب کاربری شما در لیست سیاه سامانه قرار دارد."
                )
            if norm_holder and entry.blocked_full_name:
                if _normalize_identity_name(entry.blocked_full_name) == norm_holder:
                    raise BadRequestException(
                        "امکان ثبت این حساب بانکی وجود ندارد؛ نام صاحب حساب یا کد ملی در لیست سیاه سامانه قرار دارد."
                    )
            if norm_nc and entry.blocked_national_code:
                if _normalize_national_code(entry.blocked_national_code) == norm_nc:
                    raise BadRequestException(
                        "امکان ثبت این حساب بانکی وجود ندارد؛ نام صاحب حساب یا کد ملی در لیست سیاه سامانه قرار دارد."
                    )

    @staticmethod
    async def block_user_in_referral(
        db: AsyncSession,
        admin_id: int,
        user_id: int,
        block_referral: bool = True,
        block_subscription: bool = False,
        reason: str = "",
        redis=None,
    ) -> dict:
        """Atomically blacklist/ghost a user in referrals and optionally cancel/ban their subscriptions."""
        if not block_referral and not block_subscription:
            raise BadRequestException("حداقل یکی از گزینه‌های مسدودسازی باید انتخاب شود.")

        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        # Collect full name and national code (falling back to latest bank settlement account if present)
        latest_acc = (
            await db.execute(
                select(SettlementAccount)
                .where(SettlementAccount.user_id == user_id, SettlementAccount.account_type == "bank_iran")
                .order_by(desc(SettlementAccount.created_at))
                .limit(1)
            )
        ).scalar_one_or_none()

        blocked_full_name = (
            user.full_name.strip()
            if user.full_name and user.full_name.strip()
            else (latest_acc.account_holder.strip() if latest_acc and latest_acc.account_holder else None)
        )
        blocked_national_code = (
            _normalize_national_code(latest_acc.national_code)
            if latest_acc and latest_acc.national_code
            else None
        ) or None

        existing = (
            await db.execute(
                select(ReferralBlacklist)
                .where(ReferralBlacklist.user_id == user_id, ReferralBlacklist.is_active == True)
                .order_by(desc(ReferralBlacklist.created_at))
                .limit(1)
            )
        ).scalar_one_or_none()

        clean_reason = reason.strip() if reason else None
        if existing:
            existing.admin_id = admin_id
            existing.block_referral = bool(existing.block_referral or block_referral)
            existing.block_subscription = bool(existing.block_subscription or block_subscription)
            if clean_reason:
                existing.reason = clean_reason
            existing.blocked_full_name = blocked_full_name or existing.blocked_full_name
            existing.blocked_national_code = blocked_national_code or existing.blocked_national_code
            blacklist_entry = existing
        else:
            blacklist_entry = ReferralBlacklist(
                user_id=user_id,
                admin_id=admin_id,
                block_referral=block_referral,
                block_subscription=block_subscription,
                reason=clean_reason,
                blocked_full_name=blocked_full_name,
                blocked_national_code=blocked_national_code,
                is_active=True,
            )
            db.add(blacklist_entry)

        if blacklist_entry.block_referral:
            user.is_referral_blocked = True

        cancelled_subs_count = 0
        if blacklist_entry.block_subscription:
            user.is_subscription_banned = True
            now = datetime.now(timezone.utc)
            cancel_stmt = (
                update(UserSubscription)
                .where(UserSubscription.user_id == user_id, UserSubscription.status == "active")
                .values(status="cancelled", end_date=now)
            )
            cancel_res = await db.execute(cancel_stmt)
            cancelled_subs_count = int(getattr(cancel_res, "rowcount", 0) or 0)

        await db.commit()
        await db.refresh(blacklist_entry)

        if blacklist_entry.block_subscription and redis is not None:
            try:
                await redis.delete(f"drgame:user:{user_id}:quota")
            except Exception:
                pass

        return {
            "status": "success",
            "message": "کاربر با موفقیت در سیستم مسدود شد.",
            "blacklist_id": blacklist_entry.id,
            "user_id": user_id,
            "block_referral": blacklist_entry.block_referral,
            "block_subscription": blacklist_entry.block_subscription,
            "cancelled_subscriptions_count": cancelled_subs_count,
        }

    @staticmethod
    async def unblock_user_in_referral(
        db: AsyncSession,
        admin_id: int,
        user_id: int,
        redis=None,
    ) -> dict:
        """Remove a user from active referral blacklist and restore normal referral/subscription flags."""
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            raise NotFoundException("کاربر مورد نظر یافت نشد.")

        active_records = (
            await db.execute(
                select(ReferralBlacklist).where(
                    ReferralBlacklist.user_id == user_id,
                    ReferralBlacklist.is_active == True,
                )
            )
        ).scalars().all()

        if not active_records and not user.is_referral_blocked and not user.is_subscription_banned:
            raise NotFoundException("کاربر در لیست سیاه فعال یافت نشد.")

        now = datetime.now(timezone.utc)
        for rec in active_records:
            rec.is_active = False
            rec.unblocked_at = now
            rec.unblocked_by_admin_id = admin_id

        user.is_referral_blocked = False
        user.is_subscription_banned = False
        await db.commit()

        if redis is not None:
            try:
                await redis.delete(f"drgame:user:{user_id}:quota")
            except Exception:
                pass

        return {
            "status": "success",
            "message": "کاربر با موفقیت از لیست سیاه خارج و رفع مسدودیت شد.",
            "user_id": user_id,
        }

    @staticmethod
    async def list_referral_blacklist(
        db: AsyncSession,
        page: int = 1,
        limit: int = 50,
        active_only: bool = True,
        search: str | None = None,
    ) -> dict:
        """List referral blacklist records with user and admin metadata."""
        from app.modules.admin.models import ReferralAdmin

        base_stmt = select(ReferralBlacklist).outerjoin(User, ReferralBlacklist.user_id == User.id)
        if active_only:
            base_stmt = base_stmt.where(ReferralBlacklist.is_active == True)

        if search and search.strip():
            q = search.strip()
            term = f"%{q}%"
            conditions = [
                User.username.ilike(term),
                User.full_name.ilike(term),
                User.phone.ilike(term),
                ReferralBlacklist.blocked_full_name.ilike(term),
                ReferralBlacklist.blocked_national_code.ilike(term),
                ReferralBlacklist.reason.ilike(term),
            ]
            if q.isdigit():
                conditions.append(ReferralBlacklist.user_id == int(q))
            base_stmt = base_stmt.where(or_(*conditions))

        total = (await db.execute(select(func.count()).select_from(base_stmt.subquery()))).scalar() or 0

        records = (
            await db.execute(
                base_stmt.order_by(desc(ReferralBlacklist.created_at))
                .offset((page - 1) * limit)
                .limit(limit)
            )
        ).scalars().all()

        user_ids = list({r.user_id for r in records})
        admin_ids = list({r.admin_id for r in records if r.admin_id is not None})

        users_map: dict[int, User] = {}
        if user_ids:
            u_rows = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
            users_map = {u.id: u for u in u_rows}

        admins_map: dict[int, str] = {}
        if admin_ids:
            a_rows = (
                await db.execute(select(ReferralAdmin.id, ReferralAdmin.username).where(ReferralAdmin.id.in_(admin_ids)))
            ).all()
            admins_map = {a.id: a.username for a in a_rows}

        items = []
        for r in records:
            u = users_map.get(r.user_id)
            items.append(
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "username": u.username if u else f"user_{r.user_id}",
                    "full_name": (u.full_name if u and u.full_name else r.blocked_full_name) or "",
                    "phone": u.phone if u else None,
                    "blocked_national_code": r.blocked_national_code,
                    "block_referral": r.block_referral,
                    "block_subscription": r.block_subscription,
                    "reason": r.reason,
                    "is_active": r.is_active,
                    "blocked_at": r.created_at.isoformat() if r.created_at else None,
                    "unblocked_at": r.unblocked_at.isoformat() if r.unblocked_at else None,
                    "admin_id": r.admin_id,
                    "admin_username": admins_map.get(r.admin_id) if r.admin_id else None,
                }
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
        }

