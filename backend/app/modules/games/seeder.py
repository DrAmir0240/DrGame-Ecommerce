import asyncio
import json
import logging
import os
import re
from pathlib import Path
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, Base, engine
from app.modules.games.models import Game, GameFile
from app.modules.users.models import User, UserProfile
from app.modules.orders.models import Order, DiscountCode
from app.modules.subscriptions.models import SubscriptionTier, UserSubscription

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drgame.seeder")

GENRE_MAP = {
    "Action-Adventure": "اکشن ماجراجویی",
    "Action RPG": "نقش‌آفرینی اکشن",
    "RPG": "نقش‌آفرینی",
    "Survival Horror": "ترس و بقا",
    "Fighting": "مبارزه‌ای",
    "First-Person Shooter": "شوتر اول شخص",
    "Platformer": "سکوبازی",
    "Stealth": "مخفی‌کاری",
    "Racing": "مسابقه‌ای و ماشین‌سواری",
    "Sports": "ورزشی",
    "Open World": "جهان‌باز",
    "Horror": "وحشت",
    "Shooter": "تیراندازی",
    "Tactical RPG": "نقش‌آفرینی تاکتیکی",
    "Adventure": "ماجراجویی",
    "Simulation": "شبیه‌ساز",
    "Strategy": "استراتژی",
}

DEFAULT_IMAGES = [
    "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
    "https://media.rawg.io/media/games/618/618c204facf0e8da3719859ec7680224.jpg",
    "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
    "https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg",
    "https://media.rawg.io/media/games/d82/d8236ac5909747380be7cac8847c3e61.jpg",
    "https://media.rawg.io/media/games/7cf/7cfc92f8b5257e1081512a830153835f.jpg",
]


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


async def run_seed():
    logger.info("Ensuring database tables exist...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    data_dir = Path(__file__).resolve().parent.parent.parent / "data"
    games_file = data_dir / "games.json"
    desc_file = data_dir / "descriptions.json"

    if not games_file.exists():
        logger.error(f"Games file not found at: {games_file}")
        return

    with open(games_file, "r", encoding="utf-8") as f:
        raw_games = json.load(f)

    descriptions = {}
    if desc_file.exists():
        with open(desc_file, "r", encoding="utf-8") as f:
            descriptions = json.load(f)

    logger.info(f"Loaded {len(raw_games)} games from source dataset.")

    async with AsyncSessionLocal() as session:
        created_games_count = 0
        created_files_count = 0

        for idx, g in enumerate(raw_games):
            title = g.get("title", f"Game {idx+1}")
            slug = slugify(title)
            if not slug:
                slug = f"game-{idx+1}"

            # Check if game exists
            q = select(Game).where(Game.slug == slug)
            existing = (await session.execute(q)).scalar_one_or_none()

            # Find matching description
            desc_info = descriptions.get(slug, {})
            desc_text = (
                desc_info.get("description_fa")
                or desc_info.get("description")
                or f"دیتای رسمی و کامل بازی {title} با سرعت دانلود بالا و لینک مستقیم اختصاصی."
            )

            genre_en = g.get("category", "Action-Adventure")
            genre_fa = GENRE_MAP.get(genre_en, "اکشن")

            platforms = [p.upper() for p in g.get("platforms", ["ps4"])]
            if not platforms:
                platforms = ["PS4"]

            # Calculate deterministic realistic size
            base_size = 28.5 + (abs(hash(title)) % 65)
            year = 2018 + (abs(hash(title)) % 7)
            metacritic = 78 + (abs(hash(title)) % 20)
            img = DEFAULT_IMAGES[idx % len(DEFAULT_IMAGES)]

            if not existing:
                game = Game(
                    slug=slug,
                    title=title,
                    studio=g.get("company", "PlayStation Studios"),
                    genre_en=genre_en,
                    genre_fa=genre_fa,
                    platforms=platforms,
                    size_gb=round(base_size, 1),
                    metacritic=metacritic,
                    year=year,
                    image=img,
                    description=desc_text,
                    mode="تک‌نفره / داستانی",
                    status="منتشر شده",
                    is_featured=g.get("famous", False),
                )
                session.add(game)
                await session.flush()
                created_games_count += 1
                game_id = game.id
            else:
                game_id = existing.id

            # Create categorized files if none exist
            files_q = select(GameFile).where(GameFile.game_id == game_id)
            has_files = (await session.execute(files_q)).scalars().first()

            if not has_files:
                import hashlib
                files_spec = [
                    (
                        "دیتای اصلی بازی (Main Game Data)",
                        1,
                        round(base_size, 1),
                        f"https://cdn.drgame.ir/pkgs/{slug}/{slug}-data.pkg",
                    ),
                    (
                        "زیرنویس فارسی اختصاصی (Persian Subtitle)",
                        2,
                        0.18,
                        f"https://cdn.drgame.ir/pkgs/{slug}/{slug}-sub-fa.pkg",
                    ),
                    (
                        "فایل چیت و سیو ۱۰۰٪ (Cheat & Trainer)",
                        3,
                        0.03,
                        f"https://cdn.drgame.ir/pkgs/{slug}/{slug}-trainer-cheat.zip",
                    ),
                    (
                        "دی‌ال‌سی و آپدیت‌ها (DLC & Updates)",
                        4,
                        round(min(15.0, base_size * 0.22), 1),
                        f"https://cdn.drgame.ir/pkgs/{slug}/{slug}-dlc-pack.pkg",
                    ),
                    (
                        "دوبله فارسی اختصاصی (Persian Dubbing)",
                        5,
                        round(min(3.8, base_size * 0.08), 1),
                        f"https://cdn.drgame.ir/pkgs/{slug}/{slug}-dub-fa.pkg",
                    ),
                ]
                for file_name, file_num, file_sz, file_url in files_spec:
                    mock_hash = hashlib.sha256(f"{slug}-{file_num}".encode()).hexdigest()
                    file_record = GameFile(
                        game_id=game_id,
                        part_name=file_name,
                        part_number=file_num,
                        size_gb=file_sz,
                        sha256=mock_hash,
                        download_url=file_url,
                        is_active=True,
                    )
                    session.add(file_record)
                    created_files_count += 1

        await session.commit()
        logger.info(
            f"Database Seeding Complete! Inserted {created_games_count} new games and {created_files_count} file parts."
        )


if __name__ == "__main__":
    asyncio.run(run_seed())
