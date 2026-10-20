from datetime import datetime
from decimal import Decimal
from typing import List
from sqlalchemy import BigInteger, Boolean, DateTime, Integer, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SubscriptionTier(Base):
    __tablename__ = "subscription_tiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # Free, Bronze, Silver, Gold
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(15, 0), default=Decimal("0"))  # Tomans / 30 days
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    quota_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    max_download_speed_mbps: Mapped[int] = mapped_column(Integer, default=20)
    allowed_platforms: Mapped[List[str]] = mapped_column(JSON, default=list)  # ["PS4", "PS5"]
    features: Mapped[List[str]] = mapped_column(JSON, default=list)
    limitations: Mapped[List[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    tier_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_quota_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    used_quota_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
