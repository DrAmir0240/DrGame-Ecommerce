# 📋 چک‌لیست اجرایی گام چهارم: پلن‌های اشتراک و موتور سهمیه دانلود (04-subscriptions-and-quota)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.

---

### فاز ۱: مدل‌های پایگاه داده و مایگریشن سالم (Alembic Migration)
- [x] پیاده‌سازی مدل‌های `SubscriptionTier`, `UserSubscription`, `FreeTierAllowedGame`, `DiscountCode`, `OrderPayment` در `backend/app/modules/subscriptions/models.py`
- [x] پیاده‌سازی مدل‌های `UserQuota` و `QuotaConsumptionLog` در `backend/app/modules/quota/models.py`
- [x] ایجاد فایل مایگریشن Alembic درون داکر: `docker compose -f docker-compose.dev.yml run --rm backend alembic revision --autogenerate -m "feat: add subscription tiers, quotas and checkout models"`
- [x] اجرای مایگریشن در کانتینر: `docker compose -f docker-compose.dev.yml run --rm backend alembic upgrade head` و اعتبارسنجی با `alembic check`
- [x] بذر اولیه (Seed) ۴ پلن اشتراک (رایگان، برنز، نقره‌ای، طلایی) در پایگاه داده

### فاز ۲: موتور سهمیه دانلود و وب‌هوک کال‌بک سرور دانلود (Quota Engine)
- [x] پیاده‌سازی سرویس سهمیه `backend/app/modules/quota/services.py`: استعلام سهمیه، شارژ سهمیه و کش در Redis با کلید `drgame:user:{user_id}:quota`
- [x] پیاده‌سازی اعتبارسنجی امضای امنیتی HMAC برای درخواست‌های وب‌هوک سرور دانلود
- [x] پیاده‌سازی متد کسر بایت‌های مصرف‌شده از `UserQuota`، ثبت در `QuotaConsumptionLog` و ابطال/به‌روزرسانی کش ردیس
- [x] پیاده‌سازی اندپوینت امن کال‌بک در `backend/app/modules/quota/router.py`: `POST /api/quota/callback/consume`

### فاز ۳: پیاده‌سازی لایه سرویس اشتراک‌ها و تسویه‌حساب (Service Layer)
- [x] پیاده‌سازی متدهای استعلام پلن‌ها و بررسی پلن فعال کاربر در `backend/app/modules/subscriptions/services.py`
- [x] پیاده‌سازی موتور اعتبارسنجی کدهای تخفیف (درصدی/مبلغی، سقف تخفیف، تاریخ انقضا و تعداد استفاده)
- [x] پیاده‌سازی لاجیک تسویه‌حساب شبیه‌سازی‌شده (ثبت پرداخت، صدور اشتراک ۳۰ روزه، و فراخوانی شارژ سهمیه در ماژول quota)
- [x] پیاده‌سازی مدیریت لیست بازی‌های رایگان پلن Free

### فاز ۴: پیاده‌سازی روترها و شِماهای Pydantic V2 (API Layer)
- [x] تدوین DTOهای ورودی و خروجی در `subscriptions/schemas.py` و `quota/schemas.py`
- [x] پیاده‌سازی روت‌های `GET /api/subscriptions/tiers`, `GET /api/subscriptions/my-status`, `POST /api/checkout/apply-discount`, `POST /api/checkout/process`
- [x] رجیستر روترها در `backend/app/main.py`

### فاز ۵: تست‌نویسی خودکار دو لایه بک‌اند (Pytest Suite - الزام ۱۰۰٪ قبولی)
- [x] نگارش تست‌های واحد سرویس در `backend/app/modules/quota/tests/test_services.py` (محاسبات حجم، اعتبارسنجی HMAC و کسر سهمیه)
- [x] نگارش تست‌های واحد سرویس در `backend/app/modules/subscriptions/tests/test_services.py` (محاسبه تخفیف، اعتبار ۳۰ روزه و پلن‌ها)
- [x] نگارش تست‌های یکپارچگی اندپوینت‌ها در روترهای هر دو ماژول (پوشش کدهای 200, 400, 401, 403, 422)
- [x] اجرای کامل آزمون‌ها در داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest -v` و کسب ۱۰۰٪ قبولی

### فاز ۶: توسعه فرانت‌اند و اتصال به بک‌اند (Frontend Integration)
- [x] ایجاد تعاریف تایپ‌های اشتراک و سهمیه در `frontend/src/types/subscription.ts`
- [x] پیاده‌سازی ویجت کپسولی وضعیت سهمیه در `frontend/src/components/layout/QuotaPill.tsx` با نمایش لحظه‌ای حجم مصرف‌شده و باقیمانده
- [x] ادغام ویجت `QuotaPill` در هدر سراسری سایت `frontend/src/components/layout/Header.tsx`
- [x] پیاده‌سازی کارت‌های مقایسه‌ای ۴گانه در `frontend/src/components/subscriptions/TierCard.tsx` با استایل‌های برنز، نقره‌ای، طلایی و نمادهای پلی‌استیشن
- [x] طراحی و پیاده‌سازی صفحه پلن‌ها در `frontend/src/app/(store)/subscriptions/page.tsx`
- [x] طراحی و پیاده‌سازی صفحه تسویه‌حساب در `frontend/src/app/(store)/checkout/page.tsx` با قابلیت اعمال کد تخفیف و دکمه پرداخت شبیه‌سازی‌شده

### فاز ۷: اعتبارسنجی نهایی و بیلد
- [x] بررسی تایپ‌اسکریپت و لینتر فرانت‌اند در داکر: `docker compose -f docker-compose.dev.yml run --rm frontend npx tsc --noEmit`
- [x] تست کامل فرآیند خرید اشتراک از فرانت‌اند، شارژ سهمیه و مشاهده آن در کپسول هدر
- [x] ارسال تست وب‌هوک کسر سهمیه به `/api/quota/callback/consume` و مشاهده کسر آنی حجم در کپسول هدر
