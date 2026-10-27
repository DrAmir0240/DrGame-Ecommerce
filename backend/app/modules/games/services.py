"""Games service: filtering, Redis caching, like/dislike toggle, and wishlist logic."""
import hashlib
import json
import logging
from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, func, and_, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis

from app.core.exceptions import NotFoundError, BadRequestError
from app.modules.games.models import Game, Genre, GameInteraction, GameDownloadLink
from app.modules.games.schemas import (
    GameCardOut,
    GameDetailOut,
    PaginatedGamesResponse,
    InteractionResponse,
    GameDownloadLinkOut,
)

logger = logging.getLogger("drgame.games_service")

class GamesService:

    @staticmethod
    def compute_catalog_cache_key(filters: dict) -> str:
        """Create deterministic MD5 hash of query parameters for Redis key."""
        serialized = json.dumps(filters, sort_keys=True)
        query_hash = hashlib.md5(serialized.encode("utf-8")).hexdigest()
        return f"drgame:games:catalog:{query_hash}"

    @staticmethod
    async def get_catalog(
        db: AsyncSession,
        redis: aioredis.Redis,
        search: str | None = None,
        genre: str | None = None,
        platform: str | None = None,
        max_size_gb: float | None = None,
        min_rating: float | None = None,
        is_two_player: bool | None = None,
        has_vr: bool | None = None,
        release_status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedGamesResponse:
        """Fetch filtered games with Redis aggressive caching (TTL 1800s)."""
        cache_params = {
            "search": search,
            "genre": genre,
            "platform": platform,
            "max_size_gb": max_size_gb,
            "min_rating": min_rating,
            "is_two_player": is_two_player,
            "has_vr": has_vr,
            "page": page,
            "page_size": page_size,
        }
        if release_status is not None:
            cache_params["release_status"] = release_status
        cache_key = GamesService.compute_catalog_cache_key(cache_params)

        # 1. Try Redis cache
        try:
            cached_data = await redis.get(cache_key)
            if cached_data:
                parsed = json.loads(cached_data)
                return PaginatedGamesResponse(**parsed)
        except Exception as e:
            logger.warning(f"Redis cache read error: {e}")

        # 2. Build SQLAlchemy query
        conditions = [Game.is_active == True]

        if search:
            clean_search = f"%{search.strip()}%"
            conditions.append(or_(Game.title_en.ilike(clean_search), Game.title_fa.ilike(clean_search)))

        if max_size_gb is not None:
            conditions.append(Game.download_size_gb <= max_size_gb)

        if min_rating is not None:
            conditions.append(Game.rating >= min_rating)

        if is_two_player is not None:
            conditions.append(Game.is_two_player == is_two_player)

        if has_vr is True:
            conditions.append(Game.has_vr == True)

        if release_status:
            clean_status = release_status.strip().lower()
            today = datetime.now().strftime("%Y-%m-%d")
            if clean_status in ("released", "published"):
                conditions.append(and_(Game.released.isnot(None), Game.released != "", Game.released <= today))
            elif clean_status in ("early", "early_access", "upcoming"):
                conditions.append(or_(Game.released.is_(None), Game.released == "", Game.released > today))

        if genre:
            clean_genre = genre.strip().lower()
            if "rpg" in clean_genre or "role" in clean_genre:
                conditions.append(or_(
                    cast(Game.genres, String).ilike("%rpg%"),
                    cast(Game.genres, String).ilike("%role%"),
                    cast(Game.genres, String).ilike(f"%{clean_genre}%")
                ))
            else:
                conditions.append(cast(Game.genres, String).ilike(f"%{clean_genre}%"))

        if platform:
            clean_plat = platform.strip().upper()
            conditions.append(cast(Game.platforms, String).ilike(f"%{clean_plat}%"))

        # Count total items
        count_stmt = select(func.count(Game.id)).where(and_(*conditions))
        total = await db.scalar(count_stmt) or 0

        # Fetch page items
        offset = (page - 1) * page_size
        stmt = (
            select(Game)
            .where(and_(*conditions))
            .order_by(Game.rating.desc(), Game.id.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(stmt)
        games = result.scalars().all()

        filtered_games = [GameCardOut.model_validate(g) for g in games]

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        response = PaginatedGamesResponse(
            items=filtered_games,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

        # 3. Cache response in Redis
        try:
            await redis.setex(cache_key, 1800, response.model_dump_json())
        except Exception as e:
            logger.warning(f"Redis cache write error: {e}")

        return response

    @staticmethod
    async def get_game_details(
        db: AsyncSession,
        redis: aioredis.Redis,
        game_id: int,
        user_id: int | None = None
    ) -> GameDetailOut:
        """Fetch full game details, download links, and current user's interaction."""
        game = await db.scalar(select(Game).where(Game.id == game_id, Game.is_active == True))
        if not game:
            raise NotFoundError("بازی مورد نظر یافت نشد.")

        # Download links
        links_stmt = select(GameDownloadLink).where(GameDownloadLink.game_id == game.id, GameDownloadLink.is_active == True).order_by(GameDownloadLink.part_number.asc())
        links_res = await db.execute(links_stmt)
        download_links = [GameDownloadLinkOut.model_validate(l) for l in links_res.scalars().all()]

        # User interaction
        user_interaction = None
        in_wishlist = False
        if user_id:
            interactions = (
                await db.execute(
                    select(GameInteraction).where(
                        GameInteraction.game_id == game_id,
                        GameInteraction.user_id == user_id
                    )
                )
            ).scalars().all()
            for inter in interactions:
                if inter.interaction_type in ("like", "dislike"):
                    user_interaction = inter.interaction_type
                elif inter.interaction_type == "wishlist":
                    in_wishlist = True

        out = GameDetailOut.model_validate(game)
        out.download_links = download_links
        out.user_interaction = user_interaction
        out.in_wishlist = in_wishlist
        return out

    @staticmethod
    async def toggle_like(
        db: AsyncSession,
        redis: aioredis.Redis,
        game_id: int,
        user_id: int
    ) -> InteractionResponse:
        """Toggle like vote. Authenticated users only. Removes like if re-clicked, replaces dislike."""
        game = await db.scalar(select(Game).where(Game.id == game_id))
        if not game:
            raise NotFoundError("بازی یافت نشد.")

        stmt = select(GameInteraction).where(
            GameInteraction.game_id == game_id,
            GameInteraction.user_id == user_id,
            GameInteraction.interaction_type.in_(["like", "dislike"])
        )
        existing = await db.scalar(stmt)

        if existing:
            if existing.interaction_type == "like":
                # User already liked: un-like (toggle off)
                await db.delete(existing)
                game.likes_count = max(0, game.likes_count - 1)
                current_vote = None
            else:
                # Was dislike, switch to like
                existing.interaction_type = "like"
                game.dislikes_count = max(0, game.dislikes_count - 1)
                game.likes_count += 1
                current_vote = "like"
        else:
            # New like
            new_inter = GameInteraction(game_id=game_id, user_id=user_id, interaction_type="like")
            db.add(new_inter)
            game.likes_count += 1
            current_vote = "like"

        await db.commit()
        await db.refresh(game)

        # Invalidate cache
        await redis.delete(f"drgame:game:{game_id}")
        keys = await redis.keys("drgame:games:catalog:*")
        if keys:
            await redis.delete(*keys)

        # Check wishlist status
        wishlist_record = await db.scalar(
            select(GameInteraction).where(
                GameInteraction.game_id == game_id,
                GameInteraction.user_id == user_id,
                GameInteraction.interaction_type == "wishlist"
            )
        )

        return InteractionResponse(
            game_id=game_id,
            likes_count=game.likes_count,
            dislikes_count=game.dislikes_count,
            wishlist_count=game.wishlist_count,
            user_interaction=current_vote,
            in_wishlist=bool(wishlist_record)
        )

    @staticmethod
    async def toggle_dislike(
        db: AsyncSession,
        redis: aioredis.Redis,
        game_id: int,
        user_id: int
    ) -> InteractionResponse:
        """Toggle dislike vote. Authenticated users only. Removes dislike if re-clicked, replaces like."""
        game = await db.scalar(select(Game).where(Game.id == game_id))
        if not game:
            raise NotFoundError("بازی یافت نشد.")

        stmt = select(GameInteraction).where(
            GameInteraction.game_id == game_id,
            GameInteraction.user_id == user_id,
            GameInteraction.interaction_type.in_(["like", "dislike"])
        )
        existing = await db.scalar(stmt)

        if existing:
            if existing.interaction_type == "dislike":
                # Toggle off dislike
                await db.delete(existing)
                game.dislikes_count = max(0, game.dislikes_count - 1)
                current_vote = None
            else:
                # Switch from like to dislike
                existing.interaction_type = "dislike"
                game.likes_count = max(0, game.likes_count - 1)
                game.dislikes_count += 1
                current_vote = "dislike"
        else:
            new_inter = GameInteraction(game_id=game_id, user_id=user_id, interaction_type="dislike")
            db.add(new_inter)
            game.dislikes_count += 1
            current_vote = "dislike"

        await db.commit()
        await db.refresh(game)

        # Invalidate cache
        await redis.delete(f"drgame:game:{game_id}")
        keys = await redis.keys("drgame:games:catalog:*")
        if keys:
            await redis.delete(*keys)

        wishlist_record = await db.scalar(
            select(GameInteraction).where(
                GameInteraction.game_id == game_id,
                GameInteraction.user_id == user_id,
                GameInteraction.interaction_type == "wishlist"
            )
        )

        return InteractionResponse(
            game_id=game_id,
            likes_count=game.likes_count,
            dislikes_count=game.dislikes_count,
            wishlist_count=game.wishlist_count,
            user_interaction=current_vote,
            in_wishlist=bool(wishlist_record)
        )

    @staticmethod
    async def toggle_wishlist(
        db: AsyncSession,
        redis: aioredis.Redis,
        game_id: int,
        user_id: int
    ) -> InteractionResponse:
        """Toggle game in user wishlist."""
        game = await db.scalar(select(Game).where(Game.id == game_id))
        if not game:
            raise NotFoundError("بازی یافت نشد.")

        stmt = select(GameInteraction).where(
            GameInteraction.game_id == game_id,
            GameInteraction.user_id == user_id,
            GameInteraction.interaction_type == "wishlist"
        )
        existing = await db.scalar(stmt)

        if existing:
            await db.delete(existing)
            game.wishlist_count = max(0, game.wishlist_count - 1)
            in_wishlist = False
        else:
            new_inter = GameInteraction(game_id=game_id, user_id=user_id, interaction_type="wishlist")
            db.add(new_inter)
            game.wishlist_count += 1
            in_wishlist = True

        await db.commit()
        await db.refresh(game)

        # Invalidate cache
        await redis.delete(f"drgame:game:{game_id}")

        # Check vote
        vote_record = await db.scalar(
            select(GameInteraction).where(
                GameInteraction.game_id == game_id,
                GameInteraction.user_id == user_id,
                GameInteraction.interaction_type.in_(["like", "dislike"])
            )
        )

        return InteractionResponse(
            game_id=game_id,
            likes_count=game.likes_count,
            dislikes_count=game.dislikes_count,
            wishlist_count=game.wishlist_count,
            user_interaction=vote_record.interaction_type if vote_record else None,
            in_wishlist=in_wishlist
        )

    @staticmethod
    async def get_user_wishlist(db: AsyncSession, user_id: int):
        """Fetch games currently saved in the user's wishlist."""
        from app.modules.games.schemas import GameCardOut
        stmt = (
            select(Game)
            .join(GameInteraction, Game.id == GameInteraction.game_id)
            .where(
                GameInteraction.user_id == user_id,
                GameInteraction.interaction_type == "wishlist",
                Game.is_active == True,
            )
            .order_by(GameInteraction.id.desc())
        )
        games = (await db.execute(stmt)).scalars().all()
        return [
            GameCardOut(
                id=g.id,
                title_fa=g.title_fa,
                title_en=g.title_en,
                slug=g.slug,
                cover_image_url=g.cover_image_url,
                rating=g.rating,
                download_size_gb=g.download_size_gb,
                is_two_player=g.is_two_player,
                has_vr=g.has_vr,
                platforms=g.platforms or [],
                genres=g.genres or [],
                likes_count=g.likes_count,
                dislikes_count=g.dislikes_count,
                wishlist_count=g.wishlist_count,
                in_wishlist=True,
            )
            for g in games
        ]

    @staticmethod
    async def list_game_download_files(db: AsyncSession, game_id: int) -> list:
        """Fetch all active download files (data, cheat, dlc, subtitle, dubbing) for a game."""
        from app.modules.games.download_models import GameDownloadFile
        stmt = (
            select(GameDownloadFile)
            .where(GameDownloadFile.game_id == game_id, GameDownloadFile.is_active == True)
            .order_by(GameDownloadFile.id.asc())
        )
        return list((await db.execute(stmt)).scalars().all())

    @staticmethod
    async def generate_download_file_link(
        db: AsyncSession,
        redis: aioredis.Redis,
        user_id: int,
        game_id: int,
        file_id: int,
    ) -> dict:
        """
        Generate a secure one-time download link for a 5-part game file.
        Enforces allowed subscription tier, deducts file_size_gb from UserQuota instantly,
        and logs the transaction in UserDownloadHistory.
        Strict mandate: NO free re-download capability.
        """
        from datetime import datetime, timezone
        from app.core.config import settings
        from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
        from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory
        from app.modules.subscriptions.models import UserSubscription
        from app.modules.quota.models import UserQuota, QuotaConsumptionLog

        # 1. Fetch file
        stmt = select(GameDownloadFile).where(
            GameDownloadFile.id == file_id,
            GameDownloadFile.game_id == game_id,
            GameDownloadFile.is_active == True,
        )
        file = (await db.execute(stmt)).scalar_one_or_none()
        if not file:
            raise NotFoundException("فایل دانلودی مورد نظر یافت نشد یا غیرفعال است.")

        # 2. Check user's active subscription tier & feature permissions
        from app.modules.subscriptions.models import SubscriptionTier
        now = datetime.now(timezone.utc)
        sub_stmt = (
            select(UserSubscription)
            .where(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active",
                UserSubscription.end_date > now,
            )
            .order_by(UserSubscription.end_date.desc())
            .limit(1)
        )
        active_sub = (await db.execute(sub_stmt)).scalar_one_or_none()
        if not active_sub:
            raise ForbiddenException("برای دانلود این فایل نیاز به اشتراک فعال دارید.")

        user_tier = active_sub.tier_code
        tier_obj = (await db.execute(
            select(SubscriptionTier).where(SubscriptionTier.code == user_tier)
        )).scalar_one_or_none()

        if tier_obj:
            ft = file.file_type.lower()
            if ft == "data" and not tier_obj.allow_data:
                raise ForbiddenException(f"دیتای رسمی بازی در سطح اشتراک {tier_obj.name_fa} فعال نمی‌باشد.")
            if ft == "cheat" and not tier_obj.allow_cheat:
                raise ForbiddenException(f"چیت و ترینر در سطح اشتراک {tier_obj.name_fa} فعال نمی‌باشد.")
            if ft == "dlc" and not tier_obj.allow_dlc:
                raise ForbiddenException(f"بسته‌های الحاقی (DLC) در سطح اشتراک {tier_obj.name_fa} فعال نمی‌باشد.")
            if ft == "subtitle" and not tier_obj.allow_subtitles:
                raise ForbiddenException(f"زیرنویس فارسی در سطح اشتراک {tier_obj.name_fa} فعال نمی‌باشد.")
            if ft == "dubbing" and not tier_obj.allow_dubbing:
                raise ForbiddenException(f"دوبله فارسی در سطح اشتراک {tier_obj.name_fa} فعال نمی‌باشد.")

        # Check allowed_tiers fallback
        allowed_tiers = file.allowed_tiers or ["gold", "silver", "bronze"]
        if user_tier not in allowed_tiers:
            raise ForbiddenException(
                f"سطح اشتراک فعلی شما ({user_tier}) مجاز به دریافت این فایل ({file.file_type}) نمی‌باشد."
            )

        # 3. Check and deduct user quota
        quota_stmt = select(UserQuota).where(UserQuota.user_id == user_id)
        quota = (await db.execute(quota_stmt)).scalar_one_or_none()
        if not quota:
            quota = UserQuota(
                user_id=user_id,
                total_quota_gb=0.0,
                used_quota_gb=0.0,
                remaining_quota_gb=0.0,
            )
            db.add(quota)
            await db.commit()
            await db.refresh(quota)

        if quota.remaining_quota_gb < file.file_size_gb:
            raise BadRequestException(
                f"حجم سهمیه دانلودی باقیمانده شما ({quota.remaining_quota_gb:.2f} گیگابایت) برای دریافت این فایل ({file.file_size_gb:.2f} گیگابایت) کافی نیست."
            )

        quota.used_quota_gb += file.file_size_gb
        quota.remaining_quota_gb = max(0.0, quota.total_quota_gb - quota.used_quota_gb)

        # 4. Log QuotaConsumptionLog
        bytes_transferred = int(file.file_size_gb * (1024**3))
        log = QuotaConsumptionLog(
            user_id=user_id,
            game_id=game_id,
            bytes_downloaded=bytes_transferred,
            gb_deducted=file.file_size_gb,
            download_server_id="drgame-cdn-main",
        )
        db.add(log)

        # 5. Log UserDownloadHistory (strictly NO re-download)
        history = UserDownloadHistory(
            user_id=user_id,
            game_id=game_id,
            file_id=file.id,
            file_type=file.file_type,
            file_title=file.title,
            file_size_gb=file.file_size_gb,
            downloaded_at=now,
        )
        db.add(history)

        # 6. Generate signed download link (expires in 1 hour)
        timestamp = int(now.timestamp())
        sig = hashlib.sha256(
            f"{user_id}:{file.id}:{settings.WEBHOOK_SECRET_KEY}:{timestamp}".encode("utf-8")
        ).hexdigest()[:24]
        delimiter = "&" if "?" in file.download_url else "?"
        signed_url = f"{file.download_url}{delimiter}token={sig}&uid={user_id}&exp={timestamp + 3600}"

        await db.commit()
        await db.refresh(quota)

        # Bust Redis quota cache
        await redis.delete(f"drgame:user:{user_id}:quota")

        return {
            "status": "success",
            "file_id": file.id,
            "game_id": file.game_id,
            "file_type": file.file_type,
            "file_title": file.title,
            "file_size_gb": file.file_size_gb,
            "download_url": signed_url,
            "remaining_quota_gb": round(quota.remaining_quota_gb, 2),
            "message": "لینک دانلود با موفقیت صادر شد و حجم فایل از سهمیه کسر گردید.",
        }

    @staticmethod
    async def get_user_download_history(
        db: AsyncSession,
        user_id: int,
        limit: int = 50,
    ) -> list[dict]:
        """Fetch user download history for dashboard."""
        from app.modules.games.download_models import UserDownloadHistory
        from app.modules.games.models import Game

        stmt = (
            select(UserDownloadHistory, Game.title_fa, Game.title_en, Game.cover_image_url)
            .outerjoin(Game, UserDownloadHistory.game_id == Game.id)
            .where(UserDownloadHistory.user_id == user_id)
            .order_by(UserDownloadHistory.downloaded_at.desc())
            .limit(limit)
        )
        results = (await db.execute(stmt)).all()

        history_items = []
        for hist, title_fa, title_en, cover_url in results:
            history_items.append({
                "id": hist.id,
                "user_id": hist.user_id,
                "game_id": hist.game_id,
                "game_title": title_fa or hist.file_title,
                "game_title_en": title_en or hist.file_title,
                "cover_url": cover_url,
                "file_id": hist.file_id,
                "file_type": hist.file_type,
                "part_name": hist.file_title,
                "file_title": hist.file_title,
                "file_size_gb": hist.file_size_gb,
                "downloaded_at": hist.downloaded_at,
                "status": "completed",
            })
        return history_items

    @staticmethod
    async def admin_create_download_file(
        db: AsyncSession,
        game_id: int,
        data: dict,
    ):
        """Admin endpoint to attach a 5-part file to a game."""
        from app.modules.games.download_models import GameDownloadFile

        game = await db.scalar(select(Game).where(Game.id == game_id))
        if not game:
            raise NotFoundError("بازی یافت نشد.")

        file = GameDownloadFile(
            game_id=game_id,
            file_type=data["file_type"],
            title=data["title"],
            file_size_gb=data["file_size_gb"],
            download_url=data["download_url"],
            allowed_tiers=data.get("allowed_tiers", ["gold", "silver", "bronze"]),
            version=data.get("version"),
            is_active=data.get("is_active", True),
        )
        db.add(file)
        await db.commit()
        await db.refresh(file)
        return file

    @staticmethod
    async def admin_delete_download_file(db: AsyncSession, file_id: int) -> dict:
        """Admin endpoint to remove a download file."""
        from app.modules.games.download_models import GameDownloadFile

        file = (await db.execute(select(GameDownloadFile).where(GameDownloadFile.id == file_id))).scalar_one_or_none()
        if not file:
            raise NotFoundError("فایل یافت نشد.")
        await db.delete(file)
        await db.commit()
        return {"status": "deleted", "id": file_id}

    @staticmethod
    async def get_similar_games(db: AsyncSession, game_id: int, limit: int = 5) -> List[GameCardOut]:
        """Fetch up to 5 most-liked games that share at least one genre with game_id."""
        target_game = await db.scalar(select(Game).where(Game.id == game_id))
        if not target_game:
            raise NotFoundError("بازی مورد نظر یافت نشد.")

        target_genres = [str(g).lower() for g in (target_game.genres or [])]

        stmt = (
            select(Game)
            .where(Game.id != game_id, Game.is_active == True)
            .order_by(Game.likes_count.desc(), Game.rating.desc())
        )
        res = await db.execute(stmt)
        candidates = list(res.scalars().all())

        similar: List[GameCardOut] = []
        for g in candidates:
            c_genres = [str(x).lower() for x in (g.genres or [])]
            if any(tg in c_genres for tg in target_genres) or not target_genres:
                similar.append(GameCardOut.model_validate(g))
                if len(similar) >= limit:
                    break

        if len(similar) < limit:
            for g in candidates:
                card = GameCardOut.model_validate(g)
                if not any(s.id == card.id for s in similar):
                    similar.append(card)
                    if len(similar) >= limit:
                        break

        return similar

    @staticmethod
    async def list_all_genres(
        db: AsyncSession,
        only_active: bool = False,
        only_top8: bool = False,
    ) -> List[Genre]:
        """Fetch genres ordered by display_order then name."""
        stmt = select(Genre)
        if only_active:
            stmt = stmt.where(Genre.is_active == True)
        if only_top8:
            stmt = stmt.where(Genre.is_top8 == True)
        stmt = stmt.order_by(Genre.display_order.asc(), Genre.name_fa.asc())
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def admin_create_genre(db: AsyncSession, data: dict) -> Genre:
        """Create new genre."""
        existing = await db.scalar(select(Genre).where(Genre.slug == data["slug"]))
        if existing:
            raise BadRequestError("اسلاگ این ژانر تکراری است.")

        genre = Genre(
            name_fa=data["name_fa"],
            name_en=data["name_en"],
            slug=data["slug"],
            icon_name=data.get("icon_name"),
            display_order=data.get("display_order", 0),
            is_top8=data.get("is_top8", False),
            is_active=data.get("is_active", True),
            image_background=data.get("image_background"),
        )
        db.add(genre)
        await db.commit()
        await db.refresh(genre)
        return genre

    @staticmethod
    async def admin_update_genre(db: AsyncSession, genre_id: int, data: dict) -> Genre:
        """Update existing genre."""
        genre = await db.scalar(select(Genre).where(Genre.id == genre_id))
        if not genre:
            raise NotFoundError("ژانر مورد نظر یافت نشد.")

        if "slug" in data and data["slug"] and data["slug"] != genre.slug:
            existing = await db.scalar(select(Genre).where(Genre.slug == data["slug"]))
            if existing:
                raise BadRequestError("اسلاگ وارد شده تکراری است.")

        for k, v in data.items():
            if v is not None:
                setattr(genre, k, v)

        await db.commit()
        await db.refresh(genre)
        return genre

    @staticmethod
    async def admin_delete_genre(db: AsyncSession, genre_id: int) -> dict:
        """Delete genre by id."""
        genre = await db.scalar(select(Genre).where(Genre.id == genre_id))
        if not genre:
            raise NotFoundError("ژانر مورد نظر یافت نشد.")

        await db.delete(genre)
        await db.commit()
        return {"status": "deleted", "id": genre_id}

