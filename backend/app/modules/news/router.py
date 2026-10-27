"""Blog, news and tutorial articles router."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.dependencies import get_current_user, get_optional_current_user
from app.modules.users.models import User
from app.modules.news.schemas import (
    BlogCategoryOut,
    BlogPostListResponse,
    BlogPostDetailOut,
    BlogInteractionResponse,
)
from app.modules.news.services import NewsService

router = APIRouter(tags=["Blog & News"])


@router.get("/categories", response_model=List[BlogCategoryOut], status_code=status.HTTP_200_OK)
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """List all blog categories (Tutorials, News, Reviews)."""
    return await NewsService.get_categories(db, redis)


@router.get("/posts", response_model=BlogPostListResponse, status_code=status.HTTP_200_OK)
async def list_posts(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    category: str | None = Query(None, description="Category slug filter"),
    search: str | None = Query(None, description="Search query string"),
    sort: str = Query("newest", description="Sorting: newest, popular, views"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
):
    """Retrieve paginated blog posts with category and search filters."""
    return await NewsService.list_posts(
        db=db,
        redis=redis,
        category_slug=category,
        search=search,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/posts/{post_id_or_slug}", response_model=BlogPostDetailOut, status_code=status.HTTP_200_OK)
async def get_post_detail(
    post_id_or_slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)],
):
    """Fetch complete article details by id or slug and increment views count."""
    user_id = current_user.id if current_user else None
    return await NewsService.get_post_detail(
        db=db,
        post_id_or_slug=post_id_or_slug,
        user_id=user_id,
        redis=redis,
    )


@router.post("/posts/{post_id}/like", response_model=BlogInteractionResponse, status_code=status.HTTP_200_OK)
async def like_post(
    post_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Toggle like on an article (Green thumb)."""
    return await NewsService.toggle_interaction(
        db=db,
        post_id=post_id,
        user_id=current_user.id,
        target_action="like",
        redis=redis,
    )


@router.post("/posts/{post_id}/dislike", response_model=BlogInteractionResponse, status_code=status.HTTP_200_OK)
async def dislike_post(
    post_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Toggle dislike on an article (Red thumb)."""
    return await NewsService.toggle_interaction(
        db=db,
        post_id=post_id,
        user_id=current_user.id,
        target_action="dislike",
        redis=redis,
    )
