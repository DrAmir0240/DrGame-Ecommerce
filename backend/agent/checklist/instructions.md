<div dir="rtl" lang="fa">

# ✅ چک‌لیست نهایی پروداکشن و تست جامع (checklist): سرویس خارجی ابجکت استوریج دیتای بازی‌ها، ارسال واقعی OTP، سخت‌گیری دسترسی ادمین و درگاه‌های پرداخت

> **نوع سند:** چک‌لیست عملیاتی نهایی و ممیزی یکپارچه‌سازی (`backend/agent/checklist` — دیگر به عنوان استپ شماره‌گذاری نمی‌شود)  
> **کاربرد:** هر زمان فیچرهای جدید (از جمله گام ۲۸ جدید و گام‌های بعدی) به پروژه اضافه می‌شوند، این چک‌لیست به عنوان مرجع کنترل کیفیت نهایی، جایگزینی ماک‌ها با سرویس‌های واقعی، و اجرای **تست کلی سامانه** در پایان پروژه استفاده می‌شود.  
> **ترتیب اولویت اجرایی در این چک‌لیست:**  
> ۱. سرویس خارجی ابجکت استوریج دیتای بازی‌ها (`StorageBridgeService` و `DPoP`)  
> ۲. سامانه توزیع واقعی کد تایید (`OTPDispatcherService`: پیامک خط خدماتی و ایمیل SMTP)  
> ۳. تکمیل سخت‌گیری دسترسی‌های ادمین (`Strict Scoped RBAC` روی روترهای باقی‌مانده)  
> ۴. **درگاه‌های پرداخت چندگانه (بخش پایانی پیش از لانچ — منوط به تامین مستندات رسمی API و کلیدهای درگاه‌ها)**  
> ۵. **تست کلی و یکپارچه کل سامانه (بک‌اند، فرانت‌اند، پنل ادمین و سناریوهای فیچرهای جدید)**  
> **وابستگی‌ها:** تمام گام‌های توسعه‌ای (از جمله گام ۲۷ به بعد)  
> **ماژول‌های درگیر:** `games`, `dpop`, `storage_bridge.py`, `auth`, `admin`, `tickets`, `news`, `home`, `core`, `subscriptions`, `wallet`  

---

> [!CAUTION]
> **قانون بنیادی تفکیک دو سرویس ابجکت استوریج (External Game Storage vs Internal Liara Storage):**
> ۱. **سرویس ابجکت استوریج دیتای بازی‌ها (Game Data Storage):** یک سرویس **کاملاً مستقل و خارجی** است که توسط **یک تیم دیگر** در حال توسعه است و به هیچ عنوان نباید با ابجکت استوریج لیارای ما اشتباه گرفته شود. وظیفه این سرویس خارجی، ذخیره‌سازی و سرویس‌دهی پکیج‌های حجیم بازی‌ها (فایل‌های PKG، ساختار FAT32، پشتیبانی از Download32 و DPoP کنسول پلی‌استیشن) است.  
> ۲. **سرویس ابجکت استوریج داخلی خودمان (Liara S3):** صرفاً برای فایل‌های رسانه‌ای خود پلتفرم (کاور بازی‌ها، بنرها، اسکرین‌شات‌ها، آواتارها و تصاویر مقالات) در ماژول `app.core.storage` استفاده می‌شود.  
> ۳. **قانون الزامی استعلام:** هر زمان کلمه «ابجکت استوریج» به کار برده شود، ایجنت موظف است شفاف‌سازی نماید که آیا منظور سرویس خارجی دیتای بازی‌هاست یا سرویس استوریج داخلی خودمان (لیارا).

---

> [!IMPORTANT]
> **اصول و الزامات تخطی‌ناپذیر معماری چک‌لیست نهایی (Core Inviolable Mandates):**
> 1. **پایان کار داده‌های ساختگی و ماک (Zero Mock Data Mandate):**  
>    تمام جریان‌های داده در دانلودها، احراز هویت و در نهایت پرداخت‌ها باید به سرویس‌های واقعی متصل شوند. داده‌های بایت خالی (`b"\x00"` null bytes)، چاپ کد تایید در کنسول داکر، و پرداخت شبیه‌سازی‌شده بدون اعتبارسنجی مرجع بانکی باید با پایپ‌لاین‌های استاندارد پروداکشن جایگزین شوند.
> 2. **اولویت اول — پایپ‌لاین هندآف به سرویس خارجی دیتای بازی‌ها (Game Storage Handoff Architecture):**  
>    پلتفرم دکتر گیم نباید ترافیک سنگین دیتای بازی‌های ۴۰ الی ۱۰۰ گیگابایتی را از داخل وب‌سرور خود عبور دهد. پس از احراز هویت، کسر سهمیه کاربر از اشتراک و ثبت لاگ دانلود، سیستم باید لینک مستقیم و معتبر دانلود را از سرویس خارجی دیتای بازی‌ها (از طریق قرارداد API سرویس خارجی یا `StorageBridgeService`) دریافت کرده و به کلاینت (IDM یا کنسول) تحویل دهد.
> 3. **اولویت دوم — ارسال تضمینی و فوری کد تایید (Reliable OTP Dispatch):**  
>    کدهای تایید باید از طریق خط خدماتی وب‌سرویس پیامک (بدون معطلی در بلک‌لیست مخابرات) به شماره موبایل کاربر یا سرور SMTP ایمیل سازمانی ارسال شوند. کدهای تایید باید در ردیس با انقضای ۲ دقیقه هش شده و محدودیت درخواست مجدد ۶۰ ثانیه‌ای اعمال گردد.
> 4. **اولویت سوم — تکمیل سخت‌گیری دسترسی‌های ادمین (Strict Scoped RBAC):**  
>    روترهای پنل ادمین جدید از وابستگی‌های دپارتمانی در `backend/app/core/admin_dependencies.py` و `log_admin_action` استفاده می‌کنند، اما متد عمومی و قدیمی `get_current_admin` همچنان در برخی روترهای ماژول‌ها (`tickets`، `news`، `home`، `core`) فعال است و باید با وابستگی‌های اختصاصی دپارتمانی و ثبت در `AdminAuditLog` جایگزین شود.
> 5. **اولویت چهارم (بخش پایانی پیش از لانچ) — معماری درگاه پرداخت چندگانه بر پایه الگوی درایور (Adapter / Driver Pattern):**  
>    سیستم پرداخت به عنوان **بخش پایانی چک‌لیست** پیاده‌سازی می‌شود و نباید به یک درگاه خاص وابسته باشد. باید از کلاس پایه انتزاعی (`BasePaymentGateway`) استفاده شود تا درایورهای زرین‌پال (`ZarinPalGateway`)، آیدی‌پی (`IDPayGateway`)، و درگاه بین‌المللی ارزی/کریپتو (`NowPaymentsGateway`) بدون تغییر در منطق سرویس اشتراک و کیف پول، در سیستم رجیستر شده و بر اساس تنظیمات پلتفرم فعال شوند. **کدنویسی واقعی این بخش منوط به دریافت/تایید مستندات رسمی API و کلیدهای درگاه‌های نهایی است.**

---

## ۱. جدول ماتریس ارتقا و یکپارچه‌سازی سرویس‌های واقعی (به ترتیب اولویت)

| اولویت | بخش | وضعیت فعلی پروژه | وضعیت نهایی چک‌لیست | کامپوننت و فایل‌های هدف |
| :---: | :---: | :--- | :--- | :--- |
| **۱** | **دیتای بازی‌ها (External Game Storage)** | `StorageBridgeService` و `DPoP` اولیه پیاده‌سازی شده‌اند اما دانلود وب (`games/router.py`) و استریم DPoP (`dpop/router.py`) هنوز بایت خالی `b"\x00"` استریم می‌کنند و هش/جاب پیش‌فرض می‌سازند | یکپارچه‌سازی کامل با سرویس خارجی استوریج بازی‌ها (که توسط تیم خارجی توسعه می‌یابد)، اتصال واقعی به قرارداد API جاب‌ها و تحویل لینک‌های دانلود واقعی با پشتیبانی کامل از IDM و DPoP | `backend/app/modules/games/storage_bridge.py`<br>`backend/app/modules/games/router.py`<br>`backend/app/modules/games/services.py`<br>`backend/app/modules/dpop/router.py` |
| **۲** | **کد تایید OTP (SMS & Email Dispatcher)** | ردیس با TTL 120s در `AuthService` فعال است اما ارسال واقعی وجود ندارد (`OTPService.dispatch_otp` و `IdentityService` در کنسول `print` می‌کنند و کد در پاسخ `DEBUG_CODE`/`test_otp_code` برمی‌گردد؛ محدودیت ۶۰ ثانیه‌ای و هش کد در ردیس پیاده نشده) | اتصال به ارائه‌دهنده پیامک خط خدماتی (کاوه‌نگار / SMS.ir) با وب‌سرویس پترن، ارسال ایمیل رسمی شرکتی با قالب HTML راست‌چین از طریق SMTP، حذف افشای کد در پاسخ API و افزودن cooldown ۶۰ ثانیه‌ای | `backend/app/modules/auth/otp_dispatcher.py`<br>`backend/app/modules/auth/services.py`<br>`backend/app/modules/auth/identity_service.py`<br>`backend/app/modules/auth/router.py`<br>`backend/app/core/config.py` |
| **۳** | **امنیت دسترسی ادمین (Scoped RBAC)** | وابستگی‌های دپارتمانی در `app/core/admin_dependencies.py` روی `content/finance/support/report/referral/catalog_sync` فعال‌اند اما متد قدیمی `get_current_admin` هنوز در `tickets`، `news`، `home` و `core` استفاده می‌شود | جایگزینی کامل `get_current_admin` با وابستگی‌های نقش‌محور مستقل (`require_content_admin`, `require_finance_admin`, `require_support_admin`, `require_super_admin`) و ثبت `AdminAuditLog` در روترهای باقی‌مانده | `backend/app/core/admin_dependencies.py`<br>`backend/app/modules/tickets/router.py`<br>`backend/app/modules/news/router.py`<br>`backend/app/modules/home/router.py`<br>`backend/app/modules/core/router.py` |
| **۴ (پایانی)** | **درگاه پرداخت (Payment Gateway — بخش پایانی)** | شبیه‌سازی پرداخت بدون درگاه واقعی (`payment_method="simulation"`) و تایید صوری در `OrderPayment` و `checkout/page.tsx` | پیاده‌سازی معماری درایور پرداخت با درایور رسمی زرین‌پال (ZarinPal REST v4)، آیدی‌پی (IDPay)، و درگاه کریپتو (`NowPaymentsGateway`) با اعتبارسنجی توکن مرجع (`Authority`/`TrackId`) و تایید قطعی (`verify`) پس از دریافت مستندات رسمی API و کلیدها | `backend/app/modules/subscriptions/payment_gateways/`<br>`backend/app/modules/subscriptions/services.py`<br>`backend/app/modules/subscriptions/router.py`<br>`backend/app/modules/wallet/services.py`<br>`backend/app/modules/wallet/router.py` |

---

## ۲. مستندات تفصیلی معماری و پیاده‌سازی (بر اساس اولویت اجرا)

### ۲.۱. [اولویت ۱] جریان کار سرویس خارجی دیتای بازی‌ها (External Game Storage Integration)
- **نقش سرویس خارجی دیتای بازی‌ها:**  
  این سرویس توسط تیمی مجزا پیاده‌سازی شده و میزبانی فایل‌های دیتای اصلی بازی، پارتیشن‌بندی، فریمورهای کنسول، و مدیریت دانلود موازی را بر عهده دارد.
- **جریان تبادل داده بین پلتفرم ما و سرویس خارجی استوریج:**
  1. کلاینت (فرانت‌اند دکتر گیم یا دانلودمنیجر) درخواست دریافت لینک دانلود را برای اندپوینت `/api/games/{game_id}/downloads/{file_id}/generate` یا `/api/games/{game_id}/download-ticket` ارسال می‌کند.
  2. بک‌اند دکتر گیم ابتدا سهمیه دانلود و وضعیت اشتراک کاربر را اعتبارسنجی و کسر نموده و رکورد را در `UserDownloadHistory` ذخیره می‌کند.
  3. سرویس `StorageBridgeService` با ارسال شناسه بازی یا جاب (`job_id` یا Title ID) به API سرویس خارجی دیتای بازی‌ها (`/api/account/jobs`)، توکن دسترسی مجاز یا آدرس مستقیم دانلود را از سرور استوریج بازی دریافت می‌نماید (با تفکیک `FPKG` برای فریمور `<= 11.40` و `FAT32` برای `> 11.40`).
  4. بک‌اند ما آدرس نهایی دانلود را به کلاینت بازمی‌گرداند تا فرآیند دانلود با حداکثر سرعت و قابلیت Multi-Connection IDM به صورت مستقیم از سرورهای اختصاصی دیتای بازی‌ها انجام شود.
- **استریم کنسولی DPoP:**
  در اندپوینت `/dpop-download/{job_id}/{filename}`، هماهنگی کامل امضای کلید عمومی ES256 کلاینت با گرنت صادرشده در دیتابیس صورت گرفته و دانلود به موتور سرویس دیتای بازی هدایت می‌شود.

---

### ۲.۲. [اولویت ۲] سامانه واقعی ارسال پیامک و ایمیل کد تایید (Real OTP Dispatcher)
- ایجاد ماژول `backend/app/modules/auth/otp_dispatcher.py`:
  - درایور پیامک `KavenegarSMSProvider`: ارسال از طریق وب‌سرویس اعتبارسنجی (Lookup) خط خدماتی کاوه‌نگار برای تحویل آنی (زیر ۵ ثانیه) حتی به شماره‌های مسدودکننده پیامک تبلیغاتی.
  - درایور ایمیل `SMTPEmailProvider`: اتصال امن به سرور SMTP با قالب HTML راست‌چین و شکیل برند دکتر گیم.
  - سرویس هماهنگ‌کننده `OTPDispatcherService`: تشخیص خودکار نوع ورودی (ایمیل vs شماره موبایل ایران)، تولید کد امن ۶ رقمی، ذخیره کد هش‌شده در ردیس با انقضای ۱۲۰ ثانیه، و اعمال محدودیت ارسال مجدد ۶۰ ثانیه‌ای (`60s cooldown`)، متصل به `POST /api/auth/otp/send` و سرویس [`IdentityService`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/auth/identity_service.py) (حذف `DEBUG_CODE` و `test_otp_code` در محیط پروداکشن).

---

### ۲.۳. [اولویت ۳] تکمیل سخت‌گیری دسترسی‌های ادمین (Strict Scoped RBAC)
- در `backend/app/core/admin_dependencies.py`:
  - افزودن `require_super_admin` در کنار وابستگی‌های دپارتمانی موجود (`require_content_admin`, `require_finance_admin`, `require_support_admin`, `require_report_admin`, `require_referral_admin`) و حذف/غیرفعالسازی متد قدیمی `get_current_admin`.
  - جایگزینی `get_current_admin` روی ۴ روتر باقی‌مانده (`backend/app/modules/tickets/router.py`، `backend/app/modules/news/router.py`، `backend/app/modules/home/router.py`، `backend/app/modules/core/router.py`) و حصول اطمینان از ثبت هویت مجری در `AdminAuditLog` برای تمام عملیات مدیریتی.

---

### ۲.۴. [اولویت ۴ — بخش پایانی چک‌لیست] معماری درگاه‌های پرداخت چندگانه (Multi-Provider Payment Engine — Final Section)

> [!NOTE]
> **پیش‌نیاز الزامی پیش از کدنویسی این بخش پایانی:**  
> تا زمان آماده شدن مستندات رسمی API و کلیدهای واقعی/Sandbox درگاه‌های منتخب، هیچ کد حدسی برای اتصال به سرور بانک یا کریپتو نباید نوشته شود. پیش از اجرای فاز ۴ در `tasks.md`، نوع دقیق درگاه‌های نهایی، مستندات رسمی Request/Verify/Callback آن‌ها و کلیدهای `.env` باید مشخص و تایید شوند.

- ایجاد پکیج `backend/app/modules/subscriptions/payment_gateways/`:
  - `base.py`: کلاس پایه انتزاعی `BasePaymentGateway` با متدهای `initiate_payment` و `verify_payment`.
  - `zarinpal.py`: پیاده‌سازی درگاه زرین‌پال نسخه ۴ (REST v4) برای نسخه داخلی (`domestic`) با قابلیت هندل کردن `Authority` و استعلام سلامت و تایید (`verify.json`).
  - `idpay.py`: پیاده‌سازی درگاه ریالی آیدی‌پی برای نسخه داخلی (`domestic`).
  - `nowpayments.py`: پیاده‌سازی درگاه ارزی کریپتو برای خرید با تتر (USDT) در نسخه بین‌المللی (`international`) برای کاربران خارج از کشور.
  - `factory.py`: انتخاب خودکار درگاه بر اساس ارز فاکتور (`IRT` vs `USDT`) یا اولویت تعریف‌شده در پلتفرم (`DEFAULT_PAYMENT_GATEWAY`).
- یکپارچه‌سازی با ماژول اشتراک‌ها و کیف پول:
  - ذخیره دقیق اطلاعات پرداخت در `OrderPayment` (`authority`، `ref_id`، `card_pan`، `tracking_code`).
  - تایید تراکنش در بازگشت از درگاه (`GET/POST /api/subscriptions/payment/callback` / `/payment/callback`) و فعال‌سازی آنی اشتراک یا افزایش موجودی کیف پول (`/api/wallet/deposit`).

---

## ۳. متغیرهای محیطی مورد نیاز (.env)

```env
# --- ۱. سرویس خارجی ابجکت استوریج دیتای بازی‌ها (External Game Storage) ---
GAME_STORAGE_API_URL=https://dltest.gamedr.ir
GAME_STORAGE_API_KEY=your_external_game_storage_key

# --- ۲. سامانه ارسال کد تایید (OTP) ---
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_kavenegar_api_key
KAVENEGAR_OTP_TEMPLATE=drgame-verify

SMTP_HOST=smtp.c2.liara.site
SMTP_PORT=587
SMTP_USER=info@gamedr.ir
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=info@gamedr.ir
SMTP_FROM_NAME="دکتر گیم"

# --- ۳. بخش پایانی: درگاه‌های پرداخت (Payment Gateways - Final Section) ---
DEFAULT_PAYMENT_GATEWAY=zarinpal
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=false
IDPAY_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
IDPAY_SANDBOX=false
NOWPAYMENTS_API_KEY=your_nowpayments_key
```

---

## ۴. آدرس‌دهی دقیق فایل‌ها (Explicit File Paths — به ترتیب اولویت)

### ۴.۱. فایل‌های جدید:
1. `backend/app/modules/auth/otp_dispatcher.py`
2. `backend/tests/test_game_storage_bridge.py`
3. `backend/tests/test_otp_dispatcher.py`
4. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/payment_gateways/base.py`
5. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/payment_gateways/zarinpal.py`
6. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/payment_gateways/idpay.py`
7. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/payment_gateways/nowpayments.py`
8. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/payment_gateways/factory.py`
9. *(بخش پایانی — درگاه پرداخت)* `backend/tests/test_payment_gateways.py`

### ۴.۲. فایل‌های ویرایشی:
1. `backend/app/core/config.py`
2. `backend/app/modules/games/storage_bridge.py`
3. `backend/app/modules/games/router.py`
4. `backend/app/modules/games/services.py`
5. `backend/app/modules/dpop/router.py`
6. `backend/app/modules/auth/services.py`
7. `backend/app/modules/auth/identity_service.py`
8. `backend/app/modules/auth/router.py`
9. `backend/app/core/admin_dependencies.py`
10. `backend/app/modules/tickets/router.py`
11. `backend/app/modules/news/router.py`
12. `backend/app/modules/home/router.py`
13. `backend/app/modules/core/router.py`
14. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/models.py`
15. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/services.py`
16. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/subscriptions/router.py`
17. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/wallet/services.py`
18. *(بخش پایانی — درگاه پرداخت)* `backend/app/modules/wallet/router.py`
19. *(بخش پایانی — درگاه پرداخت)* `frontend/src/app/(store)/checkout/page.tsx`

---

## ۵. تست‌های خودکار و تست کلی نهایی (Quality Assurance & Full-System Verification)

1. **تست تعامل با سرویس خارجی استوریج دیتای بازی:**
   - تست فراخوانی موفق جاب‌ها، هندآف آدرس دانلود، و اعتبارسنجی تیکت‌های دانلود (`tests/test_game_storage_bridge.py`).
2. **تست سرویس توزیع OTP:**
   - تست تولید کد، ذخیره هش‌شده در ردیس با انقضا، و تست محدودیت ارسال ۶۰ ثانیه‌ای (`tests/test_otp_dispatcher.py`).
3. **بخش پایانی — تست موتور درگاه‌های پرداخت:**
   - تست یونیت درایورهای زرین‌پال، آیدی‌پی، NOWPayments و کارخانه درگاه‌ها در محیط آزمایشی (سندباکس) و تست چرخه کال‌بک، وریفای و شارژ حساب/اشتراک (`tests/test_payment_gateways.py`).
4. **اجرای تست کلی سامانه (پس از افزودن همه فیچرهای جدید و تکمیل چک‌لیست):**
   ```bash
   docker exec drgame-backend pytest -v
   docker exec drgame-frontend npx tsc --noEmit && docker exec drgame-frontend npm run build
   docker exec drgame-admin-panel npx tsc --noEmit && docker exec drgame-admin-panel npm run build
   ```

</div>