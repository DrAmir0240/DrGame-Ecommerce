# Step 01: Foundation, Multi-Container Architecture, Branding & Cosmic Design System

این سند چک‌لیست دقیق و گام‌به‌گام وظایف اجرایی ایجنت هوش مصنوعی برای پیاده‌سازی فاز ۱ پروژه پلتفرم دکتر گیم (DrGame-Ecommerce) است.

## ۱. زیرساخت داکر و راه‌اندازی چندکانتینری (Docker & DevOps Foundation)
- [x] ساخت فایل `docker-compose.dev.yml` برای توسعه شامل سرویس‌های:
  - [x] `backend` (FastAPI + Python 3.12-slim، پورت `8000:8000` با حجم‌های مونت‌شده کد و ریلود خودکار)
  - [x] `frontend` (Next.js 14 + Node 20-alpine، پورت `3000:3000` با کش وابستگی‌ها)
  - [x] `db` (PostgreSQL 16-alpine، ولوم دیتابیس پایدار `drgame_pgdata_dev`، پورت `8020:5432`)
  - [x] `cache` (Redis 7-alpine، پورت `8021:6379`)
- [x] ساخت فایل `docker-compose.prod.yml` با تنظیمات استقرار بهینه و کانتینرهای مستقل.
- [x] ایجاد فایل `.env.example` و `.env` حاوی کلیه متغیرهای کانفیگ:
  - [x] `PROJECT_NAME="DrGame E-Commerce Platform"`
  - [x] `ENVIRONMENT=development`
  - [x] `DATABASE_URL=postgresql+asyncpg://drgame_user:drgame_secure_pass_2026@db:5432/drgame_db`
  - [x] `REDIS_URL=redis://cache:6379/0`
  - [x] `JWT_SECRET_KEY`، `JWT_ALGORITHM=HS256`، `ACCESS_TOKEN_EXPIRE_MINUTES=1440`
  - [x] `RAWG_API_KEY`
- [x] ساخت `Makefile` برای اجرای سریع فرامین داکر (`make dev`, `make test`, `make migrate`, `make down`).
- [x] ایجاد فایل `.gitignore` استاندارد برای فایل‌های مخفی، لاگ‌ها، `node_modules` و دیتابیس لوکال.

## ۲. هسته مرکزی بک‌اند (FastAPI Core Architecture)
- [x] ساخت ساختار `backend/app/core/`:
  - [x] `config.py`: بارگذاری تنظیمات با `pydantic-settings` و تایپ‌های مشخص.
  - [x] `database.py`: تعریف `create_async_engine`، `async_sessionmaker` و کلاس پایه `Base(DeclarativeBase)`.
  - [x] `redis_client.py`: کلاینت ناهمگام متمرکز با متدهای `get`, `set`, `delete`, `exists`, `ping`.
  - [x] `security.py`: توابع `create_access_token`, `verify_token`, `get_password_hash`, `verify_password` با استفاده مستقیم از Bcrypt.
  - [x] `exceptions.py`: کلاس‌های خطای سفارشی (`AppException`, `NotFoundException`, `UnauthorizedException`, `QuotaExceededException`).
  - [x] `dependencies.py`: وابستگی‌های `get_db`، `get_redis`، `get_current_user` و `get_current_user_optional`.
  - [x] `jalali.py`: توابع تبدیل تاریخ میلادی به هجری شمسی برای فاکتورها و تراکنش‌ها.
- [x] راه‌اندازی نقطه ورود `backend/app/main.py`:
  - [x] ثبت میدل‌ورهای CORS و گزارش زمان پردازش (`X-Process-Time`).
  - [x] ثبت سراسری Exception Handler برای ساختار یکدست خطاها (`status`, `code`, `message`, `details`).

## ۳. مدل‌های پایگاه داده و مهاجرت اولیه (Alembic Baseline)
- [x] تعریف مدل‌های ماژول کاربران (`backend/app/modules/users/models.py`):
  - [x] جدول `users`: `id`, `email`, `username`, `hashed_password`, `is_active`, `is_superuser`, `created_at`, `updated_at`.
  - [x] جدول `user_profiles`: `id`, `user_id`, `display_name`, `avatar_url`, `bio`, `gamer_tag`, `xp`, `level`, `total_playtime_hours`, `streak_days`, `wallet_balance`.
- [x] تعریف مدل‌های ماژول اشتراک و سهمیه (`backend/app/modules/subscriptions/models.py`):
  - [x] جدول `subscription_tiers`: `id`, `name`, `slug`, `description`, `price`, `duration_days`, `quota_bytes`, `max_download_speed_mbps`, `allowed_platforms`, `features`, `limitations`, `is_active`.
  - [x] جدول `user_subscriptions`: `id`, `user_id`, `tier_id`, `starts_at`, `expires_at`, `total_quota_bytes`, `used_quota_bytes`, `is_active`.
- [x] پیکربندی Alembic با `env.py` ناهمگام و اتصال به متادیتای مدل‌ها.
- [x] ایجاد و اعمال نخستین مایگریشن پایه (`0001_initial_baseline.py`) در کانتینر داکر با موفقیت کامل.
- [x] ایجاد دانه اولیه داده‌ها (Database Seed) برای ایجاد ۴ پلن اصلی (`Free`, `Bronze`, `Silver`, `Gold`).

## ۴. اندپوینت‌های پایه بک‌اند (API Routers & Schemas)
- [x] ایجاد روت سلامت سرور:
  - [x] `GET /health` و `GET /api/v1/health`: بررسی وضعیت سرویس FastAPI، اتصال PostgreSQL و اتصال Redis.
- [x] ایجاد روت‌های عمومی سیستم و تنظیمات (`/api/v1/system`):
  - [x] `GET /api/v1/system/settings`: دریافت پلتفرم‌های مجاز، تم فعال، اطلاعات برند و وضعیت سرور.
- [x] ایجاد روت‌های اشتراک و سهمیه پایه (`/api/v1/subscriptions`):
  - [x] `GET /api/v1/subscriptions/tiers`: دریافت لیست پلن‌های ۴گانه با جزئیات حجم و قیمت همراه با کش در ردیس.
- [x] ایجاد روت استعلام سهمیه برای هدر (`/api/v1/quota`):
  - [x] `GET /api/v1/quota/status`: بازگرداندن سهمیه جاری کلاینت (حجم کل، حجم مصرفی، حجم مانده و متن فرمت‌شده کپسول هدر).
- [x] ایجاد روت پایه احراز هویت (`/api/v1/auth`):
  - [x] `POST /api/v1/auth/register`: ثبت‌نام کاربر جدید و ایجاد خودکار پروفایل گیمر.
  - [x] `POST /api/v1/auth/login`: اعتبارسنجی ورود و صدور توکن JWT.
  - [x] `GET /api/v1/auth/me`: دریافت مشخصات کاربر احراز هویت شده و پروفایل گیمر.

## ۵. یکپارچه‌سازی دارایی‌های برندینگ (Branding & Logo Assets)
- [x] انتقال و قرارگیری فایل لوگو:
  - [x] کپی فایل `logo.png` به مسیر `frontend/public/logo.png`.
  - [x] کپی فایل `logo-motion.mp4` به مسیر `frontend/public/logo-motion.mp4`.
- [x] پیاده‌سازی کامپوننت `Logo` در فرانت‌اند:
  - [x] پشتیبانی از اندازه قابل تنظیم، درخشش بنفش کهکشانی و بهینه‌سازی لود.
  - [x] لینک خودکار به صفحه اصلی `/`.
- [x] پیاده‌سازی کامپوننت `LogoMotion` (پخش‌کننده موشن‌گرافیک):
  - [x] رندر به صورت پلیر ویدیویی در بنر هیرو و مودال پاپ‌آپ با کنترلر صدا و پخش.

## ۶. فرانت‌اند Next.js و سیستم طراحی کهکشانی (Cosmic Purple Theme)
- [x] راه‌اندازی پروژه Next.js 14 با TypeScript و Tailwind CSS در دایرکتوری `frontend/`.
- [x] پیکربندی کامل فونت‌ها و زبان:
  - [x] تنظیم فونت فارسی `Vazirmatn` و فونت انگلیسی `Inter`.
  - [x] پشتیبانی دو جهته (`dir="rtl"` برای فارسی و `dir="ltr"` برای انگلیسی).
- [x] تنظیم متغیرهای تم در `frontend/src/app/globals.css`:
  - [x] متغیرهای حالت تاریک OLED (`#070709`, `#101116`, `#181920`, مرزهای نیمه‌شفاف).
  - [x] متغیرهای حالت روشن (`#F8F9FA`, `#FFFFFF`, `#F1F3F5`).
  - [x] متغیرهای رنگ بنفش کهکشانی (`#7C3AED`, `#A855F7`, `#4C1D95`).
  - [x] کلاس‌های اختصاصی گرادینت کهکشانی و درخشش نئونی (`glow-purple`, `shadow-cosmic`).
  - [x] کلاس‌های کارت شیشه‌ای (`glass-card`, `glass-panel` با `backdrop-blur-xl`).
- [x] ایجاد پترن وکتوری پس‌زمینه پلی‌استیشن (`frontend/public/patterns/ps-symbols.svg`) شامل مثلث، دایره، ضربدر و مربع با اعمال روی بدنه صفحات.
- [x] پیاده‌سازی استور کلاینت با `Zustand`:
  - [x] `useThemeStore`: تغییر تم دارک/لایت با همگام‌سازی لوکال‌استوریج.
  - [x] `useLangStore`: تغییر زبان فارسی/انگلیسی و جهت صفحه (RTL/LTR).
  - [x] `useQuotaStore`: نگهداری و همگام‌سازی وضعیت سهمیه حجم دانلود از API بک‌اند.

## ۷. هدر سراسری، ناوبری و رابط کاربری ۱۰ فوتی تلویزیون (Global Navigation & 10-Foot UI)
- [x] پیاده‌سازی کامپوننت هدر سراسری (`frontend/src/components/layout/Header.tsx`):
  - [x] سمت راست: لوگوی دکتر گیم با افکت نئون بنفش + منوی لینک‌های اصلی (`خانه`, `فروشگاه بازی‌ها`, `اشتراک‌ها`, `اخبار و مقالات`).
  - [x] مرکز: نوار جستجوی کپسولی شیشه‌ای با قابلیت ورودی زنده.
  - [x] سمت چپ:
    - [x] ویجت کپسولی سهمیه حجم (**Quota Pill Widget**): نمایش `GB 0` با برچسب و دکمه اتصال به اشتراک‌ها.
    - [x] دکمه تغییر تم تاریک/روشن با انیمیشن آیکون ماه و خورشید.
    - [x] دکمه سوییچ زبان (`English / فارسی`).
    - [x] کامپوننت آواتار کاربر با دکمه اتصال به پروفایل.
- [x] پیاده‌سازی نوار ناوبری پایین صفحه موبایل (`frontend/src/components/layout/MobileBottomNav.tsx`) برای نمایشگرهای زیر ۷۶۸ پیکسل.
- [x] پیاده‌سازی فوتر سراسری پلتفرم با نشان‌های سرعت ۴۰ مگابیت، دیتای تست‌شده، حالت تلویزیون و نمادهای کنسول.
- [x] پیاده‌سازی موتور ناوبری فضایی ۱۰ فوتی تلویزیون (`frontend/src/hooks/useGamepadNavigation.ts`):
  - [x] شناسایی کلیدهای جهت‌نما و دسته بازی کنسول با `navigator.getGamepads()`.
  - [x] استایل‌های بزرگ‌نمایی `:focus-visible` با کادر نئونی بنفش و اسکرول نرم خودکار.

## ۸. تست‌های خودکار و اعتبارسنجی کیفی (Testing & Verification)
- [x] پیاده‌سازی و اجرای تست‌های بک‌اند با Pytest:
  - [x] `test_health.py`: بررسی درستی پاسخ ۲00 اندپوینت سیستم و تنظیمات.
  - [x] `test_security.py`: آزمون توابع هش پسورد و تولید و دیکود توکن JWT.
  - [x] `test_subscriptions.py`: استعلام لیست پلن‌های ۴گانه و وضعیت اولیه سهمیه.
  - [x] `test_auth.py`: تست کامل ثبت‌نام، لاگین و دریافت اطلاعات پروفایل.
- [x] اجرای دستور `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` با موفقیت ۱۰۰٪ تست‌ها (۶ از ۶ پاس شد).
- [x] اجرای دستور `npx tsc --noEmit` بدون هیچ خطای کامپایل.
- [x] اجرای دستور `npm run build` و حصول اطمینان از تولید موفق صفحات استاتیک Next.js (۱۰۰٪ موفق).
- [x] اعتبارسنجی رابط کاربری در مرورگر و ضبط ویدئوی تعامل با سوییچ تم و لایوت.
