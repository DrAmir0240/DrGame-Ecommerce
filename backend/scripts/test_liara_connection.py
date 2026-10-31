"""Test connectivity, upload, and presigned URL generation for Liara S3 Object Storage."""
import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.storage import liara_storage


async def main():
    print("=== Testing Liara S3 Object Storage Connection ===")
    print(f"Endpoint:    {settings.LIARA_ENDPOINT}")
    print(f"Bucket:      {settings.LIARA_BUCKET_NAME}")
    print(f"Access Key:  {settings.LIARA_ACCESS_KEY[:6]}...")
    print(f"Public Base: {settings.S3_PUBLIC_BASE_URL}")
    print(f"Configured:  {liara_storage.is_configured}")

    check = await liara_storage.check_connection()
    print(f"HeadBucket Check Result: {check}")

    # Test Upload
    test_key = "tests/connection_probe.txt"
    test_content = b"DrGame Platform Liara Object Storage Probe 2026."
    print(f"\nAttempting test upload to '{test_key}'...")
    url = await liara_storage.upload_bytes(test_content, test_key, "text/plain")
    print(f"Upload Result URL: {url}")

    if url:
        # Test Presigned URL
        presigned = await liara_storage.generate_presigned_url(test_key, expires_in=600)
        print(f"Presigned Download URL: {presigned}")

        # Clean up test object
        deleted = await liara_storage.delete_file(test_key)
        print(f"Cleaned probe test file: {deleted}")
        print("\n>>> Liara S3 Object Storage verification SUCCESSFUL! <<<")
    else:
        print("\n>>> Liara S3 Object Storage test failed or fallback triggered! <<<")


if __name__ == "__main__":
    asyncio.run(main())
