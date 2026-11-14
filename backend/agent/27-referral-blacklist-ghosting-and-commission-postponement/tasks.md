<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیست و هفتم: بلک‌لیست رفرال، روح‌کردن کاربر و مدیریت دوحالته رفع تعویق پورسانت‌ها (Tasks Checklist)

> **گام:** ۲۷  
> **عنوان:** پیاده‌سازی سیستم مسدودسازی/روح‌کردن در زنجیره رفرال با واریز به صندوق کل، پاپ‌آپ دو تیکه (قطع رفرال + لغو و تحریم اشتراک)، تب لیست سیاه، منع ثبت حساب بانکی به نام فرد مسدود، و رفع تعویق کاربر به کاربر و سراسری.  
> **وضعیت کلی:** ✅ پیاده‌سازی و تست کامل شده (Completed)  

---

### فاز ۱: مدل‌های دیتابیس و مایگریشن‌ها (Database Models & Migrations)
- [x] ایجاد مدل `ReferralBlacklist` در `backend/app/modules/wallet/models.py`:
  - [x] ستون‌های `id`, `user_id`, `admin_id`, `block_referral`, `block_subscription`, `reason`.
  - [x] ستون‌های فراداده نام و کدملی (`blocked_full_name`, `blocked_national_code`).
  - [x] ستون‌های وضعیت و تاریخچه (`is_active`, `created_at`, `unblocked_at`, `unblocked_by_admin_id`).
- [x] افزودن فیلدهای کمکی به مدل `User` در `backend/app/modules/users/models.py`:
  - [x] `is_referral_blocked: Mapped[bool]` (پیش‌فرض: `False`).
  - [x] `is_subscription_banned: Mapped[bool]` (پیش‌فرض: `False`).
- [x] ساخت اسکریپت مایگریشن Alembic (`686565b7eefc`) برای جدول و ستون‌های جدید و اعمال آن روی پایگاه داده (`alembic upgrade head`).

---

### فاز ۲: هسته سرویس‌های بک‌اند و منطق‌های تجاری (Core Business Logic)
- [x] به‌روزرسانی متد `distribute_referral_commission` در `backend/app/modules/wallet/services.py`:
  - [x] بررسی وضعیت `is_referral_blocked` در هر لایه از زنجیره.
  - [x] در صورت بلاک بودن، واریز سهم آن لایه به `ReferralTreasuryPool` با لاگ خزانه‌داری (`ghosted_referral_divert`).
  - [x] ثبت رکورد `CommissionLedger` با `beneficiary_type="treasury"` و عدم واریز به کیف پول کاربر مسدود.
  - [x] ادامه صحیح زنجیره با نصف شدن سهم برای لایه‌های بعدی بدون اختلال.
- [x] پیاده‌سازی متدهای `block_user_in_referral` و `unblock_user_in_referral` در `WalletService`:
  - [x] مدیریت فعال‌سازی/غیرفعال‌سازی رکورد بلک‌لیست و فلگ‌های کاربر.
  - [x] در صورت انتخاب تیک دوم (`block_subscription=True`): فسخ اشتراک‌های فعال (`status="cancelled"`)، پاک‌سازی کش سهمیه ردیس و فعال‌سازی `is_subscription_banned`.
- [x] به‌روزرسانی `SubscriptionService.process_checkout` در `backend/app/modules/subscriptions/services.py`:
  - [x] بررسی فلگ `is_subscription_banned` و ممانعت از ثبت خرید اشتراک با خطای ۴۰۳.
- [x] به‌روزرسانی `WalletService.add_settlement_account`:
  - [x] اعتبارسنجی نام صاحب حساب (`account_holder`) و کد ملی (با نرمالایز حروف فارسی/عربی و اعداد) در برابر کاربران فعال در `ReferralBlacklist`.
  - [x] مسدودسازی ثبت حساب با خطای صریح فارسی در صورت تطابق.

---

### فاز ۳: سیستم دوحالته رفع تعویق پورسانت‌ها (Dual-Mode Settlement Engine)
- [x] پیاده‌سازی متد `release_user_pending_commission` در `WeeklySettlementService`:
  - [x] استعلام لجر‌های معوق (`pending`) کاربر خاص با قفل تراکنشی (`with_for_update`).
  - [x] انتقال مجموع مبالغ از `pending_balance_toman` به `withdrawable_balance_toman` در کیف پول کاربر.
  - [x] تغییر وضعیت لجرها به `settled` و ثبت تاریخ، بچ و کد پیگیری.
- [x] بازبینی و تقویت متد `execute_weekly_settlement` برای تسویه سراسری:
  - [x] تضمین رفتار بدون کرش در مواقع عدم وجود تراکنش معوقه (`status="empty"`).
  - [x] بازگردانی ساختار پاسخ یکپارچه با جزئیات کامل آماری.

---

### فاز ۴: کنترلرها و اندپوینت‌های ادمین رفرال (`/api/admin-referral`)
- [x] افزودن اندپوینت `POST /api/admin-referral/users/{user_id}/blacklist` (مسدودسازی با دو چک‌باکس).
- [x] افزودن اندپوینت `DELETE /api/admin-referral/users/{user_id}/blacklist` (رفع مسدودیت).
- [x] افزودن اندپوینت `GET /api/admin-referral/blacklist` (لیست افراد در لیست سیاه همراه با صفحه‌بندی).
- [x] افزودن اندپوینت `POST /api/admin-referral/settlement/release-user/{user_id}` (رفع تعویق کاربر خاص).
- [x] ارتقای `GET /api/admin-referral/chains` با اطلاعات تکمیلی کاربران و وضعیت مسدودیت آن‌ها.
- [x] ثبت لاگ کامل فعالیت‌های ادمین در `AdminAuditLog` برای تمام عملیات‌های فوق.

---

### فاز ۵: رابط کاربری پنل ادمین - صفحه زنجیره‌ها و لیست سیاه
- [x] بازطراحی صفحه `frontend/src/app/(admin)/admin/referral/chains/page.tsx`:
  - [x] پیاده‌سازی تب‌بار دوگانه: «زنجیره‌های رفرال» و «لیست سیاه».
  - [x] افزودن ستون «عملیات» در جدول زنجیره‌ها با دکمه‌های «مسدودسازی / روح‌کردن» برای زیرمجموعه و معرف.
  - [x] ساخت کامپوننت پاپ‌آپ تایید مسدودسازی با دو چک‌باکس صریح:
    - [x] تیک ۱: کنار رفتن از زنجیره و واریز پورسانت به صندوق کل.
    - [x] تیک ۲: لغو فوری اشتراک فعال و منع از خرید هرگونه اشتراک جدید.
    - [x] فیلد دلیل مسدودسازی.
  - [x] ساخت جدول اختصاصی تب لیست سیاه با نمایش مشخصات، زمان مسدودسازی، دلایل، نشان‌های وضعیت و دکمه «رفع مسدودیت».

---

### فاز ۶: رابط کاربری پنل ادمین - مرکز تسویه و رفع تعویق پورسانت‌ها
- [x] به‌روزرسانی صفحه `frontend/src/app/(admin)/admin/referral/settlement/page.tsx`:
  - [x] افزودن دکمه «رفع تعویق این کاربر» در جدول ذی‌نفعان صفحه اصلی و مودال پیش‌نمایش (Dry-Run).
  - [x] جایگزینی `window.confirm` ناکارآمد با مودال تایید شیشه‌ای مدرن جهت تسویه سراسری و کاربر به کاربر.
  - [x] رفع مشکل غیرفعال ماندن دکمه تسویه سراسری و هندلینگ صحیح لودینگ و خطاها.
  - [x] به‌روزرسانی آنی کارت‌های آماری بالای صفحه پس از هر تسویه.

---

### فاز ۷: آزمون‌های خودکار و تضمین کیفیت (QA & Pytest)
- [x] نگارش تست‌های خودکار در `backend/tests/test_referral_blacklist.py`:
  - [x] تست واریز سهم لایه کاربر روح‌شده به `ReferralTreasuryPool` بدون جابه‌جایی سطوح بالا.
  - [x] تست لغو اشتراک و خطای خرید ۴۰۳ در `process_checkout` برای کاربر تحریم‌شده.
  - [x] تست ممانعت از ثبت حساب بانکی به نام یا کد ملی کاربر بلاک‌شده در `add_settlement_account`.
  - [x] تست رفع تعویق کاربر به کاربر و تغییر مانده‌های کیف پول.
  - [x] تست HTTP اندپوینت‌ها، رفع مسدودیت و لاگ بازرسی `AdminAuditLog`.
- [x] اجرای تست‌های کامل پروژه: `docker exec drgame-backend pytest -q` (۱۱۸ تست پاس)
- [x] اجرای بیلد فرانت‌اند و حصول اطمینان از خروجی بدون خطای `docker exec drgame-frontend npm run build`

</div>