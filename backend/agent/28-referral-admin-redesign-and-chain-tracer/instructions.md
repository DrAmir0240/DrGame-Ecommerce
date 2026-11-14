<div dir="rtl" lang="fa">

# 🚀 دستورالعمل جامع اجرایی گام بیست و هشتم: بازطراحی کامل پنل ادمین رفرال، رفع باگ‌های بحرانی و پیاده‌سازی مرکز پیشرفته رهگیری زنجیره رفرال (28-referral-admin-redesign-and-chain-tracer)

> **شماره گام:** ۲۸  
> **عنوان مرحله:** بازطراحی یکپارچه رابط کاربری و تجربه کاربری (UI/UX Redesign) دپارتمان ادمین رفرال، اصلاح کامل جریان‌های خراب (برداشت‌ها، تایید حساب بانکی، داشبورد و تله خروج `403 Read-Only`)، و پیاده‌سازی سیستم سه‌بعدی **رهگیری زنجیره رفرال** (شجره‌نامه تعاملی چندلایه + ردیاب آبشار مالی سفارش + فهرست ریشه‌محور و شاخص‌های ضدتقلب).  
> **وابستگی‌ها:** گام‌های ۰۶، ۱۵، ۲۰، ۲۴، ۲۵، ۲۶ و ۲۷  
> **ماژول‌های درگیر:**  
> - **بک‌اند:** `backend/app/modules/admin/routers/referral_router.py`, `backend/app/modules/admin/services.py`, `backend/app/modules/admin/schemas.py`, `backend/app/modules/wallet/settlement_service.py`, `backend/app/modules/wallet/services.py`, `backend/tests/`  
> - **فرانت‌اند:** `frontend/src/lib/apiClient.ts`, `frontend/src/types/referral.ts`, `frontend/src/components/admin/` (`DepartmentLayout.tsx`, `DepartmentLoginPage.tsx`, `DepartmentStaffManager.tsx`, کامپوننت‌های اختصاصی رفرال), و صفحات `frontend/src/app/(admin)/admin/referral/**`

---

> [!IMPORTANT]
> **اصول و الزامات تخطی‌ناپذیر معماری گام بیست و هشتم (Core Inviolable Mandates):**
> 1. **رفع قطعی جریان‌های شکسته و تله‌های امنیتی UX:**  
>    - اصلاح کامل قرارداد پردازش برداشت (`POST /api/admin-referral/payouts/{request_id}/process`) در بک‌اند و فرانت‌اند (`new_status: "approved" | "rejected"` به جای `PUT` و `COMPLETED`) همراه با نمایش کامل اطلاعات مقصد واریز (شبا، کارت، ولت کریپتو، نام صاحب حساب، موبایل).  
>    - اصلاح `frontend/src/lib/apiClient.ts`: خطای `403 Forbidden` به هیچ وجه نباید توکن‌های دپارتمان را پاک کرده یا کاربر را به `/admin/login` پرت کند (حذف تله خروج ادمین `read_only`)؛ در صورت `401 Unauthorized` نیز کاربر دپارتمان دقیقاً به `/admin/{dept}/login` هدایت شود.  
>    - اعمال یکسان بررسی `access_level === "read_only"` در تمام صفحات پنل رفرال (غیرفعال‌سازی اکشن‌های تغییردهنده همراه با بنر شفاف بدون شکست نشست).
> 2. **پایان جستجوی کور با `User ID` عددی (Zero Blind-ID Friction):**  
>    در هیچ کجای پنل رفرال (شجره‌نامه، لیست سیاه، اعطای پاداش خزانه‌داری، تسویه) ادمین نباید مجبور به حفظ و تایپ شناسه عددی کاربر باشد. تمام ورودی‌های کاربر به جستجوی هوشمند (Autocomplete / Omnibox) بر اساس `نام کاربری`، `نام کامل`، `موبایل`، `کد رفرال`، `کد ملی` و `ID` مجهز می‌شوند و کاربران در تمام جداول با کلیک مستقیم قابل بازرسی در شجره‌نامه هستند.
> 3. **معماری سه‌بعدی رهگیری زنجیره رفرال (3-Angle Referral Chain Tracer):**  
>    رهگیری باید سه منطق واقعی سیستم را به وضوح تفکیک و تصویرسازی کند:  
>    - **عضو عادی (`active`):** دریافت درصد پلکانی لایه (`10.5%`, `5.25%`, ...).  
>    - **عضو مخفی (`is_referral_hidden` / Pass-Through):** عبور از گره در آبشار و جایگزینی درصد توسط معرف‌های بالاتر.  
>    - **عضو روح‌شده (`is_referral_blocked` / Ghosted):** ماندن گره در ساختار لایه‌ها ولی انتقال مستقیم سهم آن لایه به **صندوق کل (`ReferralTreasuryPool`)**.  
>    این اطلاعات در سه نمای مکمل نمایش داده می‌شوند: (۱) **شجره‌نامه تعاملی چندسطحی + مسیر بالادست + کشوی بازرسی نود**، (۲) **ردیاب آبشار مالی پورسانت یک سفارش (`Order Waterfall Trace` + شبیه‌ساز `Dry-Run`)**، و (۳) **جدول ریشه‌محور زنجیره‌ها با صفحه‌بندی سرورساید و هشدارهای ضدتقلب (`Anomaly Flags`)**.
> 4. **سیستم طراحی واحد، دسترسی‌پذیری و سازگاری RTL/Persian:**  
>    استفاده یکسان از `useTranslation()` (`price`, `n`, `d`) در تمام صفحات دپارتمان، اعداد با `tabular-nums` و `dir="ltr"` روی مبالغ و شماره‌های شبا/کارت/ولت به همراه دکمه کپی یک‌کلیک، سیستم Toast شناور به‌جای بنرهای ایستای بالا، مودال تایید اختصاصی به‌جای `window.confirm`، کنتراست استاندارد متن روی دکمه‌ها و کارت‌های موبایل‌پسند.

---

## ۱. جدول ماتریس ارتقا و بازطراحی پنل ادمین رفرال

| بخش | وضعیت فعلی و نقاط ضعف | وضعیت نهایی در گام بیست و هشتم | فایل‌ها و اندپوینت‌های هدف |
| :---: | :--- | :--- | :--- |
| **زیرساخت و گارد دسترسی** | ریدایرکت اشتباه `apiClient.ts` به `/admin/login` روی `401/403`؛ نبود چک `read_only` در اکثر صفحات؛ رنگ `purple` هاردکد؛ نبود Toast | جداسازی `401` و `403` در `apiClient.ts`، گارد `read_only` سراسری، سیستم Toast شناور، پالت هم‌خوان `rose` در Layout/Login/Staff و افزودن ویرایش همکار + مودال حذف | `frontend/src/lib/apiClient.ts`<br>`frontend/src/components/admin/*` |
| **میز فرماندهی (Overview)** | فقط ۳ کارت با آمار نادرست (`?status=PENDING` روی لیست و `.total` نامعتبر)؛ بدون خزانه، معوقه و بلک‌لیست | اندپوینت واحد `GET /overview` با ۶ KPI زنده، شمارشگر تسویه جمعه، روند بچ‌های اخیر و صف اقدامات فوری (برداشت‌ها و حساب‌های منتظر تایید) | `backend/app/modules/admin/routers/referral_router.py`<br>`frontend/src/app/(admin)/admin/referral/page.tsx` |
| **رهگیری زنجیره و لیست سیاه** | جدایی `chains` (مسطح ۵۰تایی بدون صفحه بعدی) و `tree` (فقط ID عددی و عمق ۱ لایه)؛ نبود ردیابی پورسانت سفارش | صفحه یکپارچه **«شبکه، شجره‌نامه و لیست سیاه»**: Omnibox جستجو، لیست ریشه‌های برتر، درخت چندسطحی Lazy-Load، Upline Trail، کشوی عملیات نود، ردیاب آبشار خرید (`Order Trace` + `Dry-Run`)، و جدول ریشه‌محور با هشدارهای ضدتقلب | `frontend/src/app/(admin)/admin/referral/chains/page.tsx`<br>`frontend/src/app/(admin)/admin/referral/tree/page.tsx`<br>`backend/app/modules/wallet/settlement_service.py`<br>`backend/app/modules/admin/routers/referral_router.py` |
| **مرکز تسویه پورسانت (`settlement`)** | تکرار عین جدول در مودال Dry-Run؛ تاریخچه بچ غیرکلیک‌پذیر؛ نبود انتخاب گروهی و فیلتر ذی‌نفعان | حذف مودال تکراری Dry-Run، افزودن سرچ/مرتب‌سازی/انتخاب چندتایی (`release-selected`)، و Drawer جزئیات هر بچ متصل به `GET /settlement/batches/{batch_code}` | `frontend/src/app/(admin)/admin/referral/settlement/page.tsx`<br>`backend/app/modules/wallet/settlement_service.py` |
| **درخواست‌های برداشت (`payouts`)** | باگ مرگبار `PUT`/`COMPLETED` در مقابل `POST`/`approved` + باگ روتر بک‌اند؛ مخفی بودن شماره شبا/کارت/ولت در UI؛ وضعیت‌های حروف بزرگ اشتباه | اصلاح روتر بک‌اند و فرانت، فیلتر وضعیتی و سرچ سرورساید، نمایش کامل حساب مقصد + کپی سریع + موبایل کاربر + لینک فیش | `backend/app/modules/admin/routers/referral_router.py`<br>`backend/app/modules/admin/services.py`<br>`frontend/src/app/(admin)/admin/referral/payouts/page.tsx` |
| **حساب‌های بانکی (`accounts`)** | جدول مرده بدون سرچ/فیلتر/صفحه‌بندی و بدون دکمه تایید/رد حساب | صفحه‌بندی و فیلتر سرورساید، نمایش مالکیت و کدملی/موبایل، `dir="ltr"` + کپی، و اندپوینت + دکمه‌های تایید/رد حساب (`verify`) | `backend/app/modules/admin/routers/referral_router.py`<br>`frontend/src/app/(admin)/admin/referral/accounts/page.tsx` |
| **خزانه‌داری (`treasury`)** | تایپ دستی `User ID` عددی؛ ورودی مبلغ خام بدون فرمت خوانا؛ نبود فیلتر لاگ | Autocomplete کاربر، فرمت سه‌رقمی مبلغ حین تایپ، فیلتر نوع تراکنش لاگ خزانه و لینک به بازرسی کاربر | `frontend/src/app/(admin)/admin/referral/treasury/page.tsx`<br>`backend/app/modules/admin/routers/referral_router.py` |

---

## ۲. طراحی و قرارداد APIهای بک‌اند (`/api/admin-referral`)

### ۲.۱. اصلاحات بحرانی در برداشت‌ها و حساب‌های تسویه
1. **رفع باگ `POST /api/admin-referral/payouts/{request_id}/process`:**
   - در [`referral_router.py`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/admin/routers/referral_router.py#L353-L372) فراخوانی باید با آرگومان‌های صحیح انجام شود:
     `AdminService.process_payout_request(db, request_id, payload.new_status, payload.admin_receipt_url, payload.admin_notes)`
     و لاگ `AdminAuditLog` باید `details={"new_status": payload.new_status, "admin_receipt_url": payload.admin_receipt_url, "admin_notes": payload.admin_notes}` ثبت کند.
   - در [`ProcessPayoutRequest`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/admin/schemas.py#L105-L109) مقادیر مجاز استاندارد `"approved" | "rejected"` است (و می‌توان برای سازگاری بازگشتی مقادیر `COMPLETED`/`REJECTED` را نیز در `model_validator` یا فرانت نرمال‌سازی کرد).
2. **ارتقای `GET /api/admin-referral/payouts`:**
   - افزودن پارامترهای کوئری `status_filter: Optional[str]` (`pending`, `approved`, `rejected`, `all`)، `search: Optional[str]` (جستجو روی نام، یوزرنیم، موبایل، شبا، شماره کارت)، `page: int = 1`، `limit: int = 25`.
   - خروجی `{ items, total, page, page_size, summary: { pending_count, pending_amount_toman, approved_count, rejected_count } }` شامل فیلدهای کامل کاربر و حساب (`user_username`, `user_name`, `user_phone`, `account_type`, `account_holder`, `bank_name`, `sheba_number`, `card_number`, `crypto_wallet_address`, `crypto_network`, `admin_receipt_url`, `admin_notes`, `processed_at`).
3. **ارتقای `GET /api/admin-referral/settlement-accounts` و افزودن تایید/رد حساب:**
   - افزودن `page`, `limit`, `search` (نام، یوزرنیم، موبایل، کدملی، شبا، کارت، ولت), `verified_filter` (`all` | `verified` | `pending`), `account_type` (`all` | `bank_iran` | `crypto`).
   - جوین با جدول `users` برای برگرداندن `username`, `user_full_name`, `user_phone` در کنار `account_holder`, `national_code`, `is_verified`, `is_active` در قالب `{ items, total, page, page_size }`.
   - افزودن اندپوینت **`PUT /api/admin-referral/settlement-accounts/{account_id}/verify`** با بدنه `VerifyAccountRequest` (`is_verified: bool`) متصل به [`AdminService.verify_settlement_account`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/modules/admin/services.py#L261-L270) با قید `require_referral_admin(level=AdminAccessLevel.FULL_CRUD)` و ثبت `AdminAuditLog` (`action="VERIFY_SETTLEMENT_ACCOUNT"`).

### ۲.۲. داشبورد نمای کلی (`GET /api/admin-referral/overview`)
برگرداندن یکباره و دقیق متریک‌های عملیاتی دپارتمان رفرال:
```json
{
  "metrics": {
    "pending_commissions_toman": 12500000,
    "pending_beneficiaries_count": 18,
    "pending_transactions_count": 64,
    "next_settlement_date": "2026-11-20T23:59:59+00:00",
    "pending_payouts_count": 5,
    "pending_payouts_amount_toman": 4200000,
    "unverified_accounts_count": 3,
    "total_accounts_count": 47,
    "treasury_balance_toman": 8500000,
    "treasury_total_collected_toman": 15200000,
    "treasury_total_distributed_toman": 6700000,
    "total_chains_count": 340,
    "active_blacklist_count": 4
  },
  "recent_pending_payouts": [...],
  "recent_pending_accounts": [...],
  "recent_batches": [...]
}
```

### ۲.۳. اندپوینت‌های جستجو و رهگیری سه‌بعدی زنجیره رفرال (Chain Tracer)
1. **جستجوی سراسری کاربر (`GET /api/admin-referral/users/search?q=...&limit=15`):**
   - جستجو با `ILIKE` یا تطبیق عددی روی `User.id`, `User.username`, `User.full_name`, `User.phone`, `User.referral_code` و `SettlementAccount.national_code` / `ReferralBlacklist.blocked_national_code`.
   - بازگشت: `[{ id, username, full_name, phone, referral_code, is_referral_hidden, is_referral_blocked, is_subscription_banned, has_referrer }]`.
2. **فهرست ریشه‌های برتر شبکه (`GET /api/admin-referral/tree/roots?page=1&limit=15`):**
   - پیدا کردن کاربرانی که در `referral_chains` زیرمجموعه ثبت می‌کنند اما خودشان `referrer` ندارند (Root Users)، همراه با تعداد زیرمجموعه‌های مستقیم (`direct_downlines_count`)، کل زیرمجموعه‌های زیرشاخه (`total_subtree_count`)، وضعیت اشتراک، مجموع پورسانت کسب‌شده، و وضعیت `hidden`/`blocked`.
3. **ارتقای درخت کاربر و Lazy-Loading لایه‌های عمیق:**
   - **`GET /api/admin-referral/tree/{user_id}`:** علاوه بر اطلاعات فعلی `user`, `wallet`, `uplines` و `direct_downlines`:
     - اضافه شدن `effective_layer` و `nominal_share_percent` روی `uplines` (برای شفاف‌سازی تاثیر `is_referral_hidden` در عبور آبشار).
     - اضافه شدن `direct_children_count`, `total_subtree_count`, `has_active_subscription`, `contributed_commission_toman`, `pending_commission_toman` و `anomaly_flags` برای هر گره زیرمجموعه.
     - اضافه شدن `settlement_accounts`، وضعیت `active_blacklist`، و ۵ خرید اخیر این کاربر (`recent_orders`) برای پر کردن کشوی بازرسی بدون نیاز به درخواست اضافه.
   - **`GET /api/admin-referral/tree/{user_id}/children?page=1&limit=50`:** بازگرداندن زیرمجموعه‌های مستقیم یک نود با همان متادیتای درخت (`direct_children_count`, وضعیت بلاک/مخفی/اشتراک، پورسانت تولیدی و `anomaly_flags`) برای باز کردن بی‌نهایت لایه در درخت UI بدون بارگذاری یکجای هزاران نود.
4. **ردیابی مالی آبشار سفارش (`GET /api/admin-referral/orders/{order_payment_id}/trace` و `GET /api/admin-referral/commissions/recent-orders`):**
   - لیست آخرین سفارش‌های دارای پورسانت در `/commissions/recent-orders?user_id=...&limit=20` برای انتخاب سریع بدون تایپ ID سفارش.
   - در `/orders/{order_payment_id}/trace`: استخراج `OrderPayment` و خریدار، بودجه کل ۲۱٪، کل مسیر بالادست واقعی خریدار در لحظه بررسی (همراه با مشخص کردن نودهای `hidden` که Bypass شده‌اند) و تمام ردیف‌های واقعی `CommissionLedger` ثبت‌شده برای آن `order_payment_id` (سهم هر لایه، مبلغ تومانی، وضعیت `pending`/`settled`، `settlement_batch_id`، و ردیف‌های منتقل‌شده به خزانه بابت `ghosted_referral_divert` یا `deposit_leftover` یا نداشتن اشتراک).
5. **شبیه‌ساز مسیر پورسانت قبل از خرید (`GET /api/admin-referral/tree/{user_id}/simulate-waterfall?amount_toman=1000000`):**
   - شبیه‌سازی بدون تغییر دیتابیس (Read-Only): نمایش گام‌به‌گام اینکه اگر کاربر `user_id` الان یک اشتراک به مبلغ `amount_toman` بخرد، با توجه به فلگ‌های فعلی `is_referral_hidden` و `is_referral_blocked` و `require_active_subscription`، دقیقاً چه کسی در هر لایه چقدر دریافت می‌کند و چه مبلغی به خزانه می‌رود.
6. **ارتقای `GET /api/admin-referral/chains` و `GET /api/admin-referral/blacklist`:**
   - افزودن `search: Optional[str]` و `status_filter: Optional[str]` (`all`, `blocked`, `hidden`, `banned`, `anomaly`).
   - محاسبه **ریشه زنجیره (`root_user_id`, `root_username`)** و **عمق از ریشه (`depth_from_root`)** برای هر سطر زنجیره تا مدیر بفهمد پیوند مربوط به کدام درخت اصلی است.
   - محاسبه `anomaly_flags` ساده و واقعی (مانند `"blocked_in_chain"`، `"many_inactive_downlines"` اگر کاربری >= ۵ زیرمجموعه مستقیمِ فاقد خرید/اشتراک داشته باشد، یا `"zero_commission_cluster"`).
   - در `GET /api/admin-referral/blacklist`: افزودن `search: Optional[str]` روی نام، یوزرنیم، موبایل، کدملی و دلیل مسدودسازی.

### ۲.۴. بهبود بخش تسویه (`settlement`)
- افزودن **`POST /api/admin-referral/settlement/release-selected`** با بدنه `{ "user_ids": [1, 2, 3] }` برای آزادسازی گروهی چند کاربر انتخاب‌شده در یک بچ واحد (`SELECT-SETTLE-...`) با قید `FULL_CRUD` و ثبت `AdminAuditLog`.
- افزودن `search` و `sort_by` در پیش‌نمایش یا سمت سرویس (`preview_weekly_settlement`) همراه با مرتب‌سازی پیش‌فرض نزولی بر اساس `pending_amount_toman` (بیشترین مبلغ در صدر جدول).

---

## ۳. معماری جدید رابط کاربری و تجربه کاربری (UI/UX Redesign Specs)

### ۳.۱. ساختار ناوبری و چیدمان سایدبار (`frontend/src/app/(admin)/admin/referral/layout.tsx`)
ناوبری با گروه‌بندی منطقی به ۶ بخش شفاف (حذف شلوغی و نام‌گذاری‌های گمراه‌کننده):
1. **نمای کلی و هشدارها** (`/admin/referral`)
2. **شبکه، شجره‌نامه و لیست سیاه** (`/admin/referral/tree` — صفحه اصلی رهگیری با تب‌های «کاوشگر درختی و آبشار»، «فهرست ریشه‌محور زنجیره‌ها» و «لیست سیاه»؛ مسیر `/admin/referral/chains` نیز با تب پیش‌فرض `directory` یا `blacklist` به همین تجربه یکپارچه متصل/هم‌تراز می‌شود تا لینک‌های قبلی نشکنند)
3. **آزادسازی پورسانت‌های معوق** (`/admin/referral/settlement`)
4. **درخواست‌های واریز (شبا و تتر)** (`/admin/referral/payouts`)
5. **تایید حساب‌های بانکی و ولت** (`/admin/referral/accounts`)
6. **خزانه‌داری و پاداش‌ها** (`/admin/referral/treasury`)
7. **مدیریت پرسنل دپارتمان** (`/admin/referral/staff`)

*(نکته معماری: نگه‌داشتن روت `/admin/referral/chains` با کامپوننت مشترک یا لینک مستقیم به تب‌های زنجیره/لیست سیاه باعث می‌شود تست‌ها و بوکمارک‌های قبلی گام ۲۷ هم بدون خطا کار کنند.)*

### ۳.۲. اجزای مشترک و سیستم طراحی واحد
1. **سیستم طراحی یکپارچه (`frontend/src/components/admin/referral/`):**
   - کامپوننت **`ReferralUserSearchInput`**: فیلد جستجوی debounce‌شده (۲۵۰ میلی‌ثانیه) متصل به `/admin-referral/users/search` با نمایش آواتار حروفی، `@username`، نام کامل، موبایل و بج وضعیت بلاک/مخفی.
   - کامپوننت **`CopyableValue`**: نمایش اعداد مالی، شبا (`IR...`)، شماره کارت و آدرس ولت با `dir="ltr"`، `tabular-nums` و دکمه کپی تک‌کلیک همراه با فیدبک «کپی شد».
   - کامپوننت **`ReadOnlyGuardBanner`** و هوک/کانتکست **`useReferralAdminGuard()`**: دریافت یک‌بار پروفایل ادمین در سطح دپارتمان و اشتراک‌گذاری `isReadOnly` بین همه صفحات رفرال بدون تکرار کوئری.
   - کامپوننت **`AdminToastContainer`**: اعلان‌های Toast شناور گوشه صفحه (پایین‌چپ در RTL) برای تمام خطاها و موفقیت‌ها علاوه بر دسترسی مستقیم، به‌جای بنرهایی که با اسکرول گم می‌شوند.
   - **تم رنگی هماهنگ:** پاس دادن `accentColor` (برای رفرال: `rose`) به [`DepartmentLayout.tsx`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/admin/DepartmentLayout.tsx)، [`DepartmentLoginPage.tsx`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/admin/DepartmentLoginPage.tsx) و [`DepartmentStaffManager.tsx`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/admin/DepartmentStaffManager.tsx) تا `purple` هاردکد حذف شود؛ افزودن دکمه ویرایش اطلاعات/دسترسی همکار (`PUT /staff/{id}`) و مودال تایید اختصاصی به‌جای `window.confirm` در مدیریت پرسنل.

### ۳.۳. طراحی صفحه به صفحه

#### ۱) داشبورد میز فرماندهی (`/admin/referral/page.tsx`)
- ۶ کارت KPI خوانا با `useTranslation().price/n` و اسکلت لودینگ:
  1. پورسانت‌های معوقه آماده تسویه (مبلغ + تعداد کاربر + شمارشگر جمعه آینده)
  2. درخواست‌های برداشت در انتظار واریز (تعداد + جمع مبلغ به تومان)
  3. حساب‌های بانکی در انتظار تایید
  4. موجودی فعلی صندوق خزانه‌داری (به همراه کل واریز و توزیع)
  5. کل پیوندهای شبکه رفرال
  6. کاربران فعال در لیست سیاه
- دو پنل عملیاتی کنار هم: **«صف اقدامات فوری»** (آیتم‌های Pending برداشت و تایید حساب با دکمه مستقیم رفتن به جزئیات) و **«آخرین بچ‌های تسویه هفتگی»**.

#### ۲) مرکز رهگیری زنجیره رفرال، شجره‌نامه و لیست سیاه (`tree` + `chains`)
دارای هدر ثابت با جستجوی سراسری **Omnibox** و ۳ تب اصلی:
- **تب اول: کاوشگر درختی چندسطحی و آبشار مالی (`Explorer`)**
  - در حالت خالی (قبل از جستجو): نمایش جدول/کارت‌های **«ریشه‌های برتر شبکه (Top Roots)»** برای ورود با یک کلیک به درخت‌های اصلی پلتفرم.
  - پس از انتخاب کاربر:
    1. **نوار مسیر بالادست (Upline Breadcrumb Trail):** نمایش افقی ریشه تا کاربر فعلی با خطوط اتصال و بج رنگی وضعیت (`🟢 عادی`, `🟡 مخفی Pass-Through` با خط نقطه‌چینِ جهش، `🔴 روح‌شده -> خزانه`, `⚫ تحریم اشتراک`).
    2. **درخت چندسطحی بازشونده (Expandable Multi-Depth RTL Tree-Grid):** نمایش لایه‌های زیرمجموعه با خطوط سلسله‌مراتبی عمودی/افقی؛ هر نودی که زیرمجموعه دارد با کلیک فلش، لایه بعدی را به صورت Lazy-Load در همان جا باز می‌کند، به همراه ستون‌های اشتراک فعال، پورسانت تولیدی، وضعیت رفرال و برچسب ضدتقلب (`Anomaly Badge`).
    3. **بخش پایینی/جداگانه «ردیاب آبشار مالی سفارش (Commission Waterfall Tracer)»:** انتخاب از لیست آخرین خریدهای زیرمجموعه یا وارد کردن شماره `order_payment_id` برای دیدن دقیق تقسیم ۲۱٪ به تفکیک لایه‌ها + ردیف‌های خزانه؛ به علاوه کلید **«شبیه‌سازی خرید فرضی روی این کاربر (Dry-Run)»** با مبلغ دلخواه.
  - **کشوی بازرسی نود (Node Inspector Slide-Over Drawer):** با کلیک روی هر گره در بالادست یا درخت، کشویی در سمت چپ باز می‌شود شامل: خلاصه پروفایل، موجودی‌های کیف پول، حساب‌های تسویه، خریدهای اخیر، دکمه باز کردن شجره‌نامه با محوریت این گره، و **۳ اکشن مستقیم دارای مودال تایید**:
    - مسدودسازی / روح‌کردن دوتیکه (همان مودال استاندارد گام ۲۷) یا رفع مسدودیت در صورت بلاک‌بودن
    - تغییر وضعیت پنهان‌سازی (`Pass-Through`) **با مودال تایید شفاف و توضیح تغییر درصد بالادست**
    - رفع تعویق آنی پورسانت‌های معوقه همین کاربر
- **تب دوم: فهرست زنجیره‌ها و شاخص‌های تقلب (`Directory`)**
  - جستجو و فیلتر سرورساید (`همه` / `دارای عضو روح‌شده` / `دارای عضو مخفی` / `مشکوک به تقلب`) + صفحه‌بندی کامل (`Pagination`).
  - نمایش ستون‌های **زیرمجموعه**، **معرف مستقیم**، **ریشه درخت و عمق لایه**، **پرچم‌های هشدار**، و اکشن‌های هوشمند (اگر کاربر قبلاً بلاک است به‌جای دکمه تکراری «مسدودسازی»، دکمه «مدیریت/مشاهده در لیست سیاه» و دکمه «باز کردن در شجره‌نامه» نشان داده شود).
- **تب سوم: لیست سیاه (`Blacklist`)**
  - همان لیست کامل کاربران بلک‌لیست با جستجو و صفحه‌بندی سرورساید + **دکمه جدید «افزودن کاربر به لیست سیاه»** در بالای تب (با استفاده از `ReferralUserSearchInput`) تا مدیر بتواند حتی کاربرانی که در زنجیره بالایی لیست نیستند را مستقیم مسدود کند.

#### ۳) مرکز آزادسازی پورسانت‌ها (`/admin/referral/settlement/page.tsx`)
- حذف مودال تکراری Dry-Run؛ تبدیل باکس اصلی به **صف آماده‌تسویه هوشمند** شامل:
  - جستجو در ذی‌نفعان + مرتب‌سازی (بیشترین مبلغ / بیشترین تراکنش)
  - چک‌باکس انتخاب تکی و گروهی در کنار دکمه‌های **«رفع تعویق تک کاربر»**، **«تسویه موارد انتخاب‌شده (Selected)»** و **«تسویه سراسری (همه)»** — هر سه با مودال تایید استاندارد و کنتراست صحیح (`text-white` روی `bg-emerald-600`).
- **تاریخچه بچ‌ها با کشوی جزئیات (`Batch Details Drawer`):** با کلیک روی هر ردیف تاریخچه، `GET /admin-referral/settlement/batches/{batch_code}` فراخوانی شده و لیست دقیق تمام دریافت‌کنندگان، مبالغ و سفارش‌های داخل آن بچ نمایش داده می‌شود.

#### ۴) پرداخت‌های برداشت (`/admin/referral/payouts/page.tsx`) و تایید حساب‌ها (`/admin/referral/accounts/page.tsx`)
- **درخواست‌های برداشت (`payouts`):** تب فیلتر (`در انتظار بررسی` / `تایید و واریزشده` / `ردشده` / `همه`)، باکس جستجو، صفحه‌بندی، نمایش کامل اطلاعات مقصد واریز (`بانک + شبا / کارت` یا `شبکه + آدرس تتر`) و نام/موبایل کاربر با `CopyableValue`، اتصال قطعی به `POST /payouts/{id}/process` با `approved`/`rejected`، و قفل‌کردن دکمه بررسی برای موارد غیرمعلق (همراه با قابلیت مشاهده فیش/توضیحات ثبت‌شده برای موارد بسته‌شده).
- **حساب‌های بانکی و ولت (`accounts`):** تب فیلتر (`در انتظار تایید` / `تاییدشده` / `بانکی` / `کریپتو`)، جستجو، صفحه‌بندی، نمایش `@username` + نام کامل + موبایل + کدملی + شبا/کارت/ولت با `CopyableValue`، و دکمه‌های **تایید حساب / لغو تایید** متصل به `PUT /settlement-accounts/{id}/verify` (با مودال تایید و محافظ `read_only`).

#### ۵) خزانه‌داری (`/admin/referral/treasury/page.tsx`)
- جایگزینی فیلد عددی `User ID` با `ReferralUserSearchInput`.
- ورودی مبلغ پاداش با نمایش زنده فرمت سه‌رقمی خوانا و پیش‌نمایش مانده خزانه پس از اعطا.
- فیلتر نوع رویداد در جدول لاگ‌ها (`همه` / `واریز مانده` / `پاداش ادمینی` / `انتقال از روح‌شدن` / `ریست`).

---

## ۴. آدرس‌دهی دقیق فایل‌ها (Explicit File Paths)

### ۴.۱. فایل‌های جدید
1. `frontend/src/components/admin/referral/AdminToast.tsx`
2. `frontend/src/components/admin/referral/ReferralUserSearchInput.tsx`
3. `frontend/src/components/admin/referral/CopyableValue.tsx`
4. `frontend/src/components/admin/referral/NodeInspectorDrawer.tsx`
5. `frontend/src/components/admin/referral/CommissionWaterfallPanel.tsx`
6. `frontend/src/components/admin/referral/BlacklistModals.tsx`
7. `backend/tests/test_referral_admin_redesign.py`

### ۴.۲. فایل‌های ویرایشی
- **بک‌اند:**
  1. `backend/app/modules/admin/schemas.py`
  2. `backend/app/modules/admin/services.py`
  3. `backend/app/modules/admin/routers/referral_router.py`
  4. `backend/app/modules/wallet/settlement_service.py`
- **فرانت‌اند:**
  5. `frontend/src/lib/apiClient.ts`
  6. `frontend/src/types/referral.ts`
  7. `frontend/src/components/admin/DepartmentLayout.tsx`
  8. `frontend/src/components/admin/DepartmentLoginPage.tsx`
  9. `frontend/src/components/admin/DepartmentStaffManager.tsx`
  10. `frontend/src/app/(admin)/admin/referral/layout.tsx`
  11. `frontend/src/app/(admin)/admin/referral/page.tsx`
  12. `frontend/src/app/(admin)/admin/referral/tree/page.tsx`
  13. `frontend/src/app/(admin)/admin/referral/chains/page.tsx`
  14. `frontend/src/app/(admin)/admin/referral/settlement/page.tsx`
  15. `frontend/src/app/(admin)/admin/referral/payouts/page.tsx`
  16. `frontend/src/app/(admin)/admin/referral/accounts/page.tsx`
  17. `frontend/src/app/(admin)/admin/referral/treasury/page.tsx`

---

## ۵. تست‌ها و تضمین کیفیت (Quality Assurance)
1. تست کامل اندپوینت‌های جدید و باگ‌فیکس‌ها در `backend/tests/test_referral_admin_redesign.py`:
   - پردازش موفق تایید و رد برداشت (`POST /payouts/{id}/process`) و بازگشت وجه به کیف پول در حالت `rejected`
   - تایید و رد حساب بانکی (`PUT /settlement-accounts/{id}/verify`) + فیلتر و صفحه‌بندی
   - بررسی ادمین `read_only` (دریافت `403` در عملیات نوشتاری روی روت‌های جدید)
   - جستجوی کاربر، لیست ریشه‌ها، Lazy-Load زیرشاخه‌های چندلایه، ردیابی آبشار سفارش واقعی و شبیه‌ساز `Dry-Run` با لحاظ `hidden` و `blocked`
   - تسویه گروهی انتخاب‌شده (`release-selected`) و آمار `GET /overview`
2. اجرای دستورات تست و بیلد در کانتینرها پس از پیاده‌سازی:
   ```bash
   docker exec drgame-backend pytest -v tests/test_referral_blacklist.py tests/test_referral_admin_redesign.py
   docker exec drgame-backend pytest -q
   docker exec drgame-frontend npx tsc --noEmit
   docker exec drgame-frontend npm run build
   ```

</div>
