"""Unit tests for Liara S3 Object Storage and Local Fallback."""
import pytest
from unittest.mock import MagicMock, patch
from io import BytesIO
from fastapi import UploadFile
from app.core.storage import LiaraS3Storage, download_and_save_image, save_uploaded_file, liara_storage
from app.core.config import settings


@pytest.mark.asyncio
async def test_liara_storage_configured():
    storage = LiaraS3Storage()
    assert storage.is_configured is True
    assert storage.bucket_name == "drgame-storage"
    assert "storage.c2.liara.site" in storage.endpoint_url


@pytest.mark.asyncio
async def test_liara_storage_upload_and_presigned_mocked():
    storage = LiaraS3Storage()
    mock_boto = MagicMock()
    mock_boto.put_object.return_value = {"ResponseMetadata": {"HTTPStatusCode": 200}}
    mock_boto.generate_presigned_url.return_value = "https://drgame-storage.storage.c2.liara.site/test.jpg?sig=123"
    mock_boto.delete_object.return_value = {"ResponseMetadata": {"HTTPStatusCode": 204}}

    with patch.object(storage, "_get_client", return_value=mock_boto):
        url = await storage.upload_bytes(b"sample bytes", "games/test.jpg", "image/jpeg")
        assert url == f"{settings.S3_PUBLIC_BASE_URL}/games/test.jpg"

        presigned = await storage.generate_presigned_url("games/test.jpg")
        assert "sig=123" in presigned

        deleted = await storage.delete_file("games/test.jpg")
        assert deleted is True


@pytest.mark.asyncio
async def test_save_uploaded_file_s3_success():
    mock_file = UploadFile(
        filename="custom_avatar.png",
        file=BytesIO(b"fake image data"),
        headers={"content-type": "image/png"},
    )
    with patch.object(liara_storage, "upload_bytes", return_value=f"{settings.S3_PUBLIC_BASE_URL}/avatars/custom_avatar.png"):
        result_url = await save_uploaded_file(mock_file, prefix="test_avatar", folder="avatars")
        assert result_url == f"{settings.S3_PUBLIC_BASE_URL}/avatars/custom_avatar.png"


@pytest.mark.asyncio
async def test_save_uploaded_file_fallback_to_local():
    mock_file = UploadFile(
        filename="custom_banner.jpg",
        file=BytesIO(b"fake banner data"),
        headers={"content-type": "image/jpeg"},
    )
    # Simulate S3 returning None (failure or not configured)
    with patch.object(liara_storage, "upload_bytes", return_value=None):
        result_url = await save_uploaded_file(mock_file, prefix="test_banner", folder="banners")
        assert result_url.startswith("/media/banners/")


@pytest.mark.asyncio
async def test_download_and_save_image_local_or_s3():
    # If URL is already local or S3, should return immediately
    existing_local = "/media/games/test.jpg"
    assert await download_and_save_image(existing_local) == existing_local

    existing_s3 = f"{settings.S3_PUBLIC_BASE_URL}/games/test.jpg"
    assert await download_and_save_image(existing_s3) == existing_s3
