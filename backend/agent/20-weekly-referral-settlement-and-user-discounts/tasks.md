<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیستم: سامانه تسویه هفتگی کیف پول رفرال، ارتقای لایه‌های شبکه و تخفیف‌های کاربرمحور دسته‌ای (Tasks Checklist)

> **گام:** ۲۰  
> **عنوان:** سامانه جامع تسویه چرخه‌ای هفتگی کیف پول رفرال، ثبت تراکنش‌های پورسانت معلق، بازطراحی داشبورد رفرال کاربری با لایه‌های نامحدود پویا و شبیه‌ساز سود، توسعه مرکز تسویه و شجره‌نامه در پنل ادمین رفرال، و استقرار سامانه تخفیف‌های کاربرمحور با قابلیت انتساب دسته‌ای گروهی (Bulk Assignment) در بخش اشتراک‌ها  
> **وضعیت کلی:** ✅ تکمیل‌شده و اعتبارسنجی‌شده (Fully Implemented & Verified)  

---

### فاز ۱: طرح‌بندی پایگاه داده و مهاجرت‌ها (Database Schema & Migrations)
- [x] به‌روزرسانی مدل `UserWallet` در `backend/app/modules/wallet/models.py`:
  - [x] افزودن ستون `pending_balance_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)`
- [x] به‌روزرسانی مدل `CommissionLedger` در `backend/app/modules/wallet/models.py`:
  - [x] افزودن ستون `settlement_status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)`
  - [x] افزودن ستون `settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)`
  - [x] افزودن ستون `settlement_batch_id: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)`
- [x] ایجاد مدل جدید `SettlementBatch` در `backend/app/modules/wallet/models.py`:
  - [x] ستون‌های `id`, `batch_code`, `total_amount_toman`, `total_transactions_count`, `beneficiaries_count`, `executed_by_type`, `executed_by_admin_id`, `period_start`, `period_end`, `created_at`
- [x] ایجاد مدل جدید `UserDiscount` در `backend/app/modules/subscriptions/models.py`:
  - [x] ستون‌های `id`, `user_id`, `title`, `discount_percent`, `max_discount_toman`, `applicable_tier_codes`, `starts_at`, `expires_at`, `is_used`, `used_at`, `order_payment_id`, `is_active`, `created_by_admin_id`, `created_at`
- [x] ثبت مدل‌های جدید در `admin-panel/apps/drgame_billing/` و `admin-panel/apps/drgame_referral/` جنگو ادمین
- [x] تولید و اعمال مایگریشن Alembic:
  - [x] اجرای دستور `alembic revision --autogenerate -m "feat: add weekly settlement, pending balance, and user discounts"`
  - [x] اعتبارسنجی فایل مایگریشن `3dc486a61b14` و اجرای موفق `alembic upgrade head`.

---

### فاز ۲: موتور تسویه هفتگی و منطق کیف پول در بک‌اند (`Weekly Settlement Engine`)
- [x] اصلاح متد `distribute_referral_commission` در `backend/app/modules/wallet/services.py`:
  - [x] ثبت رکوردهای پورسانت در `CommissionLedger` با `settlement_status = "pending"`
  - [x] افزایش `wallet.pending_balance_toman` (توقف واریز آنی به `withdrawable_balance_toman`)
- [x] توسعه سرویس تسویه هفتگی `WeeklySettlementService` در `backend/app/modules/wallet/settlement_service.py`:
  - [x] متد `preview_weekly_settlement(db: AsyncSession) -> dict`: پیش‌نمایش آماری دوره‌های تسویه هفتگی (حجم پورسانت‌های معلق، تعداد کاربران، لیست جزئیات بدون اعمال در دیتابیس)
  - [x] متد `execute_weekly_settlement(db: AsyncSession, executed_by_admin_id: int | None = None) -> dict`: اجرای اتمیک تسویه هفتگی، انتقال مبالغ به `withdrawable_balance_toman`، صفر کردن موجودی معلق، تغییر وضعیت لجر به `settled`، و صدور رکورد `SettlementBatch`
  - [x] متد `get_settlement_history(db: AsyncSession, page: int, page_size: int) -> dict`: دریافت تاریخچه دوره‌های تسویه انجام‌شده
- [x] اصلاح اسکیماهای کیف پول در `backend/app/modules/wallet/schemas.py`:
  - [x] افزودن `pending_balance_toman` و `next_settlement_date` به `ReferralSummaryResponse`
  - [x] افزودن `settlement_status` و `settled_at` به `CommissionTransaction`
- [x] ایجاد اندپوینت‌های جدید در `backend/app/modules/wallet/router.py`:
  - [x] `GET /api/referral/network-tree`: دریافت ساختار درختی و آمار اعضای شبکه کاربر به تفکیک تمام لایه‌ها
  - [x] `GET /api/referral/members`: دریافت لیست ماسک‌شده اعضای زیرمجموعه با لایه و وضعیت اشتراک.

---

### فاز ۳: ماژول تخفیف‌های کاربرمحور دسته‌ای در بک‌اند (`User Discounts Engine`)
- [x] توسعه سرویس تخفیف‌های کاربر در `backend/app/modules/subscriptions/discount_service.py`:
  - [x] متد `create_bulk_user_discounts(db: AsyncSession, user_ids: list[int], discount_percent: int, duration_days: int, title: str, applicable_tier_codes: list[str], admin_id: int | None) -> list[UserDiscount]`
  - [x] متد `get_active_user_discount(db: AsyncSession, user_id: int) -> UserDiscount | None`: بررسی تخفیف‌های معتبر (`expires_at > now()` و `is_used == False`)
  - [x] متد `consume_user_discount(db: AsyncSession, discount_id: int, order_payment_id: int) -> None`
- [x] ادغام تخفیف کاربرمحور در فرآیند استعلام و خرید اشتراک (`subscriptions`):
  - [x] به‌روزرسانی `GET /api/subscriptions/tiers` جهت تزریق درصد و قیمت تخفیف‌خورده به کاربران دارای تخفیف
  - [x] به‌روزرسانی `process_checkout` جهت اعمال خودکار تخفیف فعال کاربر و سوزاندن رکورد تخفیف پس از پرداخت موفق
- [x] ایجاد اندپوینت‌های ادمین در `backend/app/modules/admin/routers/finance_router.py`:
  - [x] `POST /api/admin-finance/user-discounts/bulk`: اعطای دسته‌ای تخفیف به کاربران انتخاب‌شده
  - [x] `GET /api/admin-finance/user-discounts`: لیست تخفیف‌های اختصاصی صادرشده به همراه فیلتر وضعیت
  - [x] `DELETE /api/admin-finance/user-discounts/{id}`: ابطال تخفیف کاربر.

---

### فاز ۴: بازطراحی داشبورد رفرال کاربری در فرانت‌اند (`Frontend User Dashboard`)
- [x] به‌روزرسانی تایپ‌ها در `frontend/src/types/referral.ts`:
  - [x] افزودن `pending_balance_toman` و `next_settlement_at` به `ReferralStats`
  - [x] اینترفیس‌های `NetworkLevelStat` و `ReferralMemberItem`
- [x] بازطراحی کارت‌های بالای صفحه در `frontend/src/components/referral/ReferralStatsCards.tsx`:
  - [x] کارت مجزای «موجودی قابل برداشت (تسویه‌شده)» با دکمه برداشت
  - [x] کارت مجزای «پورسانت در انتظار تسویه هفتگی» با برچسب موعد تسویه جمعه شب
- [x] بازطراحی تفکیک لایه‌های شبکه در `frontend/src/app/(dashboard)/referral/page.tsx`:
  - [x] حذف دراپ‌داون ۳ لایه و ایجاد تب‌های تعاملی لایه‌های ۱ تا ۴ و لایه‌های عمیق‌تر ۵+
  - [x] نمایش سهم درصدی هر لایه، تعداد اعضا، مشترکین فعال و سود تجمیعی هر لایه
- [x] پیاده‌سازی کامپوننت جدول اعضای شبکه (`ReferralNetworkTable.tsx`):
  - [x] نمایش اسامی ماسک‌شده، تاریخ عضویت، سطح شبکه، و وضعیت اشتراک
- [x] پیاده‌سازی کامپوننت شبیه‌ساز درآمد رفرال (`ReferralCalculatorModal.tsx`):
  - [x] اسلایدر تعاملی محاسبه درآمد ماهانه بر اساس تعداد خریداران و پلن انتخابی
- [x] اضافه کردن بخش جعبه‌ابزار بازاریابی (Marketing Toolkit):
  - [x] دکمه کپی لینک + دکمه کپی متن آماده پیام‌رسان‌ها (تلگرام، ایتا، واتساپ).

---

### فاز ۵: ارتقای پنل‌های ادمین رفرال و مالی در فرانت‌اند (`Frontend Admin Panel`)
- [x] ارتقای پنل ادمین رفرال (`frontend/src/app/(admin)/admin/referral/`):
  - [x] پیاده‌سازی صفحه مرکز تسویه هفتگی (`/admin/referral/settlement/`):
    - [x] مشاهده مجموع پورسانت‌های معلق هفته و تعداد ذی‌نفعان
    - [x] دکمه پیش‌نمایش تسویه هفتگی (Dry-Run Modal)
    - [x] دکمه اجرای دستی تسویه هفتگی با لاگ و شماره بچ
    - [x] جدول تاریخچه بچ‌های تسویه‌شده هفتگی
  - [x] پیاده‌سازی کاوشگر شجره‌نامه رفرال (`/admin/referral/tree/`):
    - [x] سرچ کاربر و نمایش مسیر بالادستی (Uplines) و ساختار درختی پایین‌دستی (Downlines)
    - [x] کلید تغییر وضعیت کاربر مخفی (`is_referral_hidden`)
  - [x] پیاده‌سازی داشبورد خزانه‌داری پلتفرم (`/admin/referral/treasury/`):
    - [x] نمایش موجودی `referral_treasury_pool` و لاگ‌های خزانه‌داری
    - [x] فرم اعطای پاداش ادمینی به کاربران فعال از محل صندوق
- [x] ارتقای مدیریت کاربران و تخفیف‌ها در پنل ادمین مالی (`frontend/src/app/(admin)/admin/users/page.tsx` و `discounts/page.tsx`):
  - [x] افزودن چک‌باکس انتخاب چندتایی (Multi-Select / Select All) به جدول کاربران
  - [x] نوار عملیات شناور دسته‌ای (Bulk Action Bar) با کلید **«اعطای تخفیف اشتراک گروهی»**
  - [x] مودال تنظیم درصد تخفیف، مدت زمان اعتبار به روز و ثبت آنی
  - [x] تب یا صفحه جدید مدیریت تخفیف‌های اختصاصی کاربران (`User Discounts Management`).
- [x] پیاده‌سازی برچسب نئونی و اعمال خودکار تخفیف در صفحه پلن‌های اشتراک (`frontend/src/app/(store)/subscriptions/page.tsx` و `checkout/page.tsx`).

---

### فاز ۶: آزمون‌ها، یکپارچه‌سازی و اعتبارسنجی عملیاتی (Verification & Testing)
- [x] نگارش تست‌های واحد و یکپارچگی موتور تسویه هفتگی در `backend/tests/test_weekly_settlement.py`:
  - [x] تست ثبت پورسانت به صورت pending و افزایش pending_balance_toman
  - [x] تست عدم تغییر withdrawable_balance_toman قبل از تسویه
  - [x] تست اجرای کامل تسویه هفتگی و جابجایی مبالغ
  - [x] تست جلوگیری از تسویه تکراری تراکنش‌ها (Idempotency)
- [x] نگارش تست‌های تخفیف‌های کاربرمحور دسته‌ای در `backend/tests/test_user_discounts.py`:
  - [x] تست اعطای دسته‌ای تخفیف به کاربران
  - [x] تست اعمال خودکار در checkout و کسر از قیمت
  - [x] تست مصرف و انقضای تاریخ تخفیف
- [x] اجرای کامل تست سوئیت پروژه (`docker compose -f docker-compose.dev.yml exec -T backend pytest`): قبولی ۱۰۰٪ تست‌ها (۹۵ تست با موفقیت پاس شدند)
- [x] تست بیلد فرانت‌اند با `npm run build` با ۰ خطا و کامپایل تمام روت‌ها.

</div>
