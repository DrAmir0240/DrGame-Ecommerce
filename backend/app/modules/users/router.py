"""User management router: profile, sessions, avatar selection."""
from typing import Annotated, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.dependencies import get_current_user
from app.modules.auth.schemas import MessageResponse
from app.modules.users.models import User
from app.modules.users.schemas import (
    UserOut,
    UserProfileUpdate,
    ChangePasswordRequest,
    UserSessionOut,
)
from app.modules.games.schemas import UserDownloadHistoryOut
from app.modules.users.services import UserService

router = APIRouter(tags=["Users"])

@router.get("/me", response_model=UserOut, status_code=status.HTTP_200_OK)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current authenticated user profile."""
    return UserOut.model_validate(current_user)

@router.put("/profile", response_model=UserOut, status_code=status.HTTP_200_OK)
async def update_profile(
    payload: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update profile details (name, avatar, hero banner)."""
    return await UserService.update_user_profile(db, current_user.id, payload)

@router.post("/change-password", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Change user password after verifying current password."""
    await UserService.change_password(db, current_user.id, payload)
    return MessageResponse(message="کلمه عبور با موفقیت تغییر یافت.")

@router.get("/sessions", response_model=List[UserSessionOut], status_code=status.HTTP_200_OK)
async def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """List all active sessions for current user."""
    return await UserService.get_user_sessions(db, current_user.id)

@router.delete("/sessions/{session_id}", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def revoke_session(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Revoke specific session and blacklist token with primary and current session guards."""
    current_jti = getattr(current_user, "_current_jti", None)
    await UserService.revoke_session(db, redis, current_user.id, session_id, current_jti=current_jti)
    return MessageResponse(message="نشست دستگاه مورد نظر با موفقیت لغو شد.")


@router.get("/me/downloads", response_model=List[UserDownloadHistoryOut], status_code=status.HTTP_200_OK)
async def get_my_download_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 50,
):
    """Retrieve authenticated user's download history (one-time logged records)."""
    from app.modules.games.services import GamesService
    return await GamesService.get_user_download_history(db=db, user_id=current_user.id, limit=limit)

