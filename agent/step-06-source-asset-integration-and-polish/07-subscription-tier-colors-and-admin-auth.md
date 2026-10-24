<div dir="rtl" lang="fa">

# سند تم رنگی اشتراک‌ها، ورود تک‌کلیکی تستی و ناوبری ادمین (07 - Subscriptions, Auth & Admin Access)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/07-subscription-tier-colors-and-admin-auth.md`

---

## ۱. رنگ‌بندی اختصاصی پلن‌های اشتراک و محتوای پویا

### ریشه‌یابی نقص:
در صفحات اشتراک (`/subscriptions` و `/plans`)، کارت‌های پلن‌ها همگی یک‌شکل و بدون تمایز بصری بودند، موارد توضیحی صرفاً بولت‌های متنی ساده بودند و ساختار پلن‌ها به صورت هاردکد قرار داشت.

### تطبیق با پالت مرجع `sources/GameDr-Website-Source/website/data/plans.json`:
هر پلن اشتراک بر اساس هویت متریال خود دارای رنگ، بردر، سایه نئونی و آیکون‌های متناظر خواهد بود:

| پلن | رنگ اصلی (Hex) | گرادینت دکمه و مرز | آیکون‌های ویژگی‌ها |
| :--- | :--- | :--- | :--- |
| **رایگان (Free)** | `#64748b` (Slate) | `border-slate-600/40` | `Check` (دسترسی به ۵ بازی دمو و نامحدود) |
| **برنز (Bronze)** | `#cd7f32` (Bronze Amber) | `from-[#cd7f32]/20 border-[#cd7f32]/50` | `Gauge` (سرعت ۲۰ مگابیت)، `HardDrive` (۵۰۰ گیگ)، `Gamepad` (PS4/PS5) |
| **نقره‌ای (Silver)** | `#94a3b8` (Chroma Silver) | `from-slate-400/20 border-slate-400/50` | `Gauge` (سرعت ۲۰ مگابیت)، `HardDrive` (۱۰۰۰ گیگ)، `Languages` (زیرنویس) |
| **طلایی (Gold)** | `#f59e0b` (Radiant Gold) | `from-amber-500/25 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]` | `Zap` (سرعت ۴۰ مگابیت)، `HardDrive` (۲۲۰۰ گیگ)، `Crown` (VIP تمام پلتفرم‌ها) |

### کامپوننت کارت اشتراک با آیکون‌های تفکیکی:
```tsx
const TIER_THEMES = {
  free: {
    accent: "text-slate-400",
    border: "border-slate-500/30",
    bg: "bg-slate-500/5",
    btn: "bg-slate-700 hover:bg-slate-600",
  },
  bronze: {
    accent: "text-[#d97706]",
    border: "border-[#cd7f32]/50 hover:border-[#cd7f32]",
    bg: "bg-[#cd7f32]/10",
    btn: "bg-[#cd7f32] hover:bg-[#b86f2b] text-white shadow-lg shadow-[#cd7f32]/25",
  },
  silver: {
    accent: "text-slate-200",
    border: "border-slate-400/50 hover:border-slate-300",
    bg: "bg-slate-400/10",
    btn: "bg-slate-200 hover:bg-white text-black font-black shadow-lg shadow-white/20",
  },
  gold: {
    accent: "text-amber-400",
    border: "border-amber-400/60 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]",
    bg: "bg-amber-500/15",
    btn: "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black shadow-xl shadow-amber-500/30",
  },
};
```

---

## ۲. ایجاد صفحه احراز هویت و دکمه «ورود سریع تستی» (One-Click Dev Login)

### ریشه‌یابی نقص:
به دلیل آنکه درگاه پیامکی و ایمیل سرور هنوز فعال‌سازی نشده‌اند، فرم‌های لاگین مسدود بودند و امکان احراز هویت و بررسی صفحات کاربری و مدیریتی وجود نداشت.

### راهکار: ساخت `frontend/src/app/auth/page.tsx` با قابلیت ورود تک‌کلیکی:
```tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, ShieldCheck, User, Mail, Lock, ArrowRight } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function AuthPage() {
  const router = useRouter();
  const { t } = useApp();
  const [loggingIn, setLoggingIn] = useState(false);

  // ورود سریع تستی جهت باز کردن تمامی دسترسی‌های ادمین و پنل کاربری
  const handleOneClickTestLogin = () => {
    setLoggingIn(true);
    const mockToken = "mock_drgame_jwt_superuser_token_2026";
    const mockUser = {
      id: 1,
      email: "admin@drgame.ir",
      full_name: "توسعه‌دهنده / ادمین ارشد دکتر گیم",
      role: "superuser",
      is_active: true,
      quota_left_gb: 840,
      quota_total_gb: 1000,
      plan: "gold",
    };

    localStorage.setItem("drgame_token", mockToken);
    localStorage.setItem("drgame_user", JSON.stringify(mockUser));
    document.cookie = `drgame_token=${mockToken}; path=/; max-age=86400`;

    setTimeout(() => {
      setLoggingIn(false);
      router.push("/panel");
      window.location.reload();
    }, 600);
  };

  return (
    <Page>
      <div className="max-w-md mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 p-2 mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="DrGame" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white">ورود و عضویت در پلتفرم دکتر گیم</h1>
          <p className="text-xs text-slate-400">
            جهت تست سریع، دسترسی به پنل ادمین، سهمیه دانلود و سبد خرید از دکمه زیر استفاده کنید.
          </p>
        </div>

        {/* دکمه برجسته ورود سریع تستی */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-600/20 to-purple-900/10 border border-purple-500/40 shadow-2xl space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold font-mono">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>مخصوص تست فوری در محیط توسعه</span>
          </div>
          <h3 className="font-extrabold text-sm text-white">
            ورود با یک کلیک (دسترسی سوپریوزر و ادمین)
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            تا زمان اتصال وب‌سرویس پیامکی کاوه‌نگار/ملی‌پیامک، با این دکمه فوراً لاگین شده و به تمام صفحات دسترسی خواهید داشت.
          </p>

          <button
            type="button"
            onClick={handleOneClickTestLogin}
            disabled={loggingIn}
            className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{loggingIn ? "در حال ورود به سیستم..." : "ورود سریع تستی با ۱ کلیک"}</span>
          </button>
        </div>
      </div>
    </Page>
  );
}
```

---

## ۳. آشکارسازی مسیرها و ناوبری پنل ادمین (`/admin`)

### ریشه‌یابی نقص:
هیچ لینکی در ظاهر سایت برای رفتن به `/admin` وجود نداشت.

### اضافه شدن پیوند مستقیم در منوی کاربری هدر (`Header.tsx`):
هنگامی که کاربر روی آواتار خود در هدر کلیک می‌کند، منوی دراپ‌داون باز شده و گزینه مدیریت با استایل متمایز طلایی/بنفش نمایش می‌یابد:

```tsx
<div className="py-1 border-b border-white/10">
  <Link
    href="/admin"
    className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
  >
    <ShieldCheck className="w-4 h-4 text-amber-400" />
    <span>پنل مدیریت سامانه (Admin Console)</span>
  </Link>
</div>
```

همچنین در فوتر سایت (`IntlFooter.tsx`)، لینکی در ستون «لینک‌های سریع» به پنل مدیریت اضافه می‌گردد.

</div>
