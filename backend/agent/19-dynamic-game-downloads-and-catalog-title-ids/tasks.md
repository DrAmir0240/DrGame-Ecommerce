<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام نوزدهم: سامانه داینامیک لینک‌های دانلود، استخراج Title ID، تفکیک فریمور و اتصال به استوریج (Tasks Checklist)

> **گام:** ۱۹  
> **عنوان:** سامانه جامع داینامیک لینک‌های دانلود بازی‌ها، استخراج خودکار شناسه‌های کنسولی (PS5 PPSA و PS4 CUSA) در کاتالوگ، تفکیک هوشمند پلتفرم و فریمور (FPKG ۱۱.۴۰ به قبل در برابر FAT32 فریمور بالاتر)، انتخاب صریح در دسکتاپ/موبایل و اتصال به سرور استوریج و Download32  
> **وضعیت کلی:** ✅ تکمیل‌شده و ۱۰۰٪ آزموده‌شده (Completed & Fully Verified)  

---

### فاز ۱: طرح‌بندی پایگاه داده و مهاجرت‌ها (Database Schema & Migrations)
- [x] افزودن ستون‌های شناسه‌های کنسولی و متادیتای فرمت به مدل `Game` در `backend/app/modules/games/models.py`:
  - [x] `ps5_title_id: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)`
  - [x] `ps4_title_id: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)`
  - [x] `storage_sync_status: Mapped[str] = mapped_column(String(20), default="unknown", index=True)`
  - [x] `available_formats: Mapped[list] = mapped_column(JSON, default=list)` (شامل لیست فایل‌های آماده: FPKG و FAT32)
  - [x] `file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)`
  - [x] `sha256_checksum: Mapped[str | None] = mapped_column(String(64), nullable=True)`
- [x] ثبت فیلدها در مدل و ادمین پنل جنگو (`admin-panel/apps/drgame_catalog/models.py` و `admin.py`) جهت فراهم‌سازی قابلیت بازنویسی دستی (Admin Override)
- [x] تولید فایل مهاجرت Alembic برای اعمال تغییرات در پایگاه داده PostgreSQL:
  - [x] اجرای دستور `alembic revision --autogenerate -m "feat: add playstation title ids and firmware format metadata to games"`
  - [x] بازبینی کدهای تولیدشده در فایل مایگریشن جهت اطمینان از صحت انواع داده، ایندکس‌ها و `server_default`
  - [x] اجرای دستور `alembic upgrade head` (ورژن `1d3ee944b2f0`) و اعتبارسنجی ساختار جدول `games`.

---

### فاز ۲: خط لوله استخراج و انطباق آفلاین‌محور Title ID در سرویس کاتالوگ (`Catalog Sync Pipeline`)
- [x] ایجاد دیتابیس داده‌های آفلاین محلی در `backend/app/data/playstation_title_ids.json`:
  - [x] گردآوری و ثبت شناسه‌های رسمی PPSA و CUSA عناوین شاخص پلی‌استیشن (Spider-Man, God of War, TLOU, Batman, Elden Ring, GTA V, ...)
  - [x] ساختاردهی استاندارد بر اساس `slug`، `title_en`، `ps5_title_id` و `ps4_title_id`
  - [x] تضمین عدم وابستگی به اینترنت بین‌الملل و تداوم کارکرد در شبکه ملی
- [x] توسعه ماژول حل و استخراج شناسه‌های کنسولی در `backend/app/modules/catalog_sync/title_resolver.py`:
  - [x] تابع `resolve_playstation_title_ids(game_title: str, slug: str | None = None, storage_tag: str | None = None) -> tuple[str | None, str | None]`
  - [x] لایه ۱: استخراج و اعتبارسنجی تگ‌های مستقیم سرور استوریج (`content_tag` و الگوهای نام فایل)
  - [x] لایه ۲: انطباق با دیتابیس لوکال آفلاین `playstation_title_ids.json` بر اساس اسلاگ و عنوان نرمال‌شده
  - [x] پیاده‌سازی عبارات باقاعده دقیق برای اعتبارسنجی کدهای `PPSA\d{5}` و `CUSA\d{5}`
  - [x] لایه ۳: پشتیبانی از فیلدهای قابل ویرایش در ادمین پنل جنگو (Zero-Trust Admin Override)
- [x] ادغام استخراج Title ID در `CatalogSyncService` (`backend/app/modules/catalog_sync/services.py`):
  - [x] فراخوانی متد `resolve_playstation_title_ids` همزمان با همگام‌سازی کاتالوگ
  - [x] مقداردهی و ذخیره خودکار `ps5_title_id` و `ps4_title_id` در هنگام درج (Insert) یا به‌روزرسانی (Update) بازی‌ها
  - [x] بک‌فیل خودکار شناسه‌ها در هنگام واکشی جزئیات بازی (`get_game_details`)
  - [x] درج فیلدهای `ps5_title_id` و `ps4_title_id` در اسکیمای Pydantic خروجی `CatalogGameItem`.

---

### فاز ۳: سرویس پل ارتباطی سرور استوریج و موتور تفکیک فرمت (`StorageBridgeService`)
- [x] ایجاد ماژول `backend/app/modules/games/storage_bridge.py`:
  - [x] کلاس `StorageBridgeService` جهت تعامل با سرور استوریج (`https://dltest.gamedr.ir`)
  - [x] متد استعلام لیست فایل‌های آماده از سرور استوریج (`GET /api/account/jobs`) با مکانیزم کش در ردیس
  - [x] الگوریتم طبقه‌بندی فایل‌ها بر اساس فرمت و فریمور:
    - [x] شناسایی فایل‌های FPKG (ویژه فریمور ۱۱.۴۰ به قبل: `download_format == "fpkg"` یا `.pkg`)
    - [x] شناسایی فایل‌های FAT32 (ویژه فریمور بالاتر: `content_format == "fat32"` یا `download_format == "zip"`)
  - [x] متد انطباق هوشمند فایل‌های استوریج با رکوردهای کاتالوگ بر اساس `tag` / `content_tag`
  - [x] به‌روزرسانی فیلدهای `storage_sync_status`، `available_formats`، `file_size_bytes` و `sha256_checksum` در دیتابیس
- [x] اتصال DPoP Service به ساختار dynamic jobs و متادیتای بازی‌ها در `backend/app/modules/dpop/services.py`.

---

### فاز ۴: اندپوینت‌های API و تفکیک بر پایه User-Agent و فریمور
- [x] پیاده‌سازی متد تشخیص کلاینت و نسخه فریمور در `backend/app/modules/games/storage_bridge.py` و تزریق وابستگی در `backend/app/core/dependencies.py`:
  - [x] پارس نسخه فریمور کنسول PS5 از روی User-Agent (`PlayStation 5/XX.XX`)
  - [x] تعیین فرمت پیشنهادی خودکار: FPKG برای فریمور `<= 11.40` و FAT32 برای فریمور `> 11.40`
  - [x] تشخیص مرورگرهای کنسول PS4 (`PlayStation 4`)
  - [x] تشخیص سایر کلاینت‌ها (دسکتاپ، موبایل) جهت فعال‌سازی انتخاب دستی
- [x] پیاده‌سازی اسکیمای Pydantic DTO در `backend/app/modules/games/schemas.py`:
  - [x] `GameDownloadOptionsOut` و `StorageFormatItemOut` و `ClientDeviceOut`
  - [x] `HandoffExecuteRequest` و `HandoffExecuteResponse`
- [x] پیاده‌سازی اندپوینت‌های جدید در `backend/app/modules/games/router.py`:
  - [x] `GET /api/games/{game_id}/download-options`: بازگرداندن وضعیت فایل‌های موجود، شناسه‌های `ps5_title_id` و `ps4_title_id`، لیست فرمت‌های آماده (FPKG / FAT32) به همراه حجم و فرمت پیشنهادی بر اساس هدر User-Agent کلاینت
  - [x] `POST /api/games/{game_id}/handoff`: اعتبارسنجی انتخاب کاربر، ارزیابی اشتراک، کسر اتمیک حجم واقعی از سهمیه (`UserQuota` و `QuotaConsumptionLog`)، ثبت لاگ در تاریخچه دانلود، و اتصال به اندپوینت هندوآف DPoP
  - [x] `POST /api/games/sync-storage`: اندپوینت مدیریتی همگام‌سازی استوریج با کاتالوگ.

---

### فاز ۵: آزمون‌ها، اعتبارسنجی عملیاتی و پایداری (Testing & Verification)
- [x] نگارش آزمون‌های واحد در `backend/tests/test_title_resolver.py` (۶ تست با قبولی ۱۰۰٪):
  - [x] نرمال‌سازی اسلاگ و کاراکترهای خاص و یونیکد
  - [x] اعتبارسنجی فرمت کدهای PPSA و CUSA
  - [x] بارگذاری دیتابیس لوکال آفلاین
  - [x] استخراج بر اساس اسلاگ و عنوان
  - [x] استخراج بر اساس تگ استوریج
- [x] نگارش آزمون‌های واحد و یکپارچگی در `backend/tests/test_storage_bridge.py` (۱۰ تست با قبولی ۱۰۰٪):
  - [x] تست پارس فریمورهای مختلف PS5 و PS4 از هدر User-Agent
  - [x] تست طبقه‌بندی فرمت FPKG در برابر FAT32
  - [x] تست اندپوینت `GET /api/games/{id}/download-options`
  - [x] تست تطبیق و همگام‌سازی جاب‌های استوریج
  - [x] تست تراکنش کامل هندوآف داینامیک، کسر سهمیه اتمیک و تایید نشست سخت‌افزاری کنسول
- [x] اجرای کامل تست سوئیت پروژه در داکر: قبولی ۱۰۰٪ (۹۳ تست از ۹۳ تست).
- [x] تنظیم و انتشار سند گزارش گام در `backend/reports/09.md`.

</div>