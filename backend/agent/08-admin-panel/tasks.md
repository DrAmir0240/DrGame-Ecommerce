# 📋 چک‌لیست اجرایی گام هشتم: پنل مدیریت کلان و ایزوله سیستم (08-admin-panel)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم (Alembic Migration)
- [x] پیاده‌سازی مدل جدول مجزای `admins` در `backend/app/modules/auth/admin_models.py`
- [x] ایجاد فایل مایگریشن Alembic درون داکر: `docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "feat: add isolated admins table"`
- [x] اجرای مایگریشن در کانتینر: `docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head` و اعتبارسنجی با `alembic check`
- [x] بذر اولیه (Seed) حساب کاربری سوپراَدمین سیستم با رمز عبور قوی هش‌شده

### فاز ۲: هسته امنیتی و احراز هویت مستقل ادمین (Admin Security)
- [x] پیاده‌سازی صدور و اعتبارسنجی توکن‌های اختصاصی ادمین با شناسه `type: "admin"` در `backend/app/core/security.py`
- [x] پیاده‌سازی گارد دسترسی `get_current_admin` در `backend/app/core/admin_dependencies.py` جهت محافظت از اندپوینت‌های مدیریتی

### فاز ۳: پیاده‌سازی لایه سرویس مدیریت (Admin Services)
- [x] پیاده‌سازی متدهای مدیریت کاربران و **افزایش/کاهش دستی سهمیه حجم کاربر توسط ادمین** در `backend/app/modules/admin/services.py`
- [x] پیاده‌سازی متدهای CRUD کاتالوگ بازی‌ها و لینک‌های دانلود ۵ تکه
- [x] پیاده‌سازی تنظیمات پلن‌ها و انتخاب داینامیک ۵ بازی مجاز در اشتراک رایگان
- [x] پیاده‌سازی گزارشات مانیتورینگ مالی تفکیک‌شده ریالی و ارزی (صرفاً فقط‌خواندنی)
- [x] پیاده‌سازی کارتابل تایید/رد شماره شبا، کیف پول کریپتو و درخواست‌های تسویه رفرال
- [x] پیاده‌سازی مدیریت و پاسخ‌گویی به تیکت‌های پشتیبانی
- [x] پیاده‌سازی سیستم مدیریت کدهای تخفیف

### فاز ۴: پیاده‌سازی روترها و شِماهای Pydantic V2 (API Layer)
- [x] تدوین DTOهای مدیریت در `backend/app/modules/admin/schemas.py`
- [x] پیاده‌سازی روت‌های ورود ادمین و ۱۰ ماژول مدیریتی با پیشوند `/api/admin/*` در `backend/app/modules/admin/router.py`
- [x] رجیستر روتر ادمین در `backend/app/main.py`

### فاز ۵: تست‌نویسی خودکار دو لایه بک‌اند (Pytest Suite - الزام ۱۰۰٪ قبولی)
- [x] نگارش تست‌های واحد سرویس مدیریت در `backend/app/modules/admin/tests/test_services.py` (تغییر سهمیه، لاگین ادمین، تایید تسویه)
- [x] نگارش تست‌های یکپارچگی روت‌های ادمین در `backend/app/modules/admin/tests/test_router.py` (پوشش کدهای 200, 401, 403, 404, 422)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی (۴۱ تست موفق از ۴۱ تست)

### فاز ۶: توسعه فرانت‌اند پنل مدیریت (Admin Frontend)
- [x] طراحی و پیاده‌سازی لایوت اختصاصی ادمین در `frontend/src/app/(admin)/layout.tsx` با سایدبار راست تاشو و محافظت مسیر
- [x] طراحی و پیاده‌سازی صفحه ورود ادمین در `frontend/src/app/(admin)/admin/login/page.tsx`
- [x] پیاده‌سازی صفحه داشبورد خلاصه آمار در `frontend/src/app/(admin)/admin/dashboard/page.tsx`
- [x] پیاده‌سازی صفحه مدیریت کاربران و مودال ویرایش سهمیه در `frontend/src/app/(admin)/admin/users/page.tsx`
- [x] پیاده‌سازی مدیریت کاتالوگ بازی‌ها در `frontend/src/app/(admin)/admin/games/page.tsx`
- [x] پیاده‌سازی صفحه تنظیمات پلن‌ها و بازی‌های رایگان در `frontend/src/app/(admin)/admin/subscriptions/page.tsx`
- [x] پیاده‌سازی مانیتورینگ مالی دوگانه (ریالی/ارزی) در `frontend/src/app/(admin)/admin/finance/page.tsx`
- [x] پیاده‌سازی کارتابل تسویه رفرال در `frontend/src/app/(admin)/admin/payouts/page.tsx`
- [x] پیاده‌سازی کارتابل تایید شماره شبا و ولت کریپتو در `frontend/src/app/(admin)/admin/bank-accounts/page.tsx`
- [x] پیاده‌سازی پاسخ‌گویی به تیکت‌ها در `frontend/src/app/(admin)/admin/tickets/page.tsx`
- [x] پیاده‌سازی سیستم کدهای تخفیف در `frontend/src/app/(admin)/admin/discounts/page.tsx`

### فاز ۷: اعتبارسنجی نهایی، بیلد و ثبت گزارش تحویل
- [x] بررسی تایپ‌اسکریپت و لینتر فرانت‌اند در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] بررسی بیلد موفق کل پروژه در کانتینر داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npm run build`
- [x] نگارش گزارش جامع فاز اولیه توسعه در پوشه گزارشات: `reports/01.md`
