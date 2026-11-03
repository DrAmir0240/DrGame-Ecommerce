"""Pydantic schemas for catalog synchronization."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CatalogSyncRequest(BaseModel):
    platforms: List[str] = Field(
        default=["PS5", "PS4"],
        description="List of platforms: PS5, PS4, Xbox, Switch"
    )
    date_from: Optional[str] = Field(
        None,
        description="Start release date (YYYY-MM-DD)"
    )
    date_to: Optional[str] = Field(
        None,
        description="End release date (YYYY-MM-DD)"
    )
    min_rating: float = Field(
        default=0.0,
        ge=0.0,
        le=5.0,
        description="Minimum user rating on a 5-point scale"
    )
    sort_by: str = Field(
        default="release_date_desc",
        description="Sorting strategy: release_date_desc, release_date_asc, rating_desc"
    )
    count: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of games to ingest"
    )


class CatalogGameItem(BaseModel):
    id: int
    source_id: str
    title_en: str
    slug: str
    released: Optional[str] = None
    rating: float = 0.0
    metacritic: Optional[int] = None
    platforms: List[str] = []
    genres: List[str] = []
    cover_image_url: Optional[str] = None
    is_updated: bool = False


class CatalogSyncResponse(BaseModel):
    success: bool
    job_id: int
    status: str = "in_progress"
    imported_count: int = 0
    updated_count: int = 0
    total_count: int = 0
    message: str
    games: List[CatalogGameItem] = []


class CatalogProgressResponse(BaseModel):
    job_id: int
    status: str  # in_progress, completed, failed, idle
    current: int = 0
    total: int = 0
    percentage: int = 0
    current_game: Optional[str] = None
    imported_count: int = 0
    updated_count: int = 0
    error_message: Optional[str] = None
    recent_games: List[CatalogGameItem] = []
    message: Optional[str] = None


class CatalogSyncJobResponse(BaseModel):
    id: int
    status: str
    platforms: List[str] = []
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    min_rating: float = 0.0
    sort_by: str
    requested_count: int
    imported_count: int = 0
    updated_count: int = 0
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class CatalogWipeResponse(BaseModel):
    success: bool
    deleted_games_count: int
    message: str
