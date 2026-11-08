<div dir="rtl" lang="fa">

# ⚖️ داوری و ممیزی فنی گام بیست و چهارم: ریشه‌یابی و رفع خطاهای ۵۰۰ پنل‌های ادمین و اصلاح اعتبارسنجی تیکت‌ها (24-admin-500-errors-and-ticket-validation-fixes)

> **عنوان گزارش:** ارزیابی تطبیقی و ممیزی کدهای پیاده‌سازی‌شده با نیازمندی‌ها، دستورالعمل‌ها و تسک‌های گام ۲۴  
> **محل قرارگیری سند:** `backend/agent/24-admin-500-errors-and-ticket-validation-fixes/judge.md`  
> **تاریخ داوری:** نوامبر ۲۰۲۶  
> **رأی نهایی داوری:** 🟢 **قبولی بسیار خوب با رفع یک عدم تطابق در روت وضعیت کاربر (Pass - 92/100)**

---

## ۱. خلاصه اجرایی و ارزیابی کیفیت پیاده‌سازی (Executive Summary)

گام بیست و چهارم بر اساس سند خطایابی رسمی `500errors.md` و با تمرکز بر ریشه‌یابی و رفع جامع خطاهای بحرانی پنل‌های ادمین دپارتمانی (محتوا، مالی، پشتیبانی) و رفع خطای اعتبارسنجی ۴۲۲ در ایجاد تیکت‌های پشتیبانی کاربران طراحی و اجرا گردید.

### نکات مثبت و نقاط قوت پیاده‌سازی:
1. **رفع ریشه‌ای خطاهای زمان اجرا در پنل محتوا (`content_router.py`):**  
   جایگزینی متدهای ناموجود با سرویس استاندارد `GamesService.list_all_genres` و افزودن کامل اندپوینت‌های `PUT` و `DELETE` برای ژانرها و اتصال کامل به `HomeBannerService` جهت مدیریت بنرها.
2. **اصلاح ایمپورت اشتباه مدل در پنل مالی (`finance_router.py`):**  
   اصلاح ایمپورت `OrderPayment` از ماژول `subscriptions.models` (به جای `wallet.models`) و اتصال صحیح متدهای کدهای تخفیف (`list_discount_codes` و `create_discount_code`).
3. **پشتیبانی دوگانه از پارامترهای Pagination:**  
   در هر دو روتر مالی و پشتیبانی، دریافت پارامتر `limit` فرانت‌اند در کنار `page_size` پیاده‌سازی شد (`effective_limit = limit or page_size or 20`).
4. **رفع عدم تطابق آرگومان‌ها در پنل پشتیبانی (`support_router.py`):**  
   اصلاح امضای متد `AdminService.list_users`، تزریق دپندنسی ردیس به `adjust_user_quota`، و پیاده‌سازی متد `update_user_status`.
5. **رفع خطای ۴۲۲ اولویت تیکت‌ها:**  
   گسترش رجکس اعتبارسنجی `TicketCreate` به `^(normal|urgent|low|medium|high)$` که خطای ارسال مقادیر فرانت‌اند `NewTicketModal.tsx` را به صفر رساند.
6. **پوشش تست کامل:**  
   نگارش فایل تست جامع `backend/tests/test_step24_admin_500_fixes.py` و پاس شدن تمام آزمون‌های آن.

---

## ۲. جدول ماتریس ارزیابی تطبیقی وظایف (Tasks vs Reality)

| ردیف | وظیفه در `tasks.md` | وضعیت در کد واقعی | کیفیت | محل بررسی در کدبیس | توضیحات داوری |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **۱** | رفع خطای ۴۲۲ ایجاد تیکت پشتیبانی | ✅ انجام شد | عالی | `tickets/schemas.py:10` | رجکس به `^(normal\|urgent\|low\|medium\|high)$` تغییر یافت. |
| **۲** | رفع خطای ۵۰۰ ژانرها در ادمین محتوا | ✅ انجام شد | عالی | `admin/routers/content_router.py:424-490` | اتصال به `GamesService.list_all_genres` و متدهای ادمین ژانر. |
| **۳** | رفع خطای ۵۰۰ بنرها در ادمین محتوا | ✅ انجام شد | عالی | `admin/routers/content_router.py:575-626` | اتصال به `HomeBannerService.admin_list_banners`. |
| **۴** | اصلاح ایمپورت `OrderPayment` در مالی | ✅ انجام شد | عالی | `admin/routers/finance_router.py:323` | ایمپورت از `app.modules.subscriptions.models`. |
| **۵** | رفع خطای ۵۰۰ کدهای تخفیف در مالی | ✅ انجام شد | عالی | `admin/routers/finance_router.py:355-410` | فراخوانی اسامی صحیح `list_discount_codes` و CRUD تخفیف. |
| **۶** | پشتیبانی از پارامتر `limit` فرانت‌اند | ✅ انجام شد | عالی | `finance_router.py:318` & `support_router.py:405` | محاسبه خودکار `effective_limit = limit or page_size or 20`. |
| **۷** | اصلاح امضا و آرگومان‌های `list_users` | ✅ انجام شد | عالی | `admin/services.py:22-45` | تطابق کامل با پارامترهای کنترلر و فیلترهای جستجو. |
| **۸** | تزریق ردیس به تنظیم سهمیه و متد `PUT` | ✅ انجام شد | عالی | `support_router.py:422-435` | هماهنگی با کلیدهای کش ردیس و پشتیبانی از دو متد `POST/PUT`. |
| **۹** | پیاده‌سازی متد `update_user_status` | ✅ انجام شد | عالی | `admin/services.py:898-906` | امکان فعال/مسدودسازی کاربر در دیتابیس. |
| **۱۰** | هماهنگی روت وضعیت کاربر با جدول اصلی کاربران | ⚠️ کاستی | متوسط | `support_router.py:456` vs `admin/users/page.tsx:187` | روت در `admin-support` با متد PUT است اما جدول اصلی به `/admin/users/...` با PATCH می‌فرستد! |

---

## ۳. کاستی‌ها، ایرادات و خطاهای کشف‌شده (Defects & Issues)

### ایراد اول (عدم انطباق روت و متد HTTP در مدیریت کاربران): خطای تغییر وضعیت کاربر در جدول اصلی ادمین
* **محل خطا:** مقایسه کنترلر `backend/app/modules/admin/routers/support_router.py:456` با صفحه فرانت‌اند `frontend/src/app/(admin)/admin/users/page.tsx:187`:
  - در بک‌اند (روتر پشتیبانی):
    ```python
    @router.put("/users/{user_id}/status") # تحت پیشوند /api/admin-support
    async def set_user_status(...):
    ```
  - در فرانت‌اند (جدول اصلی ادمین کاربران):
    ```typescript
    await apiRequest(`/admin/users/${u.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    ```
* **ریشه‌یابی خطا:** در فرانت‌اند دو صفحه برای کاربران وجود دارد: یکی در دپارتمان پشتیبانی (`/admin/support/users`) و دیگری در ریشه ادمین (`/admin/users`). صفحه ریشه درخواست خود را با متد `PATCH` به پیشوند `/admin/users/${u.id}/status` می‌فرستد. در حالی که بک‌اند این متد را فقط تحت پیشوند `/api/admin-support` و صرفاً با متد `PUT` پذیرش می‌کند. این امر موجب پرتاب خطای `404 Not Found` یا `405 Method Not Allowed` در جدول اصلی کاربران پنل ادمین می‌شود.
* **راه حل:**
در بک‌اند روتر عمومی ادمین یا روتر پشتیبانی، متد `PATCH` و روت عمومی را نیز به عنوان آلیاس پوشش دهید:
```python
@router.put("/users/{user_id}/status")
@router.patch("/users/{user_id}/status")
async def set_user_status(user_id: int, payload: AdminUserStatusUpdate, ...):
    ...
```
و در فایل روت‌های اصلی، مسیر `/api/admin/users/{user_id}/status` به این کنترلر مپ گردد.

---

### ایراد دوم (یکپارچگی انوم‌های دیتابیس): عدم نرمال‌سازی اولویت تیکت‌ها در لایه مدل
* **محل خطا:** `backend/app/modules/tickets/schemas.py:10`
* **ریشه‌یابی خطا:** پترن اعتبارسنجی به `^(normal|urgent|low|medium|high)$` گسترش یافت که خطای ۴۲۲ را برطرف کرد، اما در هسته بیزنس، مقادیر `low` و `medium` باید با منطق اولویت‌بندی اعلان‌ها و رنگ‌بندی‌های پیشین دیتابیس همگام باشند. توصیه می‌شود در صورت لزوم، در متد `TicketService.create_ticket` تبدیل استاندارد یا مپینگ معادل در نظر گرفته شود.

---

## ۴. جمع‌بندی رأی داوری گام ۲۴

گام بیست و چهارم یکی از دقیق‌ترین، کاربردی‌ترین و مؤثرترین گام‌های اخیر پروژه بوده و تمام ۷ خطای بحرانی ۵۰۰ و ۴۲۲ گزارش‌شده در سند `500errors.md` را با موفقیت و بر اساس ریشه‌یابی علمی حل کرده است. تنها مورد تکمیلی، افزودن متد `PATCH` و مپینگ روت وضعیت کاربر برای جدول ادمین کل است.

</div>
