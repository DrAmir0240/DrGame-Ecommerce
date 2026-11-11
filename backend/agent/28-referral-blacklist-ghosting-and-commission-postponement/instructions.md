<div dir="rtl" lang="fa">

# 🚀 دستورالعمل جامع اجرایی گام بیست و هشتم: بلک‌لیست و روح‌کردن کاربر در زنجیره رفرال، محدودیت حساب بانکی و اشتراک، و مدیریت دوحالته رفع تعویق پورسانت‌ها (28-referral-blacklist-ghosting-and-commission-postponement)

> **شماره گام:** ۲۸  
> **عنوان مرحله:** پیاده‌سازی مکانیزم روح‌کردن کاربر در زنجیره‌های رفرال با واریز خودکار پورسانت آن لایه به صندوق کل، ایجاد تب لیست سیاه و پاپ‌آپ تایید دومرحله‌ای با دو چک‌باکس (قطع پورسانت رفرال + لغو و تحریم خرید اشتراک)، ممانعت از ثبت حساب بانکی به نام کاربر بلاک‌شده توسط هر کاربر، و پیاده‌سازی سیستم جامع دوحالته رفع تعویق پورسانت‌ها (کاربر به کاربر و تسویه سراسری).  
> **وابستگی‌ها:** گام‌های ۰۶، ۱۵، ۲۰، ۲۴، ۲۶ و ۲۷  
> **ماژول‌های درگیر:**  
> - بک‌اند: `backend/app/modules/wallet/` (models, services, settlement_service), `backend/app/modules/users/models.py`, `backend/app/modules/subscriptions/services.py`, `backend/app/modules/admin/routers/referral_router.py`  
> - فرانت‌اند: `frontend/src/app/(admin)/admin/referral/chains/page.tsx`, `frontend/src/app/(admin)/admin/referral/settlement/page.tsx`  

---

> [!IMPORTANT]
> **اصول و الزامات تخطی‌ناپذیر معماری گام بیست و هشتم (Core Inviolable Mandates):**
> 1. **تفکیک اساسی «روح‌کردن / مسدودسازی (Ghosting)» از «پنهان‌سازی (Pass-Through)»:**  
>    در سیستم فعلی، فلگ `is_referral_hidden` نقش بای‌پس (Pass-Through) دارد؛ یعنی کاربر پنهان نادیده گرفته شده و پورسانت به معرف بالاتر منتقل می‌شود. اما در **روح‌کردن (Ghosting)**، ساختار لایه‌ها حفظ می‌شود اما کاربر روح‌شده **هیچ پورسانتی دریافت نمی‌کند** و سهم آن لایه به صورت مستقیم و آنی به **استخر صندوق کل پلتفرم (`ReferralTreasuryPool`)** واریز شده و به عنوان لجر `beneficiary_type="treasury"` ثبت می‌گردد. سطوح بعدی بالادست نیز سهم نرمال نصف‌شده خود را دریافت می‌کنند.
> 2. **اعمال اتمیک تیک‌های پاپ‌آپ مسدودسازی:**  
>    پاپ‌آپ مسدودسازی در پنل ادمین رفرال باید دارای دو چک‌باکس صریح و تفکیک‌شده باشد:
>    - **تیک اول (قطع رفرال و روح‌شدن):** کاربر در زنجیره رفرال روح شده و سهم پورسانت او به صندوق واریز می‌شود.
>    - **تیک دوم (لغو و تحریم اشتراک):** تمام اشتراک‌های فعال کاربر در جدول `user_subscriptions` فوراً فسخ (`status="cancelled"`) شده و از خرید و تمدید هرگونه اشتراک جدید در متد `process_checkout` منع می‌گردد.
> 3. **قانون بازدارندگی ثبت حساب بانکی به نام فرد بلاک‌شده (Blacklist Account Restriction):**  
>    هنگامی که کاربری به لیست سیاه اضافه می‌شود، نام و کد ملی او در بلک‌لیست ثبت می‌گردد. در متد `WalletService.add_settlement_account`، هیچ کاربری (چه خود فرد و چه هر کاربر دیگری در پلتفرم) اجازه ثبت شماره شبا، کارت یا حسابی با نام صاحب حساب (`account_holder`) یا کدملی شخص بلاک‌شده را نخواهد داشت و سیستم با خطای ۴۰۰ خط‌قرمزدار مانع آن می‌شود.
> 4. **معماری دوحالته رفع تعویق پورسانت‌ها (Dual-Mode Postponement Settlement):**  
>    ادمین رفرال باید قادر باشد مبالغ تعویق‌شده (Pending) را از دو طریق به موجودی قابل برداشت (Withdrawable) واریز کند:
>    - **حالت الف: کاربر به کاربر (User-by-User):** از طریق اندپوینت `POST /api/admin-referral/settlement/release-user/{user_id}` برای تسویه فوری یک کاربر خاص بدون دستکاری سایر کاربران.
>    - **حالت ب: سراسری (Global Batch):** از طریق اصلاح و فعال‌سازی قطعی اندپوینت `POST /api/admin-referral/settlement/execute` همراه با پاپ‌آپ تایید ساخت‌یافته درون‌برنامه‌ای (جایگزین `window.confirm` ناکارآمد قبلی).

---

## ۱. جدول ماتریس ارتقا و تغییرات سیستم

| بخش | وضعیت فعلی پروژه | وضعیت نهایی گام بیست و هشتم | کامپوننت و فایل‌های هدف |
| :---: | :--- | :--- | :--- |
| **مسدودسازی کاربر در رفرال** | تنها فلگ `is_referral_hidden` وجود دارد که پورسانت را به معرف بالادستی پاس می‌دهد. | پیاده‌سازی مکانیزم روح‌شدن (Ghosting)؛ واریز سهم لایه به صندوق کل پلتفرم، ثبت تراکنش لجر خزانه‌داری | `backend/app/modules/wallet/services.py`<br>`backend/app/modules/wallet/models.py` |
| **پنل زنجیره‌ها (`chains/page.tsx`)** | یک جدول ساده و بدون تب؛ عدم امکان مشاهده افراد بلاک‌شده یا مسدودسازی | افزودن دو تب «زنجیره‌ها» و «لیست سیاه»، دکمه اکشن مسدودسازی، پاپ‌آپ دومرحله‌ای با دو تیک، و تب لیست سیاه با امکان رفع بلاک | `frontend/src/app/(admin)/admin/referral/chains/page.tsx`<br>`backend/app/modules/admin/routers/referral_router.py` |
| **محدودیت حساب بانکی** | هر حسابی بدون بررسی سابقه مسدودیت ثبت می‌شود. | بررسی نام صاحب حساب و کد ملی در `add_settlement_account` و جلوگیری قطعی از ثبت حساب افراد بلک‌لیست | `backend/app/modules/wallet/services.py` |
| **لغو و تحریم اشتراک** | اشتراک کاربر مسدود دست‌نخورده باقی می‌ماند و می‌تواند مجدداً خرید کند. | با فعال‌سازی تیک دوم، اشتراک فعال لغو شده و خرید اشتراک در `process_checkout` مسدود می‌شود. | `backend/app/modules/subscriptions/services.py`<br>`backend/app/modules/users/models.py` |
| **رفع تعویق پورسانت‌ها (Settlement)** | دکمه سراسری در صورت عدم وجود معوقه غیرفعال است یا با خطای مرورگر کار نمی‌کند؛ امکان تسویه کاربر خاص وجود ندارد. | پیاده‌سازی متد و اندپوینت تسویه کاربر خاص (`release-user/{id}`)، فعال‌سازی تسویه سراسری با مودال تایید مدرن و بدون باگ | `backend/app/modules/wallet/settlement_service.py`<br>`backend/app/modules/admin/routers/referral_router.py`<br>`frontend/src/app/(admin)/admin/referral/settlement/page.tsx` |

---

## ۲. طراحی مدل‌ها و ساختار دیتابیس

### ۲.۱. جدول جدید `referral_blacklist`
این جدول تمامی سوابق مسدودسازی، چک‌باکس‌های انتخاب‌شده، دلایل و فراداده‌های امنیتی را نگهداری می‌کند:

```python
class ReferralBlacklist(Base):
    __tablename__ = "referral_blacklist"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Checkbox 1: Ghost in referral chain, divert commissions to treasury
    block_referral: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Checkbox 2: Revoke active subscription & ban from purchasing
    block_subscription: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Metadata preserved for bank account blacklist matching
    blocked_full_name: Mapped[str | None] = mapped_column(String(150), nullable=True, index=True)
    blocked_national_code: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    unblocked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unblocked_by_admin_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
```

### ۲.۲. افزودن فیلدهای تسریع استعلام به مدل `User`
برای جلوگیری از `JOIN`های مکرر در جریان‌های سنگین استریم و خرید اشتراک:
- `is_referral_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)`
- `is_subscription_banned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)`

---

## ۳. الگوریتم‌های فنی هسته سیستم

### ۳.۱. الگوریتم توزیع پورسانت آبشاری با قابلیت روح‌شدن (Ghosting Waterfall Algorithm)
در فایل `backend/app/modules/wallet/services.py` متد `distribute_referral_commission`:
1. دریافت بالادست‌های کاربر خریدار از طریق `get_upline_chain(..., include_hidden=False)`.
2. پیمایش سطوح (Layer 1, Layer 2, ...):
   - محاسبه سهم لایه (`share = current_fraction_pool // 2`).
   - استعلام وضعیت کاربر لایه: آیا `is_referral_blocked == True` است؟
     - **اگر کاربر بلاک/روح شده باشد:**
       - سهم کاربر به کیف پول او اضافه **نمی‌شود** (`pending_balance_toman += 0`).
       - مبلغ `share` مستقیماً به استخر صندوق کل واریز می‌شود:
         ```python
         await cls.credit_treasury_pool(
             db,
             amount_toman=share,
             action_type="ghosted_referral_divert",
             order_id=order_payment_id,
             description=f"واریز سهم لایه {level} کاربر مسدودشده #{upline_id} به صندوق کل پلتفرم",
         )
         db.add(CommissionLedger(
             order_payment_id=order_payment_id or 0,
             beneficiary_type="treasury",
             user_id=upline_id,
             tier_level=level,
             amount_toman=share,
             settlement_status="settled",
             settled_at=datetime.now(timezone.utc),
             description=f"پورسانت لایه {level} به دلیل مسدودیت کاربر #{upline_id} به صندوق کل پلتفرم منتقل شد",
         ))
         ```
       - مقدار `distributed_sum += share` ثبت می‌شود تا مانده استخر درست محاسبه گردد.
     - **اگر کاربر بلاک نباشد:** روال عادی واریز معوقه به کیف پول کاربر (`pending_balance_toman += share`) و لجر با وضعیت `"pending"` ثبت می‌شود.
3. بالادست بعدی در لایه بعدی سهم نصف‌شده خود را به درستی دریافت می‌کند.

### ۳.۲. الگوریتم اعمال مسدودسازی اتمیک با دو چک‌باکس
در متد `WalletService.block_user_in_referral`:
```python
async def block_user_in_referral(
    db: AsyncSession,
    admin_id: int,
    user_id: int,
    block_referral: bool = True,
    block_subscription: bool = False,
    reason: str = "",
) -> dict:
```
1. استخراج مشخصات کاربر (`User`).
2. استخراج نام کامل و کد ملی (در صورت وجود حساب تسویه قبلی یا ثبت در پروفایل).
3. ثبت رکورد در `ReferralBlacklist`.
4. اعمال تیک ۱ (`block_referral=True`):
   - تنظیم `user.is_referral_blocked = True`.
5. اعمال تیک ۲ (`block_subscription=True`):
   - تنظیم `user.is_subscription_banned = True`.
   - فسخ آنی کلیه اشتراک‌های فعال:
     ```python
     stmt = (
         update(UserSubscription)
         .where(UserSubscription.user_id == user_id, UserSubscription.status == "active")
         .values(status="cancelled", end_date=datetime.now(timezone.utc))
     )
     await db.execute(stmt)
     ```
6. ثبت در لاگ بازرسی (`AuditLog`) و کامیت تراکنش.

### ۳.۳. الگوریتم ممانعت از ثبت حساب بانکی برای افراد بلک‌لیست
در متد `WalletService.add_settlement_account`:
1. دریافت نام صاحب حساب (`account_holder`) و کد ملی (`national_code`).
2. استعلام از جدول `ReferralBlacklist`:
   ```python
   norm_holder = account_holder.strip()
   blacklist_stmt = select(ReferralBlacklist).where(
       ReferralBlacklist.is_active == True,
       or_(
           func.lower(ReferralBlacklist.blocked_full_name) == norm_holder.lower(),
           and_(
               ReferralBlacklist.blocked_national_code.is_not(None),
               ReferralBlacklist.blocked_national_code == national_code.strip() if national_code else False
           )
       )
   )
   is_blacklisted = (await db.execute(blacklist_stmt)).scalar_one_or_none()
   if is_blacklisted:
       raise BadRequestException("امکان ثبت این حساب بانکی وجود ندارد؛ نام صاحب حساب یا کد ملی در لیست سیاه سامانه قرار دارد.")
   ```

### ۳.۴. الگوریتم رفع تعویق پورسانت‌ها (کاربر به کاربر و سراسری)
در کلاس `WeeklySettlementService`:

#### ۱. تسویه کاربر خاص (`release_user_pending_commission`):
```python
@staticmethod
async def release_user_pending_commission(
    db: AsyncSession,
    user_id: int,
    executed_by_admin_id: int | None = None,
) -> dict[str, Any]:
```
- لک کردن لجر‌های کاربر: `CommissionLedger.user_id == user_id` و `settlement_status == "pending"`.
- محاسبه مجموع مبالغ.
- افزایش `withdrawable_balance_toman` و کاهش `pending_balance_toman` در کیف پول کاربر.
- تغییر وضعیت لجرها به `settled` با زمان جاری.
- ثبت در تاریخچه تسویه‌ها.

#### ۲. تسویه سراسری کلیه کاربران (`execute_weekly_settlement`):
- بازبینی و حصول اطمینان از رفع کلیه معوقات `pending` برای کلیه کاربران با قفل پایگاه داده (`with_for_update`).
- تولید کد یکتای بچ (`batch_code`) و برگرداندن آمار جامع.

---

## ۴. مشخصات اندپوینت‌های API در بک‌اند (`/api/admin-referral`)

### ۴.۱. مسدودسازی کاربر و ثبت در لیست سیاه
- **مسیر:** `POST /api/admin-referral/users/{user_id}/blacklist`
- **سطح دسترسی:** `require_referral_admin(level=AdminAccessLevel.FULL_CRUD)`
- **بدنه درخواست (JSON):**
  ```json
  {
    "block_referral": true,
    "block_subscription": true,
    "reason": "سوءاستفاده از سیستم رفرال و ایجاد حلقه‌های فیک"
  }
  ```
- **پاسخ موفق (200 OK):**
  ```json
  {
    "status": "success",
    "message": "کاربر با موفقیت در سیستم مسدود شد.",
    "user_id": 42,
    "block_referral": true,
    "block_subscription": true
  }
  ```

### ۴.۲. رفع مسدودیت کاربر از لیست سیاه
- **مسیر:** `DELETE /api/admin-referral/users/{user_id}/blacklist`
- **سطح دسترسی:** `require_referral_admin(level=AdminAccessLevel.FULL_CRUD)`
- **پاسخ موفق (200 OK):**
  ```json
  {
    "status": "success",
    "message": "کاربر با موفقیت از لیست سیاه خارج و رفع مسدودیت شد.",
    "user_id": 42
  }
  ```

### ۴.۳. دریافت لیست سیاه کاربران رفرال
- **مسیر:** `GET /api/admin-referral/blacklist?page=1&limit=50`
- **سطح دسترسی:** `require_referral_admin()`
- **پاسخ موفق (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 1,
        "user_id": 42,
        "username": "gamer_fake",
        "full_name": "علی محمدی",
        "block_referral": true,
        "block_subscription": true,
        "reason": "ایجاد حساب‌های فیک زیرمجموعه",
        "blocked_at": "2026-11-11T12:00:00Z",
        "admin_username": "refral-admin"
      }
    ],
    "total": 1
  }
  ```

### ۴.۴. رفع تعویق و واریز پورسانت کاربر خاص
- **مسیر:** `POST /api/admin-referral/settlement/release-user/{user_id}`
- **سطح دسترسی:** `require_referral_admin(level=AdminAccessLevel.FULL_CRUD)`
- **پاسخ موفق (200 OK):**
  ```json
  {
    "status": "success",
    "message": "پورسانت‌های معوقه کاربر با موفقیت رفع تعویق و به موجودی قابل برداشت واریز شد.",
    "user_id": 42,
    "settled_amount_toman": 150000,
    "transactions_count": 3,
    "new_withdrawable_balance": 250000
  }
  ```

---

## ۵. مشخصات فرانت‌اند و رابط کاربری (UI/UX)

### ۵.۱. ارتقای صفحه زنجیره‌ها ([`frontend/src/app/(admin)/admin/referral/chains/page.tsx`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/(admin)/admin/referral/chains/page.tsx))
1. **طراحی ساختار دو تب (Tabbed View):**
   - **تب ۱: «زنجیره‌ها و پیوندهای رفرال» (Active Chains):** نمایش لیست معرف‌ها و زیرمجموعه‌ها، ستون اکشن «مسدودسازی / روح‌کردن».
   - **تب ۲: «لیست سیاه کاربران» (Blacklist):** نمایش لیست کاربران بلاک‌شده با نشان‌های وضعیت (نشان قرمز قطع رفرال و نشان زرد لغو اشتراک) و دکمه **«رفع مسدودیت»**.
2. **طراحی پاپ‌آپ مسدودسازی (Ghost & Block Modal):**
   - نمایش کارت مشخصات کاربر انتخاب‌شده (شناسه، نام، نقش در زنجیره).
   - چک‌باکس ۱: «قطع دریافت پورسانت و روح‌شدن در زنجیره (انتقال پورسانت‌ها به صندوق کل)».
   - چک‌باکس ۲: «لغو فوری اشتراک فعال و تحریم حساب از خرید هرگونه اشتراک».
   - فیلد متنی وارد کردن دلیل مسدودسازی.
   - دکمه‌های انصراف و تایید قطعی با حالت لودینگ.

### ۵.۲. ارتقای مرکز تسویه هفتگی ([`frontend/src/app/(admin)/admin/referral/settlement/page.tsx`](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/(admin)/admin/referral/settlement/page.tsx))
1. **دکمه رفع تعویق برای تک‌تک کاربران (User-by-User Release):**
   - در جدول پیش‌نمایش معوقات (`previewModalOpen`) و کارت‌های ذی‌نفعان، یک دکمه سبز رنگ با عنوان **«رفع تعویق این کاربر»** قرار داده می‌شود.
   - با کلیک، پاپ‌آپ تایید باز شده و با فراخوانی اندپوینت `release-user/{id}`، مبالغ آن کاربر فوری تسویه و همان سطر به‌روزرسانی می‌شود.
2. **اصلاح و مدرن‌سازی دکمه تسویه سراسری (Global Batch Settlement):**
   - حذف `window.confirm` قدیمی و جایگزینی با دیالوگ تایید شیشه‌ای نئونی فرانت‌اند.
   - تضمین ارسال درست هدرها و هندلینگ خطای صفر تراکنش بدون کرش.
   - رفرش آنی استیت صفحه و نمایش پیام توست موفقیت.

---

## ۶. چک‌لیست تست و تضمین کیفیت (QA Verification)
1. **تست‌های واحد بک‌اند (`pytest`):**
   - نگارش `tests/test_referral_blacklist.py`:
     - تست روح‌شدن کاربر در زنجیره و تضمین واریز سهم آن لایه به `ReferralTreasuryPool`.
     - تست لغو اشتراک فعال کاربر و بلاک شدن در `process_checkout`.
     - تست عدم امکان ثبت حساب بانکی با نام فرد بلاک‌شده در `add_settlement_account`.
     - تست تسویه کاربر به کاربر و کاهش دقیق `pending_balance_toman`.
     - تست رفع مسدودیت و فعال‌سازی مجدد کاربر.
2. **تست بیلد فرانت‌اند Next.js:**
   - اجرای `docker exec drgame-frontend npm run build` و اطمینان از پاس شدن ۱۰۰٪ کامپایل و رندرهای استاتیک.

</div>
