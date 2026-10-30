# 📋 چک‌لیست اجرایی گام سوم: همگام‌سازی RAWG و کاتالوگ بازی‌ها (03-rawg-sync-and-catalog)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم (Alembic Migration)
- [x] پیاده‌سازی مدل‌های `Genre`, `Game`, `GameInteraction` و `GameDownloadLink` در `backend/app/modules/games/models.py`
- [x] ایجاد فایل مایگریشن Alembic درون داکر: `docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "feat: add games catalog, genres and interactions"`
- [x] اجرای مایگریشن در کانتینر: `docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head` و اعتبارسنجی با `alembic check`

### فاز ۲: کلاینت RAWG و موتور همگام‌سازی داده‌ها (RAWG Sync Engine)
- [x] پیاده‌سازی کلاینت ناهمگام ارتباط با RAWG در `backend/app/modules/rawg_sync/client.py` با کلید `91c0c1c9c30c4796bbff63a7471fdfdd` و کنترل Rate Limit
- [x] پیاده‌سازی لاجیک واکشی اولیه ۵۰۰ بازی محبوب و لیست ژانرها با نگاشت تگ‌های `co-op`/`multiplayer` به عنوان دو نفره و تگ‌های `vr` در `backend/app/modules/rawg_sync/services.py`
- [x] پیاده‌سازی جاب زمان‌بندی‌شده روزانه (Daily Cron Scheduler) با قفل توزیع‌شده ردیس برای واکشی عناوین تازه
- [x] پیاده‌سازی روت‌های تریگر همگام‌سازی در `backend/app/modules/rawg_sync/router.py`

### فاز ۳: پیاده‌سازی لایه سرویس بازی‌ها و کشینگ ردیس (Service & Caching)
- [x] پیاده‌سازی کوئری‌های فیلتر پیشرفته (ژانر، پلتفرم، حجم، امتیاز، حالت ۲ نفره، VR) همراه با کشینگ تهاجمی `drgame:games:catalog:{hash}` (TTL=1800s) در `backend/app/modules/games/services.py`
- [x] پیاده‌سازی کش جزئیات بازی `drgame:game:{id}` (TTL=7200s) و لاجیک ابطال صریح کش
- [x] پیاده‌سازی لاجیک انحصاری و تاگل (Toggle) لایک و دیس‌لایک برای کاربران لاگین‌کرده
- [x] پیاده‌سازی لاجیک ثبت و لغو بازی در لیست علاقه‌مندی‌ها (Wishlist)

### فاز ۴: پیاده‌سازی روترها و شِماهای Pydantic V2 (API Layer)
- [x] تدوین DTOهای ورودی و خروجی در `backend/app/modules/games/schemas.py`
- [x] پیاده‌سازی روت‌های `GET /api/games`, `GET /api/games/{id}`, `POST /api/games/{id}/like`, `POST /api/games/{id}/dislike`, `POST /api/games/{id}/wishlist` و `GET /api/genres` در `backend/app/modules/games/router.py`
- [x] رجیستر روترها در `backend/app/main.py`

### فاز ۵: تست‌نویسی خودکار دو لایه بک‌اند (Pytest Suite - الزام ۱۰۰٪ قبولی)
- [x] نگارش تست‌های واحد سرویس در `backend/tests/test_games_services.py` (تست کش ردیس، محاسبه تاگل آرا و فیلترها)
- [x] نگارش تست‌های ماک سینک داده‌های RAWG در `backend/tests/test_rawg_sync.py`
- [x] نگارش تست‌های یکپارچگی اندپوینت‌ها در `backend/tests/test_games_router.py` (بررسی کدهای 200, 401, 404, 422)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی

### فاز ۶: توسعه فرانت‌اند و اتصال به بک‌اند (Frontend Integration)
- [x] ایجاد فایل تایپ‌های کاتالوگ و بازی‌ها در `frontend/src/types/game.ts`
- [x] پیاده‌سازی کامپوننت کارت مستطیلی ۳ در ۴ در `frontend/src/components/games/GameCard.tsx` با نمایش نشان پلتفرم و حجم
- [x] پیاده‌سازی سایدبار فیلتر چندگانه در `frontend/src/components/games/FilterSidebar.tsx` با آیکون‌های وکتور پلتفرم‌ها (`ps5.svg`, `ps4.svg`, `xbox360.svg`, `switch.svg`) و اسلایدر حجم
- [x] پیاده‌سازی باکس دانلود ۵ تکه در `frontend/src/components/games/DownloadBox.tsx`
- [x] پیاده‌سازی صفحه جامع کاتالوگ در `frontend/src/app/(store)/games/page.tsx` به همراه Live Search و نمایش وضعیت سهمیه
- [x] پیاده‌سازی صفحه سینمایی جزئیات بازی در `frontend/src/app/(store)/games/[id]/page.tsx` با دکمه‌های لایک/دیس‌لایک، گالری و داستان

### فاز ۷: اعتبارسنجی نهایی و اجرای بذر دیتا
- [x] اجرای بذر اولیه ۵۰۰ بازی در داکر و اطمینان از پر شدن دیتابیس لوکال
- [x] بررسی تایپ‌اسکریپت در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] اعتبارسنجی سرعت پاسخ‌دهی کاتالوگ و کشینگ ردیس زیر ۵۰ میلی‌ثانیه (حاصل: ۲.۸ میلی‌ثانیه)
