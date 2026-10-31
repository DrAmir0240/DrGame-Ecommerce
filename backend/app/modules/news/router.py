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


# ── Admin Blog Router ──────────────────────────────────────────────────────────

from app.core.admin_dependencies import get_current_admin
from app.modules.auth.admin_models import AdminUser
from app.modules.news.schemas import (
    BlogPostCreate,
    BlogPostUpdate,
    BlogCategoryCreate,
    BlogCategoryUpdate,
)

admin_blog_router = APIRouter(prefix="/admin/blog", tags=["Admin Blog"])


@admin_blog_router.get("/posts", status_code=status.HTTP_200_OK)
async def admin_list_posts(
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = Query(None),
    category_id: int | None = Query(None),
    is_published: bool | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List blog posts for admin panel."""
    return await NewsService.admin_list_posts(
        db=db,
        search=search,
        category_id=category_id,
        is_published=is_published,
        page=page,
        page_size=page_size,
    )


@admin_blog_router.post("/posts", status_code=status.HTTP_201_CREATED)
async def admin_create_post(
    data: BlogPostCreate,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Create new blog post as admin."""
    post = await NewsService.create_post(db=db, data=data, redis=redis)
    return {"status": "success", "id": post.id, "slug": post.slug}


@admin_blog_router.get("/posts/{post_id}", status_code=status.HTTP_200_OK)
async def admin_get_post(
    post_id: int,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Get single post for admin editor."""
    return await NewsService.get_post_detail(db=db, post_id_or_slug=str(post_id), user_id=None, redis=redis)


@admin_blog_router.put("/posts/{post_id}", status_code=status.HTTP_200_OK)
async def admin_update_post(
    post_id: int,
    data: BlogPostUpdate,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Update blog post as admin."""
    post = await NewsService.update_post(db=db, post_id=post_id, data=data, redis=redis)
    return {"status": "success", "id": post.id, "slug": post.slug}


@admin_blog_router.delete("/posts/{post_id}", status_code=status.HTTP_200_OK)
async def admin_delete_post(
    post_id: int,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Delete blog post."""
    return await NewsService.delete_post(db=db, post_id=post_id, redis=redis)


@admin_blog_router.post("/categories", status_code=status.HTTP_201_CREATED)
async def admin_create_category(
    data: BlogCategoryCreate,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Create new blog category."""
    cat = await NewsService.create_category(db=db, data=data, redis=redis)
    return {"status": "success", "id": cat.id, "slug": cat.slug}


@admin_blog_router.put("/categories/{category_id}", status_code=status.HTTP_200_OK)
async def admin_update_category(
    category_id: int,
    data: BlogCategoryUpdate,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Update blog category."""
    cat = await NewsService.update_category(db=db, category_id=category_id, data=data, redis=redis)
    return {"status": "success", "id": cat.id, "slug": cat.slug}


@admin_blog_router.delete("/categories/{category_id}", status_code=status.HTTP_200_OK)
async def admin_delete_category(
    category_id: int,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Delete blog category."""
    return await NewsService.delete_category(db=db, category_id=category_id, redis=redis)

