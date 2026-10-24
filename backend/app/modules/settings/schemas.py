from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DNSBannerSetting(BaseModel):
    is_active: bool = True
    primary_dns: str = "178.22.122.100"
    secondary_dns: str = "185.51.200.2"
    message_fa: str = "جهت دور زدن تحریم و افزایش سرعت دانلود کنسول، DNS اختصاصی دکتر گیم را تنظیم کنید:"
    message_en: str = "Set DrGame dedicated DNS on your PlayStation console to bypass restrictions:"


class HomeBannerSlot2Setting(BaseModel):
    is_active: bool = True
    badge_fa: str = "جشنواره ویژه اشتراک‌ها"
    badge_en: str = "Special Promotion"
    title_fa: str = "اشتراک طلایی با ترافیک نامحدود و ۳۵٪ تخفیف ولکام"
    title_en: str = "Gold VIP Tier with Unlimited Quota and 35% Welcome Discount"
    description_fa: str = "دسترسی مستقیم و نامحدود به کاتالوگ ۵ ترابایتی بازی‌های کپی‌خور PS4 و PS5."
    description_en: str = "Unlimited direct access to 5TB curated PS4/PS5 jailbreak games catalog."
    target_url: str = "/subscriptions"


class PublicSettingsOut(BaseModel):
    dns_banner: DNSBannerSetting
    banner_slot_2: HomeBannerSlot2Setting


class UpdateDNSBannerIn(BaseModel):
    is_active: bool = True
    primary_dns: str
    secondary_dns: str
    message_fa: str


class UpdateBannerSlot2In(BaseModel):
    is_active: bool = True
    title_fa: str
    target_url: str = "/subscriptions"
    badge_fa: Optional[str] = "جشنواره ویژه"
