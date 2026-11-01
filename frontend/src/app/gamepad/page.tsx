'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Gamepad2,
  RotateCw,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useTranslation, SupportedLocale } from '@/i18n';

/** Maps DrGame i18n locales to the tester's supported language codes */
function mapLocaleToTesterLang(loc: SupportedLocale | string): string {
  switch (loc) {
    case 'fa':
      return 'fa-IR';
    case 'ar':
      return 'ar-SA';
    case 'zh':
      return 'zh-CN';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    case 'de':
      return 'de-DE';
    case 'es':
      return 'es-ES';
    case 'fr':
      return 'fr-FR';
    case 'ru':
      return 'ru-RU';
    case 'it':
      return 'it-IT';
    case 'pt':
      return 'pt-BR';
    case 'tr':
      return 'tr-TR';
    case 'nl':
      return 'nl-NL';
    case 'hi':
      return 'hi-IN';
    case 'en':
    default:
      return 'en-US';
  }
}

export default function GamepadPage() {
  const { t, locale, dir } = useTranslation();
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [connectedPadName, setConnectedPadName] = useState<string | null>(null);
  const [showWebHidHelp, setShowWebHidHelp] = useState(false);

  const testerLang = mapLocaleToTesterLang(locale);
  const [src, setSrc] = useState<string>(
    `/gamepad/index.html?theme=dark&lang=${encodeURIComponent(testerLang)}`
  );

  // Synchronize theme & language inside iframe
  const syncIframeTheme = useCallback(() => {
    try {
      localStorage.setItem('vueuse-color-scheme', 'dark');
      localStorage.setItem('lang', testerLang);
    } catch {}

    const frame = frameRef.current;
    if (!frame) return;

    try {
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (doc?.documentElement) {
        doc.documentElement.classList.add('dark');
        doc.documentElement.classList.remove('light');
      }
    } catch {
      // Cross-origin fallback
    }

    try {
      frame.contentWindow?.postMessage(
        { type: 'gd:theme', theme: 'dark' },
        window.location.origin
      );
    } catch {}
  }, [testerLang]);

  // Update language if site locale changes
  useEffect(() => {
    setSrc(`/gamepad/index.html?theme=dark&lang=${encodeURIComponent(testerLang)}`);
  }, [testerLang]);

  // Track physical controller connection in the parent page
  useEffect(() => {
    const checkPads = () => {
      if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
          const p = pads[i];
          if (p && p.connected) {
            setConnectedPadName(p.id || 'Connected Gamepad');
            return;
          }
        }
      }
      setConnectedPadName(null);
    };

    checkPads();
    const timer = setInterval(checkPads, 1200);

    const onConnect = (e: GamepadEvent) => {
      setConnectedPadName(e.gamepad.id || 'Connected Gamepad');
    };
    const onDisconnect = () => {
      checkPads();
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    return () => {
      clearInterval(timer);
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Reload the test frame to reset WebHID state or re-pair controller
  const handleReload = useCallback(() => {
    setIsReloading(true);
    setFrameLoaded(false);
    setSrc(`/gamepad/index.html?theme=dark&lang=${encodeURIComponent(testerLang)}&t=${Date.now()}`);
    setTimeout(() => {
      setIsReloading(false);
    }, 700);
  }, [testerLang]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-oled select-none text-text-primary">
      {/* Top Header Chrome styled with DrGame design system */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#070709]/90 px-3 backdrop-blur-xl sm:px-6">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/tools"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-0 ltr:rotate-180" />
            <span className="hidden sm:inline">{t('tools.backToTools')}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cosmic-purple/40 bg-cosmic-purple/15 text-cosmic-purple">
              <Gamepad2 className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{t('gamepad.page.title')}</span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cosmic-purple/20 text-purple-300 border border-purple-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  DualSense / DS4 / Xbox
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center/Right: Controller connection pill & Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Connection status pill */}
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-bold transition-all ${
              connectedPadName
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connectedPadName
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="max-w-[130px] sm:max-w-[200px] truncate" dir="auto">
              {connectedPadName ? connectedPadName : t('gamepad.page.waiting')}
            </span>
          </div>

          {/* WebHID Help Pill */}
          <button
            type="button"
            onClick={() => setShowWebHidHelp(!showWebHidHelp)}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            title="راهنمای اتصال و قابلیت‌ها"
          >
            <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">راهنما</span>
          </button>

          {/* Reload / Reconnect button */}
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="بارگذاری مجدد تست دسته"
            aria-label="بارگذاری مجدد تست دسته"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isReloading ? 'animate-spin text-cosmic-purple' : ''}`} />
            <span className="hidden sm:inline">اتصال مجدد</span>
          </button>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? t('gamepad.page.exitFullscreen')
                : t('gamepad.page.enterFullscreen')
            }
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* WebHID & Connection Quick Info banner (toggleable) */}
      {showWebHidHelp && (
        <div className="border-b border-white/10 bg-surface-card/95 px-4 py-3 text-xs text-slate-300 backdrop-blur-xl animate-in slide-in-from-top-2">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-white">
                  تست پیشرفته لرزش موتورها، تریگرهای تطبیقی، کالیبراسیون و باتری:
                </p>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  برای دسترسی به تنظیمات عمیق و کالیبراسیون آنالوگ در کنترلرهای DualSense و DualShock، از مرورگرهای بر پایه کرومیوم (Google Chrome، Microsoft Edge یا Brave) استفاده کرده و دکمه اتصال WebHID را داخل تستر تایید فرمایید.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowWebHidHelp(false)}
              className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white shrink-0 self-end md:self-auto"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* Main Testing Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden bg-oled">
        {/* Loading Spinner overlay while iframe loads initial assets */}
        {!frameLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-oled/80 backdrop-blur-md">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-cosmic-purple border-t-transparent shadow-neon-purple" />
            <p className="text-xs font-bold text-slate-300">در حال آماده‌سازی بستر تست دسته…</p>
          </div>
        )}

        <iframe
          ref={frameRef}
          src={src}
          title="DrGame DualSense & Gamepad Diagnostic Suite"
          className="h-full w-full border-0 bg-oled"
          allow="hid; gamepad; usb; serial; bluetooth; microphone; fullscreen"
          onLoad={() => {
            setFrameLoaded(true);
            syncIframeTheme();
          }}
        />
      </main>
    </div>
  );
}
