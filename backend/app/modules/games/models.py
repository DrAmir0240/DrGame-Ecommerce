from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Float, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    studio: Mapped[str] = mapped_column(String(150), nullable=False)
    genre_fa: Mapped[str] = mapped_column(String(100), nullable=False)
    genre_en: Mapped[str] = mapped_column(String(100), nullable=False)
    platforms: Mapped[List[str]] = mapped_column(JSON, default=list)  # ["PS5", "PS4"]
    size_gb: Mapped[float] = mapped_column(Float, nullable=False)
    metacritic: Mapped[int] = mapped_column(Integer, default=0)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mode: Mapped[str] = mapped_column(String(50), default="تک‌نفره")
    status: Mapped[str] = mapped_column(String(50), default="منتشر شده")
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class GameFile(Base):
    __tablename__ = "game_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    part_name: Mapped[str] = mapped_column(String(150), nullable=False)
    part_number: Mapped[int] = mapped_column(Integer, default=1)
    size_gb: Mapped[float] = mapped_column(Float, nullable=False)
    sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    download_url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
