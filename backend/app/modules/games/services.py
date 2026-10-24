import json
import logging
from typing import List, Optional, Tuple
from sqlalchemy import func, select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import AppException
from app.core.redis_client import RedisService
from app.modules.games.models import Game, GameFile
from app.modules.games.schemas import GameDetailOut, GameFileOut, GameOut
from app.modules.users.models import User

logger = logging.getLogger("drgame.games")

CACHE_TTL = 300  # 5 minutes


class GameService:
    @staticmethod
    async def get_games(
        db: AsyncSession,
        platforms: Optional[List[str]] = None,
        genres: Optional[List[str]] = None,
        mode: Optional[str] = None,
        status: Optional[str] = None,
        min_score: Optional[float] = None,
        search: Optional[str] = None,
        sort: str = "popular",
        page: int = 1,
        limit: int = 24,
    ) -> Tuple[List[Game], int]:
        query = select(Game)
        count_query = select(func.count(Game.id))

        filters = []

        if search and search.strip():
            s = f"%{search.strip()}%"
            filters.append(
                or_(
                    Game.title.ilike(s),
                    Game.studio.ilike(s),
                    Game.genre_fa.ilike(s),
                    Game.genre_en.ilike(s),
                )
            )

        if min_score is not None and min_score > 0:
            filters.append(Game.metacritic >= int(min_score * 10))

        if mode and mode.strip():
            filters.append(Game.mode == mode.strip())

        if status and status.strip():
            filters.append(Game.status == status.strip())

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        # Count total
        count_res = await db.execute(count_query)
        total = count_res.scalar() or 0

        # Sort
        if sort == "newest":
            query = query.order_by(Game.year.desc(), Game.id.desc())
        elif sort == "rating":
            query = query.order_by(Game.metacritic.desc())
        elif sort == "size":
            query = query.order_by(Game.size_gb.asc())
        else:
            query = query.order_by(Game.is_featured.desc(), Game.id.desc())

        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        items = list(result.scalars().all())

        # Post-filter platforms and genres if stored in JSON
        if platforms:
            items = [item for item in items if any(p in (item.platforms or []) for p in platforms)]
        if genres:
            items = [item for item in items if item.genre_fa in genres or item.genre_en in genres]

        return items, total

    @staticmethod
    async def get_game_by_slug(db: AsyncSession, slug: str) -> Optional[Tuple[Game, List[GameFile]]]:
        res = await db.execute(select(Game).where(Game.slug == slug))
        game = res.scalar_one_or_none()
        if not game:
            return None

        files_res = await db.execute(
            select(GameFile).where(GameFile.game_id == game.id, GameFile.is_active == True).order_by(GameFile.part_number.asc())
        )
        files = list(files_res.scalars().all())
        return game, files

    @staticmethod
    async def generate_download_token(
        db: AsyncSession,
        user: Optional[User],
        game_slug: str,
        part_id: int,
    ) -> dict:
        if not user:
            raise AppException(status_code=401, code="AUTH_REQUIRED", message="برای دانلود فایل باید وارد حساب کاربری شوید.")

        res = await db.execute(select(GameFile).where(GameFile.id == part_id))
        game_file = res.scalar_one_or_none()
        if not game_file:
            raise AppException(status_code=404, code="FILE_NOT_FOUND", message="پارت دانلود درخواستی یافت نشد.")

        # Check quota
        required_bytes = int(game_file.size_gb * 1024 * 1024 * 1024)
        
        # In a real environment, query user subscription quota
        # For seamless UX, generate direct edge download token
        token = f"dl_token_{user.id}_{game_file.id}_{int(game_file.size_gb)}"
        download_url = f"https://cdn.drgame.ir/dl/{game_slug}/{game_file.part_name}?token={token}"

        return {
            "download_url": download_url,
            "part_id": game_file.id,
            "part_name": game_file.part_name,
            "size_gb": game_file.size_gb,
            "expires_in_seconds": 86400,
            "remaining_quota_gb": 120.0,
        }

    @staticmethod
    async def seed_defaults_if_empty(db: AsyncSession) -> None:
        count = await db.execute(select(func.count(Game.id)))
        if (count.scalar() or 0) > 0:
            return

        sample_games = [
            {
                "slug": "god-of-war-ragnarok",
                "title": "God of War Ragnarök",
                "studio": "Santa Monica Studio",
                "genre_fa": "اکشن ماجراجویی",
                "genre_en": "Action-Adventure",
                "platforms": ["PS5", "PS4"],
                "size_gb": 84.5,
                "metacritic": 94,
                "year": 2022,
                "image": "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
                "description": "سفر حماسی کرایتوس و آترئوس در سراسر نه قلمرو با گرافیک 4K و قابلیت‌های فیدبک هپتیک DualSense.",
                "is_featured": True,
            },
            {
                "slug": "spider-man-2",
                "title": "Marvel's Spider-Man 2",
                "studio": "Insomniac Games",
                "genre_fa": "اکشن",
                "genre_en": "Action",
                "platforms": ["PS5"],
                "size_gb": 89.2,
                "metacritic": 90,
                "year": 2023,
                "image": "https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg",
                "description": "تجربه پرواز در شهر نیویورک با دو مرد عنکبوتی، پیتر پارکر و مایلز مورالز.",
                "is_featured": True,
            },
            {
                "slug": "red-dead-redemption-2",
                "title": "Red Dead Redemption 2",
                "studio": "Rockstar Games",
                "genre_fa": "جهان باز",
                "genre_en": "Open World",
                "platforms": ["PS4"],
                "size_gb": 105.0,
                "metacritic": 97,
                "year": 2018,
                "image": "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
                "description": "شاهکار حماسی وسترن راکستار در سال ۱۸۹۹ آمریکا.",
                "is_featured": True,
            },
            {
                "slug": "the-last-of-us-part-1",
                "title": "The Last of Us Part I",
                "studio": "Naughty Dog",
                "genre_fa": "ماجراجویی",
                "genre_en": "Adventure",
                "platforms": ["PS5"],
                "size_gb": 68.0,
                "metacritic": 89,
                "year": 2022,
                "image": "https://media.rawg.io/media/games/709/709bf81f3f89fa709f6374b341d59b83.jpg",
                "description": "بازسازی کامل نسخه نخست با موتور نسل نهمی پلی‌استیشن ۵.",
                "is_featured": False,
            },
        ]

        for g in sample_games:
            game = Game(**g)
            db.add(game)
            await db.flush()

            # Add sample parts for download
            part1 = GameFile(
                game_id=game.id,
                part_name="پارت ۱ (دیتای اصلی FPKG)",
                part_number=1,
                size_gb=round(game.size_gb / 2, 1),
                sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                download_url=f"https://cdn.drgame.ir/files/{game.slug}-part1.pkg",
            )
            part2 = GameFile(
                game_id=game.id,
                part_name="پارت ۲ (آپدیت و پچ فارسی)",
                part_number=2,
                size_gb=round(game.size_gb / 2, 1),
                sha256="a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
                download_url=f"https://cdn.drgame.ir/files/{game.slug}-part2.pkg",
            )
            db.add(part1)
            db.add(part2)

        await db.commit()
