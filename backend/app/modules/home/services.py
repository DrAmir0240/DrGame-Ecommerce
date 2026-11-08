"""Home banner services: querying active banners and admin CRUD."""
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.home.banner_models import HomeBanner

DEFAULT_HOME_BANNERS = [
    {
        "position": 1,
        "badge": "بازی منتخب ماه",
        "title_fa": "خدای جنگ: رگناروک",
        "title_en": "God of War Ragnarök",
        "description": "همراه با کریتوس و آترئوس به سفری اسطوره‌ای در میان ۹ قلمرو اسکاندیناوی بروید.",
        "backdrop_url": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80",
        "link_href": "/games/1",
        "cta_text": "مشاهده جزئیات و دانلود",
        "platforms": ["PS5", "PS4"],
        "display_order": 1,
        "is_active": True,
    },
    {
        "position": 1,
        "badge": "جدیدترین عنوان اکشن",
        "title_fa": "اسپایدرمن ۲ مارول",
        "title_en": "Marvel's Spider-Man 2",
        "description": "تار زدن در سراسر نیویورک با پیتر پارکر و مایلز مورالز با سرعت لودینگ صفر.",
        "backdrop_url": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&auto=format&fit=crop&q=80",
        "link_href": "/games/2",
        "cta_text": "دانلود مستقیم",
        "platforms": ["PS5"],
        "display_order": 2,
        "is_active": True,
    },
    {
        "position": 2,
        "badge": "تخفیف ویژه دوره‌ای",
        "title_fa": "اشتراک ۶ ماهه طلایی با ۲۰٪ تخفیف",
        "title_en": "Gold 6-Month Plan",
        "description": "دسترسی نامحدود به دیتای بازی‌ها، سرور فوق‌سریع و دوبله‌های اختصاصی دکتر گیم.",
        "backdrop_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80",
        "link_href": "/subscriptions",
        "cta_text": "خرید اشتراک با تخفیف",
        "platforms": ["PS5", "PS4", "Xbox", "Switch"],
        "display_order": 1,
        "is_active": True,
    },
    {
        "position": 2,
        "badge": "کنسول پلی‌استیشن",
        "title_fa": "آموزش نصب DNS اختصاصی و انتقال دیتا",
        "title_en": "Custom DNS Setup",
        "description": "بدون قطعی و با بالاترین پهنای باند کنسول خود را مستقیماً به مخزن بازی‌ها متصل کنید.",
        "backdrop_url": "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1600&auto=format&fit=crop&q=80",
        "link_href": "/blog/dns-guide",
        "cta_text": "مشاهده راهنما",
        "platforms": ["PS5", "PS4"],
        "display_order": 2,
        "is_active": True,
    },
]


class HomeBannerService:

    @staticmethod
    async def seed_default_banners(db: AsyncSession) -> None:
        """Seed default banners if table is empty."""
        stmt = select(HomeBanner).limit(1)
        existing = (await db.execute(stmt)).scalar_one_or_none()
        if not existing:
            for b_data in DEFAULT_HOME_BANNERS:
                banner = HomeBanner(**b_data)
                db.add(banner)
            await db.commit()

    @staticmethod
    async def get_active_banners(db: AsyncSession, position: int | None = None) -> list[HomeBanner]:
        """Fetch active banners sorted by display_order."""
        await HomeBannerService.seed_default_banners(db)
        stmt = select(HomeBanner).where(HomeBanner.is_active == True)
        if position:
            stmt = stmt.where(HomeBanner.position == position)
        stmt = stmt.order_by(HomeBanner.display_order.asc(), HomeBanner.id.asc())
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def get_grouped_banners(db: AsyncSession) -> dict:
        """Fetch active banners grouped by position (1: AAA Games, 2: Services)."""
        await HomeBannerService.seed_default_banners(db)
        banners = await HomeBannerService.get_active_banners(db)
        return {
            "position_1": [b for b in banners if b.position == 1],
            "position_2": [b for b in banners if b.position == 2],
        }

    @staticmethod
    async def admin_list_banners(db: AsyncSession, position: int | None = None) -> list[HomeBanner]:
        """Admin list of all banners (including inactive)."""
        await HomeBannerService.seed_default_banners(db)
        stmt = select(HomeBanner)
        if position:
            stmt = stmt.where(HomeBanner.position == position)
        stmt = stmt.order_by(HomeBanner.position.asc(), HomeBanner.display_order.asc())
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def admin_create_banner(db: AsyncSession, data: dict) -> HomeBanner:
        """Admin create a new home banner with flexible field fallbacks."""
        title_fa = data.get("title_fa") or data.get("title") or "بنر ویژه دکتر گیم"
        title_en = data.get("title_en") or data.get("title") or "Featured Banner"
        badge = data.get("badge") or "ویژه"
        description = data.get("description") or f"معرفی و دانلود {title_fa}"
        backdrop_url = data.get("backdrop_url") or data.get("image_url") or ""
        link_href = data.get("link_href") or data.get("link_url") or "/games"
        cta_text = data.get("cta_text") or "مشاهده بازی"
        platforms = data.get("platforms") or ["PS5", "PS4"]
        position = int(data.get("position") or 1)
        display_order = int(data.get("display_order") or 1)
        is_active = bool(data.get("is_active", True))

        banner = HomeBanner(
            position=position,
            badge=badge,
            title_fa=title_fa,
            title_en=title_en,
            description=description,
            backdrop_url=backdrop_url,
            link_href=link_href,
            cta_text=cta_text,
            platforms=platforms,
            display_order=display_order,
            is_active=is_active,
        )
        db.add(banner)
        await db.commit()
        await db.refresh(banner)
        return banner

    @staticmethod
    async def admin_update_banner(db: AsyncSession, banner_id: int, data: dict) -> HomeBanner:
        """Admin update an existing home banner."""
        banner = (await db.execute(select(HomeBanner).where(HomeBanner.id == banner_id))).scalar_one_or_none()
        if not banner:
            raise NotFoundError("بنر مورد نظر یافت نشد.")

        for key, value in data.items():
            if value is not None and hasattr(banner, key):
                setattr(banner, key, value)

        await db.commit()
        await db.refresh(banner)
        return banner

    @staticmethod
    async def admin_delete_banner(db: AsyncSession, banner_id: int) -> dict:
        """Admin delete a home banner."""
        banner = (await db.execute(select(HomeBanner).where(HomeBanner.id == banner_id))).scalar_one_or_none()
        if not banner:
            raise NotFoundError("بنر مورد نظر یافت نشد.")

        await db.delete(banner)
        await db.commit()
        return {"status": "deleted", "id": banner_id}
