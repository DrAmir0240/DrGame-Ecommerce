"""Quota calculation and consumption log database models."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Float, BigInteger
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class UserQuota(Base):
    __tablename__ = "user_quotas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    total_quota_gb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    used_quota_gb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    remaining_quota_gb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

class QuotaConsumptionLog(Base):
    __tablename__ = "quota_consumption_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    bytes_downloaded: Mapped[int] = mapped_column(BigInteger, nullable=False)
    gb_deducted: Mapped[float] = mapped_column(Float, nullable=False)
    download_server_id: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
