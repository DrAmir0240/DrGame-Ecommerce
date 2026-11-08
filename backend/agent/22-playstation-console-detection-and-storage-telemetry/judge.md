<div dir="rtl" lang="fa">

# ⚖️ داوری و ممیزی فنی گام بیست و دوم: تشخیص هوشمند کنسول‌های پلی‌استیشن و نمایش زنده تله‌متری حافظه (22-playstation-console-detection-and-storage-telemetry)

> **عنوان گزارش:** ارزیابی تطبیقی و ممیزی کدهای پیاده‌سازی‌شده با نیازمندی‌ها، دستورالعمل‌ها و تسک‌های گام ۲۲  
> **محل قرارگیری سند:** `backend/agent/22-playstation-console-detection-and-storage-telemetry/judge.md`  
> **تاریخ داوری:** نوامبر ۲۰۲۶  
> **رأی نهایی داوری:** 🟡 **قبولی مشروط با اصلاحات چرخه حیات تله‌متری (Conditional Pass - 87/100)**

---

## ۱. خلاصه اجرایی و ارزیابی کیفیت پیاده‌سازی (Executive Summary)

گام بیست و دوم با هدف ارتقای هوش محیطی پلتفرم در تعامل با کنسول‌های بازی تعریف شد: تشخیص خودکار مرورگر کنسول‌های PS5 و PS4 بدون اجبار به ورود دستی کد نشست (Zero-Friction Handoff)، پایش بلادرنگ گنجایش هارد دیسک داخلی (`/data`) و هاردهای اکسترنال USB، مقایسه زنده حجم هر بازی با فضای خالی کنسول در کارت‌های بازی، و ارائه گیج تله‌متری در صفحه دانلودها.

### نکات مثبت و نقاط قوت پیاده‌سازی:
1. **تشخیص چندوجهی و خلاقانه محیط کنسول (`detectConsoleEnvironment`):**  
   تشخیص کنسول نه تنها از طریق رشته `navigator.userAgent` (الگوهای `PlayStation 5`, `PS5`, `PlayStation 4` و نسخه فریمور) و سشن‌استوریج صورت می‌گیرد، بلکه با بهره‌گیری از **Web Gamepad API**، در صورت اتصال مستقیم دسته‌های بازی DualSense یا DualShock به مرورگر، کنسول را به درستی تشخیص می‌دهد.
2. **استور متمرکز Zustand برای حافظه کنسول (`useConsoleStorageStore.ts`):**  
   مدیریت متمرکز وضعیت سخت‌افزار، فضای آزاد به گیگابایت، درصد اشغال، وضعیت آنلاین بودن (Stale) و لیست دیسک‌های متصل با قابلیت دی‌بانس هوشمند ۶ ثانیه‌ای.
3. **نمایش هوشمند گنجایش در کارت‌های بازی (`GameCard.tsx`):**  
   در کنار برچسب بنفش حجم بازی، در صورت اتصال کنسول، وضعیت حافظه به شکل زنده اعتبارسنجی می‌شود: در صورت کفایت فضا، برچسب سبز `✔ مناسب هارد` و در صورت کمبود فضا، نشانگر نئونی چشمک‌زن `⚠ کمبود فضا` درج شده است.
4. **بنر تله‌متری در بالای کاتالوگ (`/games`):**  
   نمایش نام دستگاه، ولوم `/data`، نشانگر اتصال زنده با انیمیشن پالس، و نوار باریک درصد اشغال SSD.
5. **ویجت اختصاصی در تاریخچه دانلودها (`ConsoleStorageWidget.tsx`):**  
   کاربر در صفحه دانلودها وضعیت فیزیکی هارد دیسک‌های خود را در کنار سهمیه اشتراک به صورت شفاف مشاهده می‌کند.

---

## ۲. جدول ماتریس ارزیابی تطبیقی وظایف (Tasks vs Reality)

| ردیف | وظیفه در `tasks.md` | وضعیت در کد واقعی | کیفیت | محل بررسی در کدبیس | توضیحات داوری |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **۱** | تحلیل `navigator.userAgent` برای PS5 و PS4 | ✅ انجام شد | عالی | `frontend/src/stores/useConsoleStorageStore.ts:48-63` | الگوهای رجکس PS5، PS4 و نسخه فریمور استخراج می‌شوند. |
| **۲** | پشتیبانی از Web Gamepad API برای دسته‌ها | ✅ انجام شد | فوق‌العاده | `frontend/src/stores/useConsoleStorageStore.ts:64-78` | اتصال DualSense و DualShock شناسایی می‌شود. |
| **۳** | برچسب کفایت/کمبود فضا در کارت بازی‌ها | ✅ انجام شد | عالی | `frontend/src/components/games/GameCard.tsx:78-96` | مقایسه لحظه‌ای `download_size_gb` با `freeStorageGb`. |
| **۴** | بنر تله‌متری بالای کاتالوگ بازی‌ها | ✅ انجام شد | عالی | `frontend/src/app/(store)/games/page.tsx:226-250` | نمایش نام کنسول و نوار درصد پر بودن حافظه. |
| **۵** | ویجت حافظه کنسول در صفحه تاریخچه دانلودها | ✅ انجام شد | عالی | `frontend/src/components/console/ConsoleStorageWidget.tsx` | نمایش ظرفیت، فضای خالی و وضعیت پیلود Download32. |
| **۶** | اندپوینت بک‌اند `/api/account/storage` | ✅ انجام شد | خوب | `backend/app/modules/dpop/router.py:322-337` | با پشتیبانی از کلاینت بدون لاگین (اختیاری بودن کاربر). |
| **۷** | چرخه حیات تایمر و توقف در تب‌های پس‌زمینه | ❌ انجام نشد | کاستی | `frontend/src/components/console/ConsoleStorageWidget.tsx:73` | تایمر ۱۰ ثانیه‌ای در تب‌های غیرفعال متوقف نمی‌شود (نقض بند ۴ الزامات). |
| **۸** | استعلام دوره‌ای در صفحه کاتالوگ بازی‌ها | ❌ انجام نشد | کاستی | `frontend/src/app/(store)/games/page.tsx:65-67` | تابع `fetchStorage()` فقط یک‌بار هنگام لود صفحه فراخوانی می‌شود! |
| **۹** | رفتار فال‌بک کنسول در صورت نبود هنداوف | ⚠️ کاستی | متوسط | `GameCard.tsx` & `games/page.tsx` | بدون اتصال هنداوف، کل ویجت‌ها پنهان می‌شوند و پیامی برای اتصال نمایش داده نمی‌شود. |

---

## ۳. کاستی‌ها، ایرادات و خطاهای کشف‌شده (Defects & Issues)

### ایراد اول (مدیریت چرخه حیات و ترافیک شبکه): عدم توقف تایمر در زمان خروج از فوکوس تب
* **محل خطا:** `frontend/src/components/console/ConsoleStorageWidget.tsx` (خطوط ۷۰ تا ۷۵):
```typescript
useEffect(() => {
  fetchStorage();
  // Poll every 10 seconds according to PS5 Download32 specification
  const timer = setInterval(() => fetchStorage(false), 10000);
  return () => clearInterval(timer);
}, [handoffSecret]);
```
* **ریشه‌یابی خطا:** بند ۴ از الزامات تخطی‌ناپذیر معماری (Mandate 4) صریحاً مقرر کرده است:
  > «هنگام خروج از صفحه یا فوکوس نبودن تب، تایمر پاکسازی شود تا بار اضافی به سرور تحمیل نگردد.»
  در کد فعلی، ایونت لیسنر `visibilitychange` یا بررسی `document.hidden` پیاده‌سازی نشده است؛ در نتیجه اگر کاربر تب را در پس‌زمینه رها کند یا به تب دیگری برود، هر ۱۰ ثانیه یک درخواست بیهوده `POST /api/account/storage` به سرور شلیک می‌شود.
* **راه حل:**
کنترل فعال بودن تب با رویداد `visibilitychange`:
```typescript
useEffect(() => {
  let timer: NodeJS.Timeout | null = null;

  const startPolling = () => {
    if (!timer && !document.hidden) {
      fetchStorage(false);
      timer = setInterval(() => {
        if (!document.hidden) fetchStorage(false);
      }, 10000);
    }
  };

  const stopPolling = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const handleVisibility = () => {
    if (document.hidden) stopPolling();
    else startPolling();
  };

  startPolling();
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    stopPolling();
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}, [handoffSecret]);
```

---

### ایراد دوم (ناپایداری استعلام در کاتالوگ): فقدان استعلام دوره‌ای در صفحه `/games`
* **محل خطا:** `frontend/src/app/(store)/games/page.tsx` (خطوط ۶۵ تا ۶۷):
```typescript
useEffect(() => {
  fetchStorage();
}, []);
```
* **ریشه‌یابی خطا:** در صفحه کاتالوگ بازی‌ها که کاربر ساعت‌ها به کاوش بازی‌ها می‌پردازد، `fetchStorage()` صرفاً **یک‌بار** در لحظه مانت شدن صفحه اجرا می‌شود. اگر در این حین دانلودی در کنسول آغاز یا تمام شود، فضای آزاد هارد تغییر می‌کند اما صفحه بازی‌ها هرگز متوجه نشده و برچسب‌های `GameCard` و بنر بالایی مقادیر کهنه و اشتباه را نمایش می‌دهند.
* **راه حل:** افزودن تایمر ۱۰ ثانیه‌ای مشابه ویجت یا استفاده از لیسنر متمرکز در استور Zustand به طوری که تمام صفحات به شکل همگام استعلام را دریافت کنند.

---

### ایراد سوم (تجربه کاربری نامطلوب در کنسول بدون Handoff): پنهان شدن کامل رابط در صورت عدم ثبت دستگاه
* **محل خطا:** `GameCard.tsx:78` و `games/page.tsx:226`:
```typescript
{isConsole && freeStorageGb !== null && (...)}
```
* **ریشه‌یابی خطا:** اگر کاربری مستقیماً با مرورگر PS5 وارد سایت شود، سیستم از روی User-Agent تشخیص می‌دهد که دستگاه کنسول است (`isConsole === true`). اما چون کاربر هنوز با اپلیکیشن Download32 کد هنداوف خود را وارد نکرده، اندپوینت `/api/account/storage` آرایه خالی `devices: []` برمی‌گرداند و `freeStorageGb` برابر با `null` می‌ماند. در نتیجه، هم بنر کاتالوگ و هم برچسب‌های کارت بازی‌ها کلاً غیب می‌شوند! کاربر هیچ بازخوردی نمی‌گیرد که آیا سایت دستگاه او را شناخته است یا خیر.
* **راه حل:**
در صورت `isConsole === true` و `freeStorageGb === null`، بنر بالای کاتالوگ به صورت یک دعوت‌نامه تعاملی رندر شود:
```tsx
{isConsole && freeStorageGb === null && (
  <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs text-purple-300">
    <span>🎮 کنسول پلی‌استیشن شناسایی شد — جهت فعال‌سازی تله‌متری زنده هارد، اپلیکیشن Download32 را متصل فرمایید.</span>
    <button onClick={openHandoffModal} className="px-3 py-1 rounded-lg bg-purple-500 text-white font-bold">اتصال هارد</button>
  </div>
)}
```

---

## ۴. جمع‌بندی رأی داوری گام ۲۲

نوآوری‌های اعمال‌شده در گام ۲۲ (به ویژه ترکیب User-Agent با Gamepad API) بسیار برجسته و خلاقانه است. پیاده‌سازی کارت‌های بازی با سنجش حجم، تعامل بسیار حرفه‌ای و استاندارد با کاربر کنسولی ایجاد کرده است. با اصلاح سیاست Polling در زمان عدم فوکوس تب و افزودن پیام راهنما برای کاربران کنسولی بدون هنداوف، گام ۲۲ به استاندارد ۱۰۰٪ خواهد رسید.

</div>
