<div dir="rtl" lang="fa">

# 🛡️ دستورالعمل اجرایی گام بیست و ششم: مهاجرت امنیتی احراز هویت به کوکی‌های HttpOnly، رفع خطای بیلد استاتیک Next.js و اصلاح باگ‌های کلیدی پلتفرم (26-core-security-cookie-auth-and-critical-bugfixes)

> **شماره گام:** ۲۶  
> **عنوان مرحله:** مهاجرت کامل سیستم احراز هویت توکن‌های JWT از LocalStorage به کوکی‌های امن HttpOnly و SameSite، رفع خطای کرش بیلد استاتیک Next.js (رفع ارور Context در RootLayout)، اصلاح باگ ۴۰۴ دانلود DLC در همگام‌ساز کاتالوگ، اصلاح باگ پرداخت مضاعف پاداش‌های خزانه‌داری در سرویس کیف پول، هماهنگ‌سازی متدهای روت پشتیبانی ادمین، اصلاح هدرهای استریم بازه‌ای IDM و پاکسازی کرون‌جاب‌های منسوخ زمان‌بندی‌شده.  
> **وابستگی‌ها:** گام‌های ۰۲، ۱۷، ۱۸، ۲۰، ۲۱، ۲۳ و ۲۴  
> **ماژول‌های درگیر:** `auth`, `catalog_sync`, `wallet`, `admin`, `games`, `tasks` و کلاینت فرانت‌اند `frontend/src`  

---

> [!IMPORTANT]
> **اصول و الزامات تخطی‌ناپذیر معماری گام بیست و ششم (Core Inviolable Mandates):**
> 1. **اصل امنیت سخت‌گیرانه وب (OWASP Strict Cookie Security):**  
>    هیچ توکن دسترسی (`access_token`) یا توکن رفرش (`refresh_token`) نباید در جاوااسکریپت یا `localStorage` مرورگر کلاینت در معرض سرقت از طریق حملات XSS قرار گیرد. تمام توکن‌ها باید به صورت کوکی‌های امن با ویژگی‌های `HttpOnly`، `SameSite=Lax` (یا `Strict`)، `Secure` (در پروداکشن) و `Path=/` توسط سرور در زمان لاگین/رجیستر ست شوند و در زمان خروج با `Max-Age=0` منقضی گردند.
> 2. **پشتیبانی دوطرفه و بدون شکست در لایه بک‌اند (Dual Token Extraction):**  
>    وابستگی `get_current_user` باید ابتدا وجود توکن را در کوکی درخواست (`request.cookies.get("access_token")`) بررسی کند؛ در صورت عدم وجود، جهت حفظ سازگاری ۱۰۰٪ با تست‌های خودکار پایتون (Pytest)، اسکریپت‌های CLI، یا کلاینت‌های مستقل موبایل/کنسول، از هدر استاندارد `Authorization: Bearer <token>` استفاده نماید.
> 3. **پایداری فرآیند بیلد استاتیک Next.js (Build Stability Mandate):**  
>    فراخوانی توابع پویای سرور مانند `cookies()` در کامپوننت ریشه `RootLayout` (`frontend/src/app/layout.tsx`) در Next.js 14 منجر به خطای بحرانی `TypeError: Cannot read properties of null (reading 'useContext')` در حین پیش‌رندرینگ ۶۰ مسیر استاتیک می‌شود. این فراخوانی باید حذف شده و وضعیت احراز هویت اولیه به صورت سالم در لایه ارائه‌دهنده سمت کلاینت یا اندپوینت امن سشن مدیریت شود تا دستور `npm run build` بدون هیچ خطایی با موفقیت اجرا گردد.
> 4. **تطبیق صددرصدی قراردادهای API و شناسه‌های پایگاه داده:**  
>    در دانلود محتواهای دانلودی (DLC)، شناسه‌های خارجی پایگاه‌های داده第三方 (مانند IGDB ID) نباید به عنوان کلید داخلی استریم فایل در نظر گرفته شوند؛ فقط شناسه کلید اصلی پایگاه داده دکتر گیم (`GameDownloadFile.id`) معتبر است.
> 5. **یکپارچگی و سلامت تراکنش‌های مالی (Ledger Integrity):**  
>    هرگونه پاداش یا کمیسیون آنی که به موجودی کیف پول کاربر واریز می‌شود باید بلافاصله با وضعیت `settlement_status="settled"` علامت‌گذاری شود تا در تسویه‌حساب‌های دوره‌ای و هفتگی، مجدداً محاسبه و پرداخت نگردد.

---

## ۱. جدول ماتریس عیب‌یابی و نیازمندی‌های گام بیست و ششم

| ردیف | حوزه / ماژول | شرح باگ یا کاستی امنیتی | فایل و خطوط مرتبط | راه‌حل اجرایی و قطعی |
| :---: | :--- | :--- | :--- | :--- |
| **۱** | **امنیت احراز هویت (Auth & Cookies)** | توکن‌های JWT در `localStorage` فرانت‌اند ذخیره می‌شوند و کوکی‌های ست‌شده فاقد فلگ امنیتی `HttpOnly` هستند که ریسک سرقت توکن از طریق XSS را دارد. | `frontend/src/lib/authTokens.ts`<br>`frontend/src/stores/useAuthStore.ts`<br>`backend/app/modules/auth/router.py` | تنظیم هدرهای `Set-Cookie` برای `access_token` و `refresh_token` با فلگ `HttpOnly` و `SameSite=Lax` در پاسخ‌های لاگین، رجیستر و رفرش توکن. پاک‌سازی کوکی‌ها در لاگ‌اوت. اصلاح وابستگی بک‌اند برای خواندن از کوکی و هدر به صورت همزمان. |
| **۲** | **فرانت‌اند Next.js (Build Blocker)** | اجرای دستور `npm run build` با خطای `Cannot read properties of null (reading 'useContext')` در تمام صفحات استاتیک متوقف می‌شود به علت استفاده از `cookies()` در روت لی‌اوت سرور. | `frontend/src/app/layout.tsx:45` | حذف فراخوانی مسدودکننده `cookies()` از ریشه `RootLayout` و واگذاری آگاهی از وضعیت سشن به کامپوننت احراز هویت کلاینت یا تزریق کانتکست بدون شکست رندرهای استاتیک. |
| **۳** | **کاتالوگ بازی‌ها (DLC 404 Bug)** | لینک دانلود DLC بازی‌ها در متد `enrich_game_with_dlcs` به اشتباه با شناسه خارجی IGDB (`dlc_id`) تولید می‌شود که در هنگام استریم با خطای ۴۰۴ مواجه می‌گردد. | `backend/app/modules/catalog_sync/services.py:739` | استفاده از شناسه واقعی رکورد ذخیره‌شده در پایگاه داده (`dlc_file.id`) در آدرس‌دهی `/api/games/{game_id}/downloads/{dlc_file.id}/stream`. |
| **۴** | **کیف پول و رفرال (Double Payout)** | در متد واریز پاداش آنی خزانه‌داری رفرال، رکورد دفترکل بدون وضعیت تسویه ذخیره می‌شود و در پایان هفته کرون‌جاب تسویه مجدداً آن را پرداخت می‌کند! | `backend/app/modules/wallet/services.py:129-137` | تنظیم صریح `settlement_status="settled"` و `settled_at=now` در هنگام ایجاد رکورد `CommissionLedger` پاداش خزانه‌داری. |
| **۵** | **پنل ادمین پشتیبانی (Route Mismatch)** | فرانت‌اند برای تغییر وضعیت کاربر متد `PATCH /admin-support/users/{id}/status` را فراخوانی می‌کند در حالی که روتر اندپوینت متفاوتی دارد. | `backend/app/modules/admin/routers/support_router.py` | افزودن متد `PATCH` در کنار `PUT` در روتر پشتیبانی ادمین با مسیر دقیق مورد انتظار فرانت‌اند. |
| **۶** | **استریم دانلود IDM (Range Header)** | در پاسخ `206 Partial Content` هدر `Content-Length` باید دقیقا برابر اندازه تکه درخواست‌شده (`end - start + 1`) باشد تا دانلودمنیجرها سرعت و پیشرفت را درست نشان دهند. | `backend/app/modules/games/router.py:377` | محاسبه دقیق `content_length` بر اساس بازه بایتی رنج و تنظیم صحیح هدرهای `Content-Range` و `Content-Length`. |
| **۷** | **کرون‌جاب‌ها (Obsolete RAWG & Settlement)** | در اسکلر کرون‌جاب، متد منسوخ‌شده سینک RAWG هر روز فراخوانی می‌شود در حالی که تسویه هفتگی رفرال در کرون قرار ندارد. | `backend/app/tasks/scheduler.py` | حذف تسک روزانه `RAWGSyncService.sync_top_games` و افزودن کرون‌جاب هفتگی `WeeklySettlementService.execute_weekly_settlement` برای اجرا در جمعه‌ها. |

---

## ۲. مستندات تفصیلی معماری و پیاده‌سازی

### ۲.۱. معماری احراز هویت امن مبتنی بر کوکی‌های HttpOnly
- **بک‌اند (`backend/app/modules/auth/`):**
  - در اندپوینت‌های `POST /api/auth/login`, `POST /api/auth/register/verify`, و `POST /api/auth/refresh`:
    علاوه بر بازگرداندن مدل `TokenResponse` (جهت حفظ سازگاری رترواکتیو)، متغیر `response.set_cookie` با پارامترهای زیر اجرا می‌شود:
    ```python
    # Access Token Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,  # در حالت پروداکشن به True تغییر می‌یابد
        path="/",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    # Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/api/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )
    ```
  - در اندپوینت `POST /api/auth/logout`:
    کوکی‌ها باید با متد `response.delete_cookie(key="access_token", path="/")` و `response.delete_cookie(key="refresh_token", path="/api/auth")` پاک شوند.
  - در وابستگی `get_current_user` (`backend/app/modules/auth/dependencies.py`):
    استخراج توکن به صورت هوشمند:
    ```python
    token = request.cookies.get("access_token")
    if not token and authorization:
        scheme, _, param = authorization.partition(" ")
        if scheme.lower() == "bearer":
            token = param
    ```
- **فرانت‌اند (`frontend/src/`):**
  - در `frontend/src/lib/apiClient.ts` و فراخوانی‌های `fetch`:
    افزودن `credentials: "include"` به تمام درخواست‌ها تا مرورگر کوکی‌های امن HttpOnly را به طور خودکار به سرور بفرستد.
  - در `frontend/src/stores/useAuthStore.ts` و `frontend/src/lib/authTokens.ts`:
    حذف ذخیره مقادیر توکن در `localStorage` و عدم نوشتن توکن‌های خام در کوکی‌های کلاینت. استور کلاینت تنها اطلاعات پروفایل کاربر (`user`) و وضعیت لاگین (`isAuthenticated: boolean`) را در حافظه نگه می‌دارد.

### ۲.۲. اصلاح خطای بیلد استاتیک Next.js (`layout.tsx`)
- در `frontend/src/app/layout.tsx`:
  - خط ۴۵ که شامل `const cookieStore = cookies();` است را حذف نموده یا متغیرهای مربوط به زبان و سشن را با رویکرد بدون مسدودسازی رندرهای استاتیک (بدون تبدیل کل اپلیکیشن به داینامیک) بازنویسی نمایید.
  - هدف نهایی: دستور `npm run build` در کانتینر `drgame-frontend` باید کدهای استاتیک تمام ۶۰ مسیر را بدون پرتاب استثنای کانتکست کامپایل نماید.

### ۲.۳. رفع باگ ۴۰۴ دانلود DLC در کاتالوگ بازی‌ها
- در فایل `backend/app/modules/catalog_sync/services.py:739`:
  - کد فعلی:
    ```python
    download_url = f"/api/games/{game.id}/downloads/{dlc_id}/stream"
    ```
  - کد اصلاح‌شده:
    پس از ایجاد یا بازیابی آبجکت `dlc_file` در جدول `GameDownloadFile`:
    ```python
    download_url = f"/api/games/{game.id}/downloads/{dlc_file.id}/stream"
    ```
  - این کار تضمین می‌کند که کلاینت فرانت‌اند در جعبه دانلود، روی دکمه DLC که کلیک می‌کند شناسه معتبر دیتابیسی را درخواست کند و سرور با خطای ۴۰۴ مواجه نشود.

### ۲.۴. رفع باگ پرداخت مضاعف پاداش خزانه‌داری در کیف پول
- در فایل `backend/app/modules/wallet/services.py:129-137`:
  - متد `award_treasury_instant_commission`:
    از آنجا که پاداش خزانه‌داری فوراً به `withdrawable_balance_toman` اضافه می‌شود، رکورد لجر آن باید فوراً با وضعیت تسویه‌شده ذخیره شود:
    ```python
    ledger_entry = CommissionLedger(
        referrer_id=referrer_id,
        referred_id=buyer_id,
        order_id=order_id,
        commission_amount_toman=amount_toman,
        settlement_status="settled",
        settled_at=datetime.now(timezone.utc),
        notes="Instant treasury bonus"
    )
    ```
  - این کار مانع از آن می‌شود که در پایان هفته، متد `WeeklySettlementService.execute_weekly_settlement` این رکوردها را دوباره تسویه کند.

### ۲.۵. هماهنگ‌سازی اندپوینت تغییر وضعیت کاربر در پنل پشتیبانی
- در فایل `backend/app/modules/admin/routers/support_router.py`:
  - افزودن مسیر:
    ```python
    @router.patch("/users/{user_id}/status")
    @router.put("/users/{user_id}/status")
    async def toggle_user_status(user_id: int, payload: UserStatusUpdateSchema, ...):
        ...
    ```
  - این امر ناسازگاری مسیرهای فراخوانی فرانت‌اند با بک‌اند را کاملاً برطرف می‌سازد.

### ۲.۶. تصحیح هدرهای استریم رنج IDM
- در فایل `backend/app/modules/games/router.py`:
  - در متد `stream_direct_game_download`، در متد `HEAD` و `GET` در حالت `Range`:
    - `content_length = end - start + 1`
    - هدر `Content-Range: bytes {start}-{end}/{total_size}`
    - هدر `Content-Length: str(content_length)`
  - این کار هماهنگی استانداردهای HTTP 206 را برای تمامی دانلودمنیجرها تضمین می‌کند.

### ۲.۷. اصلاح زمان‌بند کرون‌جاب‌های پس‌زمینه
- در فایل `backend/app/tasks/scheduler.py`:
  - حذف جاب منسوخ `RAWGSyncService.sync_top_games`.
  - افزودن جاب تسویه هفتگی:
    ```python
    scheduler.add_job(
        WeeklySettlementService.execute_weekly_settlement,
        CronTrigger(day_of_week="fri", hour=0, minute=0),
        id="weekly_referral_settlement",
        name="Weekly Referral Settlement",
        replace_existing=True,
    )
    ```

---

## ۳. آدرس‌دهی دقیق فایل‌ها (Explicit File Paths)

### ۳.۱. فایل‌های ویرایشی در بک‌اند:
1. `backend/app/modules/auth/router.py`
2. `backend/app/modules/auth/dependencies.py`
3. `backend/app/modules/catalog_sync/services.py`
4. `backend/app/modules/wallet/services.py`
5. `backend/app/modules/admin/routers/support_router.py`
6. `backend/app/modules/games/router.py`
7. `backend/app/tasks/scheduler.py`

### ۳.۲. فایل‌های ویرایشی در فرانت‌اند:
1. `frontend/src/lib/authTokens.ts`
2. `frontend/src/stores/useAuthStore.ts`
3. `frontend/src/lib/apiClient.ts`
4. `frontend/src/app/layout.tsx`

### ۳.۳. فایل‌های تست جدید:
1. `backend/tests/test_cookie_auth.py`
2. `backend/tests/test_step26_fixes.py`

---

## ۴. الزامات آزمون و تضمین کیفیت (Quality Assurance)

1. **اجرای تست‌های پایتون در کانتینر داکر:**
   ```bash
   docker exec drgame-backend pytest -v tests/test_cookie_auth.py tests/test_step26_fixes.py
   ```
2. **بررسی عدم خطای رگرسیون در کل تست‌های بک‌اند:**
   ```bash
   docker exec drgame-backend pytest -q
   ```
   (تمام تست‌های موجود باید پاس شوند).
3. **تست بیلد کامل فرانت‌اند:**
   ```bash
   docker exec drgame-frontend npm run build
   ```
   (دستور باید با Exit Code 0 و تولید موفق صفحات استاتیک پایان یابد).

</div>
