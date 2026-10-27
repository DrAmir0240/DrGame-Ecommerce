"""Pydantic schemas for homepage hero banners."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class HomeBannerBase(BaseModel):
    position: int = Field(default=1, ge=1, le=2, description="1: AAA Games, 2: Platform Services")
    badge: str = Field(..., max_length=100)
    title_fa: str = Field(..., max_length=200)
    title_en: Optional[str] = Field(None, max_length=200)
    description: str
    backdrop_url: str = Field(..., max_length=1000)
    link_href: str = Field(..., max_length=500)
    cta_text: str = Field(default="مشاهده و دانلود", max_length=100)
    platforms: List[str] = Field(default_factory=list)
    display_order: int = Field(default=1)
    is_active: bool = True


class HomeBannerCreate(HomeBannerBase):
    pass


class HomeBannerUpdate(BaseModel):
    position: Optional[int] = Field(None, ge=1, le=2)
    badge: Optional[str] = Field(None, max_length=100)
    title_fa: Optional[str] = Field(None, max_length=200)
    title_en: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    backdrop_url: Optional[str] = Field(None, max_length=1000)
    link_href: Optional[str] = Field(None, max_length=500)
    cta_text: Optional[str] = Field(None, max_length=100)
    platforms: Optional[List[str]] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class HomeBannerOut(HomeBannerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupedHomeBannersResponse(BaseModel):
    position_1: List[HomeBannerOut]
    position_2: List[HomeBannerOut]
