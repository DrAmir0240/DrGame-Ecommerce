# گزارش ممیزی بخش‌های ماک و APIهای پیاده‌سازی‌نشده

**پروژه:** DrGame Ecommerce
**تاریخ بررسی:** ۲۹ اکتبر ۲۰۲۶
**دامنه بررسی:** `frontend/src` (Next.js) ↔ `backend/app` (FastAPI)

---

## خلاصه اجرایی

پروژه از نظر ساختار کلی (روتینگ، احراز هویت، کاتالوگ، اشتراک، کیف پول، تیکت، بلاگ، پنل ادمین) تقریباً کامل است و اکثر صفحات به API واقعی وصل شده‌اند. اما **۷ نقطه بحرانی** وجود دارد که در آن‌ها منطق تجاری اصلی به‌جای اجرای واقعی، شبیه‌سازی (mock) شده یا اصلاً به بک‌اند وصل نیست.

| # | موضوع | شدت | اثر |
|---|---|---|---|
| 1 | کسر سهمیه دانلود واقعی نیست (لینک مستقیم بدون فراخوانی API) | 🔴 بحرانی | دور زدن کامل مدل درآمدی |
| 2 | سیستم ۵ نوع فایل دانلود به UI و پنل ادمین وصل نیست | 🔴 بحرانی | تب‌های چیت/DLC/زیرنویس/دوبله همیشه خالی |
| 3 | پاسخ به تیکت کاربر با ۴۰۴ شکست می‌خورد | 🔴 بحرانی | عدم امکان گفتگوی پشتیبانی |
| 4 | OTP پیامکی واقعی ارسال نمی‌شود (کد در ریسپانس برمی‌گردد) | 🔴 بحرانی | حفره امنیتی |
| 5 | OTP حساب تسویه کاملاً جعلی و قابل دور زدن | 🔴 بحرانی | برداشت پول با هویت جعلی |
| 6 | درگاه پرداخت شبیه‌سازی‌شده | 🔴 بحرانی | اشتراک بدون پرداخت واقعی |
| 7 | احراز هویت شاهکار جعلی (همیشه verified=True) | 🔴 بحرانی | نقض KYC |
| 8 | مدت ۳/۶ ماهه در checkout اعمال نمی‌شود | 🟠 بالا | اختلاف مالی با کاربر |
| 9 | پاسخ کد تخفیف ناقص (`discount_percent`/`message` ندارد) | 🟠 بالا | نمایش «undefined٪» |
| 10 | فیلترهای URL صفحه بازی‌ها نادیده گرفته می‌شوند | 🟠 بالا | همه لینک‌های «مشاهده همه» خراب |
| 11 | فیلتر لایه رفرال بی‌اثر است | 🟡 متوسط | نمایش نادرست لایه‌ها |
| 12 | داده نمایشی `SAMPLE_STATS` در صفحه رفرال | 🟡 متوسط | نمایش اعداد ساختگی |
| 13 | کران اعلانات انقضا/سهمیه هرگز اجرا نمی‌شود | 🟠 بالا | فیچر مرده |
| 14 | ابزار جیلبریک کاملاً ماک | 🟡 متوسط | صفحه بدون پشتوانه فنی |

---

## بخش الف — ماک‌های کامل (منطق ساختگی، بدون اجرای واقعی)

### 1. کسر سهمیه دانلود واقعی نیست 🔴

**فایل:** `frontend/src/components/games/DownloadConfirmModal.tsx` (خطوط ۴۸–۷۵)

```ts
const handleConfirmDownload = async () => {
  // Trigger native browser download
  const a = document.createElement('a');
  a.href = link.download_url;          // ← لینک مستقیم، بدون API
  ...
  setTimeout(() => { fetchQuota(); }, 1000);   // ← فقط رفرش نمایشی
};
```

- هیچ فراخوانی به `POST /api/games/{game_id}/downloads/{file_id}/generate` انجام نمی‌شود.
- این اندپوینت در بک‌اند کامل پیاده‌سازی شده است (`backend/app/modules/games/router.py:141`) و وظیفه‌اش: بررسی پلن، کسر آنی سهمیه، ثبت در `UserDownloadHistory` و صدور لینک امضاشده یک‌بارمصرف است.
- نتیجه: **کاربر می‌تواند بی‌نهایت دانلود کند و سهمیه‌اش هرگز کم نمی‌شود.** همچنین تاریخچه دانلود (`/users/me/downloads`) هرگز پر نمی‌شود.

**اصلاح:** `handleConfirmDownload` باید ابتدا `POST /games/{gameId}/downloads/{link.id}/generate` را صدا بزند و از `download_url` بازگشتی استفاده کند.

---

### 2. سیستم ۵ نوع فایل دانلود به UI و ادمین وصل نیست 🔴

سه ناسازگاری هم‌زمان:

**الف) `GameDetailOut` از جدول قدیمی می‌خواند**

`backend/app/modules/games/services.py:163` لینک‌ها را از جدول `game_download_links` می‌خواند و به `GameDownloadLinkOut` نگاشت می‌کند (`games/schemas.py:42-49`) که فقط این فیلدها را دارد:
`id, part_number, part_name, file_size_gb, download_url`

اما فرانت (`DownloadBox.tsx`) انتظار `file_type` و `required_tier` دارد:

```ts
// DownloadBox.tsx:88-100 — مجبور به حدس زدن نوع فایل از روی نام
if (l.file_type) { return l.file_type.toLowerCase() === tab; }
const name = (l.part_name || '').toLowerCase();
if (tab === 'cheat') return name.includes('cheat') || name.includes('trainer');
```

```ts
// DownloadBox.tsx:196-197 — همه فایل‌ها «طلایی» برچسب می‌خورند
const getTierBadge = (tier?: string) => {
  const t = (tier || 'gold').toLowerCase();   // ← همیشه undefined → gold
```

**ب) جدول جدید `game_download_files` هیچ API مدیریتی ندارد**

- مدل: `backend/app/modules/games/download_models.py:8` (فیلدهای `file_type`, `allowed_tiers`, `title`)
- اسکیمای ایجاد: `GameDownloadFileCreate` در `games/schemas.py:103` **تعریف شده ولی هیچ‌جا استفاده نمی‌شود**
- هیچ اندپوینت `POST/PUT/DELETE` برای این جدول وجود ندارد (نه در `games/router.py` نه در `admin/router.py`).
- نتیجه: **رکوردی در `game_download_files` ساخته نمی‌شود** → تب‌های «چیت و ترینر»، «DLC»، «زیرنویس فارسی»، «دوبله اختصاصی» همیشه پیام «هنوز فایلی بارگذاری نشده» را نشان می‌دهند.

**ج) اندپوینت‌های موجود هرگز صدا زده نمی‌شوند**

| اندپوینت | وضعیت |
|---|---|
| `GET /api/games/{id}/downloads` | پیاده‌سازی شده، **۰ فراخوانی از فرانت** |
| `POST /api/games/{id}/downloads/{file_id}/generate` | پیاده‌سازی شده، **۰ فراخوانی** |
| `POST /api/quota/callback/consume` | webhook برای «سرور دانلود» که در ریپو وجود ندارد |

**د) پنل ادمین هم سیستم قدیمی را مدیریت می‌کند**

`frontend/src/app/(admin)/admin/games/page.tsx:214-215` فقط `part_number` / `part_name` / `download_url` می‌سازد — بدون `file_type` و بدون `allowed_tiers`. یعنی حتی از طریق ادمین هم نمی‌توان فایل ۵ نوعه ثبت کرد.

**اصلاح پیشنهادی:**
1. `GameDetailOut` را به `List[GameDownloadFileOut]` تغییر دهید (یا فیلد جدید `download_files` اضافه کنید).
2. اندپوینت‌های ادمین `POST/PUT/DELETE /api/admin/games/{id}/download-files` بسازید.
3. تب‌های `DownloadBox` را با `file_type` و `allowed_tiers` واقعی فیلتر کنید و `required_tier` را حذف کنید.

---

### 3. پاسخ به تیکت کاربر ۴۰۴ می‌دهد 🔴

**فایل:** `frontend/src/components/tickets/TicketConversationModal.tsx:93`

```ts
const sent = await apiRequest<TicketMessage>(`/tickets/me/${ticketId}/messages`, {
  method: 'POST',
  body: JSON.stringify({ message: newMessage.trim() }),
});
```

**بک‌اند:** مسیر واقعی `POST /api/tickets/me/{ticket_id}/reply` است (`tickets/router.py:86`). مسیر `/messages` وجود ندارد.

**نتیجه:** کاربر با کلیک «ارسال پاسخ» خطای ۴۰۴ می‌گیرد و گفتگوی تیکت عملاً یک‌طرفه می‌ماند.

**اصلاح:** یک‌خطی — تغییر `/messages` به `/reply`.

---

### 4. OTP پیامکی واقعی ارسال نمی‌شود 🔴

**بک‌اند:** `backend/app/modules/auth/router.py:47-52`

```python
code = await AuthService.generate_and_save_otp(redis, payload.target)
# In production, send SMS/Email via external gateway. In development/testing, return simulated notice.
return MessageResponse(
    message="کد تایید ۶ رقمی با موفقیت ارسال شد.",
    detail=f"DEBUG_CODE: {code}"   # ← کد در پاسخ HTTP برگردانده می‌شود
)
```

**فرانت:** `components/auth/AuthModal.tsx:71-73` همان کد را مستقیماً به کاربر نشان می‌دهد:

```ts
if (res.detail) { setSimulatedNotice(res.detail); }
```

**همچنین:** `backend/app/modules/auth/identity_service.py:36` → `logger.info(f"🔑 [MOCK OTP] ...")`

**ریسک:** هر کسی با داشتن شماره/ایمیل یک کاربر می‌تواند با خواندن `DEBUG_CODE` از ریسپانس، حساب او را تصاحب کند.

**اصلاح:** اتصال به یک پنل SMS (کاوه‌نگار/ملی‌پیامک) یا SMTP، حذف فیلد `detail` از ریسپانس در محیط production.

---

### 5. OTP حساب تسویه کاملاً جعلی و قابل دور زدن 🔴

**فایل:** `frontend/src/components/referral/SettlementAccountsModal.tsx`

```ts
// خطوط 74-79 — ارسال OTP با setTimeout، بدون هیچ درخواست شبکه‌ای
setIsOtpSending(true);
setTimeout(() => {
  setIsOtpSending(false);
  setOtpStep('otp');
  setSuccessMsg('کد اعتبارسنجی تستی پیامک شد (کد پیش‌فرض: 123456)');
}, 700);
```

```ts
// خط 86 — منطق معیوب: هر کد ۵ رقمی و بیشتر قبول می‌شود
if (otpCode !== '123456' && otpCode.length < 5) {
  setError('کد اعتبارسنجی وارد شده صحیح نمی‌باشد.');
  return;
}
```

```ts
// خطوط 98-104 — کد ملی و موبایل و OTP اصلاً به سرور ارسال نمی‌شوند
const payload = {
  account_type: 'bank_iran',
  sheba_number: shebaNumber.trim(),
  card_number: cardNumber.trim() || undefined,
  account_holder: accountHolder.trim(),
  bank_name: bankName.trim() || undefined,
};
```

**نکته مهم:** اندپوینت `POST /api/referral/send-otp` در بک‌اند وجود دارد (`wallet/router.py:25`) ولی **هرگز فراخوانی نمی‌شود**. اسکیمای `SettlementAccountCreate` هم فیلدهای `national_code`, `phone`, `otp_code` را می‌پذیرد که ارسال نمی‌شوند.

**ریسک:** هر کاربر می‌تواند با یک شبا/کارت دلخواه و هویت جعلی حساب تسویه ثبت کند و درخواست برداشت بدهد.

**اصلاح:** فراخوانی واقعی `/referral/send-otp`، اعتبارسنجی سمت سرور، ارسال `national_code` + `phone` + `otp_code` در payload.

---

### 6. درگاه پرداخت شبیه‌سازی‌شده 🔴

- `frontend/src/app/(store)/checkout/page.tsx:88` → `payment_method: 'simulation'`
- `backend/app/modules/subscriptions/router.py:77` → «Process **simulated** checkout»
- `backend/app/modules/subscriptions/models.py:72` → `default="simulation"` با کامنت `# "simulation", "zarinpal", "crypto_usdt"`

هیچ کد اتصال به زرین‌پال، آیدی‌پی، یا درگاه کریپتو وجود ندارد. کاربر با یک کلیک، بدون پرداخت، اشتراک فعال می‌گیرد.

**اصلاح:** پیاده‌سازی `PaymentGateway` interface + پیاده‌سازی زرین‌پال، callback تأیید، و درگاه شبیه‌سازی فقط برای `ENVIRONMENT=development`.

---

### 7. احراز هویت شاهکار جعلی 🔴

**فایل:** `backend/app/modules/auth/identity_service.py:71-96`

```python
"""Mock identity verification simulating Iranian Shahkar / Central Bank matching."""
if not national_code or len(national_code.strip()) != 10 ...:
    raise BadRequestException("کد ملی ۱۰ رقمی نامعتبر است.")
...
return {
    "verified": True,              # ← همیشه True
    "provider": "mock_shahkar",
    "message": "اطلاعات هویتی با سامانه شاهکار ... تطبیق داده شد.",
}
```

فقط طول کد ملی چک می‌شود؛ هیچ تطبیق نام/کد ملی/شماره موبایل انجام نمی‌شود. این تابع در `wallet/services.py:446` برای تأیید حساب تسویه استفاده می‌شود.

---

### 8. ابزار جیلبریک کنسول کاملاً ماک 🟡

**فایل:** `frontend/src/app/(store)/tools/jailbreak/page.tsx:12-26`

```ts
const handleLaunchJailbreak = () => {
  setIsInjecting(true);
  setLogs(['[+] در حال بارگذاری پی‌لود اختصاصی دکتر گیم...']);
  setTimeout(() => { setLogs(prev => [...prev, '[+] آسیب‌پذیری هسته شناسایی شد...']); }, 1200);
  setTimeout(() => { setLogs(prev => [...prev, '[+] پی‌لود با موفقیت اجرا گردید...']); setIsInjecting(false); setInjectionSuccess(true); }, 2800);
};
```

- کل فرآیند «تزریق GoldHEN» با دو `setTimeout` و لاگ‌های متنی ثابت شبیه‌سازی شده است.
- هیچ API بک‌اندی وجود ندارد (نه در `main.py` ثبت شده، نه ماژولی دارد).
- IPهای DNS در خطوط ۶۴ و ۷۱ هاردکد شده‌اند.

**تصمیم لازم:** یا این صفحه به یک سرویس واقعی (هاست پی‌لود + لاگ سرور) وصل شود، یا صراحتاً به‌عنوان صفحه راهنما/آموزشی بازنویسی شود و دکمه «جیلبریک» حذف گردد.

---

## بخش ب — بخش‌هایی که UI دارد ولی API بک‌اند وجود ندارد

| # | قابلیت | فایل UI | API موجود؟ | توضیح |
|---|---|---|---|---|
| 1 | مدیریت فایل‌های ۵ نوعه دانلود | `admin/games/page.tsx` | ❌ | `GameDownloadFileCreate` تعریف شده ولی اندپوینت CRUD ندارد |
| 2 | حذف حساب تسویه | `SettlementAccountsModal.tsx` | ❌ | نه UI دارد نه `DELETE /referral/settlement-accounts/{id}` |
| 3 | دانلود PDF فاکتور | `InvoiceModal.tsx:30-31` | ❌ | فقط `window.print()`؛ بدون API تولید PDF سمت سرور |
| 4 | تب‌های صفحه پروفایل (ویش‌لیست) | `app/page.tsx:90` → `/profile?tab=wishlist` | ❌ | صفحه پروفایل هیچ `useSearchParams` یا تبی ندارد |
| 5 | تنظیمات پویا (DNS کنسول، متن بنر) | `Header.tsx:78`, `tools/jailbreak/page.tsx:64,71` | ❌ | IP هاردکد؛ API تنظیمات سایت وجود ندارد |
| 6 | آواتار کاربر | `AvatarPicker.tsx:7-14` | ❌ | ۶ عکس Unsplash هاردکد؛ آپلود/گالری آواتار در بک‌اند نیست |
| 7 | ترجمه چندزبانه محتوا | `lib/translationEngine.ts` | ❌ | دیکشنری ثابت ~۳۰ عبارت؛ API ترجمه یا فیلدهای `_en/_ar` برای محتوا وجود ندارد |
| 8 | نظرات/کامنت بلاگ | `blog/[id]/page.tsx` | ❌ | فقط لایک/دیس‌لایک دارد، بخش کامنت ندارد |
| 9 | بستن تیکت توسط کاربر | `dashboard/tickets/page.tsx` | ⚠️ | اندپوینت `PATCH /tickets/me/{id}/close` هست، UI ندارد |
| 10 | آمار تیکت کاربر | `dashboard/tickets/page.tsx` | ⚠️ | `GET /tickets/me/stats` هست، استفاده نمی‌شود |

---

## بخش ج — APIهای بک‌اند که فرانت به آن‌ها وصل نشده (Dead Endpoints)

| اندپوینت | فایل | وضعیت |
|---|---|---|
| `GET /api/games/{id}/downloads` | `games/router.py:132` | ۰ فراخوانی |
| `POST /api/games/{id}/downloads/{file_id}/generate` | `games/router.py:141` | ۰ فراخوانی |
| `POST /api/referral/send-otp` | `wallet/router.py:25` | ۰ فراخوانی (به‌جایش `setTimeout`) |
| `POST /api/quota/callback/consume` | `quota/router.py:30` | فقط در تست؛ «سرور دانلود» خارجی وجود ندارد |
| `PATCH /api/tickets/me/{id}/close` | `tickets/router.py:104` | ۰ فراخوانی |
| `GET /api/tickets/me/stats` | `tickets/router.py:46` | ۰ فراخوانی |
| `POST /api/auth/refresh` | `auth/router.py:85` | ۰ فراخوانی (توکن منقضی → logout اجباری) |
| `run_expiry_and_quota_reminder_job` | `core/cron/expiry_reminder.py` | هیچ scheduler آن را صدا نمی‌زند |

**نکته درباره کران:** فایل `expiry_reminder.py` کامل نوشته شده (اعلان ۳ روز مانده به انقضا + اعلان سهمیه زیر ۱۰٪)، `apscheduler==3.10.4` در `requirements.txt` هست، اما **هیچ‌جا scheduler ثبت نشده** (نه در `main.py`، نه `docker-compose.dev.yml`). یعنی اعلان‌های خودکار هرگز تولید نمی‌شوند و صفحه «اعلانات» فقط اعلان‌های دستی ادمین را نشان می‌دهد.

---

## بخش د — ناسازگاری قرارداد (باعث خطای واقعی در UI می‌شود)

### 1. مدت اشتراک ۳/۶ ماهه در پرداخت اعمال نمی‌شود 🟠

- `TierCard.tsx:269` → `/checkout?tier=bronze&duration=3`
- `checkout/page.tsx:15` → `const tierCode = searchParams.get('tier') || 'silver';` — **`duration` خوانده نمی‌شود**
- بک‌اند: `CheckoutRequest.duration_months` پیش‌فرض `1` (`subscriptions/schemas.py:51`)

**نتیجه:** کاربر قیمت ۳ یا ۶ ماهه را می‌بیند، ولی فقط ۱ ماه اشتراک می‌خرد.

**اصلاح:** `const duration = Number(searchParams.get('duration')) || 1;` و ارسال `duration_months: duration` در body.

### 2. پاسخ کد تخفیف ناقص است 🟠

| فرانت انتظار دارد (`checkout/page.tsx:267`) | بک‌اند برمی‌گرداند (`subscriptions/schemas.py:43-47`) |
|---|---|
| `discountResult.message` | ❌ ندارد |
| `discountResult.discount_percent` | ❌ ندارد |
| `discount_amount`, `final_price`, `code`, `valid` | ✅ دارد |

**نتیجه:** پیام موفقیت به شکل `(undefined٪ تخفیف اعمال شد)` با متن خالی نمایش داده می‌شود.

### 3. فیلترهای URL صفحه بازی‌ها نادیده گرفته می‌شوند 🟠

همه این لینک‌ها به کاتالوگ **بدون فیلتر** می‌رسند چون `games/page.tsx` هیچ `useSearchParams` ندارد:

| لینک | منبع |
|---|---|
| `/games?sort=newest` | `app/page.tsx:99` |
| `/games?is_two_player=true` | `app/page.tsx:110` |
| `/games?genre=action` (و ۱۰ ژانر دیگر) | `app/page.tsx:119` … `200` |
| `/games?has_vr=true` | `app/page.tsx:207` |
| `/games?tier=free` | `TierCard.tsx:169` |

**اصلاح:** مقداردهی اولیه `filters` از `searchParams` در `useEffect` اول.

### 4. فیلتر لایه رفرال بی‌اثر است 🟡

- فرانت: `referral/page.tsx:46-50` → `&layer=1|2|3`
- بک‌اند: `wallet/router.py:43-51` فقط `page` و `page_size` می‌پذیرد → پارامتر `layer` بی‌صدا نادیده گرفته می‌شود.

**نتیجه:** انتخاب «لایه ۲» یا «لایه ۳» همان لیست لایه ۱ را نشان می‌دهد.

### 5. فیلدهای اضافی در `CheckoutResponse` (کم‌اهمیت)

فرانت `tracking_code` و `final_amount_irr` می‌خواند (`checkout/page.tsx:155,167`) که در `CheckoutResponse` نیستند و با fallback نمایش داده می‌شوند.

---

## بخش ه — دیتای هاردکد شده در UI

### 1. صفحه جزئیات بازی — `app/(store)/games/[id]/page.tsx`

| خط | مقدار هاردکد | توضیح |
|---|---|---|
| 137 | `playtimeEstimate = Math.round(download_size_gb > 60 ? 25 : 18)` | «زمان بازی» از حجم فایل حدس زده می‌شود |
| 506 | «منبع زمان بازی: HowLongToBeat» | منبع جعلی |
| 361 | fallback `'Sony Interactive Entertainment'` | توسعه‌دهنده ساختگی |
| 364 | fallback `'PlayStation Studios'` | ناشر ساختگی |
| 446 | `game.metacritic \|\| 86` | امتیاز ساختگی |
| 458, 514 | `ESRB Teen` / `ESRB Teen (+16)` | مدل `Game` فیلد `esrb` ندارد |
| 461 | `Blood • Violence • Language` | محتوای ساختگی |
| 471 | «بازخورد لمسی DualSense: پشتیبانی می‌شود» | همیشه True |
| 486 | «بازی آنلاین: پشتیبانی می‌شود (تا ۴ نفر)» | تعداد بازیکن ساختگی |
| 403-418 | «افتخارات استودیو» — دو متن ثابت | بدون منبع |
| 548 | fallback توضیحات داستان | متن ثابت |

**اصلاح:** افزودن فیلدهای `esrb_rating`, `playtime_hours`, `supports_dualsense`, `online_players` به مدل `Game` + مایگریشن + فرم ادمین. تا آن زمان این ردیف‌ها باید حذف یا با «ثبت نشده» جایگزین شوند.

### 2. کارت اشتراک — `components/subscriptions/TierCard.tsx`

| خط | مقدار هاردکد |
|---|---|
| 182 | fallback قیمت `698000` |
| 282 | fallback قیمت `1198000` |
| 381 | fallback قیمت `2988000` |
| 213, 313, 412 | «۲۰ / ۲۰ / ۴۰ مگابیت» — به `tier.speed_limit_mbps` وصل نیست |
| 221-247 | لیست پلتفرم‌های برنز (PS4/PS5) متن ثابت |
| 321-347 | لیست پلتفرم‌های نقره‌ای متن ثابت |
| 420-446 | لیست پلتفرم‌های طلایی متن ثابت |
| 235 (checkout) | `concurrent_downloads \|\| (code === 'gold' ? 5 : ...)` |

بک‌اند `allowed_platforms`, `speed_limit_mbps`, `allow_themes` را برمی‌گرداند ولی UI از آن‌ها استفاده نمی‌کند.

### 3. سایر موارد هاردکد

| فایل | خط | مورد |
|---|---|---|
| `components/games/FilterSidebar.tsx` | 51-60 | `TOP_GENRES` — ۸ ژانر ثابت، در حالی که `/games/genres?only_top8=true` وجود دارد |
| `components/profile/AvatarPicker.tsx` | 7-14 | ۶ URL عکس Unsplash با نام شخصیت‌های سونی |
| `components/layout/Header.tsx` | 78 | IP ثابت `165.227.83.145` |
| `app/(store)/tools/jailbreak/page.tsx` | 64, 71 | دو IP DNS ثابت |
| `app/(store)/checkout/page.tsx` | 220 | «۳۰ روز کامل» ثابت (حتی برای ۳/۶ ماهه) |
| `app/(store)/checkout/page.tsx` | 235 | fallback تعداد دانلود همزمان |
| `app/(dashboard)/referral/page.tsx` | 71-80 | `SAMPLE_STATS` — اعداد ساختگی (۱٬۸۵۰٬۰۰۰ تومان، ۱۴ زیرمجموعه) برای کاربر لاگین‌نشده |

**نمونه `SAMPLE_STATS`:**

```ts
const SAMPLE_STATS: ReferralStats = {
  referral_code: 'DRGAME-VIP',
  withdrawable_balance_toman: 1850000,
  total_earned_toman: 4850000,
  total_withdrawn_toman: 3000000,
  direct_referrals_count: 14,
  active_subscriptions_count: 9,
};
const activeStats = stats || SAMPLE_STATS;   // ← نمایش برای کاربر مهمان
```

---

## بخش و — کد مرده و ماک‌های بلااستفاده

| فایل | وضعیت |
|---|---|
| `frontend/src/components/home/HeroShowcase.tsx` | کامپوننت کامل با `HERO_SLIDES` هاردکد — **هیچ‌جا import نشده**. باید حذف شود. |
| `backend/app/modules/games/schemas.py:103` | `GameDownloadFileCreate` — بدون مصرف‌کننده |
| `backend/app/core/cron/expiry_reminder.py` | تابع کامل، بدون scheduler |
| `backend/app/modules/games/models.py:69` | `GameDownloadLink` (جدول قدیمی) هنوز موازی با `GameDownloadFile` استفاده می‌شود |
| `backend/requirements.txt:15` | `apscheduler` نصب شده ولی استفاده نشده |
| `frontend/src/lib/translationEngine.ts` | ادعای «۱۰ زبان» — در عمل دیکشنری ثابت؛ هر متن خارج از دیکشنری به فارسی می‌ماند |

---

## بخش ز — اولویت‌بندی پیشنهادی اقدامات

### P0 — قبل از هر انتشار (۱–۲ روز)

1. `TicketConversationModal.tsx:93` → `/messages` را به `/reply` تغییر دهید. *(۵ دقیقه)*
2. `DownloadConfirmModal.tsx` → فراخوانی `POST /games/{gameId}/downloads/{link.id}/generate` قبل از باز کردن لینک. *(نیم روز)*
3. حذف `detail=f"DEBUG_CODE: {code}"` از `auth/router.py:49` و اتصال پنل SMS. *(نیم روز + خرید پنل)*
4. `SettlementAccountsModal.tsx` → فراخوانی واقعی `/referral/send-otp`، اصلاح شرط `otpCode.length < 5`، ارسال `national_code`/`phone`/`otp_code`. *(نیم روز)*

### P1 — قبل از انتشار تجاری (۳–۵ روز)

5. پیاده‌سازی CRUD ادمین برای `game_download_files` + تغییر `GameDetailOut` به `GameDownloadFileOut`. *(۲ روز)*
6. ارسال `duration_months` از checkout. *(۲ ساعت)*
7. افزودن `discount_percent` و `message` به `DiscountValidateResponse`. *(۱ ساعت)*
8. مقداردهی اولیه فیلترها از `searchParams` در `games/page.tsx`. *(۲ ساعت)*
9. اتصال `apscheduler` در `lifespan` برای `expiry_reminder`. *(نیم روز)*
10. اتصال درگاه پرداخت واقعی (زرین‌پال) با callback تأیید. *(۲–۳ روز)*

### P2 — بهبود کیفیت (۲–۳ روز)

11. افزودن فیلدهای `esrb_rating`, `playtime_hours`, `supports_dualsense`, `online_players` به مدل `Game` و حذف مقادیر ثابت صفحه جزئیات.
12. اتصال `TierCard` به `speed_limit_mbps` و `allowed_platforms`.
13. اتصال `FilterSidebar` به `/games/genres?only_top8=true`.
14. حذف `SAMPLE_STATS`، `HERO_SLIDES`، `TOP_GENRES` و آواتارهای Unsplash.
15. پیاده‌سازی آپلود آواتار یا حذف `AvatarPicker`.
16. افزودن `layer` به `GET /referral/transactions` یا حذف فیلتر از UI.

---

## پیوست — جدول کامل تطبیق اندپوینت‌ها

### ✅ منطبق (فرانت ↔ بک‌اند)

`/auth/*`, `/users/me`, `/users/profile`, `/users/change-password`, `/users/sessions`, `/users/me/downloads`, `/users/me/notifications`, `/users/me/payments`, `/games`, `/games/genres`, `/games/genres/list`, `/games/wishlist`, `/games/{id}`, `/games/{id}/similar`, `/games/{id}/like`, `/games/{id}/dislike`, `/games/{id}/wishlist`, `/blog/categories`, `/blog/posts`, `/blog/posts/{id}`, `/subscriptions/tiers`, `/subscriptions/my-status`, `/subscriptions/free-tier-games`, `/quota/me`, `/referral/stats`, `/referral/transactions`, `/referral/settlement-accounts`, `/referral/withdraw`, `/tickets/me`, `/tickets/me/{id}`, `/admin/auth/*`, `/admin/stats`, `/admin/users`, `/admin/users/{id}`, `/admin/users/{id}/adjust-quota`, `/admin/games`, `/admin/games/{id}`, `/admin/games/upload-image`, `/admin/games/cache-image`, `/admin/free-tier-games`, `/admin/subscriptions`, `/admin/subscription-tiers`, `/admin/discounts`, `/admin/payouts`, `/admin/payouts/{id}/process`, `/admin/bank-accounts/{id}/verify`, `/admin/referrals`, `/admin/genres`, `/admin/tickets`, `/admin/tickets/{id}/reply`, `/admin/tickets/{id}/status`, `/home/banners`, `/home/admin/banners`

### ❌ نامنطبق

| فرانت | بک‌اند | نتیجه |
|---|---|---|
| `POST /tickets/me/{id}/messages` | `POST /tickets/me/{id}/reply` | ۴۰۴ |
| `GET /referral/transactions?layer=N` | پارامتر `layer` ندارد | نادیده گرفته می‌شود |
| `POST /subscriptions/checkout` بدون `duration_months` | پیش‌فرض `1` | مدت اشتباه |
| انتظار `discount_percent` / `message` | برنمی‌گردد | `undefined٪` |

---

*این گزارش بر اساس خواندن مستقیم کد فرانت‌اند و بک‌اند در تاریخ ۲۹ اکتبر ۲۰۲۶ تهیه شده است. شماره خطوط ممکن است با تغییرات بعدی جابه‌جا شوند.*
