"""Unit tests for primary session security, current session guard, and 403 protection."""
import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.users.models import User
from app.modules.auth.models import UserSession
from app.modules.auth.services import AuthService
from app.modules.users.services import UserService
from app.core.exceptions import ForbiddenException
from tests.conftest import FakeRedis


@pytest.mark.asyncio
async def test_primary_session_and_current_session_protection(test_db: AsyncSession):
    fake_redis = FakeRedis()

    # 1. Create user
    user = User(
        full_name="Console Master",
        username="console_master",
        referral_code="REFCON",
        console_auth_code="CCM01",
        password_hash="h",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # 2. First login (Primary Session on PS5 Console)
    client_info_primary = {
        "device_name": "PlayStation 5 Console",
        "device_type": "console",
        "ip_address": "192.168.1.100",
        "user_agent": "PlayStation 5 Browser",
    }
    tok1 = await AuthService.create_user_session(test_db, user, client_info_primary)

    # 3. Second login (Secondary Session on Chrome PC)
    client_info_secondary = {
        "device_name": "Chrome on Windows",
        "device_type": "desktop",
        "ip_address": "192.168.1.101",
        "user_agent": "Mozilla/5.0 Chrome/120.0",
    }
    tok2 = await AuthService.create_user_session(test_db, user, client_info_secondary)

    # 4. Third login (Tertiary Session on Mobile Safari)
    client_info_tertiary = {
        "device_name": "Safari on iPhone",
        "device_type": "mobile",
        "ip_address": "192.168.1.102",
        "user_agent": "Mozilla/5.0 iPhone Safari",
    }
    tok3 = await AuthService.create_user_session(test_db, user, client_info_tertiary)

    # Fetch sessions
    sessions = (
        await test_db.execute(
            select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.id.asc())
        )
    ).scalars().all()
    assert len(sessions) == 3

    primary_session = sessions[0]
    secondary_session = sessions[1]
    tertiary_session = sessions[2]

    # Verify primary session flag
    assert primary_session.is_primary is True
    assert secondary_session.is_primary is False
    assert tertiary_session.is_primary is False

    # Guard 1: Attempt to revoke PRIMARY session -> MUST RAISE 403 ForbiddenException
    with pytest.raises(ForbiddenException) as exc_info:
        await UserService.revoke_session(
            db=test_db,
            redis=fake_redis,
            user_id=user.id,
            session_id=primary_session.id,
            current_jti=secondary_session.jti,
        )
    assert "دستگاه اصلی" in str(exc_info.value)

    # Guard 2: Attempt to revoke CURRENT session -> MUST RAISE 403 ForbiddenException
    with pytest.raises(ForbiddenException) as exc_info:
        await UserService.revoke_session(
            db=test_db,
            redis=fake_redis,
            user_id=user.id,
            session_id=secondary_session.id,
            current_jti=secondary_session.jti,  # Matches the target session!
        )
    assert "نشست فعلی" in str(exc_info.value)

    # Guard 3: Revoke non-primary, non-current session (Tertiary session) -> MUST SUCCEED
    await UserService.revoke_session(
        db=test_db,
        redis=fake_redis,
        user_id=user.id,
        session_id=tertiary_session.id,
        current_jti=secondary_session.jti,
    )

    await test_db.refresh(tertiary_session)
    assert tertiary_session.is_active is False
