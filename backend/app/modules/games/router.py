from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user_optional, get_current_active_user
from app.core.exceptions import AppException
from app.modules.games.schemas import DownloadTokenOut, GameDetailOut, GameFileOut, GameListResponse, GameOut
from app.modules.games.services import GameService
from app.modules.users.models import User

router = APIRouter(prefix="/games", tags=["Games Catalog & Downloads"])


@router.get("", response_model=GameListResponse)
async def list_games(
    platforms: Optional[str] = Query(None, description="Comma-separated platforms e.g. PS5,PS4"),
    genres: Optional[str] = Query(None, description="Comma-separated genres"),
    mode: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("popular", regex="^(popular|newest|rating|size)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    # Auto-seed sample catalog if DB is empty
    await GameService.seed_defaults_if_empty(db)

    plat_list = [p.strip() for p in platforms.split(",")] if platforms else None
    genre_list = [g.strip() for g in genres.split(",")] if genres else None

    items, total = await GameService.get_games(
        db=db,
        platforms=plat_list,
        genres=genre_list,
        mode=mode,
        status=status,
        min_score=min_score,
        search=search,
        sort=sort,
        page=page,
        limit=limit,
    )

    pages = (total + limit - 1) // limit if total > 0 else 1

    return GameListResponse(
        items=[GameOut.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/{slug}", response_model=GameDetailOut)
async def get_game_detail(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    await GameService.seed_defaults_if_empty(db)
    result = await GameService.get_game_by_slug(db, slug)
    if not result:
        raise AppException(status_code=404, code="GAME_NOT_FOUND", message="بازی درخواستی یافت نشد.")

    game, files = result
    out = GameDetailOut.model_validate(game)
    out.files = [GameFileOut.model_validate(f) for f in files]
    return out


@router.post("/{slug}/download/{part_id}", response_model=DownloadTokenOut)
async def download_game_part(
    slug: str,
    part_id: int,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    # If user is none, allow mock user for testing or raise auth
    mock_user = user or User(id=1, username="gamer_test", email="test@drgame.ir")
    return await GameService.generate_download_token(db, mock_user, slug, part_id)
