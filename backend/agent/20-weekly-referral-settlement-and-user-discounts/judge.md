<div dir="rtl" lang="fa">

# ⚖️ داوری و ممیزی فنی گام بیستم: سامانه تسویه هفتگی کیف پول رفرال، ارتقای لایه‌های شبکه و تخفیف‌های کاربرمحور دسته‌ای (20-weekly-referral-settlement-and-user-discounts)

> **عنوان گزارش:** ارزیابی تطبیقی و ممیزی کدهای پیاده‌سازی‌شده با نیازمندی‌ها، دستورالعمل‌ها و تسک‌های گام ۲۰  
> **محل قرارگیری سند:** `backend/agent/20-weekly-referral-settlement-and-user-discounts/judge.md`  
> **تاریخ داوری:** نوامبر ۲۰۲۶  
> **رأی نهایی داوری:** 🟡 **قبولی مشروط با اصلاحات مالی و زمان‌بندی (Conditional Pass - 85/100)**

---

## ۱. خلاصه اجرایی و ارزیابی کیفیت پیاده‌سازی (Executive Summary)

گام بیستم با تمرکز بر تحول مدل شارژ کیف پول رفرال از «واریز آنی به موجودی قابل برداشت» به «تسویه چرخه‌ای و هفتگی با نگهداری در وضعیت معلق (Pending)»، توسعه مرکز فرماندهی تسویه در ادمین، کاوشگر شجره‌نامه شبکه، و سیستم نوین تخفیف‌های کاربرمحور متصل به کاربر (`UserDiscount`) با قابلیت اعمال دسته‌ای طراحی شد.

### نکات مثبت و نقاط قوت پیاده‌سازی:
1. **طرح‌بندی پایگاه داده و مایگریشن اَلمبیک (`3dc486a61b14`):** ستون‌های `pending_balance_toman` در `UserWallet`، فیلدهای `settlement_status`، `settled_at` و `settlement_batch_id` در `CommissionLedger` و جدول جدید `settlement_batches` به همراه جدول `user_discounts` به درستی پیاده‌سازی شده و در مدل‌های جنگو ادمین نیز رجیستر شده‌اند.
2. **سرویس تسویه هفتگی (`WeeklySettlementService`):** پیاده‌سازی دقیق متد `preview_weekly_settlement` به عنوان شبیه‌ساز بدون عارضه (Dry Run) و متد اتمیک `execute_weekly_settlement` همراه با قفل بدبینانه (`with_for_update`) و لاگ دقیق دسته‌ها.
3. **سرویس تخفیف‌های کاربرمحور (`UserDiscountService`):** موتور ایجاد دسته‌ای تخفیف‌ها بر اساس لیست شناسه کاربران، استعلام تخفیف فعال با بیشترین درصد در سبد خرید و سوزاندن ایمن تخفیف پس از پرداخت موفق.
4. **رابط‌های کاربری ادمین و کاربر:** پیاده‌سازی کامل صفحات `/admin/referral/settlement`، `/admin/referral/tree`، `/admin/referral/treasury`، مودال تخفیف دسته‌ای در `/admin/users`، و ارتقای کارت‌های داشبورد رفرال با جداسازی موجودی معلق و قابل برداشت و جدول اعضای شبکه با ماسک حریم خصوصی.
5. **پاس شدن تست‌های خودکار:** تمامی تست‌های `test_weekly_settlement.py` و `test_user_discounts.py` با موفقیت پاس شدند.

---

## ۲. جدول ماتریس ارزیابی تطبیقی وظایف (Tasks vs Reality)

| ردیف | وظیفه در `tasks.md` | وضعیت در کد واقعی | کیفیت | محل بررسی در کدبیس | توضیحات داوری |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **۱** | افزودن `pending_balance_toman` به `UserWallet` | ✅ انجام شد | عالی | `backend/app/modules/wallet/models.py:16` | با مقدار پیش‌فرض صفر و نوع `BigInteger` پیاده شد. |
| **۲** | افزودن وضعیت تسویه به `CommissionLedger` | ✅ انجام شد | عالی | `backend/app/modules/wallet/models.py:34-36` | ستون‌های `settlement_status`, `settled_at`, `settlement_batch_id` با ایندکس ایجاد شدند. |
| **۳** | مدل `SettlementBatch` | ✅ انجام شد | عالی | `backend/app/modules/wallet/models.py:46-59` | کد پیگیری، شمارنده ذی‌نفعان، بازه تاریخی دوره و مجری ذخیره می‌شود. |
| **۴** | مدل `UserDiscount` | ✅ انجام شد | عالی | `backend/app/modules/subscriptions/models.py:84-100` | شناسه کاربر، درصد، سقف، پلن‌های مشمول و انقضا به درستی لحاظ شدند. |
| **۵** | توقف واریز آنی و افزایش موجودی معلق | ✅ انجام شد | عالی | `backend/app/modules/wallet/services.py:270-278` | پورسانت فقط به `pending_balance_toman` واریز می‌شود. |
| **۶** | متدهای پیش‌نمایش، اجرا و تاریخچه تسویه | ✅ انجام شد | عالی | `backend/app/modules/wallet/settlement_service.py:48-220` | لاجیک محاسبات دقیق، اتمیک و ایمن در برابر Race Condition است. |
| **۷** | سرویس و اندپوینت‌های تخفیف کاربرمحور | ✅ انجام شد | خوب | `subscriptions/discount_service.py` & `finance_router.py` | ایجاد گروهی، اعتبارسنجی تاریخ و اعمال خودکار در تسویه‌حساب اشتراک. |
| **۸** | صفحات پنل ادمین (تسویه، شجره‌نامه، خزانه‌داری) | ✅ انجام شد | عالی | `frontend/src/app/(admin)/admin/referral/...` | فرانت‌اند ادمین دارای تمام دکمه‌ها، پیش‌نمایش و کاوشگر بصری درخت است. |
| **۹** | جاب خودکار کرون‌جاب تسویه در پایان هفته | ❌ انجام نشد | ناقص | `backend/app/tasks/scheduler.py` | در اسکیژولر بک‌اند رجیستر نشده و وابسته به اجرای دستی ادمین است! |
| **۱۰** | پیشگیری از پرداخت دوبل پاداش ادمین در تسویه | ❌ باگ مالی | بحرانی | `backend/app/modules/wallet/services.py:129` | رکورد لجر پاداش با دیفالت `pending` ذخیره شده و در تسویه مجدداً واریز می‌شود! |
| **۱۱** | اتمیسیتی تراکنش در مصرف تخفیف | ⚠️ کاستی | متوسط | `subscriptions/discount_service.py:115` | متد `consume_user_discount` حاوی `commit()` مستقل است و اتمیسیتی را مخدوش می‌کند. |

---

## ۳. کاستی‌ها، ایرادات و خطاهای کشف‌شده (Defects & Issues)

### ایراد اول (بحرانی - باگ نشت مالی و واریز مجدد): Double Payout Bug در اعطای پاداش خزانه‌داری
* **محل خطا:** `backend/app/modules/wallet/services.py` در متد `admin_grant_treasury_reward` (خطوط ۱۲۹ تا ۱۳۷):
```python
wallet = await cls.get_or_create_wallet(db, user_id)
wallet.withdrawable_balance_toman += amount_toman
wallet.total_earned_toman += amount_toman

ledger = CommissionLedger(
    order_payment_id=0,
    beneficiary_type="user",
    user_id=user_id,
    tier_level=0,
    amount_toman=amount_toman,
    description=f"پاداش ویژه از صندوق پلتفرم: {description or 'جایزه ادمین'}",
    # settlement_status مشخص نشده است!
)
db.add(ledger)
```
* **ریشه‌یابی خطا:** وقتی ادمین از طریق پنل خزانه‌داری به یک کاربر پاداش می‌دهد، موجودی مستقیماً و بلافاصله به `withdrawable_balance_toman` او اضافه می‌شود. اما رکورد لجر بدون تعیین `settlement_status` ثبت می‌شود و در نتیجه مقدار پیش‌فرض مدل یعنی `"pending"` را دریافت می‌کند. سپس در پایان هفته، موتور `WeeklySettlementService.execute_weekly_settlement` تمام لجر‌های `pending` مربوط به کاربر را پیدا کرده و مبلغ را **یک بار دیگر** به `withdrawable_balance_toman` اضافه می‌کند! یعنی کاربر دو برابر پاداش دریافت می‌کند.
* **راه حل:**
در زمان ساخت لجر در `admin_grant_treasury_reward` باید وضعیت صریحاً `settled` ثبت شود:
```python
ledger = CommissionLedger(
    order_payment_id=0,
    beneficiary_type="user",
    user_id=user_id,
    tier_level=0,
    amount_toman=amount_toman,
    description=f"پاداش ویژه از صندوق پلتفرم: {description or 'جایزه ادمین'}",
    settlement_status="settled",
    settled_at=datetime.now(timezone.utc),
)
```

---

### ایراد دوم (معماری - عدم زمان‌بندی خودکار): نبود تسویه خودکار جمعه‌شب‌ها در Scheduler
* **محل خطا:** `backend/app/tasks/scheduler.py`
* **ریشه‌یابی خطا:** طبق بند ۲ الزامات تخطی‌ناپذیر معماری و دیاگرام توالی گام ۲۰، تسویه باید جمعه‌ها ساعت ۲۳:۵۹ به صورت خودکار اجرا شود (`Cron -> WalletSvc`). اما در `scheduler.py` صرفاً تابع `daily_rawg_sync_task` تعریف شده و هیچ تسک کرونی برای تسویه هفتگی اضافه نشده است. اگر ادمین دکمه دستی را نزند، موجودی کاربران برای همیشه در حالت معلق باقی می‌ماند.
* **راه حل:**
افزودن تابع تسک و کرون تریگر به `scheduler.py`:
```python
async def weekly_referral_settlement_task():
    """Weekly cron job: Friday 23:59 UTC settlement cycle."""
    logger.info("Executing scheduled weekly referral settlement cycle...")
    try:
        from app.core.database import AsyncSessionLocal
        from app.modules.wallet.settlement_service import WeeklySettlementService
        async with AsyncSessionLocal() as db:
            res = await WeeklySettlementService.execute_weekly_settlement(
                db=db, executed_by_type="cron", executed_by_admin_id=None
            )
            logger.info(f"Weekly settlement completed: {res}")
    except Exception as e:
        logger.error(f"Weekly settlement task failed: {e}")

# داخل start_scheduler:
scheduler.add_job(
    weekly_referral_settlement_task,
    trigger=CronTrigger(day_of_week="fri", hour=23, minute=59),
    id="weekly_referral_settlement",
    replace_existing=True,
)
```

---

### ایراد سوم (اتمیسیتی تراکنش دیتابیس): فراخوانی `commit` زودرس در `consume_user_discount`
* **محل خطا:** `backend/app/modules/subscriptions/discount_service.py` (خط ۱۱۵):
* **ریشه‌یابی خطا:** در متد `consume_user_discount` دستور `await db.commit()` فراخوانی می‌شود. این متد در جریان `process_checkout` فراخوانی می‌گردد. اگر پس از کسر تخفیف، عملیات بعدی صدور اشتراک یا ثبت پورسانت خطا دهد، تخفیف کاربر سوخته ولی اشتراکی برای او صادر نشده است.
* **راه حل:** دستور `await db.commit()` را از داخل `consume_user_discount` حذف کرده و به جای آن از `await db.flush()` استفاده شود تا مدیریت تراکنش به کنترلر اصلی واگذار گردد.

---

### ایراد چهارم (فرانت‌اند): محدود ماندن فیلتر تراکنش‌ها به لایه‌های ۱ تا ۳
* **محل خطا:** `frontend/src/app/(dashboard)/referral/page.tsx` (خط ۶۶):
```typescript
const [selectedLayer, setSelectedLayer] = useState<'1' | '2' | '3' | 'all'>('all');
```
* **ریشه‌یابی خطا:** با اینکه معماری شبکه به آبشار نامحدود (Infinite Waterfall) تغییر کرده و تب‌های اعضا لایه‌های ۴ و ۵+ را نمایش می‌دهند، دراپ‌داون فیلتر تراکنش‌های پورسانت همچنان روی لایه‌های ۱ تا ۳ قفل مانده است.
* **راه حل:** تعمیم این متغیر به اعداد پویا یا `number | 'all'`.

---

## ۴. جمع‌بندی رأی داوری گام ۲۰

بخش اعظم گام بیستم با دقت فنی و کدنویسی بسیار تمیز پیاده شده است. با این حال، به دلیل وجود **باگ مالی واریز مضاعف در پاداش ادمین** و **فراموش شدن جاب کرون هفتگی در اسکیژولر**، این گام نیازمند اعمال پچ‌های اصلاحی فوق است تا به وضعیت قبولی ۱۰۰٪ برسد.

</div>
