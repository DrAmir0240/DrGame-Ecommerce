from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_superuser, get_current_user_optional
from app.modules.settings.schemas import (
    DNSBannerSetting,
    HomeBannerSlot2Setting,
    PublicSettingsOut,
    UpdateBannerSlot2In,
    UpdateDNSBannerIn,
)
from app.modules.settings.services import SettingsService

router = APIRouter(prefix="/settings", tags=["Site Settings & Admin Sync"])


@router.get("/public", response_model=PublicSettingsOut)
async def get_public_settings(
    db: AsyncSession = Depends(get_db),
):
    return await SettingsService.get_public_settings(db)


@router.put("/dns", response_model=DNSBannerSetting)
async def update_dns_setting(
    body: UpdateDNSBannerIn,
    db: AsyncSession = Depends(get_db),
):
    return await SettingsService.update_dns_setting(db, body.model_dump())


@router.put("/banners", response_model=HomeBannerSlot2Setting)
async def update_banner_setting(
    body: UpdateBannerSlot2In,
    db: AsyncSession = Depends(get_db),
):
    return await SettingsService.update_banner2_setting(db, body.model_dump())
