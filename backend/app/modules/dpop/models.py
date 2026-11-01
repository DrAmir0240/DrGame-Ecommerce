"""Database models for DPoP and PS5 Download32 Integration."""
from datetime import datetime, timezone
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class RegisteredDevice(Base):
    """PS5 hardware public key registration."""
    __tablename__ = "registered_devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    jkt: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    device_name: Mapped[str] = mapped_column(String(150), default="PS5-Download32-Client", nullable=False)
    public_jwk: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DeviceAuthorization(Base):
    """Device authorization session connecting browser handoff, user selection, and device polling."""
    __tablename__ = "device_authorizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_code_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    handoff_secret_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    user_code: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    jkt: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    public_jwk: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)  # pending, approved, consumed, expired
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    job_id: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    grant_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )


class DeviceGrant(Base):
    """Active download grant bound to PS5 hardware public key."""
    __tablename__ = "device_grants"

    grant_id: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    jkt: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    access_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    refresh_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    max_connections: Mapped[int] = mapped_column(Integer, default=40, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    refresh_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    client_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bytes_verified: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )


class DeviceStorageReport(Base):
    """Latest filesystem storage telemetry reported by PS5 Download32 (/data)."""
    __tablename__ = "device_storage_reports"

    jwk_thumbprint: Mapped[str] = mapped_column(String(100), primary_key=True)
    volume: Mapped[str] = mapped_column(String(50), default="/data", nullable=False)
    total_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    free_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False
    )
