"""Media and file storage manager for DrGame platform.
Supports Liara S3 Object Storage with non-blocking async execution (asyncio.to_thread)
and graceful local disk fallback (/app/uploads/).
"""
import os
import uuid
import mimetypes
import logging
import asyncio
from typing import Optional
import httpx
from fastapi import UploadFile
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger("drgame.storage")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA_DIR = os.path.join(BASE_DIR, "uploads")
GAMES_MEDIA_DIR = os.path.join(MEDIA_DIR, "games")
AVATARS_MEDIA_DIR = os.path.join(MEDIA_DIR, "avatars")
BANNERS_MEDIA_DIR = os.path.join(MEDIA_DIR, "banners")
ARTICLES_MEDIA_DIR = os.path.join(MEDIA_DIR, "articles")

for _dir in [MEDIA_DIR, GAMES_MEDIA_DIR, AVATARS_MEDIA_DIR, BANNERS_MEDIA_DIR, ARTICLES_MEDIA_DIR]:
    os.makedirs(_dir, exist_ok=True)


class LiaraS3Storage:
    """S3-compatible Object Storage manager for Liara Cloud Storage."""

    def __init__(self):
        self.endpoint_url = settings.LIARA_ENDPOINT
        self.bucket_name = settings.LIARA_BUCKET_NAME
        self.access_key = settings.LIARA_ACCESS_KEY
        self.secret_key = settings.LIARA_SECRET_KEY
        self._client = None

    @property
    def is_configured(self) -> bool:
        return bool(
            self.endpoint_url
            and self.bucket_name
            and self.access_key
            and self.secret_key
            and "your_" not in self.access_key
        )

    def _get_client(self):
        if self._client is None and self.is_configured:
            self._client = boto3.client(
                "s3",
                endpoint_url=self.endpoint_url,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=Config(signature_version="s3v4", connect_timeout=8, read_timeout=15),
                region_name="us-east-1",
            )
            # Remove Expect: 100-continue header to prevent proxy connection drops on Liara
            def _remove_expect_header(request, **kwargs):
                if hasattr(request, "headers") and "Expect" in request.headers:
                    del request.headers["Expect"]
            self._client.meta.events.register("before-send.s3.*", _remove_expect_header)
        return self._client

    async def check_connection(self) -> dict:
        """Test bucket connectivity and permissions."""
        if not self.is_configured:
            return {"connected": False, "reason": "Credentials not fully configured"}

        def _sync_check():
            client = self._get_client()
            client.head_bucket(Bucket=self.bucket_name)
            return True

        try:
            await asyncio.to_thread(_sync_check)
            return {"connected": True, "bucket": self.bucket_name, "endpoint": self.endpoint_url}
        except Exception as e:
            logger.warning(f"Liara S3 connection check failed: {e}")
            return {"connected": False, "error": str(e)}

    async def upload_bytes(
        self, data: bytes, key: str, content_type: Optional[str] = None
    ) -> Optional[str]:
        """Upload raw bytes to Liara S3 in a threadpool and return public URL."""
        if not self.is_configured:
            return None

        clean_key = key.lstrip("/")
        if not content_type:
            content_type, _ = mimetypes.guess_type(clean_key)
            content_type = content_type or "application/octet-stream"

        def _sync_upload():
            client = self._get_client()
            client.put_object(
                Bucket=self.bucket_name,
                Key=clean_key,
                Body=data,
                ContentType=content_type,
            )
            return f"{settings.S3_PUBLIC_BASE_URL}/{clean_key}"

        try:
            return await asyncio.to_thread(_sync_upload)
        except Exception as e:
            logger.error(f"Liara S3 upload failed for key {clean_key}: {e}")
            return None

    async def generate_presigned_url(self, key: str, expires_in: int = 3600) -> Optional[str]:
        """Generate temporary signed download URL for private or rate-limited files."""
        if not self.is_configured:
            return None

        clean_key = key.lstrip("/")

        def _sync_presign():
            client = self._get_client()
            return client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": clean_key},
                ExpiresIn=expires_in,
            )

        try:
            return await asyncio.to_thread(_sync_presign)
        except Exception as e:
            logger.error(f"Failed to generate presigned URL for {clean_key}: {e}")
            return None

    async def file_exists(self, key: str) -> bool:
        """Check if an object exists in Liara S3 bucket using head_object."""
        if not self.is_configured:
            return False

        clean_key = key.lstrip("/")

        def _sync_head():
            client = self._get_client()
            try:
                client.head_object(Bucket=self.bucket_name, Key=clean_key)
                return True
            except ClientError as e:
                code = e.response.get("Error", {}).get("Code")
                if code in ("404", "NoSuchKey", "NotFound"):
                    return False
                return False
            except Exception:
                return False

        try:
            return await asyncio.to_thread(_sync_head)
        except Exception:
            return False

    async def delete_file(self, key: str) -> bool:
        """Delete an object from Liara S3."""
        if not self.is_configured:
            return False

        clean_key = key.lstrip("/")

        def _sync_delete():
            client = self._get_client()
            client.delete_object(Bucket=self.bucket_name, Key=clean_key)
            return True

        try:
            return await asyncio.to_thread(_sync_delete)
        except Exception as e:
            logger.error(f"Liara S3 delete failed for key {clean_key}: {e}")
            return False


liara_storage = LiaraS3Storage()


async def download_and_save_image(
    remote_url: str,
    prefix: str = "game",
    folder: str = "games",
    exact_key: Optional[str] = None,
) -> str:
    """
    Downloads a remote image and saves it to Liara S3 (or local disk fallback).
    If exact_key is provided (e.g. 'games/src_1234/screenshots/1.jpg'), checks if it already
    exists in Liara S3 / disk first to avoid duplicate downloads and uploads (Idempotency).
    """
    if not remote_url:
        return remote_url

    # 1. If exact_key is specified, check if already uploaded to S3 or local disk
    if exact_key:
        clean_key = exact_key.lstrip("/")
        if liara_storage.is_configured and await liara_storage.file_exists(clean_key):
            logger.info(f"Liara S3: Object '{clean_key}' already exists in bucket. Reusing.")
            return f"{settings.S3_PUBLIC_BASE_URL}/{clean_key}"
        local_exact_path = os.path.join(MEDIA_DIR, clean_key)
        if not liara_storage.is_configured and os.path.isfile(local_exact_path):
            return f"/media/{clean_key}"

    # 2. If already hosted on our S3, return as is
    if settings.LIARA_PUBLIC_URL and remote_url.startswith(settings.LIARA_PUBLIC_URL):
        return remote_url

    # 3. If it is a local /media/ path and Liara S3 is configured, try uploading it to Liara S3
    if remote_url.startswith("/media/"):
        rel_path = remote_url.replace("/media/", "")
        local_disk_path = os.path.join(MEDIA_DIR, rel_path)
        if os.path.isfile(local_disk_path) and liara_storage.is_configured:
            try:
                with open(local_disk_path, "rb") as lf:
                    data = lf.read()
                s3_key = exact_key.lstrip("/") if exact_key else f"{folder}/{os.path.basename(rel_path)}"
                content_type = mimetypes.guess_type(local_disk_path)[0] or "image/jpeg"
                s3_url = await liara_storage.upload_bytes(data, s3_key, content_type)
                if s3_url:
                    return s3_url
            except Exception as e:
                logger.warning(f"Failed to migrate local file {remote_url} to Liara: {e}")
        return remote_url

    try:
        ext = ".jpg"
        url_lower = remote_url.lower()
        if ".png" in url_lower:
            ext = ".png"
        elif ".webp" in url_lower:
            ext = ".webp"
        elif ".svg" in url_lower:
            ext = ".svg"

        if exact_key:
            s3_key = exact_key.lstrip("/")
            if not os.path.splitext(s3_key)[1]:
                s3_key = f"{s3_key}{ext}"
            filename = os.path.basename(s3_key)
            target_rel_dir = os.path.dirname(s3_key)
        else:
            filename = f"{prefix}_{uuid.uuid4().hex[:12]}{ext}"
            s3_key = f"{folder}/{filename}"
            target_rel_dir = folder

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
            res = await client.get(remote_url)
            if res.status_code == 200 and len(res.content) > 100:
                # 1. Try uploading to Liara S3
                if liara_storage.is_configured:
                    content_type = res.headers.get("content-type") or mimetypes.guess_type(filename)[0] or "image/jpeg"
                    s3_url = await liara_storage.upload_bytes(res.content, s3_key, content_type)
                    if s3_url:
                        logger.info(f"Liara S3: Uploaded {remote_url} -> {s3_url}")
                        return s3_url

                # 2. Fallback to local disk storage
                target_dir = os.path.join(MEDIA_DIR, target_rel_dir)
                os.makedirs(target_dir, exist_ok=True)
                filepath = os.path.join(target_dir, filename)

                with open(filepath, "wb") as f:
                    f.write(res.content)
                logger.info(f"Local fallback: Saved {remote_url} -> /media/{s3_key}")
                return f"/media/{s3_key}"
            else:
                logger.warning(f"Failed to fetch remote image: {remote_url}, status: {res.status_code}")
                return remote_url
    except Exception as e:
        logger.error(f"Error saving remote image {remote_url}: {e}")
        return remote_url


async def save_uploaded_file(
    file: UploadFile, prefix: str = "custom", folder: str = "games"
) -> str:
    """
    Saves an uploaded file to Liara S3.
    If S3 is unavailable or fails, gracefully falls back to local disk (/uploads/{folder}/).
    """
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".svg", ".pdf", ".zip"]:
        ext = ".jpg"

    filename = f"{prefix}_{uuid.uuid4().hex[:12]}{ext}"
    s3_key = f"{folder}/{filename}"
    content = await file.read()
    content_type = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    # 1. Try uploading to Liara S3
    if liara_storage.is_configured:
        s3_url = await liara_storage.upload_bytes(content, s3_key, content_type)
        if s3_url:
            logger.info(f"Liara S3: Saved uploaded file {file.filename} -> {s3_url}")
            return s3_url

    # 2. Fallback to local disk storage
    target_dir = os.path.join(MEDIA_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    filepath = os.path.join(target_dir, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    logger.info(f"Local storage: Saved uploaded file {file.filename} -> /media/{folder}/{filename}")
    return f"/media/{folder}/{filename}"
