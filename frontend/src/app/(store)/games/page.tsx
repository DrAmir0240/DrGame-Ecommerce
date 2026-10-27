'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { GameCardItem, Genre, PaginatedGames } from '@/types/game';
import GameCard from '@/components/games/GameCard';
import FilterSidebar, { FilterState } from '@/components/games/FilterSidebar';
import CircularQuotaWidget from '@/components/games/CircularQuotaWidget';
import { Search, ChevronRight, ChevronLeft, Gamepad2, Sparkles } from 'lucide-react';

export default function GamesCatalogPage() {
  const [games, setGames] = useState<GameCardItem[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    genre: '',
    platform: '',
    max_size: 200,
    min_rating: 0,
    is_two_player: false,
    has_vr: false,
    release_status: 'released',
  });

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
      if (filters.is_two_player) queryParams.set('is_two_player', 'true');
      if (filters.has_vr) queryParams.set('has_vr', 'true');
      queryParams.set('page', String(page));
      queryParams.set('page_size', '20');

      const data = await apiRequest<PaginatedGames>(`/games?${queryParams.toString()}`);
      setGames(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
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

  const handleResetFilters = () => {
    setFilters({
      search: '',
      genre: '',
      platform: '',
      max_size: 200,
      min_rating: 0,
      is_two_player: false,
      has_vr: false,
      release_status: 'released',
    });
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 text-right font-vazir">
      {/* Layout Grid: In RTL, 1st child (Sidebar) is on the RIGHT, 2nd child (Content) is on the LEFT. Mirrored in LTR */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: فیلترهای پیشرفته (On the Right in RTL, on the Left in LTR) */}
        <FilterSidebar
          genres={genres}
          filters={filters}
          total={total}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setPage(1);
          }}
          onReset={handleResetFilters}
          onApply={() => {
            // Scroll smoothly to top of games catalog
            window.scrollTo({ top: 100, behavior: 'smooth' });
          }}
        />

        {/* Main Content Area (Games Grid & Top Bar) */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          
          {/* Top Sticky Bar: Search Box (Right) + Subscription Quota Widgets (Left) */}
          <div className="sticky top-16 z-30 bg-[#0d121f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:flex-1">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
                placeholder="جستجوی بازی، عنوان، ژانر و ..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#141b2d] border border-white/10 text-white placeholder-text-muted text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-right"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-text-muted" />
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
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition-all"
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
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl bg-[#0d121f] border border-white/10 text-white disabled:opacity-40 hover:bg-white/10 transition-all text-xs flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="hidden sm:inline">صفحه قبل</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          page === p
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                            : 'bg-[#0d121f] border border-white/10 text-text-secondary hover:text-white hover:border-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) {
                    return (
                      <span key={p} className="text-text-muted text-xs px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-[#0d121f] border border-white/10 text-white disabled:opacity-40 hover:bg-white/10 transition-all text-xs flex items-center gap-1"
              >
                <span className="hidden sm:inline">صفحه بعد</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
