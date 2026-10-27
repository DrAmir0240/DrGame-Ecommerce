# 📋 چک‌لیست اجرایی گام دهم: هسته عملکردی، منطق تجاری و مدل‌های دیتابیس (10-backend-core-and-logic)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم Alembic
- [x] پیاده‌سازی مدل‌های `GameDownloadFile` و `UserDownloadHistory` در ماژول بازی‌ها
- [x] پیاده‌سازی مدل `ReferralTreasuryPool` و جدول لاگ‌های صندوق در ماژول ولت
- [x] افزودن فیلد `is_referral_hidden` به جدول `users`
- [x] افزودن فیلد `is_primary` به جدول `user_sessions`
- [x] افزودن فیلدهای `national_code` و `phone` به جدول `settlement_accounts`
- [x] پیاده‌سازی مدل `HomeBanner` جهت مدیریت دو بنر اسلایدر صفحه اصلی
- [x] ایجاد فایل مایگریشن سالم Alembic در داکر: `docker compose -f docker-compose.dev.yml exec backend alembic revision --autogenerate -m "feat: add multifile downloads, treasury pool, and session primary"`
- [x] اعمال مایگریشن روی دیتابیس: `docker compose -f docker-compose.dev.yml exec backend alembic upgrade head` و اعتبارسنجی با `alembic check`

### فاز ۲: الگوریتم رفرال نصف‌شونده نامحدود و صندوق پلتفرم
- [x] پیاده‌سازی الگوریتم حلقه نامحدود نصف‌شونده پورسانت ($Commission_n = Commission_{n-1} / 2$) در `backend/app/modules/wallet/services.py`
- [x] پیاده‌سازی لاجیک واریز مانده پورسانت به صندوق پلتفرم (`ReferralTreasuryPool`)
- [x] پیاده‌سازی قابلیت هاید کردن (Hide/Unhide) کاربر در زنجیره رفرال و اتصال مستقیم بالادستی و پایین‌دستی بدون حذف رابطه در دیتابیس
- [x] پیاده‌سازی متدهای ادمین جهت مشاهده موجودی صندوق پلتفرم، صفر کردن و اعطای جایزه

### فاز ۳: احراز هویت شماره حساب، کد ملی، شماره تلفن و OTP
- [x] پیاده‌سازی متد ارسال و اعتبارسنجی کد یکبار مصرف (OTP) موبایل همراه با چاپ در پاسخ/کنسول جهت تست
- [x] پیاده‌سازی تابع ماک تطبیق هویت سه‌گانه `verify_national_identity(national_code, phone, iban)` با تایید خودکار در `backend/app/modules/auth/identity_service.py`
- [x] به‌روزرسانی روت‌های ثبت شماره حساب تسویه رفرال در `backend/app/modules/wallet/router.py`

### فاز ۴: لاجیک دانلود ۵ بخشی فایل‌ها و کسر بلادرنگ سهمیه
- [x] پیاده‌سازی متد صدور لینک دانلود اختصاصی و بررسی سطوح مجاز اشتراک تعیین‌شده توسط ادمین در `backend/app/modules/games/services.py`
- [x] پیاده‌سازی کسر بلادرنگ سهمیه از `UserQuota` به میزان حجم دقیق فایل صادر شده
- [x] ثبت خودکار تراکنش صدور لینک در جدول `UserDownloadHistory`
- [x] پیاده‌سازی اندپوینت دریافت تاریخچه دانلودهای کاربر (`GET /api/users/me/downloads`)

### فاز ۵: امنیت نشست‌های دستگاه (Device Sessions)
- [x] پیاده‌سازی لاجیک تعیین و محافظت از نشست اصلی (`is_primary`) در زمان لاگین اولیه
- [x] افزودن گارد امنیتی جلوگیری از حذف نشست اصلی و نشست فعلی با خطای ۴۰۳ در `backend/app/modules/auth/services.py`

### فاز ۶: بازنگری سیستم اشتراک‌ها و جاب اعلان هوشمند
- [x] ساختاربندی پلن‌های اشتراک بر اساس ۳ بازه زمانی ۱، ۳ و ۶ ماهه
- [x] رفع قطعی باگ افزودن بازی به پلن رایگان و خواندن داینامیک از `FreeTierAllowedGame` در `backend/app/modules/subscriptions/services.py`
- [x] پیاده‌سازی جاب زمان‌بندی‌شده بررسی کاربران با ۳ روز مانده به انقضا یا ۱۰٪ حجم باقیمانده و درج اعلان در `user_notifications`

### فاز ۷: سیستم مدیریت اسلایدرهای دوگانه صفحه اول
- [x] پیاده‌سازی سرویس و روتر بنرهای صفحه اول (`HomeBanner`) با موقعیت ۱ و ۲ در `backend/app/modules/home/router.py`
- [x] پیاده‌سازی روت‌های CRUD مدیریتی برای ادمین و روت عمومی دریافت اسلایدها

### فاز ۸: تست‌نویسی خودکار دو لایه بک‌اند (Pytest)
- [x] نگارش تست‌های واحد الگوریتم رفرال نصف‌شونده، هاید رفرال و صندوق در `backend/app/modules/wallet/tests/test_infinite_referral.py`
- [x] نگارش تست‌های واحد صدور فایل‌های ۵ بخشی دانلود، کسر سهمیه و بررسی لاگ دانلود در `backend/app/modules/games/tests/test_multifile_downloads.py`
- [x] نگارش تست‌های گارد نشست‌های اصلی و فعلی در `backend/app/modules/auth/tests/test_session_protection.py`
- [x] اجرای کامل تست‌ها در داکر: `docker compose -f docker-compose.dev.yml exec backend pytest -v` با قبولی ۱۰۰٪

### فاز ۹: اعتبارسنجی نهایی بک‌اند
- [x] بررسی لاگ‌های کانتینر بک‌اند و اطمینان از سلامت استارتاپ: `docker compose -f docker-compose.dev.yml logs --tail=50 backend`
