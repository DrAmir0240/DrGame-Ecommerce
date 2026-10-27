"""Wallet and referral waterfall commission services."""
from datetime import datetime, timezone
from sqlalchemy import select, func, desc
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
)
from app.modules.wallet.treasury_models import ReferralTreasuryPool, TreasuryLog
from app.modules.subscriptions.models import UserSubscription, OrderPayment
from app.modules.users.models import User


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

        # Find referrer by code
        referrer_stmt = select(User).where(User.referral_code == referral_code.strip())
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

        # Fetch visible upline chain with pass-through bypass for hidden referrers
        uplines = await cls.get_upline_chain(db, buyer_id, max_levels=50, include_hidden=False)

        for level, upline_id in enumerate(uplines, start=1):
            share = current_fraction_pool // 2
            if share < 1:
                break

            current_fraction_pool -= share

            # Check subscription if required
            has_sub = True
            if require_active_subscription:
                has_sub = await cls.is_subscription_active(db, upline_id)

            if has_sub:
                distributed_sum += share

                # Credit to upline user wallet
                wallet = await cls.get_or_create_wallet(db, upline_id)
                wallet.withdrawable_balance_toman += share
                wallet.total_earned_toman += share

                ledger = CommissionLedger(
                    order_payment_id=order_payment_id or 0,
                    beneficiary_type="user",
                    user_id=upline_id,
                    tier_level=level,
                    amount_toman=share,
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
        amount_toman = paid_amount // 10 if paid_amount >= 10000 else paid_amount
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

        return {
            "referral_code": user.referral_code,
            "withdrawable_balance_toman": wallet.withdrawable_balance_toman,
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
            .where(CommissionLedger.user_id == user_id)
            .order_by(desc(CommissionLedger.created_at))
            .offset(offset)
            .limit(page_size)
        )
        items = (await db.execute(stmt)).scalars().all()

        count_stmt = select(func.count(CommissionLedger.id)).where(
            CommissionLedger.user_id == user_id
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
