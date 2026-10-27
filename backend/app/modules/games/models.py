"""Game catalog, genres, interactions, and download links database models."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Float, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory

class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rawg_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    name_fa: Mapped[str] = mapped_column(String(100), nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    image_background: Mapped[str | None] = mapped_column(String(500), nullable=True)

class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    rawg_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    title_fa: Mapped[str] = mapped_column(String(200), nullable=False)
    title_en: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)

    description_fa: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    storyline_fa: Mapped[str | None] = mapped_column(Text, nullable=True)

    released: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    metacritic: Mapped[int | None] = mapped_column(Integer, index=True, nullable=True)
    download_size_gb: Mapped[float] = mapped_column(Float, default=0.0, index=True)

    is_two_player: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    has_vr: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    platforms: Mapped[list] = mapped_column(JSON, default=list)  # ["PS5", "PS4", "Xbox", "Switch"]
    genres: Mapped[list] = mapped_column(JSON, default=list)

    publisher: Mapped[str | None] = mapped_column(String(150), nullable=True)
    developer: Mapped[str | None] = mapped_column(String(150), nullable=True)
    awards: Mapped[list] = mapped_column(JSON, default=list)

    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    screenshots: Mapped[list] = mapped_column(JSON, default=list)

    likes_count: Mapped[int] = mapped_column(Integer, default=0, index=True)
    dislikes_count: Mapped[int] = mapped_column(Integer, default=0)
    wishlist_count: Mapped[int] = mapped_column(Integer, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class GameInteraction(Base):
    __tablename__ = "game_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Modular monolith: raw integer references without cross-module FK constraints
    game_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    interaction_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # "like", "dislike", "wishlist"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

class GameDownloadLink(Base):
    __tablename__ = "game_download_links"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    part_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    part_name: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size_gb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    download_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
