<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام پانزدهم: بازطراحی جامع پنل ادمین و استقرار سرویس جنگو (Tasks Checklist)

> **گام:** ۱۵  
> **عنوان:** پیاده‌سازی ۵ جدول دیتابیسی ادمین، روترهای ماژولار، سیستم لاگ حسابرسی، پنل جنگو پورت ۸۰۰۷، و فرانت‌اند کامل پنل‌های ادمین با هاب ۶گانه  
> **وضعیت کلی:** انجام شده و آماده بررسی کاربر (Completed & Ready for Inspection)  

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن‌های Alembic
- [x] ساخت مدل `AdminAccessLevel` (شامل مقادیر `read_only` و `full_crud`) در `backend/app/modules/admin/models.py`
- [x] ساخت جدول `content_admins` با فیلدهای احراز هویت، اطلاعات، سطح دسترسی و `created_by_admin_id`
- [x] ساخت جدول `finance_admins` با فیلدهای احراز هویت، اطلاعات، سطح دسترسی و `created_by_admin_id`
- [x] ساخت جدول `support_admins` با فیلدهای احراز هویت، اطلاعات، سطح دسترسی و `created_by_admin_id`
- [x] ساخت جدول `report_admins` با فیلدهای احراز هویت، اطلاعات، سطح دسترسی و `created_by_admin_id`
- [x] ساخت جدول `referral_admins` با فیلدهای احراز هویت، اطلاعات، سطح دسترسی و `created_by_admin_id`
- [x] ساخت جدول `admin_audit_logs` با فیلدهای دپارتمان، ادمین، نوع اکشن، موجودیت هدف، IP، User-Agent، مقادیر JSON و تاریخ
- [x] ایجاد فایل مایگریشن ناهمگام با Alembic (`alembic revision --autogenerate -m "feat: add 5 isolated admin tables and audit logs"`)
- [x] اجرای مایگریشن در داکر (`alembic upgrade head`) و تأیید سلامت اسکیما در دیتابیس PostgreSQL

---

### فاز ۲: هسته امنیتی، احراز هویت چند اسکوپی و ثبت لاگ خودکار
- [x] ارتقای متد تولید توکن در `backend/app/core/security.py` با پشتیبانی از کلیم‌های `admin_scope` و `access_level`
- [x] پیاده‌سازی دیپندنسی `require_content_admin(level)` در `backend/app/core/admin_dependencies.py`
- [x] پیاده‌سازی دیپندنسی `require_finance_admin(level)` در `backend/app/core/admin_dependencies.py`
- [x] پیاده‌سازی دیپندنسی `require_support_admin(level)` در `backend/app/core/admin_dependencies.py`
- [x] پیاده‌سازی دیپندنسی `require_report_admin(level)` در `backend/app/core/admin_dependencies.py`
- [x] پیاده‌سازی دیپندنسی `require_referral_admin(level)` در `backend/app/core/admin_dependencies.py`
- [x] پیاده‌سازی هلپر ثبت وقایع `log_admin_action()` جهت ذخیره‌سازی نامحسوس در جدول `admin_audit_logs`

---

### فاز ۳: پیاده‌سازی روترها و سرویس‌های ماژولار بک‌اند (`/api/admin-...`)
- [x] **ماژول ادمین محتوا (`/api/admin-content`):**
  - [x] لاگین و بازیابی مشخصات ادمین (`/auth/login`, `/auth/me`)
  - [x] مدیریت پرسنل محتوا توسط ادمین `FULL_CRUD` (`/staff` CRUD)
  - [x] مدیریت بازی‌ها، دسته‌ها، فایل‌های دانلودی و آپلود مدیا به S3
  - [x] مدیریت بلاگ‌ها، اخبار و بنرها
- [x] **ماژول ادمین مالی (`/api/admin-finance`):**
  - [x] لاگین و بازیابی مشخصات ادمین (`/auth/login`, `/auth/me`)
  - [x] مدیریت پرسنل مالی (`/staff` CRUD)
  - [x] مدیریت پلن‌های اشتراک، قیمت‌ها و مدت‌زمان
  - [x] مشاهده لیست تراکنش‌ها، فاکتورها و اعطای دستی اشتراک
- [x] **ماژول ادمین پشتیبانی (`/api/admin-support`):**
  - [x] لاگین و بازیابی مشخصات ادمین (`/auth/login`, `/auth/me`)
  - [x] مدیریت پرسنل پشتیبانی (`/staff` CRUD)
  - [x] مشاهده تیکت‌ها، ارسال پاسخ به کاربر و تغییر وضعیت تیکت
  - [x] پرونده کاربر، تنظیم دستی سهمیه دانلود و مسدودسازی
- [x] **ماژول ادمین گزارشات و نظارت (`/api/admin-report`):**
  - [x] لاگین و بازیابی مشخصات ادمین (`/auth/login`, `/auth/me`)
  - [x] مدیریت پرسنل ریپورت (`/staff` CRUD)
  - [x] اندپوینت‌های چارت‌های فروش، رشد کاربران، توزیع اشتراک‌ها، و دانلودها
  - [x] اندپوینت جدول بازرسی لاگ فعالیت مدیران (`GET /audit-logs`) با فیلتر دپارتمان، تاریخ و اکشن
- [x] **ماژول ادمین رفرال (`/api/admin-referral`):**
  - [x] لاگین و بازیابی مشخصات ادمین (`/auth/login`, `/auth/me`)
  - [x] مدیریت پرسنل رفرال (`/staff` CRUD)
  - [x] مشاهده درخت شبکه معرف‌ها و سطوح پورسانت
  - [x] بررسی، تایید و ثبت فیش تسویه‌حساب بانکی (شبا) یا رد با درج علت
- [x] مانت کردن روترهای ۵گانه در فایل `backend/app/main.py`

---

### فاز ۴: راه‌اندازی و استقرار میکروسرویس Django Admin روی پورت ۸۰۰۷
- [x] ایجاد ساختار پروژه `admin-panel/` در ریشه مخزن
- [x] ایجاد `admin-panel/Dockerfile` و `admin-panel/requirements.txt` (`django`, `django-unfold`, `psycopg`)
- [x] تنظیمات `settings.py` با `search_path=django_admin,public` و کانفیگ زبان فارسی و تم راست‌چین Unfold
- [x] ایجاد مدل‌های `managed = False` برای تمامی جداول پلتفرم
- [x] افزودن کانتینر `admin-panel` به `docker-compose.dev.yml` روی پورت `8007:8007`
- [x] افزودن متغیرهای `DJANGO_ADMIN_PORT=8007`، `DJANGO_ADMIN_USERNAME` و `DJANGO_ADMIN_PASSWORD` به فایل‌های `.env` و `.env.prod`
- [x] اجرای خودکار ساخت سوپرادمین در `entrypoint.sh` سرویس جنگو

---

### فاز ۵: فرانت‌اند — هاب تستی ۶گانه و پورتال‌های لاگین مستقل
- [x] پیاده‌سازی صفحه هاب تستی در `frontend/src/app/(admin)/admin/hub/page.tsx` با ۶ کارت تعاملی
- [x] پیاده‌سازی صفحه لاگین دپارتمان محتوا در `frontend/src/app/(admin)/admin/content/login/page.tsx`
- [x] پیاده‌سازی صفحه لاگین دپارتمان مالی در `frontend/src/app/(admin)/admin/finance/login/page.tsx`
- [x] پیاده‌سازی صفحه لاگین دپارتمان پشتیبانی در `frontend/src/app/(admin)/admin/support/login/page.tsx`
- [x] پیاده‌سازی صفحه لاگین دپارتمان گزارشات در `frontend/src/app/(admin)/admin/report/login/page.tsx`
- [x] پیاده‌سازی صفحه لاگین دپارتمان رفرال در `frontend/src/app/(admin)/admin/referral/login/page.tsx`
- [x] ذخیره و ایزوله‌سازی توکن‌های هر بخش با کلیدهای تفکیک‌شده

---

### فاز ۶: فرانت‌اند — داشبوردهای ۵گانه، نمودارهای پرسرعت و مدیریت پرسنل
- [x] ساخت لایه‌بندی اختصاصی (سایدبار و هدر) برای هر یک از ۵ دپارتمان در Next.js
- [x] اعمال کنترل سطح دسترسی در UI (غیرفعال/مخفی شدن دکمه‌های عملیاتی برای اکانت‌های `READ_ONLY`)
- [x] پیاده‌سازی صفحات داشبورد محتوا: کاتالوگ بازی‌ها، بلاگ‌ها، اسلایدرها و مدیریت همکاران محتوا
- [x] پیاده‌سازی صفحات داشبورد مالی: پلن‌های اشتراک، فاکتورها، ضمانت‌ها و همکاران مالی
- [x] پیاده‌سازی صفحات داشبورد پشتیبانی: اینباکس تیکت‌ها، چت پشتیبانی، پرونده کاربران و همکاران پشتیبانی
- [x] پیاده‌سازی صفحات داشبورد گزارشات: کارت‌های آمار، چارت‌های پرسرعت SVG/سبک، جدول لاگ فعالیت ادمین‌ها و همکاران ریپورت
- [x] پیاده‌سازی صفحات داشبورد رفرال: درخت شبکه، فرم تایید/رد تسویه حساب با ثبت کد شبا و همکاران رفرال

---

### فاز ۷: آزمون‌های جامع، بازبینی نهایی و مستندات
- [x] نوشتن تست‌های Pytest برای ایزولاسیون توکن‌ها و اسکوپ‌ها
- [x] نوشتن تست‌های گارد سطح دسترسی Read-Only و Full-CRUD
- [x] ثبت لاگ حسابرسی (Audit Log) و تست عدم نفوذ بین دپارتمان‌ها
- [x] بررسی عملکردی درگاه جنگو (پورت ۸۰۰۷) و هاب پنل ادمین فرانت‌اند (`/admin/hub`)

</div>
