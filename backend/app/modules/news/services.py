"""Blog, news and tutorial articles service with Redis caching and user interactions."""
import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.modules.news.models import BlogCategory, BlogPost, BlogInteraction
from app.modules.news.schemas import BlogPostCreate, BlogPostUpdate, BlogCategoryCreate, BlogCategoryUpdate


INITIAL_CATEGORIES = [
    {"name_fa": "آموزش و انتقال دیتا", "name_en": "Tutorials & Data Transfer", "slug": "tutorials"},
    {"name_fa": "اخبار و رویدادهای کنسول", "name_en": "Console News", "slug": "news"},
    {"name_fa": "نقد و بررسی و مقالات", "name_en": "Reviews & Features", "slug": "reviews"},
]

INITIAL_POSTS = [
    {
        "title_fa": "آموزش جامع انتقال دیتای بازی به PS5 با کابل LAN و رایانه بدون مصرف اینترنت",
        "title_en": "Complete PS5 Data Transfer via LAN and PC without Internet",
        "slug": "ps5-data-transfer-direct-lan",
        "category_slug": "tutorials",
        "reading_time_min": 6,
        "cover_image_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        "content_fa": "راهنمای گام‌به‌گام اتصال مستقیم کامپیوتر به پلی‌استیشن ۵ با ابزار PSX Download Helper و کابل شبکه گیگابیت برای انتقال پرسرعت بدون قطعی. در این روش ترافیک مصرفی صفر بوده و سرعت انتقال به حداکثر پهنای باند کارت شبکه شما (تا ۱ گیگابیت بر ثانیه) خواهد رسید.",
    },
    {
        "title_fa": "راهنمای راه‌اندازی هاست آفلاین و گلد‌هن (GoldHEN) روی فریمور‌های کپی‌خور",
        "title_en": "Offline Host and GoldHEN Setup on Jailbroken PS4/PS5",
        "slug": "ps4-goldhen-offline-installer",
        "category_slug": "tutorials",
        "reading_time_min": 8,
        "cover_image_url": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
        "content_fa": "معرفی بهترین پی‌لودهای پایدار برای جیلبریک PS4، فعال‌سازی حالت Debug Settings و نصب آسان پکیج‌های FPKG دیتابیس بدون نیاز به اینترنت و بدون خطر آپدیت ناخواسته فریمور کنسول.",
    },
    {
        "title_fa": "نصب بازی‌های حجیم Nintendo Switch با پروتکل پرسرعت MTP توسط نرم‌افزار DBI",
        "title_en": "Fast Nintendo Switch Game Install via DBI and MTP",
        "slug": "nintendo-switch-dbi-installer",
        "category_slug": "tutorials",
        "reading_time_min": 5,
        "cover_image_url": "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=80",
        "content_fa": "حل مشکل خطای محدودیت حجم فایل FAT32 و انتقال مستقیم فایل‌های NSP و XCI از ویندوز و مک به مموری سوییچ در چند ثانیه بدون نیاز به خارج کردن کارت حافظه MicroSD.",
    },
    {
        "title_fa": "لیست برترین DNSهای مخصوص گیم با پینگ پایین و رفع تحریم‌های PSN در ایران",
        "title_en": "Best Low-Ping Gaming DNS for PSN in Iran",
        "slug": "dns-low-ping-gaming-iran",
        "category_slug": "news",
        "reading_time_min": 4,
        "cover_image_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
        "content_fa": "معرفی پایدارترین آی‌پی‌های ضدتحریم تست شده روی اینترنت‌های همراه اول، ایرانسل، شاتل و مخابرات برای دانلود بدون افت سرعت و حل ارورهای رایج اتصال به شبکه پلی‌استیشن.",
    },
    {
        "title_fa": "نحوه اتصال هدست PSVR2 به کامپیوتر با آداپتور رسمی سونی و تجربه بازی‌های SteamVR",
        "title_en": "Sony PSVR2 PC Adapter Setup for SteamVR Games",
        "slug": "psvr2-pc-setup-adapter",
        "category_slug": "reviews",
        "reading_time_min": 7,
        "cover_image_url": "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80",
        "content_fa": "راهنمای راه‌اندازی درایورهای پلی‌استیشن وی‌آر ۲ روی ویندوز ۱۱ و اجرای بازی‌های Half-Life: Alyx با پنل OLED و رزولوشن 4K از طریق درگاه DisplayPort رایانه شخصی.",
    },
]


class NewsService:
    @staticmethod
    async def seed_blog_data(db: AsyncSession) -> None:
        """Seed initial categories and articles if none exist."""
        cat_count = (await db.execute(select(func.count(BlogCategory.id)))).scalar() or 0
        cat_map: dict[str, int] = {}

        if cat_count == 0:
            for cat_data in INITIAL_CATEGORIES:
                cat = BlogCategory(**cat_data)
                db.add(cat)
            await db.commit()

        # Build category map
        all_cats = (await db.execute(select(BlogCategory))).scalars().all()
        for c in all_cats:
            cat_map[c.slug] = c.id

        post_count = (await db.execute(select(func.count(BlogPost.id)))).scalar() or 0
        if post_count == 0:
            for p in INITIAL_POSTS:
                cat_id = cat_map.get(p["category_slug"], 1)
                post = BlogPost(
                    title_fa=p["title_fa"],
                    title_en=p["title_en"],
                    slug=p["slug"],
                    category_id=cat_id,
                    reading_time_min=p["reading_time_min"],
                    cover_image_url=p["cover_image_url"],
                    content_fa=p["content_fa"],
                    likes_count=12,
                    dislikes_count=0,
                    views_count=150,
                    is_published=True,
                )
                db.add(post)
            await db.commit()

    @classmethod
    async def get_categories(cls, db: AsyncSession, redis: aioredis.Redis | None = None) -> list[BlogCategory]:
        """Fetch all blog categories with Redis caching."""
        cache_key = "drgame:blog:categories"
        if redis:
            try:
                cached = await redis.get(cache_key)
                if cached:
                    return [BlogCategory(**item) for item in json.loads(cached)]
            except Exception:
                pass

        await cls.seed_blog_data(db)
        stmt = select(BlogCategory).order_by(BlogCategory.id)
        categories = list((await db.execute(stmt)).scalars().all())

        if redis and categories:
            try:
                payload = [
                    {"id": c.id, "name_fa": c.name_fa, "name_en": c.name_en, "slug": c.slug}
                    for c in categories
                ]
                await redis.set(cache_key, json.dumps(payload), ex=3600)
            except Exception:
                pass

        return categories

    @classmethod
    async def list_posts(
        cls,
        db: AsyncSession,
        redis: aioredis.Redis | None = None,
        category_slug: str | None = None,
        search: str | None = None,
        sort: str = "newest",  # "newest", "popular", "views"
        page: int = 1,
        page_size: int = 12,
    ) -> dict:
        """Fetch paginated blog posts with category and search filters."""
        await cls.seed_blog_data(db)

        stmt = select(BlogPost, BlogCategory.name_fa, BlogCategory.slug).join(
            BlogCategory, BlogPost.category_id == BlogCategory.id
        ).where(BlogPost.is_published == True)

        if category_slug:
            stmt = stmt.where(BlogCategory.slug == category_slug)

        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(or_(BlogPost.title_fa.ilike(term), BlogPost.content_fa.ilike(term)))

        if sort == "popular":
            stmt = stmt.order_by(desc(BlogPost.likes_count))
        elif sort == "views":
            stmt = stmt.order_by(desc(BlogPost.views_count))
        else:
            stmt = stmt.order_by(desc(BlogPost.created_at))

        # Count total
        count_stmt = select(func.count(BlogPost.id)).join(
            BlogCategory, BlogPost.category_id == BlogCategory.id
        ).where(BlogPost.is_published == True)
        if category_slug:
            count_stmt = count_stmt.where(BlogCategory.slug == category_slug)
        if search and search.strip():
            count_stmt = count_stmt.where(or_(BlogPost.title_fa.ilike(term), BlogPost.content_fa.ilike(term)))

        total = (await db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)
        rows = (await db.execute(stmt)).all()

        items = []
        for post, cat_name, cat_slug in rows:
            items.append({
                "id": post.id,
                "title_fa": post.title_fa,
                "title_en": post.title_en,
                "slug": post.slug,
                "category_id": post.category_id,
                "category_name": cat_name,
                "category_slug": cat_slug,
                "cover_image_url": post.cover_image_url,
                "author_name": post.author_name,
                "reading_time_min": post.reading_time_min,
                "likes_count": post.likes_count,
                "dislikes_count": post.dislikes_count,
                "views_count": post.views_count,
                "summary": post.content_fa[:120] + "..." if len(post.content_fa) > 120 else post.content_fa,
                "created_at": post.created_at,
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @classmethod
    async def get_post_detail(
        cls,
        db: AsyncSession,
        post_id_or_slug: str,
        user_id: int | None = None,
        redis: aioredis.Redis | None = None,
    ) -> dict:
        """Fetch article detail by id or slug, increment view counter, and check user interaction."""
        await cls.seed_blog_data(db)
        stmt = select(BlogPost, BlogCategory.name_fa, BlogCategory.slug).join(
            BlogCategory, BlogPost.category_id == BlogCategory.id
        )

        if post_id_or_slug.isdigit():
            stmt = stmt.where(BlogPost.id == int(post_id_or_slug))
        else:
            stmt = stmt.where(BlogPost.slug == post_id_or_slug)

        row = (await db.execute(stmt)).first()
        if not row:
            raise NotFoundException("مقاله مورد نظر یافت نشد.")

        post, cat_name, cat_slug = row

        # Increment view count
        post.views_count += 1
        await db.commit()
        await db.refresh(post)

        # Check user like/dislike state
        user_interaction = None
        if user_id:
            interact_stmt = select(BlogInteraction.interaction_type).where(
                BlogInteraction.post_id == post.id,
                BlogInteraction.user_id == user_id,
            )
            user_interaction = (await db.execute(interact_stmt)).scalar_one_or_none()

        return {
            "id": post.id,
            "title_fa": post.title_fa,
            "title_en": post.title_en,
            "slug": post.slug,
            "category_id": post.category_id,
            "category_name": cat_name,
            "category_slug": cat_slug,
            "content_fa": post.content_fa,
            "content_en": post.content_en,
            "cover_image_url": post.cover_image_url,
            "author_name": post.author_name,
            "reading_time_min": post.reading_time_min,
            "likes_count": post.likes_count,
            "dislikes_count": post.dislikes_count,
            "views_count": post.views_count,
            "user_interaction": user_interaction,
            "created_at": post.created_at,
        }

    @classmethod
    async def toggle_interaction(
        cls,
        db: AsyncSession,
        post_id: int,
        user_id: int,
        target_action: str,  # "like" or "dislike"
        redis: aioredis.Redis | None = None,
    ) -> dict:
        """Toggle like/dislike on a blog post."""
        if target_action not in ["like", "dislike"]:
            raise BadRequestException("نوع تعامل نامعتبر است.")

        post_stmt = select(BlogPost).where(BlogPost.id == post_id)
        post = (await db.execute(post_stmt)).scalar_one_or_none()
        if not post:
            raise NotFoundException("مقاله مورد نظر یافت نشد.")

        existing_stmt = select(BlogInteraction).where(
            BlogInteraction.post_id == post_id,
            BlogInteraction.user_id == user_id,
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()

        if existing is None:
            # New interaction
            interaction = BlogInteraction(
                post_id=post_id,
                user_id=user_id,
                interaction_type=target_action,
            )
            db.add(interaction)
            if target_action == "like":
                post.likes_count += 1
            else:
                post.dislikes_count += 1
            current_state = target_action
        elif existing.interaction_type == target_action:
            # Same clicked -> remove/toggle off
            await db.delete(existing)
            if target_action == "like":
                post.likes_count = max(0, post.likes_count - 1)
            else:
                post.dislikes_count = max(0, post.dislikes_count - 1)
            current_state = None
        else:
            # Switch from like to dislike or vice versa
            if target_action == "like":
                post.likes_count += 1
                post.dislikes_count = max(0, post.dislikes_count - 1)
            else:
                post.dislikes_count += 1
                post.likes_count = max(0, post.likes_count - 1)
            existing.interaction_type = target_action
            current_state = target_action

        await db.commit()
        await db.refresh(post)

        # Invalidate cache if present
        if redis:
            try:
                await redis.delete(f"drgame:blog:post:{post.id}")
            except Exception:
                pass

        return {
            "status": "success",
            "current_state": current_state,
            "likes_count": post.likes_count,
            "dislikes_count": post.dislikes_count,
        }

    # ── Admin CRUD Endpoints ───────────────────────────────────────────────────

    @classmethod
    async def admin_list_posts(
        cls,
        db: AsyncSession,
        search: str | None = None,
        category_id: int | None = None,
        is_published: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """List blog posts for admin panel with filters and pagination."""
        stmt = select(BlogPost)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(or_(BlogPost.title_fa.ilike(term), BlogPost.title_en.ilike(term)))
        if category_id:
            stmt = stmt.where(BlogPost.category_id == category_id)
        if is_published is not None:
            stmt = stmt.where(BlogPost.is_published == is_published)

        count_stmt = select(func.count(BlogPost.id))
        if search and search.strip():
            term = f"%{search.strip()}%"
            count_stmt = count_stmt.where(or_(BlogPost.title_fa.ilike(term), BlogPost.title_en.ilike(term)))
        if category_id:
            count_stmt = count_stmt.where(BlogPost.category_id == category_id)
        if is_published is not None:
            count_stmt = count_stmt.where(BlogPost.is_published == is_published)

        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = stmt.order_by(BlogPost.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        posts = (await db.execute(stmt)).scalars().all()

        # Fetch category map
        cat_res = await db.execute(select(BlogCategory))
        cat_map = {c.id: c.name_fa for c in cat_res.scalars().all()}

        items = []
        for p in posts:
            items.append({
                "id": p.id,
                "title_fa": p.title_fa,
                "title_en": p.title_en,
                "slug": p.slug,
                "category_id": p.category_id,
                "category_name": cat_map.get(p.category_id, "عمومی"),
                "cover_image_url": p.cover_image_url,
                "author_name": p.author_name,
                "reading_time_min": p.reading_time_min,
                "likes_count": p.likes_count,
                "dislikes_count": p.dislikes_count,
                "views_count": p.views_count,
                "is_published": p.is_published,
                "created_at": p.created_at,
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @classmethod
    async def create_post(
        cls,
        db: AsyncSession,
        data: BlogPostCreate,
        redis: aioredis.Redis | None = None,
    ) -> BlogPost:
        """Create a new blog post as admin."""
        # Check category existence
        cat = (await db.execute(select(BlogCategory).where(BlogCategory.id == data.category_id))).scalar_one_or_none()
        if not cat:
            raise NotFoundException("دسته‌بندی مقاله یافت نشد.")

        slug = data.slug.strip() if data.slug and data.slug.strip() else f"post-{uuid.uuid4().hex[:8]}"
        # Ensure unique slug
        existing = (await db.execute(select(BlogPost).where(BlogPost.slug == slug))).scalar_one_or_none()
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        post = BlogPost(
            title_fa=data.title_fa,
            title_en=data.title_en or data.title_fa,
            slug=slug,
            category_id=data.category_id,
            content_fa=data.content_fa,
            content_en=data.content_en,
            cover_image_url=data.cover_image_url,
            author_name=data.author_name or "تیم تحریریه دکتر گیم",
            reading_time_min=data.reading_time_min,
            is_published=data.is_published,
        )
        db.add(post)
        await db.commit()
        await db.refresh(post)

        if redis:
            try:
                # Invalidate blog caches
                async for key in redis.scan_iter("drgame:blog:*"):
                    await redis.delete(key)
            except Exception:
                pass

        return post

    @classmethod
    async def update_post(
        cls,
        db: AsyncSession,
        post_id: int,
        data: BlogPostUpdate,
        redis: aioredis.Redis | None = None,
    ) -> BlogPost:
        """Update an existing blog post."""
        post = (await db.execute(select(BlogPost).where(BlogPost.id == post_id))).scalar_one_or_none()
        if not post:
            raise NotFoundException("مقاله مورد نظر یافت نشد.")

        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            if v is not None:
                setattr(post, k, v)

        await db.commit()
        await db.refresh(post)

        if redis:
            try:
                await redis.delete(f"drgame:blog:post:{post.id}")
                await redis.delete(f"drgame:blog:post:{post.slug}")
                async for key in redis.scan_iter("drgame:blog:posts:*"):
                    await redis.delete(key)
            except Exception:
                pass

        return post

    @classmethod
    async def delete_post(
        cls,
        db: AsyncSession,
        post_id: int,
        redis: aioredis.Redis | None = None,
    ) -> dict:
        """Delete a blog post."""
        post = (await db.execute(select(BlogPost).where(BlogPost.id == post_id))).scalar_one_or_none()
        if not post:
            raise NotFoundException("مقاله مورد نظر یافت نشد.")

        await db.delete(post)
        await db.commit()

        if redis:
            try:
                await redis.delete(f"drgame:blog:post:{post.id}")
                await redis.delete(f"drgame:blog:post:{post.slug}")
                async for key in redis.scan_iter("drgame:blog:posts:*"):
                    await redis.delete(key)
            except Exception:
                pass

        return {"status": "success", "message": "مقاله با موفقیت حذف شد."}

    @classmethod
    async def create_category(
        cls,
        db: AsyncSession,
        data: BlogCategoryCreate,
        redis: aioredis.Redis | None = None,
    ) -> BlogCategory:
        """Create blog category."""
        existing = (await db.execute(select(BlogCategory).where(BlogCategory.slug == data.slug))).scalar_one_or_none()
        if existing:
            raise ConflictException("دسته‌بندی با این اسلاگ قبلاً ثبت شده است.")

        cat = BlogCategory(
            name_fa=data.name_fa,
            name_en=data.name_en,
            slug=data.slug,
        )
        db.add(cat)
        await db.commit()
        await db.refresh(cat)

        if redis:
            try:
                await redis.delete("drgame:blog:categories")
            except Exception:
                pass

        return cat

    @classmethod
    async def update_category(
        cls,
        db: AsyncSession,
        category_id: int,
        data: BlogCategoryUpdate,
        redis: aioredis.Redis | None = None,
    ) -> BlogCategory:
        """Update category details."""
        cat = (await db.execute(select(BlogCategory).where(BlogCategory.id == category_id))).scalar_one_or_none()
        if not cat:
            raise NotFoundException("دسته‌بندی یافت نشد.")

        update_dict = data.model_dump(exclude_unset=True)
        for k, v in update_dict.items():
            if v is not None:
                setattr(cat, k, v)

        await db.commit()
        await db.refresh(cat)

        if redis:
            try:
                await redis.delete("drgame:blog:categories")
            except Exception:
                pass

        return cat

    @classmethod
    async def delete_category(
        cls,
        db: AsyncSession,
        category_id: int,
        redis: aioredis.Redis | None = None,
    ) -> dict:
        """Delete blog category if no posts attached."""
        posts_count = (await db.execute(select(func.count(BlogPost.id)).where(BlogPost.category_id == category_id))).scalar() or 0
        if posts_count > 0:
            raise ConflictException("امکان حذف دسته‌بندی دارای مقاله وجود ندارد.")

        cat = (await db.execute(select(BlogCategory).where(BlogCategory.id == category_id))).scalar_one_or_none()
        if not cat:
            raise NotFoundException("دسته‌بندی یافت نشد.")

        await db.delete(cat)
        await db.commit()

        if redis:
            try:
                await redis.delete("drgame:blog:categories")
            except Exception:
                pass

        return {"status": "success", "message": "دسته‌بندی با موفقیت حذف شد."}

