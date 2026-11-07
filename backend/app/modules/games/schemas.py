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
    source_id: Optional[str] = None
    rawg_id: Optional[int] = None
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
    ps5_title_id: Optional[str] = None
    ps4_title_id: Optional[str] = None
    storage_sync_status: Optional[str] = "unknown"
    file_size_bytes: Optional[int] = None
    sha256_checksum: Optional[str] = None

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


# --- Step 19: Dynamic Game Downloads & Firmware Engine Schemas ---

class StorageFormatItemOut(BaseModel):
    job_id: str
    title: str
    tag: Optional[str] = None
    platform: str
    format_category: str  # "fpkg" (FW <= 11.40) or "fat32" (FW > 11.40)
    download_format: str
    content_format: str
    size_bytes: int
    size_gb: float
    sha256: Optional[str] = None
    release_version: Optional[str] = "v1.00"
    status: str = "ready"


class ClientDeviceOut(BaseModel):
    platform: str
    firmware: Optional[float] = None
    recommended_format: Optional[str] = None
    is_console: bool = False
    display_notice: str


class GameDownloadOptionsOut(BaseModel):
    game_id: int
    title_fa: str
    title_en: str
    slug: str
    ps5_title_id: Optional[str] = None
    ps4_title_id: Optional[str] = None
    storage_sync_status: str
    client_device: ClientDeviceOut
    recommended_job_id: Optional[str] = None
    recommended_format: Optional[str] = None
    available_formats: List[StorageFormatItemOut] = []


class HandoffExecuteRequest(BaseModel):
    job_id: str
    handoff_secret: str
    selected_format: Optional[str] = None  # "fpkg" or "fat32"


class HandoffExecuteResponse(BaseModel):
    success: bool
    game_id: int
    job_id: str
    format_category: str
    size_gb: float
    remaining_quota_gb: float
    message: str


class GameDownloadTicketRequest(BaseModel):
    job_id: Optional[str] = None
    format_category: Optional[str] = None  # "fpkg" | "fat32"
    file_id: Optional[int] = None


class GameDownloadTicketResponse(BaseModel):
    status: str = "success"
    download_url: str
    file_title: str
    file_size_gb: float
    remaining_quota_gb: float
    job_id: Optional[str] = None
    format_category: Optional[str] = None
    file_id: Optional[int] = None
    message: str


