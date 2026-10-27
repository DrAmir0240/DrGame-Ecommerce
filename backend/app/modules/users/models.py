"""User database model definition."""
import secrets
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.modules.users.notification_models import UserNotification

def generate_console_code() -> str:
    """Generate 7-character alphanumeric code for console quick auth (e.g. 7X9K2PL)."""
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # Exclude ambiguous characters 0, O, 1, I
    return "".join(secrets.choice(alphabet) for _ in range(7))

def generate_referral_code() -> str:
    """Generate 8-character unique referral code (e.g. REF8X92K)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(8))

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    console_auth_code: Mapped[str] = mapped_column(String(10), unique=True, index=True, default=generate_console_code)
    referral_code: Mapped[str] = mapped_column(String(12), unique=True, index=True, default=generate_referral_code)
    
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    hero_banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_preset_avatar: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_referral_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
