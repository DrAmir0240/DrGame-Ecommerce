<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیست و ششم: مهاجرت به کوکی‌های امن، رفع باگ بیلد فرانت‌اند و اصلاحات کلیدی پلتفرم (Tasks Checklist)

> **گام:** ۲۶  
> **عنوان:** مهاجرت کامل سیستم احراز هویت توکن‌های JWT از LocalStorage به کوکی‌های امن HttpOnly و SameSite، رفع خطای کرش بیلد استاتیک Next.js، اصلاح باگ ۴۰۴ دانلود DLC در کاتالوگ، اصلاح باگ پرداخت مضاعف پاداش‌های خزانه‌داری و بهینه‌سازی استریم رنج IDM و پاکسازی کرون‌جاب‌های زمان‌بندی‌شده.  
> **وضعیت کلی:** ✅ تکمیل شده (Completed)  

---

### فاز ۱: مهاجرت امنیتی احراز هویت به کوکی‌های HttpOnly (OWASP Strict Cookie Auth)
- [x] به‌روزرسانی کنترلرهای ماژول احراز هویت در بک‌اند (`backend/app/modules/auth/router.py`):
  - [x] افزودن پارامتر `Response` به اندپوینت‌های `POST /login`، `POST /register`، `POST /refresh`، `POST /login/otp`، و `POST /login/console`.
  - [x] ست کردن کوکی `access_token` با فلگ‌های `httponly=True`, `samesite="lax"`, `path="/"`.
  - [x] ست کردن کوکی `refresh_token` با فلگ‌های `httponly=True`, `samesite="lax"`, `path="/api/auth"`.
  - [x] پیاده‌سازی پاک‌سازی کوکی‌ها در `POST /logout` با متد `delete_cookie`.
- [x] به‌روزرسانی وابستگی احراز هویت کاربر (`backend/app/core/dependencies.py`):
  - [x] استخراج توکن از هدر `Authorization: Bearer <token>` در صورت وجود، و فالبک هوشمند به کوکی `request.cookies.get("access_token")`.
  - [x] پشتیبانی یکپارچه در `get_current_user` و `get_optional_current_user`.
- [x] به‌روزرسانی مدیریت کلاینت و استور احراز هویت در فرانت‌اند:
  - [x] اصلاح `frontend/src/lib/apiClient.ts` جهت ارسال `credentials: "include"` در تمامی درخواست‌های ارتباط با سرور.
  - [x] حذف وابستگی ذخیره توکن خام در کلاینت برای جلوگیری از حملات XSS.

---

### فاز ۲: رفع خطای بیلد استاتیک فرانت‌اند Next.js (`npm run build`)
- [x] بازبینی و اصلاح فایل `frontend/src/app/layout.tsx`:
  - [x] حذف فراخوانی مسدودکننده `cookies()` از بدنه ریشه `RootLayout` برای جلوگیری از خطای `TypeError: Cannot read properties of null (reading 'useContext')`.
  - [x] تنظیم `"build": "NODE_ENV=production next build"` در `package.json` فرانت‌اند.
- [x] اجرای دستور تست بیلد در کانتینر داکر:
  - [x] اجرای `docker exec drgame-frontend npm run build` و حصول اطمینان از خروجی موفقیت‌آمیز (Exit code 0) بدون خطا در صفحات ۶۰ گانه.

---

### فاز ۳: اصلاح باگ ۴۰۴ دانلود DLC در کاتالوگ و دیتابیس
- [x] بازبینی متد `_process_game_dlcs` در `backend/app/modules/catalog_sync/services.py`:
  - [x] اصلاح اختصاص `download_url` با کلید اصلی رکورد دیتابیس (`dlc_file.id`) پس از `await db.flush()`.
  - [x] اطمینان از اینکه خروجی آدرس دانلود به صورت `/api/games/{game.id}/downloads/{dlc_file.id}/stream` تولید می‌شود.
- [x] بررسی عملکرد اندپوینت استریم DLC با شناسه رکورد محلی دیتابیس.

---

### فاز ۴: رفع باگ پرداخت مضاعف پاداش خزانه‌داری در کیف پول
- [x] اصلاح متد `admin_grant_treasury_reward` در `backend/app/modules/wallet/services.py`:
  - [x] مقداردهی صریح به `settlement_status="settled"` هنگام ثبت رکورد `CommissionLedger`.
  - [x] ثبت تاریخ تسویه `settled_at=datetime.now(timezone.utc)`.
- [x] اطمینان از اینکه سرویس `WeeklySettlementService.execute_weekly_settlement` این رکوردها را مجدداً واریز نمی‌کند.

---

### فاز ۵: اصلاح اندپوینت تغییر وضعیت کاربر در پنل پشتیبانی ادمین
- [x] اصلاح `backend/app/modules/admin/routers/support_router.py`:
  - [x] افزودن دکوراتور `@router.patch("/users/{user_id}/status")` در کنار `PUT` برای پشتیبانی کامل از هر دو متد.
  - [x] تضمین دریافت پارامتر `is_active` و تغییر امن وضعیت کاربر با ثبت لاگ بازرسی (`AuditLog`).

---

### فاز ۶: بهینه‌سازی هدرهای استریم رنج IDM و تصحیح زمان‌بندی کرون‌جاب‌ها
- [x] اصلاح هدرهای استریم بازه‌ای در `backend/app/modules/games/router.py`:
  - [x] محاسبه دقیق `content_length` بر اساس `end - start + 1`.
  - [x] تنظیم صحیح هدرهای `Content-Range: bytes {start}-{end}/{total_size}` و `Content-Length` در وضعیت ۲۰۶.
- [x] به‌روزرسانی زمان‌بندی تسک‌ها در `backend/app/tasks/scheduler.py`:
  - [x] حذف فراخوانی کرون‌جاب منسوخ `RAWGSyncService.sync_top_games`.
  - [x] ثبت کرون‌جاب هفتگی تسویه رفرال (`weekly_referral_settlement_task`) در روزهای جمعه ساعت ۰۰:۰۰ بامداد UTC.

---

### فاز ۷: آزمون‌های خودکار و تضمین کیفیت (QA & Pytest)
- [x] نگارش تست‌های خودکار احراز هویت با کوکی در `backend/tests/test_cookie_auth.py`:
  - [x] تست ست شدن کوکی‌های `access_token` و `refresh_token` در لاگین موفق.
  - [x] تست دسترسی به اندپوینت محافظت‌شده با استفاده از کوکی.
  - [x] تست خروج کاربر و پاک‌سازی کوکی‌ها.
- [x] نگارش تست‌های اعتبارسنجی اصلاحات در `backend/tests/test_step26_fixes.py`:
  - [x] تست عدم پرداخت دوبل پاداش خزانه‌داری در سرویس کیف پول.
  - [x] تست صحت شناسه دیتابیسی دانلود DLC.
  - [x] تست هماهنگی روت PATCH وضعیت کاربر در ادمین.
- [x] اجرای کلیه تست‌های بک‌اند و حصول اطمینان از پاس شدن ۱۰۰٪:
  - [x] `docker exec drgame-backend pytest -q` (113 passed)
- [x] اجرای بیلد فرانت‌اند و حصول اطمینان از پاس شدن:
  - [x] `docker exec drgame-frontend npm run build` (60/60 routes generated)

</div>
