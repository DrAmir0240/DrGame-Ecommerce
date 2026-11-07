<div dir="rtl" lang="fa">

# 📋 چک‌لیست وظایف اجرایی گام بیستم: سامانه تسویه هفتگی کیف پول رفرال، ارتقای لایه‌های شبکه و تخفیف‌های کاربرمحور دسته‌ای (Tasks Checklist)

> **گام:** ۲۰  
> **عنوان:** سامانه جامع تسویه چرخه‌ای هفتگی کیف پول رفرال، ثبت تراکنش‌های پورسانت معلق، بازطراحی داشبورد رفرال کاربری با لایه‌های نامحدود پویا و شبیه‌ساز سود، توسعه مرکز تسویه و شجره‌نامه در پنل ادمین رفرال، و استقرار سامانه تخفیف‌های کاربرمحور با قابلیت انتساب دسته‌ای گروهی (Bulk Assignment) در بخش اشتراک‌ها  
> **وضعیت کلی:** ⏳ در فاز تدوین و برنامه‌ریزی (Ready for Implementation)  

---

### فاز ۱: طرح‌بندی پایگاه داده و مهاجرت‌ها (Database Schema & Migrations)
- [ ] به‌روزرسانی مدل `UserWallet` در `backend/app/modules/wallet/models.py`:
  - [ ] افزودن ستون `pending_balance_toman: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)`
- [ ] به‌روزرسانی مدل `CommissionLedger` در `backend/app/modules/wallet/models.py`:
  - [ ] افزودن ستون `settlement_status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)`
  - [ ] افزودن ستون `settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)`
  - [ ] افزودن ستون `settlement_batch_id: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)`
- [ ] ایجاد مدل جدید `SettlementBatch` در `backend/app/modules/wallet/models.py`:
  - [ ] ستون‌های `id`, `batch_code`, `total_amount_toman`, `total_transactions_count`, `beneficiaries_count`, `executed_by_type`, `executed_by_admin_id`, `period_start`, `period_end`, `created_at`
- [ ] ایجاد مدل جدید `UserDiscount` در `backend/app/modules/subscriptions/models.py`:
  - [ ] ستون‌های `id`, `user_id`, `title`, `discount_percent`, `max_discount_toman`, `applicable_tier_codes`, `starts_at`, `expires_at`, `is_used`, `used_at`, `order_payment_id`, `is_active`, `created_by_admin_id`, `created_at`
- [ ] ثبت مدل‌های جدید در `admin-panel/apps/drgame_wallet/` و `admin-panel/apps/drgame_catalog/` جنگو ادمین
- [ ] تولید و اعمال مایگریشن Alembic:
  - [ ] اجرای دستور `alembic revision --autogenerate -m "feat: add weekly settlement, pending balance, and user discounts"`
  - [ ] اعتبارسنجی فایل مایگریشن و اجرای `alembic upgrade head`.

---

### فاز ۲: موتور تسویه هفتگی و منطق کیف پول در بک‌اند (`Weekly Settlement Engine`)
- [ ] اصلاح متد `distribute_referral_commission` در `backend/app/modules/wallet/services.py`:
  - [ ] ثبت رکوردهای پورسانت در `CommissionLedger` با `settlement_status = "pending"`
  - [ ] افزایش `wallet.pending_balance_toman` (توقف واریز آنی به `withdrawable_balance_toman`)
- [ ] توسعه سرویس تسویه هفتگی `WeeklySettlementService` در `backend/app/modules/wallet/settlement_service.py`:
  - [ ] متد `preview_weekly_settlement(db: AsyncSession) -> dict`: پیش‌نمایش آماری دوره‌های تسویه هفتگی (حجم پورسانت‌های معلق، تعداد کاربران، لیست جزئیات بدون اعمال در دیتابیس)
  - [ ] متد `execute_weekly_settlement(db: AsyncSession, executed_by_admin_id: int | None = None) -> dict`: اجرای اتمیک تسویه هفتگی، انتقال مبالغ به `withdrawable_balance_toman`، صفر کردن موجودی معلق، تغییر وضعیت لجر به `settled`، و صدور رکورد `SettlementBatch`
  - [ ] متد `get_settlement_history(db: AsyncSession, page: int, page_size: int) -> dict`: دریافت تاریخچه دوره‌های تسویه انجام‌شده
- [ ] اصلاح اسکیماهای کیف پول در `backend/app/modules/wallet/schemas.py`:
  - [ ] افزودن `pending_balance_toman` و `next_settlement_date` به `ReferralSummaryResponse`
  - [ ] افزودن `settlement_status` و `settled_at` به `CommissionTransaction`
- [ ] ایجاد اندپوینت‌های جدید در `backend/app/modules/wallet/router.py`:
  - [ ] `GET /api/referral/network-tree`: دریافت ساختار درختی و آمار اعضای شبکه کاربر به تفکیک تمام لایه‌ها
  - [ ] `GET /api/referral/members`: دریافت لیست ماسک‌شده اعضای زیرمجموعه با لایه و وضعیت اشتراک.

---

### فاز ۳: ماژول تخفیف‌های کاربرمحور دسته‌ای در بک‌اند (`User Discounts Engine`)
- [ ] توسعه سرویس تخفیف‌های کاربر در `backend/app/modules/subscriptions/discount_service.py`:
  - [ ] متد `create_bulk_user_discounts(db: AsyncSession, user_ids: list[int], discount_percent: int, duration_days: int, title: str, applicable_tier_codes: list[str], admin_id: int | None) -> list[UserDiscount]`
  - [ ] متد `get_active_user_discount(db: AsyncSession, user_id: int) -> UserDiscount | None`: بررسی تخفیف‌های معتبر (`expires_at > now()` و `is_used == False`)
  - [ ] متد `consume_user_discount(db: AsyncSession, discount_id: int, order_payment_id: int) -> None`
- [ ] ادغام تخفیف کاربرمحور در فرآیند استعلام و خرید اشتراک (`subscriptions`):
  - [ ] به‌روزرسانی `GET /api/subscriptions/tiers` جهت تزریق درصد و قیمت تخفیف‌خورده به کاربران دارای تخفیف
  - [ ] به‌روزرسانی `process_checkout` جهت اعمال خودکار تخفیف فعال کاربر و سوزاندن رکورد تخفیف پس از پرداخت موفق
- [ ] ایجاد اندپوینت‌های ادمین در `backend/app/modules/admin/routers/finance_router.py`:
  - [ ] `POST /api/admin-finance/user-discounts/bulk`: اعطای دسته‌ای تخفیف به کاربران انتخاب‌شده
  - [ ] `GET /api/admin-finance/user-discounts`: لیست تخفیف‌های اختصاصی صادرشده به همراه فیلتر وضعیت
  - [ ] `DELETE /api/admin-finance/user-discounts/{id}`: ابطال تخفیف کاربر.

---

### فاز ۴: بازطراحی داشبورد رفرال کاربری در فرانت‌اند (`Frontend User Dashboard`)
- [ ] به‌روزرسانی تایپ‌ها در `frontend/src/types/referral.ts`:
  - [ ] افزودن `pending_balance_toman` و `next_settlement_at` به `ReferralStats`
  - [ ] اینترفیس‌های `NetworkLevelStat` و `ReferralMemberItem`
- [ ] بازطراحی کارت‌های بالای صفحه در `frontend/src/components/referral/ReferralStatsCards.tsx`:
  - [ ] کارت مجزای «موجودی قابل برداشت (تسویه‌شده)» با دکمه برداشت
  - [ ] کارت مجزای «پورسانت در انتظار تسویه هفتگی» با برچسب روز و ساعت موعد تسویه بعدی
- [ ] بازطراحی تفکیک لایه‌های شبکه در `frontend/src/app/(dashboard)/referral/page.tsx`:
  - [ ] حذف دراپ‌داون ۳ لایه و ایجاد تب‌های تعاملی لایه‌های ۱ تا ۴ و لایه‌های عمیق‌تر ۵+
  - [ ] نمایش سهم درصدی هر لایه، تعداد اعضا، مشترکین فعال و سود تجمیعی هر لایه
- [ ] پیاده‌سازی کامپوننت جدول اعضای شبکه (`ReferralNetworkTable.tsx`):
  - [ ] نمایش اسامی ماسک‌شده، تاریخ عضویت، سطح شبکه، و وضعیت اشتراک
- [ ] پیاده‌سازی کامپوننت شبیه‌ساز درآمد رفرال (`ReferralCalculatorModal.tsx`):
  - [ ] اسلایدر تعاملی محاسبه درآمد ماهانه بر اساس تعداد خریداران و پلن انتخابی
- [ ] اضافه کردن بخش جعبه‌ابزار بازاریابی (Marketing Toolkit):
  - [ ] دکمه کپی لینک + دکمه کپی متن آماده پیام‌رسان‌ها (تلگرام، ایتا، واتساپ).

---

### فاز ۵: ارتقای پنل‌های ادمین رفرال و مالی در فرانت‌اند (`Frontend Admin Panel`)
- [ ] ارتقای پنل ادمین رفرال (`frontend/src/app/(admin)/admin/referral/`):
  - [ ] پیاده‌سازی صفحه مرکز تسویه هفتگی (`/admin/referral/settlement/`):
    - [ ] مشاهده مجموع پورسانت‌های معلق هفته و تعداد ذی‌نفعان
    - [ ] دکمه پیش‌نمایش تسویه هفتگی (Dry-Run Modal)
    - [ ] دکمه اجرای دستی تسویه هفتگی با لاگ و شماره بچ
    - [ ] جدول تاریخچه بچ‌های تسویه‌شده هفتگی
  - [ ] پیاده‌سازی کاوشگر شجره‌نامه رفرال (`/admin/referral/tree/`):
    - [ ] سرچ کاربر و نمایش مسیر بالادستی (Uplines) و ساختار درختی پایین‌دستی (Downlines)
    - [ ] کلید تغییر وضعیت کاربر مخفی (`is_referral_hidden`)
  - [ ] پیاده‌سازی داشبورد خزانه‌داری پلتفرم (`/admin/referral/treasury/`):
    - [ ] نمایش موجودی `referral_treasury_pool` و لاگ‌های خزانه‌داری
    - [ ] فرم اعطای پاداش ادمینی به کاربران فعال از محل صندوق
- [ ] ارتقای مدیریت کاربران و تخفیف‌ها در پنل ادمین مالی (`frontend/src/app/(admin)/admin/users/page.tsx` و `discounts/page.tsx`):
  - [ ] افزودن چک‌باکس انتخاب چندتایی (Multi-Select / Select All) به جدول کاربران
  - [ ] نوار عملیات شناور دسته‌ای (Bulk Action Bar) با کلید **«اعطای تخفیف اشتراک گروهی»**
  - [ ] مودال تنظیم درصد تخفیف، مدت زمان اعتبار به روز و ثبت آنی
  - [ ] تب یا صفحه جدید مدیریت تخفیف‌های اختصاصی کاربران (`User Discounts Management`).
- [ ] پیاده‌سازی برچسب نئونی و اعمال خودکار تخفیف در صفحه پلن‌های اشتراک (`frontend/src/app/(store)/subscriptions/page.tsx` و `checkout/page.tsx`).

---

### فاز ۶: آزمون‌ها، یکپارچه‌سازی و اعتبارسنجی عملیاتی (Verification & Testing)
- [ ] نگارش تست‌های واحد و یکپارچگی موتور تسویه هفتگی در `backend/tests/test_weekly_settlement.py`:
  - [ ] تست ثبت پورسانت به صورت pending و افزایش pending_balance_toman
  - [ ] تست عدم تغییر withdrawable_balance_toman قبل از تسویه
  - [ ] تست اجرای کامل تسویه هفتگی و جابجایی مبالغ
  - [ ] تست جلوگیری از تسویه تکراری تراکنش‌ها (Idempotency)
- [ ] نگارش تست‌های تخفیف‌های کاربرمحور دسته‌ای در `backend/tests/test_user_discounts.py`:
  - [ ] تست اعطای دسته‌ای تخفیف به ۱۰ کاربر
  - [ ] تست اعمال خودکار در checkout و کسر از قیمت
  - [ ] تست انقضای تاریخ تخفیف
- [ ] اجرای کامل تست سوئیت پروژه (`docker compose -f docker-compose.dev.yml exec -T backend pytest`): قبولی ۱۰۰٪ تست‌ها
- [ ] تست بیلد فرانت‌اند با `npx tsc --noEmit` و `npm run build` با ۰ خطا.

</div>
