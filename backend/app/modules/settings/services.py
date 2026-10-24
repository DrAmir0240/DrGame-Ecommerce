import json
import logging
from typing import Any, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis_client import RedisService
from app.modules.settings.models import SiteSetting
from app.modules.settings.schemas import DNSBannerSetting, HomeBannerSlot2Setting, PublicSettingsOut

logger = logging.getLogger("drgame.settings")

SETTINGS_CACHE_KEY = "drgame:public_settings"
SETTINGS_CACHE_TTL = 60  # seconds


class SettingsService:
    @staticmethod
    async def get_public_settings(db: AsyncSession) -> PublicSettingsOut:
        # Check Redis Cache
        cached = await RedisService.get(SETTINGS_CACHE_KEY)
        if cached:
            try:
                data = json.loads(cached)
                return PublicSettingsOut(**data)
            except Exception:
                pass

        # Query Database
        res = await db.execute(select(SiteSetting))
        settings_map = {s.key: s.value for s in res.scalars().all()}

        dns_data = settings_map.get("dns_banner")
        dns_setting = DNSBannerSetting(**dns_data) if dns_data else DNSBannerSetting()

        banner2_data = settings_map.get("banner_slot_2")
        banner2_setting = HomeBannerSlot2Setting(**banner2_data) if banner2_data else HomeBannerSlot2Setting()

        result = PublicSettingsOut(dns_banner=dns_setting, banner_slot_2=banner2_setting)

        # Cache in Redis
        await RedisService.set(SETTINGS_CACHE_KEY, result.model_dump(), ttl=SETTINGS_CACHE_TTL)
        return result

    @staticmethod
    async def update_dns_setting(db: AsyncSession, data: Dict[str, Any]) -> DNSBannerSetting:
        res = await db.execute(select(SiteSetting).where(SiteSetting.key == "dns_banner"))
        row = res.scalar_one_or_none()

        if row:
            row.value = data
        else:
            row = SiteSetting(key="dns_banner", value=data)
            db.add(row)

        await db.commit()
        await RedisService.delete(SETTINGS_CACHE_KEY)
        return DNSBannerSetting(**data)

    @staticmethod
    async def update_banner2_setting(db: AsyncSession, data: Dict[str, Any]) -> HomeBannerSlot2Setting:
        res = await db.execute(select(SiteSetting).where(SiteSetting.key == "banner_slot_2"))
        row = res.scalar_one_or_none()

        if row:
            row.value = data
        else:
            row = SiteSetting(key="banner_slot_2", value=data)
            db.add(row)

        await db.commit()
        await RedisService.delete(SETTINGS_CACHE_KEY)
        return HomeBannerSlot2Setting(**data)
