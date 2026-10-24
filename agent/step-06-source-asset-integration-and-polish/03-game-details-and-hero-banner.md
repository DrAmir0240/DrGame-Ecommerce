<div dir="rtl" lang="fa">

# سند هیرو بنر سینمایی و متون کامل بازی (03 - Game Details & Hero Banner)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/03-game-details-and-hero-banner.md`

---

## ۱. ریشه‌یابی نواقص صفحه جزئیات بازی (`/shop/[slug]`)

### ریشه‌یابی نواقص:
۱. **توضیحات ناکافی:** در حال حاضر توضیحات بازی فقط به یک جمله خلاصه محدود شده است، در حالی که در سورس مرجع (`sources/GameDr-Website-Source/website/data/descriptions.json` با حجم ۹۳۲ کیلوبایت)، برای هر بازی متون مفصل فارسی چند پاراگرافی شامل داستان، مکانیزم‌های گیم‌پلی، ویژگی‌های نسخه ریمستر و قابلیت‌های DualSense وجود دارد.
۲. **نبود هیرو بنر:** بالای صفحه جزئیات فاقد بنر عریض، سینمایی و دارای بک‌دراپ است که هویت بصری استور پلی‌استیشن را به کاربر القا کند.
۳. **نبود پیوند انکر برای دانلود:** دکمه‌های بیرونی (مانند دانلود از کتابخانه یا هیرو) کاربر را صرفاً به بالای صفحه می‌فرستادند و کاربر باید به صورت دستی اسکرول می‌کرد تا پارت‌های دانلود را پیدا کند.

---

## ۲. پیاده‌سازی کامپوننت هیرو بنر سینمایی (`GameHeroBanner.tsx`)

این کامپوننت با تصویر پس‌زمینه باکیفیت عریض، پوشش گرادینت کهکشانی و دکمه‌های اکشن طراحی می‌شود:

```tsx
"use client";

import React from "react";
import { Download, Heart, Share2, Sparkles, Star, Calendar, ShieldCheck } from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { useApp } from "@/lib/app";

interface GameHeroBannerProps {
  game: {
    title: string;
    studio: string;
    year: number;
    metacritic: number;
    image: string;
    backdrop?: string;
    platforms: string[];
    genreFa: string;
    sizeGb: number;
  };
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
}

export const GameHeroBanner: React.FC<GameHeroBannerProps> = ({
  game,
  onWishlistToggle,
  isWishlisted,
}) => {
  const { t, n } = useApp();
  const backdropImage = game.backdrop || game.image;

  const scrollToDownload = () => {
    const el = document.getElementById("game-files-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8 min-h-[380px] md:min-h-[460px] flex items-end">
      {/* Background Image with Parallax & Gradients */}
      <div className="absolute inset-0 z-0">
        <img
          src={backdropImage}
          alt={game.title}
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-transparent to-transparent opacity-90" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full p-6 md:p-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          {/* Platform Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2">
            {game.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} size="sm" />
            ))}
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white font-medium backdrop-blur-md">
              {game.genreFa}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1 font-mono">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{game.metacritic} Metacritic</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {game.title}
          </h1>

          {/* Studio & Size info */}
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-300">
            <span className="text-purple-300 font-bold">{game.studio}</span>
            <span>•</span>
            <span className="font-mono">{game.year}</span>
            <span>•</span>
            <span className="font-mono text-purple-200">حجم دیتا: {n(game.sizeGb)} GB</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={scrollToDownload}
            className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{t("دانلود مستقیم پارت‌ها", "Download Data Parts")}</span>
          </button>

          <button
            type="button"
            onClick={onWishlistToggle}
            className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all ${
              isWishlisted
                ? "bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/30"
                : "bg-white/10 border-white/20 text-slate-300 hover:text-white hover:bg-white/20"
            }`}
            title="افزودن به کتابخانه بازی‌ها"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: game.title, url: window.location.href });
              }
            }}
            className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 text-slate-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all"
            title="اشتراک‌گذاری"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## ۳. بارگذاری توضیحات کامل فارسی (`descriptions.json`)

در `frontend/src/app/shop/[slug]/page.tsx`، توضیحات بازی باید از جدول کامل `descriptions.json` واکشی شود:

```tsx
// واکشی متن کامل توضیحات با فال‌بک مطمئن
const fullDescription =
  descriptionsData[game.slug]?.description_fa ||
  game.description ||
  "توضیحات رسمی بازی به همراه مشخصات فنی به زودی تکمیل خواهد شد.";

// تب‌های محتوایی عمیق
<div className="rounded-2xl border border-white/10 bg-[#101116] p-6 md:p-8 space-y-6">
  <div className="flex border-b border-white/10 gap-6 text-sm font-bold">
    <button className="pb-3 text-purple-400 border-b-2 border-purple-500">
      توضیحات و معرفی بازی
    </button>
    <button className="pb-3 text-slate-400 hover:text-white">
      داستان و جهان بازی
    </button>
    <button className="pb-3 text-slate-400 hover:text-white">
      مشخصات فنی و راهنمای نصب FPKG
    </button>
  </div>

  <div className="text-slate-300 leading-relaxed text-sm md:text-base space-y-4 whitespace-pre-line">
    {fullDescription}
  </div>
</div>
```

---

## ۴. انکر پیوند دانلود (`id="game-files-section"`)

باکس پارت‌های دانلود دیتای بازی در خط ۲۳۰ فایل `shop/[slug]/page.tsx` مجهز به شناسه یکتا می‌شود:

```tsx
<section id="game-files-section" className="scroll-mt-24 space-y-4">
  {/* جدول یا لیست پارت‌های دانلود بازی */}
</section>
```

با این تغییر، لینک‌های خارج از صفحه (از جمله دکمه دانلود در کتابخانه بازی‌های پنل کاربری) به صورت `href="/shop/[slug]#game-files-section"` مستقیم کاربر را به بخش دانلود هدایت می‌کنند.

</div>
