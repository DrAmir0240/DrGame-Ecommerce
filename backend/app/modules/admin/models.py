"""Isolated admin models for 5 separate departments and activity audit logging."""
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, Enum as SqlEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AdminAccessLevel(str, enum.Enum):
    READ_ONLY = "read_only"
    FULL_CRUD = "full_crud"


# 1. Content Department Admins
class ContentAdmin(Base):
    __tablename__ = "content_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    access_level: Mapped[AdminAccessLevel] = mapped_column(
        SqlEnum(AdminAccessLevel, name="content_admin_access_level", values_callable=lambda x: [e.value for e in x]),
        default=AdminAccessLevel.READ_ONLY,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


# 2. Finance & Subscriptions Department Admins
class FinanceAdmin(Base):
    __tablename__ = "finance_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    access_level: Mapped[AdminAccessLevel] = mapped_column(
        SqlEnum(AdminAccessLevel, name="finance_admin_access_level", values_callable=lambda x: [e.value for e in x]),
        default=AdminAccessLevel.READ_ONLY,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


# 3. Support & User Relations Department Admins
class SupportAdmin(Base):
    __tablename__ = "support_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    access_level: Mapped[AdminAccessLevel] = mapped_column(
        SqlEnum(AdminAccessLevel, name="support_admin_access_level", values_callable=lambda x: [e.value for e in x]),
        default=AdminAccessLevel.READ_ONLY,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


# 4. Analytics & Report Department Admins
class ReportAdmin(Base):
    __tablename__ = "report_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    access_level: Mapped[AdminAccessLevel] = mapped_column(
        SqlEnum(AdminAccessLevel, name="report_admin_access_level", values_callable=lambda x: [e.value for e in x]),
        default=AdminAccessLevel.READ_ONLY,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


# 5. Referral & Partner Payout Department Admins
class ReferralAdmin(Base):
    __tablename__ = "referral_admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    access_level: Mapped[AdminAccessLevel] = mapped_column(
        SqlEnum(AdminAccessLevel, name="referral_admin_access_level", values_callable=lambda x: [e.value for e in x]),
        default=AdminAccessLevel.READ_ONLY,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


# Activity Audit Log for all admin operations
class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    department: Mapped[str] = mapped_column(String(30), index=True, nullable=False)  # content, finance, support, report, referral
    admin_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    admin_username: Mapped[str] = mapped_column(String(60), nullable=False)
    action: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, ...
    target_entity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
