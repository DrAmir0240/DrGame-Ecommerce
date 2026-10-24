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
  { id: "lately-released", fa: "تازه‌ترین ها", en: "Latest games", icon: Clock, count: 30 },
  { id: "your-taste", fa: "سلیقه شما", en: "Your taste", icon: Heart, count: 40 },
  { id: "best-sellers", fa: "پرفروش‌ترین‌ها", en: "Best Sellers", icon: TrendingUp, count: 65 },
  { id: "2-player", fa: "بازی‌های دو نفره", en: "2 Player Games", icon: Users, count: 34 },
  { id: "vr-supported", fa: "بازی های VR", en: "VR Supported Games", icon: Glasses, count: 22 },
];

export const HomeCategoriesGrid: React.FC = () => {
  const { t, n } = useApp();

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
            <span>{t("دسته‌بندی جامع بازی‌ها", "Game Categories")}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
              {CATEGORIES_DATA.length} {t("ژانر", "genres")}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              "بر اساس سلیقه و سبک گیم‌پلی مورد علاقه خود، آرشیو دیتای بازی‌های کنسول را جستجو نمایید.",
              "Browse console titles filtered by your favorite genre and gameplay style."
            )}
          </p>
        </div>

        <Link
          href="/shop"
          className="text-xs text-purple-400 hover:text-purple-300 font-bold self-start sm:self-auto flex items-center gap-1"
        >
          <span>{t("مشاهده همه در فروشگاه", "View all in store")}</span>
          <span className="rtl:rotate-180">→</span>
        </Link>
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

export default HomeCategoriesGrid;
