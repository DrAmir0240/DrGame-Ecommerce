"""FastAPI Routers for PS5 Download32 & DPoP RFC 9449 Native Console Integration.
Endpoints:
- /api/dpop/device/authorize
- /api/dpop/device/token
- /api/dpop/token/refresh
- /api/dpop/device/storage
- /api/dpop/downloads/{grant_id}/complete
- /api/dpop/nonce
- /api/account/dpop/handoff
- /api/account/storage
- /dpop-download/{job_id}/{filename} (HTTP 206 Partial Content 32-worker range streaming)
"""
import os
import re
import time
from typing import Annotated, AsyncGenerator, Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.dpop import (
    OAuthException,
    attach_dpop_headers,
    compute_ath,
    generate_dpop_nonce,
    hash_secret,
    verify_dpop_proof,
)
from app.core.redis_client import get_redis
from app.modules.dpop.models import DeviceGrant
from app.modules.dpop.schemas import (
    AccountHandoffRequest,
    AccountHandoffResponse,
    AccountStorageRequest,
    AccountStorageResponse,
    DeviceAuthorizeRequest,
    DeviceAuthorizeResponse,
    DeviceTokenRequest,
    DeviceTokenResponse,
    DownloadCompleteRequest,
    DownloadCompleteResponse,
    StorageTelemetry,
    TokenRefreshRequest,
)
from app.modules.dpop.services import DPoPService
from app.modules.users.models import User

# Main router for /api/dpop
dpop_router = APIRouter(prefix="/api/dpop", tags=["PS5 DPoP Protocol"])

# Account router for /api/account
account_dpop_router = APIRouter(prefix="/api/account", tags=["PS5 Account Handoff & Telemetry"])

# High-performance parallel download router on root path
download_router = APIRouter(tags=["PS5 Download32 Parallel Engine"])


def extract_dpop_token_from_auth(auth_header: Optional[str]) -> Optional[str]:
    """Extract DPoP access token from 'Authorization: DPoP <token>' header."""
    if not auth_header:
        return None
    parts = auth_header.strip().split()
    if len(parts) == 2 and parts[0].lower() in ["dpop", "bearer"]:
        return parts[1]
    return None


@dpop_router.post(
    "/device/authorize",
    response_model=DeviceAuthorizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize PS5 device connection and create zero-friction browser handoff",
)
async def device_authorize(
    request: Request,
    response: Response,
    body: DeviceAuthorizeRequest,
    dpop: Annotated[Optional[str], Header()] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    # 1. Verify DPoP Proof
    proof = await verify_dpop_proof(
        dpop_header=dpop,
        method="POST",
        request_url=str(request.url),
        redis=redis,
        access_token=None,
    )

    # 2. Authorize device
    origin_override = request.headers.get("origin") or f"{request.url.scheme}://{request.url.netloc}"
    res = await DPoPService.authorize_device(
        request=body,
        proof=proof,
        db=db,
        redis=redis,
        origin_override=origin_override,
    )

    # 3. Attach security headers
    fresh_nonce = await generate_dpop_nonce(redis)
    attach_dpop_headers(response, fresh_nonce)
    return res


@dpop_router.post(
    "/device/token",
    response_model=DeviceTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Poll for user grant approval (every 5 seconds from PS5 app)",
)
async def device_token(
    request: Request,
    response: Response,
    body: DeviceTokenRequest,
    dpop: Annotated[Optional[str], Header()] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    proof = await verify_dpop_proof(
        dpop_header=dpop,
        method="POST",
        request_url=str(request.url),
        redis=redis,
        access_token=None,
    )

    origin_override = request.headers.get("origin") or f"{request.url.scheme}://{request.url.netloc}"
    try:
        res = await DPoPService.poll_device_token(
            device_code=body.device_code,
            proof=proof,
            db=db,
            redis=redis,
            origin_override=origin_override,
        )
    except OAuthException as oe:
        fresh_nonce = await generate_dpop_nonce(redis)
        headers = {
            "Cache-Control": "no-store",
            "DPoP-Nonce": fresh_nonce,
            "Server-Time": str(int(time.time())),
        }
        content = {"error": oe.error}
        if oe.error_description:
            content["error_description"] = oe.error_description
        return JSONResponse(status_code=oe.status_code, content=content, headers=headers)

    fresh_nonce = await generate_dpop_nonce(redis)
    attach_dpop_headers(response, fresh_nonce)
    return res


@dpop_router.post(
    "/token/refresh",
    response_model=DeviceTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate expiring access token without interrupting active worker streams",
)
async def token_refresh(
    request: Request,
    response: Response,
    body: TokenRefreshRequest,
    dpop: Annotated[Optional[str], Header()] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    proof = await verify_dpop_proof(
        dpop_header=dpop,
        method="POST",
        request_url=str(request.url),
        redis=redis,
        access_token=None,
    )

    origin_override = request.headers.get("origin") or f"{request.url.scheme}://{request.url.netloc}"
    try:
        res = await DPoPService.refresh_token(
            refresh_token=body.refresh_token,
            proof=proof,
            db=db,
            origin_override=origin_override,
        )
    except OAuthException as oe:
        fresh_nonce = await generate_dpop_nonce(redis)
        headers = {
            "Cache-Control": "no-store",
            "DPoP-Nonce": fresh_nonce,
            "Server-Time": str(int(time.time())),
        }
        content = {"error": oe.error}
        if oe.error_description:
            content["error_description"] = oe.error_description
        return JSONResponse(status_code=oe.status_code, content=content, headers=headers)

    fresh_nonce = await generate_dpop_nonce(redis)
    attach_dpop_headers(response, fresh_nonce)
    return res


@dpop_router.post(
    "/device/storage",
    status_code=status.HTTP_200_OK,
    summary="Periodic storage telemetry report from PS5 app (every 30 seconds)",
)
async def device_storage(
    request: Request,
    response: Response,
    body: StorageTelemetry,
    dpop: Annotated[Optional[str], Header()] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    proof = await verify_dpop_proof(
        dpop_header=dpop,
        method="POST",
        request_url=str(request.url),
        redis=redis,
        access_token=None,
    )

    await DPoPService.record_storage_telemetry(
        telemetry=body,
        jkt=proof.jkt,
        db=db,
    )

    fresh_nonce = await generate_dpop_nonce(redis)
    attach_dpop_headers(response, fresh_nonce)
    return {"ok": True}


@dpop_router.post(
    "/downloads/{grant_id}/complete",
    response_model=DownloadCompleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate full-file SHA-256 on console storage and atomically revoke grant",
)
async def complete_download(
    grant_id: str,
    request: Request,
    response: Response,
    body: DownloadCompleteRequest,
    authorization: Annotated[Optional[str], Header()] = None,
    dpop: Annotated[Optional[str], Header()] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    access_token = extract_dpop_token_from_auth(authorization)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization: DPoP <token> is required",
        )

    proof = await verify_dpop_proof(
        dpop_header=dpop,
        method="POST",
        request_url=str(request.url),
        redis=redis,
        access_token=access_token,
    )

    res = await DPoPService.complete_download(
        grant_id=grant_id,
        request=body,
        proof=proof,
        db=db,
    )

    fresh_nonce = await generate_dpop_nonce(redis)
    attach_dpop_headers(response, fresh_nonce)
    return res


@dpop_router.get(
    "/nonce",
    status_code=status.HTTP_200_OK,
    summary="Fetch a fresh DPoP nonce for synchronization",
)
async def get_nonce(
    response: Response,
    redis: aioredis.Redis = Depends(get_redis),
):
    nonce = await generate_dpop_nonce(redis)
    attach_dpop_headers(response, nonce)
    return {"nonce": nonce}


# =========================================================================
# Phase 4: Account & Handoff Endpoints
# =========================================================================

@account_dpop_router.post(
    "/dpop/handoff",
    response_model=AccountHandoffResponse,
    status_code=status.HTTP_200_OK,
    summary="Claim PS5 browser handoff secret and bind selected job_id to user entitlement",
)
async def account_claim_handoff(
    body: AccountHandoffRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    return await DPoPService.claim_handoff(
        user=current_user,
        handoff_secret=body.handoff,
        job_id=body.job_id,
        db=db,
    )


@account_dpop_router.post(
    "/storage",
    response_model=AccountStorageResponse,
    status_code=status.HTTP_200_OK,
    summary="Query PS5 /data storage capacity and telemetry for user frontend gauge",
)
async def account_query_storage(
    body: AccountStorageRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    return await DPoPService.query_account_storage(
        user=current_user,
        handoff_secret=body.handoff,
        db=db,
    )


# =========================================================================
# Phase 5: 32-Worker Parallel Range Streaming Engine
# =========================================================================

RANGE_PATTERN = re.compile(r"^bytes=(\d+)-(\d+)?$")


async def generate_mock_range_stream(length: int, chunk_size: int = 65536) -> AsyncGenerator[bytes, None]:
    """Stream deterministic payload without memory buffering."""
    remaining = length
    sample_chunk = b"\x00" * min(chunk_size, 65536)
    while remaining > 0:
        to_send = min(remaining, len(sample_chunk))
        yield sample_chunk[:to_send]
        remaining -= to_send


@download_router.api_route(
    "/dpop-download/{job_id}/{filename:path}",
    methods=["GET", "HEAD"],
    status_code=status.HTTP_206_PARTIAL_CONTENT,
    summary="32-worker parallel chunk streaming engine with DPoP ES256 key-binding",
)
async def dpop_download_stream(
    job_id: str,
    filename: str,
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    dpop: Annotated[Optional[str], Header()] = None,
    range: Annotated[Optional[str], Header()] = None,
    if_range: Annotated[Optional[str], Header()] = None,
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    # 1. Extract DPoP Token
    access_token = extract_dpop_token_from_auth(authorization)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization: DPoP <access_token> header is required",
        )

    # 2. Verify DPoP Proof
    proof = await verify_dpop_proof(
        dpop_header=dpop,
        method=request.method,
        request_url=str(request.url),
        redis=redis,
        access_token=access_token,
    )

    # 3. Validate Grant in Database
    token_hash = hash_secret(access_token)
    stmt = select(DeviceGrant).where(DeviceGrant.access_token_hash == token_hash)
    grant = (await db.execute(stmt)).scalar_one_or_none()

    if not grant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or unrecognized DPoP download grant",
        )

    if grant.jkt != proof.jkt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DPoP key mismatch: presented key does not match download grant",
        )

    if grant.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Download grant has been completed or revoked",
        )

    # Grant job match check
    if grant.job_id != job_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Grant is authorized for job '{grant.job_id}', not '{job_id}'",
        )

    # 4. Resolve File and Size
    file_meta = await DPoPService.resolve_game_file(job_id, db)
    total_size = file_meta.size_bytes
    sha256 = file_meta.sha256
    etag = file_meta.etag

    # 5. Parse Range Header
    start = 0
    end = total_size - 1

    if range:
        match = RANGE_PATTERN.match(range.strip())
        if not match:
            # Check single byte probe or suffix
            if range.strip() == "bytes=0-0":
                start = 0
                end = 0
            else:
                raise HTTPException(
                    status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
                    headers={"Content-Range": f"bytes */{total_size}", "Accept-Ranges": "bytes"},
                    detail="Invalid HTTP Range header",
                )
        else:
            start = int(match.group(1))
            end_group = match.group(2)
            if end_group:
                end = int(end_group)
            else:
                end = total_size - 1

    # Validate range limits
    if start >= total_size or end >= total_size or start > end:
        raise HTTPException(
            status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            headers={"Content-Range": f"bytes */{total_size}", "Accept-Ranges": "bytes"},
            detail="Range not satisfiable",
        )

    content_length = end - start + 1
    fresh_nonce = await generate_dpop_nonce(redis)
    now_epoch = str(int(time.time()))

    response_headers = {
        "Content-Type": "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Content-Range": f"bytes {start}-{end}/{total_size}",
        "Content-Length": str(content_length),
        "ETag": etag,
        "X-Content-SHA256": sha256,
        "Cache-Control": "no-store",
        "DPoP-Nonce": fresh_nonce,
        "Server-Time": now_epoch,
    }

    # HEAD request returns metadata only
    if request.method == "HEAD":
        return Response(
            status_code=status.HTTP_206_PARTIAL_CONTENT,
            headers=response_headers,
        )

    # 6. Stream payload directly (32 MiB chunks without RAM buffering)
    stream_generator = generate_mock_range_stream(length=content_length)

    return StreamingResponse(
        content=stream_generator,
        status_code=status.HTTP_206_PARTIAL_CONTENT,
        headers=response_headers,
    )
