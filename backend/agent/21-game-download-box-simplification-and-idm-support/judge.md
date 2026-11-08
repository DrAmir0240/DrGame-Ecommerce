<div dir="rtl" lang="fa">

# ⚖️ داوری و ممیزی فنی گام بیست و یکم: ساده‌سازی باکس دانلود بازی‌ها و استقرار ماژول نمایش لینک برای IDM (21-game-download-box-simplification-and-idm-support)

> **عنوان گزارش:** ارزیابی تطبیقی و ممیزی کدهای پیاده‌سازی‌شده با نیازمندی‌ها، دستورالعمل‌ها و تسک‌های گام ۲۱  
> **محل قرارگیری سند:** `backend/agent/21-game-download-box-simplification-and-idm-support/judge.md`  
> **تاریخ داوری:** نوامبر ۲۰۲۶  
> **رأی نهایی داوری:** 🟡 **قبولی مشروط با اصلاحات استریمینگ و هدرها (Conditional Pass - 88/100)**

---

## ۱. خلاصه اجرایی و ارزیابی کیفیت پیاده‌سازی (Executive Summary)

گام بیست و یکم با هدف اصلاح بنیادین تجربه کاربری (UX) در باکس دانلود صفحه بازی، حذف کارت‌های گیج‌کننده فریمور (FPKG و FAT32) از ویترین، انتقال پیکربندی تخصصی فریمور به داخل مودال تایید، و استقرار گام «لینک دانلود آماده است» برای پشتیبانی از نرم‌افزارهای مدیریت دانلود (به‌ویژه Internet Download Manager - IDM) تعریف شد.

### نکات مثبت و نقاط قوت پیاده‌سازی:
1. **پاک‌سازی صفحه محصول (`DownloadBox.tsx`):** رندر کارت‌های دوگانه فریمور از تب دیتا حذف شده و کارت شیک، خلوت و یکپارچه «دیتای رسمی بازی پلی‌استیشن» به همراه مشخصات Title ID، تگ سلامت فایل و دکمه واحد دانلود جایگزین شد.
2. **استقرار گام «لینک دانلود آماده است» در مودال (`DownloadConfirmModal.tsx`):** تایمر بستن خودکار دیالوگ (`setTimeout`) کاملاً حذف گردید. دیالوگ پس از صدور بلیت وارد مرحله `ready` شده، آدرس کامل دانلود مستقیم را در اینپوت با قابلیت کپی نمایش می‌دهد، و دو دکمه اختصاصی «کپی لینک دانلود برای IDM» و «دانلود در مرورگر» را در اختیار کاربر قرار می‌دهد.
3. **بازسازی لینک در تاریخچه دانلودها (`/dashboard/downloads`):** برای رکوردهایی که کمتر از ۶ ساعت از دانلود آن‌ها گذشته است، دکمه کپی لینک فعال بوده و برای رکوردهای قدیمی‌تر، نشان خاکستری «لینک منقضی شده» بدون امکان دانلود رایگان مجدد نمایش می‌یابد.
4. **پشتیبانی بک‌اند از هدرهای `GET` و `HEAD`:** اندپوینت `/api/games/{game_id}/download-stream` با دکوراتور `api_route` هر دو متد `GET` و `HEAD` را پاسخ می‌دهد و هدرهای `Accept-Ranges: bytes` و `Content-Disposition` را تنظیم می‌کند.
5. **پاس شدن کامل آزمون‌ها:** فایل تست `app/modules/games/tests/test_step21_idm_downloads.py` با موفقیت در محیط کانتینر پاس شد.

---

## ۲. جدول ماتریس ارزیابی تطبیقی وظایف (Tasks vs Reality)

| ردیف | وظیفه در `tasks.md` | وضعیت در کد واقعی | کیفیت | محل بررسی در کدبیس | توضیحات داوری |
| :---: | :--- | :---: | :---: | :--- | :--- |
| **۱** | حذف کارت‌های دوگانه FPKG/FAT32 از صفحه بازی | ✅ انجام شد | عالی | `frontend/src/components/games/DownloadBox.tsx:320-370` | کارت واحد با مشخصات کلی و تگ سلامت جایگزین شد. |
| **۲** | انتقال انتخاب فریمور به داخل پاپ‌آپ | ✅ انجام شد | عالی | `frontend/src/components/games/DownloadConfirmModal.tsx:130-180` | مرحله `configure` پلتفرم و فریمور را دریافت می‌کند. |
| **۳** | مرحله لینک آماده در مودال (Ready Step) | ✅ انجام شد | عالی | `frontend/src/components/games/DownloadConfirmModal.tsx:370-420` | اینپوت Select-All، دکمه کپی IDM و دکمه مرورگر مستقر شد. |
| **۴** | حذف بستن خودکار پاپ‌آپ | ✅ انجام شد | عالی | `frontend/src/components/games/DownloadConfirmModal.tsx:238` | مودال باز می‌ماند تا کاربر لینک را با آرامش کپی کند. |
| **۵** | بررسی پنجره ۶ ساعته در صفحه تاریخچه | ✅ انجام شد | عالی | `frontend/src/app/(dashboard)/dashboard/downloads/page.tsx:268-305` | اگر زمان < ۶ ساعت باشد دکمه کپی فعال است؛ در غیر این صورت برچسب منقضی. |
| **۶** | بازگرداندن URL امضاشده در اندپوینت تاریخچه | ✅ انجام شد | عالی | `backend/app/modules/games/services.py:627-637` | تاریخچه دانلودها لینک امن ۶ ساعته را بازمی‌گرداند. |
| **۷** | پشتیبانی بک‌اند از هدرهای Range و HEAD | ✅ انجام شد | خوب | `backend/app/modules/games/router.py:258-380` | وضعیت 200 و 206 و متد HEAD پیاده‌سازی شدند. |
| **۸** | استریم پکیج واقعی بازی به IDM | ⚠️ کاستی | متوسط | `backend/app/modules/games/router.py:349-359` | پکیج بازی‌های کامل به صورت دامی ۱۰ مگابایتی استریم می‌شود! |
| **۹** | تطابق طول عمر توکن در متدهای مختلف | ⚠️ کاستی | متوسط | `backend/app/modules/games/services.py:582` | در متد قدیمی `generate_download_file_link` طول عمر ۱ ساعت است، نه ۶ ساعت. |

---

## ۳. کاستی‌ها، ایرادات و خطاهای کشف‌شده (Defects & Issues)

### ایراد اول (استریمینگ داده در پروداکشن): استریم محتوای ساختگی ۱۰ مگابایتی برای پکیج‌های حجیم بازی
* **محل خطا:** `backend/app/modules/games/router.py` (خطوط ۳۴۹ تا ۳۵۹):
```python
# In dev/mock streaming, stream clean sample payload to avoid saturating disk
limit = min(content_length, 10 * 1024 * 1024)

async def sample_stream():
    chunk = b"\x00" * 65536
    sent = 0
    while sent < limit:
        to_write = min(len(chunk), limit - sent)
        yield chunk[:to_write]
        sent += to_write
```
* **ریشه‌یابی خطا:** اگر درخواست کاربر برای فایلی باشد که آدرس خارجی دارد (`file_rec.download_url`)، سیستم با کد ۳۰۲ ریدایرکت می‌کند (خط ۳۲۱). اما برای پکیج اصلی بازی (`job_game_{id}_{format}`)، سیستم به جای اتصال به آبجکت استوریج لیارا (S3) یا تولید لینک پیش‌امضا‌شده S3، حداکثر ۱۰ مگابایت بایت صفر (`b"\x00"`) استریم می‌کند! کاربری که بازی ۴۰ گیگابایتی را در IDM اضافه می‌کند، با یک فایل خراب ۱۰ مگابایتی مواجه می‌شود.
* **راه حل:**
در صورت اتصال به باکت لیارا S3، باید مستقیماً با کلاینت MinIO/Boto3 یک Presigned URL مستقیم با انقضای ۶ ساعته صادر شده و ریدایرکت شود، یا استریم از طریق S3 انجام پذیرد:
```python
# در صورت وجود کلید استوریج در S3:
s3_url = await StorageBridgeService.generate_presigned_download_url(
    s3_key=f"games/{game.source_id}/package_{format}.pkg",
    expires_in=21600
)
if s3_url:
    return RedirectResponse(url=s3_url, status_code=status.HTTP_302_FOUND)
```

---

### ایراد دوم (پروتکل HTTP و دانلود چندکاناله IDM): ناهمخوانی `Content-Length` در درخواست‌های Range
* **محل خطا:** `backend/app/modules/games/router.py` (خطوط ۳۷۶ تا ۳۸۰):
```python
headers = {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": f'attachment; filename="{filename}"',
    "Accept-Ranges": "bytes",
    "Content-Length": str(limit),
}
if range_header:
    headers["Content-Range"] = f"bytes {start}-{end}/{total_size}"
    return StreamingResponse(sample_stream(), status_code=status.HTTP_206_PARTIAL_CONTENT, headers=headers)
```
* **ریشه‌یابی خطا:** نرم‌افزار IDM برای دانلود سریع از چند اتصال موازی (مثلاً ۳۲ کانکشن) استفاده می‌کند. مثلاً کانکشن اول درخواست `Range: bytes=0-104857599` (معادل ۱۰۰ مگابایت) را می‌دهد. هدر پاسخ `Content-Range` می‌گوید بازه ۰ تا ۱۰۴۸۵۷۵۹۹ است، اما هدر `Content-Length` به دلیل محدودیت `limit` برابر با `10485760` (۱۰ مگابایت) ست می‌شود! نرم‌افزار IDM بلافاصله با خطای "Data corruption" یا "Connection closed prematurely by server" اتصال را قطع می‌کند.
* **راه حل:** هدر `Content-Length` در صورت وجود `range_header` باید دقیقاً برابر با طول چانک درخواستی (`content_length = end - start + 1`) باشد:
```python
actual_chunk_len = (end - start + 1) if range_header else total_size
headers["Content-Length"] = str(actual_chunk_len)
```

---

### ایراد سوم (عدم تطابق انقضا در کدهای Legacy): انقضای ۱ ساعته در برابر ۶ ساعته
* **محل خطا:** `backend/app/modules/games/services.py` (خط ۵۸۲):
```python
signed_url = f"{file.download_url}{delimiter}token={sig}&uid={user_id}&exp={timestamp + 3600}"
```
* **ریشه‌یابی خطا:** در حالی که در متد جدید `generate_download_ticket` (خط ۱۱۶۱) و تاریخچه دانلودها (خط ۶۲۸) مهلت توکن ۶ ساعت (`timestamp + 21600`) تنظیم شده است، در متد `generate_download_file_link` مقدار انقضا هنوز ۱ ساعت (`+ 3600`) باقی مانده است. کلاینتی که از طریق روت فایل‌های دانلودی اقدام کند، پس از ۶۰ دقیقه با خطای انقضا روبرو می‌شود در حالی که فرانت‌اند زمان ۶ ساعته را وعده می‌دهد.
* **راه حل:** تغییر `timestamp + 3600` به `timestamp + 21600`.

---

## ۴. جمع‌بندی رأی داوری گام ۲۱

گام بیست و یکم از دیدگاه فرانت‌اند و تجربه کاربری (UX) به بهترین شکل ممکن پیاده‌سازی شده و معضل سردرگمی نسخه‌های فریمور و بسته شدن خودکار مودال را به طور کامل حل کرده است. جهت رسیدگی به کیفیت نهایی در پروداکشن، اصلاح هدر `Content-Length` برای سازگاری بی‌نقص با اتصالات ۳۲ کاناله IDM و اتصال استریم به آبجکت استوریج واقعی لیارا ضروری است.

</div>
