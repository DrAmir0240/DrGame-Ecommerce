"""Export all 5 isolated department admin routers."""
from app.modules.admin.routers.content_router import router as content_admin_router
from app.modules.admin.routers.finance_router import router as finance_admin_router
from app.modules.admin.routers.support_router import router as support_admin_router
from app.modules.admin.routers.report_router import router as report_admin_router
from app.modules.admin.routers.referral_router import router as referral_admin_router

__all__ = [
    "content_admin_router",
    "finance_admin_router",
    "support_admin_router",
    "report_admin_router",
    "referral_admin_router",
]
