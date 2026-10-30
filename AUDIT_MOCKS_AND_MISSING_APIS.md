# 📋 گزارش جامع بررسی بخش‌های ماک، دیتای ایستا و APIهای ایجادنشده
## پلتفرم تجارت الکترونیک و اشتراک بازی‌های دکتر گیم (DrGame)

> **تاریخ گزارش:** آبان ۱۴۰۵ (October 2026)  
> **دامنه بررسی:** کدبیس کامل فرانت‌اند (`frontend/src/`) و بک‌اند (`backend/app/`)  
> **هدف:** شناسایی دقیق تمامی بخش‌های دارای داده‌های ساختگی (Mock Data)، شبیه‌سازی‌شده (Simulations)، محتوای ایستا (Hardcoded)، و اندپوینت‌هایی که از سمت بک‌اند هنوز ایجاد نشده یا در فرانت‌اند به درستی متصل نشده‌اند.

---

## فهرست مطالب
1. [خلاصه وضعیت اجرایی (Executive Summary)](#۱-خلاصه-وضعیت-اجرایی-executive-summary)
2. [بخش اول: داده‌های ماک و شبیه‌سازی‌شده (Mock Data & Simulations)](#۲-بخش-اول-دادههای-ماک-و-شبیهسازیشده-mock-data--simulations)
3. [بخش دوم: اندپوینت‌هایی که در بک‌اند ایجاد نشده‌اند (Missing Backend APIs)](#۳-بخش-دوم-اندپوینتهایی-که-در-بکاند-ایجاد-نشدهاند-missing-backend-apis)
4. [بخش سوم: APIهای موجود در بک‌اند که در فرانت‌اند متصل نشده‌اند (Disconnected APIs)](#۴-بخش-سوم-apiهای-موجود-در-بکاند-که-در-فرانتاند-متصل-نشدهاند-disconnected-apis)
5. [بخش چهارم: باگ‌های محاسباتی و خطاهای معماری اثرگذار روی APIها](#۵-بخش-چهارم-باگهای-محاسباتی-و-خطاهای-معماری-اثرگذار-روی-apiها)
6. [ماتریس اولویت‌بندی و نقشه راه اصلاحات (Action Priority Matrix)](#۶-ماتریس-اولویتبندی-و-نقشه-راه-اصلاحات-action-priority-matrix)

---

## ۱. خلاصه وضعیت اجرایی (Executive Summary)

پس از بازخوانی موشکافانه خط‌به‌خط ساختار پروژه دکتر گیم، وضعیت پروژه به شرح زیر جمع‌بندی می‌شود:

* **زیرساخت‌های پیاده‌شده:** بخش‌های عمده احراز هویت با توکن، ساختار دیتابیس PostgreSQL و کشینگ Redis، ماژول کاتالوگ بازی‌ها، تیکت‌های پشتیبانی دوطرفه، پورسانت رفرال با الگوریتم آبشاری، و استایل‌های نئونی و کنترلربار پلی‌استیشن پیاده‌سازی شده‌اند.
* **نقاط ضعف اصلی:**
  1. **۷ بخش دارای دیتای ماک یا شبیه‌سازی‌شده صریح:** از جمله سیستم جیلبریک کنسول، شبیه‌سازی OTP تسویه حساب، آمار فال‌بک رفرال، درگاه پرداخت تستی، سشن‌های پیش‌فرض، و کامپوننت بلااستفاده `HeroShowcase`.
  2. **۸ ماژول اصلی با فقدان کامل API در بک‌اند:** عدم وجود پنل مدیریت بلاگ برای ادمین، عدم وجود سیستم تنظیمات کلان سایت (`SiteSettings`)، نبود لاگین با OTP برای کاربران قبلی، و نبود اندپوینت‌های ویرایش حساب و سوابق برداشت وجه.
  3. **گسست در اتصال فرانت‌اند و بک‌اند:** مهم‌ترین آن عدم اتصال دکمه دانلود بازی به اندپوینت کسر حجم (`/generate`) است که باعث می‌شود دانلود هیچ سهمیه‌ای از کاربر کم نکند.

---

## ۲. بخش اول: داده‌های ماک و شبیه‌سازی‌شده (Mock Data & Simulations)

در این بخش مواردی که با دیتای ساختگی یا تایمرهای فرانتاندی کار می‌کنند دسته‌بندی شده‌اند:

### ۱. شبیه‌سازی کامل ابزار جیلبریک کنسول (Fake Payload Injection)
* **فایل:** [`frontend/src/app/(store)/tools/jailbreak/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(store)/tools/jailbreak/page.tsx#L12-L26)
* **توضیح:** دکمه «جیلبریک و فعال‌سازی GoldHEN» کاملاً صوری است؛ با دو `setTimeout` (۱۲۰۰ و ۲۸۰۰ میلی‌ثانیه) لاگ‌های ساختگی تزریق می‌کند و هیچ لاجیک یا استعلامی از بک‌اند ندارد. همچنین آی‌پی‌های DNS (`165.227.83.145` و `192.241.221.79`) در صفحه هاردکد هستند.
* **وضعیت بک‌اند:** هیچ مدل، سرویس یا اندپوینتی برای فریمورها، پی‌لودها و هاست جیلبریک در بک‌اند وجود ندارد.

### ۲. اعتبارسنجی پیامکی جعلی در مودال حساب‌های تسویه (Mock OTP Validation)
* **فایل:** [`frontend/src/components/referral/SettlementAccountsModal.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/referral/SettlementAccountsModal.tsx#L74-L92)
* **توضیح:** تابع `handleRequestOtp` با `setTimeout(700ms)` پیامک تستی صادر می‌کند و در مرحله بعد کد ثابت `'123456'` را در جاوااسکریپت چک می‌کند! جالب‌تر اینکه موقع ارسال به سرور، فیلدهای `national_id`، `mobile_phone` و `otp_code` حتی به سرور فرستاده نمی‌شوند!
* **وضعیت بک‌اند:** با وجود اینکه اندپوینت `POST /api/referral/send-otp` در بک‌اند وجود دارد، فرانت‌اند اصلاً آن را صدا نمی‌زند و شبیه‌سازی می‌کند.

### ۳. آمار فال‌بک جعلی در صفحه رفرال و کیف پول (Mock Referral Stats)
* **فایل:** [`frontend/src/app/(dashboard)/referral/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(dashboard)/referral/page.tsx#L71-L80)
* **توضیح:** در صورت عدم لاگین یا خالی بودن دیتای دریافتی، آبجکت `SAMPLE_STATS` با موجودی ۱,۸۵۰,۰۰۰ تومان، کل درآمد ۴,۸۵۰,۰۰۰ تومان و ۱۴ زیرمجموعه نمایش داده می‌شود.
* **وضعیت بک‌اند:** اندپوینت `GET /api/referral/stats` وجود دارد اما فرانت‌اند به جای نمایش صفر یا لودینگ، داده ماک نشان می‌دهد.

### ۴. نشست‌های دستگاه ساختگی در حالت خطا (Mock Sessions)
* **فایل:** [`frontend/src/app/(dashboard)/sessions/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(dashboard)/sessions/page.tsx#L24-L48)
* **توضیح:** در بلاک `catch` واکشی نشست‌ها، دو نشست ساختگی با مشخصات مرورگر کروم (`192.168.1.100`) و کنسول پلی‌استیشن ۵ (`192.168.1.105`) به کاربر نمایش داده می‌شود.

### ۵. کامپوننت مرده و ۱۰۰٪ ماک اسلایدر هیرو (`HeroShowcase.tsx`)
* **فایل:** [`frontend/src/components/home/HeroShowcase.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/home/HeroShowcase.tsx)
* **توضیح:** یک کامپوننت کامل ۲۱۴ خطی شامل آرایه `HERO_SLIDES` (اسلایدهای گاد آف وار، اسپایدرمن و هورایزن) با لینک‌های Unsplash که در هیچ کجای فرانت‌اند ایمپورت یا استفاده نشده و کد مرده است.

### ۶. شبیه‌سازی درگاه پرداخت اشتراک‌ها (Payment Simulation)
* **فایل:** [`frontend/src/app/(store)/checkout/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(store)/checkout/page.tsx#L88)
* **توضیح:** مقدار `payment_method: 'simulation'` هاردکد شده است و هیچ ریدایرکتی به درگاه‌های واقعی زرین‌پال یا NowPayments صورت نمی‌گیرد.

### ۷. شبیه‌سازی دانلود بدون کسر حجم (Bypassed Quota Deduction)
* **فایل:** [`frontend/src/components/games/DownloadConfirmModal.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/games/DownloadConfirmModal.tsx#L48-L70)
* **توضیح:** کلیک روی دکمه «تایید و دانلود» صرفاً یک تگ `<a href={link.download_url}>` در مرورگر باز می‌کند و با `setTimeout` تابع `fetchQuota` را صدا می‌زند، بدون اینکه به بک‌اند بگوید لینکی ایجاد کند یا حجمی کم کند.

### ۸. هاردکد بودن ویژگی‌ها در کارت اشتراک (`TierCard.tsx`)
* **فایل:** [`frontend/src/components/subscriptions/TierCard.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/subscriptions/TierCard.tsx#L244-L396)
* **توضیح:** ویژگی‌های پلن‌های برنز، نقره و طلا به جای خوانده شدن از فیلدهای دیتابیس (`allow_data`, `allow_cheat`, `allow_dlc`, `allow_subtitles`, `allow_dubbing`)، به صورت سه قالب متن ایستا در کد نوشته شده‌اند.

### ۹. افتخارات و رده‌های سنی ساختگی در صفحه بازی (`games/[id]/page.tsx`)
* **فایل:** [`frontend/src/app/(store)/games/[id]/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(store)/games/[id]/page.tsx#L360-L520)
* **توضیح:** در صورت خالی بودن مقادیر، سازنده پیش‌فرض `Sony Interactive Entertainment`، افتخارات استودیو با دو جمله ثابت، متای پیش‌فرض `86`، رده‌بندی سنی `ESRB Teen (+16)`، پشتیبانی لمسی دوال‌سنس `پشتیبانی می‌شود` و منبع گیم‌پلی `HowLongToBeat` هاردکد شده است.

---

## ۳. بخش دوم: اندپوینت‌هایی که در بک‌اند ایجاد نشده‌اند (Missing Backend APIs)

این اندپوینت‌ها در نیازمندی‌های پروژه یا در رابط کاربری مورد نیاز هستند، اما در کنترلرها و روترهای بک‌اند (`backend/app/modules/`) اصلاً وجود ندارند:

| ردیف | متد و اندپوینت پیشنهادی | ماژول مربوطه | کاربرد و دلیل نیاز | وضعیت فعلی |
| :---: | :--- | :--- | :--- | :--- |
| **۱** | `POST /api/admin/blog/posts` | `news/admin` | ایجاد مقاله جدید وبلاگ توسط ادمین (همراه با متن و آپلود تصویر) | ❌ وجود ندارد (فقط ۵ پست استاتیک در دیتابیس هست) |
| **۲** | `PUT /api/admin/blog/posts/{id}` | `news/admin` | ویرایش مقاله موجود در وبلاگ | ❌ وجود ندارد |
| **۳** | `DELETE /api/admin/blog/posts/{id}` | `news/admin` | حذف مقاله وبلاگ | ❌ وجود ندارد |
| **۴** | `POST /api/admin/blog/categories` | `news/admin` | ایجاد دسته‌بندی جدید مقالات | ❌ وجود ندارد |
| **۵** | `GET /api/admin/settlement-accounts` | `admin` | مشاهده لیست جامع حساب‌های بانکی و شبای ثبت‌شده کاربران با فیلتر وضعیت | ❌ وجود ندارد (فرانت‌اند مجبور شده `/admin/payouts` را فراخوانی کند!) |
| **۶** | `GET /api/referral/withdrawals` | `wallet` | دریافت تاریخچه درخواست‌های تسویه کاربر لاگین‌شده و وضعیت تایید/رد | ❌ وجود ندارد (کاربر فقط دکمه ثبت درخواست دارد، سوابقش را نمی‌بیند) |
| **۷** | `PUT /api/referral/settlement-accounts/{id}` | `wallet` | ویرایش شماره شبا یا کارت ثبت‌شده کاربر | ❌ وجود ندارد |
| **۸** | `DELETE /api/referral/settlement-accounts/{id}` | `wallet` | حذف حساب تسویه ثبت‌شده توسط کاربر | ❌ وجود ندارد |
| **۹** | `POST /api/auth/login/otp` | `auth` | ورود کاربر ثبت‌نام‌شده با کد یکبار مصرف (بدون رمز عبور) | ❌ وجود ندارد (تب OTP فقط برای ثبت‌نام کاربر جدید کار می‌کند) |
| **۱۰** | `GET /api/settings` و `PUT /api/admin/settings` | `core/settings` | مدیریت داینامیک تنظیمات کلان (تلفن و آدرس فوتر، آی‌پی DNS هدر، شبکه‌های اجتماعی، سوالات متداول و فریمورهای جیلبریک) | ❌ هیچ مدلی به نام `SiteSettings` یا جدول تنظیمات وجود ندارد |
| **۱۱** | `PUT /api/admin/users/{id}` | `admin` | ویرایش اطلاعات پایه کاربر توسط مدیریت کلان | ❌ وجود ندارد |
| **۱۲** | `PATCH /api/admin/users/{id}/status` | `admin` | فعال/غیرفعال کردن کاربر (`is_active`) یا مسدودسازی حساب | ❌ وجود ندارد |
| **۱۳** | `POST /api/admin/users/{id}/subscriptions` | `admin` | اعطای دستی اشتراک به یک کاربر خاص از طریق پرونده کاربری | ❌ وجود ندارد |
| **۱۴** | `PUT /api/admin/subscriptions/{id}` | `admin` | ویرایش، تمدید یا باطل‌سازی اشتراک صادرشده کاربر در جدول سوابق اشتراک‌ها | ❌ وجود ندارد (جدول صرفاً نمایشی است) |
| **۱۵** | `PUT /api/admin/discounts/{id}` | `admin` | ویرایش درصد، سقف و تاریخ انقضای کد تخفیف موجود | ❌ وجود ندارد (فقط Create و Delete پیاده شده) |
| **۱۶** | `POST /api/users/profile/upload-avatar` | `users` | آپلود مستقیم تصویر آواتار و هیرو بنر توسط کاربر روی سرور | ❌ وجود ندارد (تنها امکان ارسال URL رشته‌ای هست) |
| **۱۷** | Daily RAWG Sync Cron Job | `rawg_sync` | جاب زمان‌بندی‌شده روزانه برای دریافت خودکار بازی‌های جدید از RAWG | ❌ وجود ندارد (صرفاً یک اسکریپت دستی یکباره وجود دارد) |

---

## ۴. بخش سوم: APIهای موجود در بک‌اند که در فرانت‌اند متصل نشده‌اند (Disconnected APIs)

این اندپوینت‌ها در بک‌اند با کیفیت پیاده‌سازی شده و تست پاس کرده‌اند، اما فرانت‌اند آن‌ها را صدا نمی‌زند یا اشتباه پیاده‌سازی کرده است:

### ۱. اندپوینت کسر حجم و تولید لینک امن (`POST /api/games/{id}/downloads/{file_id}/generate`)
* **در بک‌اند:** در فایل `backend/app/modules/games/router.py` اندپوینت لاگین‌شده برای کسر سهمیه، اعتبارسنجی سطح پلن، تولید لینک امضاشده یکبار مصرف و ثبت در `UserDownloadHistory` آماده است.
* **مشکل فرانت‌اند:** کامپوننت `DownloadConfirmModal.tsx` این اندپوینت را صدا نمی‌زند و مستقیماً لینک باز می‌کند؛ بنابراین نه حجمی کم می‌شود و نه رکوردی در صفحه «دانلودهای من» کاربر ثبت می‌گردد.

### ۲. اتصال صفحه تایید حساب بانکی ادمین به اندپوینت اشتباه
* **در بک‌اند:** اندپوینت `POST /api/admin/bank-accounts/{account_id}/verify` برای تایید یا رد حساب‌های شبا تعبیه شده است.
* **مشکل فرانت‌اند:** در فایل `frontend/src/app/(admin)/admin/bank-accounts/page.tsx` به جای فراخوانی لیست حساب‌ها، اندپوینت `/admin/payouts` صدا زده می‌شود و شناسه درخواست برداشت به جای شناسه حساب بانکی ارسال می‌گردد.

### ۳. عدم ارسال فیلد ۵ بخشی فایل‌های بازی در پنل ادمین
* **در بک‌اند:** جدول `GameDownloadFile` برای ۵ بخش (`data`, `cheat`, `dlc`, `subtitle`, `dubbing`) و سطح پلن موردنیاز (`required_tier`) طراحی شده است.
* **مشکل فرانت‌اند:** در تابع `handleSaveGame` فایل `admin/games/page.tsx`، این دو فیلد نادیده گرفته شده و لینک‌ها به ساختار قدیمی ارسال می‌شوند.

### ۴. نادیده گرفتن دوره زمانی اشتراک در تسویه‌حساب (`/checkout`)
* **در بک‌اند:** روت `POST /api/subscriptions/checkout` فیلد `duration_months` را پشتیبانی می‌کند.
* **مشکل فرانت‌اند:** صفحه `checkout/page.tsx` پارامتر `duration` را از URL نمی‌خواند و همیشه مقدار پیش‌فرض ۳۰ روزه را فاکتور می‌کند.

### ۵. عدم فیلتر بر اساس دپارتمان تیکت در پنل کاربر
* **در بک‌اند:** روت `GET /api/tickets/me?department=...` فیلتر دپارتمان را پشتیبانی می‌کند.
* **مشکل فرانت‌اند:** در صفحه `dashboard/tickets/page.tsx` تنها تب‌های وضعیت (`open`, `answered`, `closed`) گذاشته شده و دراپ‌داون یا فیلتر دسته‌بندی وجود ندارد.

### ۶. نادیده گرفتن فیلترهای URL در صفحه کاتالوگ (`/games`)
* **در بک‌اند:** اندپوینت `GET /api/games` تمامی فیلترهای `genre`، `platform`، `is_two_player`، `has_vr` و مرتب‌سازی را دریافت می‌کند.
* **مشکل فرانت‌اند:** صفحه `frontend/src/app/(store)/games/page.tsx` از هوک `useSearchParams` استفاده نمی‌کند و تمام کوئری‌استرینگ‌های ارسالی از صفحه اصلی را نادیده می‌گیرد.

---

## ۵. بخش چهارم: باگ‌های محاسباتی و خطاهای معماری اثرگذار روی APIها

### ۱. خطای ۱۰ برابری محاسبات مالی (تقسیم بر ۱۰ مبالغ تومان در بک‌اند)
* **فایل‌ها:**
  - [`backend/app/modules/wallet/services.py#L334`](file:///d:/project/DrGame-Ecommerce/backend/app/modules/wallet/services.py#L334)
  - [`backend/app/modules/admin/services.py#L224-L236`](file:///d:/project/DrGame-Ecommerce/backend/app/modules/admin/services.py#L224-L236)
  - [`backend/app/modules/admin/services.py#L348`](file:///d:/project/DrGame-Ecommerce/backend/app/modules/admin/services.py#L348)
* **توضیح:** در کد خط `amount_toman = paid_amount // 10 if paid_amount >= 10000 else paid_amount` قرار دارد. چون قیمت‌ها در جدول اشتراک از ابتدا به تومان ذخیره شده‌اند (مثلاً ۷۰۰,۰۰۰ تومان)، این تقسیم دوباره، ارقام مالی پنل ادمین و پورسانت بازاریابان را **یک‌دهم ارزش واقعی** می‌کند!

### ۲. اسلایدرهای تکراری صفحه اصلی به دلیل فال‌بک ناقص
* **فایل:** [`frontend/src/app/page.tsx#L62`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/page.tsx#L62)
* **توضیح:** تابع `getGamesByGenre` در صورت نیافتن بازی با ژانر مدنظر در ۱۰۰ رکورد اول، `games.slice(0, 8)` را برمی‌گرداند. در نتیجه اسلایدرهای پارتی، وحشت و پلتفرمر دقیقاً ۸ بازی یکسان را تکرار می‌کنند.

### ۳. تولید بازی‌های تکراری و مصنوعی در اسکریپت RAWG
* **فایل:** [`backend/scripts/seed_300_games.py#L389-L435`](file:///d:/project/DrGame-Ecommerce/backend/scripts/seed_300_games.py#L389-L435)
* **توضیح:** برای رساندن تعداد به ۳۰۰، در حلقه‌ای بازی‌هایی با عنوان ساختگی `Special Edition 1..285` با آدرس کاور ناموجود `/media/games/cover_default.jpg` در دیتابیس درج می‌شود.

---

## ۶. ماتریس اولویت‌بندی و نقشه راه اصلاحات (Action Priority Matrix)

برای رفع موارد فوق و رساندن سیستم به حالت ۱۰۰٪ داینامیک و سالم، جدول اولویت‌بندی اجرایی زیر پیشنهاد می‌گردد:

| اولویت | شرح تسک | فایل‌های مربوطه | وضعیت |
| :---: | :--- | :--- | :---: |
| 🔴 **بحرانی** | اصلاح اتصال دکمه تایید دانلود به اندپوینت `/generate` و کسر آنی سهمیه | `DownloadConfirmModal.tsx`, `DownloadBox.tsx` | فرانت‌اند |
| 🔴 **بحرانی** | حذف `// 10` از محاسبات مالی و بازاریابی برای تصحیح ارقام تومانی | `wallet/services.py`, `admin/services.py` | بک‌اند |
| 🔴 **بحرانی** | ایجاد اندپوینت `POST /api/auth/login/otp` برای ورود با کد یکبار مصرف بدون رمز | `auth/router.py`, `auth/services.py`, `AuthModal.tsx` | فول‌استک |
| 🔴 **بحرانی** | ایجاد اندپوینت‌های CRUD مدیریت مقالات بلاگ در پنل ادمین (`/admin/blog`) | `news/router.py`, `news/services.py`, `admin/blog/page.tsx` | فول‌استک |
| 🟠 **بالا** | ایجاد مدل دیتابیس `SiteSettings` و پنل تنظیمات برای فوتر، هدر و DNS | `core/models.py`, `core/router.py`, `admin/settings/` | فول‌استک |
| 🟠 **بالا** | ایجاد اندپوینت مشاهده و مدیریت تاریخچه برداشت‌های کاربر (`GET /api/referral/withdrawals`) | `wallet/router.py`, `referral/page.tsx` | فول‌استک |
| 🟠 **بالا** | تصحیح اتصال صفحه حساب‌های بانکی ادمین و ایجاد اندپوینت دریافت حساب‌ها | `admin/router.py`, `admin/bank-accounts/page.tsx` | فول‌استک |
| 🟡 **متوسط** | خواندن فیلترهای URL (`useSearchParams`) در صفحات `/games`، `/blog` و `/checkout` | `games/page.tsx`, `blog/page.tsx`, `checkout/page.tsx` | فرانت‌اند |
| 🟡 **متوسط** | حذف داده‌های ماک `SAMPLE_STATS` در رفرال و نشست‌های فیک در سشنز | `referral/page.tsx`, `sessions/page.tsx` | فرانت‌اند |
| 🟡 **متوسط** | اتصال ویژگی‌های کارت‌های اشتراک به فیلدهای داینامیک دیتابیس | `TierCard.tsx` | فرانت‌اند |
| 🟢 **عادی** | حذف فایل مرده `HeroShowcase.tsx` و ایجاد تب Wishlist در پنل کاربری | `HeroShowcase.tsx`, `profile/page.tsx` | فرانت‌اند |
| 🟢 **عادی** | افزودن Daily Cron Scheduler برای دریافت بازی‌های جدید بدون تولید دیتای مصنوعی | `rawg_sync/services.py` | بک‌اند |

