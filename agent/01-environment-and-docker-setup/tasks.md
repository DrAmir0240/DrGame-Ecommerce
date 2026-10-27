# 📋 چک‌لیست اجرایی گام اول: راه‌اندازی زیرساخت داکر و هسته پروژه (01-environment-and-docker-setup)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: فایل‌های پیکربندی ریشه و متغیرهای محیطی
- [x] ایجاد فایل `.env.example` و `.env` با تنظیمات پایگاه داده PostgreSQL، کش Redis، پورت‌ها و کلیدهای محرمانه
- [x] به‌روزرسانی `.gitignore` برای چشم‌پوشی از ولوم‌های داکر، `.next`، `node_modules`، لاگ‌ها و کش‌های پایتون

### فاز ۲: ساختار کانتینری Docker و داکر کامپوز
- [x] ایجاد فایل `backend/Dockerfile` بر پایه پایتون ۳.۱۲-slim با تنظیمات کاربر غیر ریشه و وابستگی‌های سیستمی
- [x] ایجاد فایل `frontend/Dockerfile` بر پایه Node 20-alpine برای محیط توسعه با کشینگ پکیج‌ها
- [x] تدوین `docker-compose.dev.yml` شامل ۴ کانتینر (`backend`, `frontend`, `db`, `cache`) با شبکه داخلی `drgame_network` و تعریف Healthcheck برای دیتابیس و ردیس

### فاز ۳: پیاده‌سازی لایه هسته مرکزی بک‌اند (FastAPI Core)
- [x] ایجاد فایل `backend/requirements.txt` شامل FastAPI, SQLAlchemy, Asyncpg, Alembic, Redis, Pydantic-Settings, Pytest, HTTPX
- [x] پیاده‌سازی `backend/app/core/config.py` با pydantic-settings برای لود تنظیمات امن از محیط
- [x] پیاده‌سازی `backend/app/core/database.py` جهت اتصال ناهمگام (Async Engine & SessionLocal) به PostgreSQL 16
- [x] پیاده‌سازی `backend/app/core/redis_client.py` به عنوان کلاینت ناهمگام متمرکز برای Redis 7
- [x] پیاده‌سازی `backend/app/core/exceptions.py` شامل سلسله‌مراتب خطاهای سفارشی و هندلرهای عمومی
- [x] پیکربندی ابزار Alembic در `backend/alembic.ini` و اسکریپت ناهمگام `backend/alembic/env.py`
- [x] پیاده‌سازی فایل اصلی `backend/app/main.py` به همراه میدل‌ور CORS و اندپوینت پایش سلامت `GET /api/health`

### فاز ۴: تست‌نویسی خودکار اولیه بک‌اند (Pytest)
- [x] تدوین فیکسچرهای تست ناهمگام در `backend/tests/conftest.py` برای شبیه‌سازی کلاینت HTTP و اتصال تست
- [x] نگارش تست‌های سلامت سیستم در `backend/tests/test_health.py` برای بررسی اتصال پایگاه داده و ردیس
- [x] اجرای آزمون‌های Pytest درون کانتینر با دستور `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی

### فاز ۵: راه‌اندازی فرانت‌اند Next.js و سیستم طراحی کهکشانی
- [x] ایجاد `frontend/package.json` و نصب پکیج‌های Next.js 14, React, Tailwind, Lucide React, Zustand, Framer Motion
- [x] پیکربندی `frontend/tsconfig.json`، `frontend/next.config.js` و `frontend/postcss.config.js`
- [x] پیاده‌سازی توکن‌های رنگ کهکشانی و کلاس‌های گلس‌مورفیسم در `frontend/tailwind.config.ts`
- [x] تدوین استایل‌های سراسری در `frontend/src/app/globals.css` با فونت Vazirmatn، تم تاریک OLED و افکت‌های درخشش نئونی
- [x] پیاده‌سازی لایوت ریشه در `frontend/src/app/layout.tsx` با قابلیت راست‌چین (`dir="rtl"`)
- [x] پیاده‌سازی صفحه خوش‌آمدگویی و تست اتصال در `frontend/src/app/page.tsx` با نمایش زنده وضعیت سلامت API بک‌اند

### فاز ۶: اعتبارسنجی نهایی زیرساخت
- [x] بررسی تایپ‌اسکریپت و بیلد فرانت‌اند در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] راه‌اندازی کل پشته با دستور `docker compose -f docker-compose.dev.yml up -d --build` و تایید لود صفحه در پورت ۳۰۰۰ و مستندات Swagger در پورت ۸۰۰۰
