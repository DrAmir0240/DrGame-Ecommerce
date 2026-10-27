'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Info, Star, Users, Glasses, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  rating: number;
  backdropUrl: string;
  consoles: string[];
  isTwoPlayer: boolean;
  isVr: boolean;
  genres: string[];
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: '1',
    slug: 'god-of-war-ragnarok',
    title: 'خدای جنگ: رگناروک',
    subtitle: 'God of War Ragnarök',
    description:
      'همراه با کریتوس و آترئوس به سفری اسطوره‌ای در میان ۹ قلمرو اسکاندیناوی بروید؛ در حالی که نیروهای آسگارد برای نبردی پیشگویی‌شده آماده می‌شوند.',
    rating: 4.9,
    backdropUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    consoles: ['ps5', 'ps4'],
    isTwoPlayer: false,
    isVr: false,
    genres: ['اکشن', 'ماجراجویی', 'اسطوره‌ای'],
  },
  {
    id: '2',
    slug: 'marvels-spider-man-2',
    title: 'اسپایدرمن ۲ مارول',
    subtitle: "Marvel's Spider-Man 2",
    description:
      'پیتر پارکر و مایلز مورالس بازگشته‌اند تا با ونوم هولناک و کریون شکارچی در خیابان‌های نیویورک مبارزه کنند. تجربه خارق‌العاده لودینگ فوق‌سریع SSD پلی‌استیشن ۵.',
    rating: 4.8,
    backdropUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=1600&auto=format&fit=crop&q=80',
    consoles: ['ps5'],
    isTwoPlayer: false,
    isVr: false,
    genres: ['اکشن', 'ابرقهرمانی', 'جهان‌باز'],
  },
  {
    id: '3',
    slug: 'horizon-call-of-the-mountain',
    title: 'هورایزن: ندای کوهستان VR',
    subtitle: 'Horizon Call of the Mountain',
    description:
      'غوطه‌وری تمام‌عیار در دنیای هورایزن با هدست واقعیت مجازی PSVR2؛ با کمان تیراندازی کنید، از قله‌های مرتفع بالا بروید و با ماشین‌های غول‌پیکر روبرو شوید.',
    rating: 4.7,
    backdropUrl: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1600&auto=format&fit=crop&q=80',
    consoles: ['ps5', 'psvr2'],
    isTwoPlayer: false,
    isVr: true,
    genres: ['واقعیت مجازی', 'اکشن', 'ماجراجویی'],
  },
];

const consoleIconMap: Record<string, { src: string; name: string }> = {
  ps5: { src: '/platforms/ps5-white.png', name: 'پلی‌استیشن ۵' },
  ps4: { src: '/platforms/ps4-white.png', name: 'پلی‌استیشن ۴' },
  psvr2: { src: '/platforms/psvr-white.png', name: 'PS VR' },
  switch: { src: '/platforms/nintendo.png', name: 'نینتندو سوییچ' },
  xbox360: { src: '/platforms/xbox.png', name: 'ایکس‌باکس' },
  xbox: { src: '/platforms/xbox.png', name: 'ایکس‌باکس' },
};

export default function HeroShowcase() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentIdx];

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8">
      <div className="relative rounded-3xl overflow-hidden min-h-[480px] sm:min-h-[520px] flex items-end border border-white/10 shadow-2xl bg-surface-base">
        {/* Background Image with Cinematic Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{ backgroundImage: `url(${slide.backdropUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-oled via-oled/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-oled via-oled/40 to-transparent" />

        {/* Slide Content */}
        <div className="relative z-10 p-6 sm:p-12 max-w-3xl space-y-4">
          {/* Tags & Consoles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Console SVGs */}
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl border border-white/15">
              {slide.consoles.map((c) => {
                const info = consoleIconMap[c] || { src: '/ps5.svg', name: c };
                return (
                  <img
                    key={c}
                    src={info.src}
                    alt={info.name}
                    title={info.name}
                    className="w-5 h-5 object-contain"
                  />
                );
              })}
            </div>

            {slide.isVr && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                <Glasses className="w-3.5 h-3.5" />
                <span>VR Supported</span>
              </span>
            )}

            {slide.isTwoPlayer && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>دو نفره (Co-op)</span>
              </span>
            )}

            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-xl border border-amber-500/30 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{slide.rating}</span>
            </div>
          </div>

          {/* Titles */}
          <div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              {slide.title}
            </h2>
            <span className="text-sm sm:text-base text-text-muted font-mono tracking-wider block mt-1">
              {slide.subtitle}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed line-clamp-3 max-w-2xl">
            {slide.description}
          </p>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/games/${slide.slug}`}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-cosmic-gradient hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-neon-purple transition-all"
            >
              <Download className="w-4 h-4" />
              <span>دانلود مستقیم دیتای بازی</span>
            </Link>

            <Link
              href={`/games/${slide.slug}`}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl glass-card border border-white/10 hover:border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              <Info className="w-4 h-4" />
              <span>مشاهده جزئیات و پارت‌ها</span>
            </Link>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="absolute left-6 bottom-6 z-20 flex items-center gap-2">
          <button
            onClick={prevSlide}
            aria-label="اسلاید قبلی"
            className="w-10 h-10 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/50 text-white flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="اسلاید بعدی"
            className="w-10 h-10 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/50 text-white flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="absolute right-6 top-6 z-20 flex items-center gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIdx ? 'w-8 bg-cosmic-purple shadow-neon-purple' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
