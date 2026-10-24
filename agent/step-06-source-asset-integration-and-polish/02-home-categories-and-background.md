<div dir="rtl" lang="fa">

# سند دسته‌بندی‌های ۱۷گانه و اتمسفر صفحه اصلی (02 - Home Categories & Background)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/02-home-categories-and-background.md`

---

## ۱. ریشه‌یابی و تطبیق دسته‌بندی‌های صفحه اصلی

### ریشه‌یابی نقص:
در صفحه اصلی فعلی، بخش دسته‌بندی‌ها به چند دکمه خلاصه شده بود (اکشن، ماجراجویی، شوتر، نقش‌آفرینی)، در حالی که در سورس مرجع پروژه (`sources/GameDr-Website-Source/website/data/category-labels.json`)، ۱۷ دسته‌بندی غنی و تفکیک‌شده به همراه نام‌های فارسی و انگلیسی تعریف شده‌اند.

### جدول مرجع ۱۷ دسته‌بندی رسمی:

| شناسه (Slug) | عنوان فارسی | عنوان انگلیسی | آیکون پیشنهادی Lucide |
| :--- | :--- | :--- | :--- |
| `action-adventure` | **اکشن-ماجراجویی** | Action-Adventure | `Sword` |
| `fighting` | **مبارزه‌ای** | Fighting | `Shield` |
| `horror` | **ترسناک** | Horror | `Ghost` |
| `indie` | **ایندی** | Indie & Roguelike | `Sparkles` |
| `party-rhythm` | **مهمانی و موزیکال** | Party & Rhythm | `Music` |
| `platformer-puzzle` | **پلتفرمر و پازل** | Platformer & Puzzle | `Puzzle` |
| `rpg` | **نقش‌آفرینی** | RPG | `Compass` |
| `shooter` | **شوتر** | Shooter | `Crosshair` |
| `sports-racing` | **ورزشی و مسابقه‌ای** | Sports & Racing | `Trophy` |
| `strategy-simulation` | **استراتژی و شبیه‌سازی** | Strategy & Simulation | `Cpu` |
| `survival-open-world` | **بقا و دنیای باز** | Survival & Open-World | `Globe` |
| `most-famous` | **معروف‌ترین‌ها** | Most Famous | `Flame` |
| `lately-released` | **تازه‌ترین‌ها** | Latest Games | `Clock` |
| `your-taste` | **سلیقه شما** | Your Taste | `Heart` |
| `best-sellers` | **پرفروش‌ترین‌ها** | Best Sellers | `TrendingUp` |
| `2-player` | **بازی‌های دو نفره** | 2 Player Games | `Users` |
| `vr-supported` | **بازی‌های واقعیت مجازی (VR)** | VR Supported Games | `Glasses` |

---

## ۲. پیاده‌سازی کامپوننت دسته‌بندی‌ها در صفحه اصلی

### ساختار کامپوننت `HomeCategoriesGrid.tsx`:
این کامپوننت به صورت یک گرید مدرن واکنش‌گرا و اسکرول افقی نرم روی موبایل طراحی می‌شود:

```tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Sword,
  Shield,
  Ghost,
  Sparkles,
  Music,
  Puzzle,
  Compass,
  Crosshair,
  Trophy,
  Cpu,
  Globe,
  Flame,
  Clock,
  Heart,
  TrendingUp,
  Users,
  Glasses,
} from "lucide-react";
import { useApp } from "@/lib/app";

export const CATEGORIES_DATA = [
  { id: "action-adventure", fa: "اکشن-ماجراجویی", en: "Action-Adventure", icon: Sword, count: 84 },
  { id: "fighting", fa: "مبارزه‌ای", en: "Fighting", icon: Shield, count: 28 },
  { id: "horror", fa: "ترسناک", en: "Horror", icon: Ghost, count: 32 },
  { id: "indie", fa: "ایندی", en: "Indie & Roguelike", icon: Sparkles, count: 45 },
  { id: "party-rhythm", fa: "مهمانی و موزیکال", en: "Party & Rhythm", icon: Music, count: 18 },
  { id: "platformer-puzzle", fa: "پلتفرمر و پازل", en: "Platformer & Puzzle", icon: Puzzle, count: 39 },
  { id: "rpg", fa: "نقش‌آفرینی", en: "RPG", icon: Compass, count: 62 },
  { id: "shooter", fa: "شوتر", en: "Shooter", icon: Crosshair, count: 51 },
  { id: "sports-racing", fa: "ورزشی و مسابقه‌ای", en: "Sports & Racing", icon: Trophy, count: 42 },
  { id: "strategy-simulation", fa: "استراتژی و شبیه‌سازی", en: "Strategy & Simulation", icon: Cpu, count: 24 },
  { id: "survival-open-world", fa: "بقا و دنیای باز", en: "Survival & Open-World", icon: Globe, count: 56 },
  { id: "most-famous", fa: "معروف‌ترین‌ها", en: "Most Famous", icon: Flame, count: 70 },
  { id: "lately-released", fa: "تازه‌ترین‌ها", en: "Latest Games", icon: Clock, count: 30 },
  { id: "your-taste", fa: "سلیقه شما", en: "Your Taste", icon: Heart, count: 40 },
  { id: "best-sellers", fa: "پرفروش‌ترین‌ها", en: "Best Sellers", icon: TrendingUp, count: 65 },
  { id: "2-player", fa: "بازی‌های دو نفره", en: "2 Player Games", icon: Users, count: 34 },
  { id: "vr-supported", fa: "بازی‌های VR", en: "VR Supported Games", icon: Glasses, count: 22 },
];

export const HomeCategoriesGrid: React.FC = () => {
  const { t, n } = useApp();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <span>{t("دسته‌بندی جامع بازی‌ها", "Game Categories")}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono">
              {CATEGORIES_DATA.length} {t("ژانر", "genres")}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "بر اساس سلیقه و سبک گیم‌پلی مورد علاقه خود، آرشیو دیتای بازی‌ها را جستجو نمایید.",
              "Browse console titles filtered by your favorite genre and gameplay style."
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {CATEGORIES_DATA.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              href={`/shop?genre=${encodeURIComponent(cat.fa)}`}
              className="group p-3.5 rounded-2xl bg-[#101116] border border-white/[0.08] hover:border-purple-500/50 hover:bg-[#181920] hover:shadow-[0_0_20px_rgba(124,58,237,0.25)] transition-all flex flex-col justify-between h-28 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {n(cat.count)} {t("بازی", "titles")}
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xs text-white block group-hover:text-purple-300 transition-colors">
                  {t(cat.fa, cat.en)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
```

---

## ۳. اتصال دوسویه به فیلترهای فروشگاه (`/shop`)

هنگامی که کاربر روی هر یک از این ۱۷ دسته‌بندی کلیک می‌کند، به صفحه `/shop?genre=...` هدایت شده و هوک فیلتر در `ShopFiltersSidebar.tsx` به صورت خودکار چک‌باکس آن ژانر را فعال کرده و لیست کاتالوگ را فیلتر می‌کند.

</div>
