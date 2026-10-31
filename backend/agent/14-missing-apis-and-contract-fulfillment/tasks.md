# 📋 چک‌لیست اجرایی گام چهاردهم: پیاده‌سازی APIهای تکمیلی و رفع باگ‌های سیستمی (14-missing-apis-and-contract-fulfillment)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.  
> **خط قرمز توسعه:** هیچ فایلی در پوشه `frontend/` نباید ویرایش یا ایجاد شود؛ کلیه اقدامات منحصراً در `backend/` متمرکز است.

---

### فاز ۱: اصلاح باگ‌های محاسباتی و خطاهای مالی (Financial Bug Fixes)
- [x] اصلاح خطای ۱۰ برابری محاسبات پورسانت رفرال در `backend/app/modules/wallet/services.py` (حذف `// 10` در متد `process_commission_waterfall`)
- [x] اصلاح خطای ۱۰ برابری پایش مالی و ارقام تومانی در `backend/app/modules/admin/services.py` (حذف `// 10` در متدهای `get_finance_overview` و `get_dashboard_stats`)
- [x] حذف تولید بازی‌های مصنوعی موسوم به `Special Edition 1..285` در اسکریپت و سرویس‌های بازی

---

### فاز ۲: مدل‌سازی دیتابیس و تنظیمات کلان داینامیک (SiteSettings & Database Models)
- [x] ایجاد مدل دیتابیس `SiteSetting` در `backend/app/modules/core/models.py` (شامل DNSهای هدر، اطلاعات تماس فوتر، شبکه‌های اجتماعی، فریمورهای جیلبریک و FAQ)
- [x] ایجاد شِماهای Pydantic V2 برای تنظیمات سایت در `backend/app/modules/core/schemas.py`
- [x] پیاده‌سازی سرویس `CoreSettingsService` با متدهای کشینگ ردیس در `backend/app/modules/core/services.py`
- [x] پیاده‌سازی روتر تنظیمات سایت (`GET /api/settings`, `GET /api/site-settings`, `PUT /api/admin/settings`) در `backend/app/modules/core/router.py`
- [x] اجرای مایگریشن کانتینری سالم Alembic برای جدول `site_settings` و اعتبارسنجی با `alembic check`

---

### فاز ۳: پیاده‌سازی پنل مدیریت وبلاگ و آموزش‌ها در ادمین (Admin Blog CRUD)
- [x] پیاده‌سازی DTOهای ساخت و ویرایش مقالات و دسته‌بندی‌ها در `backend/app/modules/news/schemas.py`
- [x] پیاده‌سازی متدهای CRUD مقالات و دسته‌بندی‌ها همراه با ابطال کش ردیس در `backend/app/modules/news/services.py`
- [x] پیاده‌سازی اندپوینت‌های مدیریتی وبلاگ (`GET`, `POST`, `PUT`, `DELETE` برای `/api/admin/blog/posts` و `/categories`) در `backend/app/modules/news/router.py`

---

### فاز ۴: تکمیل چرخه حساب‌های تسویه، سوابق برداشت و احراز هویت با OTP
- [x] پیاده‌سازی DTOهای ویرایش حساب و سوابق برداشت در `backend/app/modules/wallet/schemas.py`
- [x] پیاده‌سازی متدهای `list_user_withdrawals`, `update_settlement_account`, `delete_settlement_account` در `backend/app/modules/wallet/services.py`
- [x] پیاده‌سازی اندپوینت‌های سوابق برداشت و مدیریت حساب (`GET /api/referral/withdrawals`, `PUT/DELETE /api/referral/settlement-accounts/{id}`) در `backend/app/modules/wallet/router.py`
- [x] پیاده‌سازی اندپوینت جامع مشاهده حساب‌های بانکی برای ادمین (`GET /api/admin/settlement-accounts` و alias آن `GET /api/admin/bank-accounts`) در `backend/app/modules/admin/router.py`
- [x] پیاده‌سازی شِما و سرویس ورود کاربر با رمز یکبار مصرف بدون پسورد (`login_with_otp`) در `backend/app/modules/auth/`
- [x] پیاده‌سازی اندپوینت `POST /api/auth/login/otp` در `backend/app/modules/auth/router.py`

---

### فاز ۵: تکمیل عملیات مدیریتی کاربران، اشتراک‌ها و آپلود آواتار
- [x] پیاده‌سازی متدهای ویرایش پایه کاربر (`PUT /api/admin/users/{id}`) و تغییر وضعیت (`PATCH /api/admin/users/{id}/status`) در `backend/app/modules/admin/`
- [x] پیاده‌سازی متد اعطای دستی اشتراک توسط ادمین (`POST /api/admin/users/{id}/subscriptions`) همراه با تخصیص سهمیه
- [x] پیاده‌سازی متد ویرایش و تمدید اشتراک‌های صادرشده (`PUT /api/admin/subscriptions/{id}`) در `backend/app/modules/admin/`
- [x] پیاده‌سازی متد ویرایش کدهای تخفیف (`PUT /api/admin/discounts/{id}`) در `backend/app/modules/admin/`
- [x] پیاده‌سازی سرویس و اندپوینت آپلود مستقیم فایل آواتار کاربر (`POST /api/users/profile/upload-avatar`) در `backend/app/modules/users/`
- [x] افزودن فلگ `is_current: bool` به لیست نشست‌های کاربر در `backend/app/modules/users/services.py`

---

### فاز ۶: حل مشکل کسر خودکار سهمیه دانلود و کرون‌جاب زمان‌بندی‌شده
- [x] اصلاح خروجی `download_url` در جزئیات بازی جهت اشاره به اندپوینت استریم و کسر سهمیه
- [x] پیاده‌سازی اندپوینت `GET /api/games/{game_id}/downloads/{file_id}/stream` جهت کسر اتمیک سهمیه، ثبت در `UserDownloadHistory` و ریدایرکت ۳۰۲ به فایل اصلی
- [x] راه‌اندازی ماژول زمان‌بندی `backend/app/tasks/scheduler.py` با کرون جاب روزانه همگام‌سازی RAWG و اتصال به `lifespan` در `main.py`

---

### فاز ۷: آزمون‌های خودکار دو لایه با Pytest در داکر
- [x] نگارش تست‌های جامع در `backend/tests/test_missing_apis_fulfillment.py` (پوشش مالی، بلاگ، تنظیمات، ورود با OTP و کسر سهمیه)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml exec backend pytest -q`
- [x] تضمین قبولی ۱۰۰٪ آزمون‌ها (Zero Failures - تمام ۶۷ تست موفق)

---

### فاز ۸: اعتبارسنجی نهایی و مستندسازی
- [x] اطمینان از عدم تغییر هیچ فایلی در پوشه `frontend/`
- [x] تدوین گزارش تحویل نهایی مایل‌استون در `backend/reports/06.md`
- [x] تدوین راهنمای جامع اتصال فرانت‌اند در `backend/front-guides/01-guide-for-step-14.md`
