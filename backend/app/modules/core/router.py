"""Core endpoints router (GeoIP detection, system diagnostics)."""
from fastapi import APIRouter, Request, Depends
import redis.asyncio as aioredis

from app.core.redis_client import get_redis
from app.modules.core.geoip_service import GeoIPService, GeoIPResult

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
