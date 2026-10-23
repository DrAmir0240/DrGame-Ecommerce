"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Search, Check, ChevronDown } from "lucide-react";
import { useApp } from "@/lib/app";
import { PlayStationGlyph } from "./PlayStationGlyph";

interface ShopFiltersSidebarProps {
  totalResults?: number;
  onFilterChange?: (filters: any) => void;
}

export const ShopFiltersSidebar: React.FC<ShopFiltersSidebarProps> = ({
  totalResults = 324,
  onFilterChange,
}) => {
  const { t, n } = useApp();

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["PS5", "PS4"]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(["اکشن"]);
  const [selectedMode, setSelectedMode] = useState<string>("تک‌نفره");
  const [selectedStatus, setSelectedStatus] = useState<string>("منتشر شده");
  const [minScore, setMinScore] = useState<number>(7.5);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const genres = [
    { id: "اکشن", labelFa: "اکشن", labelEn: "Action" },
    { id: "ماجراجویی", labelFa: "ماجراجویی", labelEn: "Adventure" },
    { id: "نقش‌آفرینی", labelFa: "نقش‌آفرینی", labelEn: "RPG" },
    { id: "شوتر", labelFa: "شوتر", labelEn: "Shooter" },
    { id: "استراتژی", labelFa: "استراتژی", labelEn: "Strategy" },
    { id: "ورزشی", labelFa: "ورزشی", labelEn: "Sports" },
    { id: "مسابقه‌ای", labelFa: "مسابقه‌ای", labelEn: "Racing" },
    { id: "ترسناک", labelFa: "ترسناک", labelEn: "Horror" },
    { id: "معمایی", labelFa: "معمایی", labelEn: "Puzzle" },
  ];

  const modes = [
    { id: "تک‌نفره", labelFa: "تک‌نفره", labelEn: "Single Player" },
    { id: "چندنفره آنلاین", labelFa: "چندنفره آنلاین", labelEn: "Online MP" },
    { id: "محلی", labelFa: "محلی", labelEn: "Local Co-op" },
    { id: "همکاری", labelFa: "همکاری", labelEn: "Co-op" },
  ];

  const statuses = [
    { id: "منتشر شده", labelFa: "منتشر شده", labelEn: "Released" },
    { id: "دسترسی زودهنگام", labelFa: "دسترسی زودهنگام", labelEn: "Early Access" },
    { id: "در راه انتشار", labelFa: "در راه انتشار", labelEn: "Upcoming" },
  ];

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-[#151722] border border-white/[0.08] rounded-2xl p-5 space-y-6 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-orange-500" />
          <h3 className="font-extrabold text-sm text-white">
            {t("فیلترهای پیشرفته", "Advanced Filters")}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedPlatforms(["PS5"]);
            setSelectedGenres([]);
            setMinScore(0);
          }}
          className="text-[11px] text-slate-400 hover:text-orange-400 transition-colors"
        >
          {t("پاکسازی", "Reset")}
        </button>
      </div>

      {/* 1. Platforms (4 square buttons as in games.jpg) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("پلتفرم‌ها", "Platforms")}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "PS5", label: "PS5", icon: "triangle" },
            { id: "PS4", label: "PS4", icon: "circle" },
            { id: "Xbox", label: "Xbox", icon: "cross" },
            { id: "PC", label: "PC", icon: "square" },
          ].map((item) => {
            const active = selectedPlatforms.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePlatform(item.id)}
                className={`h-12 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  active
                    ? "bg-orange-500/20 border-orange-500 text-orange-300 shadow-sm"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <PlayStationGlyph type={item.icon as any} className="w-3.5 h-3.5" />
                <span className="text-[10px] font-extrabold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Genres (Pill buttons in 2 columns) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("ژانرها", "Genres")}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {genres.map((g) => {
            const active = selectedGenres.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-center truncate ${
                  active
                    ? "bg-orange-600 text-white font-bold shadow-sm"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t(g.labelFa, g.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Game Mode (2x2 grid) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("حالت بازی", "Game Mode")}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {modes.map((m) => {
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMode(m.id)}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-center truncate ${
                  active
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {t(m.labelFa, m.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Release Status */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("وضعیت انتشار", "Release Status")}
        </label>
        <div className="flex flex-col gap-1.5">
          {statuses.map((s) => {
            const active = selectedStatus === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStatus(s.id)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  active
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <span>{t(s.labelFa, s.labelEn)}</span>
                {active && <Check className="w-3.5 h-3.5 text-orange-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Score Range Slider (0 to 10 with cyan track) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-300">{t("محدوده امتیاز", "Rating Range")}</label>
          <span className="font-mono font-bold text-cyan-400">
            {minScore.toFixed(1)} / 10
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={minScore}
          onChange={(e) => setMinScore(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-[#0f1016] rounded-lg appearance-none cursor-pointer accent-[#06b6d4]"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>۰</span>
          <span>۵</span>
          <span>۱۰</span>
        </div>
      </div>

      {/* 6. Bottom Neon Orange CTA Button */}
      <button
        type="button"
        className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
      >
        <Search className="w-4 h-4" />
        <span>
          {t(`نمایش ${n(totalResults)} بازی`, `Show ${totalResults} Games`)}
        </span>
      </button>
    </aside>
  );
};

export default ShopFiltersSidebar;
