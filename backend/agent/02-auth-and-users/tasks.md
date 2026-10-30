# 📋 چک‌لیست اجرایی گام دوم: ماژول احراز هویت و کاربران (02-auth-and-users)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم (Alembic Migration)
- [x] پیاده‌سازی مدل‌های `users` (شامل `console_auth_code` و `referral_code`) در `backend/app/modules/users/models.py`
- [x] پیاده‌سازی مدل `user_sessions` (شامل `jti`, `device_name`, `device_type`, `user_agent`, `ip_address`) در `backend/app/modules/auth/models.py`
- [x] ایجاد فایل مایگریشن Alembic درون داکر: `docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "feat: add users and sessions tables"`
- [x] اجرای مایگریشن در کانتینر: `docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head` و اعتبارسنجی با `alembic check`

### فاز ۲: هسته امنیتی و وابستگی‌های سیستم (Security Core)
- [x] پیاده‌سازی `backend/app/core/security.py` شامل توابع هش Bcrypt و توابع صدور و اعتبارسنجی JWT با الگوریتم HS256
- [x] پیاده‌سازی `backend/app/core/dependencies.py` شامل گارد `get_current_user` و بررسی بلک‌لیست توکن در Redis

### فاز ۳: پیاده‌سازی لایه سرویس در بک‌اند (Service Layer)
- [x] پیاده‌سازی متدهای `backend/app/modules/auth/services.py`: تولید OTP، ذخیره و انقضا در Redis، اعتبارسنجی کد، لاگین با پسورد، لاگین با کد ۷ رقمی کنسول و ابطال سشن
- [x] پیاده‌سازی متدهای `backend/app/modules/users/services.py`: واکشی پروفایل، انتخاب آواتار سونی، تغییر رمز عبور و سلب دسترسی سشن‌ها

### فاز ۴: پیاده‌سازی روترها و شِماهای Pydantic V2 (API Layer)
- [x] تدوین DTOهای Pydantic در `backend/app/modules/auth/schemas.py` و `backend/app/modules/users/schemas.py`
- [x] پیاده‌سازی روتر `backend/app/modules/auth/router.py` شامل مسیرهای ثبت‌نام OTP، لاگین، لاگین کنسول و خروج
- [x] پیاده‌سازی روتر `backend/app/modules/users/router.py` شامل مسیرهای اطلاعات کاربر و مدیریت سشن‌ها
- [x] رجیستر روترها در `backend/app/main.py`

### فاز ۵: تست‌نویسی خودکار دو لایه بک‌اند (Pytest Suite - الزام ۱۰۰٪ قبولی)
- [x] نگارش تست‌های واحد سرویس در `backend/tests/test_auth_services.py` و `tests/test_users_services.py`
- [x] نگارش تست‌های یکپارچگی اندپوینت‌ها در `backend/tests/test_auth_router.py` و `tests/test_users_router.py` (پوشش 200, 201, 400, 401, 422)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی بدون خطا

### فاز ۶: توسعه فرانت‌اند و اتصال به بک‌اند (Frontend Integration)
- [x] پیاده‌سازی استور کلاینت `frontend/src/stores/useAuthStore.ts` با Zustand
- [x] پیاده‌سازی کلاینت درخواست‌های احراز هویت‌شده `frontend/src/lib/apiClient.ts`
- [x] طراحی و پیاده‌سازی مودال شیشه‌ای ورود/ثبت‌نام `frontend/src/components/auth/AuthModal.tsx` با قابلیت تشخیص User-Agent پلی‌استیشن برای نمایش فیلد کد ۷ رقمی
- [x] پیاده‌سازی کامپوننت انتخاب آواتار سونی طبق طرح `121.png` در `frontend/src/components/profile/AvatarPicker.tsx`
- [x] طراحی و پیاده‌سازی صفحه پروفایل کاربری `/dashboard/profile` با نمایش کد دائمی کنسول و کد رفرال
- [x] طراحی و پیاده‌سازی صفحه سشن‌ها و دستگاه‌های متصل `/dashboard/sessions` به همراه دکمه لغو دسترسی

### فاز ۷: اعتبارسنجی نهایی و بیلد
- [x] بررسی تایپ‌اسکریپت و لینتر فرانت‌اند در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] تست دستی و عملکردی کامل فرآیند ثبت‌نام، ورود با پسورد و ورود کنسولی از طریق کلاینت
