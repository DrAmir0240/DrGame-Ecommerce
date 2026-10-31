'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Download,
  Clock,
  HardDrive,
  Activity,
  LogOut,
  Tv,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Sparkles,
} from 'lucide-react';
import { GameCardItem } from '@/types/game';
import { apiRequest } from '@/lib/apiClient';
import { getMediaUrl } from '@/lib/media';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import { useTranslation } from '@/i18n';

interface ConsoleTvModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsoleTvMode({ isOpen, onClose }: ConsoleTvModeProps) {
  const router = useRouter();
  const { t, locale, dir } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();

  const [games, setGames] = useState<GameCardItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('21:40');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const lastGamepadInputRef = useRef<number>(0);

  // Live Clock formatted according to active locale
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

  // Fetch games catalog strictly from the backend API (NO mock data)
  const loadGamesFromBackend = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ items: GameCardItem[]; total: number } | GameCardItem[]>(
        '/games?page=1&page_size=50'
      );

      let fetchedItems: GameCardItem[] = [];
      if (Array.isArray(res)) {
        fetchedItems = res;
      } else if (res && Array.isArray((res as any).items)) {
        fetchedItems = (res as any).items;
      }

      setGames(fetchedItems);
      setSelectedIdx(0);
    } catch (err: any) {
      console.error('Failed to load games from backend API in TV Mode:', err);
      setError(err?.message || 'Error communicating with games server');
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    loadGamesFromBackend();

    if (isAuthenticated) {
      fetchQuota();
    }
  }, [isOpen, isAuthenticated]);

  // Lock background scroll when TV Mode is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keep active card centered in the carousel view
  useEffect(() => {
    if (!carouselRef.current || games.length === 0) return;
    const activeEl = carouselRef.current.children[selectedIdx] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedIdx, games.length]);

  // Spatial Keyboard Navigation (Arrow Keys, Enter, Escape)
  useEffect(() => {
    if (!isOpen || games.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (dir === 'rtl') {
          setSelectedIdx((prev) => Math.max(0, prev - 1));
        } else {
          setSelectedIdx((prev) => Math.min(games.length - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (dir === 'rtl') {
          setSelectedIdx((prev) => Math.min(games.length - 1, prev + 1));
        } else {
          setSelectedIdx((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeGame = games[selectedIdx];
        if (activeGame) {
          onClose();
          router.push(`/games/${activeGame.id}`);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, games, selectedIdx, router, onClose, dir]);

  // Gamepad Loop for 10-foot Console Navigation
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;

    const scanGamepad = () => {
      const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads ? gamepads[0] : null;

      if (gp) {
        const now = Date.now();
        if (now - lastGamepadInputRef.current > 200) {
          const dpadLeft = gp.buttons[14]?.pressed || (gp.axes[0] && gp.axes[0] < -0.5);
          const dpadRight = gp.buttons[15]?.pressed || (gp.axes[0] && gp.axes[0] > 0.5);
          const btnCross = gp.buttons[0]?.pressed; // Cross (Select)
          const btnCircle = gp.buttons[1]?.pressed; // Circle (Back / Exit)
          const btnSquare = gp.buttons[2]?.pressed; // Square (Options / Subscriptions)
          const btnTriangle = gp.buttons[3]?.pressed; // Triangle (Search / Catalog)

          if (dpadRight && games.length > 0) {
            if (dir === 'rtl') {
              setSelectedIdx((prev) => Math.max(0, prev - 1));
            } else {
              setSelectedIdx((prev) => Math.min(games.length - 1, prev + 1));
            }
            lastGamepadInputRef.current = now;
          } else if (dpadLeft && games.length > 0) {
            if (dir === 'rtl') {
              setSelectedIdx((prev) => Math.min(games.length - 1, prev + 1));
            } else {
              setSelectedIdx((prev) => Math.max(0, prev - 1));
            }
            lastGamepadInputRef.current = now;
          } else if (btnCross && games.length > 0) {
            const activeGame = games[selectedIdx];
            if (activeGame) {
              onClose();
              router.push(`/games/${activeGame.id}`);
            }
            lastGamepadInputRef.current = now;
          } else if (btnCircle) {
            onClose();
            lastGamepadInputRef.current = now;
          } else if (btnTriangle) {
            onClose();
            router.push('/games');
            lastGamepadInputRef.current = now;
          } else if (btnSquare) {
            onClose();
            router.push('/subscriptions');
            lastGamepadInputRef.current = now;
          }
        }
      }

      animId = requestAnimationFrame(scanGamepad);
    };

    animId = requestAnimationFrame(scanGamepad);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, games, selectedIdx, router, onClose, dir]);

  if (!isOpen) return null;

  const activeGame = games[selectedIdx] || null;
  const activeAny = activeGame as any;
  const coverUrl = activeAny?.banner_image_url || activeGame?.cover_image_url
    ? getMediaUrl(activeAny?.banner_image_url || activeGame?.cover_image_url || '')
    : null;

  // Estimate download time based on size (at average 25 Mbps = ~3.1 MB/s)
  const sizeGb = activeGame?.download_size_gb;
  const estimatedHours = sizeGb ? (sizeGb / (25 * 0.12 * 3.6)).toFixed(1) : null;
  const remainingQuota = quota
    ? `${quota.remaining_quota_gb} GB`
    : isAuthenticated
      ? t('tv.noSubscription')
      : t('tv.login');

  const mainTitle = activeGame
    ? locale === 'en'
      ? activeGame.title_en || activeGame.title_fa
      : activeGame.title_fa || activeGame.title_en
    : '';

  const subtitleEn = activeGame
    ? locale === 'en'
      ? activeGame.title_fa !== activeGame.title_en ? activeGame.title_fa : null
      : activeGame.title_en
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#05070c] text-white flex flex-col justify-between overflow-hidden font-vazir select-none animate-in fade-in duration-300"
      dir={dir}
    >
      {/* ─────────────────────────────────────────────────────────────────────────
          1. IMMERSIVE BACKDROP (Cinematic 10-Foot Background with Dynamic Blur)
         ───────────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {coverUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
            style={{
              backgroundImage: `url(${coverUrl})`,
              filter: 'brightness(0.35) saturate(1.25)',
            }}
          />
        )}
        {/* Deep PS Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-[#05070c]/75 to-[#05070c]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070c] via-[#05070c]/85 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,0.25)_0%,transparent_60%)]" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. TOP BAR (User Profile, Live Clock, Quota, Exit TV Button, Logo)
         ───────────────────────────────────────────────────────────────────────── */}
      <header className="relative z-20 px-6 sm:px-12 py-5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        {/* Right Section (in RTL): Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.5)] flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white font-roboto">DrGame</span>
              <span className="px-2 py-0.2 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] text-purple-300 font-bold">
                Nebula Console
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">{t('tv.brandSubtitle')}</span>
          </div>
        </div>

        {/* Left Section (in RTL): User Badge, Clock, Quota, Exit Button */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Exit TV Mode Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 font-bold text-xs transition-all cursor-pointer shadow-lg active:scale-95"
            title={`${t('tv.exitTv')} (Esc)`}
          >
            <LogOut className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>{t('tv.exitTv')}</span>
          </button>

          {/* Quota Capsule */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200 font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span className="font-roboto tracking-wide" dir="ltr">
              {remainingQuota}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>

          {/* Live Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold font-mono text-slate-200">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime}</span>
          </div>

          {/* User Avatar Circle */}
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-700 to-pink-600 border border-white/20 p-0.5 flex items-center justify-center font-bold text-white text-sm shadow-md">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span>{user?.username ? user.username.slice(0, 2).toUpperCase() : 'DG'}</span>
            )}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. MAIN STAGE (Hero Details from Real Backend Data)
         ───────────────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 px-6 sm:px-14 flex-1 flex flex-col justify-end pb-4 pt-6 max-w-7xl">
        {isLoading ? (
          <div className="space-y-4 max-w-xl py-16 animate-pulse">
            <div className="flex items-center gap-3 text-purple-300 text-sm font-bold">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span>{t('tv.loadingGames')}</span>
            </div>
            <div className="h-10 w-3/4 rounded-2xl bg-white/10" />
            <div className="h-4 w-1/2 rounded-xl bg-white/5" />
          </div>
        ) : error && games.length === 0 ? (
          <div className="space-y-4 max-w-xl py-12">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadGamesFromBackend}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('tv.retryGames')}</span>
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="space-y-3 max-w-xl py-12">
            <h2 className="text-xl font-bold text-white">{t('tv.noGamesTitle')}</h2>
            <p className="text-xs text-slate-400">{t('tv.noGamesDesc')}</p>
          </div>
        ) : activeGame ? (
          <div className="space-y-4 max-w-2xl">
            {/* Tags row: Platforms + Genres + Co-op + Rating */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Dynamic Platforms */}
              {(activeGame.platforms && activeGame.platforms.length > 0
                ? activeGame.platforms
                : ['PS5', 'PS4']
              ).map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-0.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono text-xs font-black uppercase"
                >
                  {p}
                </span>
              ))}

              {/* Dynamic Genres */}
              {(activeGame.genres || []).slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold"
                >
                  {g}
                </span>
              ))}

              {/* Multiplayer / Co-op */}
              {activeGame.is_two_player && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('tv.twoPlayerLocal')}</span>
                </span>
              )}

              {/* VR */}
              {activeGame.has_vr && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>VR</span>
                </span>
              )}

              {/* Rating */}
              {activeGame.rating > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-roboto text-xs font-black">
                  ★ {activeGame.rating.toFixed(1)}
                </span>
              )}

              {/* Metacritic */}
              {activeGame.metacritic && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-roboto text-xs font-bold">
                  {t('tv.metaScore')}: {activeGame.metacritic}
                </span>
              )}
            </div>

            {/* Main Title (Localized) */}
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
                {mainTitle}
              </h1>
              {subtitleEn && (
                <p className="text-sm sm:text-lg text-slate-300 font-roboto font-medium mt-1 tracking-wide" dir="ltr">
                  {subtitleEn}
                </p>
              )}
            </div>

            {/* Meta line: Download size & time estimate */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-medium">
              {activeGame.download_size_gb > 0 && (
                <>
                  <span className="font-roboto font-bold text-white text-base">
                    {activeGame.download_size_gb} GB
                  </span>
                  {estimatedHours && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span>
                        ~{estimatedHours} {t('tv.estHours')}
                      </span>
                    </>
                  )}
                </>
              )}
              {activeGame.released && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-roboto">
                    {t('tv.released')}: {activeGame.released}
                  </span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  router.push(`/games/${activeGame.id}`);
                }}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>{t('tv.sendToConsole')}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push(`/games/${activeGame.id}`);
                }}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                {t('tv.detailsAndParts')}
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. HORIZONTAL CAROUSEL (Real Backend Games Strip)
         ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative z-20 px-6 sm:px-12 py-3">
        {isLoading ? (
          <div className="flex items-center gap-3 py-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-[125px] sm:w-[150px] aspect-[4/3] rounded-2xl bg-white/5 border border-white/10 animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : games.length === 0 ? null : (
          <div
            ref={carouselRef}
            className="flex items-center gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {games.map((game, idx) => {
              const isFocused = idx === selectedIdx;
              const cardImg = game.cover_image_url
                ? getMediaUrl(game.cover_image_url)
                : '/logo.png';
              const cardTitle =
                locale === 'en'
                  ? game.title_en || game.title_fa
                  : game.title_fa || game.title_en;

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative group rounded-2xl overflow-hidden transition-all duration-300 shrink-0 w-[125px] sm:w-[150px] aspect-[4/3] sm:aspect-[16/10] cursor-pointer ${
                    isFocused
                      ? 'ring-2 ring-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.85)] scale-105 z-10'
                      : 'opacity-70 hover:opacity-100 border border-white/10 hover:border-white/30 scale-95'
                  }`}
                >
                  <img
                    src={cardImg}
                    alt={cardTitle}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

                  {/* Little Green Download Indicator on top-left */}
                  {game.download_size_gb > 0 && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-md">
                      <Download className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-2 inset-x-2 text-center">
                    <span className="text-[11px] font-bold text-white line-clamp-1 drop-shadow-md">
                      {cardTitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Network and Server Ping strip (under carousel) */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2 font-mono" dir="ltr">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-sans">{t('tv.serverStatus')}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-cyan-300">
            <Activity className="w-3.5 h-3.5" />
            <span>19.6 Mbps</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-emerald-300">
            <span>11 ms</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. FIXED BOTTOM MENU BAR (Exact pixel-matching controller bar from photo)
         ───────────────────────────────────────────────────────────────────────── */}
      <footer className="relative z-30 bg-[#0a0d14]/95 border-t border-purple-500/30 backdrop-blur-xl px-6 sm:px-12 py-3 flex items-center justify-between text-xs shadow-2xl">
        {/* Left: TV Mode Icon + Title */}
        <div className="flex items-center gap-2 text-slate-300">
          <Tv className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-white hidden sm:inline">{t('tv.modeTitle')}</span>
        </div>

        {/* Right (RTL): Controller Buttons Guide */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-end font-medium text-[11px] sm:text-xs">
          {/* D-Pad Arrows: Move */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-bold text-[10px] font-mono">
              ← →
            </span>
            <span className="text-white">{t('tv.move')}</span>
          </div>

          {/* Square: Options */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-400/60 text-pink-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(236,72,153,0.4)]">
              □
            </span>
            <span className="text-white">{t('tv.options')}</span>
          </div>

          {/* Triangle: Search */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              △
            </span>
            <span className="text-white">{t('tv.search')}</span>
          </div>

          {/* Circle: Back */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-400/60 text-rose-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              ○
            </span>
            <span className="text-white">{t('tv.back')}</span>
          </div>

          {/* Cross: Select */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/60 text-blue-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(59,130,246,0.4)]">
              ✕
            </span>
            <span className="text-white font-bold">{t('tv.select')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
