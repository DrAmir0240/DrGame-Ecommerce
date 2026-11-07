'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { GameCardItem } from '@/types/game';
import GameCard from '@/components/games/GameCard';
import { useTranslation } from '@/i18n';

interface GameCarouselProps {
  title: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  games: GameCardItem[];
  emptyMessage?: string;
}

export default function GameCarousel({
  title,
  icon,
  viewAllHref,
  games,
  emptyMessage,
}: GameCarouselProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!games || games.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-5 sm:py-6">
      {/* Header with Title, View All, and Arrows */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-cosmic-purple/20 border border-cosmic-purple/30 text-cosmic-purple flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-white transition-colors pl-2"
            >
              <span>{t('common.viewAll')}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll('right')}
              aria-label={t('chrome.scrollRight')}
              data-no-gamepad="true"
              tabIndex={-1}
              className="w-8 h-8 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/50 text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('left')}
              aria-label={t('chrome.scrollLeft')}
              data-no-gamepad="true"
              tabIndex={-1}
              className="w-8 h-8 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/50 text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        data-carousel-track="true"
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game) => (
          <div key={game.id} className="w-[160px] xs:w-[185px] sm:w-[215px] md:w-[230px] 2xl:w-[250px] shrink-0">
            <GameCard game={game} />
          </div>
        ))}
      </div>
    </div>
  );
}
