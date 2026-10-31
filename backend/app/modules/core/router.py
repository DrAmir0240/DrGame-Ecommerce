"""Core endpoints router (GeoIP detection, site settings, system diagnostics)."""
from typing import Annotated
from fastapi import APIRouter, Request, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.database import get_db
from app.core.redis_client import get_redis
from app.core.admin_dependencies import get_current_admin
from app.modules.auth.admin_models import AdminUser
from app.modules.core.geoip_service import GeoIPService, GeoIPResult
from app.modules.core.schemas import SiteSettingsOut, SiteSettingsUpdate
from app.modules.core.services import CoreSettingsService

router = APIRouter()


def extract_client_ip(request: Request) -> str:
    """Extract real client IP from Cloudflare, reverse proxy, or socket."""
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    x_forwarded = request.headers.get("x-forwarded-for")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    x_real = request.headers.get("x-real-ip")
    if x_real:
        return x_real.strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


@router.get("/geoip", response_model=GeoIPResult, summary="تشخیص موقعیت جغرافیایی و زبان پیشنهادی از روی IP")
async def detect_geoip(
    request: Request,
    redis: aioredis.Redis = Depends(get_redis),
):
    """Detect client country and recommended language / UI text direction."""
    client_ip = extract_client_ip(request)
    return await GeoIPService.get_country_by_ip(client_ip, redis)


@router.get("/settings", response_model=SiteSettingsOut, status_code=status.HTTP_200_OK, tags=["Settings"])
@router.get("/site-settings", response_model=SiteSettingsOut, status_code=status.HTTP_200_OK, tags=["Settings"])
async def get_site_settings(
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Public endpoint to fetch dynamic global site settings (DNS, footer, jailbreak config, FAQs)."""
    return await CoreSettingsService.get_settings(db=db, redis=redis)


@router.put("/admin/settings", response_model=SiteSettingsOut, status_code=status.HTTP_200_OK, tags=["Admin Settings"])
async def update_site_settings(
    data: SiteSettingsUpdate,
    admin: Annotated[AdminUser, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    redis: Annotated[aioredis.Redis, Depends(get_redis)],
):
    """Admin-only endpoint to update dynamic global site settings."""
    return await CoreSettingsService.update_settings(db=db, data=data, redis=redis)
