'use client';

import React from 'react';
import Link from 'next/link';
import { GameCardItem } from '@/types/game';
import { getMediaUrl } from '@/lib/media';
import { useTranslation, localizedField } from '@/i18n';

interface GameCardProps {
  game: GameCardItem;
}

function getPlatformBadgeText(plat: string): string {
  const p = (plat || '').toLowerCase().trim();
  if (p.includes('ps5') || p === 'playstation 5') return 'PS5';
  if (p.includes('ps4') || p === 'playstation 4') return 'PS4';
  if (p.includes('vr') || p.includes('psvr')) return 'PS VR';
  if (p.includes('xbox')) return 'XBOX';
  if (p.includes('switch') || p.includes('nintendo')) return 'NINTENDO';
  if (p === 'pc' || p.includes('windows') || p.includes('microsoft')) return '';
  return plat.toUpperCase();
}

export default function GameCard({ game }: GameCardProps) {
  const { locale, dir, t, n, size } = useTranslation();
  // Backend-localized title: title_i18n → title_fa/en/ar → title
  const title = localizedField(game, 'title', locale) || game.title_en || game.title_fa;

  // Normalize platforms list
  const platforms = (game.platforms && game.platforms.length > 0)
    ? game.platforms
    : ['PS5', 'PS4'];

  const isReleased = game.released && game.released <= new Date().toISOString().split('T')[0];
  const releasedText = t('gameCard.released');
  const earlyAccessText = t('gameCard.earlyAccess');

  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-[#0d121f] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all duration-300 hover:-translate-y-1.5"
    >
      {/* 3:4 Vertical Aspect Ratio Cover Image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#141b2d]">
        {game.cover_image_url ? (
          <img
            src={getMediaUrl(game.cover_image_url)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
            {t('games.noCover')}
          </div>
        )}

        {/* Subtle Bottom Shadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-transparent to-transparent opacity-80" />

        {/* Rating Badge (top-right) */}
        {game.rating > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-amber-300 text-[10px] font-bold font-roboto">
            ★ {n(game.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
        )}

        {/* Download Size (top-left) */}
        {game.download_size_gb > 0 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-purple-300 text-[10px] font-bold font-roboto">
            {size(game.download_size_gb)}
          </div>
        )}
      </div>

      {/* Card Info Section */}
      <div className={`p-3 flex flex-col justify-between flex-1 gap-2 ${dir === 'rtl' ? 'text-start' : 'text-left'}`}>
        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
          {title}
        </h3>

        {/* Bottom Row: Platform Text Badges + Status Badge */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
          {/* Platforms Text Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            {platforms
              .map(getPlatformBadgeText)
              .filter(Boolean)
              .slice(0, 3)
              .map((badge, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded text-[9px] font-black font-roboto tracking-wider bg-white/5 border border-white/10 text-white/80"
                >
                  {badge}
                </span>
              ))}
          </div>

          {/* Status Badge */}
          {isReleased ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
              {releasedText}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
              {earlyAccessText}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
