<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیست و چهارم: رفع خطاهای ۵۰۰ پنل‌های ادمین و اصلاح اعتبارسنجی اولویت تیکت‌ها (Tasks Checklist)

> **گام:** ۲۴  
> **عنوان:** ریشه‌یابی تخصصی و رفع کلیه خطاهای ۵۰۰ در پنل‌های ادمین (محتوا، مالی، پشتیبانی) و رفع خطای ۴۲۲ ثبت تیکت‌های پشتیبانی.  
> **فایل مرجع:** `500errors.md`  
> **وضعیت کلی:** ✅ تکمیل شد (Completed)  

---

### فاز ۱: اصلاح اعتبارسنجی اولویت تیکت‌ها در پنل کاربری (رفع خطای ۴۲۲)
- [x] بازبینی و به‌روزرسانی اسکیماهای ماژول تیکت (`backend/app/modules/tickets/schemas.py`):
  - [x] اصلاح الگوی رجکس فیلد `priority` در `TicketCreate` به `^(normal|urgent|low|medium|high)$`.
  - [x] اصلاح مسیر اندپوینت‌های تیکت برای پذیرش هر دو مسیر `/tickets` و `/tickets/me`.
- [x] به‌روزرسانی لایه سرویس تیکت‌ها (`backend/app/modules/tickets/services.py`):
  - [x] تضمین ذخیره‌سازی صحیح اولویت‌های فرانت‌اند (`low`, `medium`, `high`) در جدول `tickets`.
- [x] اجرای تست‌های واحد تیکت (`test_tickets.py`) و تایید پاس شدن ۱۰۰٪ با اولویت‌های جدید.

---

### فاز ۲: رفع خطاهای ۵۰۰ در پنل مدیریت محتوا و بازی‌ها (`/admin/content/`)
- [x] اصلاح اندپوینت‌های ژانرها در `backend/app/modules/admin/routers/content_router.py`:
  - [x] جایگزینی فراخوانی ناموجود `GameService.get_genres` با `GamesService.list_all_genres(db)`.
  - [x] جایگزینی فراخوانی ناموجود `GameService.create_genre` با `GamesService.admin_create_genre(db, payload.model_dump())`.
  - [x] پیاده‌سازی اندپوینت `PUT /genres/{genre_id}` متصل به `GamesService.admin_update_genre`.
  - [x] پیاده‌سازی اندپوینت `DELETE /genres/{genre_id}` متصل به `GamesService.admin_delete_genre`.
  - [x] ایجاد آلیاس سازگاری معکوس `GameService = GamesService` در سرویس بازی‌ها.
- [x] اصلاح اندپوینت‌های بنرهای هیرو اسلایدر در `backend/app/modules/admin/routers/content_router.py`:
  - [x] حذف کوئری خام `HomeBanner.order_priority.asc()` که منجر به `AttributeError` می‌شد.
  - [x] اتصال اندپوینت `GET /banners` به متد استاندارد `HomeBannerService.admin_list_banners(db)`.
  - [x] ارتقای متد `HomeBannerService.admin_create_banner` جهت پشتیبانی از نام‌های چندگانه فیلدها و مقداردهی امن به فیلد اجباری `description`.
  - [x] اتصال اندپوینت `DELETE /banners/{banner_id}` به متد `HomeBannerService.admin_delete_banner(db, banner_id)`.

---

### فاز ۳: رفع خطاهای ۵۰۰ در پنل مدیریت مالی و اشتراک (`/admin/finance/`)
- [x] اصلاح ایمپورت و کوئری تراکنش‌ها در `backend/app/modules/admin/routers/finance_router.py`:
  - [x] تصحیح آدرس ایمپورت `OrderPayment` از `app.modules.subscriptions.models` (حذف ارجاع اشتباه به `wallet.models`).
  - [x] افزودن پشتیبانی از پارامتر کوئری `limit` در کنار `page_size` برای سازگاری کامل با فراخوانی `?page=1&limit=50` در فرانت‌اند.
- [x] اصلاح ناهمخوانی اسامی متدهای کدهای تخفیف در `finance_router.py`:
  - [x] تصحیح `AdminService.list_discounts` به `AdminService.list_discount_codes(db)`.
  - [x] تصحیح `AdminService.create_discount` به `AdminService.create_discount_code(db, payload.model_dump())`.
  - [x] تصحیح `AdminService.update_discount` به `AdminService.update_discount_code(db, discount_id, payload.model_dump(exclude_unset=True))`.
  - [x] تصحیح `AdminService.delete_discount` به `AdminService.delete_discount_code(db, discount_id)`.
  - [x] منعطف‌سازی ورودی `data` در متد `update_discount_code` جهت پذیرش هر دو نوع دیکشنری و مدل پایدانتیک.

---

### فاز ۴: رفع خطاهای ۵۰۰ در پنل پشتیبانی و کاربران (`/admin/support/`)
- [x] اصلاح امضا و منطق متد `list_users` در `backend/app/modules/admin/services.py`:
  - [x] هماهنگ‌سازی ترتیب پارامترها به `(db, page=1, page_size=20, search=None, is_active=None)`.
  - [x] پیاده‌سازی فیلتر شرطی `is_active` بر روی کوئری اصلی و کوئری شمارش کل کاربران.
- [x] اصلاح کنترلر کاربران در `backend/app/modules/admin/routers/support_router.py`:
  - [x] پاس دادن پارامترهای نام‌دار (`db=db, page=page, page_size=effective_limit, search=search, is_active=is_active`) جهت جلوگیری از `TypeError`.
  - [x] پشتیبانی از پارامتر `limit` فرانت‌اند در کنار `page_size`.
- [x] رفع خطای تنظیم سهمیه و تغییر وضعیت در پنل پشتیبانی:
  - [x] تزریق کلاینت ردیس (`get_redis`) به اندپوینت `adjust-quota` در `support_router.py` و پاس دادن صحیح آرگومان‌ها به `AdminService.adjust_user_quota`.
  - [x] پشتیبانی از متد `PUT` در کنار `POST` و پذیرش فیلد `additional_gb` در `AdjustQuotaRequest`.
  - [x] پیاده‌سازی متد `AdminService.update_user_status(db, user_id, is_active)` در `backend/app/modules/admin/services.py` جهت فعال یا مسدودسازی کاربران بدون کرش سرور.

---

### فاز ۵: تست، اعتبارسنجی نهایی و تطبیق با `500errors.md`
- [x] نگارش تست‌های خودکار جامع (`backend/tests/test_step24_admin_500_fixes.py`):
  - [x] تست صدور تیکت با اولویت‌های مختلف (`low`, `medium`, `high`, `normal`, `urgent`).
  - [x] تست فراخوانی اندپوینت‌های محتوا: `/admin-content/genres` و `/admin-content/banners`.
  - [x] تست فراخوانی اندپوینت‌های مالی: `/admin-finance/transactions` و `/admin-finance/discounts`.
  - [x] تست فراخوانی اندپوینت‌های پشتیبانی: `/admin-support/users` و تنظیم سهمیه و وضعیت کاربر.
- [x] اجرای کامل پای‌تست در بک‌اند (`pytest -q` با ۱۰۷ تست موفق از ۱۰۷ تست).
- [x] اجرای اعتبارسنجی بیلد فرانت‌اند (`tsc --noEmit` با ۰ خطا).

</div>
