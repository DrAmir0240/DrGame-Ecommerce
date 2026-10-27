"""Game catalog router: list, filters, details, likes, and wishlist."""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.dependencies import get_current_user, get_optional_current_user
from app.modules.users.models import User
from app.modules.games.models import Genre
from app.modules.games.schemas import (
    GameCardOut,
    GameDetailOut,
    PaginatedGamesResponse,
    InteractionResponse,
    GenreOut,
    GameDownloadFileOut,
    GenerateDownloadResponse,
)
from app.modules.games.services import GamesService

router = APIRouter(tags=["Games Catalog"])

@router.get("", response_model=PaginatedGamesResponse, status_code=status.HTTP_200_OK)
async def list_games(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    search: Optional[str] = Query(None, description="Search by title"),
    genre: Optional[str] = Query(None, description="Filter by genre slug"),
    platform: Optional[str] = Query(None, description="Filter by platform (PS5, PS4, Xbox, Switch)"),
    max_size: Optional[float] = Query(None, description="Maximum download size in GB"),
    min_rating: Optional[float] = Query(None, description="Minimum RAWG rating (0 to 5)"),
    is_two_player: Optional[bool] = Query(None, description="Filter for 2-player / co-op games"),
    has_vr: Optional[bool] = Query(None, description="Filter for VR supported games"),
    release_status: Optional[str] = Query(None, description="Filter by release status: 'released' or 'early'"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    size: Optional[int] = Query(None, description="Alias for page_size"),
):
    """Retrieve filtered games catalog with Redis caching."""
    effective_page_size = min(max(size, 1), 100) if size is not None else page_size
    return await GamesService.get_catalog(
        db=db,
        redis=redis,
        search=search,
        genre=genre,
        platform=platform,
        max_size_gb=max_size,
        min_rating=min_rating,
        is_two_player=is_two_player,
        has_vr=has_vr,
        release_status=release_status,
        page=page,
        page_size=effective_page_size,
    )

@router.get("/genres", response_model=List[GenreOut], status_code=status.HTTP_200_OK)
@router.get("/genres/list", response_model=List[GenreOut], status_code=status.HTTP_200_OK)
async def list_genres(
    db: Annotated[AsyncSession, Depends(get_db)],
    only_active: bool = False,
    only_top8: bool = False,
):
    """List game genres ordered by display_order with optional active/top8 filters."""
    genres = await GamesService.list_all_genres(db=db, only_active=only_active, only_top8=only_top8)
    return [GenreOut.model_validate(g) for g in genres]


@router.get("/wishlist", response_model=List[GameCardOut], status_code=status.HTTP_200_OK)
async def get_my_wishlist(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve all games saved in the authenticated user's wishlist."""
    return await GamesService.get_user_wishlist(db=db, user_id=current_user.id)


@router.get("/{game_id}/similar", response_model=List[GameCardOut], status_code=status.HTTP_200_OK)
async def get_similar_games(
    game_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve 5 most-liked games that share at least one genre with game_id."""
    return await GamesService.get_similar_games(db=db, game_id=game_id, limit=5)

@router.get("/{game_id}", response_model=GameDetailOut, status_code=status.HTTP_200_OK)
async def get_game(
    game_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    current_user: Annotated[Optional[User], Depends(get_optional_current_user)] = None,
):
    """Retrieve full game details, download links, and optional user interaction."""
    user_id = current_user.id if current_user else None
    return await GamesService.get_game_details(db, redis, game_id, user_id=user_id)

@router.post("/{game_id}/like", response_model=InteractionResponse, status_code=status.HTTP_200_OK)
async def toggle_like(
    game_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Toggle like on game (Authenticated users only)."""
    return await GamesService.toggle_like(db, redis, game_id, current_user.id)

@router.post("/{game_id}/dislike", response_model=InteractionResponse, status_code=status.HTTP_200_OK)
async def toggle_dislike(
    game_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Toggle dislike on game (Authenticated users only)."""
    return await GamesService.toggle_dislike(db, redis, game_id, current_user.id)

@router.post("/{game_id}/wishlist", response_model=InteractionResponse, status_code=status.HTTP_200_OK)
async def toggle_wishlist(
    game_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Toggle game in user wishlist (Authenticated users only)."""
    return await GamesService.toggle_wishlist(db, redis, game_id, current_user.id)


# --- 5-Part Game Downloads & Instant Quota Deduction ---

@router.get("/{game_id}/downloads", response_model=List[GameDownloadFileOut], status_code=status.HTTP_200_OK)
async def list_game_download_files(
    game_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all available download files (data, cheat, dlc, subtitle, dubbing) for a game."""
    return await GamesService.list_game_download_files(db=db, game_id=game_id)


@router.post("/{game_id}/downloads/{file_id}/generate", response_model=GenerateDownloadResponse, status_code=status.HTTP_200_OK)
async def generate_game_download_link(
    game_id: int,
    file_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """
    Generate secure one-time download link for specific file part.
    Checks subscription tier, deducts file size instantly from quota,
    and logs the transaction in UserDownloadHistory.
    Strict rule: NO free re-download.
    """
    return await GamesService.generate_download_file_link(
        db=db,
        redis=redis,
        user_id=current_user.id,
        game_id=game_id,
        file_id=file_id,
    )

