"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Search, Check, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/app";

export interface FilterState {
  platforms: string[];
  genres: string[];
  mode: string;
  status: string;
  minScore: number;
  maxScore: number;
}

interface ShopFiltersSidebarProps {
  totalResults?: number;
  initialFilters?: Partial<FilterState>;
  onFilterChange?: (filters: FilterState) => void;
}

export const ShopFiltersSidebar: React.FC<ShopFiltersSidebarProps> = ({
  totalResults = 333,
  initialFilters,
  onFilterChange,
}) => {
  const { t, n } = useApp();

  // DEFAULT CLEAN STATE: NO DEFAULT FILTERS
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialFilters?.platforms || []
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialFilters?.genres || []
  );
  const [selectedMode, setSelectedMode] = useState<string>(
    initialFilters?.mode || ""
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    initialFilters?.status || ""
  );
  const [minScore, setMinScore] = useState<number>(initialFilters?.minScore ?? 0);
  const [maxScore, setMaxScore] = useState<number>(initialFilters?.maxScore ?? 100);

  // Notify parent on filter change
  const notifyChange = (
    p: string[],
    g: string[],
    m: string,
    s: string,
    minSc: number,
    maxSc: number
  ) => {
    if (onFilterChange) {
      onFilterChange({
        platforms: p,
        genres: g,
        mode: m,
        status: s,
        minScore: minSc,
        maxScore: maxSc,
      });
    }
  };

  const togglePlatform = (p: string) => {
    const updated = selectedPlatforms.includes(p)
      ? selectedPlatforms.filter((item) => item !== p)
      : [...selectedPlatforms, p];
    setSelectedPlatforms(updated);
    notifyChange(updated, selectedGenres, selectedMode, selectedStatus, minScore, maxScore);
  };

  const toggleGenre = (g: string) => {
    const updated = selectedGenres.includes(g)
      ? selectedGenres.filter((item) => item !== g)
      : [...selectedGenres, g];
    setSelectedGenres(updated);
    notifyChange(selectedPlatforms, updated, selectedMode, selectedStatus, minScore, maxScore);
  };

  const handleModeChange = (m: string) => {
    const nextMode = selectedMode === m ? "" : m;
    setSelectedMode(nextMode);
    notifyChange(selectedPlatforms, selectedGenres, nextMode, selectedStatus, minScore, maxScore);
  };

  const handleStatusChange = (s: string) => {
    const nextStatus = selectedStatus === s ? "" : s;
    setSelectedStatus(nextStatus);
    notifyChange(selectedPlatforms, selectedGenres, selectedMode, nextStatus, minScore, maxScore);
  };

  const handleScoreChange = (min: number, max: number) => {
    setMinScore(min);
    setMaxScore(max);
    notifyChange(selectedPlatforms, selectedGenres, selectedMode, selectedStatus, min, max);
  };

  const handleReset = () => {
    setSelectedPlatforms([]);
    setSelectedGenres([]);
    setSelectedMode("");
    setSelectedStatus("");
    setMinScore(0);
    setMaxScore(100);
    notifyChange([], [], "", "", 0, 100);
  };

  const platformsList = [
    { id: "PS5", label: "PS5", icon: "/assets/platforms/ps5.svg" },
    { id: "PS4", label: "PS4", icon: "/assets/platforms/ps4.svg" },
    { id: "Xbox", label: "Xbox", icon: "/assets/platforms/xbox360.svg" },
    { id: "Switch", label: "Switch", icon: "/assets/platforms/switch.svg" },
  ];

  const genres = [
    { id: "اکشن", labelFa: "اکشن", labelEn: "Action" },
    { id: "ماجراجویی", labelFa: "ماجراجویی", labelEn: "Adventure" },
    { id: "نقش‌آفرینی", labelFa: "نقش‌آفرینی", labelEn: "RPG" },
    { id: "شوتر", labelFa: "شوتر", labelEn: "Shooter" },
    { id: "استراتژی", labelFa: "استراتژی", labelEn: "Strategy" },
    { id: "ورزشی", labelFa: "ورزشی", labelEn: "Sports" },
    { id: "مسابقه‌ای", labelFa: "مسابقه‌ای", labelEn: "Racing" },
    { id: "ترسناک", labelFa: "ترسناک", labelEn: "Horror" },
    { id: "مبارزه‌ای", labelFa: "مبارزه‌ای", labelEn: "Fighting" },
    { id: "جهان‌باز", labelFa: "جهان‌باز", labelEn: "Open World" },
  ];

  // Physical Controller Couch Modes (Couch 2-Controllers & 4-Controllers)
  const controllerModes = [
    { id: "2-players", labelFa: "۲ نفره (۲ دسته)", labelEn: "2 Players (2 Controllers)" },
    { id: "4-players", labelFa: "۴ نفره (۴ دسته)", labelEn: "4 Players (4 Controllers)" },
    { id: "single", labelFa: "تک‌نفره (۱ دسته)", labelEn: "Single Player" },
  ];

  const statuses = [
    { id: "منتشر شده", labelFa: "منتشر شده", labelEn: "Released" },
    { id: "دسترسی زودهنگام", labelFa: "دسترسی زودهنگام", labelEn: "Early Access" },
  ];

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-[#151722]/95 border border-white/10 rounded-2xl p-5 space-y-6 shadow-xl backdrop-blur-md">
      {/* Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" />
          <h3 className="font-extrabold text-sm text-white">
            {t("فیلترهای پیشرفته", "Advanced Filters")}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-purple-300 transition-colors"
          title="پاکسازی تمام فیلترها"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t("پاکسازی", "Reset")}</span>
        </button>
      </div>

      {/* 1. Platforms (Console SVG Logos: PS5, PS4, Xbox, Switch) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("پلتفرم کنسول", "Console Platform")}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {platformsList.map((item) => {
            const active = selectedPlatforms.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePlatform(item.id)}
                className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all p-1.5 ${
                  active
                    ? "bg-purple-600/30 border-purple-500 text-purple-200 shadow-md shadow-purple-500/25"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
                title={item.label}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-5 h-5 object-contain filter invert opacity-80 group-hover:opacity-100"
                />
                <span className="text-[10px] font-black">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Physical Controller Count Filter (2 دسته / ۴ دسته) */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("تعداد دسته‌های بازی (چندنفره)", "Controllers Count")}
        </label>
        <div className="flex flex-col gap-1.5">
          {controllerModes.map((m) => {
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                  active
                    ? "bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30"
                    : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <span>{t(m.labelFa, m.labelEn)}</span>
                {active && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Genres */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("ژانر و دسته‌بندی", "Genres")}
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {genres.map((g) => {
            const active = selectedGenres.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGenre(g.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-center truncate ${
                  active
                    ? "bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/30"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t(g.labelFa, g.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Score Range (Dual Parameter: Min Score & Max Score) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-300">
            {t("محدوده امتیاز (متاکریتیک)", "Metacritic Score Range")}
          </label>
          <span className="font-mono font-bold text-purple-400">
            {n(minScore)} - {n(maxScore)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block">{t("حداقل نمره", "Min Score")}</span>
            <input
              type="number"
              min="0"
              max={maxScore}
              value={minScore}
              onChange={(e) => handleScoreChange(Math.max(0, Math.min(maxScore, Number(e.target.value))), maxScore)}
              className="w-full bg-[#101116] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block">{t("حداکثر نمره", "Max Score")}</span>
            <input
              type="number"
              min={minScore}
              max="100"
              value={maxScore}
              onChange={(e) => handleScoreChange(minScore, Math.min(100, Math.max(minScore, Number(e.target.value))))}
              className="w-full bg-[#101116] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={minScore}
          onChange={(e) => handleScoreChange(Number(e.target.value), maxScore)}
          className="w-full h-1.5 bg-[#101116] rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
        />
      </div>

      {/* 5. Release Status */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 block">
          {t("وضعیت بازی", "Release Status")}
        </label>
        <div className="flex flex-col gap-1.5">
          {statuses.map((s) => {
            const active = selectedStatus === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStatusChange(s.id)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  active
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                <span>{t(s.labelFa, s.labelEn)}</span>
                {active && <Check className="w-3.5 h-3.5 text-purple-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply Button */}
      <button
        type="button"
        onClick={() => notifyChange(selectedPlatforms, selectedGenres, selectedMode, selectedStatus, minScore, maxScore)}
        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
      >
        <Search className="w-3.5 h-3.5" />
        <span>
          {t(`نمایش (${n(totalResults)}) بازی`, `Show (${totalResults}) Games`)}
        </span>
      </button>
    </aside>
  );
};

export default ShopFiltersSidebar;
