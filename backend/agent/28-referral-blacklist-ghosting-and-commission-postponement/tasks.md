<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیست و هشتم: بلک‌لیست رفرال، روح‌کردن کاربر و مدیریت دوحالته رفع تعویق پورسانت‌ها (Tasks Checklist)

> **گام:** ۲۸  
> **عنوان:** پیاده‌سازی سیستم مسدودسازی/روح‌کردن در زنجیره رفرال با واریز به صندوق کل، پاپ‌آپ دو تیکه (قطع رفرال + لغو و تحریم اشتراک)، تب لیست سیاه، منع ثبت حساب بانکی به نام فرد مسدود، و رفع تعویق کاربر به کاربر و سراسری.  
> **وضعیت کلی:** ⏳ در انتظار اجرا (Pending Execution)  

---

### فاز ۱: مدل‌های دیتابیس و مایگریشن‌ها (Database Models & Migrations)
- [ ] ایجاد مدل `ReferralBlacklist` در `backend/app/modules/wallet/models.py`:
  - [ ] ستون‌های `id`, `user_id`, `admin_id`, `block_referral`, `block_subscription`, `reason`.
  - [ ] ستون‌های فراداده نام و کدملی (`blocked_full_name`, `blocked_national_code`).
  - [ ] ستون‌های وضعیت و تاریخچه (`is_active`, `created_at`, `unblocked_at`, `unblocked_by_admin_id`).
- [ ] افزودن فیلدهای کمکی به مدل `User` در `backend/app/modules/users/models.py`:
  - [ ] `is_referral_blocked: Mapped[bool]` (پیش‌فرض: `False`).
  - [ ] `is_subscription_banned: Mapped[bool]` (پیش‌فرض: `False`).
- [ ] ساخت اسکریپت مایگریشن Alembic برای جدول و ستون‌های جدید و اعمال آن روی پایگاه داده.

---

### فاز ۲: هسته سرویس‌های بک‌اند و منطق‌های تجاری (Core Business Logic)
- [ ] به‌روزرسانی متد `distribute_referral_commission` در `backend/app/modules/wallet/services.py`:
  - [ ] بررسی وضعیت `is_referral_blocked` در هر لایه از زنجیره.
  - [ ] در صورت بلاک بودن، واریز سهم آن لایه به `ReferralTreasuryPool` با لاگ خزانه‌داری.
  - [ ] ثبت رکورد `CommissionLedger` با `beneficiary_type="treasury"` و عدم واریز به کیف پول کاربر مسدود.
  - [ ] ادامه صحیح زنجیره با نصف شدن سهم برای لایه‌های بعدی بدون اختلال.
- [ ] پیاده‌سازی متدهای `block_user_in_referral` و `unblock_user_in_referral` در `WalletService`:
  - [ ] مدیریت فعال‌سازی/غیرفعال‌سازی رکورد بلک‌لیست و فلگ‌های کاربر.
  - [ ] در صورت انتخاب تیک دوم (`block_subscription=True`): فسخ اشتراک‌های فعال (`status="cancelled"`) و فعال‌سازی `is_subscription_banned`.
- [ ] به‌روزرسانی `SubscriptionService.process_checkout` در `backend/app/modules/subscriptions/services.py`:
  - [ ] بررسی فلگ `is_subscription_banned` و ممانعت از ثبت خرید اشتراک با خطای ۴۰۳.
- [ ] به‌روزرسانی `WalletService.add_settlement_account`:
  - [ ] اعتبارسنجی نام صاحب حساب (`account_holder`) و کد ملی در برابر کاربران فعال در `ReferralBlacklist`.
  - [ ] مسدودسازی ثبت حساب با خطای صریح فارسی در صورت تطابق.

---

### فاز ۳: سیستم دوحالته رفع تعویق پورسانت‌ها (Dual-Mode Settlement Engine)
- [ ] پیاده‌سازی متد `release_user_pending_commission` در `WeeklySettlementService`:
  - [ ] استعلام لجر‌های معوق (`pending`) کاربر خاص با قفل تراکنشی.
  - [ ] انتقال مجموع مبالغ از `pending_balance_toman` به `withdrawable_balance_toman` در کیف پول کاربر.
  - [ ] تغییر وضعیت لجرها به `settled` و ثبت تاریخ و کد پیگیری.
- [ ] بازبینی و تقویت متد `execute_weekly_settlement` برای تسویه سراسری:
  - [ ] تضمین رفتار بدون کرش در مواقع عدم وجود تراکنش معوقه.
  - [ ] بازگردانی ساختار پاسخ یکپارچه با جزئیات کامل آماری.

---

### فاز ۴: کنترلرها و اندپوینت‌های ادمین رفرال (`/api/admin-referral`)
- [ ] افزودن اندپوینت `POST /api/admin-referral/users/{user_id}/blacklist` (مسدودسازی با دو چک‌باکس).
- [ ] افزودن اندپوینت `DELETE /api/admin-referral/users/{user_id}/blacklist` (رفع مسدودیت).
- [ ] افزودن اندپوینت `GET /api/admin-referral/blacklist` (لیست افراد در لیست سیاه همراه با صفحه‌بندی).
- [ ] افزودن اندپوینت `POST /api/admin-referral/settlement/release-user/{user_id}` (رفع تعویق کاربر خاص).
- [ ] ثبت لاگ کامل فعالیت‌های ادمین در `AuditLog` برای تمام عملیات‌های فوق.

---

### فاز ۵: رابط کاربری پنل ادمین - صفحه زنجیره‌ها و لیست سیاه
- [ ] بازطراحی صفحه `frontend/src/app/(admin)/admin/referral/chains/page.tsx`:
  - [ ] پیاده‌سازی تب‌بار دوگانه: «زنجیره‌های رفرال» و «لیست سیاه».
  - [ ] افزودن ستون «عملیات» در جدول زنجیره‌ها با دکمه «مسدودسازی / روح‌کردن».
  - [ ] ساخت کامپوننت پاپ‌آپ تایید مسدودسازی با دو چک‌باکس صریح:
    - [ ] تیک ۱: کنار رفتن از زنجیره و واریز پورسانت به صندوق کل.
    - [ ] تیک ۲: لغو فوری اشتراک فعال و منع از خرید هرگونه اشتراک جدید.
    - [ ] فیلد دلیل مسدودسازی.
  - [ ] ساخت جدول اختصاصی تب لیست سیاه با نمایش مشخصات، زمان مسدودسازی، دلایل، نشان‌های وضعیت و دکمه «رفع مسدودیت».

---

### فاز ۶: رابط کاربری پنل ادمین - مرکز تسویه و رفع تعویق پورسانت‌ها
- [ ] به‌روزرسانی صفحه `frontend/src/app/(admin)/admin/referral/settlement/page.tsx`:
  - [ ] افزودن دکمه «رفع تعویق این کاربر» در جدول ذی‌نفعان و مودال پیش‌نمایش.
  - [ ] جایگزینی `window.confirm` ناکارآمد با مودال تایید شیشه‌ای مدرن جهت تسویه سراسری.
  - [ ] رفع مشکل غیرفعال ماندن دکمه تسویه سراسری و هندلینگ صحیح لودینگ و خطاها.
  - [ ] به‌روزرسانی آنی کارت‌های آماری بالای صفحه پس از هر تسویه.

---

### فاز ۷: آزمون‌های خودکار و تضمین کیفیت (QA & Pytest)
- [ ] نگارش تست‌های خودکار در `backend/tests/test_referral_blacklist.py`:
  - [ ] تست واریز سهم لایه کاربر روح‌شده به `ReferralTreasuryPool`.
  - [ ] تست لغو اشتراک و خطای خرید در `process_checkout` برای کاربر تحریم‌شده.
  - [ ] تست ممانعت از ثبت حساب بانکی به نام کاربر بلاک‌شده در `add_settlement_account`.
  - [ ] تست رفع تعویق کاربر به کاربر و تغییر مانده‌های کیف پول.
  - [ ] تست رفع مسدودیت و بازگشت به وضعیت عادی.
- [ ] اجرای تست‌های کامل پروژه: `docker exec drgame-backend pytest -q`
- [ ] اجرای بیلد فرانت‌اند و حصول اطمینان از خروجی بدون خطای `npm run build`.

</div>
