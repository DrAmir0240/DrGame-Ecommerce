from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import TokenResponse, UserLogin, UserOut, UserRegister
from app.modules.users.services import UserService

router = APIRouter(prefix="/auth", tags=["Authentication & User"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await UserService.register_user(db, payload)
    return await UserService.get_user_profile(db, user.id)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    return await UserService.authenticate_user(db, payload)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await UserService.get_user_profile(db, current_user.id)
