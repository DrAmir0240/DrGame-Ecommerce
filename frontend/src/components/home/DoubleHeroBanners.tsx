'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';

interface BannerItem {
  id: number;
  position: number;
  badge: string;
  title_fa: string;
  title_en?: string | null;
  description: string;
  backdrop_url: string;
  link_href: string;
  cta_text: string;
  platforms: string[];
  display_order: number;
  is_active: boolean;
}

export default function DoubleHeroBanners() {
  const [gameBanners, setGameBanners] = useState<BannerItem[]>([]);
  const [serviceBanners, setServiceBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [gameIdx, setGameIdx] = useState(0);
  const [serviceIdx, setServiceIdx] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [isServicePaused, setIsServicePaused] = useState(false);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const data = await apiRequest<{
          position_1: BannerItem[];
          position_2: BannerItem[];
        }>('/home/banners');
        setGameBanners(data.position_1 || []);
        setServiceBanners(data.position_2 || []);
      } catch (err) {
        console.error('Failed to load hero banners:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanners();
  }, []);

  // Auto-play for game banner (6 seconds interval, pauses on hover)
  useEffect(() => {
    if (isGamePaused || gameBanners.length <= 1) return;
    const timer = setInterval(() => {
      setGameIdx((prev) => (prev + 1) % gameBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isGamePaused, gameBanners.length]);

  // Auto-play for service banner (7 seconds interval, pauses on hover)
  useEffect(() => {
    if (isServicePaused || serviceBanners.length <= 1) return;
    const timer = setInterval(() => {
      setServiceIdx((prev) => (prev + 1) % serviceBanners.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isServicePaused, serviceBanners.length]);

  if (loading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-6 space-y-5 font-vazir text-right">
        <div className="h-72 sm:h-80 md:h-[320px] rounded-3xl bg-[#080b12] border border-white/5 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
        <div className="h-72 sm:h-80 md:h-[320px] rounded-3xl bg-[#090b14] border border-white/5 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </section>
    );
  }

  const activeGame = gameBanners[gameIdx];
  const activeService = serviceBanners[serviceIdx];

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-6 space-y-5 font-vazir text-right">
      {/* =========================================================================
          BANNER 1 (TOP): FEATURED AAA GAMES SLIDER (2/3 Height ~320px)
         ========================================================================= */}
      {activeGame && (
        <div
          onMouseEnter={() => setIsGamePaused(true)}
          onMouseLeave={() => setIsGamePaused(false)}
          className="relative rounded-3xl overflow-hidden h-72 sm:h-80 md:h-[320px] flex items-end border border-white/10 shadow-2xl bg-[#080b12] group"
        >
          {/* Background Image with Cinematic Gradient Overlays */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
            style={{ backgroundImage: `url(${activeGame.backdrop_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/80 to-[#080b12]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b12]/90 via-transparent to-[#080b12]/70" />

          {/* Slide Content */}
          <div className="relative z-10 p-5 sm:p-7 md:p-8 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                  {activeGame.badge}
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
                  <Star className="w-3 h-3 fill-amber-300 stroke-none" />
                  <span>4.9</span>
                </div>
                <div className="flex items-center gap-1">
                  {(activeGame.platforms || []).map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-white text-[10px] font-bold font-roboto uppercase"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Titles */}
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  {activeGame.title_fa}
                </h2>
                {activeGame.title_en && (
                  <p className="text-xs sm:text-sm text-slate-400 font-roboto" dir="ltr">
                    {activeGame.title_en}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 max-w-xl">
                {activeGame.description}
              </p>
            </div>

            {/* Action & Nav Controls */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-end">
              <Link
                href={activeGame.link_href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{activeGame.cta_text || 'مشاهده و دانلود'}</span>
              </Link>

              {/* Arrows */}
              {gameBanners.length > 1 && (
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                  <button
                    onClick={() =>
                      setGameIdx(
                        (prev) => (prev - 1 + gameBanners.length) % gameBanners.length
                      )
                    }
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                    aria-label="اسلاید قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGameIdx((prev) => (prev + 1) % gameBanners.length)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                    aria-label="اسلاید بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dot Indicators */}
          {gameBanners.length > 1 && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
              {gameBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setGameIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    gameIdx === idx
                      ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`رفتن به اسلاید ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          BANNER 2 (BOTTOM): PLATFORM OFFERS & TOOLS SLIDER (2/3 Height ~320px)
         ========================================================================= */}
      {activeService && (
        <div
          onMouseEnter={() => setIsServicePaused(true)}
          onMouseLeave={() => setIsServicePaused(false)}
          className="relative rounded-3xl overflow-hidden h-72 sm:h-80 md:h-[320px] flex items-end border border-white/10 shadow-2xl bg-[#090b14] group"
        >
          {/* Background Image with Amber/Purple Tint Gradient */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
            style={{ backgroundImage: `url(${activeService.backdrop_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/85 to-[#090b14]/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b14]/90 via-transparent to-[#090b14]/70" />

          {/* Slide Content */}
          <div className="relative z-10 p-5 sm:p-7 md:p-8 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              {/* Service Badge */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold bg-amber-500/20 text-amber-300 border-amber-500/30">
                  {activeService.badge}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>سرورهای اختصاصی نیم‌بهاء ایران</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {activeService.title_fa}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 max-w-xl">
                {activeService.description}
              </p>
            </div>

            {/* Action & Nav Controls */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-end">
              <Link
                href={activeService.link_href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
                <span>{activeService.cta_text || 'مشاهده و اقدام'}</span>
              </Link>

              {/* Arrows */}
              {serviceBanners.length > 1 && (
                <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                  <button
                    onClick={() =>
                      setServiceIdx(
                        (prev) => (prev - 1 + serviceBanners.length) % serviceBanners.length
                      )
                    }
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                    aria-label="اسلاید قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setServiceIdx((prev) => (prev + 1) % serviceBanners.length)
                    }
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                    aria-label="اسلاید بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dot Indicators */}
          {serviceBanners.length > 1 && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
              {serviceBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setServiceIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    serviceIdx === idx
                      ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`رفتن به اسلاید ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
