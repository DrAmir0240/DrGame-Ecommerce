# گزارش ۵: رفع باگ‌های ریسپانسیو چیدمان و اتصال کامپوننت‌های فروشگاه

## ۱. رفع باگ باز شدن دراپ‌داون هدر در خارج از کادر صفحه

### ریشه‌یابی باگ:
* دراپ‌داون اعلانات ([`NotificationDropdown.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/layout/NotificationDropdown.tsx)) و سوییچر زبان ([`LanguageSwitcher.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/layout/LanguageSwitcher.tsx)) دارای کلاس ثابت `absolute left-0 w-80` بودند.
* در حالت انگلیسی (LTR)، کنترل‌های هدر در منتهی‌الیه سمت راست صفحه قرار می‌گیرند؛ در نتیجه منوی ۳۲۰ پیکسلی به سمت بیرون نمایشگر باز شده و بیش از ۹۰٪ آن خارج از دید کاربر می‌رفت.
* در نمایشگرهای موبایل با عرض کمتر از ۳۸۰ پیکسل، عرض ثابت ۳۲۰ پیکسل باعث سرریز افقی (Overflow) می‌شد.

### راهکار پیاده‌شده:
```tsx
className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-auto sm:right-auto sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl bg-[#0b0e17]/95 font-vazir text-start ltr:sm:right-0 ltr:sm:left-auto rtl:sm:left-0 rtl:sm:right-auto"
dir={dir}
```
1. **در دسکتاپ (`sm:` به بالا):** با `ltr:sm:right-0 rtl:sm:left-0`، منو در حالت انگلیسی به لبه راست دکمه قفل شده و به سمت داخل صفحه باز می‌شود و در حالت فارسی به لبه چپ متصل می‌گردد.
2. **در موبایل (`< sm`):** به صورت شناور با `fixed top-16 left-3 right-3` زیر هدر فیکس می‌شود تا در هر رزولوشن گوشی، بدون بیرون‌زدگی کامل نمایش داده شود.

---

## ۲. اتصال کامپوننت‌های فروشگاه به سیستم ترجمه داینامیک

فیلدهای متعددی در پروژه به صورت مستقیم متن فارسی دیتابیس را بدون واسطه چاپ می‌کردند که همگی شناسایی و به `<DynamicText />` متصل شدند:

| کامپوننت | فیلدهای اصلاح‌شده | رفتار پس از اصلاح |
| :--- | :--- | :--- |
| **[`GameCard.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/games/GameCard.tsx)** | عنوان بازی (`title`) | استفاده از عنوان انگلیسی در `en`، و ترجمه خودکار عنوان به عربی در `ar`. |
| **[`games/[id]/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(store)/games/[id]/page.tsx)** | ژانرها (`genres`)، داستان (`storyline`)، جوایز (`awards`) | ترجمه آنی ژانرها از دیکشنری محلی و ترجمه کامل بدنه داستان و جوایز. |
| **[`DownloadBox.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/games/DownloadBox.tsx)** | نام پارت‌ها (`part_name`)، پلن اشتراک (`tier.name_fa`) | ترجمه عناوین پارت‌های دانلودی و نام سطح اشتراک کاربر. |
| **[`FilterSidebar.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/games/FilterSidebar.tsx)** | اسامی سایر ژانرها (`g.name_fa`) | ترجمه داینامیک تمام دسته‌بندی‌های فرعی فیلتر بازی‌ها. |
| **[`DoubleHeroBanners.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/home/DoubleHeroBanners.tsx)** | نشان‌ها (`badge`)، تیترها، توضیحات و دکمه‌ها (`cta_text`) | ترجمه همزمان بنر بازی و بنر خدمات صفحه اصلی. |
| **[`TutorialBlogsSection.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/home/TutorialBlogsSection.tsx)** | نام دسته‌ها، خلاصه مقالات، زمان مطالعه | ترجمه آنی دسته‌ها در ۰ میلی‌ثانیه، ترجمه خلاصه و فرمت تاریخ/زمان. |
| **[`BlogCard.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/blog/BlogCard.tsx)** | عنوان، نام دسته و خلاصه وبلاگ | اتصال کامل کارت‌های وبلاگ به موتور ترجمه. |
| **[`blog/[id]/page.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/app/(store)/blog/[id]/page.tsx)** | تیتر، نام دسته و متن کامل مقاله (`content_fa`) | ترجمه چندپاراگرافی کل مقاله بدون خطای طول متن. |
| **[`BlogFilterSidebar.tsx`](file:///d:/project/DrGame-Ecommerce/frontend/src/components/blog/BlogFilterSidebar.tsx)** | نام دسته‌بندی‌های سایدبار وبلاگ (`cat.name_fa`) | ترجمه دسته‌بندی‌ها به زبان فعال. |

---

## ۳. دستاوردها
* یکپارچگی کامل رابط کاربری در زبان‌های فارسی، انگلیسی و عربی.
* عدم وجود حتی یک متن فارسی هاردکد شده در صفحه اصلی و کاتالوگ در زمان انتخاب زبان‌های خارجی.
* برطرف شدن هرگونه خطای سرریز (Overflow) دراپ‌داون‌ها در موبایل و دسکتاپ.

