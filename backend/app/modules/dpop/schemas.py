"""Pydantic schemas for DPoP and PS5 Download32 Integration."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StorageTelemetry(BaseModel):
    volume: str = Field(default="/data", max_length=50)
    total_bytes: int = Field(..., gt=0)
    free_bytes: int = Field(..., ge=0)


class DeviceAuthorizeRequest(BaseModel):
    device_name: str = Field(default="PS5-Download32-Client", max_length=150)
    scope: str = Field(default="download:file", max_length=50)
    browser_handoff: bool = True
    storage: Optional[StorageTelemetry] = None
    requested_job_id: Optional[str] = None


class DeviceAuthorizeResponse(BaseModel):
    device_code: str
    user_code: str
    browser_handoff_uri: str
    verification_uri: str
    expires_in: int = 600
    interval: int = 5
    jkt: str


class DeviceTokenRequest(BaseModel):
    grant_type: str = Field(default="urn:ietf:params:oauth:grant-type:device_code")
    device_code: str


class FileMetadataOut(BaseModel):
    job_id: str
    file_name: str
    size_bytes: int
    sha256: str
    etag: str
    file_version: str


class DeviceTokenResponse(BaseModel):
    token_type: str = "DPoP"
    access_token: str
    refresh_token: str
    expires_in: int = 900
    refresh_expires_in: int = 86400
    grant_id: str
    device_id: str
    jkt: str
    job_id: str
    download_url: str
    file: FileMetadataOut
    max_connections: int = 40
    recovered: bool = False


class TokenRefreshRequest(BaseModel):
    grant_type: str = Field(default="refresh_token")
    refresh_token: str


class DownloadCompleteRequest(BaseModel):
    sha256: str = Field(..., min_length=64, max_length=64)
    bytes_verified: int = Field(..., gt=0)
    revoke_grant: bool = True


class DownloadCompleteResponse(BaseModel):
    ok: bool = True
    grant_id: str
    job_id: str
    sha256_verified: bool = True
    bytes_verified: int
    revoked: bool = True


class AccountHandoffRequest(BaseModel):
    handoff: str = Field(..., min_length=40, max_length=50)
    job_id: str = Field(..., min_length=1, max_length=150)


class AccountHandoffResponse(BaseModel):
    ok: bool = True
    job_id: str


class AccountStorageRequest(BaseModel):
    handoff: Optional[str] = None


class DeviceStorageItem(BaseModel):
    device_name: str
    volume: str
    total_bytes: int
    free_bytes: int
    reported_at: int
    age_seconds: int
    stale: bool


class AccountStorageResponse(BaseModel):
    devices: List[DeviceStorageItem]
