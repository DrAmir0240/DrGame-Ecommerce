<div dir="rtl" lang="fa">

# 🚀 دستورالعمل اجرایی گام دوازدهم: حذف کامل دیتای ایستا و پیاده‌سازی بخش‌های تکمیلی سامانه (12-zero-static-data-and-missing-features)

> **شماره گام:** ۱۲  
> **عنوان مرحله:** حذف قطعی ۱۰۰٪ دیتای ایستا و هاردکدشده، یکپارچه‌سازی بلادرنگ API با فرانت‌اند، پیاده‌سازی سامانه تیکت‌های پشتیبانی کاربر و ادمین، سوابق فاکتورها و پرداخت‌ها، مرکز اعلانات، کاروسل ۵ بازی مشابه و مدیریت ژانرها در ادمین  
> **وابستگی‌ها:** گام‌های ۰۱ تا ۱۱  
> **مرجع سیاست‌ها:** `agent/development-policy.md` (بخش‌های ۲، ۳، ۴ و ۶)، `build.txt` (بندهای ۱-۱-۴-۴، ۱-۲-۲، ۱-۲-۳، ۱-۲-۶، ۱-۳-۳، ۱-۳-۹) و گزارش حسابرسی `reports/03.md`

---

> [!IMPORTANT]
> **قانون قطعی و بدون استثنای گام دوازدهم (Zero Static Data Mandate):**
> هیچ کامپوننت، ویجت، کارت یا صفحه‌ای در سامانه نباید از آرایه‌ها، متغیرها، یا داده‌های ایستا (Hardcoded Mock Data) استفاده کند. تمامی محتواها، اسلایدرها، لیست‌ها، و آمارها باید مستقیماً و به صورت بلادرنگ از اندپوینت‌های متناظر در بک‌اند واکشی شده و تغییرات بلافاصله در پایگاه داده ذخیره گردند.

---

## ۱. اهداف و نیازمندی‌های عملکردی (Functional Requirements & Overview)

این مرحله پس از ارزیابی موشکافانه سیستم در گزارش `reports/03.md` تدوین شده و اهداف کلیدی زیر را محقق می‌سازد:

1. **سامانه جامع تیکت‌های پشتیبانی (Support Tickets System):**
   - پیاده‌سازی ماژول مستقل `tickets` در بک‌اند همراه با مدل‌های دیتابیس `Ticket` و `TicketMessage`.
   - **سمت کاربر:** ایجاد صفحه `/dashboard/tickets` شامل فیلتر بر اساس دپارتمان و وضعیت، دکمه «ثبت تیکت جدید» با مودال فرم، و باز شدن تاریخچه کامل گفتگوی دوطرفه در **مودال جزئیات** (مطابق با تصمیم تاییدشده کاربر و بند ۱-۲-۶ سند `build.txt`).
   - **سمت ادمین:** اتصال کامل صفحه `/admin/tickets` به دیتابیس واقعی، امکان پاسخ‌دهی رسمی ادمین با تغییر وضعیت خودکار به `answered` و صدور نوتیفیکیشن بلادرنگ به کاربر.
2. **سوابق تراکنش‌ها و پرداخت‌های اشتراک کاربر (`/dashboard/payments`):**
   - ایجاد صفحه مستقل در سایدبار پنل کاربری برای مشاهده کلیه تراکنش‌های موفق و ناموفق خرید اشتراک (ریالی و ارزی)، کد رهگیری شاپرک / هش شبکه تتر، و باز شدن **مودال فاکتور دیجیتال رسمی** قابل چاپ (مطابق با تصمیم تاییدشده کاربر و بند ۱-۲-۳ سند `build.txt`).
3. **مرکز اعلانات داشبورد کاربر (`/dashboard/notifications`):**
   - صفحه مستقل جهت مشاهده کلیه اعلانات درون‌برنامه‌ای (هشدار انقضای اشتراک، یادآوری ۱۰٪ حجم باقیمانده، پاسخ تیکت پشتیبانی، پاداش رفرال).
   - امکان علامت‌گذاری دسته‌جمعی به عنوان خوانده‌شده و دکمه حذف تک‌تک اعلانات.
   - اتصال زنگوله هدر (`NotificationDropdown.tsx`) به این اندپوینت‌ها با بج زنده تعداد ناخوانده‌ها.
4. **کاروسل ۵ بازی مشابه در صفحه جزئیات بازی (`/games/[id]`):**
   - استخراج ۵ بازی با بیشترین تعداد لایک که دارای ژانر مشترک با بازی جاری هستند (به جز خود بازی) و نمایش آن‌ها در یک اسلایدر افقی مدرن در انتهای صفحه (مطابق با بند ۱-۱-۴-۴ سند `build.txt`).
5. **مدیریت ژانرهای بازی در پنل ادمین (`/admin/genres`):**
   - ایجاد صفحه اختصاصی در سایدبار پنل ادمین با جدول کامل دسته‌بندی‌ها، امکان افزودن ژانر جدید، ویرایش نام فارسی و انگلیسی، اسلاگ، آیکون و کلید تاگل انتخاب «۸ ژانر برتر کاتالوگ» (مطابق با بند ۱-۳-۳ سند `build.txt`).
6. **پاکسازی کامل ۱۰ موضع دیتای ایستا در فرانت‌اند:**
   - اتصال `DoubleHeroBanners.tsx` به API بنرها.
   - اتصال `admin/banners/page.tsx` به CRUD بنرها.
   - اتصال `admin/referrals/page.tsx` به لیست واقعی شبکه رفرال و قابلیت تاگل هاید.
   - اتصال `TierCard.tsx` به لیست ۵ بازی داینامیک پلن رایگان.
   - اتصال `dashboard/downloads/page.tsx` به اندپوینت تاریخچه دانلودهای کاربر.
   - اتصال `TutorialBlogsSection.tsx` به مقالات آموزشی دیتابیس.
   - اتصال ویش‌لیست صفحه اصلی به API ویش‌لیست کاربر.
   - تکمیل فلو دوسطحی کد ملی، شماره موبایل و تایید OTP در `SettlementAccountsModal.tsx`.
   - تنظیم آدرس DNS هدر به آی‌پی سرور کنسول (`165.227.83.145`).

---

## ۲. مشخصات معماری بک‌اند (Backend Architecture & Specifications)

### ۲.۱. ماژول تیکت‌های پشتیبانی (`app/modules/tickets/`)
#### مدل‌های دیتابیس (SQLAlchemy):
```python
# backend/app/modules/tickets/models.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.core.database import Base

class Ticket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    user_name = Column(String(128), nullable=False)
    user_phone = Column(String(32), nullable=True)
    subject = Column(String(255), nullable=False)
    department = Column(String(64), nullable=False, default="technical") # technical, financial, downloads, general
    priority = Column(String(32), nullable=False, default="normal")     # normal, urgent
    status = Column(String(32), nullable=False, default="open")         # open, answered, user_reply, closed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class TicketMessage(Base):
    __tablename__ = "support_ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, nullable=False, index=True)
    sender_type = Column(String(16), nullable=False) # 'user' | 'admin'
    sender_id = Column(Integer, nullable=False)
    sender_name = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
```

#### اندپوینت‌های تیکت کلاینت:
- `GET /api/tickets/me`: دریافت لیست تیکت‌های کاربر جاری با امکان فیلتر بر اساس `status` و `department`.
- `POST /api/tickets/me`: ایجاد تیکت جدید با ورودی‌های `subject`, `department`, `priority`, `message`.
- `GET /api/tickets/me/{id}`: دریافت تاریخچه کامل گفتگو و لیست پیام‌های تیکت.
- `POST /api/tickets/me/{id}/reply`: ارسال پیام جدید کاربر (تغییر وضعیت به `user_reply`).
- `PATCH /api/tickets/me/{id}/close`: بستن تیکت توسط کاربر.

#### اندپوینت‌های تیکت ادمین:
- `GET /api/admin/tickets`: دریافت لیست کل تیکت‌های پلتفرم با جستجوی کاربر، موضوع و فیلتر وضعیت.
- `GET /api/admin/tickets/{id}`: مشاهده جزئیات تیکت و پیام‌ها.
- `POST /api/admin/tickets/{id}/reply`: ارسال پاسخ ادمین (تغییر وضعیت خودکار به `answered` و درج نوتیفیکیشن برای کاربر).
- `PATCH /api/admin/tickets/{id}/status`: تغییر دستی وضعیت به `closed` یا `open`.

---

### ۲.۲. ماژول اعلانات کاربر (`app/modules/users/router.py`)
- `GET /api/users/me/notifications`: لیست اعلانات کاربر از جدول `user_notifications` همراه با فیلد `unread_count`.
- `PATCH /api/users/me/notifications/{id}/read`: علامت‌گذاری یک اعلان به عنوان خوانده شده (`is_read = True`).
- `POST /api/users/me/notifications/read-all`: علامت‌گذاری تمامی اعلانات کاربر به عنوان خوانده شده.
- `DELETE /api/users/me/notifications/{id}`: حذف یک اعلان از لیست کاربر.

---

### ۲.۳. ماژول سوابق پرداخت‌ها و فاکتورها (`app/modules/users/router.py`)
- `GET /api/users/me/payments`: استعلام کلیه تراکنش‌های کاربر از جدول `order_payments` شامل:
  - `id`, `order_id`, `provider` (zarinpal, nowpayments), `currency` (IRT, USDT), `amount`, `status`, `authority`, `payment_id`, `created_at`.
  - اطلاعات پلن اشتراک مرتبط استخراج شده از جدول `orders`.

---

### ۲.۴. ارتقای متد بازی‌های رایگان (`app/modules/subscriptions/router.py`)
- ویرایش متد `get_free_tier_games` جهت بازگرداندن آبجکت‌های کامل خلاصه بازی‌ها به جای آرایه شناسه‌ها:
```json
[
  {
    "id": 10,
    "title_fa": "جی‌تی‌ای وی",
    "title_en": "Grand Theft Auto V",
    "slug": "grand-theft-auto-v",
    "cover_image_url": "/uploads/games/gta5.jpg",
    "release_year": 2013,
    "platforms": ["PS4", "PS5"]
  }
]
```

---

### ۲.۵. اندپوینت ۵ بازی مشابه (`app/modules/games/router.py`)
- `GET /api/games/{id}/similar`:
  - شناسایی ژانرهای بازی با شناسه `{id}`.
  - کوئری روی جدول `games` برای بازی‌هایی که حداقل یک ژانر مشترک دارند و `id != {id}`.
  - مرتب‌سازی بر اساس `likes_count DESC` با محدودیت ۵ عدد (`LIMIT 5`).

---

### ۲.۶. اندپوینت‌های مانیتورینگ رفرال ادمین (`app/modules/admin/router.py`)
- `GET /api/admin/referrals`:
  - استخراج لیست کاربران با شبکه فعال (تعداد زیرمجموعه‌ها، موجودی ولت، مجموع پورسانت دریافتی، مجموع مبالغ برداشت‌شده و وضعیت `is_referral_hidden`).
  - اطلاعات صندوق پلتفرم (`ReferralTreasuryPool`) شامل موجودی فعلی و لاگ‌های واریزی.

---

### ۲.۷. ماژول مدیریت ژانرها و دسته‌بندی‌ها (`app/modules/games/router.py`)
- مدل `Genre` با فیلدهای `id`, `name_fa`, `name_en`, `slug`, `icon_name`, `display_order`, `is_top8`, `is_active`.
- روت عمومی: `GET /api/genres` (مرتب‌شده بر اساس `display_order`).
- روت‌های ادمین:
  - `POST /api/admin/genres`: افزودن ژانر جدید.
  - `PUT /api/admin/genres/{id}`: ویرایش اطلاعات، آیکون و علامت‌گذاری ۸ ژانر برتر.
  - `DELETE /api/admin/genres/{id}`: حذف ژانر.

---

## ۳. مشخصات رابط کاربری و فرانت‌اند (Frontend Architecture & Specifications)

### ۳.۱. ماژول‌های جدید داشبورد کاربری
1. **صفحه تیکت‌های پشتیبانی (`frontend/src/app/(dashboard)/dashboard/tickets/page.tsx`):**
   - کارت‌های آماری: «کل تیکت‌ها»، «در انتظار پاسخ»، «پاسخ داده شده».
   - فیلتر دپارتمان و وضعیت.
   - دکمه «ثبت تیکت جدید» همراه با کامپوننت `NewTicketModal.tsx`.
   - جدول تیکت‌ها با شماره پیگیری، عنوان، دپارتمان، تاریخ و وضعیت رنگی.
   - کامپوننت `TicketConversationModal.tsx`: باز شدن مودال تاریخچه چت با حباب‌های رنگی مجزا برای کاربر و ادمین، فرم ارسال پیام جدید و دکمه بستن تیکت.
2. **صفحه سوابق پرداخت‌ها و فاکتورها (`frontend/src/app/(dashboard)/dashboard/payments/page.tsx`):**
   - جدول کامل پرداخت‌های ریالی و ارزی با مبلغ، تاریخ شمسی، درگاه، کد پیگیری و بج وضعیت موفق/ناموفق.
   - کامپوننت `InvoiceModal.tsx`: فاکتور دیجیتال رسمی با نام خریدار، شناسه پرداخت، ریز ارقام و قابلیت چاپ.
3. **مرکز اعلانات داشبورد (`frontend/src/app/(dashboard)/dashboard/notifications/page.tsx`):**
   - تب‌بندی «همه»، «ناخوانده»، «سیستمی»، «مالی».
   - دکمه «علامت‌گذاری همه به عنوان خوانده شده» و دکمه حذف اختصاصی برای هر اعلان.
   - مودال مشاهده متن کامل اعلان.
4. **به‌روزرسانی سایدبار داشبورد (`frontend/src/app/(dashboard)/layout.tsx`):**
   - افزودن آیتم‌های «تیکت‌های پشتیبانی» (`/dashboard/tickets`) و «سوابق پرداخت‌ها» (`/dashboard/payments`) به منوی کناری.

---

### ۳.۲. ماژول‌های جدید پنل ادمین
1. **داینامیک‌سازی تیکت‌های ادمین (`frontend/src/app/(admin)/admin/tickets/page.tsx`):**
   - حذف کامل `mockTickets`.
   - اتصال به روت‌های `GET /api/admin/tickets` و `POST /api/admin/tickets/{id}/reply`.
   - مشاهده تاریخچه، ارسال پاسخ رسمی و تغییر وضعیت تیکت به صورت زنده.
2. **صفحه مدیریت ژانرها (`frontend/src/app/(admin)/admin/genres/page.tsx`):**
   - جدول مدیریت ژانرها با نام فارسی، انگلیسی، اسلاگ، آیکون و تاگل «۸ ژانر برتر کاتالوگ».
   - مودال افزودن و ویرایش ژانر.
   - افزودن لینک «مدیریت ژانرها» به سایدبار ادمین (`frontend/src/app/(admin)/layout.tsx`).

---

### ۳.۳. کامپوننت ۵ بازی مشابه (`SimilarGamesCarousel.tsx`)
- تعبیه شده در انتهای صفحه جزئیات بازی (`frontend/src/app/games/[id]/page.tsx`).
- واکشی ۵ بازی پرلایک دارای ژانر یکسان از اندپوینت `/api/games/{id}/similar`.
- نمایش در یک کاروسل افقی شکیل با ترنزیشن‌های نرم و کارت‌های نئونی سایبری.

---

### ۳.۴. رفع نواقص و اتصال ۱۰ نقطه دیتای ایستا
1. **`DoubleHeroBanners.tsx`:** واکشی بنرهای موقعیت ۱ و ۲ از `GET /api/home/banners`.
2. **`admin/banners/page.tsx`:** حذف `INITIAL_SLIDES` و اتصال کامل به روت‌های CRUD بنرها.
3. **`admin/referrals/page.tsx`:** حذف `SAMPLE_USERS` و اتصال به `GET /api/admin/referrals` و متد تاگل هاید.
4. **`TierCard.tsx`:** حذف `FREE_GAMES` و واکشی زنده بازی‌های مجاز از `GET /api/subscriptions/free-tier-games`.
5. **`dashboard/downloads/page.tsx`:** حذف `SAMPLE_HISTORY` و اتصال به `GET /api/users/me/downloads`.
6. **`NotificationDropdown.tsx`:** حذف `SAMPLE_NOTIFICATIONS` و واکشی اعلان‌های زنده با بج متحرک.
7. **`TutorialBlogsSection.tsx`:** حذف `TOP_TUTORIALS` و واکشی ۵ مقاله آموزشی از دیتابیس.
8. **`app/page.tsx`:** واکشی ویش‌لیست واقعی کاربر لاگین شده از `/api/games/wishlist`.
9. **`SettlementAccountsModal.tsx`:** افزودن اینپوت‌های کد ملی، شماره موبایل و فلو دوسطحی پیامک OTP تستی.
10. **`Header.tsx`:** تصحیح آدرس DNS هدر به `165.227.83.145`.

---

## ۴. استانداردهای آزمون و تایید کیفیت (Validation & QA)

1. **تست‌های واحد بک‌اند (Pytest):**
   - تست کامل چرخه تیکت (ایجاد، دریافت، پاسخ کاربر، پاسخ ادمین، بستن).
   - تست روت‌های خوانده‌شدن و شمارش اعلانات.
   - تست استعلام سوابق پرداخت‌ها.
   - تست روت ۵ بازی مشابه.
   - اجرای `pytest` با نرخ قبولی ۱۰۰٪.
2. **اعتبارسنجی فرانت‌اند (TypeScript & Next.js):**
   - اجرای `npx tsc --noEmit` با خروجی ۰ ارور.
   - تست بارگذاری در مرورگر بدون هیچ‌گونه خطای کنسول یا ۴۰۴.
3. **تست جامع عدم وجود دیتای ایستا (Zero Mock Search):**
   - جستجوی متنی عبارات `mock`, `SAMPLE_`, `INITIAL_` در کامپوننت‌های فرانت‌اند برای اطمینان از پاکسازی قطعی.

</div>
