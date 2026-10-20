import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.exceptions import AppException
from app.core.redis_client import RedisService
from app.modules.quota.router import router as quota_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.users.router import router as auth_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DrGame E-Commerce & PS4/PS5 Jailbreak Game Data Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Process time header middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


# Global Exception Handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "code": exc.code,
            "message": exc.message,
            "details": exc.details,
        },
    )


# Health check endpoint
@app.get("/health", tags=["Health & Diagnostics"])
@app.get("/api/v1/health", tags=["Health & Diagnostics"])
async def health_check():
    db_ok = False
    redis_ok = False

    # Check DB
    try:
        async with AsyncSessionLocal() as session:
            res = await session.execute(text("SELECT 1"))
            db_ok = res.scalar() == 1
    except Exception:
        db_ok = False

    # Check Redis
    try:
        redis_ok = await RedisService.ping()
    except Exception:
        redis_ok = False

    overall_healthy = db_ok and redis_ok
    status_code = status.HTTP_200_OK if overall_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if overall_healthy else "degraded",
            "environment": settings.ENVIRONMENT,
            "project": settings.PROJECT_NAME,
            "components": {
                "database": "connected" if db_ok else "disconnected",
                "redis_cache": "connected" if redis_ok else "disconnected",
            },
        },
    )


# System Settings endpoint
@app.get("/api/v1/system/settings", tags=["System & Settings"])
async def get_system_settings():
    return {
        "project_name": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "default_theme": "dark",
        "accent_color": "cosmic-purple",
        "supported_languages": ["fa", "en"],
        "default_language": "fa",
        "allowed_platforms": ["PS5", "PS4", "PS3", "PS2", "PS1", "Xbox 360", "Nintendo"],
        "ten_foot_ui_supported": True,
        "version": "1.0.0",
    }


# Include Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(subscriptions_router, prefix="/api/v1")
app.include_router(quota_router, prefix="/api/v1")
