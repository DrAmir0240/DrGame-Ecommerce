# 📋 چک‌لیست اجرایی گام دوازدهم: حذف کامل دیتای ایستا و پیاده‌سازی بخش‌های تکمیلی (12-zero-static-data-and-missing-features)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: هسته بک‌اند، مدل‌های دیتابیس و مایگریشن Alembic
- [ ] پیاده‌سازی مدل‌های `Ticket` و `TicketMessage` در `backend/app/modules/tickets/models.py`
- [ ] پیاده‌سازی اسکیماهای Pydantic برای تیکت و پیام‌ها در `backend/app/modules/tickets/schemas.py`
- [ ] پیاده‌سازی سرویس تیکت‌ها با متدهای ایجاد، دریافت، پاسخ کاربر و پاسخ ادمین در `backend/app/modules/tickets/services.py`
- [ ] پیاده‌سازی روتر تیکت‌های کاربر (`/api/tickets/me`) در `backend/app/modules/tickets/router.py`
- [ ] پیاده‌سازی روتر تیکت‌های ادمین (`/api/admin/tickets`) و ثبت در `main.py`
- [ ] پیاده‌سازی اندپوینت‌های اعلانات کاربر (`GET /api/users/me/notifications`, `PATCH read`, `POST read-all`, `DELETE`) در `backend/app/modules/users/router.py`
- [ ] پیاده‌سازی اندپوینت سوابق پرداخت‌های کاربر (`GET /api/users/me/payments`) در `backend/app/modules/users/router.py`
- [ ] ارتقای متد `get_free_tier_games` جهت بازگرداندن آبجکت کامل بازی‌ها در `backend/app/modules/subscriptions/router.py`
- [ ] پیاده‌سازی اندپوینت ۵ بازی مشابه (`GET /api/games/{id}/similar`) در `backend/app/modules/games/router.py`
- [ ] پیاده‌سازی اندپوینت مانیتورینگ زنده رفرال برای ادمین (`GET /api/admin/referrals`) در `backend/app/modules/admin/router.py`
- [ ] پیاده‌سازی مدل و روت‌های عمومی و ادمین ژانرهای بازی (`Genre`) در `backend/app/modules/games/`
- [ ] اجرای مایگریشن سالم Alembic در داکر و اعتبارسنجی با `alembic check`

---

### فاز ۲: پاکسازی کامل ۱۰ نقطه دیتای ایستا در فرانت‌اند
- [ ] اتصال `DoubleHeroBanners.tsx` به اندپوینت `GET /api/home/banners` و حذف آرایه‌های ماک
- [ ] اتصال صفحه `admin/banners/page.tsx` به روت‌های CRUD بنرها و حذف `INITIAL_SLIDES`
- [ ] اتصال صفحه `admin/referrals/page.tsx` به `GET /api/admin/referrals` و متد تاگل هاید، و حذف `SAMPLE_USERS`
- [ ] اتصال کامپوننت `TierCard.tsx` به `GET /api/subscriptions/free-tier-games` و حذف `FREE_GAMES`
- [ ] اتصال صفحه `dashboard/downloads/page.tsx` به `GET /api/users/me/downloads` و حذف `SAMPLE_HISTORY`
- [ ] اتصال کامپوننت `NotificationDropdown.tsx` به `GET /api/users/me/notifications` و حذف `SAMPLE_NOTIFICATIONS`
- [ ] اتصال کامپوننت `TutorialBlogsSection.tsx` به مقالات واقعی وبلاگ و حذف `TOP_TUTORIALS`
- [ ] اتصال ویش‌لیست صفحه اصلی (`app/page.tsx`) به `GET /api/games/wishlist`
- [ ] تکمیل فرم `SettlementAccountsModal.tsx` با اینپوت‌های کد ملی، شماره موبایل و فلو OTP تستی
- [ ] تصحیح آدرس DNS در `Header.tsx` به آی‌پی سرور کنسول (`165.227.83.145`)

---

### فاز ۳: پیاده‌سازی ماژول‌های تکمیلی سمت کاربر و ادمین
- [ ] پیاده‌سازی صفحه تیکت‌های پشتیبانی کاربر در `frontend/src/app/(dashboard)/dashboard/tickets/page.tsx`
- [ ] پیاده‌سازی کامپوننت مودال گفتگوی تیکت (`TicketConversationModal.tsx`) با پیام‌های دوطرفه
- [ ] پیاده‌سازی کامپوننت مودال ثبت تیکت جدید (`NewTicketModal.tsx`)
- [ ] اتصال صفحه تیکت‌های ادمین در `frontend/src/app/(admin)/admin/tickets/page.tsx` به دیتابیس واقعی و حذف `mockTickets`
- [ ] پیاده‌سازی صفحه سوابق پرداخت‌ها در `frontend/src/app/(dashboard)/dashboard/payments/page.tsx`
- [ ] پیاده‌سازی کامپوننت مودال فاکتور دیجیتال رسمی (`InvoiceModal.tsx`)
- [ ] پیاده‌سازی صفحه مرکز اعلانات در `frontend/src/app/(dashboard)/dashboard/notifications/page.tsx`
- [ ] پیاده‌سازی کامپوننت کاروسل ۵ بازی مشابه (`SimilarGamesCarousel.tsx`) در انتهای `games/[id]/page.tsx`
- [ ] پیاده‌سازی صفحه مدیریت ژانرها در `frontend/src/app/(admin)/admin/genres/page.tsx`
- [ ] افزودن لینک‌های جدید به سایدبار داشبورد کاربر (`(dashboard)/layout.tsx`) و سایدبار ادمین (`(admin)/layout.tsx`)

---

### فاز ۴: تست‌نویسی خودکار بک‌اند (Pytest)
- [ ] نگارش تست‌های کامل چرخه تیکت‌های پشتیبانی در `backend/app/modules/tickets/tests/test_tickets.py`
- [ ] نگارش تست‌های اعلانات و پرداخت‌های کاربر در `backend/app/modules/users/tests/test_user_features.py`
- [ ] نگارش تست‌های بازی‌های مشابه و بازی‌های رایگان در `backend/app/modules/games/tests/test_games_extra.py`
- [ ] اجرای آزمون‌های کامل داکر: `docker compose -f docker-compose.dev.yml exec backend pytest -v` با قبولی ۱۰۰٪

---

### فاز ۵: اعتبارسنجی کیفی، تایپ‌اسکریپت و تحویل نهایی
- [ ] اعتبارسنجی کامپایل کامل تایپ‌اسکریپت فرانت‌اند: `npx tsc --noEmit` با خروجی ۰ ارور
- [ ] جستجوی متنی در کدهای فرانت‌اند برای تضمین پاکسازی ۱۰۰٪ تمام متغیرهای ماک و ایستا
- [ ] بررسی اجرای رابط کاربری در مرورگر و اطمینان از عملکرد روان و بدون ارور
- [ ] تدوین گزارش تحویل نهایی گام دوازدهم در `reports/04.md`
