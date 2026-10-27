# 📋 چک‌لیست اجرایی گام هفتم: ابزارهای گیمینگ و سیستم وبلاگ (07-tools-and-blog)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم (Alembic Migration)
- [x] پیاده‌سازی مدل‌های `BlogCategory`, `BlogPost`, `BlogInteraction` در `backend/app/modules/news/models.py`
- [x] ایجاد فایل مایگریشن Alembic درون داکر: `docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "feat: add blog posts, categories and interactions"`
- [x] اجرای مایگریشن در کانتینر: `docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head` و اعتبارسنجی با `alembic check`
- [x] بذر اولیه (Seed) دسته‌بندی‌های وبلاگ (آموزش، اخبار، نقد و بررسی)

### فاز ۲: پیاده‌سازی لایه سرویس وبلاگ و کشینگ (Service Layer)
- [x] پیاده‌سازی کوئری‌های واکشی مقالات با فیلتر دسته‌بندی، سورت جدیدترین/داغ‌ترین و سرچ در `backend/app/modules/news/services.py`
- [x] پیاده‌سازی کش ردیس برای مقالات و ابطال صریح آن با رای‌گیری
- [x] پیاده‌سازی منطق تاگل لایک سبز و دیس‌لایک قرمز برای کاربران لاگین‌کرده
- [x] افزایش خودکار شمارنده بازدید مقالات (`views_count`)

### فاز ۳: پیاده‌سازی روترها و شِماهای Pydantic V2 (API Layer)
- [x] تدوین DTOهای ورودی و خروجی در `backend/app/modules/news/schemas.py`
- [x] پیاده‌سازی روت‌های `GET /api/blog/posts`, `GET /api/blog/posts/{id}`, `POST /api/blog/posts/{id}/like`, `POST /api/blog/posts/{id}/dislike`, `GET /api/blog/categories` در `backend/app/modules/news/router.py`
- [x] رجیستر روتر `news` در `backend/app/main.py`

### فاز ۴: تست‌نویسی خودکار دو لایه بک‌اند (Pytest Suite - الزام ۱۰۰٪ قبولی)
- [x] نگارش تست‌های واحد سرویس در `backend/app/modules/news/tests/test_services.py` (فیلترها، کش ردیس و تاگل آرا)
- [x] نگارش تست‌های یکپارچگی روت‌های وبلاگ در `backend/app/modules/news/tests/test_router.py` (پوشش کدهای 200, 401, 404, 422)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی

### فاز ۵: توسعه ابزارهای گیمینگ در فرانت‌اند (Gaming Tools)
- [x] پیاده‌سازی کامپوننت مدرن تست دسته در `frontend/src/components/tools/GamepadVisualizer.tsx` بر پایه سورس `source/gamapad-test/` با نمایش درصد تریگرها، دریفت استیک‌ها و تست ویبره
- [x] طراحی و پیاده‌سازی صفحه هاب ابزارها در `frontend/src/app/(store)/tools/page.tsx`
- [x] طراحی و پیاده‌سازی صفحه اختصاصی تست دسته در `frontend/src/app/(store)/tools/gamepad/page.tsx`
- [x] طراحی و پیاده‌سازی صفحه آموزش و اکشن جیلبریک کنسول در `frontend/src/app/(store)/tools/jailbreak/page.tsx`

### فاز ۶: توسعه صفحات وبلاگ در فرانت‌اند (Blog Integration)
- [x] ایجاد فایل تایپ‌های مقالات در `frontend/src/types/blog.ts`
- [x] پیاده‌سازی کارت مقاله با نسبت ۵ در ۶ در `frontend/src/components/blog/BlogCard.tsx`
- [x] پیاده‌سازی سایدبار فیلتر وبلاگ در `frontend/src/components/blog/BlogFilterSidebar.tsx`
- [x] طراحی و پیاده‌سازی صفحه کاتالوگ مقالات در `frontend/src/app/(store)/blog/page.tsx`
- [x] طراحی و پیاده‌سازی صفحه مطالعه کامل مقاله در `frontend/src/app/(store)/blog/[id]/page.tsx` با دکمه‌های لایک/دیس‌لایک
- [x] اتصال سکشن آموزشی صفحه اصلی (`TutorialBlogsSection.tsx`) به API مقالات

### فاز ۷: اعتبارسنجی نهایی و بیلد
- [x] بررسی تایپ‌اسکریپت و لینتر فرانت‌اند در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] تست اتصال فیزیکی یا شبیه‌سازی دسته پلی‌استیشن و تایید عملکرد بصری تست کلیدها و ویبره
