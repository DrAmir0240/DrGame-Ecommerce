'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { GameCardItem, Genre, PaginatedGames } from '@/types/game';
import GameCard from '@/components/games/GameCard';
import FilterSidebar, { FilterState } from '@/components/games/FilterSidebar';
import CircularQuotaWidget from '@/components/games/CircularQuotaWidget';
import { Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Gamepad2, Sparkles, Filter } from 'lucide-react';

function getPaginationRange(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Near the start
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  // Near the end
  if (currentPage >= totalPages - 3) {
    return [
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // In the middle
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

export default function GamesCatalogPage() {
  const [games, setGames] = useState<GameCardItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    genre: '',
    platform: '',
    max_size: 200,
    min_rating: 0,
    is_two_player: null,
    has_vr: false,
    release_status: '',
  });

  const activeFilterCount =
    (filters.genre ? 1 : 0) +
    (filters.platform ? 1 : 0) +
    (filters.max_size < 200 ? 1 : 0) +
    (filters.min_rating > 0 ? 1 : 0) +
    (filters.is_two_player !== null ? 1 : 0) +
    (filters.has_vr ? 1 : 0) +
    (filters.release_status ? 1 : 0);

  const fetchGenres = async () => {
    try {
      const data = await apiRequest<Genre[]>('/games/genres/list');
      setGenres(data);
    } catch (e) {
      console.error('Failed to fetch genres:', e);
    }
  };

  const fetchGames = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.genre) queryParams.set('genre', filters.genre);
      if (filters.platform) queryParams.set('platform', filters.platform);
      if (filters.max_size < 200) queryParams.set('max_size', String(filters.max_size));
      if (filters.min_rating > 0) queryParams.set('min_rating', String(filters.min_rating));
      if (filters.is_two_player !== null) queryParams.set('is_two_player', String(filters.is_two_player));
      if (filters.has_vr) queryParams.set('has_vr', 'true');
      if (filters.release_status) queryParams.set('release_status', filters.release_status);
      queryParams.set('page', String(page));
      queryParams.set('page_size', '20');

      const data = await apiRequest<PaginatedGames>(`/games?${queryParams.toString()}`);
      
      // If the current page is out of bounds (e.g. after filter change), jump to page 1
      if (data.total_pages > 0 && page > data.total_pages) {
        setPage(1);
        return;
      }

      setGames(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages || 1);
    } catch (e) {
      console.error('Failed to fetch games catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchGames();
  }, [filters, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      genre: '',
      platform: '',
      max_size: 200,
      min_rating: 0,
      is_two_player: null,
      has_vr: false,
      release_status: '',
    });
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-right font-vazir">
      {/* Layout Grid: In RTL, 1st child (Sidebar) is on the RIGHT, 2nd child (Content) is on the LEFT. Mirrored in LTR */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: فیلترهای پیشرفته (Sticky on desktop, drawer modal on mobile) */}
        <FilterSidebar
          genres={genres}
          filters={filters}
          total={total}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          onReset={handleResetFilters}
          isOpenMobile={mobileFilterOpen}
          onCloseMobile={() => setMobileFilterOpen(false)}
        />

        {/* Main Content Area (Games Grid & Top Bar) */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          
          {/* Top Sticky Bar: Search Box (Right) + Mobile Filter Button + Subscription Quota Widgets (Left) */}
          <div className="sticky top-16 z-30 bg-[#0d121f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input Row with Mobile Filter Trigger */}
            <div className="flex items-center gap-2 w-full md:flex-1">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden h-10 px-3 rounded-xl bg-[#141b2d] border border-white/10 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                title="فیلترهای پیشرفته"
                aria-label="فیلترهای پیشرفته"
              >
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold sm:inline">فیلترها</span>
                {activeFilterCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-purple-400/50" />
                )}
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPage(1);
                  }}
                  placeholder="جستجوی بازی، عنوان، ژانر و ..."
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#141b2d] border border-white/10 text-white placeholder-text-muted text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-right"
                />
                <Search className="absolute right-3 top-3 w-4 h-4 text-text-muted" />
              </div>
            </div>

            {/* Circular Quota & Days Remaining Indicators */}
            <CircularQuotaWidget />
          </div>

          {/* Games Grid (5 Columns on Desktop matching games.jpg) */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {Array.from({ length: 15 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0d121f] border border-white/5 overflow-hidden animate-pulse aspect-[3/4]"
                />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-[#0d121f] border border-white/10 p-8 space-y-3">
              <Gamepad2 className="w-12 h-12 text-text-muted mx-auto" />
              <h3 className="text-base font-bold text-white">بازی مورد نظر یافت نشد</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                هیچ بازی با فیلترهای انتخابی پیدا نشد. لطفاً فیلترها را ریست کنید یا عبارت دیگری را جستجو فرمایید.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/30 transition-all shadow-[0_0_12px_rgba(168,85,247,0.25)]"
              >
                حذف همه فیلترها
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 border-t border-white/5">
              {/* Total & Current Page Info */}
              <div className="text-xs text-slate-400 order-2 sm:order-1 flex items-center gap-1.5">
                <span>نمایش صفحه</span>
                <span className="font-bold text-white font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {page}
                </span>
                <span>از</span>
                <span className="font-bold text-white font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {totalPages}
                </span>
                <span className="text-slate-500 mr-1.5">({total.toLocaleString('fa-IR')} بازی)</span>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                {/* First Page Button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page <= 1}
                  title="صفحه اول"
                  className="p-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                {/* Prev Button */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden md:inline">صفحه قبل</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPaginationRange(page, totalPages).map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-7 text-center text-slate-500 text-xs font-bold select-none"
                        >
                          ...
                        </span>
                      );
                    }
                    const pageNum = item as number;
                    const isActive = page === pageNum;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[34px] h-[34px] px-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white font-black shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400 scale-105'
                            : 'bg-[#0d121f] border border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center gap-1"
                >
                  <span className="hidden md:inline">صفحه بعد</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page >= totalPages}
                  title="صفحه آخر"
                  className="p-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
