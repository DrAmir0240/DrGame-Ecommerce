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
  Search,
  Sparkles,
} from 'lucide-react';
import { Genre } from '@/types/game';
import PlatformIcon from './PlatformIcons';

export interface FilterState {
  search: string;
  genre: string;
  platform: string;
  max_size: number;
  min_rating: number;
  is_two_player: boolean;
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
}

// 4 main console platforms matching games.jpg
const PLATFORMS = [
  { id: 'PS5', label: 'PlayStation' },
  { id: 'Xbox', label: 'Xbox' },
  { id: 'Switch', label: 'Nintendo Switch' },
  { id: 'PC', label: 'PC / Windows' },
];

// Top 8 genres matching games.jpg
const TOP_GENRES = [
  { slug: 'action', name: 'اکشن' },
  { slug: 'adventure', name: 'ماجراجویی' },
  { slug: 'role-playing-games-rpg', name: 'نقش‌آفرینی' },
  { slug: 'shooter', name: 'شوتر' },
  { slug: 'racing', name: 'مسابقه‌ای' },
  { slug: 'strategy', name: 'استراتژی' },
  { slug: 'puzzle', name: 'معمایی' },
  { slug: 'sports', name: 'ورزشی' },
];

// 6 stepped size options
const SIZE_STEPS = [
  { label: 'همه', max: 200 },
  { label: '< ۱۰ GB', max: 10 },
  { label: '۱۰-۳۰ GB', max: 30 },
  { label: '۳۰-۶۰ GB', max: 60 },
  { label: '۶۰-۱۰۰ GB', max: 100 },
  { label: '> ۱۰۰ GB', max: 200 },
];

export default function FilterSidebar({
  genres,
  filters,
  total,
  onChange,
  onReset,
  onApply,
}: FilterSidebarProps) {
  const [showAllGenres, setShowAllGenres] = useState(false);

  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const toFarsi = (num: number) => num.toLocaleString('fa-IR');

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4 text-right font-vazir select-none">
      <div className="p-4 rounded-2xl bg-[#0d121f]/95 border border-white/10 space-y-5 shadow-2xl backdrop-blur-xl">
        
        {/* Header: فیلترهای پیشرفته */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span>فیلترهای پیشرفته</span>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-text-muted hover:text-cyan-400 flex items-center gap-1 transition-colors"
            title="حذف همه فیلترها"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پاک کردن</span>
          </button>
        </div>

        {/* 1. پلتفرم‌ها (فقط آیکون‌های بزرگ بدون نوشته طبق games.jpg) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>پلتفرم‌ها</span>
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PLATFORMS.map((plat) => {
              const isSelected = filters.platform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => update({ platform: isSelected ? '' : plat.id })}
                  className={`h-11 rounded-xl border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                      : 'bg-[#141b2d] border-white/10 hover:border-white/20 hover:bg-[#1a233a]'
                  }`}
                  title={plat.label}
                  aria-label={plat.label}
                >
                  <PlatformIcon platform={plat.id} size={22} />
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. ژانرها (۲ ستونه طبق games.jpg با دکمه بیشتر...) */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span>ژانرها</span>
            {filters.genre && (
              <span className="text-[10px] text-cyan-400 font-bold">۱ انتخاب</span>
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
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white hover:border-white/15'
                  }`}
                >
                  {g.name}
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
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                          : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white hover:border-white/15'
                      }`}
                    >
                      {g.name_fa}
                    </button>
                  );
                })}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAllGenres(!showAllGenres)}
            className="w-full text-center text-xs text-text-muted hover:text-cyan-400 py-1 transition-colors flex items-center justify-center gap-1 font-semibold"
          >
            <span>{showAllGenres ? 'بستن لیست' : 'بیشتر ...'}</span>
            {showAllGenres ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3. حالت بازی (تک‌نفره، چندنفره آنلاین، همکاری، محلی) */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>حالت بازی</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => update({ is_two_player: false })}
              className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all ${
                !filters.is_two_player
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
              }`}
            >
              تک‌نفره
            </button>
            <button
              onClick={() => update({ is_two_player: true })}
              className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all ${
                filters.is_two_player
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
              }`}
            >
              چندنفره آنلاین
            </button>
            <button
              onClick={() => update({ is_two_player: !filters.is_two_player })}
              className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all ${
                filters.is_two_player
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
              }`}
            >
              همکاری (Co-op)
            </button>
            <button
              onClick={() => update({ is_two_player: !filters.is_two_player })}
              className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all ${
                filters.is_two_player
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
              }`}
            >
              محلی (Local)
            </button>
          </div>
        </div>

        {/* 4. وضعیت انتشار (منتشر شده، دسترسی زودهنگام، در راه انتشار) */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>وضعیت انتشار</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => update({ release_status: filters.release_status === 'released' ? '' : 'released' })}
              className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all ${
                filters.release_status === 'released' || !filters.release_status
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
              }`}
            >
              منتشر شده
            </button>
            <button
              onClick={() => update({ release_status: filters.release_status === 'early' ? '' : 'early' })}
              className={`py-1.5 px-2 rounded-xl text-xs border text-center transition-all ${
                filters.release_status === 'early'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
              }`}
            >
              دسترسی زودهنگام
            </button>
          </div>
        </div>

        {/* 5. فیلتر پله‌ای حجم دیتا (۶ پله مجزا طبق تسک فاز ۲) */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>حجم دیتا</span>
            </span>
            <span className="text-[10px] text-text-muted font-roboto">
              {filters.max_size < 200 ? `< ${filters.max_size} GB` : 'همه'}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {SIZE_STEPS.map((step) => {
              const isSelected = filters.max_size === step.max;
              return (
                <button
                  key={step.label}
                  onClick={() => update({ max_size: step.max })}
                  className={`py-1 px-1.5 rounded-lg text-[11px] border text-center transition-all font-roboto ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                      : 'bg-[#141b2d] border-white/5 text-text-secondary hover:text-white'
                  }`}
                >
                  {step.label}
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
              <span>حداقل امتیاز:</span>
            </span>
            <span className="font-bold text-amber-400 font-roboto">
              {filters.min_rating > 0 ? `${filters.min_rating} / 5` : 'همه'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={filters.min_rating}
            onChange={(e) => update({ min_rating: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* دکمه بزرگ نارنجی نمایش بازی‌ها طبق games.jpg */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (onApply) onApply();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>نمایش {toFarsi(total)} بازی</span>
          </button>
        </div>

      </div>
    </aside>
  );
}
