<div dir="rtl" lang="fa">

# 📋 چک‌لیست نهایی پروداکشن و تست جامع (checklist): سرویس خارجی استوریج بازی‌ها، سامانه OTP، سخت‌گیری RBAC و درگاه‌های پرداخت

> **شناسه پوشه:** `backend/agent/checklist` (این سند دیگر استپ نیست؛ چک‌لیست مرجع پیش از لانچ برای رفع ماک‌ها پس از افزودن فیچرهای جدید و انجام تست کلی سامانه است)  
> **عنوان:** یکپارچه‌سازی پایپ‌لاین کاتالوگ با سرویس خارجی ابجکت استوریج دیتای بازی‌ها (توسعه‌داده‌شده توسط تیم خارجی)، پیاده‌سازی سامانه توزیع پیامک و ایمیل کد تایید OTP، تکمیل ایمن‌سازی RBAC ادمین، در **بخش پایانی**: پیاده‌سازی معماری درایورمحور درگاه‌های پرداخت واقعی (زرین‌پال، آیدی‌پی، کریپتو)، و در نهایت **تست کلی کل سیستم**.  
> **وضعیت کلی:** ⏳ در انتظار اجرا پس از تکمیل فیچرهای جدید (Pending Execution)  

---

### فاز ۱: یکپارچه‌سازی با سرویس خارجی ابجکت استوریج دیتای بازی‌ها (External Game Storage Integration)
- [ ] بازبینی و ارتقای پل ارتباطی استوریج بازی‌ها (`backend/app/modules/games/storage_bridge.py`):
  - [ ] تنظیم آدرس سرور استوریج بازی‌ها (`GAME_STORAGE_API_URL` / `DPOP_BASE_ORIGIN`) و ارتباط با اندپوینت جاب‌های بازی (`/api/account/jobs`).
  - [ ] تفکیک فرمت‌های کنسول بر اساس فریمور (FPKG برای فریمورهای `<= 11.40` و FAT32 برای `> 11.40`).
- [ ] ارتقای اندپوینت‌های صدور تیکت و لینک دانلود (`backend/app/modules/games/router.py` و `services.py`):
  - [ ] بررسی اشتراک و سهمیه دانلود کاربر، ثبت تاریخچه در `UserDownloadHistory`.
  - [ ] صدور لینک دانلود معتبر و امضاشده به مقصد سرور خارجی استوریج بازی‌ها بدون بارگذاری ترافیک روی وب‌سرور داخلی.
- [ ] ارتقای استریم دانلود کنسولی DPoP (`backend/app/modules/dpop/router.py`):
  - [ ] هماهنگی تیکت‌های DPoP و کلیدهای ES256 برای استریم ۳۲ کانکشنه کنسول‌های پلی‌استیشن متصل به سرویس خارجی دیتای بازی.
- [ ] نگارش و اجرای تست‌های یکپارچگی استوریج خارجی بازی در `backend/tests/test_game_storage_bridge.py`:
  - [ ] تست اتصال به سرویس استوریج بازی و همگام‌سازی جاب‌ها.
  - [ ] تست صدور تیکت و صحت هندآف آدرس دانلود.

---

### فاز ۲: پیاده‌سازی سامانه توزیع واقعی پیامک و ایمیل کد تایید (Real OTP Dispatcher)
- [ ] پیاده‌سازی ماژول توزیع کد تایید (`backend/app/modules/auth/otp_dispatcher.py`):
  - [ ] پیاده‌سازی کلاس `KavenegarSMSProvider` با استفاده از وب‌سرویس پترن Lookup کاوه‌نگار (ارسال خط خدماتی فوری).
  - [ ] پیاده‌سازی کلاس `SMTPEmailProvider` جهت ارسال ایمیل HTML رسمی از طریق سرور SMTP لیارا یا شرکتی.
  - [ ] پیاده‌سازی سرویس `OTPDispatcherService` برای تشخیص نوع شماره/ایمیل و ارسال هوشمند.
- [ ] امنیت، ریت لیمیت و ذخیره‌سازی در ردیس:
  - [ ] ایجاد و ذخیره کد هش‌شده در ردیس با زمان انقضای ۱۲۰ ثانیه.
  - [ ] اعمال محدودیت ارسال مجدد با حداقل فاصله ۶۰ ثانیه (`60s cooldown`) بین درخواست‌های یک کاربر.
  - [ ] اتصال متدهای درخواست کد تایید (`POST /api/auth/otp/send` و سرویس تایید پیامکی تسویه حساب در `IdentityService`) به سرویس `OTPDispatcherService` و حذف `DEBUG_CODE` / `test_otp_code` در پاسخ HTTP پروداکشن.
- [ ] نگارش و اجرای تست‌های سامانه OTP در `backend/tests/test_otp_dispatcher.py`:
  - [ ] تست تولید کد تایید، ذخیره هش‌شده در ردیس و اعمال محدودیت ۶۰ ثانیه‌ای.
  - [ ] تست اعتبارسنجی و انقضای کد پس از ۱۲۰ ثانیه.

---

### فاز ۳: تکمیل سخت‌گیری امنیت و سطوح دسترسی ادمین (Strict Scoped RBAC)
- [ ] بازبینی و تکمیل فایل `backend/app/core/admin_dependencies.py`:
  - [ ] افزودن `require_super_admin` (در کنار `require_content_admin`, `require_finance_admin`, `require_support_admin`, `require_report_admin`, `require_referral_admin` که از قبل فعال‌اند).
  - [ ] حذف/جایگزینی کامل وابستگی عمومی و قدیمی `get_current_admin` از ۴ روتر باقی‌مانده: `tickets/router.py`، `news/router.py`، `home/router.py` و `core/router.py` همراه با ثبت عملیات در `AdminAuditLog`.
- [ ] اجرای تست‌های فازهای ۱ تا ۳ در کانتینر داکر پیش از ورود به بخش پایانی درگاه‌های پرداخت:
  - [ ] `docker exec drgame-backend pytest -v tests/test_game_storage_bridge.py tests/test_otp_dispatcher.py`

---

### فاز ۴ (بخش پایانی پیش از لانچ): پیاده‌سازی موتور درگاه‌های پرداخت چندگانه (Multi-Provider Payment Gateways — Final Phase)
- [ ] **پیش‌نیاز پیش از کدنویسی:** دریافت و تایید مستندات رسمی API و کلیدهای Sandbox/تولید درگاه‌های منتخب (`ZARINPAL_*`, `IDPAY_*`, `NOWPAYMENTS_API_KEY`) و ثبت در `.env` و `backend/app/core/config.py`.
- [ ] ایجاد ساختار پکیج درگاه‌های پرداخت (`backend/app/modules/subscriptions/payment_gateways/`):
  - [ ] ایجاد کلاس پایه انتزاعی `BasePaymentGateway` با متدهای `initiate_payment` و `verify_payment`.
  - [ ] پیاده‌سازی درایور زرین‌پال (`ZarinPalGateway`) با اتصال به REST API v4 و اعتبارسنجی `Authority` و `verify.json`.
  - [ ] پیاده‌سازی درایور آیدی‌پی (`IDPayGateway`) برای تراکنش‌های ریالی بانکی (`domestic`).
  - [ ] پیاده‌سازی درایور ارزی/کریپتو (`NowPaymentsGateway`) برای پرداخت با تتر یا رمزارزها (`international`).
  - [ ] پیاده‌سازی `PaymentGatewayFactory` جهت انتخاب داینامیک درگاه بر اساس ارز (`IRT` / `USDT`) یا پیکربندی.
- [ ] یکپارچه‌سازی با ماژول اشتراک‌ها و کیف پول:
  - [ ] اصلاح روتر و سرویس خرید اشتراک برای هدایت کاربر به آدرس درگاه پرداخت واقعی.
  - [ ] پیاده‌سازی اندپوینت کال‌بک بازگشت از پرداخت (`GET/POST /api/subscriptions/payment/callback`).
  - [ ] پیاده‌سازی وریفای تراکنش در بازگشت، ثبت شماره ارجاع (`ref_id`)، شماره کارت (`card_pan`) و `tracking_code` در `OrderPayment`، فعال‌سازی اشتراک و صدور فاکتور.
  - [ ] اتصال واریز مستقیم به کیف پول (`/api/wallet/deposit`) به موتور درگاه پرداخت.
- [ ] نگارش تست‌های نهایی درگاه پرداخت در `backend/tests/test_payment_gateways.py`:
  - [ ] تست یونیت درایورهای زرین‌پال، آیدی‌پی، NOWPayments و کارخانه درگاه‌ها.
  - [ ] تست شبیه‌سازی چرخه کال‌بک پرداخت و وریفای با موفقیت.

---

### فاز ۵: تست کلی و یکپارچه کل سامانه (Full-System Integration & Regression Test)
- [ ] بررسی اینکه تمام فیچرهای اضافه‌شده در گام ۲۸ جدید و گام‌های بعدی بدون ماک و شکست کار می‌کنند.
- [ ] اجرای کامل تست‌های بک‌اند در داکر:
  - [ ] `docker exec drgame-backend pytest -v`
- [ ] تست تایپ‌اسکریپت و بیلد پروداکشن فرانت‌اند فروشگاه و پنل ادمین:
  - [ ] `docker exec drgame-frontend npx tsc --noEmit && docker exec drgame-frontend npm run build`
  - [ ] `docker exec drgame-admin-panel npx tsc --noEmit && docker exec drgame-admin-panel npm run build`
- [ ] تست E2E مسیرهای بحرانی و اندپوینت‌های زنده پس از اتمام تمام فیچرها.

</div>