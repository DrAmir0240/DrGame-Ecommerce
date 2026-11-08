<div dir="rtl" lang="fa">

# ⚖️ داوری و ممیزی فنی گام بیست و پنجم: تفکیک هوشمند نسخه داخلی و بین‌المللی، بومی‌سازی داینامیک و سخت‌سازی همگام‌سازی کاتالوگ (25-internationalization-dual-mode-and-catalog-sync-hardening)

> **عنوان گزارش:** ارزیابی تطبیقی و ممیزی کدهای پیاده‌سازی‌شده با نیازمندی‌ها، دستورالعمل‌ها و تسک‌های گام ۲۵  
> **محل قرارگیری سند:** `backend/agent/25-internationalization-dual-mode-and-catalog-sync-hardening/judge.md`  
> **تاریخ داوری:** نوامبر ۲۰۲۶  
> **رأی نهایی داوری:** 🔴 **رد به دلیل شکست کامل بیلد فرانت‌اند و عدم به‌روزرسانی چک‌لیست (Fail / Action Required - 68/100)**

---

## ۱. خلاصه اجرایی و ارزیابی کیفیت پیاده‌سازی (Executive Summary)

گام بیست و پنجم یکی از وسیع‌ترین و استراتژیک‌ترین گام‌های توسعه پلتفرم دکترگیم است که با هدف تفکیک کامل ساختار سامانه به دو مد کاری **داخلی (Domestic)** و **بین‌المللی (International)**، استقرار مکانیزم تشخیص موقعیت مکانی (GeoIP)، یکپارچه‌سازی و ترجمه واقعی کاتالوگ‌های متنی ۱۵ زبان، دور زدن مسدودی گوگل با تانل پراکسی، حذف تزریق خودکار دیتای پیش‌فرض در استارتاپ داکر، و ارتقای اسکریپت جامع سیدر دیتابیس تدوین گردید.

### نکات مثبت و نقاط قوت پیاده‌سازی:
1. **طراحی اندپوینت موقعیت مکانی (`/api/geoip`):**  
   پیاده‌سازی سبک، مپینگ کدهای ISO بیش از ۶۰ کشور به ۱۵ زبان زنده پلتفرم و کش حافظه داخلی (Memory Cache با گنجایش ۱۰ هزار رکورد) که پاسخ‌دهی زیر چند میلی‌ثانیه را تضمین می‌کند.
2. **غیرفعال‌سازی هوشمند مودال زبان در مد داخلی:**  
   در کامپوننت `GeoLanguageModal.tsx` با بررسی `NEXT_PUBLIC_DEPLOYMENT_MODE === 'domestic'`، مودال بلافاصله `return null` می‌دهد و کاربر ایرانی هیچ پاپ‌آپ مزاحمی نمی‌بیند.
3. **تکمیل ترجمه‌های بومی ۱۵ زبان:**  
   فایل‌های ترجمه زبان‌های فرانسوی، ژاپنی، کره‌ای، ترکی، ایتالیایی، پرتغالی و هلندی در پوشه‌های `i18n/messages/` و `i18n/locales/` پیاده‌سازی شدند.
4. **موتور ترجمه سرورساید با تانل پراکسی (`serverTranslation.ts`):**  
   ارسال درخواست‌ها از طریق پروتکل Native HTTP CONNECT Tunnel به کانتینر پراکسی داخلی جهت پیشگیری از خطای ۴۲۹ گوگل.
5. **پاکسازی استارتاپ کانتینرها و حذف Auto-Seedهای پنهان:**  
   فراخوانی‌های خودکار `seed_blog_data` در اخبار و `seed_tiers` در اشتراک‌ها برچیده شدند تا دیتابیس در زمان راه‌اندازی بدون اجازه تغییر نکند.
6. **سیدر دوگانه پلتفرم (`seed_demo_platform_data.py`):**  
   پشتیبانی عالی از فلگ `--mode domestic` و `--mode international` با پروفایل‌های واقعی، حساب‌های تتر/پی‌پال و مبالغ دلاری.

---

## ۲. جدول ماتریس ارزیابی تطبیقی وظایف (Tasks vs Reality)

| ردیف | وظیفه در `tasks.md` | وضعیت در کد واقعی | کیفیت | محل بررسی در کدبیس | توضیحات داوری |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **۱** | ایجاد اندپوینت `/api/geoip` | ✅ انجام شد | عالی | `frontend/src/app/api/geoip/route.ts` | با کش این‌مموری و مپینگ به ۱۵ زبان. |
| **۲** | رفتار بدون مزاحمت در نسخه داخلی | ✅ انجام شد | عالی | `components/layout/GeoLanguageModal.tsx:25` | در نسخه داخلی و صفحات ادمین کاملاً غیرفعال است. |
| **۳** | کاتالوگ‌های اصیل ۱۵ زبان | ✅ انجام شد | عالی | `frontend/src/i18n/messages/...` | ترجمه‌های محلی در تمام فایل‌های JSON اعمال شدند. |
| **۴** | اتصال ترجمه به کانتینر پراکسی | ✅ انجام شد | خوب | `frontend/src/lib/serverTranslation.ts` | با پروتکل CONNECT Tunnel به `proxy:10809`. |
| **۵** | توقف سنتز فارسی در ادمین بین‌الملل | ✅ انجام شد | عالی | `catalog_sync/services.py:354-388` | جوایز و توضیحات انگلیسی ثبت می‌شوند. |
| **۶** | حذف Auto-Seed پنهان از سرویس‌ها | ✅ انجام شد | عالی | `news/services.py` & `subscriptions/services.py` | دیتابیس در استارتاپ دست‌نخورده می‌ماند. |
| **۷** | سیدر جامع با فلگ `--mode` | ✅ انجام شد | عالی | `backend/scripts/seed_demo_platform_data.py` | با ۲۰ پروفایل بین‌المللی و حساب‌های کریپتو. |
| **۸** | **بیلد موفقیت‌آمیز فرانت‌اند (`npm run build`)** | ❌ شکست بحرانی | مسدودکننده | ترمینال فرانت‌اند Next.js | خطای `useContext` در تمام ۶۰ صفحه استاتیک! |
| **۹** | **تکمیل چک‌لیست تسک‌ها (`tasks.md`)** | ❌ رهاشده | ناقص | `agent/25-.../tasks.md` | وضعیت چک‌لیست هنوز `در انتظار شروع` است! |

---

## ۳. کاستی‌ها، ایرادات و خطاهای کشف‌شده (Defects & Issues)

### ایراد اول (بحرانی و مسدودکننده استقرار): شکست کامل بیلد فرانت‌اند (`npm run build`)
* **محل خطا:** `frontend/src/app/layout.tsx` (خطوط ۴۵ تا ۵۰):
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies(); // <--- علت خطای تخریب Prerender
  const isIntl = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'international';
  const defaultLocale: SupportedLocale = isIntl ? 'en' : 'fa';
  const cookieLang = cookieStore.get('drgame_lang')?.value;
```
* **خروجی دستور بیلد در کانتینر فرانت‌اند:**
```
✓ Compiled successfully
Linting and checking validity of types ...
Collecting page data ...
Generating static pages (0/60) ...
TypeError: Cannot read properties of null (reading 'useContext')
    at t.useContext (.../app-page.runtime.prod.js:12:109421)
    at d (.../.next/server/chunks/9644.js:1:22337)
    at p (.../.next/server/chunks/9644.js:1:14304)
Error occurred prerendering page "/admin/content/catalog-sync".
...
> Export encountered errors on following paths: (تمام ۶۰ صفحه استاتیک شکست خوردند!)
```
* **ریشه‌یابی دقیق:**  
  در کامیت `4d619f7`، تابع `cookies()` از ماژول `next/headers` به داخل کامپوننت سروری ریشه (`RootLayout`) اضافه شد تا زبان اولیه در سرور خوانده شود. در معماری Next.js 14 App Router، فراخوانی `cookies()` در روت لایه بالا، کل صفحات را از حالت استاتیک خارج می‌کند. زمانی که فرآیند بیلد می‌خواهد صفحات را پری‌رندر کند، موتور Next.js خطای `DYNAMIC_SERVER_USAGE` برمی‌گرداند؛ سپس لایه داخلی هندل خطای Next.js (`p` در چانک `9644`) سعی می‌کند کامپوننت ارور را رندر کند و در آنجا هوک `usePathname()` را فراخوانی می‌کند. اما چون دیسپچر ری‌اکت در فاز بیلد استاتیک نال است، کل بیلد با خطای `Cannot read properties of null (reading 'useContext')` متوقف شده و خروجی پروداکشن تولید نمی‌شود.
* **راه حل قطعی:**
فراخوانی سرورساید `cookies()` در `RootLayout` را حذف کنید. پلتفرم پیش از این یک اسکریپت اختصاصی و بدون فلش در تگ `<head>` داشته است (خطوط ۶۱ تا ۶۵) که در کلاینت کوکی و لوکال استوریج را قبل از رندر اولیه می‌خواند و مقدار `lang` و `dir` تگ `html` را تنظیم می‌کند:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isIntl = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'international';
  const defaultLocale: SupportedLocale = isIntl ? 'en' : 'fa';

  return (
    <html lang={defaultLocale} dir={isIntl ? 'ltr' : 'rtl'} className="dark" suppressHydrationWarning>
      <head>
        {/* اسکریپت پیشگیری از فلش زبان از قبل موجود است */}
```

---

### ایراد دوم (مستندسازی و ردگیری تسک‌ها): رها شدن چک‌لیست وظایف بدون تیک
* **محل خطا:** `backend/agent/25-internationalization-dual-mode-and-catalog-sync-hardening/tasks.md` (خطوط ۷ تا ۸۸):
```markdown
> **وضعیت کلی:** ⏳ در انتظار شروع پیاده‌سازی (Ready for Implementation)
- [ ] پیاده‌سازی اندپوینت موقعیت‌یابی سبک frontend/src/app/api/geoip/route.ts:
...
```
* **ریشه‌یابی خطا:** با وجود اینکه کدهای گام ۲۵ کامیت و روی مخزن گیت اعمال شده‌اند، فایل `tasks.md` این گام به‌روزرسانی نشده و تمام چک‌باکس‌ها روی `[ ]` (تکمیل‌نشده) و وضعیت گام روی «در انتظار شروع» باقی مانده است. این امر باعث خطای گزارش‌گیری و سردرگمی کارفرما و تیم فنی در ارزیابی پیشرفت کار می‌شود.
* **راه حل:** علامت‌گذاری تمام تسک‌های پیاده‌سازی‌شده به `[x]` و به‌روزرسانی وضعیت به «تکمیل‌شده و در انتظار تست بیلد».

---

### ایراد سوم (پایداری ترجمه): هاردکد بودن پراکسی کانتینر در محیط پروداکشن
* **محل خطا:** `frontend/src/lib/serverTranslation.ts` (خط ۱۵):
```typescript
const rawProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || (process.env.NODE_ENV === 'production' ? 'http://proxy:10809' : '');
```
* **ریشه‌یابی خطا:** در محیط‌هایی که ممکن است کانتینر `proxy` با نام دیگر یا پورت متفاوتی اجرا شود، این پیش‌فرض باعث تلاش برای اتصال ناموفق و ایجاد ۶ ثانیه تاخیر (تایم‌اوت) در ترجمه هر پکیج بازی می‌شود.
* **راه حل:** خواندن آدرس پراکسی منحصراً از متغیر محیطی `HTTP_PROXY` و عدم اعمال پیش‌فرض هاردکد بدون بررسی دسترسی شبکه.

---

## ۴. جمع‌بندی رأی داوری گام ۲۵

گام بیست و پنجم از نظر تنوع و عمق ویژگی‌های بومی‌سازی (GeoIP، تانل پراکسی ترجمه داینامیک، سیدر دو زبانه) دستاوردی بزرگ برای پلتفرم است. اما به دلیل **شکست کامل دستور `npm run build` ناشی از فراخوانی `cookies()` در RootLayout**، پروژه در حال حاضر امکان استقرار و انتشار به عنوان نسخه پروداکشن نهایی را ندارد و به عنوان **نیازمند اقدام فوری (Fail / Action Required)** داوری می‌شود.

</div>
