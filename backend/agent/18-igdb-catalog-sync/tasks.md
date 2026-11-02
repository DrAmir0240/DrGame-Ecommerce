<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام هجدهم: سامانه دریافت کاتالوگ در پنل ادمین (Tasks Checklist)

> **گام:** ۱۸  
> **عنوان:** سامانه جامع دریافت و همگام‌سازی کاتالوگ بازی‌ها در پنل ادمین با فیلترهای پیشرفته، ستون جنریک `source_id`، جدول ردگیری، و پاک‌سازی کاتالوگ  
> **وضعیت کلی:** ۱۰۰٪ تکمیل‌شده و راستی‌آزمایی‌شده (Completed & Verified)  

---

### فاز ۱: پایگاه داده، ستون‌های جنریک و جدول وظایف دریافت (`catalog_sync_jobs`)
- [x] افزودن متغیرهای محیطی احراز هویت IGDB به `.env`, `.env.example`, `.env.prod`, `.env.prod.example`:
  - [x] `IGDB_CLIENT_ID="755p4548dxlbbe5n6xud3fnw3zjwsd"`
  - [x] `IGDB_CLIENT_SECRET="6fddqp62amcta340bymo4gjd4w2io0"`
  - [x] `IGDB_BASE_URL="https://api.igdb.com/v4"`
  - [x] `IGDB_TOKEN_URL="https://id.twitch.tv/oauth2/token"`
- [x] بروزرسانی کلاس `Settings` در `backend/app/core/config.py` جهت بارگذاری متغیرها
- [x] بروزرسانی مدل‌های `backend/app/modules/games/models.py`:
  - [x] افزودن فیلد `source_id: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)` به مدل `Game`
  - [x] تغییر `rawg_id` به حالت اختیاری (`nullable=True`)
  - [x] افزودن فیلد `source_id: Mapped[str | None] = mapped_column(String(50), unique=True, index=True, nullable=True)` به مدل `Genre`
  - [x] تغییر `rawg_id` در `Genre` به حالت اختیاری (`nullable=True`)
- [x] ایجاد مدل `CatalogSyncJob` در `backend/app/modules/games/models.py`:
  - [x] فیلدهای `id`, `status`, `platforms`, `date_from`, `date_to`, `min_rating`, `sort_by`, `requested_count`, `imported_count`, `updated_count`, `error_message`, `created_at`, `completed_at`
- [x] ایجاد فایل مایگریشن Alembic: `alembic revision --autogenerate -m "feat: add generic source_id and catalog_sync_jobs"` (`1a7d779ccafa`)
- [x] اجرای مایگریشن روی پایگاه داده PostgreSQL: `alembic upgrade head`

---

### فاز ۲: اسکریپت و اندپوینت پاک‌سازی کاتالوگ بازی‌ها (Wipe Catalog)
- [x] پیاده‌سازی متد حذف کامل بازی‌ها و رکوردهای وابسته به صورت ایمن در تراکنش دیتابیس:
  - [x] حذف از جدول `game_interactions`
  - [x] حذف از جدول `game_download_links`
  - [x] حذف از جدول `game_download_files`
  - [x] حذف از جدول `user_download_histories`
  - [x] حذف از جدول `games`
  - [x] اینولیدیت کردن تمام کش‌های کاتالوگ در ردیس (`drgame:games:*`)
- [x] ارائه اندپوینت امن مدیریت ادمین: `DELETE /api/admin-content/catalog/wipe` با احراز دسترسی پرسنل ادمین محتوا.

---

### فاز ۳: موتور دریافت کاتالوگ و منطق هوشمند Upsert در بک‌اند
- [x] ایجاد ماژول `backend/app/modules/catalog_sync/`:
  - [x] پیاده‌سازی کلاینت احراز هویت توییچ و کشینگ توکن در ردیس (`drgame:igdb:access_token`) با TTL دقیق ارائه‌شده توسط توییچ
  - [x] کوئری‌ساز پویا با APICalypse بر اساس:
    - [x] فیلتر پلتفرم‌های انتخابی (PS5: 167, PS4: 48, Xbox: 169/49, Switch: 130/508)
    - [x] فیلتر بازه زمانی تاریخ انتشار (`first_release_date >= start & first_release_date <= end`)
    - [x] فیلتر حداقل امتیاز کاربری
    - [x] مرتب‌سازی (جدیدترین، قدیمی‌ترین، بالاترین امتیاز)
    - [x] تعداد بازی‌های درخواستی (`limit`)
  - [x] خط پردازش و ذخیره‌سازی داده‌ها:
    - [x] بررسی وجود بازی با `source_id == str(item['id'])` یا `slug`
    - [x] در صورت وجود -> به‌روزرسانی متادیتا، امتیازها و اسکرین‌شات‌ها (Update)
    - [x] در صورت عدم وجود -> درج رکورد جدید بازی (Insert)
    - [x] **عدم تولید هرگونه پارت دانلودی برای بازی**
  - [x] ذخیره و آپلود تصاویر باکیفیت ۱۰۸۰p در S3 لیارا (`games/{source_id}/cover.jpg`, `games/{source_id}/banner.jpg`, `games/{source_id}/screenshots/{i}.jpg`)
  - [x] ثبت و به‌روزرسانی سابقه در جدول `catalog_sync_jobs` با وضعیت `completed` و تعداد ثبت/آپدیت شده.

---

### فاز ۴: اندپوینت‌های اختصاصی ادمین (`FastAPI Endpoints`)
- [x] پیاده‌سازی روتر `backend/app/modules/catalog_sync/router.py`:
  - [x] `POST /api/admin-content/catalog/sync`: دریافت فیلترها و شروع عملیات دریافت کاتالوگ
  - [x] `GET /api/admin-content/catalog/history`: مشاهده لیست سوابق دریافت‌ها از جدول `catalog_sync_jobs`
  - [x] `DELETE /api/admin-content/catalog/wipe`: پاک‌سازی کامل بازی‌های دیتابیس
- [x] ثبت روتر در `backend/app/main.py`.

---

### فاز ۵: رابط کاربری پنل ادمین محتوا (`Frontend Catalog Ingestion UI`)
- [x] افزودن گزینه «دریافت کاتالوگ» به منوی ناوبری سایدبار محتوا در `frontend/src/app/(admin)/admin/content/layout.tsx` (`/admin/content/catalog-sync`)
- [x] طراحی و پیاده‌سازی صفحه `frontend/src/app/(admin)/admin/content/catalog-sync/page.tsx`:
  - [x] چک‌باکس‌های پلتفرم ۴ گانه (PS5, PS4, Xbox, Nintendo Switch) با تگ‌های رنگی و مدرن
  - [x] فیلد انتخاب بازه تاریخی انتشار (از تاریخ ... تا تاریخ ...) به همراه دکمه‌های پرکاربرد (سال ۲۰۲۴، ۲۰۲۳، بازه ۲۰۲۳ تا ۲۰۲۴)
  - [x] اسلایدر و ورودی حداقل امتیاز (۰ تا ۵ ستاره)
  - [x] سلکتور مرتب‌سازی (جدیدترین به قدیمی‌ترین، قدیمی‌ترین به جدیدترین، بیشترین امتیاز)
  - [x] فیلد تعداد بازی‌های مورد نیاز (پیش‌فرض ۱۰ با گزینه‌های سریع ۵، ۱۰، ۲۵، ۵۰)
  - [x] دکمه اجرای دریافت کاتالوگ با انیمیشن لودینگ و پروگرس بار
  - [x] دکمه هشدار پاک‌سازی کاتالوگ فعلی دیتابیس با مودال تایید قطعی (Modal Confirmation)
  - [x] کارت نمایش نتایج زنده بازی‌های دریافت/آپدیت‌شده (با کاور ۱۰۸۰p، تگ پلتفرم، امتیاز و وضعیت جدید/آپدیت)
  - [x] جدول سوابق و تاریخچه عملیات‌های دریافت کاتالوگ با وضعیت و زمان اجرا.

---

### فاز ۶: تست و راستی‌آزمایی جامع (Testing & Verification)
- [x] پاک‌سازی موفق کاتالوگ ۳۰۰ بازی تستی قبلی دیتابیس (تایید شد: ۰ بازی باقیمانده)
- [x] اجرای تست دریافت ۵ بازی بازه ۲۰۲۳ تا ۲۰۲۴ (تایید شد: ۵ بازی با موفقیت وارد شدند)
- [x] تایید سلامت تصاویر آپلودشده در لیارا S3 و عدم ایجاد پارت دانلود
- [x] اجرای مجدد جهت تایید عملکرد منطق Upsert (شناسایی بازی‌های موجود و به‌روزرسانی آن‌ها: Imported: 0, Updated: 5)
- [x] اجرای تست‌های بک‌اند (`pytest`): ۷۰ تست از ۷۰ تست با موفقیت پاس شدند
- [x] بیلد موفقیت‌آمیز فرانت‌اند (`npm run build`): ۵۶ صفحه استاتیک با ۰ خطا کامپایل شدند
- [x] تدوین گزارش داوری نهایی گام هجدهم (`judge.md`).

</div>