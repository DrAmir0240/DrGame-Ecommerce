<div dir="rtl" align="right">

# ماتریس زبان‌ها، مهندسی چندزبانگی و واژه‌نامه تخصصی گیمینگ (I18n & Gaming Language Matrix)

این سند مشخصات فنی کامل سامانه چندزبانگی پلتفرم **DrGame-Ecommerce** را بر مبنای مناطق هدف (اروپای شرقی، اروپای غربی، اروپای شمالی، آسیای صغیر، عربی، انگلیسی، آلمانی، فرانسوی) با جدول جامع ۳۰+ زبانه، سیاست جریان متنی راست‌به‌چپ درون چیدمان ثابت، و خط‌مشی‌های اعتبارسنجی CI/CD منطبق بر بند ۷.۱۲ پرامپت ارشد تشریح می‌نماید.

---

## ۱. ماتریس جامع زبان‌های پلتفرم (Comprehensive Language Matrix)

تمامی زبان‌های تحت پوشش به همراه کدهای استاندارد BCP-47، قواعد جمع، ریسک‌های بومی‌سازی و امواج پیاده‌سازی (Waves) در جدول زیر تدوین شده‌اند:

| گروه منطقه‌ای | نام انگلیسی | نام بومی زبان | کد BCP-47 | خط / جهت | فرم‌های جمع CLDR | لحن (Register) | ریسک‌های محلی‌سازی (Risks) | موج (Wave) | وضعیت در مخزن |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **ایران و خاورمیانه** | Persian | فارسی | `fa-IR` | عربی / RTL | one, other | صمیمی / گیمینگ | ارقام فارسی، علائم نگارشی Bidi | **W1** | موجود (`exists`) |
| **بین‌الملل** | English | English (US) | `en-US` | لاتین / LTR | one, other | خنثی / مدرن | زبان مرجع (Baseline) | **W1** | موجود (`exists`) |
| **خاورمیانه** | Arabic | العربية | `ar-SA` | عربی / RTL | zero, one, two, few, many, other | محترمانه / فصیح | کشیدگی متون، تفاوت واژگان لهجه‌ها | **W1** | موجود (`exists`) |
| **آسیای صغیر** | Turkish | Türkçe | `tr-TR` | لاتین / LTR | one, other | گیمینگ / روان | طول کلمات پسوندی، حرف İ/ı بی‌نقطه | **W1** | موجود (`exists`) |
| **اروپای غربی** | German | Deutsch | `de-DE` | لاتین / LTR | one, other | ساختاریافته / رسمی | انبساط طولی کلمات (Text Expansion) | **W1** | جدید (`new`) |
| **اروپای غربی** | French | Français | `fr-FR` | لاتین / LTR | one, other | صمیمی / روان | فاصله قبل از علائم (:، !) و طول عبارات | **W1** | جدید (`new`) |
| **اروپای شرقی** | Russian | Русский | `ru-RU` | سیریلیک / LTR | one, few, many, other | گیمینگ استاندارد | تغییر فرم کلمات بر مبنای اعداد | **W2** | جدید (`new`) |
| **اروپای غربی** | Spanish | Español | `es-ES` | لاتین / LTR | one, other | دوستانه / پرانرژی | علامت سوال و تعجب معکوس (¿, ¡) | **W2** | جدید (`new`) |
| **اروپای غربی** | Italian | Italiano | `it-IT` | لاتین / LTR | one, other | صمیمی / پرشور | طولانی‌تر بودن افعال نسبت به انگلیسی | **W2** | جدید (`new`) |
| **اروپای شرقی** | Polish | Polski | `pl-PL` | لاتین / LTR | one, few, many, other | گیمینگ دقیق | کاراکترهای خا‌ص (ą, ę, ś, ź, ż) | **W2** | جدید (`new`) |
| **اروپای غربی** | Portuguese | Português | `pt-PT` | لاتین / LTR | one, other | روان / استاندارد | تفکیک واژگان پرتغال از برزیل | **W2** | جدید (`new`) |
| **اروپای غربی** | Dutch | Nederlands | `nl-NL` | لاتین / LTR | one, other | مستقیم / ساده | ترکیب واژگان ترکیبی طولانی | **W2** | جدید (`new`) |
| **اروپای شمالی** | Swedish | Svenska | `sv-SE` | لاتین / LTR | one, other | مدرن / مختصر | کاراکترهای å, ä, ö | **W3** | جدید (`new`) |
| **اروپای شمالی** | Danish | Dansk | `da-DK` | لاتین / LTR | one, other | کوتاه / صمیمی | حروف æ, ø, å | **W3** | جدید (`new`) |
| **اروپای شمالی** | Norwegian | Norsk Bokmål | `nb-NO` | لاتین / LTR | one, other | مینیمال / مدرن | تفکیک استاندارد Bokmål از Nynorsk | **W3** | جدید (`new`) |
| **اروپای شمالی** | Finnish | Suomi | `fi-FI` | لاتین / LTR | one, other | دقیق / بدون جنسیت | کلمات بسیار طولانی آگلوتیناتیو | **W3** | جدید (`new`) |
| **اروپای شرقی** | Ukrainian | Українська | `uk-UA` | سیریلیک / LTR | one, few, many, other | میهن‌پرستانه / محترم | تفاوت‌های نگارشی حروف با روسی (і, ї, є) | **W3** | جدید (`new`) |
| **اروپای شرقی** | Czech | Čeština | `cs-CZ` | لاتین / LTR | one, few, many, other | گیمینگ صمیمانه | علامت‌های هاکک (č, š, ž, ř) | **W3** | جدید (`new`) |
| **اروپای شرقی** | Romanian | Română | `ro-RO` | لاتین / LTR | one, few, other | استاندارد | ویرگول زیر حروف (ș, ț) به جای سدیلا | **W3** | جدید (`new`) |
| **اروپای شرقی** | Hungarian | Magyar | `hu-HU` | لاتین / LTR | one, other | رسمی / گیمینگ | ترتیب برعکس نام‌ها و ساختار ترکیبی | **W3** | جدید (`new`) |
| **آسیای صغیر** | Greek | Ελληνικά | `el-GR` | یونانی / LTR | one, other | کلاسیک / دقیق | فونت یونانی و کاراکتر تنوس (ά, έ) | **W3** | جدید (`new`) |
| **اروپای شرقی** | Bulgarian | Български | `bg-BG` | سیریلیک / LTR | one, other | ساده / مستقیم | سیریلیک بلغاری با فرم ایستاده حروف | **W3** | جدید (`new`) |
| **اروپای شرقی** | Serbian | Srpski | `sr-RS` | سیریلیک/لاتین | one, few, many, other | محترمانه | نیاز به پشتیبانی خطوط همزمان | **W3** | جدید (`new`) |
| **اروپای شرقی** | Croatian | Hrvatski | `hr-HR` | لاتین / LTR | one, few, many, other | دقیق / فنی | حروف č, ć, dž, đ, š, ž | **W3** | جدید (`new`) |
| **اروپای شرقی** | Slovak | Slovenčina | `sk-SK` | لاتین / LTR | one, few, many, other | دوستانه | شباهت زیاد با چکی ولی قواعد مجزا | **W3** | جدید (`new`) |
| **اروپای شمالی** | Lithuanian | Lietuvių | `lt-LT` | لاتین / LTR | one, few, other | دقیق | حالت‌های دستوری متعدد اسامی | **W4** | جدید (`new`) |
| **اروپای شمالی** | Latvian | Latviešu | `lv-LV` | لاتین / LTR | zero, one, other | استاندارد | کشیدگی حروف صدادار (ā, ē, ī, ū) | **W4** | جدید (`new`) |
| **اروپای شمالی** | Estonian | Eesti | `et-EE` | لاتین / LTR | one, other | مینیمال | حروف õ, ä, ö, ü و ساختار فنلاندی | **W4** | جدید (`new`) |
| **آسیای صغیر** | Azerbaijani | Azərbaycan | `az-AZ` | لاتین / LTR | one, other | صمیمی | کاراکترهای ə, ı, ğ, ç, ş | **W4** | جدید (`new`) |
| **خاورمیانه** | Kurdish | کوردی (سۆرانی) | `ckb-IQ` | عربی / RTL | one, other | اصیل | فونت‌های خاص کردی و حروف ڵ، ڕ، ێ | **W4** | جدید (`new`) |
| **قفقاز** | Georgian | ქართული | `ka-GE` | گرجی / LTR | one, other | محترم / رسمی | خط منحصربه‌فرد مخدرولی (Mkhedruli) | **W4** | جدید (`new`) |
| **قفقاز** | Armenian | Հայերեն | `hy-AM` | ارمنی / LTR | one, other | سنتی / دقیق | الفبای مستقل ارمنی و علائم وقف خاص | **W4** | جدید (`new`) |

### ۱.۱. توجیه مرزهای زبانی و فهرست کاندیداهای مستثنی‌شده (Excluded Languages)
- **محدوده مجاز:** مناطق جغرافیایی هدف شامل کشورهای خاورمیانه، حوزه زبان‌های اروپایی (شرقی، غربی و اسکاندیناوی) و حوزه آسیای صغیر و قفقاز هستند که جامعه متمرکز کنسول‌های جیلبریک و دانلود دیتا را تشکیل می‌دهند.
- **زبان‌های خارج از اسکوپ فعلی (Excluded):** زبان‌های آسیای شرقی (چینی CJK، ژاپنی، کره‌ای)، زبان‌های جنوب آسیا (هندی، اردو، بنگالی) و زبان‌های آفریقایی به دلیل نیازمندی‌های متفاوت CDN، استانداردهای کاملاً مجزای فونت لایسنس‌دار و سیستم‌های پرداخت نامرتبط، از اسکوپ این گام خارج هستند.

---

## ۲. سیاست جریان متنی درون کامپوننت‌ها (RTL Text-Run Policy - تصمیم `OD-7`)

بر مبنای قانون چیدمان فیزیکی ثابت (Fixed Physical Layout):
۱. ستون‌ها و گریدها در محور فیزیکی صفحه (چپ و راست واقعی) قفل هستند.
۲. درون کانتینر هر کامپوننت، جهت خوانش متون با متغیر `dir="rtl"` (برای فارسی، عربی و کردی) یا `dir="ltr"` (برای انگلیسی و سایر زبان‌ها) مقداردهی می‌شود.
۳. فاصله‌ها و لایه‌بندی داخلی عناصر از متغیرهای منطقی متنی نظیر `text-start` و چیدمان منعطف `flex-row` و `flex-row-reverse` درون همان بلوک فیزیکی تبعیت می‌کنند تا خوانش متون زبان‌ها بدون به هم ریختن اسکلت کلان سایت به کمال برسد.

---

## ۳. واژه‌نامه یکپارچه اصطلاحات گیمینگ (Canonical Gaming Glossary)

تمامی مترجمان و ماژول‌های i18n ملزم به استفاده از برابرهای استاندارد جدول زیر می‌باشند:

| اصطلاح فنی انگلیسی | ترجمه مصوب فارسی | معادل استاندارد عربی | معادل استاندارد ترکی |
| :--- | :--- | :--- | :--- |
| **DLC (Downloadable Content)** | بسته الحاقی / دی‌ال‌سی | محتوى قابل للتنزيل | İndirilebilir İçerik (DLC) |
| **Gameplay** | گیم‌پلی / گیم‌پلی بازی | أسلوب اللعب | Oynanış |
| **Jailbreak** | جیلبریک / هک کنسول | جیلبریک / کسر الحمایة | Kırma / Jailbreak |
| **Firmware** | نگارش فریم‌ورک / فریمور | برمجيات النظام (الفيرموير) | Sistem Yazılımı (Firmware) |
| **Savegame / Cloud Save** | فایل ذخیره / سیو ابری | ملف الحفظ / الحفظ السحابي | Kayıt Dosyası / Bulut Kayıt |
| **Download Quota** | سهمیه دانلود ماهیانه | حصة التنزيل (الكوتة) | İndirme Kotası |
| **Haptic Feedback** | بازخورد لرزشی هپتیک | الاستجابة اللمسية | Dokunsal Geri Bildirim |
| **Adaptive Triggers** | تریگرهای تطبیق‌پذیر | مشغلات تفاعلية ديناميكية | Uyarlanabilir Tetikler |
| **Crack / Exploit** | پچ / کد اکسپلویت هک | ثغرة أمنية / كراك | Kırma / Exploit |
| **Trophy / Achievement** | تروفی / دستاورد | الجوائز (التروفيز) | Başarımlar / Kupalar |

---

## ۴. اسکریپت کنترل کیفیت خودکار و کشف کلیدهای مفقوده (CI/CD Missing-Key Detector)

جهت تضمین عدم وجود کلید ترجمه‌نشده در رابط کاربری، اسکریپت `scripts/verify-i18n.js` به عنوان یک گیت خودکار به چرخه تست پروژه افزوده می‌شود:

```javascript
// scripts/verify-i18n.js
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/locales');
const baseLocale = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));

let hasError = false;
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json');

files.forEach(file => {
  const currentLocale = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  const missingKeys = Object.keys(baseLocale).filter(key => !(key in currentLocale));
  if (missingKeys.length > 0) {
    console.error(`[i18n ERROR] File ${file} is missing ${missingKeys.length} keys:`, missingKeys);
    hasError = true;
  }
});

if (hasError) process.exit(1);
console.log('✅ All locales are 100% synchronized with en.json baseline.');
```

</div>
