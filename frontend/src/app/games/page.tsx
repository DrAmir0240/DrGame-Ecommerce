"use client";

import { useState } from "react";
import { Filter, Gamepad2, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Page } from "@/components/Shell";
import { GameTile } from "@/components/GameTile";
import { SectionTitle, Pill } from "@/components/ui";
import { useApp } from "@/lib/app";
import { GAMES, type Game } from "@/lib/data";

export default function StoreCatalogPage() {
  const { t, n } = useApp();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");
  const [selectedOwnership, setSelectedOwnership] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"metacritic" | "year" | "size">("metacritic");
  const [search, setSearch] = useState("");

  const genres = [
    { id: "ALL", fa: "همه ژانرها", en: "All Genres" },
    { id: "Action-Adventure", fa: "اکشن ماجراجویی", en: "Action-Adventure" },
    { id: "Action RPG", fa: "نقش‌آفرینی اکشن", en: "Action RPG" },
    { id: "RPG", fa: "نقش‌آفرینی", en: "RPG" },
    { id: "Open World", fa: "جهان باز", en: "Open World" },
    { id: "Sports", fa: "ورزشی", en: "Sports" },
    { id: "Shooter", fa: "شوتر", en: "Shooter" },
    { id: "Narrative", fa: "داستانی", en: "Narrative" },
  ];

  const platforms = [
    { id: "ALL", label: "همه پلتفرم‌ها" },
    { id: "PS5", label: "PlayStation 5" },
    { id: "PS4", label: "PlayStation 4" },
  ];

  const filteredGames = GAMES.filter((g) => {
    if (selectedPlatform !== "ALL" && !g.platforms.includes(selectedPlatform as "PS5" | "PS4")) {
      return false;
    }
    if (selectedGenre !== "ALL" && g.genreEn !== selectedGenre) {
      return false;
    }
    if (selectedOwnership === "owned" && g.ownership !== "owned") {
      return false;
    }
    if (selectedOwnership === "free" && g.ownership !== "free") {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.studio.toLowerCase().includes(q) ||
        g.genreFa.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "metacritic") return b.metacritic - a.metacritic;
    if (sortBy === "year") return b.year - a.year;
    if (sortBy === "size") return b.sizeGb - a.sizeGb;
    return 0;
  });

  return (
    <Page>
      <div className="mx-auto max-w-[1440px] px-6 pt-8">
        
        {/* Storefront Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-8 border-b border-line">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-2 mb-1.5">
              <Gamepad2 size={16} />
              <span>{t("کاتالوگ کامل بازی‌های کنسول", "Complete Console Game Catalog")}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t("فروشگاه و آرشیو دیتای بازی‌ها", "Store & Game Data Archive")}
            </h1>
            <p className="mt-1 text-sm text-fg-2">
              {t(
                `نمایش ${n(filteredGames.length)} عنوان بازی تست‌شده با متادیتا و پارت‌های دانلود مستقیم`,
                `Showing ${filteredGames.length} verified titles with metadata and direct download chunks`,
              )}
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -mt-2 text-fg-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("فیلتر بر اساس نام بازی یا استودیو...", "Filter by game title or studio...")}
              className="h-10 w-full rounded-xl border border-line-strong bg-surface-2 ps-10 pe-4 text-xs text-fg placeholder:text-muted focus:border-accent-2 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          {/* Platforms Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                className={`h-9 px-3.5 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  selectedPlatform === p.id
                    ? "bg-accent text-on-accent shadow-glow-sm"
                    : "bg-surface-2 text-fg-2 hover:text-fg hover:bg-surface-3 border border-line"
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="h-5 w-px bg-line mx-2" />

            {/* Ownership Filter */}
            <button
              onClick={() => setSelectedOwnership("ALL")}
              className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
                selectedOwnership === "ALL" ? "bg-surface-3 text-fg" : "text-fg-2 hover:text-fg"
              }`}
            >
              {t("همه بازی‌ها", "All Games")}
            </button>
            <button
              onClick={() => setSelectedOwnership("owned")}
              className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
                selectedOwnership === "owned" ? "bg-success-soft text-success font-bold" : "text-fg-2 hover:text-fg"
              }`}
            >
              {t("در کتابخانه من (مالکیت تاییدشده)", "In My Library")}
            </button>
            <button
              onClick={() => setSelectedOwnership("free")}
              className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${
                selectedOwnership === "free" ? "bg-accent-soft text-accent-2 font-bold" : "text-fg-2 hover:text-fg"
              }`}
            >
              {t("عناوین رایگان", "Free to Play")}
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted flex items-center gap-1">
              <SlidersHorizontal size={14} />
              {t("مرتب‌سازی بر اساس:", "Sort by:")}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 rounded-lg border border-line bg-surface-2 px-3 text-xs text-fg focus:border-accent-2 focus:outline-none"
            >
              <option value="metacritic">{t("امتیاز متاکریتیک (بالاترین)", "Metacritic Score")}</option>
              <option value="year">{t("سال انتشار (جدیدترین)", "Release Year")}</option>
              <option value="size">{t("حجم بازی (سنگین‌ترین)", "File Size")}</option>
            </select>
          </div>
        </div>

        {/* Genre Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 text-xs">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGenre(g.id)}
              className={`rounded-full px-3 py-1 transition-colors whitespace-nowrap cursor-pointer ${
                selectedGenre === g.id
                  ? "bg-accent-2 text-white font-bold"
                  : "bg-surface text-fg-2 hover:text-fg border border-line"
              }`}
            >
              {t(g.fa, g.en)}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className="mt-6">
          {filteredGames.length === 0 ? (
            <div className="py-24 text-center rounded-card border border-line bg-surface">
              <p className="text-base font-semibold text-fg-2">
                {t("هیچ بازی‌ای مطابق فیلترهای انتخابی یافت نشد.", "No games match the selected filters.")}
              </p>
              <button
                onClick={() => {
                  setSelectedPlatform("ALL");
                  setSelectedGenre("ALL");
                  setSelectedOwnership("ALL");
                  setSearch("");
                }}
                className="mt-4 text-xs font-bold text-accent-2 hover:underline"
              >
                {t("بازنشانی فیلترها", "Reset filters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {filteredGames.map((g) => (
                <GameTile key={g.slug} g={g} />
              ))}
            </div>
          )}
        </div>

      </div>
    </Page>
  );
}
