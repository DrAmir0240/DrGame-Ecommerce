"""Database cleanup script to identify and separate DLC/expansion titles from main games catalog."""
import asyncio
import logging
import re
from typing import Optional, Tuple
from sqlalchemy import select, delete, or_
from app.core.database import AsyncSessionLocal
from app.core.redis_client import redis_manager
from app.modules.games.models import Game, GameInteraction, GameDownloadLink
from app.modules.games.download_models import GameDownloadFile, UserDownloadHistory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("drgame.cleanup_dlc")

DLC_PATTERNS = [
    r"\bpack\b",
    r"\bdlc\b",
    r"\bexpansion\b",
    r"\bseason\s*pass\b",
    r"\badd-?on\b",
    r"\bbundle\b",
]
DLC_REGEX = re.compile("|".join(DLC_PATTERNS), re.IGNORECASE)


def parse_parent_and_dlc_title(title: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Attempt to split a title like 'Game Name: DLC Title' or 'Game Name - DLC Title' into ('Game Name', 'DLC Title').
    """
    if " - " in title:
        parts = title.split(" - ", 1)
        parent_candidate = parts[0].strip()
        dlc_candidate = parts[1].strip()
        if len(parent_candidate) > 2 and len(dlc_candidate) > 2:
            return parent_candidate, dlc_candidate
    if ":" in title:
        parts = title.split(":", 1)
        parent_candidate = parts[0].strip()
        dlc_candidate = parts[1].strip()
        if len(parent_candidate) > 2 and len(dlc_candidate) > 2:
            return parent_candidate, dlc_candidate
    return None, None


async def cleanup_dlc_records():
    """Identify DLC records in games table, attach them to parent games or remove orphaned DLCs."""
    logger.info("Starting DLC catalog cleanup...")

    async with AsyncSessionLocal() as db:
        # Fetch all games
        all_games = (await db.scalars(select(Game))).all()
        logger.info(f"Examining {len(all_games)} games in database...")

        games_to_remove = []
        dlcs_migrated = 0
        orphans_removed = 0

        # Build lookup table of main titles and slugs
        title_lookup = {g.title_en.lower().strip(): g for g in all_games}
        slug_lookup = {g.slug.lower().strip(): g for g in all_games}

        for game in all_games:
            title = game.title_en or ""
            is_dlc = bool(DLC_REGEX.search(title))

            parent_name, dlc_name = parse_parent_and_dlc_title(title)

            if not is_dlc and not parent_name:
                continue

            # Look for existing parent game
            parent_game = None
            if parent_name:
                parent_game = title_lookup.get(parent_name.lower())
                if not parent_game:
                    parent_slug = re.sub(r"[^a-z0-9]+", "-", parent_name.lower()).strip("-")
                    parent_game = slug_lookup.get(parent_slug)

            if parent_game and parent_game.id != game.id:
                # Migrate to parent game's GameDownloadFile
                effective_dlc_title = dlc_name or title
                existing_file = await db.scalar(
                    select(GameDownloadFile).where(
                        GameDownloadFile.game_id == parent_game.id,
                        GameDownloadFile.file_type == "dlc",
                        GameDownloadFile.title == effective_dlc_title,
                    )
                )

                if not existing_file:
                    new_file = GameDownloadFile(
                        game_id=parent_game.id,
                        file_type="dlc",
                        title=effective_dlc_title,
                        file_size_gb=game.download_size_gb or 5.0,
                        download_url=f"/api/games/{parent_game.id}/downloads/{game.id}/stream",
                        allowed_tiers=["gold", "silver", "bronze"],
                        is_active=True,
                    )
                    db.add(new_file)
                    dlcs_migrated += 1
                    logger.info(f"✔ Migrated DLC '{effective_dlc_title}' -> Parent Game: '{parent_game.title_en}' (ID {parent_game.id})")

                games_to_remove.append(game)
            elif is_dlc:
                # Orphaned DLC/pack with no parent game in store
                logger.info(f"✖ Flagged orphaned DLC/Pack for catalog removal: '{title}' (ID {game.id})")
                games_to_remove.append(game)
                orphans_removed += 1

        # Delete migrated / orphaned DLC games and their dependent records
        for g in games_to_remove:
            await db.execute(delete(GameInteraction).where(GameInteraction.game_id == g.id))
            await db.execute(delete(GameDownloadLink).where(GameDownloadLink.game_id == g.id))
            await db.execute(delete(GameDownloadFile).where(GameDownloadFile.game_id == g.id))
            await db.execute(delete(UserDownloadHistory).where(UserDownloadHistory.game_id == g.id))
            await db.execute(delete(Game).where(Game.id == g.id))

        await db.commit()

        # Invalidate Redis cache
        try:
            redis = await redis_manager.connect()
            keys = await redis.keys("drgame:games:*")
            if keys:
                await redis.delete(*keys)
            logger.info("Cleared Redis storefront cache.")
        except Exception as e:
            logger.warning(f"Could not clear Redis cache: {e}")

        logger.info(
            f"🎉 DLC Catalog Cleanup Finished:\n"
            f"  - Total DLC games processed: {len(games_to_remove)}\n"
            f"  - Attached to parent games: {dlcs_migrated}\n"
            f"  - Orphaned packs removed: {orphans_removed}"
        )


if __name__ == "__main__":
    asyncio.run(cleanup_dlc_records())
