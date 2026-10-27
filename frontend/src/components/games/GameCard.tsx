'use client';

import React from 'react';
import Link from 'next/link';
import { GameCardItem } from '@/types/game';
import { getMediaUrl } from '@/lib/media';
import PlatformIcon from './PlatformIcons';

interface GameCardProps {
  game: GameCardItem;
}

export default function GameCard({ game }: GameCardProps) {
  const title = game.title_fa || game.title_en;

  // Normalize platforms list
  const platforms = (game.platforms && game.platforms.length > 0)
    ? game.platforms
    : ['PS5', 'PS4'];

  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex flex-col rounded-2xl overflow-hidden bg-[#0d121f] border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all duration-300 hover:-translate-y-1.5"
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
            بدون کاور
          </div>
        )}

        {/* Subtle Bottom Shadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-transparent to-transparent opacity-80" />

        {/* Rating Badge (top-right) */}
        {game.rating > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-amber-300 text-[10px] font-bold font-roboto">
            ★ {game.rating.toFixed(1)}
          </div>
        )}

        {/* Download Size (top-left) */}
        {game.download_size_gb > 0 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-cyan-300 text-[10px] font-bold font-roboto">
            {game.download_size_gb} GB
          </div>
        )}
      </div>

      {/* Card Info Section matching games.jpg */}
      <div className="p-3 flex flex-col justify-between flex-1 text-right gap-2">
        {/* Persian Title */}
        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
          {title}
        </h3>

        {/* Bottom Row: Platform Icons + Status Badge ("منتشر شده") */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
          {/* Platforms Icons */}
          <div className="flex items-center gap-1.5">
            {platforms.slice(0, 3).map((plat, idx) => (
              <PlatformIcon key={idx} platform={plat} size={15} />
            ))}
          </div>

          {/* Status Badge */}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            منتشر شده
          </span>
        </div>
      </div>
    </Link>
  );
}
