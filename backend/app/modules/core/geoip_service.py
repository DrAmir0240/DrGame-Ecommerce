"""GeoIP Detection Service for DrGame Platform.
Detects client country from IP address and recommends matching default language and UI direction.
"""
import ipaddress
import logging
import httpx
import redis.asyncio as aioredis
from typing import Optional
from pydantic import BaseModel

logger = logging.getLogger("drgame.geoip")

COUNTRY_LANG_MAP = {
    "IR": ("fa", "rtl", "Iran"),
    "AF": ("fa", "rtl", "Afghanistan"),
    "TR": ("tr", "ltr", "Turkey"),
    "AZ": ("tr", "ltr", "Azerbaijan"),
    "AE": ("ar", "rtl", "United Arab Emirates"),
    "SA": ("ar", "rtl", "Saudi Arabia"),
    "IQ": ("ar", "rtl", "Iraq"),
    "KW": ("ar", "rtl", "Kuwait"),
    "QA": ("ar", "rtl", "Qatar"),
    "OM": ("ar", "rtl", "Oman"),
    "BH": ("ar", "rtl", "Bahrain"),
    "EG": ("ar", "rtl", "Egypt"),
    "FR": ("fr", "ltr", "France"),
    "DE": ("de", "ltr", "Germany"),
    "AT": ("de", "ltr", "Austria"),
    "CH": ("de", "ltr", "Switzerland"),
    "ES": ("es", "ltr", "Spain"),
    "MX": ("es", "ltr", "Mexico"),
    "AR": ("es", "ltr", "Argentina"),
    "RU": ("ru", "ltr", "Russia"),
    "BY": ("ru", "ltr", "Belarus"),
    "KZ": ("ru", "ltr", "Kazakhstan"),
    "CN": ("zh", "ltr", "China"),
    "TW": ("zh", "ltr", "Taiwan"),
    "HK": ("zh", "ltr", "Hong Kong"),
    "JP": ("ja", "ltr", "Japan"),
    "US": ("en", "ltr", "United States"),
    "GB": ("en", "ltr", "United Kingdom"),
    "CA": ("en", "ltr", "Canada"),
    "AU": ("en", "ltr", "Australia"),
}

class GeoIPResult(BaseModel):
    ip: str
    country_code: str
    country_name: str
    suggested_lang: str
    direction: str
    is_local: bool = False

def is_private_or_loopback(ip_str: str) -> bool:
    """Check if the IP is localhost, loopback, or private RFC1918."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
    except ValueError:
        return True

class GeoIPService:
    @staticmethod
    async def get_country_by_ip(
        client_ip: str, redis_client: Optional[aioredis.Redis] = None
    ) -> GeoIPResult:
        """Detect country and language preference from client IP."""
        clean_ip = client_ip.split(",")[0].strip() if client_ip else "127.0.0.1"

        # Check local/private IP
        if is_private_or_loopback(clean_ip):
            return GeoIPResult(
                ip=clean_ip,
                country_code="IR",
                country_name="Iran (Local)",
                suggested_lang="fa",
                direction="rtl",
                is_local=True,
            )

        # Check Redis cache
        cache_key = f"geoip:{clean_ip}"
        if redis_client:
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    import json
                    data = json.loads(cached)
                    return GeoIPResult(**data)
            except Exception as e:
                logger.warning(f"GeoIP cache read error: {e}")

        # Lookup via lightweight public GeoIP
        country_code = "IR"
        country_name = "Iran"
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"https://ipwho.is/{clean_ip}")
                if res.status_code == 200:
                    payload = res.json()
                    if payload.get("success"):
                        country_code = payload.get("country_code", "IR").upper()
                        country_name = payload.get("country", "Unknown")
        except Exception as e:
            logger.warning(f"GeoIP lookup failed for {clean_ip}: {e}")

        lang, direction, default_name = COUNTRY_LANG_MAP.get(
            country_code, ("en", "ltr", country_name)
        )
        result = GeoIPResult(
            ip=clean_ip,
            country_code=country_code,
            country_name=country_name or default_name,
            suggested_lang=lang,
            direction=direction,
            is_local=False,
        )

        # Cache in Redis for 24 hours
        if redis_client:
            try:
                import json
                await redis_client.setex(cache_key, 86400, json.dumps(result.model_dump()))
            except Exception as e:
                logger.warning(f"GeoIP cache write error: {e}")

        return result
