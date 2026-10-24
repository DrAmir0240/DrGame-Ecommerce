<div dir="rtl" lang="fa">

# سیاهه تسک‌های اجرایی و فازبندی‌شده گام ۰۵ (Step 05 Execution Tasks)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**سند تسک‌ها:** نقشه فازبندی‌شده ۲۳ تسک فنی برای تبدیل ماک‌ها به سامانه عملیاتی  
**مسیر پوشه:** `agent/step-05-full-functional-wiring-and-figr-restoration/`

---

## ۱. جدول ماتریس تسک‌های فازبندی‌شده

| فاز | عنوان فاز | تعداد تسک‌ها | شناسه‌های تسک | خروجی کلیدی |
| :---: | :--- | :---: | :---: | :--- |
| **فاز ۱** | احیای تم فیگر و پاکسازی نارنجی | ۳ تسک | `TSK-05-01` تا `TSK-05-03` | حذف کامل `--accent-orange` و بازگشت بنفش کیهانی فیگر |
| **فاز ۲** | توسعه ماژول‌ها و روترهای بک‌اند | ۴ تسک | `TSK-05-04` تا `TSK-05-07` | روترهای `games`, `orders`, `settings` در FastAPI |
| **فاز ۳** | فیلترهای زنده شاپ و موتور دانلود | ۴ تسک | `TSK-05-08` تا `TSK-05-11` | فیلتر آنی کاتالوگ و دانلود با کنترل و کسر سهمیه |
| **فاز ۴** | تسویه‌حساب و ثبت سفارش دیتابیسی | ۳ تسک | `TSK-05-12` تا `TSK-05-14` | کوپن تخفیف دیتابیسی، ثبت سفارش و شارژ سهمیه |
| **فاز ۵** | سینک زنده تنظیمات DNS و بنر ۲ | ۳ تسک | `TSK-05-15` تا `TSK-05-17` | ذخیره تنظیمات از ادمین و اعمال آنی در هدر و خانه |
| **فاز ۶** | پایداری پنل کاربری، آواتار و شبا | ۳ تسک | `TSK-05-18` تا `TSK-05-20` | ذخیره دائمی مشخصات، آواتار و درخواست تسویه |
| **فاز ۷** | بیلد نهایی و اعتبارسنجی یکپارچه | ۳ تسک | `TSK-05-21` تا `TSK-05-23` | قبولی بیلد پروداکشن و تست‌های اند-تو-اند |

---

## ۲. جزئیات تفصیلی تسک‌های اجرایی

### فاز ۱: احیای تم فیگر و پاکسازی نارنجی
- **`TSK-05-01`:** پاکسازی متغیرهای نارنجی و بازگرداندن مقادیر رسمی فیگر (`--color-accent: #7c3aed`, `--color-pink: #ec4899`, `--color-bg: #070709`) در [globals.css](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/globals.css).
  - *معیار قبولی:* عدم وجود هرگونه ارجاع به `#ff5722` در فایل استایل پایه.
- **`TSK-05-02`:** به‌روزرسانی رنگ‌های تم نئونی و بنفش در [tailwind.config.ts](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/tailwind.config.ts).
- **`TSK-05-03`:** جایگزینی کلاس‌های نارنجی در کامپوننت‌های فرانت‌اند با کلاس‌های بنفش کیهانی فیگر (دکمه‌های هدر، کارت‌های بازی، شاپ و پنل).

### فاز ۲: توسعه ماژول‌ها و روترهای بک‌اند
- **`TSK-05-04`:** پیاده‌سازی ماژول بازی‌ها (`app.modules.games`) شامل مدل‌های `Game` و `GameFile`، مایگریشن جداول و سرویس‌های واکشی و فیلترینگ.
- **`TSK-05-05`:** پیاده‌سازی ماژول سفارشات (`app.modules.orders`) شامل مدل‌های `Order` و `DiscountCode` و سرویس اعتبارسنجی کوپن.
- **`TSK-05-06`:** پیاده‌سازی ماژول تنظیمات سایت (`app.modules.settings`) شامل مدل `SiteSetting`، کَش ردیس و متدهای خواندن/نوشتن.
- **`TSK-05-07`:** ثبت روترهای جدید در [backend/app/main.py](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/backend/app/main.py) و ایجاد کلاینت یکپارچه [frontend/src/lib/api.ts](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/lib/api.ts).

### فاز ۳: فیلترهای زنده شاپ و موتور دانلود
- **`TSK-05-08`:** پیاده‌سازی اینترفیس `FilterState` و مخابره رویدادهای فیلتر در [ShopFiltersSidebar.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/ShopFiltersSidebar.tsx).
- **`TSK-05-09`:** سیم‌کشی استیت فیلترها در [shop/page.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/shop/page.tsx) و فراخوانی زنده لیست بازی‌ها از سرور.
- **`TSK-05-10`:** پیاده‌سازی تابع `handleDownloadPart` با کنترل ورود و بررسی سهمیه در [shop/[slug]/page.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/shop/%5Bslug%5D/page.tsx).
- **`TSK-05-11`:** طراحی مودال هشدار کمبود سهمیه و هدایت سریع به صفحه اشتراک‌ها در صورت اتمام ترافیک.

### فاز ۴: تسویه‌حساب و ثبت سفارش دیتابیسی
- **`TSK-05-12`:** اتصال فرم کد تخفیف در [checkout/page.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/checkout/page.tsx) به اندپوینت `/api/v1/orders/validate-coupon`.
- **`TSK-05-13`:** اتصال دکمه پرداخت به اندپوینت `/api/v1/orders/checkout`، ثبت سفارش و دریافت کد رهگیری دیتابیسی.
- **`TSK-05-14`:** شارژ آنی سهمیه در پروفایل کاربر و نمایش فاکتور نهایی موفق با کد رهگیری واقعی.

### فاز ۵: سینک زنده تنظیمات DNS و بنر ۲
- **`TSK-05-15`:** اتصال دکمه ذخیره تنظیمات DNS در [admin/page.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/admin/page.tsx) به اندپوینت `PUT /api/v1/settings/dns`.
- **`TSK-05-16`:** اتصال دکمه ذخیره اسلات بنر ۲ به اندپوینت `PUT /api/v1/settings/banners`.
- **`TSK-05-17`:** واکشی خودکار اطلاعات در [TopBanner.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/TopBanner.tsx) و [HomeBannerSlots.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/HomeBannerSlots.tsx) از اندپوینت عمومی.

### فاز ۶: پایداری پنل کاربری، آواتار و شبا
- **`TSK-05-18`:** اتصال فرم ویرایش مشخصات در [panel/page.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/app/panel/page.tsx) به اندپوینت آپدیت پروفایل.
- **`TSK-05-19`:** ذخیره دائمی آواتار انتخابی کاربر در دیتابیس در [AvatarSelectorModal.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/panel/AvatarSelectorModal.tsx).
- **`TSK-05-20`:** اتصال فرم تسویه شبا در [ReferralTab.tsx](file:///home/tida/Desktop/Projects/DrGame-Eccomerce/frontend/src/components/panel/ReferralTab.tsx) به اندپوینت ثبت تسویه با اعتبارسنجی فرمت شبا.

### فاز ۷: بیلد نهایی و اعتبارسنجی یکپارچه
- **`TSK-05-21`:** اجرای تست بیلد فرانت‌اند با `npm run build` و اطمینان از کامپایل بدون خطای تمامی ۲۴ روت.
- **`TSK-05-22`:** اجرای تست‌های بک‌اند و راستی‌آزمایی تراکنش‌های دیتابیس.
- **`TSK-05-23`:** تایید نهایی سلامت کانتینرهای داکر و بررسی کارکرد در مرورگر.

</div>
