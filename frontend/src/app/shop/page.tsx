"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { ShopFiltersSidebar } from "@/components/ShopFiltersSidebar";
import { ShopRightSidebar } from "@/components/ShopRightSidebar";
import { GameCard } from "@/components/GameCard";
import { useApp } from "@/lib/app";
import { GAMES } from "@/lib/data";

export default function ShopPage() {
  const { t, n, lang } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating" | "size">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeChips, setActiveChips] = useState<string[]>(["پلی‌استیشن ۵", "اکشن ماجراجویی"]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter games based on search
  const filteredGames = GAMES.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.studio.toLowerCase().includes(q) ||
      g.genreFa.includes(q) ||
      g.genreEn.toLowerCase().includes(q)
    );
  });

  const removeChip = (chip: string) => {
    setActiveChips((prev) => prev.filter((c) => c !== chip));
  };

  return (
    <Page>
      {/* 
        Strict Fixed Physical Layout (games.jpg specification):
        The 3-column macro layout remains physically fixed:
        [Left: 280px Filters] [Center: 1fr Catalog] [Right: 300px Info Sidebar]
      */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8">
        {/* Mobile filter toggle bar */}
        <div className="lg:hidden flex items-center justify-between mb-4 p-3 rounded-xl bg-[#151722] border border-white/10">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 text-xs font-bold text-orange-400"
          >
            <Filter className="w-4 h-4" />
            <span>{t("مشاهده فیلترهای پیشرفته", "View Advanced Filters")}</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            {n(filteredGames.length)} {t("بازی", "games")}
          </span>
        </div>

        {/* 3-Column Physical Container */}
        <div
          dir="ltr"
          className="flex flex-col lg:flex-row items-start gap-6 w-full"
        >
          {/* Column 1 (Left Physical - 280px): Advanced Filters */}
          <div
            dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
            className={`${
              mobileFilterOpen ? "block" : "hidden"
            } lg:block w-full lg:w-[280px] shrink-0`}
          >
            <ShopFiltersSidebar totalResults={filteredGames.length} />
          </div>

          {/* Column 2 (Center Physical - 1fr): Main Catalog Grid */}
          <main
            dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
            className="flex-1 min-w-0 w-full space-y-6"
          >
            {/* Toolbar: Live Search & Sort & View Mode */}
            <div className="bg-[#151722] border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t(
                      "جستجوی لحظه‌ای در عناوین، استودیوها و ژانرها...",
                      "Search titles, studios, genres..."
                    )}
                    className="w-full h-11 bg-[#0f1016] border border-white/10 rounded-xl ps-10 pe-4 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
                </div>

                {/* Right controls: Sort Dropdown & View Mode */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1.5 bg-[#0f1016] border border-white/10 rounded-xl px-3 py-2 text-xs">
                    <span className="text-slate-400">{t("مرتب‌سازی:", "Sort by:")}</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="popular" className="bg-[#151722]">{t("پربازدیدترین", "Most Popular")}</option>
                      <option value="newest" className="bg-[#151722]">{t("جدیدترین", "Newest")}</option>
                      <option value="rating" className="bg-[#151722]">{t("بالاترین امتیاز", "Top Rated")}</option>
                      <option value="size" className="bg-[#151722]">{t("کمترین حجم", "Smallest Size")}</option>
                    </select>
                  </div>

                  <div className="flex items-center rounded-xl bg-[#0f1016] border border-white/10 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                  <span className="text-xs text-slate-400">{t("فیلترهای فعال:", "Active:")}</span>
                  {activeChips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-medium"
                    >
                      <span>{chip}</span>
                      <button
                        type="button"
                        onClick={() => removeChip(chip)}
                        className="hover:text-white"
                        aria-label="Remove filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveChips([])}
                    className="text-xs text-red-400 hover:text-red-300 ms-1 transition-colors"
                  >
                    {t("پاک کردن همه", "Clear All")}
                  </button>
                </div>
              )}
            </div>

            {/* 3-Card Grid Catalog (games.jpg specification) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredGames.map((game) => (
                <GameCard key={game.slug} game={game} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#151722] text-xs font-bold text-slate-300 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t("صفحه قبلی", "Previous")}
              </button>

              {[1, 2, 3, 4, 5].map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all ${
                    currentPage === pageNum
                      ? "bg-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "bg-[#151722] border border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  {n(pageNum)}
                </button>
              ))}

              <span className="text-slate-500 px-1 font-mono">...</span>

              <button
                type="button"
                onClick={() => setCurrentPage(12)}
                className="w-9 h-9 rounded-xl bg-[#151722] border border-white/10 text-slate-400 hover:text-white text-xs font-bold font-mono"
              >
                {n(12)}
              </button>

              <button
                type="button"
                disabled={currentPage === 12}
                onClick={() => setCurrentPage((p) => Math.min(12, p + 1))}
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#151722] text-xs font-bold text-slate-300 hover:text-white hover:border-orange-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                {t("صفحه بعدی", "Next")}
              </button>
            </div>
          </main>

          {/* Column 3 (Right Physical - 300px): Info Sidebar */}
          <div
            dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
            className="w-full lg:w-[300px] shrink-0"
          >
            <ShopRightSidebar />
          </div>
        </div>
      </div>
    </Page>
  );
}
