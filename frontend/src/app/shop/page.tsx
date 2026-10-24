"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { ShopFiltersSidebar, type FilterState } from "@/components/ShopFiltersSidebar";
import { ShopRightSidebar } from "@/components/ShopRightSidebar";
import { GameCard } from "@/components/GameCard";
import { useApp } from "@/lib/app";
import { GAMES, type Game } from "@/lib/data";
import { api } from "@/lib/api";

const PAGE_SIZE = 16;

export default function ShopPage() {
  const { t, n, lang } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating" | "size">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // DEFAULT CLEAN STATE: NO DEFAULT FILTERS APPLIED INITIALLY
  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    genres: [],
    mode: "",
    status: "",
    minScore: 0,
    maxScore: 100,
  });

  const [games, setGames] = useState<Game[]>(GAMES);
  const [totalResults, setTotalResults] = useState<number>(GAMES.length);
  const [loading, setLoading] = useState(false);

  // Fetch games from backend API with fallback
  useEffect(() => {
    let isMounted = true;
    const fetchGames = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          platforms: filters.platforms.length > 0 ? filters.platforms.join(",") : undefined,
          genres: filters.genres.length > 0 ? filters.genres.join(",") : undefined,
          mode: filters.mode || undefined,
          status: filters.status || undefined,
          min_score: filters.minScore > 0 ? filters.minScore : undefined,
          search: searchQuery.trim() || undefined,
          sort: sortBy,
          page: currentPage,
          limit: PAGE_SIZE,
        };

        const res = await api.get("/api/v1/games", { params });
        if (isMounted && res.data && res.data.items) {
          const apiGames: Game[] = res.data.items.map((item: any) => ({
            slug: item.slug,
            title: item.title,
            studio: item.studio,
            genreFa: item.genre_fa,
            genreEn: item.genre_en,
            platforms: item.platforms || ["PS5"],
            sizeGb: item.size_gb,
            metacritic: item.metacritic,
            year: item.year,
            image: item.image,
            ownership: "not-owned",
          }));

          if (apiGames.length > 0) {
            setGames(apiGames);
            setTotalResults(res.data.total);
          } else {
            applyClientFilter();
          }
        }
      } catch (err) {
        if (isMounted) applyClientFilter();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const applyClientFilter = () => {
      let filtered = GAMES.filter((g) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            g.title.toLowerCase().includes(q) ||
            g.studio.toLowerCase().includes(q) ||
            g.genreFa.includes(q) ||
            g.genreEn.toLowerCase().includes(q);
          if (!match) return false;
        }

        if (filters.platforms.length > 0) {
          const platMatch = filters.platforms.some((p) => g.platforms.includes(p as any));
          if (!platMatch) return false;
        }

        if (filters.genres.length > 0) {
          const genreMatch = filters.genres.some(
            (gen) => g.genreFa.includes(gen) || g.genreEn.toLowerCase().includes(gen.toLowerCase())
          );
          if (!genreMatch) return false;
        }

        if (filters.minScore > 0 && g.metacritic < filters.minScore) {
          return false;
        }
        if (filters.maxScore < 100 && g.metacritic > filters.maxScore) {
          return false;
        }

        return true;
      });

      // Sort
      if (sortBy === "rating") {
        filtered.sort((a, b) => b.metacritic - a.metacritic);
      } else if (sortBy === "newest") {
        filtered.sort((a, b) => b.year - a.year);
      } else if (sortBy === "size") {
        filtered.sort((a, b) => a.sizeGb - b.sizeGb);
      }

      setTotalResults(filtered.length);
      const start = (currentPage - 1) * PAGE_SIZE;
      setGames(filtered.slice(start, start + PAGE_SIZE));
    };

    fetchGames();
    return () => {
      isMounted = false;
    };
  }, [filters, searchQuery, sortBy, currentPage]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const removeChip = (type: "platform" | "genre", val: string) => {
    if (type === "platform") {
      const updated = filters.platforms.filter((p) => p !== val);
      setFilters((prev) => ({ ...prev, platforms: updated }));
    } else {
      const updated = filters.genres.filter((g) => g !== val);
      setFilters((prev) => ({ ...prev, genres: updated }));
    }
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  // Generate pagination page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8">
        {/* Mobile filter toggle bar */}
        <div className="lg:hidden flex items-center justify-between mb-4 p-3 rounded-xl bg-[#101116] border border-white/10">
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 text-xs font-bold text-purple-400"
          >
            <Filter className="w-4 h-4" />
            <span>{t("مشاهده فیلترهای پیشرفته", "View Advanced Filters")}</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            {n(totalResults)} {t("بازی", "games")}
          </span>
        </div>

        {/* Shop Main Container: RTL places sidebar on right and catalog on left */}
        <div
          dir={lang === "fa" ? "rtl" : "ltr"}
          className="flex flex-col lg:flex-row items-start gap-6 w-full"
        >
          {/* Column 1: Advanced Filters Sidebar (Right on RTL) */}
          <div
            className={`${
              mobileFilterOpen ? "block" : "hidden"
            } lg:block w-full lg:w-[280px] shrink-0`}
          >
            <ShopFiltersSidebar
              totalResults={totalResults}
              initialFilters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Column 2 (Center Physical - 1fr): Main Catalog Grid */}
          <main
            dir={lang === "fa" ? "rtl" : "ltr"}
            className="flex-1 min-w-0 w-full space-y-6"
          >
            {/* Toolbar: Live Search & Sort & View Mode */}
            <div className="bg-[#101116] border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t(
                      "جستجوی لحظه‌ای در عناوین، استودیوها و ژانرها...",
                      "Search titles, studios, genres..."
                    )}
                    className="w-full h-11 bg-[#070709] border border-white/10 rounded-xl ps-10 pe-4 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
                </div>

                {/* Right controls: Sort Dropdown & View Mode */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1.5 bg-[#070709] border border-white/10 rounded-xl px-3 py-2 text-xs">
                    <span className="text-slate-400">{t("مرتب‌سازی:", "Sort by:")}</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="popular" className="bg-[#101116]">{t("پربازدیدترین", "Most Popular")}</option>
                      <option value="newest" className="bg-[#101116]">{t("جدیدترین", "Newest")}</option>
                      <option value="rating" className="bg-[#101116]">{t("بالاترین امتیاز", "Top Rated")}</option>
                      <option value="size" className="bg-[#101116]">{t("کمترین حجم", "Smallest Size")}</option>
                    </select>
                  </div>

                  <div className="flex items-center rounded-xl bg-[#070709] border border-white/10 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Chips */}
              {(filters.platforms.length > 0 || filters.genres.length > 0 || filters.mode) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5 text-xs">
                  <span className="text-slate-400 font-medium me-1">
                    {t("فیلترهای فعال:", "Active:")}
                  </span>
                  {filters.platforms.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-1.5"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => removeChip("platform", p)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {filters.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 flex items-center gap-1.5"
                    >
                      <span>{g}</span>
                      <button
                        type="button"
                        onClick={() => removeChip("genre", g)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {filters.mode && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5">
                      <span>{filters.mode === "2-players" ? "۲ نفره (۲ دسته)" : filters.mode === "4-players" ? "۴ نفره (۴ دسته)" : "تک‌نفره"}</span>
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, mode: "" }))}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Catalog Grid / List */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">{t("در حال بارگذاری کاتالوگ...", "Loading catalog...")}</p>
              </div>
            ) : games.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#101116] border border-white/10 space-y-3">
                <p className="text-slate-400 text-sm">
                  {t("هیچ بازی‌ای مطابق با این فیلترها یافت نشد.", "No games match your filters.")}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setFilters({
                      platforms: [],
                      genres: [],
                      mode: "",
                      status: "",
                      minScore: 0,
                      maxScore: 100,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  {t("پاکسازی فیلترها", "Reset Filters")}
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-3"
                }
              >
                {games.map((g) => (
                  <GameCard key={g.slug} game={g} />
                ))}
              </div>
            )}

            {/* REAL FUNCTIONAL PAGINATION BAR */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#101116] text-xs font-bold text-slate-300 hover:text-white hover:border-purple-500 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
                  <span>{t("صفحه قبلی", "Previous")}</span>
                </button>

                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-slate-500 font-mono">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${pageNum}`}
                      type="button"
                      onClick={() => handlePageChange(pageNum as number)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition-all ${
                        currentPage === pageNum
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                          : "bg-[#101116] border border-white/10 text-slate-400 hover:text-white hover:border-purple-500/50"
                      }`}
                    >
                      {n(pageNum as number)}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#101116] text-xs font-bold text-slate-300 hover:text-white hover:border-purple-500 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1"
                >
                  <span>{t("صفحه بعدی", "Next")}</span>
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
                </button>
              </div>
            )}
          </main>

          {/* Column 3 (Right Physical - 300px): Info Sidebar */}
          <div
            dir={lang === "fa" ? "rtl" : "ltr"}
            className="w-full lg:w-[300px] shrink-0"
          >
            <ShopRightSidebar />
          </div>
        </div>
      </div>
    </Page>
  );
}
