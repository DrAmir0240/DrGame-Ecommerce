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
  Wrench,
  ShieldCheck,
  Gamepad2,
  ArrowRight,
} from 'lucide-react';

interface GameSlide {
  id: string;
  badge: string;
  titleFa: string;
  titleEn: string;
  description: string;
  rating: number;
  backdropUrl: string;
  platforms: string[];
  linkHref: string;
  ctaText: string;
}

interface ServiceSlide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  backdropUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  linkHref: string;
  ctaText: string;
}

const FEATURED_GAME_SLIDES: GameSlide[] = [
  {
    id: '1',
    badge: 'بازی منتخب ماه',
    titleFa: 'خدای جنگ: رگناروک',
    titleEn: 'God of War Ragnarök',
    description:
      'همراه با کریتوس و آترئوس به سفری اسطوره‌ای در میان ۹ قلمرو اسکاندیناوی بروید؛ نبردی نفس‌گیر با خدایان آسگارد با کیفیت خیره‌کننده 4K بر روی پلی‌استیشن.',
    rating: 4.9,
    backdropUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    platforms: ['PS5', 'PS4'],
    linkHref: '/games/1',
    ctaText: 'مشاهده جزئیات و دانلود',
  },
  {
    id: '2',
    badge: 'جدیدترین عنوان اکشن',
    titleFa: 'اسپایدرمن ۲ مارول',
    titleEn: "Marvel's Spider-Man 2",
    description:
      'پیتر پارکر و مایلز مورالس بازگشته‌اند تا با ونوم هولناک در خیابان‌های نیویورک مبارزه کنند. تجربه لودینگ آنی SSD و قابلیت‌های DualSense پلی‌استیشن ۵.',
    rating: 4.8,
    backdropUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1600&auto=format&fit=crop&q=80',
    platforms: ['PS5'],
    linkHref: '/games/2',
    ctaText: 'دانلود مستقیم دیتا',
  },
  {
    id: '3',
    badge: 'شاهکار واقعیت مجازی',
    titleFa: 'هورایزن: ندای کوهستان VR',
    titleEn: 'Horizon Call of the Mountain',
    description:
      'غوطه‌وری تمام‌عیار در دنیای هورایزن با هدست واقعیت مجازی PSVR2؛ با کمان تیراندازی کنید، از قله‌های مرتفع بالا بروید و با ربات‌های غول‌پیکر روبرو شوید.',
    rating: 4.7,
    backdropUrl: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1600&auto=format&fit=crop&q=80',
    platforms: ['PS5', 'PSVR2'],
    linkHref: '/games/3',
    ctaText: 'مشاهده و دانلود دیتا',
  },
];

const SERVICE_SLIDES: ServiceSlide[] = [
  {
    id: '1',
    badge: 'تخفیف ویژه دوره‌ای',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'اشتراک‌های طلایی ۳ و ۶ ماهه با تا ۲۰٪ تخفیف',
    description:
      'دسترسی نامحدود به بیش از ۳۰۰ عنوان بازی کنسول، بدون قطعی سرعت و با محاسبه ۵۰٪ ترافیک نیم‌بهاء مخابراتی برای تمامی اپراتورها.',
    backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
    icon: Zap,
    linkHref: '/subscriptions',
    ctaText: 'مشاهده پلن‌های تخفیف‌دار',
  },
  {
    id: '2',
    badge: 'اتصال بدون تحریم کنسول',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    title: 'DNS اختصاصی و ابزارهای تست کنترلر دکتر گیم',
    description:
      'برای ورود بدون فیلتر و کاهش پینگ آنلاین کنسول‌های پلی‌استیشن، از DNS اختصاصی دکتر گیم و ابزارهای جیلبریک در بخش ابزارها استفاده کنید.',
    backdropUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1600&auto=format&fit=crop&q=80',
    icon: Wrench,
    linkHref: '/tools',
    ctaText: 'ورود به بخش ابزارها',
  },
  {
    id: '3',
    badge: 'بومی‌سازی اختصاصی',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'دوبله فارسی و زیرنویس اختصاصی بازی‌های برتر',
    description:
      'تجربه‌ای متفاوت از داستان‌سرایی بازی‌ها با صوت‌های دوبله حرفه‌ای فارسی و زیرنویس‌های هماهنگ با کنسول بدون نیاز به نرم‌افزار جانبی.',
    backdropUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&auto=format&fit=crop&q=80',
    icon: Sparkles,
    linkHref: '/games',
    ctaText: 'جستجوی بازی‌های فارسی',
  },
];

export default function DoubleHeroBanners() {
  const [gameIdx, setGameIdx] = useState(0);
  const [serviceIdx, setServiceIdx] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [isServicePaused, setIsServicePaused] = useState(false);

  // Auto-play for game banner (6 seconds interval, pauses on hover)
  useEffect(() => {
    if (isGamePaused) return;
    const timer = setInterval(() => {
      setGameIdx((prev) => (prev + 1) % FEATURED_GAME_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isGamePaused]);

  // Auto-play for service banner (7 seconds interval, pauses on hover)
  useEffect(() => {
    if (isServicePaused) return;
    const timer = setInterval(() => {
      setServiceIdx((prev) => (prev + 1) % SERVICE_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isServicePaused]);

  const activeGame = FEATURED_GAME_SLIDES[gameIdx];
  const activeService = SERVICE_SLIDES[serviceIdx];

  return (
    <section className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-6 space-y-5 font-vazir text-right">
      
      {/* =========================================================================
          BANNER 1 (TOP): FEATURED AAA GAMES SLIDER (2/3 Height ~320px)
         ========================================================================= */}
      <div
        onMouseEnter={() => setIsGamePaused(true)}
        onMouseLeave={() => setIsGamePaused(false)}
        className="relative rounded-3xl overflow-hidden h-72 sm:h-80 md:h-[320px] flex items-end border border-white/10 shadow-2xl bg-[#080b12] group"
      >
        {/* Background Image with Cinematic Gradient Overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{ backgroundImage: `url(${activeGame.backdropUrl})` }}
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
                <span>{activeGame.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                {activeGame.platforms.map((p) => (
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
                {activeGame.titleFa}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-roboto" dir="ltr">
                {activeGame.titleEn}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 max-w-xl">
              {activeGame.description}
            </p>
          </div>

          {/* Action & Nav Controls */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-end">
            <Link
              href={activeGame.linkHref}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{activeGame.ctaText}</span>
            </Link>

            {/* Arrows */}
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              <button
                onClick={() =>
                  setGameIdx(
                    (prev) => (prev - 1 + FEATURED_GAME_SLIDES.length) % FEATURED_GAME_SLIDES.length
                  )
                }
                className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                aria-label="اسلاید قبلی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGameIdx((prev) => (prev + 1) % FEATURED_GAME_SLIDES.length)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                aria-label="اسلاید بعدی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
          {FEATURED_GAME_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setGameIdx(idx)}
              className={`h-1.5 rounded-full transition-all ${
                gameIdx === idx ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`رفتن به اسلاید ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* =========================================================================
          BANNER 2 (BOTTOM): PLATFORM OFFERS & TOOLS SLIDER (2/3 Height ~320px)
         ========================================================================= */}
      <div
        onMouseEnter={() => setIsServicePaused(true)}
        onMouseLeave={() => setIsServicePaused(false)}
        className="relative rounded-3xl overflow-hidden h-72 sm:h-80 md:h-[320px] flex items-end border border-white/10 shadow-2xl bg-[#090b14] group"
      >
        {/* Background Image with Amber/Purple Tint Gradient */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{ backgroundImage: `url(${activeService.backdropUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-[#090b14]/85 to-[#090b14]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090b14]/90 via-transparent to-[#090b14]/70" />

        {/* Slide Content */}
        <div className="relative z-10 p-5 sm:p-7 md:p-8 w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            {/* Service Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${activeService.badgeColor}`}>
                {activeService.badge}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-text-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>سرورهای اختصاصی نیم‌بهاء ایران</span>
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              {activeService.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 max-w-xl">
              {activeService.description}
            </p>
          </div>

          {/* Action & Nav Controls */}
          <div className="flex items-center gap-3 shrink-0 self-end md:self-end">
            <Link
              href={activeService.linkHref}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
              <span>{activeService.ctaText}</span>
            </Link>

            {/* Arrows */}
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-2xl p-1 border border-white/10">
              <button
                onClick={() =>
                  setServiceIdx(
                    (prev) => (prev - 1 + SERVICE_SLIDES.length) % SERVICE_SLIDES.length
                  )
                }
                className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                aria-label="اسلاید قبلی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setServiceIdx((prev) => (prev + 1) % SERVICE_SLIDES.length)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white transition-colors"
                aria-label="اسلاید بعدی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
          {SERVICE_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setServiceIdx(idx)}
              className={`h-1.5 rounded-full transition-all ${
                serviceIdx === idx ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`رفتن به اسلاید ${idx + 1}`}
            />
          ))}
        </div>
      </div>

    </section>
  );
}
