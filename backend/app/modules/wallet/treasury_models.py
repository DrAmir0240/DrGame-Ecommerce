"""Treasury pool and logs for unallocated referral commissions."""
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, BigInteger
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ReferralTreasuryPool(Base):
    """Platform treasury pool collecting leftover commissions from referral halving chain."""
    __tablename__ = "referral_treasury_pool"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    balance_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_collected_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_distributed_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class TreasuryLog(Base):
    """Audit logs for incoming/outgoing treasury pool transactions."""
    __tablename__ = "treasury_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    amount_toman: Mapped[int] = mapped_column(BigInteger, nullable=False)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "deposit_leftover", "admin_reset", "admin_reward"
    order_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
