<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام هفدهم: معماری دو سروره و استانداردسازی احراز هویت (Tasks Checklist)

> **گام:** ۱۷  
> **عنوان:** معماری دو سروره (داخلی/بین‌المللی)، ستون کارنسی دیتابیس، بازنویسی سیستم ثبت‌نام و ورود، کد پویای اتصال کنسول با تایمر پای و اصلاح کامل UI فرم‌ها  
> **وضعیت کلی:** ۱۰۰٪ تکمیل‌شده و راستی‌آزمایی‌شده (Completed & Verified)  

---

### فاز ۱: متغیرهای محیطی و پیکربندی دوگانه (Configuration & Environment)
- [x] افزودن متغیرهای محیطی جدید به `.env`, `.env.example`, `.env.prod`, `.env.prod.example`:
  - [x] `DEPLOYMENT_MODE` (مقادیر: `domestic` یا `international`)
  - [x] `DEFAULT_CURRENCY` (مقادیر: `IRT` یا `USDT`)
  - [x] `NEXT_PUBLIC_DEPLOYMENT_MODE`
  - [x] `NEXT_PUBLIC_DEFAULT_CURRENCY`
- [x] افزودن فیلدهای مربوطه به کلاس `Settings` در `backend/app/core/config.py` با مقادیر پیش‌فرض امن.

---

### فاز ۲: تغییرات پایگاه داده و مهاجرت چندارزی Alembic (Multi-Currency Schema)
- [x] بروزرسانی مدل کیف پول کاربر (`UserWallet`) در `backend/app/modules/wallet/models.py`:
  - [x] افزودن ستون `currency` (String 10, پیش‌فرض از settings)
  - [x] تغییر ستون‌های بر پایه تومان به فیلدهای جنریک مالی
- [x] بروزرسانی مدل لجر کمیسیون (`CommissionLedger`) در `backend/app/modules/wallet/models.py`:
  - [x] افزودن ستون `currency` (String 10)
- [x] معرفی مدل‌ها در صورت نیاز به `backend/alembic/env.py`
- [x] ساخت مایگریشن Alembic: `alembic revision --autogenerate -m "feat: add currency column to wallet and ledger"` (`253cf6003d5d`)
- [x] اجرای مایگریشن در دیتابیس: `alembic upgrade head`

---

### فاز ۳: سرویس یکپارچه لاگ OTP و قوانین ثبت‌نام تفکیک‌شده
- [x] ایجاد سرویس اختصاصی `OTPService` در `backend/app/modules/auth/otp_service.py`:
  - [x] متد استاتیک `dispatch_otp(target, code, mode)`
  - [x] لاگ ساختاریافته و رنگی کد تایید به خروجی کنسول سرور و لاگ‌فایل
- [x] اصلاح اعتبارسنجی ثبت‌نام در `backend/app/modules/auth/services.py`:
  - [x] بررسی حالت `domestic`: رد کردن ایمیل و الزام ثبت‌نام با شماره تلفن ایران (`^09\d{9}$`)
  - [x] بررسی حالت `international`: رد کردن شماره همراه و الزام ثبت‌نام با ایمیل
  - [x] دریافت اطلاعات کامل کاربر شامل `full_name`, `username` یکتا و دلخواه کاربر، `password`, `target`, `code`
- [x] اصلاح اسکیماهای Pydantic در `backend/app/modules/auth/schemas.py`:
  - [x] اعتبارسنجی فیلدها و الگوهای regex برای نام کاربری و تارگت

---

### فاز ۴: سیستم کد پویای اتصال کنسول با ردیس (Dynamic Console Code Backend)
- [x] حذف فیلد ثابت `console_auth_code` از نیازمندی‌های اصلی پروفایل
- [x] پیاده‌سازی اندپوینت تولید کد موقت: `POST /api/users/console-code/generate`:
  - [x] نیازمند لاگین کاربر (`get_current_user`)
  - [x] تولید کد تصادفی ۶ کاراکتری بدون حروف مبهم (مثلاً `7X9K2P`)
  - [x] ذخیره در ردیس با کلید `drgame:console_pair:<code>` و TTL معادل ۱۲۰ ثانیه (۲ دقیقه)
  - [x] بازگرداندن `{ "code": "7X9K2P", "expires_in": 120 }`
- [x] اصلاح اندپوینت لاگین کنسول: `POST /api/auth/login/console`:
  - [x] استعلام کد از ردیس و یافتن `user_id`
  - [x] ابطال اتمیک کد از ردیس جهت جلوگیری از استفاده مجدد
  - [x] صدور نشست و توکن‌های JWT برای دستگاه کنسول

---

### فاز ۵: اصلاحات فرانت‌اند و فیلتر کردن شیوه‌های ورود بر اساس User-Agent
- [x] اصلاح کامپوننت `frontend/src/components/auth/AuthModal.tsx`:
  - [x] تشخیص دقیق پلتفرم پلی‌استیشن با Regex روی `navigator.userAgent`:
    - [x] در صورت کنسول PS4/PS5: فقط تب کد یکتا نمایش داده شود و تب‌های دیگر مخفی شوند
    - [x] در صورت دسکتاپ و موبایل: فقط تب‌های ورود با پسورد و ورود با OTP نمایش داده شوند و تب کنسول مخفی شود
  - [x] رفع کامل باگ سفید شدن پس‌زمینه و متن هنگام تایپ (اصلاح کلاس‌ها و کنتراست رنگ)
  - [x] پیاده‌سازی اعتبارسنجی زنده (Live Validation) فیلد ورودی با نمایش آیکون و وضعیت سبز/قرمز
  - [x] افزودن دکمه نمایش/مخفی‌سازی پسورد (آیکون چشم / `Eye` و `EyeOff`) به تمام فیلدهای رمز عبور
  - [x] فرم کامل ثبت‌نام (شامل نام کامل، نام کاربری دلخواه، رمز عبور و کد معرف)

---

### فاز ۶: ویجت سایدبار کد کنسول و تایمر پای (Pie Timer Widget)
- [x] حذف کد ثابت کنسول از بدنه اصلی صفحه پروفایل کاربر
- [x] ایجاد ویجت جدید `ConsolePairWidget.tsx` در سایدبار داشبورد/پروفایل:
  - [x] دکمه «تولید کد اتصال کنسول»
  - [x] نمایش کد ۶ رقمی بزرگ با فونت خوانا و دکمه کپی
  - [x] کامپوننت انیمیشنی تایمر پای (Circular SVG Pie Timer) با شمارش معکوس ۱۲۰ ثانیه
  - [x] بازنشانی و پاک شدن خودکار کد پس از صفر شدن تایمر و درخواست کلیک مجدد

---

### فاز ۷: تطبیق هدر و فوتر با `DEPLOYMENT_MODE`
- [x] اصلاح `frontend/src/components/layout/Header.tsx`:
  - [x] شرطی‌سازی نمایش `LanguageSwitcher`: فقط در حالت `international` نمایش داده شود؛ در حالت `domestic` کاملاً حذف شود
- [x] اصلاح `frontend/src/components/layout/Footer.tsx`:
  - [x] حذف نوار سوئیچ دستی بالای فوتر (`Mode Switcher Banner`)
  - [x] در حالت `domestic`: نمایش اینماد، ساماندهی، راه‌های ارتباطی داخلی
  - [x] در حالت `international`: نمایش پرداخت‌های کریپتو، دیسکورد، شرایط بین‌المللی

---

### فاز ۸: تست، بازبینی و راستی‌آزمایی جامع (Testing & Verification)
- [x] تست تست‌های واحد بک‌اند برای ثبت‌نام در هر دو مود `domestic` و `international`
- [x] تست لاگین کنسول با کد منقضی و کد صحیح
- [x] تست UI فرم‌های ورود و تایید خوانایی کامل متن در تمام مرورگرها
- [x] تدوین گزارش پایانی استپ ۱۷ در `backend/reports/08.md`
</div>
