<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام نوزدهم: سامانه داینامیک لینک‌های دانلود، استخراج Title ID، تفکیک فریمور و اتصال به استوریج (Tasks Checklist)

> **گام:** ۱۹  
> **عنوان:** سامانه جامع داینامیک لینک‌های دانلود بازی‌ها، استخراج خودکار شناسه‌های کنسولی (PS5 PPSA و PS4 CUSA) در کاتالوگ، تفکیک هوشمند پلتفرم و فریمور (FPKG ۱۱.۴۰ به قبل در برابر FAT32 فریمور بالاتر)، انتخاب صریح در دسکتاپ/موبایل و اتصال به سرور استوریج و Download32  
> **وضعیت کلی:** 📝 در فاز برنامه‌ریزی و طراحی معماری (Planning Phase)  

---

### فاز ۱: طرح‌بندی پایگاه داده و مهاجرت‌ها (Database Schema & Migrations)
- [ ] افزودن ستون‌های شناسه‌های کنسولی و متادیتای فرمت به مدل `Game` در `backend/app/modules/games/models.py`:
  - [ ] `ps5_title_id: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)`
  - [ ] `ps4_title_id: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)`
  - [ ] `storage_sync_status: Mapped[str] = mapped_column(String(20), default="unknown", index=True)`
  - [ ] `available_formats: Mapped[list] = mapped_column(JSON, default=list)` (شامل لیست فایل‌های آماده: FPKG و FAT32)
  - [ ] `file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)`
  - [ ] `sha256_checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)`
- [ ] تولید فایل مهاجرت Alembic برای اعمال تغییرات در پایگاه داده PostgreSQL:
  - [ ] اجرای دستور `alembic revision --autogenerate -m "feat: add playstation title ids and firmware format metadata to games"`
  - [ ] بازبینی کدهای تولیدشده در فایل مایگریشن جهت اطمینان از صحت انواع داده و ایندکس‌ها
  - [ ] اجرای دستور `alembic upgrade head` و اعتبارسنجی ساختار جدول `games`.

---

### فاز ۲: خط لوله استخراج Title ID در سرویس کاتالوگ (`Catalog Sync Pipeline`)
- [ ] توسعه ماژول حل و استخراج شناسه‌های کنسولی در `backend/app/modules/catalog_sync/title_resolver.py`:
  - [ ] تابع `resolve_playstation_title_ids(game_title: str) -> tuple[str | None, str | None]`
  - [ ] استعلام زنده وب‌سرویس رسمی سونی استور (`store.playstation.com/.../tumbler/...`)
  - [ ] پیاده‌سازی عبارات باقاعده (Regex) دقیق برای استخراج کدهای `PPSA\d{5}` و `CUSA\d{5}`
  - [ ] مدیریت خطا، تایم‌اوت و فال‌بک امن در صورت عدم پاسخگویی وب‌سرویس خارجی
- [ ] ادغام استخراج Title ID در `CatalogSyncService` (`backend/app/modules/catalog_sync/services.py`):
  - [ ] فراخوانی متد `resolve_playstation_title_ids` همزمان با دانلود موازی تصاویر بازی
  - [ ] مقداردهی و ذخیره خودکار `ps5_title_id` و `ps4_title_id` در هنگام درج (Insert) یا به‌روزرسانی (Update) بازی‌ها
  - [ ] درج فیلدهای `ps5_title_id` و `ps4_title_id` در اسکیمای Pydantic خروجی `CatalogGameItem`.

---

### فاز ۳: سرویس پل ارتباطی سرور استوریج و موتور تفکیک فرمت (`StorageBridgeService`)
- [ ] ایجاد ماژول `backend/app/modules/games/storage_bridge.py`:
  - [ ] کلاس `StorageBridgeService` جهت تعامل با سرور استوریج (`https://dltest.gamedr.ir`)
  - [ ] متد احراز هویت و ذخیره سشن سیستمی در ردیس (`drgame:tgstorage:session`)
  - [ ] متد استعلام لیست فایل‌های آماده از سرور استوریج (`GET /api/account/jobs`)
  - [ ] الگوریتم طبقه‌بندی فایل‌ها بر اساس فرمت و فریمور:
    - [ ] شناسایی فایل‌های FPKG (ویژه فریمور ۱۱.۴۰ به قبل: `download_format == "fpkg"` یا `.pkg`)
    - [ ] شناسایی فایل‌های FAT32 (ویژه فریمور بالاتر: `content_format == "fat32"` یا `download_format == "zip"`)
  - [ ] متد انطباق هوشمند فایل‌های استوریج با رکوردهای کاتالوگ بر اساس `tag` / `content_tag`
  - [ ] به‌روزرسانی فیلدهای `storage_sync_status`، `available_formats`، `file_size_bytes` و `sha256_checksum` در دیتابیس
- [ ] متد صدور Handoff به سرور استوریج با `job_id` دقیق فایل انتخاب‌شده:
  - [ ] فراخوانی `POST https://dltest.gamedr.ir/api/account/dpop/handoff` با secret کنسول و job_id فایل FPKG یا FAT32.

---

### فاز ۴: اندپوینت‌های API و تفکیک بر پایه User-Agent و فریمور
- [ ] پیاده‌سازی متد تشخیص کلاینت و نسخه فریمور در وابستگی‌های بک‌اند (`backend/app/core/dependencies.py`):
  - [ ] پارس نسخه فریمور کنسول PS5 از روی User-Agent (`PlayStation 5/XX.XX`)
  - [ ] تعیین فرمت پیشنهادی خودکار: FPKG برای فریمور `<= 11.40` و FAT32 برای فریمور `> 11.40`
  - [ ] تشخیص مرورگرهای کنسول PS4 (`PlayStation 4`)
  - [ ] تشخیص سایر کلاینت‌ها (دسکتاپ، موبایل) جهت فعال‌سازی انتخاب دستی
- [ ] بازنویسی اندپوینت‌های دانلود در `backend/app/modules/games/router.py`:
  - [ ] `GET /api/games/{game_id}/download-options`: بازگرداندن وضعیت فایل‌های موجود، شناسه‌های `ps5_title_id` و `ps4_title_id`، لیست فرمت‌های آماده (FPKG / FAT32) به همراه حجم و فرمت پیشنهادی بر اساس هدر User-Agent کلاینت
  - [ ] `POST /api/games/{game_id}/handoff`: اعتبارسنجی انتخاب کاربر (نسخه پلتفرم و فرمت فریمور)، ارزیابی اشتراک، کسر اتمیک حجم واقعی از سهمیه، ثبت لاگ در تاریخچه دانلود، و اتصال به اندپوینت `/api/account/dpop/handoff` سرور استوریج
- [ ] حذف کامل ارجاع به جدول تستی دستی `game_download_links`.

---

### فاز ۵: بازنویسی رابط کاربری و مودال انتخاب پلتفرم/فریمور (`Frontend UI`)
- [ ] به‌روزرسانی تایپ‌های بازی در `frontend/src/types/game.ts`:
  - [ ] افزودن فیلدهای `ps5_title_id?: string` و `ps4_title_id?: string`
  - [ ] تعریف تایپ‌های فرمت فریمور: `'fpkg' | 'fat32'` و لیست `available_formats`
- [ ] بازنویسی کامپوننت `DownloadBox.tsx` (`frontend/src/components/games/DownloadBox.tsx`):
  - [ ] حذف جدول تستی پارت‌های استاتیک محلی
  - [ ] نمایش بج‌های رسمی کنسولی: `PS5: PPSAxxxxx` و `PS4: CUSAxxxxx`
  - [ ] نمایش برچسب‌های شفاف سازگاری فریمور (مثال: «نسخه FPKG فریمور ۱۱.۴۰» و «نسخه FAT32 فریمورهای بالاتر»)
  - [ ] نمایش حجم دقیق و واقعی هر فرمت بر اساس گزارش استوریج
- [ ] بازنویسی کامپوننت `DownloadConfirmModal.tsx`:
  - [ ] **برای کنسول PS5:** نمایش وضعیت تشخیص خودکار (مثال: «کنسول PS5 با فریمور 9.00 شناسایی شد؛ نسخه FPKG به کنسول ارسال می‌شود»)
  - [ ] **برای دسکتاپ و موبایل:** طراحی مودال تعاملی دو مرحله‌ای:
    - [ ] انتخاب پلتفرم (پلی‌استیشن ۵ در برابر پلی‌استیشن ۴)
    - [ ] انتخاب فریمور مقصد: FPKG (فریمور ۱۱.۴۰ و قبل‌تر) در برابر FAT32 (فریمورهای بالاتر)
  - [ ] ارسال شناسه `job_id` دقیق متناظر با انتخاب کاربر به اندپوینت Handoff
  - [ ] نمایش زنده هشدار عدم بازگشت سهمیه و محاسبه حجم باقیمانده حساب.

---

### فاز ۶: آزمون‌ها، اعتبارسنجی عملیاتی و پایداری (Testing & Verification)
- [ ] نگارش آزمون‌های واحد در `backend/tests/test_storage_bridge.py`:
  - [ ] تست پارس صحیح فریمورهای مختلف از رشته‌های نمونه User-Agent سونی
  - [ ] تست تطبیق فایل‌های FPKG و FAT32 سرور استوریج با رکوردهای کاتالوگ
  - [ ] تست سناریوی انتخاب دستی فرمت توسط کلاینت دسکتاپ
  - [ ] تست کسر اتمیک سهمیه بر اساس بایت‌های واقعی هر فرمت
- [ ] اجرای تست دریافت کاتالوگ با سرویس ارتقایافته و تایید ذخیره خودکار کدهای PPSA و CUSA در دیتابیس
- [ ] اجرای تست بیلد و ارزیابی تایپ‌اسکریپت فرانت‌اند (`npm run build`)
- [ ] ثبت گزارش نهایی و اعلام آمادگی جهت اجرای فازهای کدنویسی.

</div>
