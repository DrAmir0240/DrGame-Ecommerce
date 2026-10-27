"""Wallet, multi-tier referral tree, commission ledger, and settlement account models."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.modules.wallet.treasury_models import ReferralTreasuryPool, TreasuryLog


class UserWallet(Base):
    __tablename__ = "user_wallets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    withdrawable_balance_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_earned_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_withdrawn_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class ReferralChain(Base):
    __tablename__ = "referral_chains"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    referrer_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class CommissionLedger(Base):
    __tablename__ = "commission_ledgers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_payment_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    beneficiary_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "user", "ceo", "reserve"
    user_id: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    tier_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    amount_toman: Mapped[int] = mapped_column(BigInteger, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class SettlementAccount(Base):
    __tablename__ = "settlement_accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    account_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "bank_iran", "crypto"

    # Iranian Sheba & Card info
    sheba_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    card_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    account_holder: Mapped[str | None] = mapped_column(String(150), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    national_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Crypto Wallet info
    crypto_wallet_address: Mapped[str | None] = mapped_column(String(150), nullable=True)
    crypto_network: Mapped[str | None] = mapped_column(String(30), nullable=True)  # e.g. "TRC20", "ERC20"

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    settlement_account_id: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_toman: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)  # "pending", "approved", "rejected"
    admin_receipt_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
