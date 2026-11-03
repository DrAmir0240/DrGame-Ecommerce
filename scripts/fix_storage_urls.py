#!/usr/bin/env python3
"""
DrGame Platform — Utility to migrate existing /media/games/ image URLs to https://storage.gamedr.ir
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.core.database import AsyncSessionLocal
from app.modules.games.models import Game
from app.core.redis_client import redis_manager
from sqlalchemy import select


async def main():
    target_storage = "https://storage.gamedr.ir"
    print(f"Connecting to database to update media URLs to: {target_storage}...")

    async with AsyncSessionLocal() as session:
        stmt = select(Game)
        result = await session.scalars(stmt)
        games = list(result.all())

        updated_count = 0
        for g in games:
            changed = False
            if g.cover_image_url and g.cover_image_url.startswith("/media/"):
                g.cover_image_url = g.cover_image_url.replace("/media/", f"{target_storage}/")
                changed = True
            elif g.cover_image_url and "storage.c2.liara.site/" in g.cover_image_url:
                clean_path = g.cover_image_url.split("storage.c2.liara.site/")[-1].lstrip("/")
                if clean_path.startswith("drgame-storage/"):
                    clean_path = clean_path.replace("drgame-storage/", "")
                g.cover_image_url = f"{target_storage}/{clean_path}"
                changed = True

            if g.banner_image_url and g.banner_image_url.startswith("/media/"):
                g.banner_image_url = g.banner_image_url.replace("/media/", f"{target_storage}/")
                changed = True
            elif g.banner_image_url and "storage.c2.liara.site/" in g.banner_image_url:
                clean_path = g.banner_image_url.split("storage.c2.liara.site/")[-1].lstrip("/")
                if clean_path.startswith("drgame-storage/"):
                    clean_path = clean_path.replace("drgame-storage/", "")
                g.banner_image_url = f"{target_storage}/{clean_path}"
                changed = True

            if g.screenshots and isinstance(g.screenshots, list):
                new_shots = []
                shots_changed = False
                for s in g.screenshots:
                    if isinstance(s, str):
                        if s.startswith("/media/"):
                            new_shots.append(s.replace("/media/", f"{target_storage}/"))
                            shots_changed = True
                        elif "storage.c2.liara.site/" in s:
                            clean_s = s.split("storage.c2.liara.site/")[-1].lstrip("/")
                            if clean_s.startswith("drgame-storage/"):
                                clean_s = clean_s.replace("drgame-storage/", "")
                            new_shots.append(f"{target_storage}/{clean_s}")
                            shots_changed = True
                        else:
                            new_shots.append(s)
                    else:
                        new_shots.append(s)
                if shots_changed:
                    g.screenshots = new_shots
                    changed = True

            if changed:
                updated_count += 1

        if updated_count > 0:
            await session.commit()
            print(f"✔ Successfully updated {updated_count} game(s) in database to {target_storage}!")
        else:
            print("No games needed URL updates.")

    # Invalidate Redis catalog cache
    try:
        redis = await redis_manager.connect()
        keys = await redis.keys("drgame:games:*")
        if keys:
            await redis.delete(*keys)
            print(f"✔ Cleared {len(keys)} Redis cache keys.")
    except Exception as e:
        print(f"Redis cache notice: {e}")

    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())
