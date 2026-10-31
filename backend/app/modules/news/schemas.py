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


class BlogPostCreate(BaseModel):
    title_fa: str
    title_en: str | None = None
    slug: str | None = None
    category_id: int
    content_fa: str
    content_en: str | None = None
    cover_image_url: str
    author_name: str = "تیم تحریریه دکتر گیم"
    reading_time_min: int = 5
    is_published: bool = True


class BlogPostUpdate(BaseModel):
    title_fa: str | None = None
    title_en: str | None = None
    slug: str | None = None
    category_id: int | None = None
    content_fa: str | None = None
    content_en: str | None = None
    cover_image_url: str | None = None
    author_name: str | None = None
    reading_time_min: int | None = None
    is_published: bool | None = None


class BlogCategoryCreate(BaseModel):
    name_fa: str
    name_en: str
    slug: str


class BlogCategoryUpdate(BaseModel):
    name_fa: str | None = None
    name_en: str | None = None
    slug: str | None = None
