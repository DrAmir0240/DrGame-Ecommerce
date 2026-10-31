'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/apiClient';
import { GameCardItem, Genre, PaginatedGames } from '@/types/game';
import GameCard from '@/components/games/GameCard';
import FilterSidebar, { FilterState } from '@/components/games/FilterSidebar';
import CircularQuotaWidget from '@/components/games/CircularQuotaWidget';
import { Search, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Gamepad2, Sparkles, Filter } from 'lucide-react';
import { useTranslation } from '@/i18n';

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

function GamesCatalogContent() {
  const { t, n, tp } = useTranslation();
  const searchParams = useSearchParams();

  // Read URL query filters
  const paramGenre = searchParams.get('genre') || '';
  const paramPlatform = searchParams.get('platform') || '';
  const paramSearch = searchParams.get('search') || '';
  const paramTwoPlayer =
    searchParams.get('is_two_player') === 'true'
      ? true
      : searchParams.get('is_two_player') === 'false'
      ? false
      : null;
  const paramHasVr = searchParams.get('has_vr') === 'true';
  const paramReleaseStatus = searchParams.get('release_status') || '';
  const paramMaxSize = searchParams.get('max_size') ? Number(searchParams.get('max_size')) : 200;
  const paramMinRating = searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : 0;

  const [games, setGames] = useState<GameCardItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters State initialized from search params
  const [filters, setFilters] = useState<FilterState>({
    search: paramSearch,
    genre: paramGenre,
    platform: paramPlatform,
    max_size: paramMaxSize,
    min_rating: paramMinRating,
    is_two_player: paramTwoPlayer,
    has_vr: paramHasVr,
    release_status: paramReleaseStatus,
  });

  // Sync state if URL search params change
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      genre: searchParams.get('genre') || '',
      platform: searchParams.get('platform') || '',
      max_size: searchParams.get('max_size') ? Number(searchParams.get('max_size')) : 200,
      min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : 0,
      is_two_player:
        searchParams.get('is_two_player') === 'true'
          ? true
          : searchParams.get('is_two_player') === 'false'
          ? false
          : null,
      has_vr: searchParams.get('has_vr') === 'true',
      release_status: searchParams.get('release_status') || '',
    });
    setPage(1);
  }, [searchParams]);

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
      
      // If current page is out of bounds (e.g. after filter change), jump to page 1
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
    <div className="max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 space-y-6 text-start font-vazir">
      {/* Layout Grid: In RTL, 1st child (Sidebar) is on the RIGHT, 2nd child (Content) is on the LEFT. Mirrored in LTR */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Filter sidebar: sticky on desktop, drawer on mobile */}
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
                className="lg:hidden h-10 px-3 rounded-xl bg-[#141b2d] border border-white/10 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer"
                title={t('gamesPage.filterPanelTitle')}
                aria-label={t('gamesPage.filterPanelTitle')}
              >
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold">{t('gamesPage.filters')}</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center font-roboto">
                    {n(activeFilterCount)}
                  </span>
                )}
              </button>

              {/* Main Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('gamesPage.searchPlaceholder')}
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, search: e.target.value }));
                    setPage(1);
                  }}
                  className="w-full h-10 pr-10 pl-4 rounded-xl bg-[#141b2d] border border-white/10 hover:border-white/20 focus:border-purple-500/50 text-xs text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Quota Widgets */}
            <div className="w-full md:w-auto flex items-center justify-end shrink-0">
              <CircularQuotaWidget />
            </div>
          </div>

          {/* Loading State Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-[#0d121f] border border-white/5 overflow-hidden animate-pulse flex flex-col aspect-[3/4]"
                >
                  <div className="flex-1 bg-white/[0.03]" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-white/10 rounded-md w-3/4" />
                    <div className="h-3 bg-white/5 rounded-md w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : games.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white">{t('gamesPage.emptyTitle')}</h3>
                <p className="text-xs text-slate-400">
                  {t('gamesPage.emptyBody')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
              >
                {t('gamesPage.resetFilters')}
              </button>
            </div>
          ) : (
            /* Games Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="text-xs text-slate-400">
                {t('gamesPage.paginationShowing', {
                  from: n((page - 1) * 20 + 1),
                  to: n(Math.min(page * 20, total)),
                  total: n(total),
                })}
              </div>

              <div className="flex items-center gap-1.5 font-roboto" dir="ltr">
                {/* First Page Button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page <= 1}
                  title={t('gamesPage.firstPage')}
                  className="p-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center cursor-pointer"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden md:inline">{t('gamesPage.prevPage')}</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-1">
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
                        className={`min-w-[34px] h-[34px] px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                  className="px-3 py-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden md:inline">{t('gamesPage.nextPage')}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page >= totalPages}
                  title={t('gamesPage.lastPage')}
                  className="p-2 rounded-xl bg-[#0d121f] border border-white/10 text-slate-300 disabled:opacity-30 disabled:hover:border-white/10 hover:border-purple-500/40 hover:text-white transition-all text-xs flex items-center cursor-pointer"
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

export default function GamesCatalogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <GamesCatalogContent />
    </Suspense>
  );
}
