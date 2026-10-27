# 📋 چک‌لیست اجرایی گام ششم: سامانه بازاریابی ارجاعی و کیف پول (06-referral-system)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم (Alembic Migration)
- [x] پیاده‌سازی مدل‌های `UserWallet`, `ReferralChain`, `CommissionLedger`, `SettlementAccount`, `WithdrawalRequest` در `backend/app/modules/wallet/models.py`
- [x] ایجاد فایل مایگریشن Alembic درون داکر: `docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "feat: add wallet, referral and settlement tables"`
- [x] اجرای مایگریشن در کانتینر: `docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head` و اعتبارسنجی با `alembic check`

### فاز ۲: موتور تخصیص پورسانت آبشاری (Commission Waterfall Engine)
- [x] پیاده‌سازی الگوریتم تسهیم مبالغ (۷۹٪ سهم فروشگاه، ۲۱٪ صندوق پورسانت) بر پایه فایل `source/referral/SYSTEM-PROPOSAL-FA.md` در `backend/app/modules/wallet/services.py`
- [x] پیاده‌سازی لاجیک نصف‌شدن متوالی سهم در زنجیره بالادستی (۵۰٪ معرف اول، ۲۵٪ دوم، ۱۲.۵٪ سوم و...)
- [x] پیاده‌سازی بررسی شرط فعال بودن اشتراک معرف در لحظه فروش و انتقال سهم به دفتر مدیرعامل در صورت عدم اشتراک فعال
- [x] پیاده‌سازی تقسیم ۵۰-۵۰ مانده نهایی میان دفتر مدیرعامل و صندوق ذخیره تخفیف‌ها
- [x] مدیریت دقیق گردکردن مبالغ فرد پولی بدون کسری و اتصال به تراکنش‌های پرداخت اشتراک در `subscriptions/services.py`

### فاز ۳: مدیریت کیف پول و متدهای دوگانه تسویه (Wallet & Settlement Accounts)
- [x] پیاده‌سازی متدهای ثبت و ویرایش حساب بانکی ریالی (شبا و کارت) و آدرس کیف پول کریپتو (USDT) با وضعیت اولیه «در انتظار تایید»
- [x] پیاده‌سازی ثبت درخواست برداشت وجه از کیف پول و اعتبارسنجی کفایت موجودی کاربر
- [x] پیاده‌سازی متدهای واکشی تاریخچه تراکنش‌ها و سطوح شبکه رفرال کاربر

### فاز ۴: پیاده‌سازی روترها و شِماهای Pydantic V2 (API Layer)
- [x] تدوین DTOهای ورودی و خروجی در `backend/app/modules/wallet/schemas.py`
- [x] پیاده‌سازی روت‌های `GET /api/referral/stats`, `GET /api/referral/transactions`, `GET /api/referral/settlement-accounts`, `POST /api/referral/settlement-accounts`, `POST /api/referral/withdraw` در `backend/app/modules/wallet/router.py`
- [x] رجیستر روتر `wallet` در `backend/app/main.py`

### فاز ۵: تست‌نویسی خودکار دو لایه بک‌اند (Pytest Suite - الزام ۱۰۰٪ قبولی)
- [x] نگارش تست‌های واحد محاسبات دقیق پورسانت، زنجیره چندسطحی و سناریوی معرف غیرفعال در `backend/app/modules/wallet/tests/test_services.py`
- [x] نگارش تست‌های یکپارچگی روت‌های رفرال و درخواست‌های برداشت در `backend/app/modules/wallet/tests/test_router.py` (پوشش کدهای 200, 400, 401, 422)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی

### فاز ۶: توسعه فرانت‌اند و اتصال به بک‌اند (Frontend Integration)
- [x] ایجاد فایل تایپ‌های رفرال و کیف پول در `frontend/src/types/referral.ts`
- [x] پیاده‌سازی کارت‌های آماری درآمد، موجودی و کد رفرال در `frontend/src/components/referral/ReferralStatsCards.tsx`
- [x] طراحی و پیاده‌سازی مودال ثبت حساب بانکی و کیف پول کریپتو در `frontend/src/components/referral/SettlementAccountsModal.tsx`
- [x] پیاده‌سازی مودال درخواست برداشت وجه از کیف پول در `frontend/src/components/referral/WithdrawalModal.tsx`
- [x] پیاده‌سازی جدول تاریخچه تراکنش‌های کیف پول با صفحه‌بندی در `frontend/src/components/referral/TransactionsTable.tsx`
- [x] طراحی و پیاده‌سازی صفحه کامل داشبورد رفرال کاربری در `frontend/src/app/(dashboard)/referral/page.tsx`

### فاز ۷: اعتبارسنجی نهایی و بیلد
- [x] بررسی تایپ‌اسکریپت و لینتر فرانت‌اند در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] تست کامل فرآیند خرید اشتراک توسط زیرمجموعه و بررسی شارژ آنی و دقیق پورسانت در کیف پول معرف
