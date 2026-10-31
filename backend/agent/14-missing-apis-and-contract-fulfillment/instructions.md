<div dir="rtl" lang="fa">

# 🚀 دستورالعمل اجرایی گام چهاردهم: پیاده‌سازی APIهای تکمیلی، تکمیل قراردادها و رفع باگ‌های سیستمی (14-missing-apis-and-contract-fulfillment)

> **شماره گام:** ۱۴  
> **عنوان مرحله:** پیاده‌سازی اندپوینت‌های گمشده بک‌اند بر اساس سند حسابرسی `AUDIT_MOCKS_AND_MISSING_APIS.md`، اصلاح باگ محاسباتی ۱۰ برابری مالی (`// 10`)، ایجاد مدیریت مقالات وبلاگ در ادمین، ایجاد مدل تنظیمات داینامیک کلان (`SiteSettings`)، پیاده‌سازی ورود با OTP، تسویه‌حساب‌ها و اتصال قطعی کسر سهمیه دانلود بدون تغییر فرانت‌اند  
> **وابستگی‌ها:** گام‌های ۰۱ تا ۱۳  
> **مرجع سیاست‌ها:** `backend/agent/development-policy.md` (بخش‌های ۱، ۲، ۴، ۶ و ۷) و سند ممیزی `AUDIT_MOCKS_AND_MISSING_APIS.md`

---

> [!IMPORTANT]
> **قانون قطعی و تخطی‌ناپذیر توسعه (Strict Backend-Only Mandate):**  
> ۱. تمامی اقدامات این مرحله منحصراً در کدبیس بک‌اند (`backend/`) انجام می‌گیرد.  
> ۲. **پوشه فرانت‌اند (`frontend/`) ۱۰۰٪ فریز (Locked / Read-Only) است** و هیچ فایلی در آن ویرایش یا ایجاد نخواهد شد. تمامی کاستی‌ها و قراردادهای فرانت‌اند صرفاً از طریق هوشمندسازی، اصلاح فیلدها و ساخت اندپوینت‌های جدید در بک‌اند برطرف می‌گردند.

---

## ۱. اهداف و مأموریت‌های گام چهاردهم (Executive Overview)

بر اساس گزارش جامع ممیزی کدبیس در سند `AUDIT_MOCKS_AND_MISSING_APIS.md`، بخش‌هایی از سیستم به دلیل نبود اندپوینت‌های متناظر در بک‌اند، یا به داده‌های ساختگی (Mock) متوسل شده‌اند و یا دسترسی لازم را به کاربر و مدیر سامانه نمی‌دهند. این مرحله وظیفه دارد با رویکرد **فایل به فایل و فانکشن به فانکشن** کلیه این کمبودها را در لایه بک‌اند مرتفع سازد.

### اهداف کلیدی:
1. **اصلاح فوری خطای محاسبات مالی ۱۰ برابری (`// 10`):** حذف کامل تقسیم بر ۱۰ قیمت‌های تومانی در محاسبات پورسانت رفرال و گزارش‌های مالی پنل ادمین.
2. **پیاده‌سازی پنل مدیریت وبلاگ و آموزش‌ها در ادمین (`/admin/blog`):** امکان ساخت، ویرایش، حذف و مدیریت دسته‌بندی مقالات با آپلود تصویر.
3. **ایجاد سامانه داینامیک تنظیمات کلان سایت (`SiteSettings`):** مدل‌سازی و پیاده‌سازی اندپوینت‌های عمومی و ادمین برای مدیریت آی‌پی‌های DNS هدر، وضعیت آنلاین سرور، اطلاعات تماس و شبکه‌های اجتماعی فوتر، و پی‌لودهای ابزار جیلبریک کنسول.
4. **تکمیل چرخه حساب‌های تسویه و سوابق برداشت:** افزودن اندپوینت تاریخچه برداشت‌های کاربر (`GET /api/referral/withdrawals`)، ویرایش/حذف حساب تسویه، و اندپوینت لیست جامع حساب‌های بانکی برای ادمین (`GET /api/admin/settlement-accounts`).
5. **پیاده‌سازی ورود با رمز یکبار مصرف (`POST /api/auth/login/otp`):** پشتیبانی از ورود امن بدون کلمه عبور برای کاربران قبلی و جدید.
6. **تکمیل عملیات مدیریتی کاربران و اشتراک‌ها:** ویرایش اطلاعات کاربر، تغییر وضعیت فعال/مسدود، صدور دستی اشتراک، ویرایش کدهای تخفیف و ویرایش اشتراک‌های فعال.
7. **آپلود مستقیم آواتار کاربری:** ایجاد اندپوینت `POST /api/users/profile/upload-avatar` با ذخیره در باکت لیارا / لوکال.
8. **حل معضل کسر سهمیه در دانلود مستقیم بدون تغییر فرانت‌اند:** هدایت لینک‌های دانلود به اندپوینت واسط استریم/دانلود که سهمیه را به صورت اتمیک کسر کرده و تاریخچه دانلود را ثبت می‌نماید.
9. **راه‌اندازی زمان‌بند کرون روزانه RAWG بدون داده‌های ساختگی:** حذف تولید عناوین فیک `Special Edition` و جایگزینی با کرون‌جاب پاکیزه.

---

## ۲. مشخصات تفصیلی: فایل به فایل و فانکشن به فانکشن (Detailed File & Function Specifications)

---

### ۲.۱. رفع خطای محاسبات مالی ۱۰ برابری (Financial Bug Fixes)

قیمت‌های اشتراک در جدول `subscription_tiers` به واحد **تومان** ذخیره شده‌اند (مثلاً ۵۰۰,۰۰۰ یا ۷۰۰,۰۰۰ تومان). استفاده از عملیات `// 10` در کدها باعث شده بود که درآمد پلتفرم و پورسانت بازاریابان به یک‌دهم ارزش واقعی تقلیل یابد.

#### ۲.۱.۱. فایل `backend/app/modules/wallet/services.py`
- **فانکشن `process_commission_waterfall(cls, db: AsyncSession, order_payment: OrderPayment) -> dict`:**
  - **محل تغییر:** خط ۳۳۴
  - **تغییر الزامی:** تبدیل کد زیر:
    ```python
    # قبلی (باگ ۱۰ برابری):
    amount_toman = paid_amount // 10 if paid_amount >= 10000 else paid_amount
    ```
    به فرمول استاندارد بدون دستکاری مبالغ تومانی:
    ```python
    # اصلاح‌شده:
    amount_toman = int(paid_amount)
    ```

#### ۲.۱.۲. فایل `backend/app/modules/admin/services.py`
- **فانکشن `get_finance_overview(db: AsyncSession) -> dict`:**
  - **محل تغییر:** خطوط ۲۲۴ و ۲۳۶
  - **تغییر الزامی:** حذف `// 10` از جمع تراکنش‌های ریالی (`total_rial_toman = sum(p.final_price for p in payments ...)`) و لیست تراکنش‌های اخیر (`"amount_toman": p.final_price`).
- **فانکشن `get_dashboard_stats(db: AsyncSession) -> dict`:**
  - **محل تغییر:** خط ۳۴۸
  - **تغییر الزامی:** حذف `// 10` از فیلد درآمد کل (`"total_revenue_toman": int(total_payments)`).

---

### ۲.۲. ماژول وبلاگ و آموزش‌ها — بخش مدیریت ادمین (`backend/app/modules/news/`)

تکمیل چرخه کامل CRUD مقالات و دسته‌بندی‌ها برای پنل ادمین.

#### ۲.۲.۱. فایل `backend/app/modules/news/schemas.py`
- **شِماهای جدید:**
  1. `BlogPostCreate(BaseModel)`:
     - فیلدها: `title: str`, `slug: Optional[str] = None`, `excerpt: Optional[str] = None`, `content: str`, `cover_image_url: Optional[str] = None`, `category_id: int`, `tags: Optional[List[str]] = []`, `reading_time_minutes: int = 5`, `is_published: bool = True`
  2. `BlogPostUpdate(BaseModel)`:
     - فیلدها: کلیه فیلدهای فوق به صورت `Optional`
  3. `BlogCategoryCreate(BaseModel)`:
     - فیلدها: `name_fa: str`, `name_en: str`, `slug: str`, `icon_name: Optional[str] = None`
  4. `BlogCategoryUpdate(BaseModel)`:
     - فیلدها: کلیه فیلدهای فوق به صورت `Optional`

#### ۲.۲.۲. فایل `backend/app/modules/news/services.py`
- **فانکشن‌های جدید در کلاس `NewsService`:**
  1. `admin_list_posts(db: AsyncSession, search: Optional[str], category_id: Optional[int], is_published: Optional[bool], page: int, page_size: int) -> dict`:
     - بازگرداندن مقالات با فیلتر وضعیت انتشار، جستجو در عنوان، صفحه‌بندی و اطلاعات دسته‌بندی.
  2. `create_post(db: AsyncSession, data: BlogPostCreate, author_id: int) -> BlogPost`:
     - تولید اسلاگ خودکار در صورت خالی بودن، ذخیره در جدول `blog_posts` و ابطال کش مقالات در ردیس.
  3. `update_post(db: AsyncSession, post_id: int, data: BlogPostUpdate) -> BlogPost`:
     - به‌روزرسانی فیلدهای ارسالی، ثبت تاریخ `updated_at` و ابطال کش ردیس.
  4. `delete_post(db: AsyncSession, post_id: int) -> dict`:
     - حذف فیزیکی یا منطقی مقاله و پاکسازی کلیدهای کش.
  5. `create_category(db: AsyncSession, data: BlogCategoryCreate) -> BlogCategory`:
     - ایجاد دسته‌بندی جدید مقالات و ابطال کش `drgame:blog:categories`.
  6. `update_category(db: AsyncSession, category_id: int, data: BlogCategoryUpdate) -> BlogCategory`:
     - ویرایش مشخصات دسته‌بندی.
  7. `delete_category(db: AsyncSession, category_id: int) -> dict`:
     - بررسی عدم وجود مقاله وابسته پیش از حذف، و حذف دسته‌بندی.

#### ۲.۲.۳. فایل `backend/app/modules/news/router.py`
- **اندپوینت‌های جدید (محافظت‌شده با گارد `get_current_admin`):**
  - `GET /api/admin/blog/posts` ➔ فراخوانی `NewsService.admin_list_posts`
  - `POST /api/admin/blog/posts` ➔ فراخوانی `NewsService.create_post` (وضعیت 201)
  - `GET /api/admin/blog/posts/{post_id}` ➔ دریافت جزئیات مقاله جهت ویرایش
  - `PUT /api/admin/blog/posts/{post_id}` ➔ فراخوانی `NewsService.update_post`
  - `DELETE /api/admin/blog/posts/{post_id}` ➔ فراخوانی `NewsService.delete_post`
  - `POST /api/admin/blog/categories` ➔ فراخوانی `NewsService.create_category`
  - `PUT /api/admin/blog/categories/{category_id}` ➔ فراخوانی `NewsService.update_category`
  - `DELETE /api/admin/blog/categories/{category_id}` ➔ فراخوانی `NewsService.delete_category`

---

### ۲.۳. ماژول کیف پول و تسویه‌حساب‌ها (`backend/app/modules/wallet/`)

#### ۲.۳.۱. فایل `backend/app/modules/wallet/schemas.py`
- **شِماهای جدید:**
  1. `SettlementAccountUpdate(BaseModel)`:
     - فیلدها: `card_number: Optional[str]`, `sheba_number: Optional[str]`, `account_holder: Optional[str]`, `bank_name: Optional[str]`, `crypto_wallet_address: Optional[str]`, `crypto_network: Optional[str]`
  2. `WithdrawalHistoryItem(BaseModel)`:
     - فیلدها: `id: int`, `amount_toman: int`, `settlement_account_id: int`, `bank_name: Optional[str]`, `card_number: Optional[str]`, `sheba_number: Optional[str]`, `status: str`, `reject_reason: Optional[str]`, `transaction_hash: Optional[str]`, `created_at: datetime`, `processed_at: Optional[datetime]`
  3. `SettlementAccountAdminView(BaseModel)`:
     - فیلدها: مشخصات کامل حساب + `user_id: int`, `user_full_name: str`, `user_phone: Optional[str]`, `is_verified: bool`, `created_at: datetime`

#### ۲.۳.۲. فایل `backend/app/modules/wallet/services.py`
- **فانکشن‌های جدید در کلاس `WalletService`:**
  1. `list_user_withdrawals(db: AsyncSession, user_id: int, page: int = 1, page_size: int = 20) -> dict`:
     - کوئری از جدول `WithdrawalRequest` با جوین به `SettlementAccount` برای استخراج سوابق درخواست‌های برداشت کاربر جاری.
  2. `update_settlement_account(db: AsyncSession, user_id: int, account_id: int, data: SettlementAccountUpdate) -> SettlementAccount`:
     - بررسی مالکیت حساب توسط کاربر جاری و به‌روزرسانی اطلاعات.
  3. `delete_settlement_account(db: AsyncSession, user_id: int, account_id: int) -> dict`:
     - بررسی عدم وجود درخواست تسویه فعال و در صف بررسی پیش از حذف حساب.
  4. `list_all_settlement_accounts_admin(db: AsyncSession, status: Optional[str], page: int = 1, page_size: int = 50) -> dict`:
     - فهرست‌بندی کلیه حساب‌های بانکی و شبای ثبت‌شده در سیستم برای بازبینی ادمین با فیلتر `verified` / `pending`.

#### ۲.۳.۳. روتر کاربر (`backend/app/modules/wallet/router.py`)
- **اندپوینت‌های جدید:**
  - `GET /api/referral/withdrawals`: دریافت سوابق درخواست‌های تسویه کاربر لاگین‌شده با فرمت `List[WithdrawalHistoryItem]`.
  - `PUT /api/referral/settlement-accounts/{account_id}`: ویرایش حساب بانکی کاربر.
  - `DELETE /api/referral/settlement-accounts/{account_id}`: حذف حساب بانکی کاربر.

#### ۲.۳.۴. روتر ادمین (`backend/app/modules/admin/router.py`)
- **اندپوینت جدید:**
  - `GET /api/admin/settlement-accounts` و alias آن `GET /api/admin/bank-accounts`:
    - دریافت لیست حساب‌های بانکی و شبای کاربران جهت حل خطای صفحه `/admin/bank-accounts` در فرانت‌اند.

---

### ۲.۴. ماژول احراز هویت — ورود بدون رمز با OTP (`backend/app/modules/auth/`)

#### ۲.۴.۱. فایل `backend/app/modules/auth/schemas.py`
- **شِمای جدید:**
  ```python
  class OTPLoginRequest(BaseModel):
      target: str = Field(..., description="شماره موبایل یا ایمیل کاربر")
      code: str = Field(..., min_length=5, max_length=6, description="کد یکبار مصرف پیامک‌شده")
  ```

#### ۲.۴.۲. فایل `backend/app/modules/auth/services.py`
- **فانکشن جدید در `AuthService`:**
  - `login_with_otp(db: AsyncSession, redis: aioredis.Redis, payload: OTPLoginRequest, client_info: dict) -> TokenResponse`:
    1. پاکسازی `target` و اعتبارسنجی کد با متد `verify_otp(redis, clean_target, payload.code)`.
    2. جستجوی کاربر در پایگاه داده بر اساس شماره موبایل (`phone`) یا ایمیل (`email`).
    3. در صورت عدم وجود کاربر: ایجاد حساب کاربری جدید به صورت آنی (Auto-Register) با نام پیش‌فرض و تولید کیف پول، تا تجربه کاربری Seamless حاصل شود.
    4. بررسی فعال بودن حساب کاربر (`is_active`).
    5. صدور توکن‌های JWT (Access Token و Refresh Token).
    6. ثبت نشست فعال کاربر در جدول `user_sessions`.
    7. بازگرداندن آبجکت استاندارد `TokenResponse`.

#### ۲.۴.۳. فایل `backend/app/modules/auth/router.py`
- **اندپوینت جدید:**
  - `POST /api/auth/login/otp`: پذیرش `OTPLoginRequest` و بازگرداندن `TokenResponse` با وضعیت 200 OK.

---

### ۲.۵. ماژول تنظیمات داینامیک کلان سامانه (`SiteSettings`)

جایگزینی کلیه داده‌های استاتیک هدر (DNS سرور کنسول و نوار وضعیت)، فوتر (اطلاعات تماس، نمادها، شبکه‌های اجتماعی)، سوالات متداول و فریمورهای ابزار جیلبریک با داده‌های داینامیک دیتابیس.

#### ۲.۵.۱. فایل جدید `backend/app/modules/core/models.py`
- **مدل SQLAlchemy `SiteSetting`:**
  ```python
  class SiteSetting(Base):
      __tablename__ = "site_settings"

      id: Mapped[int] = mapped_column(Integer, primary_key=True)
      # نوار هدر و سرور
      header_dns_primary: Mapped[str] = mapped_column(String(50), default="165.227.83.145")
      header_dns_secondary: Mapped[str] = mapped_column(String(50), default="192.241.221.79")
      server_status_text: Mapped[str] = mapped_column(String(100), default="سرورهای دانلود و اتصال کنسول آنلاین است")
      server_is_online: Mapped[bool] = mapped_column(Boolean, default=True)

      # اطلاعات تماس و آدرس فوتر
      contact_phone: Mapped[str] = mapped_column(String(50), default="۰۲۱-۹۱۰۱۰۰۰۰")
      contact_email: Mapped[str] = mapped_column(String(100), default="support@drgame.ir")
      contact_address: Mapped[str] = mapped_column(String(255), default="تهران، خیابان ولیعصر، برج فناوری و بازی‌های رایانه‌ای")
      support_working_hours: Mapped[str] = mapped_column(String(100), default="پشتیبانی ۲۴ ساعته در ۷ روز هفته")

      # شبکه‌های اجتماعی
      social_telegram: Mapped[str] = mapped_column(String(100), default="https://t.me/DrGame_ir")
      social_instagram: Mapped[str] = mapped_column(String(100), default="https://instagram.com/DrGame_ir")
      social_youtube: Mapped[str] = mapped_column(String(100), default="https://youtube.com/@DrGame_ir")

      # پیکربندی داینامیک فریمورهای جیلبریک (JSON)
      jailbreak_config: Mapped[dict] = mapped_column(JSON, default=lambda: {
          "supported_firmwares": ["9.00", "9.60", "10.01", "11.00"],
          "goldhen_version": "v2.4b16.2",
          "dns_servers": ["165.227.83.145", "192.241.221.79"]
      })

      # سوالات متداول اشتراک‌ها (JSON)
      faq_items: Mapped[list] = mapped_column(JSON, default=lambda: [
          {"question": "آیا بازی‌های دانلودشده برای همیشه در کنسول فعال می‌مانند؟", "answer": "بله، دیتای بازی‌ها و لایسنس تا زمان باقی‌ماندن روی حافظه دستگاه قابل استفاده هستند."},
          {"question": "حجم باقیمانده اشتراک در صورت تمدید به دوره بعد منتقل می‌شود؟", "answer": "در صورت تمدید پیش از انقضای پلن، حجم باقیمانده به سهمیه دوره جدید افزوده می‌گردد."}
      ])

      updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
  ```

#### ۲.۵.۲. فایل `backend/app/modules/core/schemas.py`
- `SiteSettingsOut(BaseModel)`
- `SiteSettingsUpdate(BaseModel)`

#### ۲.۵.۳. فایل `backend/app/modules/core/services.py`
- **فانکشن‌های جدید در کلاس `CoreService`:**
  - `get_site_settings(db: AsyncSession, redis: aioredis.Redis) -> SiteSettingsOut`: واکشی با کش ۵ دقیقه‌ای ردیس (`drgame:settings:global`).
  - `update_site_settings(db: AsyncSession, redis: aioredis.Redis, data: SiteSettingsUpdate) -> SiteSettingsOut`: ذخیره و ابطال فعال کش در ردیس.

#### ۲.۵.۴. فایل `backend/app/modules/core/router.py`
- **اندپوینت‌های جدید:**
  - `GET /api/settings` و `GET /api/site-settings`: عمومی جهت استفاده هدر، فوتر و ابزار جیلبریک کلاینت.
  - `PUT /api/admin/settings`: محافظت‌شده توسط گارد ادمین جهت ویرایش کلیه تنظیمات.

---

### ۲.۶. ماژول مدیریت ادمین — تکمیل عملیات کاربران و تخفیف‌ها (`backend/app/modules/admin/`)

#### ۲.۶.۱. فایل `backend/app/modules/admin/schemas.py`
- **شِماهای جدید:**
  1. `AdminUserUpdate(BaseModel)`: `username: Optional[str]`, `full_name: Optional[str]`, `email: Optional[str]`, `phone: Optional[str]`
  2. `AdminUserStatusUpdate(BaseModel)`: `is_active: bool`
  3. `AdminManualSubscriptionGrant(BaseModel)`: `tier_code: str`, `duration_months: int = 1`, `quota_gb_override: Optional[float] = None`
  4. `AdminSubscriptionUpdate(BaseModel)`: `status: Optional[str]`, `expires_at: Optional[datetime]`, `remaining_quota_gb: Optional[float]`
  5. `AdminDiscountUpdate(BaseModel)`: `discount_percent: Optional[int]`, `max_discount_amount: Optional[int]`, `expires_at: Optional[datetime]`, `max_uses: Optional[int]`, `allowed_users: Optional[List[int]]`

#### ۲.۶.۲. فایل `backend/app/modules/admin/services.py`
- **فانکشن‌های جدید در کلاس `AdminService`:**
  1. `update_user_basic(db: AsyncSession, user_id: int, data: AdminUserUpdate) -> dict`
  2. `toggle_user_status(db: AsyncSession, user_id: int, is_active: bool) -> dict`
  3. `grant_manual_subscription(db: AsyncSession, user_id: int, data: AdminManualSubscriptionGrant) -> dict`:
     - ثبت اشتراک در `UserSubscription`، تخصیص سهمیه دقیق در جدول `UserQuota`، و ثبت رکورد پرداخت با نوع `manual_admin`.
  4. `update_user_subscription(db: AsyncSession, sub_id: int, data: AdminSubscriptionUpdate) -> dict`:
     - ویرایش تاریخ انقضا و وضعیت ابطال یا تمدید اشتراک خاص.
  5. `update_discount_code(db: AsyncSession, discount_id: int, data: AdminDiscountUpdate) -> dict`:
     - ویرایش مشخصات کد تخفیف موجود.

#### ۲.۶.۳. فایل `backend/app/modules/admin/router.py`
- **اندپوینت‌های جدید:**
  - `PUT /api/admin/users/{user_id}` ➔ فراخوانی `AdminService.update_user_basic`
  - `PATCH /api/admin/users/{user_id}/status` ➔ فراخوانی `AdminService.toggle_user_status`
  - `POST /api/admin/users/{user_id}/subscriptions` ➔ فراخوانی `AdminService.grant_manual_subscription`
  - `PUT /api/admin/subscriptions/{subscription_id}` ➔ فراخوانی `AdminService.update_user_subscription`
  - `PUT /api/admin/discounts/{discount_id}` ➔ فراخوانی `AdminService.update_discount_code`

---

### ۲.۷. ماژول کاربران — آپلود مستقیم آواتار و رفع فال‌بک نشست‌ها (`backend/app/modules/users/`)

#### ۲.۷.۱. فایل `backend/app/modules/users/services.py`
- **فانکشن جدید `upload_avatar(db: AsyncSession, user_id: int, file: UploadFile) -> str`:**
  - ذخیره فایل تصویر آپلودی با فراخوانی متد `save_uploaded_file(file, prefix="avatar", folder="avatars")` در ماژول `storage.py` (آپلود در باکت لیارا یا فال‌بک لوکال).
  - ذخیره URL تولیدشده در فیلد `avatar_url` کاربر و قرار دادن `is_preset_avatar = False`.
- **به‌روزرسانی فانکشن `get_user_sessions(db: AsyncSession, user_id: int, current_token_or_ip: Optional[str]) -> list`:**
  - افزودن فیلد `is_current: bool` به هر نشست جهت رفع باگ فرانت‌اند که در صورت نبود این فیلد، نشست‌های فیک تولید می‌کرد.

#### ۲.۷.۲. فایل `backend/app/modules/users/router.py`
- **اندپوینت جدید:**
  - `POST /api/users/profile/upload-avatar`: پذیرش فایل تصویر به صورت `multipart/form-data`، فراخوانی `UserService.upload_avatar` و بازگرداندن URL جدید آواتار.

---

### ۲.۸. ماژول بازی‌ها و سهمیه — حل مشکل کسر حجم بدون تغییر فرانت‌اند (`backend/app/modules/games/`)

در کامپوننت `DownloadConfirmModal.tsx` فرانت‌اند، تگ `<a>` مستقیماً با مقدار `link.download_url` باز می‌شود. برای اینکه بدون دستکاری فرانت‌اند، سهمیه دانلود کاربر به صورت اتمیک کسر گردد و در «تاریخچه دانلودها» ثبت شود:

#### ۲.۸.۱. فایل `backend/app/modules/games/services.py`
- **اصلاح تولید فیلد `download_url` در خروجی جزئیات بازی (`get_game_detail`):**
  - فیلد `download_url` به گونه‌ای تنظیم می‌شود که به اندپوینت میانی دانلود امن بک‌اند اشاره کند:
    ```text
    /api/games/{game_id}/downloads/{file_id}/stream?token={user_jwt_or_signed_token}
    ```
- **فانکشن جدید `stream_or_redirect_download(db: AsyncSession, game_id: int, file_id: int, user_id: int) -> str`:**
  1. بررسی اتمیک موجودی سهمیه و اشتراک کاربر (`require_active_subscription`).
  2. کسر حجم پارت از سهمیه کاربر در `UserQuota`.
  3. ثبت رکورد دانلود در `UserDownloadHistory`.
  4. ابطال کلید کش سهمیه کاربر در ردیس (`drgame:user:{user_id}:quota`).
  5. بازگرداندن لینک مستقیم CDN یا Presigned URL لیارا برای هدایت فوری (HTTP 302 Redirect).

#### ۲.۸.۲. فایل `backend/app/modules/games/router.py`
- **اندپوینت جدید:**
  - `GET /api/games/{game_id}/downloads/{file_id}/stream`:
    - دریافت توکن از Query Parameter یا کوکی/هدر جهت پشتیبانی از دانلود مستقیم مرورگر بدون نیاز به تغییر فرانت‌اند.
    - اجرای فرآیند کسر سهمیه و بازگرداندن `RedirectResponse(url=direct_s3_url, status_code=302)`.

---

### ۲.۹. زمان‌بندی همگام‌سازی روزانه RAWG بدون دیتای ماک (`backend/app/tasks/`)

#### ۲.۹.۱. فایل جدید `backend/app/tasks/scheduler.py`
- پیکربندی `AsyncIOScheduler` با کرون جاب روزانه ساعت ۰۳:۰۰ بامداد (`0 3 * * *`).
- راه‌اندازی و توقف خودکار در تابع `lifespan` در `main.py`.

#### ۲.۹.۲. فایل `backend/app/modules/rawg_sync/services.py`
- **اصلاح اسکریپت و سرویس همگام‌سازی:**
  - حذف کامل منطق تولید بازی‌های مصنوعی موسوم به `Special Edition 1..285` که در اسکریپت `seed_300_games.py` وجود داشت.
  - دریافت بازی‌های جدید صرفاً بر اساس دیتای واقعی API با تفکیک پلتفرم‌های PS4 و PS5 و ذخیره تصاویر واقعی در ابجکت استوریج لیارا.

---

## ۳. نقشه راه و آدرس‌دهی دقیق فایل‌ها (Explicit File Paths)

### ۳.۱. فایل‌های ویرایشی در بک‌اند (Modified Backend Files):
1. `backend/app/modules/wallet/services.py`: حذف باگ `// 10` و متدهای سوابق تسویه
2. `backend/app/modules/wallet/schemas.py`: شِماهای ویرایش حساب و سوابق برداشت
3. `backend/app/modules/wallet/router.py`: اندپوینت‌های سوابق تسویه کاربر
4. `backend/app/modules/admin/services.py`: حذف باگ `// 10`، تکمیل متدهای مدیریتی کاربران، تخفیف‌ها و حساب‌های بانکی
5. `backend/app/modules/admin/schemas.py`: DTOهای ویرایش کاربر، تمدید اشتراک و تخفیف‌ها
6. `backend/app/modules/admin/router.py`: اندپوینت‌های CRUD تکمیلی ادمین و `/admin/settlement-accounts`
7. `backend/app/modules/news/schemas.py`: DTOهای ساخت و ویرایش مقالات و دسته‌بندی‌ها
8. `backend/app/modules/news/services.py`: متدهای CRUD مقالات برای ادمین همراه با ابطال کش
9. `backend/app/modules/news/router.py`: اندپوینت‌های اختصاصی ادمین برای وبلاگ
10. `backend/app/modules/auth/schemas.py`: افزودن `OTPLoginRequest`
11. `backend/app/modules/auth/services.py`: پیاده‌سازی متد `login_with_otp`
12. `backend/app/modules/auth/router.py`: ثبت اندپوینت `POST /api/auth/login/otp`
13. `backend/app/modules/users/services.py`: آپلود مستقیم آواتار و فلگ `is_current` نشست‌ها
14. `backend/app/modules/users/router.py`: اندپوینت آپلود آواتار
15. `backend/app/modules/games/services.py`: هدایت لینک‌های دانلود به پروکسی کسر سهمیه
16. `backend/app/modules/games/router.py`: اندپوینت استریم و کسر خودکار حجم
17. `backend/app/main.py`: اتصال روت‌های جدید و راه‌اندازی زمان‌بند کرون

### ۳.۲. فایل‌های جدید در بک‌اند (New Backend Files):
1. `backend/app/modules/core/models.py`: تعریف مدل پایگاه داده `SiteSetting`
2. `backend/app/modules/core/schemas.py`: شِماهای تنظیمات سایت
3. `backend/app/modules/core/services.py`: سرویس کشینگ و مدیریت تنظیمات سایت
4. `backend/app/modules/core/router.py`: روتر تنظیمات عمومی و ادمین
5. `backend/app/tasks/__init__.py` و `backend/app/tasks/scheduler.py`: زمان‌بند درون‌پروسسی
6. `backend/tests/test_missing_apis_fulfillment.py`: سوئیت آزمون‌های جامع یکپارچگی

---

## ۴. استراتژی تضمین کیفیت و آزمون‌های خودکار (Quality Assurance & Pytest)

تمام فانکشن‌ها و اندپوینت‌های اضافه یا ویرایش‌شده باید با آزمون‌های جامع Pytest در کانتینر داکر اعتبارسنجی شوند:

```bash
docker compose -f docker-compose.dev.yml run --rm backend pytest tests/test_missing_apis_fulfillment.py -v
```

### سناریوهای کلیدی تست:
1. **تست مالی:** اعتبارسنجی مبالغ پورسانت دقیقاً بر مبنای مبلغ کامل تومانی (بدون تقسیم بر ۱۰).
2. **تست بلاگ ادمین:** تست احراز هویت ادمین، ایجاد پست، ویرایش و حذف آن.
3. **تست ورود با OTP:** ارسال درخواست لاگین با کد تایید معتبر و دریافت موفقیت‌آمیز توکن‌های JWT.
4. **تست تنظیمات سایت:** دریافت تنظیمات، ویرایش توسط ادمین و تایید نوسازی در کش ردیس.
5. **تست سوابق تسویه و حساب‌ها:** ثبت حساب، تایید در پنل ادمین و استعلام سوابق تسویه کاربر.
6. **تست کسر خودکار سهمیه:** فراخوانی ریدایرکت دانلود و اطمینان از کسر اتمیک حجم و ثبت در دیتابیس تاریخچه.

</div>
