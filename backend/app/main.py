from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_db
from app.core.redis_client import redis_manager, get_redis
from app.core.exceptions import AppException, app_exception_handler, global_exception_handler
import redis.asyncio as aioredis
import logging

logger = logging.getLogger("drgame.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to Redis
    try:
        await redis_manager.connect()
        logger.info("Connected to Redis successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to Redis on startup: {e}")
    yield
    # Shutdown: close Redis
    await redis_manager.close()
    logger.info("Closed Redis connection.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="پلتفرم تجارت الکترونیک و اشتراک بازی‌های دکتر گیم (DrGame API)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Static Media Files Mounting
from fastapi.staticfiles import StaticFiles
import os
MEDIA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(os.path.join(MEDIA_DIR, "games"), exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health", tags=["Health"])
async def health_check(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis)
):
    db_status = "unhealthy"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    redis_status = "unhealthy"
    try:
        if await redis.ping():
            redis_status = "healthy"
    except Exception as e:
        redis_status = f"error: {str(e)}"

    overall = "ok" if db_status == "healthy" and redis_status == "healthy" else "degraded"
    status_code = status.HTTP_200_OK if overall == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": overall,
        "database": db_status,
        "redis": redis_status,
        "environment": settings.ENVIRONMENT
    }

# Dynamic router inclusion as modules are implemented
try:
    from app.modules.auth.router import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
except ImportError:
    pass

try:
    from app.modules.users.router import router as users_router
    app.include_router(users_router, prefix="/api/users", tags=["Users"])
except ImportError:
    pass

try:
    from app.modules.games.router import router as games_router
    app.include_router(games_router, prefix="/api/games", tags=["Games"])
except ImportError:
    pass

try:
    from app.modules.rawg_sync.router import router as rawg_router
    app.include_router(rawg_router, prefix="/api/rawg", tags=["RAWG Sync"])
except ImportError:
    pass

try:
    from app.modules.subscriptions.router import router as subscriptions_router
    app.include_router(subscriptions_router, prefix="/api/subscriptions", tags=["Subscriptions"])
except ImportError:
    pass

try:
    from app.modules.quota.router import router as quota_router
    app.include_router(quota_router, prefix="/api/quota", tags=["Quota"])
except ImportError:
    pass

try:
    from app.modules.wallet.router import router as wallet_router
    app.include_router(wallet_router, prefix="/api/referral", tags=["Wallet & Referral"])
except ImportError:
    pass

try:
    from app.modules.news.router import router as news_router
    app.include_router(news_router, prefix="/api/blog", tags=["Blog"])
except ImportError:
    pass

try:
    from app.modules.admin.router import router as admin_router
    app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
except ImportError:
    pass

try:
    from app.modules.home.router import router as home_router
    app.include_router(home_router, prefix="/api/home", tags=["Home Banners"])
except ImportError:
    pass

try:
    from app.modules.core.router import router as core_router
    app.include_router(core_router, prefix="/api/core", tags=["Core & GeoIP"])
    app.include_router(core_router, prefix="/api", tags=["GeoIP Direct"])
except ImportError:
    pass

