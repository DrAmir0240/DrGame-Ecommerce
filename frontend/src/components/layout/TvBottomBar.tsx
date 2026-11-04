'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tv, LogOut, Clock, ZoomIn } from 'lucide-react';
import { useTvModeStore } from '@/stores/useTvModeStore';
import { useTranslation } from '@/i18n';
import { useConsoleDevice } from '@/hooks/useConsoleDevice';
import PlatformIcon from '@/components/games/PlatformIcons';

export default function TvBottomBar() {
  const router = useRouter();
  const { isTvMode, closeTvMode, zoomLevel, showZoomHud } = useTvModeStore();
  const { t, locale, dir } = useTranslation();
  const [currentTime, setCurrentTime] = useState<string>('21:40');
  const deviceInfo = useConsoleDevice();

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

  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────────
          ON-SCREEN ZOOM HUD (Heads-Up Display when L3 + R-Stick is used)
         ───────────────────────────────────────────────────────────────────────── */}
      {showZoomHud && (
        <div className="fixed top-8 inset-x-0 z-[1000] flex justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-black/85 border border-purple-500/50 backdrop-blur-xl shadow-[0_0_35px_rgba(168,85,247,0.7)] text-white text-sm font-bold font-vazir">
            <ZoomIn className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>
              {locale === 'fa' ? `بزرگ‌نمایی: ${zoomPercent}٪` : `Zoom: ${zoomPercent}%`}
            </span>
            <div className="w-20 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, Math.max(0, ((zoomLevel - 0.65) / (1.30 - 0.65)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          FIXED BOTTOM CONTROLLER BAR (Never Focusable by Gamepad Navigation)
         ───────────────────────────────────────────────────────────────────────── */}
      <footer
        data-tv-bar="true"
        data-no-gamepad="true"
        className="fixed bottom-0 inset-x-0 z-[999] bg-[#060812]/95 border-t border-purple-500/40 backdrop-blur-2xl px-4 sm:px-8 lg:px-12 py-3 shadow-[0_-12px_45px_rgba(0,0,0,0.9)] flex items-center justify-between text-xs sm:text-sm font-vazir select-none animate-in slide-in-from-bottom duration-300 pointer-events-auto"
        dir={dir}
        role="region"
        aria-label={t('chrome.tvBarRegion')}
      >
        {/* Device & UA Info (Replaces Nebula TV icon with PlayStation Device & Firmware) */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="h-8 sm:h-9 px-2.5 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.45)] border border-blue-400/30">
              <PlatformIcon platform={deviceInfo.platform} size={22} className="brightness-125" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white text-xs sm:text-sm leading-tight tracking-tight font-roboto">
                {deviceInfo.device}
              </span>
              <span className="text-[10px] sm:text-[11px] text-amber-300 font-mono font-bold mt-0.5 tracking-wider" dir="ltr">
                {deviceInfo.firmware}
              </span>
            </div>
          </div>

          {/* Live Clock & Server Ping */}
          <div className="hidden md:flex items-center gap-3 border-r border-l border-white/15 px-3 py-1 text-xs text-slate-200">
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime}</span>
            </div>
            <span className="text-slate-600 font-bold">|</span>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
              <span className="text-slate-200 font-sans font-bold">{t('tv.serverStatus')}</span>
              <span className="text-emerald-300 font-bold">11ms</span>
            </div>
          </div>
        </div>

        {/* Gamepad / Controller Guide Legend */}
        <div className="flex items-center gap-2.5 sm:gap-5 flex-wrap justify-center font-bold text-[11px] sm:text-xs">
          {/* D-Pad: Move */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="px-1.5 py-0.5 rounded-lg bg-white/15 border border-white/30 text-white font-black text-[10px] font-mono shadow-sm">
              ← ↑ ↓ →
            </span>
            <span className="text-white">{t('tv.move')}</span>
          </div>

          {/* Right Stick: Scroll */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="px-1.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-black text-[10px] font-mono">
              R-Stick
            </span>
            <span className="text-white">{locale === 'fa' ? 'اسکرول' : 'Scroll'}</span>
          </div>

          {/* L3 + Right Stick: Zoom */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="px-1.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400/50 text-purple-300 font-black text-[10px] font-mono">
              L3 + R-Stick
            </span>
            <span className="text-white">{locale === 'fa' ? 'زوم' : 'Zoom'}</span>
          </div>

          {/* Cross (Select) */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-500/25 border border-blue-400/80 text-blue-400 font-black text-xs flex items-center justify-center font-roboto shadow-[0_0_10px_rgba(59,130,246,0.6)]">
              ✕
            </span>
            <span className="text-white font-black">{t('tv.select')}</span>
          </div>

          {/* Circle (Back) */}
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-6 h-6 rounded-full bg-rose-500/25 border border-rose-400/80 text-rose-400 font-black text-xs flex items-center justify-center font-roboto shadow-[0_0_10px_rgba(244,63,94,0.6)]">
              ○
            </span>
            <span className="text-white">{t('tv.back')}</span>
          </div>

          {/* Triangle (Games Catalog) */}
          <button
            type="button"
            tabIndex={-1}
            data-no-gamepad="true"
            onClick={() => router.push('/games')}
            className="hidden sm:flex items-center gap-1.5 text-slate-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title={t('chrome.tvBarGames')}
          >
            <span className="w-6 h-6 rounded-full bg-emerald-500/25 border border-emerald-400/80 text-emerald-400 font-black text-xs flex items-center justify-center font-roboto shadow-[0_0_10px_rgba(52,211,153,0.6)]">
              △
            </span>
            <span className="text-white">{t('nav.games')}</span>
          </button>

          {/* Square (Subscriptions) */}
          <button
            type="button"
            tabIndex={-1}
            data-no-gamepad="true"
            onClick={() => router.push('/subscriptions')}
            className="hidden md:flex items-center gap-1.5 text-slate-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title={t('chrome.tvBarPlans')}
          >
            <span className="w-6 h-6 rounded-xl bg-pink-500/25 border border-pink-400/80 text-pink-400 font-black text-xs flex items-center justify-center font-roboto shadow-[0_0_10px_rgba(236,72,153,0.6)]">
              □
            </span>
            <span className="text-white">{t('subscription.buyNow')}</span>
          </button>
        </div>

        {/* Exit TV Mode Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            tabIndex={-1}
            data-no-gamepad="true"
            onClick={closeTvMode}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-rose-500/30 border border-white/20 hover:border-rose-500/60 text-slate-100 hover:text-rose-100 text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
            title={`${t('tv.exitTv')} (Esc)`}
          >
            <LogOut className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 text-rose-400 shrink-0" />
            <span className="hidden xs:inline">{t('tv.exitTv')}</span>
          </button>
        </div>
      </footer>
    </>
  );
}