<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیست و چهارم: رفع خطاهای ۵۰۰ پنل‌های ادمین و اصلاح اعتبارسنجی اولویت تیکت‌ها (Tasks Checklist)

> **گام:** ۲۴  
> **عنوان:** ریشه‌یابی تخصصی و رفع کلیه خطاهای ۵۰۰ در پنل‌های ادمین (محتوا، مالی، پشتیبانی) و رفع خطای ۴۲۲ ثبت تیکت‌های پشتیبانی.  
> **فایل مرجع:** `500errors.md`  
> **وضعیت کلی:** ⏳ در انتظار اجرا (Pending Implementation)  

---

### فاز ۱: اصلاح اعتبارسنجی اولویت تیکت‌ها در پنل کاربری (رفع خطای ۴۲۲)
- [ ] بازبینی و به‌روزرسانی اسکیماهای ماژول تیکت (`backend/app/modules/tickets/schemas.py`):
  - [ ] اصلاح الگوی رجکس فیلد `priority` در `TicketCreate` به `^(normal|urgent|low|medium|high)$`.
  - [ ] اصلاح الگوی فیلد `priority` در صورت وجود در اسکیماهای آپدیت یا پاسخ.
- [ ] به‌روزرسانی لایه سرویس تیکت‌ها (`backend/app/modules/tickets/services.py`):
  - [ ] تضمین ذخیره‌سازی صحیح اولویت‌های فرانت‌اند (`low`, `medium`, `high`) در جدول `tickets`.
- [ ] اجرای تست‌های واحد تیکت (`test_tickets.py`) و تایید پاس شدن ۱۰۰٪ با اولویت‌های جدید.

---

### فاز ۲: رفع خطاهای ۵۰۰ در پنل مدیریت محتوا و بازی‌ها (`/admin/content/`)
- [ ] اصلاح اندپوینت‌های ژانرها در `backend/app/modules/admin/routers/content_router.py`:
  - [ ] جایگزینی فراخوانی ناموجود `GameService.get_genres` با `GameService.list_all_genres(db)`.
  - [ ] جایگزینی فراخوانی ناموجود `GameService.create_genre` با `GameService.admin_create_genre(db, payload.model_dump())`.
  - [ ] پیاده‌سازی اندپوینت `PUT /genres/{genre_id}` متصل به `GameService.admin_update_genre`.
  - [ ] پیاده‌سازی اندپوینت `DELETE /genres/{genre_id}` متصل به `GameService.admin_delete_genre`.
- [ ] اصلاح اندپوینت‌های بنرهای هیرو اسلایدر در `backend/app/modules/admin/routers/content_router.py`:
  - [ ] حذف کوئری خام `HomeBanner.order_priority.asc()` که منجر به `AttributeError` می‌شد.
  - [ ] اتصال اندپوینت `GET /banners` به متد استاندارد `HomeBannerService.admin_list_banners(db)`.
  - [ ] اتصال اندپوینت `POST /banners` به متد `HomeBannerService.admin_create_banner(db, payload)` با مقداردهی امن به فیلد الزامی `description`.
  - [ ] اتصال اندپوینت `DELETE /banners/{banner_id}` به متد `HomeBannerService.admin_delete_banner(db, banner_id)`.

---

### فاز ۳: رفع خطاهای ۵۰۰ در پنل مدیریت مالی و اشتراک (`/admin/finance/`)
- [ ] اصلاح ایمپورت و کوئری تراکنش‌ها در `backend/app/modules/admin/routers/finance_router.py`:
  - [ ] تصحیح آدرس ایمپورت `OrderPayment` از `app.modules.subscriptions.models` (حذف ارجاع اشتباه به `wallet.models`).
  - [ ] افزودن پشتیبانی از پارامتر کوئری `limit` در کنار `page_size` برای سازگاری کامل با فراخوانی `?page=1&limit=50` در فرانت‌اند.
- [ ] اصلاح ناهمخوانی اسامی متدهای کدهای تخفیف در `finance_router.py`:
  - [ ] تصحیح `AdminService.list_discounts` به `AdminService.list_discount_codes(db)`.
  - [ ] تصحیح `AdminService.create_discount` به `AdminService.create_discount_code(db, payload.model_dump())`.
  - [ ] تصحیح `AdminService.update_discount` به `AdminService.update_discount_code(db, discount_id, payload.model_dump(exclude_unset=True))`.
  - [ ] تصحیح `AdminService.delete_discount` به `AdminService.delete_discount_code(db, discount_id)`.

---

### فاز ۴: رفع خطاهای ۵۰۰ در پنل پشتیبانی و کاربران (`/admin/support/`)
- [ ] اصلاح امضا و منطق متد `list_users` در `backend/app/modules/admin/services.py`:
  - [ ] هماهنگ‌سازی ترتیب پارامترها به `(db, page=1, page_size=20, search=None, is_active=None)`.
  - [ ] پیاده‌سازی فیلتر شرطی `is_active` بر روی کوئری اصلی و کوئری شمارش کل کاربران.
- [ ] اصلاح کنترلر کاربران در `backend/app/modules/admin/routers/support_router.py`:
  - [ ] پاس دادن پارامترهای نام‌دار (`db=db, page=page, page_size=effective_limit, search=search, is_active=is_active`) جهت جلوگیری از `TypeError`.
  - [ ] پشتیبانی از پارامتر `limit` فرانت‌اند در کنار `page_size`.
- [ ] رفع خطای تنظیم سهمیه و تغییر وضعیت در پنل پشتیبانی:
  - [ ] تزریق کلاینت ردیس (`get_redis`) به اندپوینت `adjust-quota` در `support_router.py` و پاس دادن صحیح آرگومان‌ها به `AdminService.adjust_user_quota`.
  - [ ] پشتیبانی از متد `PUT` در کنار `POST` و پذیرش فیلد `additional_gb` (در صورت ارسال از فرانت‌اند).
  - [ ] پیاده‌سازی متد ناموجود `AdminService.update_user_status(db, user_id, is_active)` در `backend/app/modules/admin/services.py` جهت فعال یا مسدودسازی کاربران بدون کرش سرور.

---

### فاز ۵: تست، اعتبارسنجی نهایی و تطبیق با `500errors.md`
- [ ] نگارش تست‌های خودکار برای کنترلرهای دپارتمانی ادمین (`backend/app/modules/admin/tests/test_admin_endpoints.py`):
  - [ ] تست صدور تیکت با اولویت‌های مختلف (`low`, `medium`, `urgent`).
  - [ ] تست فراخوانی اندپوینت‌های محتوا: `/admin-content/genres` و `/admin-content/banners`.
  - [ ] تست فراخوانی اندپوینت‌های مالی: `/admin-finance/transactions` و `/admin-finance/discounts`.
  - [ ] تست فراخوانی اندپوینت‌های پشتیبانی: `/admin-support/users` و تنظیم سهمیه و وضعیت کاربر.
- [ ] اجرای کامل پای‌تست در بک‌اند (`pytest -q`) و احراز پاس شدن ۱۰۰٪ تست‌ها.
- [ ] اجرای اعتبارسنجی بیلد فرانت‌اند (`npm run build` یا `tsc --noEmit`) جهت اطمینان از سلامت کلاینت.
- [ ] به‌روزرسانی وضعیت در مستندات و گزارش نهایی به کاربر.

</div>
