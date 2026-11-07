"""Game catalog router: list, filters, details, likes, and wishlist."""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status, Request, HTTPException, Response
from fastapi.responses import RedirectResponse, StreamingResponse
from app.core.security import decode_token
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
    GameDownloadOptionsOut,
    HandoffExecuteRequest,
    HandoffExecuteResponse,
    GameDownloadTicketRequest,
    GameDownloadTicketResponse,
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


# --- Step 19: Dynamic Game Downloads, Title IDs & Firmware Engine ---

@router.get("/{game_id}/download-options", response_model=GameDownloadOptionsOut, status_code=status.HTTP_200_OK)
async def get_game_download_options(
    game_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """
    Step 19: Dynamic Game Download Options with Firmware Detection.
    Inspects User-Agent, detects console platform & firmware version (<= 11.40 vs > 11.40),
    recommends optimal format (FPKG vs FAT32), and returns available packages and Title IDs.
    """
    ua = request.headers.get("user-agent")
    return await GamesService.get_game_download_options(
        db=db,
        redis=redis,
        game_id=game_id,
        user_agent=ua,
    )


@router.post("/{game_id}/handoff", response_model=HandoffExecuteResponse, status_code=status.HTTP_200_OK)
async def execute_game_handoff(
    game_id: int,
    payload: HandoffExecuteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """
    Step 19: Execute seamless Handoff to Download32 on PS5 console.
    Validates game and job, verifies active subscription & quota,
    atomically deducts size_gb, logs download history, and approves the PS5 DPoP session.
    """
    return await GamesService.execute_dynamic_handoff(
        db=db,
        redis=redis,
        user_id=current_user.id,
        game_id=game_id,
        job_id=payload.job_id,
        handoff_secret=payload.handoff_secret,
        selected_format=payload.selected_format,
    )


@router.post("/sync-storage", status_code=status.HTTP_200_OK)
async def sync_games_storage(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    current_user: Annotated[User, Depends(get_current_user)],
    game_id: Optional[int] = Query(None, description="Optional specific game ID to sync"),
):
    """
    Sync storage metadata from dltest.gamedr.ir for all games or specific game.
    Matches tags with PS5/PS4 Title IDs, infers missing IDs, and updates available formats.
    """
    from app.modules.games.storage_bridge import StorageBridgeService
    return await StorageBridgeService.sync_game_storage_metadata(db=db, redis=redis, game_id=game_id)


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


@router.post("/{game_id}/download-ticket", response_model=GameDownloadTicketResponse, status_code=status.HTTP_200_OK)
async def generate_game_download_ticket(
    game_id: int,
    payload: GameDownloadTicketRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """
    Generate secure download ticket for a game format (FPKG/FAT32) or specific file part.
    Enforces active subscription & tier permissions, deducts quota atomically,
    logs QuotaConsumptionLog and UserDownloadHistory.
    Strict rule: NO free re-download.
    """
    return await GamesService.generate_download_ticket(
        db=db,
        redis=redis,
        user_id=current_user.id,
        game_id=game_id,
        job_id=payload.job_id,
        format_category=payload.format_category,
        file_id=payload.file_id,
    )


@router.api_route("/{game_id}/download-stream", methods=["GET", "HEAD"])
async def stream_direct_game_download(
    game_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    target: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    file_id: Optional[int] = Query(None),
    uid: Optional[int] = Query(None),
    exp: Optional[int] = Query(None),
    sig: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
):
    """
    Direct secure stream endpoint for browser or download manager (IDM).
    Validates HMAC signature and expiry.
    Returns 200/206 streaming response with attachment Content-Disposition.
    """
    import time
    import hashlib
    from app.core.config import settings
    from app.modules.games.models import Game
    from app.modules.games.download_models import GameDownloadFile

    # 1. Validation of signed ticket
    user_id = uid
    auth_sig = sig or token
    if not user_id or not exp or not auth_sig:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="پارامترهای اعتبارسنجی لینک دانلود ناقص می‌باشد.",
        )

    now_ts = int(time.time())
    if now_ts > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="لینک دانلود منقضی شده است. لطفاً مجدداً از پنل دانلود اقدام فرمایید.",
        )

    target_ref = target or job_id or (f"file_{file_id}" if file_id else f"job_game_{game_id}_{format or 'fpkg'}")
    expected_sig = hashlib.sha256(
        f"{user_id}:{game_id}:{target_ref}:{settings.WEBHOOK_SECRET_KEY}:{exp}".encode("utf-8")
    ).hexdigest()[:24]

    if auth_sig != expected_sig:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="امضای اعتبارسنجی لینک دانلود نامعتبر است.",
        )

    # 2. Fetch game
    game = await db.scalar(select(Game).where(Game.id == game_id))
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="بازی یافت نشد.")

    # 3. Check if target is a file with external download URL
    if file_id or target_ref.startswith("file_"):
        fid = file_id or int(target_ref.split("_")[1])
        f_rec = await db.scalar(select(GameDownloadFile).where(GameDownloadFile.id == fid))
        if f_rec and f_rec.download_url and f_rec.download_url.startswith("http"):
            return RedirectResponse(url=f_rec.download_url, status_code=status.HTTP_302_FOUND)

    # 4. Stream package
    ext = "zip" if "fat32" in target_ref.lower() or (format and "fat32" in format.lower()) else "pkg"
    filename = f"{game.slug}_{target_ref}.{ext}"

    total_size = int((game.download_size_gb or 40.0) * (1024 ** 3))

    # Parse Range header if present
    range_header = request.headers.get("range")
    start = 0
    end = total_size - 1

    if range_header and range_header.startswith("bytes="):
        try:
            r_parts = range_header.replace("bytes=", "").split("-")
            start = int(r_parts[0])
            if r_parts[1].strip():
                end = int(r_parts[1])
        except Exception:
            start = 0
            end = total_size - 1

    if start >= total_size:
        raise HTTPException(status_code=416, detail="Range not satisfiable")
    end = min(end, total_size - 1)
    content_length = end - start + 1

    # In dev/mock streaming, stream clean sample payload to avoid saturating disk
    limit = min(content_length, 10 * 1024 * 1024)

    async def sample_stream():
        chunk = b"\x00" * 65536
        sent = 0
        while sent < limit:
            to_write = min(len(chunk), limit - sent)
            yield chunk[:to_write]
            sent += to_write

    headers = {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Accept-Ranges": "bytes",
        "Content-Range": f"bytes {start}-{end}/{total_size}",
        "Content-Length": str(limit),
    }

    if request.method == "HEAD":
        return Response(status_code=status.HTTP_200_OK, headers=headers)

    status_code = status.HTTP_206_PARTIAL_CONTENT if range_header else status.HTTP_200_OK
    return StreamingResponse(sample_stream(), status_code=status_code, headers=headers)


@router.get("/{game_id}/downloads/{file_id}/stream", status_code=status.HTTP_302_FOUND)
async def stream_game_download(
    game_id: int,
    file_id: int,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
    token: Optional[str] = Query(None),
):
    """
    Direct stream & quota deduction endpoint.
    Extracts user from Authorization header, token query param, or cookies.
    Deducts quota atomically, logs download history, and 302 redirects to direct file URL.
    """
    user_id = None
    auth_header = request.headers.get("authorization")
    raw_token = None
    if auth_header and auth_header.strip().startswith("Bearer "):
        parts = auth_header.strip().split(" ", 1)
        if len(parts) > 1 and parts[1].strip():
            raw_token = parts[1].strip()
    if not raw_token and token:
        raw_token = token
    if not raw_token and "drgame_access_token" in request.cookies:
        raw_token = request.cookies.get("drgame_access_token")

    if raw_token:
        try:
            payload = decode_token(raw_token)
            user_id = int(payload.get("sub"))
        except Exception:
            pass

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="برای دانلود دیتای بازی لطفاً وارد حساب خود شوید.",
        )

    res = await GamesService.generate_download_file_link(
        db=db,
        redis=redis,
        user_id=user_id,
        game_id=game_id,
        file_id=file_id,
    )
    return RedirectResponse(url=res["download_url"], status_code=status.HTTP_302_FOUND)



