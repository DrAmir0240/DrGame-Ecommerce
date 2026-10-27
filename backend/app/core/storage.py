"""Media and file storage manager for DrGame platform.
Saves uploaded and cached images locally into /app/uploads/games.
"""
import os
import uuid
import logging
import httpx
from fastapi import UploadFile

logger = logging.getLogger("drgame.storage")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_DIR = os.path.join(BASE_DIR, "uploads")
GAMES_MEDIA_DIR = os.path.join(MEDIA_DIR, "games")

os.makedirs(GAMES_MEDIA_DIR, exist_ok=True)

async def download_and_save_image(remote_url: str, prefix: str = "game") -> str:
    """
    Downloads a remote image (e.g. from RAWG) and saves it to local disk under /uploads/games.
    Returns the local media URL (/media/games/{filename}).
    If the URL is already local (/media/...) or fails to download, returns the existing URL.
    """
    if not remote_url or remote_url.startswith("/media/"):
        return remote_url

    try:
        ext = ".jpg"
        if ".png" in remote_url.lower():
            ext = ".png"
        elif ".webp" in remote_url.lower():
            ext = ".webp"

        filename = f"{prefix}_{uuid.uuid4().hex[:12]}{ext}"
        filepath = os.path.join(GAMES_MEDIA_DIR, filename)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
            res = await client.get(remote_url)
            if res.status_code == 200 and len(res.content) > 100:
                with open(filepath, "wb") as f:
                    f.write(res.content)
                logger.info(f"Local storage: Saved {remote_url} -> /media/games/{filename}")
                return f"/media/games/{filename}"
            else:
                logger.warning(f"Failed to fetch remote image: {remote_url}, status: {res.status_code}")
                return remote_url
    except Exception as e:
        logger.error(f"Error saving remote image {remote_url}: {e}")
        return remote_url

async def save_uploaded_file(file: UploadFile, prefix: str = "custom") -> str:
    """
    Saves an uploaded file to /uploads/games and returns /media/games/{filename}.
    """
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".svg"]:
        ext = ".jpg"

    filename = f"{prefix}_{uuid.uuid4().hex[:12]}{ext}"
    filepath = os.path.join(GAMES_MEDIA_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    logger.info(f"Local storage: Saved uploaded file {file.filename} -> /media/games/{filename}")
    return f"/media/games/{filename}"
