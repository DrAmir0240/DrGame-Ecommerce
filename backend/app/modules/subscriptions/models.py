"""Subscription tiers, user subscriptions, free-tier allowed games, and discount codes models."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class SubscriptionTier(Base):
    __tablename__ = "subscription_tiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)  # "free", "bronze", "silver", "gold"
    name_fa: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    price_toman: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    quota_gb: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    speed_limit_mbps: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    allowed_platforms: Mapped[list] = mapped_column(JSON, default=list)  # ["PS4", "PS5"]
    
    allow_dlc: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_subtitles: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_themes: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    tier_code: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)  # start_date + 30 days
    status: Mapped[str] = mapped_column(String(20), default="active", index=True, nullable=False)  # "active", "expired", "cancelled"
    payment_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

class FreeTierAllowedGame(Base):
    __tablename__ = "free_tier_allowed_games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class DiscountCode(Base):
    __tablename__ = "discount_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    discount_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_discount_toman: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fixed_discount_toman: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    usage_limit: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class OrderPayment(Base):
    __tablename__ = "order_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    tier_code: Mapped[str] = mapped_column(String(30), nullable=False)
    original_price: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    final_price: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_code_used: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(30), default="simulation")  # "simulation", "zarinpal", "crypto_usdt"
    transaction_ref: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="paid", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
