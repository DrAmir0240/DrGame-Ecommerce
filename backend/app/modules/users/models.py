from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(300), nullable=True)
    gamer_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Gamification attributes
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    total_playtime_hours: Mapped[int] = mapped_column(Integer, default=0)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)

    # Wallet
    wallet_balance: Mapped[Decimal] = mapped_column(Numeric(15, 0), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
