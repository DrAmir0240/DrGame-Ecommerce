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
import { useTranslation, DynamicText } from '@/i18n';

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
  const { locale, t, n } = useTranslation();
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
    if (gameBanners.length <= 1 || isGamePaused) return;
    const timer = setInterval(() => {
      setGameIdx((prev) => (prev + 1) % gameBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [gameBanners.length, isGamePaused]);

  // Auto-play for service banner (7 seconds interval, pauses on hover)
  useEffect(() => {
    if (serviceBanners.length <= 1 || isServicePaused) return;
    const timer = setInterval(() => {
      setServiceIdx((prev) => (prev + 1) % serviceBanners.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [serviceBanners.length, isServicePaused]);

  if (loading) {
    return (
      <div className="w-full max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-6">
        <div className="h-[320px] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin opacity-50" />
        </div>
      </div>
    );
  }

  // If no banners from DB, do not crash or render blank space
  if (gameBanners.length === 0 && serviceBanners.length === 0) {
    return null;
  }

  const activeGame = gameBanners[gameIdx] || null;
  const activeService = serviceBanners[serviceIdx] || null;

  return (
    <section
      aria-label={t('chrome.bannerAria')}
      className="w-full max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 space-y-5 sm:space-y-6"
    >
      {/* =========================================================================
          BANNER 1 (TOP): GAME SPOTLIGHT SLIDER (2/3 Height ~320px)
         ========================================================================= */}
      {activeGame && (
        <div
          onMouseEnter={() => setIsGamePaused(true)}
          onMouseLeave={() => setIsGamePaused(false)}
          className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[320px] md:h-[340px] lg:h-[370px] 2xl:h-[420px] flex items-end border border-white/10 shadow-2xl bg-[#090b14] group"
        >
          {/* Background Image with Smooth Fade Transition */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
            style={{ backgroundImage: `url(${activeGame.backdrop_url})` }}
          />
          {/* Gradients to match the look in games.jpg and hero-banner-game.jpg */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090b14]/90 via-transparent to-[#090b14]/70" />

          {/* Slide Content */}
          <div className="relative z-10 p-5 sm:p-7 md:p-8 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              {/* Badge & Platforms */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  <DynamicText text={activeGame.badge} />
                </span>

                {activeGame.platforms?.map((plat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-wider font-roboto"
                  >
                    {plat}
                  </span>
                ))}
              </div>

              {/* Titles */}
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                  {locale === 'en' && activeGame.title_en ? activeGame.title_en : <DynamicText text={activeGame.title_fa} />}
                </h2>
                {activeGame.title_en && locale !== 'en' && (
                  <p className="text-xs sm:text-sm text-slate-400 font-roboto" dir="ltr">
                    {activeGame.title_en}
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 max-w-xl">
                <DynamicText text={activeGame.description} />
              </p>
            </div>

            {/* Action & Nav Controls */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-end">
              <Link
                href={activeGame.link_href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span><DynamicText text={activeGame.cta_text || t('hero.startBrowsing')} /></span>
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
                    aria-label={t('chrome.prevSlide')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setGameIdx((prev) => (prev + 1) % gameBanners.length)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                    aria-label={t('chrome.nextSlide')}
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
                  aria-label={t('chrome.goToSlide', { index: n(idx + 1) })}
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
          className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[320px] md:h-[340px] lg:h-[370px] 2xl:h-[420px] flex items-end border border-white/10 shadow-2xl bg-[#090b14] group"
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
                  <DynamicText text={activeService.badge} />
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('chrome.dedicatedServers')}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                {locale === 'en' && activeService.title_en ? activeService.title_en : <DynamicText text={activeService.title_fa} />}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 max-w-xl">
                <DynamicText text={activeService.description} />
              </p>
            </div>

            {/* Action & Nav Controls */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-end">
              <Link
                href={activeService.link_href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
                <span><DynamicText text={activeService.cta_text || t('subscription.buyNow')} /></span>
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
                    aria-label={t('chrome.prevSlide')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setServiceIdx((prev) => (prev + 1) % serviceBanners.length)
                    }
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                    aria-label={t('chrome.nextSlide')}
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
                  aria-label={t('chrome.goToSlide', { index: n(idx + 1) })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
