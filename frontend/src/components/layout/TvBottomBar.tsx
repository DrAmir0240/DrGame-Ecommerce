'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tv, LogOut, Clock, Activity } from 'lucide-react';
import { useTvModeStore } from '@/stores/useTvModeStore';
import { useTranslation } from '@/i18n';

export default function TvBottomBar() {
  const router = useRouter();
  const { isTvMode, closeTvMode } = useTvModeStore();
  const { t, locale, dir } = useTranslation();
  const [currentTime, setCurrentTime] = useState<string>('21:40');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      if (locale === 'fa') {
        const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const farsiClock = `${hours}:${minutes}`.replace(/[0-9]/g, (d) => farsiDigits[parseInt(d, 10)]);
        setCurrentTime(farsiClock);
      } else if (locale === 'ar') {
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        const arClock = `${hours}:${minutes}`.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
        setCurrentTime(arClock);
      } else {
        setCurrentTime(`${hours}:${minutes}`);
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, [locale]);

  if (!isTvMode) return null;

  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-[999] bg-[#060812]/95 border-t border-purple-500/40 backdrop-blur-2xl px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 shadow-[0_-12px_45px_rgba(0,0,0,0.9)] flex items-center justify-between text-sm font-vazir select-none animate-in slide-in-from-bottom duration-300"
      dir={dir}
      role="region"
      aria-label={t('chrome.tvBarRegion')}
    >
      {/* ─────────────────────────────────────────────────────────────────────────
          1. BRAND & LIVE SERVER METRICS (Large TV Badge)
         ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.55)]">
            <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-white text-sm sm:text-base leading-tight tracking-tight">
              DrGame <span className="text-purple-400 font-black">Nebula TV</span>
            </span>
            <span className="text-xs text-purple-300 font-mono mt-0.5">10-Foot Console UI</span>
          </div>
        </div>

        {/* Live Clock & Server Ping */}
        <div className="hidden md:flex items-center gap-3 border-r border-l border-white/15 px-4 py-1 text-xs sm:text-sm text-slate-200">
          <div className="flex items-center gap-1.5 font-mono font-bold">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{currentTime}</span>
          </div>
          <span className="text-slate-600 font-bold">|</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            <span className="text-slate-200 font-sans font-bold">{t('tv.serverStatus')}</span>
            <span className="text-emerald-300 font-bold">11ms</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. GAMEPAD / CONTROLLER GUIDE (Large High-Visibility Badges)
         ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3.5 sm:gap-7 flex-wrap justify-center font-bold text-xs sm:text-sm">
        {/* D-Pad: Navigate */}
        <div className="flex items-center gap-2 text-slate-200">
          <span className="px-2 sm:px-2.5 py-1 rounded-xl bg-white/15 border border-white/30 text-white font-black text-xs sm:text-sm font-mono shadow-sm">
            ← ↑ ↓ →
          </span>
          <span className="text-white text-xs sm:text-sm">{t('tv.move')}</span>
        </div>

        {/* Cross (Select) */}
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/25 border border-blue-400/80 text-blue-400 font-black text-xs sm:text-sm flex items-center justify-center font-roboto shadow-[0_0_12px_rgba(59,130,246,0.6)]">
            ✕
          </span>
          <span className="text-white font-black text-xs sm:text-sm">{t('tv.select')}</span>
        </div>

        {/* Circle (Back) */}
        <div className="flex items-center gap-2 text-slate-200">
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500/25 border border-rose-400/80 text-rose-400 font-black text-xs sm:text-sm flex items-center justify-center font-roboto shadow-[0_0_12px_rgba(244,63,94,0.6)]">
            ○
          </span>
          <span className="text-white text-xs sm:text-sm">{t('tv.back')}</span>
        </div>

        {/* Triangle (Games Catalog) */}
        <button
          type="button"
          onClick={() => router.push('/games')}
          className="hidden sm:flex items-center gap-2 text-slate-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          title={t('chrome.tvBarGames')}
        >
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/25 border border-emerald-400/80 text-emerald-400 font-black text-xs sm:text-sm flex items-center justify-center font-roboto shadow-[0_0_12px_rgba(52,211,153,0.6)]">
            △
          </span>
          <span className="text-white text-xs sm:text-sm">{t('nav.games')}</span>
        </button>

        {/* Square (Subscriptions) */}
        <button
          type="button"
          onClick={() => router.push('/subscriptions')}
          className="hidden md:flex items-center gap-2 text-slate-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          title={t('chrome.tvBarPlans')}
        >
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-pink-500/25 border border-pink-400/80 text-pink-400 font-black text-xs sm:text-sm flex items-center justify-center font-roboto shadow-[0_0_12px_rgba(236,72,153,0.6)]">
            □
          </span>
          <span className="text-white text-xs sm:text-sm">{t('subscription.buyNow')}</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. EXIT TV MODE BUTTON (Large & Accessible)
         ───────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={closeTvMode}
          className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/30 border border-white/20 hover:border-rose-500/60 text-slate-100 hover:text-rose-100 text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
          title={`${t('tv.exitTv')} (Esc)`}
        >
          <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 rtl:rotate-0 ltr:rotate-180 text-rose-400 shrink-0" />
          <span className="hidden xs:inline">{t('tv.exitTv')}</span>
        </button>
      </div>
    </footer>
  );
}
