"""5-type download files and user download history models."""
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Float, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class GameDownloadFile(Base):
    """Specific download file (official data, cheat, dlc, subtitle, dubbing) for a game."""
    __tablename__ = "game_download_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)  # "data", "cheat", "dlc", "subtitle", "dubbing"
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    file_size_gb: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    download_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    allowed_tiers: Mapped[list] = mapped_column(JSON, default=lambda: ["gold", "silver", "bronze"])
    version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class UserDownloadHistory(Base):
    """User download audit record tracking quota consumption."""
    __tablename__ = "user_download_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    game_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    file_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_title: Mapped[str] = mapped_column(String(150), nullable=False)
    file_size_gb: Mapped[float] = mapped_column(Float, nullable=False)
    downloaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )
