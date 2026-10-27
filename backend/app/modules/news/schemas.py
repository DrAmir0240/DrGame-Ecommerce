"""Pydantic schemas for blog posts, categories, and interactions."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BlogCategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name_fa: str
    name_en: str
    slug: str


class BlogPostCardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title_fa: str
    title_en: str
    slug: str
    category_id: int
    category_name: str
    category_slug: str
    cover_image_url: str
    author_name: str
    reading_time_min: int
    likes_count: int
    dislikes_count: int
    views_count: int
    summary: str
    created_at: datetime


class BlogPostListResponse(BaseModel):
    items: list[BlogPostCardOut]
    total: int
    page: int
    page_size: int


class BlogPostDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title_fa: str
    title_en: str
    slug: str
    category_id: int
    category_name: str
    category_slug: str
    content_fa: str
    content_en: str | None = None
    cover_image_url: str
    author_name: str
    reading_time_min: int
    likes_count: int
    dislikes_count: int
    views_count: int
    user_interaction: str | None = None
    created_at: datetime


class BlogInteractionResponse(BaseModel):
    status: str
    current_state: str | None
    likes_count: int
    dislikes_count: int
