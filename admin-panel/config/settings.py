"""
Django settings — DrGame admin panel.

This project has no API: it only exposes the Django admin site, used to
manage the database models of the DrGame platform (which are owned by the FastAPI backend
in `backend/`).

Key points:
  * every DrGame model is a mirror (`managed = False`) of an existing PostgreSQL
    table — Django never creates or alters them;
  * Django's own bookkeeping tables (auth, admin log, content types, sessions)
    live in a dedicated PostgreSQL schema (`django_admin`) so the `public`
    schema stays exactly as Alembic expects it;
  * the UI is Persian and right-to-left using `django-unfold`.
"""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def env(key: str, default: str | None = None) -> str:
    value = os.environ.get(key)
    if value is None or value == "":
        return default if default is not None else ""
    return value


def env_bool(key: str, default: bool = False) -> bool:
    return env(key, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(key: str, default: str = "") -> list[str]:
    return [item.strip() for item in env(key, default).split(",") if item.strip()]


SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    "drgame-admin-panel-secret-key-production-ready-2026",
)

DEBUG = env_bool("DJANGO_DEBUG", True)

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "*")

CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    "http://localhost:8007,http://127.0.0.1:8007,http://localhost:3000,http://62.60.191.67:8007,https://62.60.191.67:8007",
)

# Support reverse proxy & SSL termination
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ──────────────────────────────────────────────────────────────────────────
# Applications
# ──────────────────────────────────────────────────────────────────────────

INSTALLED_APPS = [
    # django-unfold must come before django.contrib.admin
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # DrGame panel apps
    "core",
    "apps.drgame_core",
    "apps.drgame_catalog",
    "apps.drgame_content",
    "apps.drgame_billing",
    "apps.drgame_support",
    "apps.drgame_referral",
    "apps.drgame_admins",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "core.middleware.DynamicCsrfTrustedOriginMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# The DrGame apps only contain unmanaged (mirrored) models -> they never need migrations.
MIGRATION_MODULES = {
    "drgame_core": None,
    "drgame_catalog": None,
    "drgame_content": None,
    "drgame_billing": None,
    "drgame_support": None,
    "drgame_referral": None,
    "drgame_admins": None,
}

# ──────────────────────────────────────────────────────────────────────────
# Database — DrGame PostgreSQL database with dedicated django_admin schema
# ──────────────────────────────────────────────────────────────────────────

DB_SCHEMA = env("DJANGO_DB_SCHEMA", "django_admin")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("POSTGRES_DB", "drgame_db"),
        "USER": env("POSTGRES_USER", "drgame_user"),
        "PASSWORD": env("POSTGRES_PASSWORD", "drgame_secure_pass_2026"),
        "HOST": env("POSTGRES_HOST", "db"),
        "PORT": env("POSTGRES_PORT", "5432"),
        "CONN_MAX_AGE": int(env("DJANGO_CONN_MAX_AGE", "60")),
        "OPTIONS": {"options": f"-c search_path={DB_SCHEMA},public"},
    }
}

# ──────────────────────────────────────────────────────────────────────────
# Authentication
# ──────────────────────────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
     "OPTIONS": {"min_length": 8}},
]

LOGIN_URL = "/admin/login/"
LOGIN_REDIRECT_URL = "/admin/"
LOGOUT_REDIRECT_URL = "/admin/login/"

SESSION_COOKIE_NAME = "drgame_admin_sessionid"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = env_bool("DJANGO_SECURE_COOKIES", False)
CSRF_COOKIE_SECURE = env_bool("DJANGO_SECURE_COOKIES", False)
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"

# ──────────────────────────────────────────────────────────────────────────
# Internationalisation — Persian / RTL
# ──────────────────────────────────────────────────────────────────────────

LANGUAGE_CODE = env("DJANGO_LANGUAGE_CODE", "fa")
TIME_ZONE = env("DJANGO_TIME_ZONE", "Asia/Tehran")
USE_I18N = True
USE_TZ = True

LANGUAGES = [
    ("fa", "فارسی"),
    ("en", "English"),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

# ──────────────────────────────────────────────────────────────────────────
# Static files
# ──────────────────────────────────────────────────────────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = []

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

X_FRAME_OPTIONS = "SAMEORIGIN"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"

# ──────────────────────────────────────────────────────────────────────────
# django-unfold theming
# ──────────────────────────────────────────────────────────────────────────

UNFOLD = {
    "SITE_TITLE": "دکتر گیم — پنل مدیریت دیتابیس",
    "SITE_HEADER": "مدیریت رکوردهای دیتابیس دکتر گیم",
    "SITE_DESCRIPTION": "پنل اختصاصی سوپرادمین برای مدیریت مستقیم جداول و مدل‌ها",
    "SITE_SYMBOL": "sports_esports",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "THEME": "light",
    "SIDEBAR": {
        "SHOW_SEARCH": True,
        "SHOW_HISTORY": True,
        "SHOW_TOOLS": False,
        "COLLAPSED": False,
        "DEFAULT_COLLAPSED": False,
    },
    "COLORS": {
        "primary": {
            "50": "#f5f3ff",
            "100": "#ede9fe",
            "200": "#ddd6fe",
            "300": "#c4b5fd",
            "400": "#a78bfa",
            "500": "#8b5cf6",
            "600": "#7c3aed",
            "700": "#6d28d9",
            "800": "#5b21b6",
            "900": "#4c1d95",
            "950": "#2e1065",
        },
    },
}
