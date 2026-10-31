'use client';

import React, { useState } from 'react';
import {
  Filter,
  RotateCcw,
  Users,
  Calendar,
  Star,
  HardDrive,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from 'lucide-react';
import { Genre } from '@/types/game';
import PlatformIcon from './PlatformIcons';
import { useTranslation, DynamicText } from '@/i18n';

export interface FilterState {
  search: string;
  genre: string;
  platform: string;
  max_size: number;
  min_rating: number;
  is_two_player: boolean | null;
  has_vr: boolean;
  game_mode?: string;
  release_status?: string;
}

interface FilterSidebarProps {
  genres: Genre[];
  filters: FilterState;
  total: number;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
  onApply?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

// 4 main console platforms: PS5, PS4, Xbox, Switch (Microsoft / PC removed)
const PLATFORMS = [
  { id: 'PS5', labelKey: 'filters.platformNames.ps5' },
  { id: 'PS4', labelKey: 'filters.platformNames.ps4' },
  { id: 'Xbox', labelKey: 'filters.platformNames.xbox' },
  { id: 'Switch', labelKey: 'filters.platformNames.switch' },
];

// Top 8 genres matching games.jpg
const TOP_GENRES = [
  { slug: 'action', labelKey: 'filters.genre.action' },
  { slug: 'adventure', labelKey: 'filters.genre.adventure' },
  { slug: 'role-playing-games-rpg', labelKey: 'filters.genre.rpg' },
  { slug: 'shooter', labelKey: 'filters.genre.shooter' },
  { slug: 'racing', labelKey: 'filters.genre.racing' },
  { slug: 'strategy', labelKey: 'filters.genre.strategy' },
  { slug: 'puzzle', labelKey: 'filters.genre.puzzle' },
  { slug: 'sports', labelKey: 'filters.genre.sports' },
];

// 6 stepped size options
interface SizeStep {
  labelKey: string;
  max: number;
  min?: number;
}

const SIZE_STEPS: SizeStep[] = [
  { labelKey: 'filters.sizeAll', max: 200 },
  { labelKey: 'filters.sizeUnder', max: 10 },
  { labelKey: 'filters.sizeRange', min: 10, max: 30 },
  { labelKey: 'filters.sizeRange', min: 30, max: 60 },
  { labelKey: 'filters.sizeRange', min: 60, max: 100 },
  { labelKey: 'filters.sizeOver', max: 200 },
];

export default function FilterSidebar({
  genres,
  filters,
  total,
  onChange,
  onReset,
  isOpenMobile,
  onCloseMobile,
}: FilterSidebarProps) {
  const { t, n, size } = useTranslation();
  const [showAllGenres, setShowAllGenres] = useState(false);

  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const getSizeStepLabel = (step: SizeStep) => {
    if (step.labelKey === 'filters.sizeRange') {
      return t(step.labelKey, { min: n(step.min ?? 0), max: n(step.max) });
    }
    return t(step.labelKey, { size: size(step.max) });
  };

  const renderFilterContent = (isMobile = false) => (
    <div className="space-y-5">
      {/* Header: فیلترهای پیشرفته */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
          <Filter className="w-4 h-4 text-purple-400" />
          <span>{t('filters.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="text-xs text-text-muted hover:text-purple-400 flex items-center gap-1 transition-colors"
            title={t('filters.clearAllTitle')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('filters.clear')}</span>
          </button>
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors flex items-center gap-1 text-xs"
              title={t('filters.closeFilters')}
              aria-label={t('filters.closeFilters')}
            >
              <X className="w-4 h-4" />
              <span>{t('common.close')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. پلتفرم‌ها (فقط لوگوهای کنسول) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>{t('filters.platforms')}</span>
          </span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PLATFORMS.map((plat) => {
            const isSelected = filters.platform === plat.id;
            const isPS = plat.id.startsWith('PS');
            const platformLabel = t(plat.labelKey);
            return (
              <button
                key={plat.id}
                onClick={() => update({ platform: isSelected ? '' : plat.id })}
                className={`h-11 rounded-xl border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.45)] ring-1 ring-purple-500'
                    : 'bg-[#141b2d] border-white/10 hover:border-white/20 hover:bg-[#1a233a]'
                }`}
                title={platformLabel}
                aria-label={platformLabel}
              >
                <PlatformIcon
                  platform={plat.id}
                  size={isPS ? 28 : 22}
                  className={isPS ? 'max-w-[95%] max-h-7' : 'max-w-[80%] max-h-5'}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ژانرها */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span>{t('filters.genres')}</span>
          {filters.genre && (
            <span className="text-[10px] text-purple-400 font-bold">{t('filters.selectedCount', { count: n(1) })}</span>
          )}
        </label>
        
        <div className="grid grid-cols-2 gap-1.5">
          {TOP_GENRES.map((g) => {
            const isSelected = filters.genre === g.slug;
            return (
              <button
                key={g.slug}
                onClick={() => update({ genre: isSelected ? '' : g.slug })}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all truncate ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                    : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white hover:border-white/15'
                }`}
              >
                {t(g.labelKey)}
              </button>
            );
          })}
        </div>

        {/* سایر ژانرها هنگام کلیک روی بیشتر... */}
        {showAllGenres && (
          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/5 animate-in fade-in duration-200">
            {genres
              .filter((g) => !TOP_GENRES.some((tg) => tg.slug === g.slug))
              .map((g) => {
                const isSelected = filters.genre === g.slug;
                return (
                  <button
                    key={g.slug}
                    onClick={() => update({ genre: isSelected ? '' : g.slug })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all truncate ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                        : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white hover:border-white/15'
                    }`}
                  >
                    <DynamicText text={g.name_fa} />
                  </button>
                );
              })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAllGenres(!showAllGenres)}
          className="w-full text-center text-xs text-text-muted hover:text-purple-400 py-1 transition-colors flex items-center justify-center gap-1 font-semibold"
        >
          <span>{showAllGenres ? t('filters.showLess') : t('filters.showAll')}</span>
          {showAllGenres ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 3. حالت بازی: تک‌نفره / چند‌نفره (۲ یا چند دسته) */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('filters.gameMode')}</span>
          </span>
          {filters.is_two_player !== null && (
            <span className="text-[10px] text-purple-400 font-bold">{t('filters.selectedCount', { count: n(1) })}</span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => update({ is_two_player: filters.is_two_player === false ? null : false })}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
              filters.is_two_player === false
                ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.35)] ring-1 ring-purple-500'
                : 'bg-[#141b2d] border-white/5 text-slate-300 hover:text-white hover:border-white/15'
            }`}
          >
            {t('filters.singlePlayer')}
          </button>          <button
            type="button"
            onClick={() => update({ is_two_player: filters.is_two_player === true ? null : true })}
            className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
              filters.is_two_player === true
                ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.35)] ring-1 ring-purple-500'
                : 'bg-[#141b2d] border-white/5 text-slate-300 hover:text-white hover:border-white/15'
            }`}
          >
            {t('filters.multiPlayer')}
          </button>
        </div>
      </div>

      {/* 4. پشتیبانی از واقعیت مجازی (VR) */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('filters.vr')}</span>
          </span>
          {filters.has_vr && (
            <span className="text-[10px] text-purple-400 font-bold">{t('filters.active')}</span>
          )}
        </label>
        <button
          type="button"
          onClick={() => update({ has_vr: !filters.has_vr })}
          className={`w-full py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
            filters.has_vr
              ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.35)] ring-1 ring-purple-500'
              : 'bg-[#141b2d] border-white/5 text-slate-300 hover:text-white hover:border-white/15'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('filters.vrOnly')}</span>
          </span>
          <span className={`w-2.5 h-2.5 rounded-full transition-all ${filters.has_vr ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-white/20'}`} />
        </button>
      </div>

      {/* 4. وضعیت انتشار */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('filters.releaseStatus')}</span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => update({ release_status: filters.release_status === 'released' ? '' : 'released' })}
            className={`py-2 px-2.5 rounded-xl text-xs border text-center transition-all ${
              filters.release_status === 'released'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-black shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-[1.02]'
                : 'bg-[#141b2d] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
            }`}
          >
            {t('filters.released')}
          </button>
          <button
            type="button"
            onClick={() => update({ release_status: filters.release_status === 'early' ? '' : 'early' })}
            className={`py-2 px-2.5 rounded-xl text-xs border text-center transition-all ${
              filters.release_status === 'early'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-black shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-[1.02]'
                : 'bg-[#141b2d] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
            }`}
          >
            {t('filters.earlyAccess')}
          </button>
        </div>
      </div>

      {/* 5. فیلتر پله‌ای حجم دیتا */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-xs font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('filters.dataSize')}</span>
          </span>
          <span className="text-[10px] text-text-muted font-roboto">
            {filters.max_size < 200
              ? t('filters.sizeUnder', { size: size(filters.max_size) })
              : t('filters.sizeAll')}
          </span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {SIZE_STEPS.map((step) => {
            const isSelected = filters.max_size === step.max;
            return (
              <button
                key={`${step.labelKey}-${step.max}`}
                onClick={() => update({ max_size: step.max })}
                className={`py-1 px-1.5 rounded-lg text-[11px] border text-center transition-all font-roboto ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                    : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
                }`}
              >
                {getSizeStepLabel(step)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. محدوده امتیاز */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white font-bold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{t('filters.minRating')}</span>
          </span>
          <span className="font-bold text-amber-400 font-roboto">
            {filters.min_rating > 0 ? t('filters.ratingValue', { value: n(filters.min_rating) }) : t('common.all')}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={filters.min_rating}
          onChange={(e) => update({ min_rating: Number(e.target.value) })}
          className="w-full accent-purple-500 cursor-pointer"
        />
      </div>

      {/* Mobile-only close button at bottom */}
      {isMobile && onCloseMobile && (
        <div className="pt-2">
          <button
            onClick={onCloseMobile}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>{t('filters.closeFilters')}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:block w-72 shrink-0 text-start font-vazir select-none sticky top-20 z-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
        <div className="p-4 rounded-2xl bg-[#0d121f]/95 border border-white/10 shadow-2xl backdrop-blur-xl">
          {renderFilterContent(false)}
        </div>
      </aside>

      {/* Mobile Drawer (Only when isOpenMobile is true) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-in sidebar drawer */}
          <aside className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#0d121f] border-l border-white/10 p-4 overflow-y-auto shadow-2xl z-10 text-start font-vazir select-none animate-in slide-in-from-right duration-300">
            {renderFilterContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
