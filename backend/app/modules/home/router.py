"""Home banners router: public grouped endpoints and administrative CRUD."""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.admin_dependencies import get_current_admin
from app.modules.auth.admin_models import AdminUser
from app.modules.home.schemas import (
    HomeBannerOut,
    HomeBannerCreate,
    HomeBannerUpdate,
    GroupedHomeBannersResponse,
)
from app.modules.home.services import HomeBannerService

router = APIRouter(tags=["Home Banners"])


# --- Public Endpoints ---

@router.get("/banners", response_model=GroupedHomeBannersResponse, status_code=status.HTTP_200_OK)
async def get_grouped_home_banners(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve active hero banners grouped by position (Position 1: AAA Games, Position 2: Services)."""
    return await HomeBannerService.get_grouped_banners(db)


@router.get("/banners/list", response_model=List[HomeBannerOut], status_code=status.HTTP_200_OK)
async def list_active_banners(
    db: Annotated[AsyncSession, Depends(get_db)],
    position: Optional[int] = Query(None, ge=1, le=2, description="Filter by position (1 or 2)"),
):
    """Retrieve flat list of active banners sorted by display order."""
    return await HomeBannerService.get_active_banners(db, position=position)


# --- Admin Endpoints ---

@router.get("/admin/banners", response_model=List[HomeBannerOut], status_code=status.HTTP_200_OK)
async def admin_list_banners(
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    position: Optional[int] = Query(None, ge=1, le=2),
):
    """Admin endpoint: List all banners including inactive ones."""
    return await HomeBannerService.admin_list_banners(db, position=position)


@router.post("/admin/banners", response_model=HomeBannerOut, status_code=status.HTTP_201_CREATED)
async def admin_create_banner(
    payload: HomeBannerCreate,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin endpoint: Create a new home banner slide."""
    return await HomeBannerService.admin_create_banner(db, payload.model_dump())


@router.put("/admin/banners/{banner_id}", response_model=HomeBannerOut, status_code=status.HTTP_200_OK)
async def admin_update_banner(
    banner_id: int,
    payload: HomeBannerUpdate,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin endpoint: Update an existing home banner slide."""
    return await HomeBannerService.admin_update_banner(
        db, banner_id=banner_id, data=payload.model_dump(exclude_unset=True)
    )


@router.delete("/admin/banners/{banner_id}", status_code=status.HTTP_200_OK)
async def admin_delete_banner(
    banner_id: int,
    current_admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Admin endpoint: Delete a home banner slide."""
    return await HomeBannerService.admin_delete_banner(db, banner_id=banner_id)
