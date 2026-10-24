from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class GameFileOut(BaseModel):
    id: int
    game_id: int
    part_name: str
    part_number: int
    size_gb: float
    sha256: Optional[str] = None
    ready: bool = True

    class Config:
        from_attributes = True


class GameOut(BaseModel):
    id: int
    slug: str
    title: str
    studio: str
    genre_fa: str
    genre_en: str
    platforms: List[str]
    size_gb: float
    metacritic: int
    year: int
    image: str
    description: Optional[str] = None
    mode: str = "تک‌نفره"
    status: str = "منتشر شده"
    is_featured: bool = False

    class Config:
        from_attributes = True


class GameDetailOut(GameOut):
    files: List[GameFileOut] = []


class GameListResponse(BaseModel):
    items: List[GameOut]
    total: int
    page: int
    limit: int
    pages: int


class DownloadTokenOut(BaseModel):
    download_url: str
    part_id: int
    part_name: str
    size_gb: float
    expires_in_seconds: int
    remaining_quota_gb: float
