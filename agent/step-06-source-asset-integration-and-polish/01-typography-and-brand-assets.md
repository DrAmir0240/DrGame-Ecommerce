<div dir="rtl" lang="fa">

# سند معماری تایپوگرافی، برندینگ و دارایی‌های بصری مرجع (01 - Typography & Brand Assets)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/01-typography-and-brand-assets.md`

---

## ۱. ریشه‌یابی و حل مشکل فونت‌های فارسی و لاتین

### ریشه‌یابی نقص:
در گام‌های پیشین، بارگذاری فونت از طریق دستور `@import url("https://fonts.googleapis.com/...Vazirmatn...")` انجام می‌شد. به دلیل اختلالات شبکه، تحریم‌ها و فیلترینگ دامنه‌های گوگل در داخل کشور، این درخواست‌ها با خطای تایم‌اوت مواجه شده و مرورگر به فونت‌های نامناسب پیش‌فرض سیستمی (Arial/Times/Tahoma) سوئیچ می‌کرد.

### معماری حل لوکال (Offline-First Local Fonts):
تمامی وزن‌های استاندارد فونت محبوب و خوانای **وزیرمتن (Vazirmatn)** به صورت فایل‌های بهینه‌سازی‌شده WOFF2 از مسیر سورس مرجع:
`sources/GameDr-Website-Source/website/public/fonts/`
به دایرکتوری عمومی پروژه کپی می‌شوند:
`frontend/public/fonts/`

همچنین برای متون لاتین، اعداد، شناسه‌ها و پلتفرم‌ها، فونت هندسی و مدرن **Inter** و **Oxanium** به عنوان پشته فونت مکمل تعریف می‌گردد.

### تعریف استایل در `frontend/src/app/globals.css`:
```css
/* حذف کامل ایمپورت اکسترنال گوگل فونت */
/* تعریف فونت‌های محلی با قابلیت اطمینان ۱۰۰٪ */

@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/vazirmatn-Dxxo8j6PP2D_kU2muijlGMWWMmk.woff2') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFC;
}

@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/vazirmatn-Dxxo8j6PP2D_kU2muijlGMWWMmk.woff2') format('woff2');
}

@font-face {
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/vazirmatn-Dxxo8j6PP2D_kU2muijlGMWWMmk.woff2') format('woff2');
}

@font-face {
  font-family: 'Oxanium';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/oxanium-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153;
}

:root {
  --font-vazir: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-latin: 'Oxanium', 'Inter', -apple-system, sans-serif;
}

body {
  font-family: var(--font-vazir);
}
```

---

## ۲. لوگوی اصلی برند دکتر گیم در هدر و بخش‌ها

### ریشه‌یابی نقص:
در فایل `Header.tsx` خط ۵۲ تا ۵۴، لوگو به صورت یک باکس مربعی با متن ساده `"DG"` رندر می‌شد که هویت بصری سایت را کاملاً تنزل داده بود.

### راهکار اجرایی:
انتقال فایل لوگوی شفاف مرجع با وضوح بالا از:
`sources/GameDr-Website-Source/website/public/logo.png`
به:
`frontend/public/images/logo.png` (و `frontend/public/logo.png`)

### ادغام در `Header.tsx`:
```tsx
<Link
  href="/"
  className="flex items-center gap-3 py-1 pe-2 rounded-xl group transition-all"
  title="صفحه اصلی دکتر گیم"
>
  <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-purple-600/10 border border-purple-500/30 p-1 group-hover:border-purple-500/60 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
    <img
      src="/logo.png"
      alt="DrGame"
      className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(124,58,237,0.5)] group-hover:scale-105 transition-transform"
    />
  </div>
  <div className="flex flex-col text-left">
    <span className="font-black text-lg tracking-tight text-white leading-none group-hover:text-purple-300 transition-colors">
      DrGame
    </span>
    <span className="text-[10px] text-purple-400/80 font-bold tracking-wider uppercase font-mono">
      PlayStation Edge
    </span>
  </div>
</Link>
```

---

## ۳. لوگوها و آیکون‌های وکتور پلتفرم‌ها (PS4, PS5, Switch, Xbox)

### ریشه‌یابی نقص:
در تمامی صفحات (شاپ، صفحه بازی، فیلترها و کارت‌ها)، پلتفرم‌ها صرفاً متنی («PS4»، «PS5») بودند و هیچ لوگویی از نینتندو سوئیچ یا ایکس‌باکس یا هدست واقعیت مجازی وجود نداشت.

### انتقال وکتورهای SVG مرجع:
از مسیر `sources/GameDr-Website-Source/website/public/assets/platforms/`:
1. `ps4.svg`
2. `ps5.svg`
3. `psvr2.svg`
4. `switch.svg`
5. `xbox360.svg`

به مقصد:
`frontend/public/assets/platforms/`

### ایجاد کامپوننت `PlatformBadge.tsx`:
```tsx
"use client";

import React from "react";

interface PlatformBadgeProps {
  platform: "PS4" | "PS5" | "PSVR2" | "Switch" | "Xbox" | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const PLATFORM_MAP: Record<string, { icon: string; label: string; color: string }> = {
  PS5: { icon: "/assets/platforms/ps5.svg", label: "PlayStation 5", color: "from-blue-600 to-indigo-600" },
  PS4: { icon: "/assets/platforms/ps4.svg", label: "PlayStation 4", color: "from-blue-700 to-cyan-600" },
  PSVR2: { icon: "/assets/platforms/psvr2.svg", label: "PlayStation VR2", color: "from-purple-600 to-pink-600" },
  Switch: { icon: "/assets/platforms/switch.svg", label: "Nintendo Switch", color: "from-red-600 to-rose-600" },
  Xbox: { icon: "/assets/platforms/xbox360.svg", label: "Xbox", color: "from-emerald-600 to-teal-600" },
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = "md",
  showLabel = true,
}) => {
  const info = PLATFORM_MAP[platform] || {
    icon: "/assets/platforms/ps5.svg",
    label: platform,
    color: "from-purple-600 to-indigo-600",
  };

  const sizeClasses = {
    sm: "h-5 text-[10px] px-2 gap-1",
    md: "h-6 text-xs px-2.5 gap-1.5",
    lg: "h-8 text-sm px-3.5 gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg bg-white/5 border border-white/10 text-white font-bold backdrop-blur-md shadow-sm ${sizeClasses}`}
    >
      <img src={info.icon} alt={info.label} className={`${iconSizes} object-contain filter brightness-110`} />
      {showLabel && <span>{info.label}</span>}
    </span>
  );
};
```

---

## ۴. پترن و بک‌گراند سورس GameDrWebsite

### ریشه‌یابی نقص:
صفحه اصلی فاقد بافت اتمسفریک سورس بود که حس گیمینگ کنسولی را ایجاد می‌کرد.

### راهکار اجرایی:
انتقال فایل‌های:
- `bg-pattern-dark.svg`
- `bg-pattern-light.svg`
از سورس به `frontend/public/`

### تزریق در لایه گلوبال `globals.css`:
```css
/* افکت هاله بنفش ملایم پشت سر صفحات */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    radial-gradient(900px 520px at 50% -120px, rgba(124, 58, 237, 0.14), transparent 70%),
    radial-gradient(700px 480px at 100% 100%, rgba(168, 85, 247, 0.08), transparent 70%);
}

/* پترن تکرارشونده نمادهای بازی با گرادینت عمودی ملایم */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: url("/bg-pattern-dark.svg") 0 0 / 560px 560px repeat;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0.85) 100%);
  mask-image: linear-gradient(to bottom, #000 0%, rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0.85) 100%);
  opacity: 0.08;
}
```

</div>
