from decimal import Decimal
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis_client import RedisService
from app.modules.subscriptions.models import SubscriptionTier
from app.modules.subscriptions.schemas import SubscriptionTierOut

DEFAULT_TIERS = [
    {
        "name": "Free",
        "slug": "free",
        "description": "دسترسی همیشگی به ۵ بازی پرطرفدار ثابت با دانلود نامحدود",
        "price": Decimal("0"),
        "duration_days": 3650,
        "quota_bytes": 0,  # 0 indicates special free rule (unlimited for 5 games)
        "max_download_speed_mbps": 10,
        "allowed_platforms": ["PS4", "PS5"],
        "features": [
            "Watch Dogs 2",
            "GTA V",
            "Rocket League",
            "Mortal Kombat 11",
            "Brawlhalla",
        ],
        "limitations": [
            "عدم دسترسی به سایر بازی‌های کاتالوگ",
            "عدم دسترسی به زیرنویس فارسی",
            "عدم دسترسی به DLCها",
        ],
        "is_active": True,
    },
    {
        "name": "Bronze",
        "slug": "bronze",
        "description": "شروعی اقتصادی با سرعت اختصاصی و ۵۰۰ گیگابایت دانلود بازی",
        "price": Decimal("698000"),
        "duration_days": 30,
        "quota_bytes": 500 * 1024 * 1024 * 1024,  # 500 GB
        "max_download_speed_mbps": 20,
        "allowed_platforms": ["PS4", "PS5"],
        "features": [
            "حداکثر سرعت دانلود: ۲۰ مگابیت بر ثانیه",
            "دانلود کامل بازی‌های PS4 و PS5",
            "۵۰۰ گیگابایت سهمیه مصرفی",
        ],
        "limitations": [
            "بازی‌های رترو و کنسول‌های قدیمی در دسترس نیستند",
            "خرید زیرنویس اختصاصی در این پلن فعال نیست",
            "خرید DLC در این پلن در دسترس نیست",
        ],
        "is_active": True,
    },
    {
        "name": "Silver",
        "slug": "silver",
        "description": "پلنی متعادل با دسترسی به پلتفرم‌های بیشتر و ۱ ترابایت دانلود",
        "price": Decimal("1198000"),
        "duration_days": 30,
        "quota_bytes": 1000 * 1024 * 1024 * 1024,  # 1 TB (1000 GB)
        "max_download_speed_mbps": 20,
        "allowed_platforms": ["PS2", "PS3", "PS4", "PS5"],
        "features": [
            "حداکثر سرعت دانلود: ۲۰ مگابیت بر ثانیه",
            "بازی‌های کنسول‌های PS2, PS3, PS4 و PS5",
            "امکان خرید زیرنویس فارسی و DLCها",
            "۱ ترابایت سهمیه مصرفی ماهانه",
        ],
        "limitations": [
            "تم‌های ویژه همراه پلن نیستند",
            "بازی‌های Nintendo و Xbox شامل پلن نیستند",
        ],
        "is_active": True,
    },
    {
        "name": "Gold",
        "slug": "gold",
        "description": "دسترسی گسترده به کلیه پلتفرم‌ها، سرعت بالاتر و ۲.۲ ترابایت دانلود بازی",
        "price": Decimal("2988000"),
        "duration_days": 30,
        "quota_bytes": 2200 * 1024 * 1024 * 1024,  # 2.2 TB (2200 GB)
        "max_download_speed_mbps": 40,
        "allowed_platforms": ["PS1", "PS2", "PS3", "PS4", "PS5", "Xbox 360", "Nintendo"],
        "features": [
            "حداکثر سرعت دانلود: ۴۰ مگابیت بر ثانیه",
            "دسترسی به تمامی پلتفرم‌ها و بازی‌های رترو",
            "۲.۲ ترابایت سهمیه دانلود اختصاصی",
            "دسترسی نامحدود به تمامی دسته‌بندی‌ها",
            "امکان خرید و دانلود زیرنویس و DLCها",
            "تم‌های سفارشی و والپیپرهای رایگان کنسول",
        ],
        "limitations": [],
        "is_active": True,
    },
]


class SubscriptionService:
    @staticmethod
    async def get_all_tiers(db: AsyncSession) -> List[SubscriptionTierOut]:
        cache_key = "drgame:subscriptions:tiers"
        cached = await RedisService.get(cache_key)
        if cached:
            return [SubscriptionTierOut(**item) for item in cached]

        result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.is_active == True))
        tiers = result.scalars().all()

        # Seed if empty
        if not tiers:
            for t_data in DEFAULT_TIERS:
                t = SubscriptionTier(**t_data)
                db.add(t)
            await db.commit()
            result = await db.execute(select(SubscriptionTier).where(SubscriptionTier.is_active == True))
            tiers = result.scalars().all()

        out_list = []
        for t in tiers:
            gb = round(t.quota_bytes / (1024 * 1024 * 1024), 1)
            t_out = SubscriptionTierOut(
                id=t.id,
                name=t.name,
                slug=t.slug,
                description=t.description,
                price=t.price,
                duration_days=t.duration_days,
                quota_bytes=t.quota_bytes,
                quota_gb=gb,
                max_download_speed_mbps=t.max_download_speed_mbps,
                allowed_platforms=t.allowed_platforms,
                features=t.features,
                limitations=t.limitations,
                is_active=t.is_active,
            )
            out_list.append(t_out)

        # Cache in Redis
        await RedisService.set(cache_key, [t.model_dump(mode="json") for t in out_list], ttl=86400)
        return out_list
