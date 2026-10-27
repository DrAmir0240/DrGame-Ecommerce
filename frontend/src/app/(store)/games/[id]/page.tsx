'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/apiClient';
import { GameDetail } from '@/types/game';
import DownloadBox from '@/components/games/DownloadBox';
import { useAuthStore } from '@/stores/useAuthStore';
import { getMediaUrl } from '@/lib/media';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Calendar,
  HardDrive,
  Users,
  Sparkles,
  Share2,
  Check,
  Download,
  Award,
  Building2,
  Gamepad2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params?.id as string;
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  // Voting state
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [inWishlist, setInWishlist] = useState(false);

  const fetchGame = async () => {
    try {
      const data = await apiRequest<GameDetail>(`/games/${gameId}`);
      setGame(data);
      setLikesCount(data.likes_count);
      setDislikesCount(data.dislikes_count);
      setUserVote(data.user_interaction || null);
      setInWishlist(data.in_wishlist);
    } catch (e) {
      console.error('Failed to fetch game details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGame();
    }
  }, [gameId, isAuthenticated]);

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await apiRequest<{
        likes_count: number;
        dislikes_count: number;
        user_interaction: 'like' | 'dislike' | null;
      }>(`/games/${gameId}/${type}`, { method: 'POST' });

      setLikesCount(res.likes_count);
      setDislikesCount(res.dislikes_count);
      setUserVote(res.user_interaction);
    } catch (e) {
      console.error(`Failed to vote ${type}:`, e);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await apiRequest<{ in_wishlist: boolean }>(`/games/${gameId}/wishlist`, {
        method: 'POST',
      });
      setInWishlist(res.in_wishlist);
    } catch (e) {
      console.error('Failed to toggle wishlist:', e);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const scrollToDownload = () => {
    const el = document.getElementById('download-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-28 text-center text-sm text-text-muted">
        <div className="w-8 h-8 border-2 border-cosmic-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        در حال بارگذاری اطلاعات سینمایی بازی...
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-28 text-center text-sm text-white">
        بازی مورد نظر یافت نشد.
      </div>
    );
  }

  const heroBanner = getMediaUrl(game.banner_image_url || game.cover_image_url);
  const heroCover = getMediaUrl(game.cover_image_url || game.banner_image_url);
  const playtimeEstimate = Math.round(game.download_size_gb > 60 ? 25 : 18);

  return (
    <div className="relative min-h-screen text-right space-y-12 pb-24">
      {/* ========================================================================= */}
      {/* 1. CINEMATIC HERO SECTION (Banner Image sits behind the Main Title Card) */}
      {/* ========================================================================= */}
      <section className="relative w-full overflow-hidden border-b border-white/10 bg-[#070a10]">
        {/* Backdrop Banner positioned strictly behind the title card */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {heroBanner && (
            <img
              src={heroBanner}
              alt={game.title_en}
              className="w-full h-full object-cover object-center filter brightness-40 scale-105"
            />
          )}
          {/* Atmospheric Cinematic Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-[#080b11]/85 to-[#080b11]/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080b11]/90 via-transparent to-[#080b11]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#080b11]/60 to-[#080b11]" />
        </div>

        {/* Main Title Card directly superimposed inside the Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-16">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-10 items-center md:items-start">
            {/* 3:4 Poster Cover */}
            <div className="w-56 sm:w-64 lg:w-72 shrink-0 rounded-3xl overflow-hidden glass-card border-2 border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] aspect-[3/4] group">
              {heroCover && (
                <img
                  src={heroCover}
                  alt={game.title_fa || game.title_en}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>

            {/* Game Info, Badges, Download CTA & Voting */}
            <div className="flex-1 space-y-5 text-center md:text-right w-full">
              {/* Top Tags: Genres + Multiplayer Status + Platforms */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {/* Genres */}
                {game.genres.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold"
                  >
                    {g}
                  </span>
                ))}

                {/* Multiplayer Status */}
                {game.is_two_player ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-purple-600/25 border border-purple-500/40 text-purple-200 text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>۲ نفره محلی (Co-op)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-text-secondary text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>تک‌نفره</span>
                  </span>
                )}

                {game.has_vr && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-600/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>واقعیت مجازی (VR)</span>
                  </span>
                )}

                {/* Platforms */}
                {game.platforms.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-bold font-roboto uppercase"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {/* Game Main Titles */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {game.title_fa || game.title_en}
                </h1>
                <p className="text-base sm:text-lg text-slate-400 font-roboto font-medium tracking-wide" dir="ltr">
                  {game.title_en}
                </p>
              </div>

              {/* Metrics Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 stroke-none" />
                  <span>امتیاز: {game.rating.toFixed(1)}</span>
                </div>
                {game.metacritic && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-text-muted">متامتریک:</span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold font-roboto">
                      {game.metacritic}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>حجم دیتا: {game.download_size_gb} GB</span>
                </div>
                {game.released && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="font-roboto">{game.released}</span>
                  </div>
                )}
              </div>

              {/* Primary Action: Direct Download CTA + Minimal Voting Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-4 border-t border-white/10">
                {/* Prominent Direct Scroll-to-Download Button */}
                <button
                  onClick={scrollToDownload}
                  className="flex items-center gap-2.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 group shrink-0"
                >
                  <Download className="w-4 h-4 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
                  <span>دانلود دیتای بازی</span>
                </button>

                {/* Minimal Like Button (Icon + Counter only) */}
                <button
                  onClick={() => handleVote('like')}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs font-bold font-roboto transition-all ${
                    userVote === 'like'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'glass-card border-white/10 text-white hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
                  title="پسندیدم"
                  aria-label="پسندیدم"
                >
                  <ThumbsUp className={`w-4 h-4 ${userVote === 'like' ? 'fill-emerald-400' : ''}`} />
                  <span>{likesCount}</span>
                </button>

                {/* Minimal Dislike Button (Icon + Counter only) */}
                <button
                  onClick={() => handleVote('dislike')}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs font-bold font-roboto transition-all ${
                    userVote === 'dislike'
                      ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'glass-card border-white/10 text-white hover:border-rose-500/30 hover:text-rose-400'
                  }`}
                  title="نپسندیدم"
                  aria-label="نپسندیدم"
                >
                  <ThumbsDown className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-rose-400' : ''}`} />
                  <span>{dislikesCount}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                    inWishlist
                      ? 'bg-nebula-violet border-nebula-violet text-white shadow-neon-purple'
                      : 'glass-card border-white/10 text-white hover:border-white/20'
                  }`}
                  title={inWishlist ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                  aria-label="علاقه‌مندی"
                >
                  <Bookmark className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl glass-card border border-white/10 text-text-secondary hover:text-white transition-all text-xs font-semibold"
                  title="اشتراک‌گذاری بازی"
                  aria-label="اشتراک‌گذاری"
                >
                  {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. GAME DETAILS (3-CARD GRID: جوایز و استودیو | ویژگی‌های بازی | داستان) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Section Header with Cyan Indicator */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
            <h2 className="text-xl sm:text-2xl font-black text-white">جزئیات بازی</h2>
          </div>
          <p className="text-xs text-text-muted mr-4 mt-1">خلاصه تدوین شده بازی</p>
        </div>

        {/* 3-Column Card Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* ───────────────────────────────────────────────────────────────── */}
          {/* Card 1 (Right): جوایز و استودیو (Studio & Awards)                  */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-[#0b0f17]/90 rounded-3xl border border-white/10 p-6 flex flex-col justify-between space-y-6 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div>
              {/* Center Capsule Tag */}
              <div className="flex justify-center mb-5">
                <span className="px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  جوایز و استودیو
                </span>
              </div>

              {/* Studio Block */}
              <div className="space-y-3">
                <span className="text-xs text-text-muted block font-medium">استودیوی سازنده</span>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-roboto">
                      {game.developer || 'Sony Interactive Entertainment'}
                    </h4>
                    <span className="text-[11px] text-text-muted block font-roboto">
                      {game.publisher || 'PlayStation Studios'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 my-5" />

              {/* Game Awards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>جوایز بازی</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  {game.awards && game.awards.length > 0 ? (
                    game.awards.map((award, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                        <span className="leading-relaxed">{award}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
                      <span>جایزه‌ای ثبت نشده است</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/5 my-5" />

              {/* Studio Honors */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>افتخارات استودیو</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">
                      خالق تحسین‌شده‌ترین فرانچایزهای انحصاری تاریخ کنسول‌های پلی‌استیشن
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                    <span className="leading-relaxed">
                      برنده جایزه برترین تیم توسعه فنی و روایتگری سینمایی
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* Card 2 (Middle): ویژگی‌های بازی (Features & Support)               */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-[#0b0f17]/90 rounded-3xl border border-white/10 p-6 flex flex-col justify-between space-y-5 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div>
              {/* Center Capsule Tag */}
              <div className="flex justify-center mb-3">
                <span className="px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  ویژگی‌های بازی
                </span>
              </div>

              <h3 className="text-center font-bold text-white text-sm mb-4">
                بازی از چه چیزهایی پشتیبانی می‌کند؟
              </h3>

              {/* Top Score Box (Metacritic & ESRB) */}
              <div className="rounded-2xl bg-[#070a10] border border-white/10 p-4 flex items-center justify-between mb-5">
                {/* Metacritic Score */}
                <div className="text-right">
                  <span className="text-[11px] text-text-muted block mb-1">امتیاز منتقدان</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-sm font-black font-roboto">
                      {game.metacritic || 86}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">متاکریتیک</span>
                  </div>
                </div>

                {/* ESRB Rating Badge */}
                <div className="text-left border-r border-white/10 pr-4">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-white text-black font-black text-[10px] font-roboto">
                      ESRB
                    </span>
                    <span className="text-xs text-white font-bold font-roboto">ESRB Teen</span>
                  </div>
                  <span className="text-[10px] text-text-muted block mt-1 font-roboto">
                    Blood • Violence • Language
                  </span>
                </div>
              </div>

              {/* Detailed Features List Rows */}
              <div className="space-y-3 text-xs">
                {/* DualSense */}
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">بازخورد لمسی DualSense</span>
                  <span className="text-emerald-400 font-bold">پشتیبانی می‌شود</span>
                </div>

                {/* VR */}
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">پشتیبانی از واقعیت مجازی</span>
                  <span className={game.has_vr ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {game.has_vr ? 'پشتیبانی می‌شود' : 'پشتیبانی نمی‌شود'}
                  </span>
                </div>

                {/* Online */}
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">بازی آنلاین</span>
                  <span className="text-slate-300 font-medium">
                    {game.is_two_player ? 'پشتیبانی می‌شود (تا ۴ نفر)' : 'ثبت نشده است'}
                  </span>
                </div>

                {/* Player count */}
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">تعداد بازیکن</span>
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs flex items-center justify-center font-roboto font-bold">
                    {game.is_two_player ? '2' : '1'}
                  </span>
                </div>

                {/* Playtime */}
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">مدت زمان بازی</span>
                  <div className="text-left">
                    <span className="text-white font-bold font-roboto">
                      {playtimeEstimate} ساعت داستان اصلی
                    </span>
                    <span className="text-[10px] text-text-muted block">
                      منبع زمان بازی: HowLongToBeat
                    </span>
                  </div>
                </div>

                {/* Age Rating */}
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">رده سنی</span>
                  <span className="text-slate-300 font-medium font-roboto">ESRB Teen (+16)</span>
                </div>

                {/* Platforms */}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400">پلتفرم‌ها</span>
                  <span className="text-slate-300 font-semibold font-roboto">
                    {game.platforms.join(' • ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* Card 3 (Left): داستان (Heart of the Game / Story)                  */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="bg-[#0b0f17]/90 rounded-3xl border border-white/10 p-6 flex flex-col justify-between space-y-4 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div>
              {/* Center Capsule Tag */}
              <div className="flex justify-center mb-3">
                <span className="px-4 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  قلب بازی
                </span>
              </div>

              <h3 className="text-center font-bold text-white text-base mb-4">داستان</h3>

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify whitespace-pre-line space-y-3 font-normal">
                <p>
                  {game.storyline_fa || game.description_fa || game.description_en}
                </p>
                {!game.storyline_fa && (
                  <p className="text-text-muted text-xs">
                    تجربه‌ای عمیق و سینمایی با گیم‌پلی استاندارد نسل نهم که بالاترین استانداردهای بصری و روایت داستانی را در اختیار بازیکنان قرار می‌دهد.
                  </p>
                )}
              </div>
            </div>

            {/* Subtle PS Embellishment */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-text-muted">
              <span>نسخه رسمی تایید شده پلی‌استیشن</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. GAMEPLAY SCREENSHOTS GALLERY                                           */}
      {/* ========================================================================= */}
      {game.screenshots && game.screenshots.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-purple-500 shadow-[0_0_12px_#a855f7]" />
            <h2 className="text-xl sm:text-2xl font-black text-white">تصاویر گیم‌پلی (Gameplay Screenshots)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {game.screenshots.map((src, index) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden glass-card border border-white/10 aspect-video group"
              >
                <img
                  src={getMediaUrl(src)}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. DOWNLOAD FILES SECTION (5-Part Packages & Console Download Guide)      */}
      {/* ========================================================================= */}
      <section id="download-section" className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-6 scroll-mt-24">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          <h2 className="text-xl sm:text-2xl font-black text-white">فایل‌ها</h2>
        </div>

        <DownloadBox links={game.download_links} gameTitle={game.title_fa || game.title_en} />
      </section>
    </div>
  );
}
