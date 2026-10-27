"""Pydantic V2 schemas for game catalog, genres, and interactions."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class GenreOut(BaseModel):
    id: int
    rawg_id: Optional[int] = None
    name_fa: str
    name_en: str
    slug: str
    icon_name: Optional[str] = None
    display_order: int = 0
    is_top8: bool = False
    is_active: bool = True
    image_background: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class GenreCreate(BaseModel):
    name_fa: str = Field(..., min_length=2, max_length=100)
    name_en: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    icon_name: Optional[str] = None
    display_order: int = 0
    is_top8: bool = False
    is_active: bool = True
    image_background: Optional[str] = None


class GenreUpdate(BaseModel):
    name_fa: Optional[str] = None
    name_en: Optional[str] = None
    slug: Optional[str] = None
    icon_name: Optional[str] = None
    display_order: Optional[int] = None
    is_top8: Optional[bool] = None
    is_active: Optional[bool] = None
    image_background: Optional[str] = None

class GameDownloadLinkOut(BaseModel):
    id: int
    part_number: int
    part_name: str
    file_size_gb: float
    download_url: str

    model_config = ConfigDict(from_attributes=True)

class GameCardOut(BaseModel):
    id: int
    rawg_id: int
    title_fa: str
    title_en: str
    slug: str
    rating: float
    metacritic: Optional[int] = None
    download_size_gb: float
    is_two_player: bool
    has_vr: bool
    platforms: List[str] = []
    genres: List[str] = []
    cover_image_url: Optional[str] = None
    released: Optional[str] = None
    likes_count: int = 0
    wishlist_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class GameDetailOut(GameCardOut):
    description_fa: Optional[str] = None
    description_en: Optional[str] = None
    storyline_fa: Optional[str] = None
    banner_image_url: Optional[str] = None
    developer: Optional[str] = None
    publisher: Optional[str] = None
    awards: List[str] = []
    released: Optional[str] = None
    screenshots: List[str] = []
    download_links: List[GameDownloadLinkOut] = []
    user_interaction: Optional[str] = None  # "like", "dislike", None
    in_wishlist: bool = False

    model_config = ConfigDict(from_attributes=True)

class PaginatedGamesResponse(BaseModel):
    items: List[GameCardOut]
    total: int
    page: int
    page_size: int
    total_pages: int

class InteractionResponse(BaseModel):
    game_id: int
    likes_count: int
    dislikes_count: int
    wishlist_count: int
    user_interaction: Optional[str] = None  # "like", "dislike", None
    in_wishlist: bool = False


class GameDownloadFileCreate(BaseModel):
    file_type: str = Field(..., pattern="^(data|cheat|dlc|subtitle|dubbing)$")
    title: str = Field(..., max_length=150)
    file_size_gb: float = Field(..., ge=0.0)
    download_url: str = Field(..., max_length=1000)
    allowed_tiers: List[str] = Field(default=["gold", "silver", "bronze"])
    version: Optional[str] = None
    is_active: bool = True


class GameDownloadFileOut(BaseModel):
    id: int
    game_id: int
    file_type: str
    title: str
    file_size_gb: float
    download_url: str
    allowed_tiers: List[str]
    version: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GenerateDownloadResponse(BaseModel):
    status: str
    file_id: int
    game_id: int
    file_type: str
    file_title: str
    file_size_gb: float
    download_url: str
    remaining_quota_gb: float
    message: str


class UserDownloadHistoryOut(BaseModel):
    id: int
    user_id: int
    game_id: int
    game_title: str
    game_title_en: str
    cover_url: Optional[str] = None
    file_id: int
    file_type: str
    part_name: str
    file_title: str
    file_size_gb: float
    downloaded_at: datetime
    status: str = "completed"

    model_config = ConfigDict(from_attributes=True)

