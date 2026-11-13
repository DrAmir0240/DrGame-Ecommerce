<div dir="rtl" lang="fa">

# 🚀 دستورالعمل جامع اجرایی گام بیست و هفتم: یکپارچه‌سازی با سرویس خارجی ابجکت استوریج دیتای بازی‌ها، درگاه‌های پرداخت چندگانه و سامانه ارسال پیامک و ایمیل OTP (27-real-storage-streaming-payment-gateways-and-otp-dispatch)

> **شماره گام:** ۲۷  
> **عنوان مرحله:** یکپارچه‌سازی پایپ‌لاین کاتالوگ با سرویس خارجی ابجکت استوریج دیتای بازی‌ها (توسعه‌داده‌شده توسط تیم خارجی) جهت دریافت و تحویل لینک‌های دانلود دیتای بازی، پیاده‌سازی معماری درایورمحور درگاه‌های پرداخت واقعی (زرین‌پال، آیدی‌پی، کریپتو) و جایگزینی شبیه‌ساز پرداخت، پیاده‌سازی سرویس توزیع واقعی کد تایید (پیامک خط خدماتی کاوه‌نگار و ایمیل با قالب اختصاصی SMTP) و ایمن‌سازی کامل دسترسی‌های ادمین (Scoped RBAC).  
> **وابستگی‌ها:** گام‌های ۰۲، ۱۳، ۱۶، ۱۹، ۲۱، ۲۲، ۲۴، ۲۵ و ۲۶  
> **ماژول‌های درگیر:** `games`, `dpop`, `storage_bridge.py`, `subscriptions`, `wallet`, `auth`, `admin`  

---

> [!CAUTION]
> **قانون بنیادی تفکیک دو سرویس ابجکت استوریج (External Game Storage vs Internal Liara Storage):**
> ۱. **سرویس ابجکت استوریج دیتای بازی‌ها (Game Data Storage):** یک سرویس **کاملاً مستقل و خارجی** است که توسط **یک تیم دیگر** در حال توسعه است و به هیچ عنوان نباید با ابجکت استوریج لیارای ما اشتباه گرفته شود. وظیفه این سرویس خارجی، ذخیره‌سازی و سرویس‌دهی پکیج‌های حجیم بازی‌ها (فایل‌های PKG، ساختار FAT32، پشتیبانی از Download32 و DPoP کنسول پلی‌استیشن) است.  
> ۲. **سرویس ابجکت استوریج داخلی خودمان (Liara S3):** صرفاً برای فایل‌های رسانه‌ای خود پلتفرم (کاور بازی‌ها، بنرها، اسکرین‌شات‌ها، آواتارها و تصاویر مقالات) در ماژول `app.core.storage` استفاده می‌شود.  
> ۳. **قانون الزامی استعلام:** هر زمان کلمه «ابجکت استوریج» به کار برده شود، ایجنت موظف است شفاف‌سازی نماید که آیا منظور سرویس خارجی دیتای بازی‌هاست یا سرویس استوریج داخلی خودمان (لیارا).

---

> [!IMPORTANT]
> **اصول و الزامات تخطی‌ناپذیر معماری گام بیست و هفتم (Core Inviolable Mandates):**
> 1. **پایان کار داده‌های ساختگی و ماک (Zero Mock Data Mandate):**  
>    تمام جریان‌های داده در دانلودها، پرداخت‌ها و احراز هویت باید به سرویس‌های واقعی متصل شوند. داده‌های بایت خالی (`b"\x00"` null bytes)، پرداخت شبیه‌سازی‌شده بدون اعتبارسنجی مرجع بانکی، و چاپ کد تایید در کنسول داکر باید با پایپ‌لاین‌های استاندارد پروداکشن جایگزین شوند.
> 2. **پایپ‌لاین هندآف به سرویس خارجی دیتای بازی‌ها (Game Storage Handoff Architecture):**  
>    پلتفرم دکتر گیم نباید ترافیک سنگین دیتای بازی‌های ۴۰ الی ۱۰۰ گیگابایتی را از داخل وب‌سرور خود عبور دهد. پس از احراز هویت، کسر سهمیه کاربر از اشتراک و ثبت لاگ دانلود، سیستم باید لینک مستقیم و معتبر دانلود را از سرویس خارجی دیتای بازی‌ها (از طریق قرارداد API سرویس خارجی یا StorageBridge) دریافت کرده و به کلاینت (IDM یا کنسول) تحویل دهد.
> 3. **معماری درگاه پرداخت چندگانه بر پایه الگوی درایور (Adapter / Driver Pattern):**  
>    سیستم پرداخت نباید به یک درگاه خاص وابسته باشد. باید از کلاس پایه انتزاعی (`BasePaymentGateway`) استفاده شود تا درایورهای زرین‌پال (`ZarinPalGateway`)، آیدی‌پی (`IDPayGateway`)، و درگاه بین‌المللی ارزی/کریپتو بدون تغییر در منطق سرویس اشتراک و کیف پول، در سیستم رجیستر شده و بر اساس تنظیمات پلتفرم فعال شوند.
> 4. **ارسال تضمینی و فوری کد تایید (Reliable OTP Dispatch):**  
>    کدهای تایید باید از طریق خط خدماتی وب‌سرویس پیامک (بدون معطلی در بلک‌لیست مخابرات) به شماره موبایل کاربر یا سرور SMTP ایمیل سازمانی ارسال شوند. کدهای تایید باید در ردیس با انقضای ۲ دقیقه هش شده و محدودیت درخواست مجدد ۶۰ ثانیه‌ای اعمال گردد.

---

## ۱. جدول ماتریس ارتقا و یکپارچه‌سازی سرویس‌های واقعی

| بخش | وضعیت فعلی پروژه | وضعیت نهایی گام بیست و هفتم | کامپوننت و فایل‌های هدف |
| :---: | :--- | :--- | :--- |
| **دیتای بازی‌ها (External Game Storage)** | استریم ۱۰ مگابایت بایت خالی `b"\x00"` در دانلود دسکتاپ و استریم ماک در کنسول PS5 | یکپارچه‌سازی کامل با سرویس خارجی استوریج بازی‌ها (که توسط تیم خارجی توسعه می‌یابد)، اتصال به قرارداد API جاب‌ها و تحویل لینک‌های دانلود واقعی با پشتیبانی کامل از IDM و DPoP | `backend/app/modules/games/storage_bridge.py`<br>`backend/app/modules/games/router.py`<br>`backend/app/modules/dpop/router.py` |
| **درگاه پرداخت (Payment Gateway)** | شبیه‌سازی پرداخت بدون درگاه واقعی (`payment_method="simulation"`) و تایید صوری | پیاده‌سازی معماری درایور پرداخت با درایور رسمی زرین‌پال (ZarinPal REST v4)، آیدی‌پی (IDPay)، و درگاه کریپتو با اعتبارسنجی توکن مرجع (`Authority`/`TrackId`) و تایید قطعی (`verify`) | `backend/app/modules/subscriptions/payment_gateways/`<br>`backend/app/modules/subscriptions/services.py`<br>`backend/app/modules/wallet/services.py` |
| **کد تایید OTP (SMS & Email Dispatcher)** | چاپ کد تایید در خروجی لاگ کنسول داکر (`print(banner)`) | اتصال به ارائه‌دهنده پیامک خط خدماتی (کاوه‌نگار / SMS.ir) با وب‌سرویس پترن و ارسال ایمیل رسمی شرکتی با قالب HTML راست‌چین از طریق SMTP | `backend/app/modules/auth/otp_dispatcher.py`<br>`backend/app/modules/auth/services.py`<br>`backend/app/core/config.py` |
| **امنیت دسترسی ادمین (Scoped RBAC)** | متد آسیب‌پذیر `get_current_admin` بدون بررسی دسترسی به دپارتمان خاص | اعمال وابستگی‌های نقش‌محور مستقل (`require_content_admin`, `require_finance_admin`, `require_support_admin`, `require_super_admin`) | `backend/app/modules/admin/dependencies.py` |

---

## ۲. مستندات تفصیلی معماری و پیاده‌سازی

### ۲.۱. جریان کار سرویس خارجی دیتای بازی‌ها (External Game Storage Integration)
- **نقش سرویس خارجی دیتای بازی‌ها:**  
  این سرویس توسط تیمی مجزا پیاده‌سازی شده و میزبانی فایل‌های دیتای اصلی بازی، پارتیشن‌بندی، فریمورهای کنسول، و مدیریت دانلود موازی را بر عهده دارد.
- **جریان تبادل داده بین پلتفرم ما و سرویس خارجی استوریج:**
  1. کلاینت (فرانت‌اند دکتر گیم یا دانلودمنیجر) درخواست دریافت لینک دانلود را برای اندپوینت `/api/games/{game_id}/downloads/{file_id}/generate` یا `/api/games/{game_id}/download-ticket` ارسال می‌کند.
  2. بک‌اند دکتر گیم ابتدا سهمیه دانلود و وضعیت اشتراک کاربر را اعتبارسنجی و کسر نموده و رکورد را در `UserDownloadHistory` ذخیره می‌کند.
  3. سرویس `StorageBridgeService` با ارسال شناسه بازی یا جاب (`job_id` یا Title ID) به API سرویس خارجی دیتای بازی‌ها، توکن دسترسی مجاز یا آدرس مستقیم دانلود را از سرور استوریج بازی دریافت می‌نماید.
  4. بک‌اند ما آدرس نهایی دانلود را به کلاینت بازمی‌گرداند تا فرآیند دانلود با حداکثر سرعت و قابلیت Multi-Connection IDM به صورت مستقیم از سرورهای اختصاصی دیتای بازی‌ها انجام شود.
- **استریم کنسولی DPoP:**
  در اندپوینت `/dpop-download/{job_id}/{filename}`، هماهنگی کامل امضای کلید عمومی ES256 کلاینت با گرنت صادرشده در دیتابیس صورت گرفته و دانلود به موتور سرویس دیتای بازی هدایت می‌شود.

### ۲.۲. معماری درگاه‌های پرداخت چندگانه (Multi-Provider Payment Engine)
- ایجاد پکیج `backend/app/modules/subscriptions/payment_gateways/`:
  - `base.py`: کلاس پایه انتزاعی `BasePaymentGateway` با متدهای `initiate_payment` و `verify_payment`.
  - `zarinpal.py`: پیاده‌سازی درگاه زرین‌پال نسخه ۴ (REST v4) با قابلیت هندل کردن Authority و استعلام سلامت و تایید (`verify.json`).
  - `idpay.py`: پیاده‌سازی درگاه ریالی آیدی‌پی.
  - `nowpayments.py`: پیاده‌سازی درگاه ارزی کریپتو برای خرید با تتر (USDT) برای کاربران خارج از کشور.
  - `factory.py`: انتخاب خودکار درگاه بر اساس ارز فاکتور یا اولویت تعریف‌شده در پلتفرم.
- یکپارچه‌سازی با ماژول اشتراک‌ها و کیف پول:
  - ذخیره دقیق اطلاعات پرداخت در `OrderPayment` (`authority`، `ref_id`، `card_pan`، `tracking_code`).
  - تایید تراکنش در بازگشت از درگاه (`/payment/callback`) و فعال‌سازی آنی اشتراک یا افزایش موجودی کیف پول.

### ۲.۳. سامانه واقعی ارسال پیامک و ایمیل کد تایید (Real OTP Dispatcher)
- ایجاد ماژول `backend/app/modules/auth/otp_dispatcher.py`:
  - درایور پیامک `KavenegarSMSProvider`: ارسال از طریق وب‌سرویس اعتبارسنجی (Lookup) خط خدماتی کاوه‌نگار برای تحویل آنی (زیر ۵ ثانیه) حتی به شماره‌های مسدودکننده پیامک تبلیغاتی.
  - درایور ایمیل `SMTPEmailProvider`: اتصال امن به سرور SMTP با قالب HTML راست‌چین و شکیل برند دکتر گیم.
  - سرویس هماهنگ‌کننده `OTPDispatcherService`: تشخیص خودکار نوع ورودی (ایمیل vs شماره موبایل ایران)، تولید کد امن ۶ رقمی، ذخیره کد هش‌شده در ردیس با انقضای ۱۲۰ ثانیه، و اعمال محدودیت ارسال مجدد ۶۰ ثانیه‌ای.

### ۲.۴. سخت‌گیری دسترسی‌های ادمین (Strict Scoped RBAC)
- در `backend/app/modules/admin/dependencies.py`:
  - جایگزینی توابع عمومی با وابستگی‌های اختصاصی هر دپارتمان (`require_super_admin`, `require_content_admin`, `require_finance_admin`, `require_support_admin`).
  - ثبت هویت مجری در `AuditLog` به ازای هر عملیات حساس.

---

## ۳. متغیرهای محیطی مورد نیاز (.env)

```env
# --- سرویس خارجی ابجکت استوریج دیتای بازی‌ها (External Game Storage) ---
GAME_STORAGE_API_URL=https://dltest.gamedr.ir
GAME_STORAGE_API_KEY=your_external_game_storage_key

# --- درگاه‌های پرداخت ---
DEFAULT_PAYMENT_GATEWAY=zarinpal
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=false
IDPAY_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
IDPAY_SANDBOX=false
NOWPAYMENTS_API_KEY=your_nowpayments_key

# --- سامانه ارسال کد تایید (OTP) ---
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=your_kavenegar_api_key
KAVENEGAR_OTP_TEMPLATE=drgame-verify

SMTP_HOST=smtp.c2.liara.site
SMTP_PORT=587
SMTP_USER=info@gamedr.ir
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=info@gamedr.ir
SMTP_FROM_NAME="دکتر گیم"
```

---

## ۴. آدرس‌دهی دقیق فایل‌ها (Explicit File Paths)

### ۴.۱. فایل‌های جدید:
1. `backend/app/modules/subscriptions/payment_gateways/base.py`
2. `backend/app/modules/subscriptions/payment_gateways/zarinpal.py`
3. `backend/app/modules/subscriptions/payment_gateways/idpay.py`
4. `backend/app/modules/subscriptions/payment_gateways/nowpayments.py`
5. `backend/app/modules/subscriptions/payment_gateways/factory.py`
6. `backend/app/modules/auth/otp_dispatcher.py`
7. `backend/tests/test_game_storage_bridge.py`
8. `backend/tests/test_payment_gateways.py`
9. `backend/tests/test_otp_dispatcher.py`

### ۴.۲. فایل‌های ویرایشی:
1. `backend/app/core/config.py`
2. `backend/app/modules/games/storage_bridge.py`
3. `backend/app/modules/games/router.py`
4. `backend/app/modules/games/services.py`
5. `backend/app/modules/dpop/router.py`
6. `backend/app/modules/subscriptions/services.py`
7. `backend/app/modules/subscriptions/router.py`
8. `backend/app/modules/wallet/services.py`
9. `backend/app/modules/wallet/router.py`
10. `backend/app/modules/auth/services.py`
11. `backend/app/modules/auth/router.py`
12. `backend/app/modules/admin/dependencies.py`

---

## ۵. تست‌های خودکار و تضمین کیفیت (Quality Assurance)

1. **تست تعامل با سرویس خارجی استوریج دیتای بازی:**
   - تست فراخوانی موفق جاب‌ها، هندآف آدرس دانلود، و اعتبارسنجی تیکت‌های دانلود.
2. **تست موتور درگاه‌های پرداخت:**
   - تست یونیت درایورهای زرین‌پال، آیدی‌پی و کارخانه درگاه‌ها در محیط آزمایشی (سندباکس).
   - تست چرخه کال‌بک، وریفای و شارژ حساب/اشتراک.
3. **تست سرویس توزیع OTP:**
   - تست تولید کد، ذخیره در ردیس با انقضا، و تست محدودیت ارسال ۶۰ ثانیه‌ای.
4. **اجرای پایپ‌لاین کامل آزمون‌ها در داکر:**
   ```bash
   docker exec drgame-backend pytest -v tests/test_game_storage_bridge.py tests/test_payment_gateways.py tests/test_otp_dispatcher.py
   ```

</div>
