# مستند ۰۲ — پس‌زمینه دقیق سورس GameDr و پالایش نشان‌های برند
**مسیر سند:** `agent/step-08-design-refinements-admin-crud-and-game-details/02-source-background-and-brand-polish.md`

---

## ۱. پیاده‌سازی پس‌زمینه دقیق سورس (`GameDr-Website-Source`)

### ۱.۱. تحلیل کدهای سورس مرجع
در فایل `sources/GameDr-Website-Source/website/public/style.css` (خطوط ۴۴۰ الی ۴۶۰)، استایل پس‌زمینه به صورت زیر پیاده‌سازی شده است:
```css
body {
  position: relative;
  background: var(--hero-bg); /* #1a1b1f */
}
body:before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;
  background: 
    radial-gradient(900px 520px at 50% -120px, rgba(88, 101, 242, 0.12), transparent 70%),
    radial-gradient(700px 480px at 100% 100%, rgba(88, 101, 242, 0.06), transparent 70%);
}
body:after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: url("/bg-pattern-dark.svg") 0 0 / 560px 560px repeat;
  -webkit-mask-image: linear-gradient(180deg, #000, rgba(0, 0, 0, 0.55) 55%, rgba(0, 0, 0, 0.9));
  mask-image: linear-gradient(180deg, #000, rgba(0, 0, 0, 0.55) 55%, rgba(0, 0, 0, 0.9));
  opacity: 0.075;
}
html[data-theme="light"] body:before {
  background: 
    radial-gradient(900px 520px at 50% -120px, rgba(88, 101, 242, 0.16), transparent 70%),
    radial-gradient(700px 480px at 100% 100%, rgba(88, 101, 242, 0.09), transparent 70%);
}
html[data-theme="light"] body:after {
  background-image: url("/bg-pattern-light.svg");
  opacity: 0.12;
}
```

### ۱.۲. یکپارچه‌سازی در `globals.css`
- تمامی کدهای اضافی یا پترن‌های تکراری حذف و دقیقاً قوانین بالا با گرادیان نئونی بنفش اختصاصی به بدنه متصل می‌شوند.
- رنگ پایه پس‌زمینه تاریک روی `#1a1b1f` (رنگ اصیل سورس دکتر گیم) تنظیم می‌گردد تا عمق بصری پنل‌ها و کارت‌ها به اوج برسد.

---

## ۲. حذف حاشیه‌های لوگو (Borderless Brand Logos)

- در هدر، فوتر بین‌المللی و فوتر ایرانی، هرگونه استایل `border`, `border-white/10`, `ring` یا پس‌زمینه کادری از تگ‌های `<img>` لوگو حذف می‌شود.
- لوگو به صورت تصویری شفاف و معلق همراه با `drop-shadow` ملایم نئونی رندر خواهد شد.
