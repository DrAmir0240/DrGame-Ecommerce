"""Home banner database model for double hero carousels."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class HomeBanner(Base):
    """Slide item for Homepage Double Hero Banners (Position 1: AAA games, Position 2: Platform services)."""
    __tablename__ = "home_banners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    position: Mapped[int] = mapped_column(Integer, default=1, index=True, nullable=False)  # 1 for AAA Games, 2 for Services
    badge: Mapped[str] = mapped_column(String(100), nullable=False)
    title_fa: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    backdrop_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    link_href: Mapped[str] = mapped_column(String(500), nullable=False)
    cta_text: Mapped[str] = mapped_column(String(100), default="مشاهده و دانلود", nullable=False)
    platforms: Mapped[list] = mapped_column(JSON, default=list)  # e.g. ["PS5", "PS4"]
    display_order: Mapped[int] = mapped_column(Integer, default=1, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
