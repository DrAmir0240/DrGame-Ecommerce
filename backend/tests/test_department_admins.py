import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import hash_password
from app.modules.admin.models import (
    ContentAdmin,
    FinanceAdmin,
    SupportAdmin,
    ReportAdmin,
    ReferralAdmin,
    AdminAuditLog,
    AdminAccessLevel,
)


@pytest.mark.asyncio
async def test_department_admins_crud_and_isolation(client: AsyncClient, test_db: AsyncSession):
    # 1. Seed one full_crud content admin and one read_only finance admin
    content_admin = ContentAdmin(
        username="content_master_test",
        email="content_master@drgame.local",
        password_hash=hash_password("pass12345"),
        full_name="Content Master",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    finance_admin_ro = FinanceAdmin(
        username="finance_ro_test",
        email="finance_ro@drgame.local",
        password_hash=hash_password("pass12345"),
        full_name="Finance RO",
        access_level=AdminAccessLevel.READ_ONLY.value,
        is_active=True,
    )
    test_db.add_all([content_admin, finance_admin_ro])
    await test_db.commit()

    # 2. Login as Content Admin
    login_res = await client.post("/api/admin-content/auth/login", json={
        "username": "content_master_test",
        "password": "pass12345",
    })
    assert login_res.status_code == 200, login_res.text
    content_token = login_res.json()["access_token"]

    # 3. Verify Content Admin Token on Content endpoint
    me_content = await client.get("/api/admin-content/auth/me", headers={
        "Authorization": f"Bearer {content_token}"
    })
    assert me_content.status_code == 200
    assert me_content.json()["username"] == "content_master_test"

    # 4. ZERO-TRUST TEST: Content token hitting Finance endpoint MUST FAIL (401 or 403)
    me_finance_with_content_token = await client.get("/api/admin-finance/auth/me", headers={
        "Authorization": f"Bearer {content_token}"
    })
    assert me_finance_with_content_token.status_code in (401, 403)

    # 5. Login as Finance Read-Only Admin
    login_fin = await client.post("/api/admin-finance/auth/login", json={
        "username": "finance_ro_test",
        "password": "pass12345",
    })
    assert login_fin.status_code == 200
    finance_token = login_fin.json()["access_token"]

    # 6. PERMISSION LEVEL TEST: Read-Only finance admin trying to POST staff MUST get 403 Forbidden
    post_staff_ro = await client.post("/api/admin-finance/staff", json={
        "username": "sub_staff_test",
        "email": "sub_staff@drgame.local",
        "password": "pass_secure_123",
        "full_name": "Sub Staff",
        "access_level": "read_only",
    }, headers={"Authorization": f"Bearer {finance_token}"})
    assert post_staff_ro.status_code == 403

    # 7. Content Full-CRUD admin can create staff successfully
    post_staff_crud = await client.post("/api/admin-content/staff", json={
        "username": "content_editor_1",
        "email": "content_editor_1@drgame.local",
        "password": "editor_password_secure",
        "full_name": "Editor One",
        "access_level": "read_only",
    }, headers={"Authorization": f"Bearer {content_token}"})
    assert post_staff_crud.status_code == 201
    assert post_staff_crud.json()["username"] == "content_editor_1"




@pytest.mark.asyncio
async def test_audit_logs_and_cross_department_matrix(client: AsyncClient, test_db: AsyncSession):
    # Seed full_crud report admin & full_crud support admin
    report_admin = ReportAdmin(
        username="report_chief",
        email="report_chief@drgame.local",
        password_hash=hash_password("chief_pass_123"),
        full_name="Report Chief",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    support_admin = SupportAdmin(
        username="support_agent",
        email="support_agent@drgame.local",
        password_hash=hash_password("support_pass_123"),
        full_name="Support Agent",
        access_level=AdminAccessLevel.FULL_CRUD.value,
        is_active=True,
    )
    test_db.add_all([report_admin, support_admin])
    await test_db.commit()

    # Login report admin
    login_rep = await client.post("/api/admin-report/auth/login", json={
        "username": "report_chief",
        "password": "chief_pass_123",
    })
    assert login_rep.status_code == 200
    report_token = login_rep.json()["access_token"]

    # Login support admin
    login_sup = await client.post("/api/admin-support/auth/login", json={
        "username": "support_agent",
        "password": "support_pass_123",
    })
    assert login_sup.status_code == 200
    support_token = login_sup.json()["access_token"]

    # Support admin cannot access report endpoints
    resp_cross = await client.get("/api/admin-report/audit-logs", headers={
        "Authorization": f"Bearer {support_token}"
    })
    assert resp_cross.status_code in (401, 403)

    # Report admin can read audit logs (which should contain LOGIN actions from earlier)
    logs_res = await client.get("/api/admin-report/audit-logs", headers={
        "Authorization": f"Bearer {report_token}"
    })
    assert logs_res.status_code == 200
    logs = logs_res.json()["items"]
    assert isinstance(logs, list)
    # Check that at least the report_chief login was audited
    usernames_in_logs = [l["admin_username"] for l in logs]
    assert "report_chief" in usernames_in_logs
