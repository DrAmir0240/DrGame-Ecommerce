# 📋 چک‌لیست اجرایی گام سیزدهم: یکپارچه‌سازی ابجکت استوریج لیارا (13-liara-object-storage)

> **قانون قطعی ایجنت:** ایجنت هوش مصنوعی موظف است بلافاصله پس از تکمیل موفق هر تسک، فایل حاضر را ویرایش کرده و وضعیت آن تسک را با علامت زدن چک‌باکس (`- [x]`) ثبت نماید.  
> **خط قرمز توسعه:** هیچ فایلی در پوشه `frontend/` نباید ویرایش یا ایجاد شود؛ کلیه اقدامات منحصراً در `backend/` متمرکز است.

---

### فاز ۱: محیط، وابستگی‌ها و پیکربندی (Environment & Configuration)
- [x] افزودن کتابخانه‌های `boto3` و `botocore` به فایل `backend/requirements.txt`
- [x] تعریف متغیرهای پیکربندی ابجکت استوریج لیارا (`LIARA_ENDPOINT`, `LIARA_BUCKET_NAME`, `LIARA_ACCESS_KEY`, `LIARA_SECRET_KEY`, `LIARA_PUBLIC_URL`) و محاسبه `S3_PUBLIC_BASE_URL` در `backend/app/core/config.py`
- [x] ثبت متغیرها و مقادیر واقعی اتصال به لیارا در فایل ریشه `.env`
- [x] درج متغیرهای راهنمای اتصال در فایل ریشه `.env.example`
- [x] به‌روزرسانی بخش environment سرویس `backend` در فایل `docker-compose.dev.yml` در صورت نیاز

---

### فاز ۲: هسته سرویس ذخیره‌سازی ابری و متدهای ناهمگام (Core Storage Engine)
- [x] پیاده‌سازی کلاس `LiaraS3Storage` در `backend/app/core/storage.py` با کلاینت سینگلتون `boto3.client('s3')` و نسخه امضای `s3v4`
- [x] پیاده‌سازی متد ناهمگام `upload_bytes` با اجرای I/O در `asyncio.to_thread` و تعیین Content-Type بر اساس پسوند فایل
- [x] پیاده‌سازی متد ناهمگام `generate_presigned_url` برای تولید لینک‌های دانلود امضاشده موقت
- [x] پیاده‌سازی متد ناهمگام `delete_file` جهت امکان حذف فایل‌ها از باکت لیارا
- [x] پیاده‌سازی مکانیسم بازگشت هوشمند به دیسک محلی (Graceful Local Fallback) در صورت نبود تنظیمات یا خطای شبکه
- [x] ارتقای تابع `download_and_save_image` جهت دریافت تصویر از URL خارجی (RAWG)، آپلود به باکت لیارا و بازگرداندن URL ابری
- [x] ارتقای تابع `save_uploaded_file` برای ذخیره فایل‌های آپلودشده فرم‌ها (`UploadFile`) در باکت لیارا

---

### فاز ۳: اسکریپت‌های کمکی و تست اتصال عملیاتی (Scripts & Connectivity)
- [x] نگارش اسکریپت مستقل `backend/scripts/test_liara_connection.py` جهت بررسی پینگ و اتصال به باکت `drgame-storage`
- [x] اجرای اسکریپت تست اتصال در محیط داکر و اطمینان از آپلود موفق فایل نمونه و دسترسی به URL بازگشتی
- [x] نگارش اسکریپت اختیاری `backend/scripts/migrate_local_media_to_s3.py` جهت همگام‌سازی فایل‌های محلی فعلی با باکت لیارا

---

### فاز ۴: آزمون‌های خودکار و تضمین کیفیت با Pytest (Automated Testing)
- [x] نگارش تست‌های جامع در `backend/tests/test_storage.py` (پوشش آپلود بایت‌ها، تولید URL ابری، تولید Presigned URL و فال‌بک لوکال)
- [x] اجرای تست‌های کامل در کانتینر داکر: `docker compose -f docker-compose.dev.yml run --rm backend pytest tests/test_storage.py -v`
- [x] اطمینان از قبولی ۱۰۰٪ آزمون‌ها و عدم وجود شکست (Zero Failures)

---

### فاز ۵: اعتبارسنجی نهایی و تحویل مایل‌استون (Verification & Delivery)
- [x] اطمینان از عدم دستکاری هیچ فایلی در پوشه فرانت‌اند (`frontend/`)
- [x] اعتبارسنجی پایداری کانتینر بک‌اند پس از راه‌اندازی با تنظیمات جدید
- [x] ثبت گزارش تحویل گام در پوشه گزارش‌های بک‌اند (`backend/reports/06.md`)
