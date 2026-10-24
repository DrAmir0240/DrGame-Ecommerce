<div dir="rtl" lang="fa">

# سند اسکرپر دیتابیس کاتالوگ و سوییچرهای تستی کنسول و فوتر (08 - Scraper, Seeder & Testing Switchers)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/08-catalog-scraper-and-console-tester.md`

---

## ۱. سیدینگ کاتالوگ ۳۳۳ بازی مرجع سورس به دیتابیس لوکال

### ریشه‌یابی نقص:
در دیتابیس فعلی صرفاً ۴ بازی نمونه هاردکد شده بود، در حالی که در سورس مرجع پروژه (`sources/GameDr-Website-Source/website/data/`):
- `games.json`: شامل ۳۳۳ بازی کامل به همراه حجم گیگابایت، سال انتشار، امتیاز متاکریتیک و ژانر
- `descriptions.json`: توضیحات مفصل فارسی و انگلیسی تمام عناوین
- `screenshots.json`: تصاویر اسکرین‌شات گیم‌پلی تمام عناوین

### پیاده‌سازی اسکریپت سیدر (`backend/app/modules/games/seeder.py`):
```python
import json
import asyncio
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.modules.games.models import Game, GameFile

async def seed_from_source_data():
    base_dir = Path(__file__).resolve().parents[4] / "sources" / "GameDr-Website-Source" / "website" / "data"
    games_file = base_dir / "games.json"
    desc_file = base_dir / "descriptions.json"
    screen_file = base_dir / "screenshots.json"

    if not games_file.exists():
        print(f"File not found: {games_file}")
        return

    with open(games_file, "r", encoding="utf-8") as f:
        games_list = json.load(f)

    with open(desc_file, "r", encoding="utf-8") as f:
        descriptions = json.load(f)

    with open(screen_file, "r", encoding="utf-8") as f:
        screenshots = json.load(f)

    async with AsyncSessionLocal() as db:
        count = 0
        for item in games_list:
            slug = item.get("slug")
            # Description fallback
            desc_info = descriptions.get(slug, {})
            desc_fa = desc_info.get("description_fa") or desc_info.get("description") or ""

            # Screenshots list
            shots = screenshots.get(slug, [])

            game = Game(
                slug=slug,
                title=item.get("title", slug),
                studio=item.get("studio", "PlayStation Studios"),
                genre_fa=item.get("genre_fa", "اکشن"),
                genre_en=item.get("genre_en", "Action"),
                platforms=item.get("platforms", ["PS4", "PS5"]),
                size_gb=float(item.get("size_gb", 45.0)),
                metacritic=int(item.get("metacritic", 85)),
                year=int(item.get("year", 2022)),
                image=item.get("image", "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg"),
                backdrop=shots[0] if shots else None,
                description=desc_fa,
                is_featured=item.get("is_featured", False),
                status="published",
            )
            db.add(game)
            await db.flush()

            # Generate Standard FPKG Download Parts
            total_size = game.size_gb
            num_parts = max(1, int(total_size // 15) + 1)
            part_size = round(total_size / num_parts, 2)

            for p in range(1, num_parts + 1):
                part = GameFile(
                    game_id=game.id,
                    part_name=f"پارت {p} دیتای FPKG کنسول ({part_size} GB)",
                    part_number=p,
                    size_gb=part_size,
                    sha256=f"hash_{slug}_part_{p}",
                    download_url=f"https://cdn.drgame.ir/dl/{slug}/part{p}.pkg",
                )
                db.add(part)

            count += 1

        await db.commit()
        print(f"Successfully seeded {count} games with download files from source data!")

if __name__ == "__main__":
    asyncio.run(seed_from_source_data())
```

---

## ۲. موتور اسکرپر کاتالوگ برای رسیدن به بیش از ۱۰۰۰ بازی (`scraper.py`)

جهت گسترش آرشیو بازی‌ها از ۳۳۳ به بیش از ۱۰۰۰ عنوان:
۱. اسکریپت ناهمگام با استفاده از کتابخانه `httpx` و تجمیع داده‌های سورس و API به صورت چندصفحه‌ای (`page=1` تا `page=25` با هر صفحه ۴۰ بازی).
۲. استخراج خودکار اسکرین‌شات‌ها، امتیاز متاکریتیک، پلتفرم‌های کنسول و تقسیم هوشمند حجم به پارت‌های استاندارد ۱۰ الی ۱۵ گیگابایتی FPKG.
۳. دستور خط فرمان اجرا:
```bash
docker compose -f docker-compose.dev.yml run --rm backend python -m app.modules.games.scraper --target 1000
```

---

## ۳. نوار ابزار تست حالت کنسول و فوتر (Dev Toolbar)

### ریشه‌یابی نقص:
توسعه‌دهنده و کارفرما ابزار سریعی برای سوئیچ بین حالت وب معمولی و حالت ۱۰ فوتی کنسول (`/tv` و استایل‌های گیم‌پد)، و همچنین بررسی فوترهای مختلف سایت در هدر نداشتند.

### پیاده‌سازی نوار ابزار تستی در هدر یا گوشه پایین صفحه (`DevModeToolbar.tsx`):
```tsx
"use client";

import React, { useState } from "react";
import { Tv, LayoutTemplate, ShieldCheck, Zap, X } from "lucide-react";
import { usePlayStationMode } from "@/components/PlayStationModeProvider";

export const DevModeToolbar: React.FC = () => {
  const { isPSMode, togglePSMode } = usePlayStationMode();
  const [footerMode, setFooterMode] = useState<"mega" | "minimal" | "console">("mega");
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 start-4 z-50 p-2.5 rounded-full bg-purple-600 text-white shadow-xl hover:scale-110 transition-transform"
        title="نوار ابزار تست توسعه (Dev Toolbar)"
      >
        <Zap className="w-4 h-4 fill-white" />
      </button>
    );
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 start-4 z-50 p-2.5 rounded-2xl bg-[#101116]/95 border border-purple-500/40 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs"
    >
      <div className="flex items-center gap-1.5 pe-2 border-e border-white/10 text-purple-300 font-bold">
        <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        <span>ابزار تست:</span>
      </div>

      {/* ۱. دکمه سوییچ حالت کنسول / تلویزیون */}
      <button
        type="button"
        onClick={togglePSMode}
        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
          isPSMode
            ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
            : "bg-white/5 hover:bg-white/10 text-slate-300"
        }`}
      >
        <Tv className="w-3.5 h-3.5" />
        <span>حالت کنسول ({isPSMode ? "فعال" : "عادی"})</span>
      </button>

      {/* ۲. دکمه تست حالت‌های مختلف فوتر */}
      <button
        type="button"
        onClick={() => {
          const modes: ("mega" | "minimal" | "console")[] = ["mega", "minimal", "console"];
          const next = modes[(modes.indexOf(footerMode) + 1) % modes.length];
          setFooterMode(next);
          localStorage.setItem("drgame_footer_variant", next);
          window.dispatchEvent(new Event("drgame_footer_changed"));
        }}
        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold flex items-center gap-1.5 border border-white/10 transition-all"
      >
        <LayoutTemplate className="w-3.5 h-3.5" />
        <span>تغییر فوتر ({footerMode})</span>
      </button>

      {/* ۳. دکمه میانبر پنل ادمین */}
      <a
        href="/admin"
        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 transition-all"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>ادمین</span>
      </a>

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="p-1 rounded-lg text-slate-400 hover:text-white"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
```

</div>
