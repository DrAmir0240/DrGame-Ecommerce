"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Star, Download, Play, ShoppingCart, Check } from "lucide-react";
import { useApp } from "@/lib/app";
import type { Game } from "@/lib/data";

interface GameCardProps {
  game: Game;
  previewScreenshots?: string[];
  previewVideo?: string;
  isOwned?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  previewScreenshots = [],
  previewVideo,
  isOwned = false,
}) => {
  const { t, n } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cycleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const images = previewScreenshots.length > 0 ? [game.image, ...previewScreenshots] : [game.image];

  const handleMouseEnter = () => {
    // 180ms hover delay threshold to prevent accidental triggers while scrolling
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);

      // Cycle screenshots every 1900ms if multiple available
      if (images.length > 1) {
        cycleIntervalRef.current = setInterval(() => {
          setActiveImageIndex((prev) => (prev + 1) % images.length);
        }, 1900);
      }
    }, 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (cycleIntervalRef.current) {
      clearInterval(cycleIntervalRef.current);
      cycleIntervalRef.current = null;
    }
    setIsHovered(false);
    setActiveImageIndex(0);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (cycleIntervalRef.current) clearInterval(cycleIntervalRef.current);
    };
  }, []);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-[16px] bg-[#181a27] border border-white/[0.08] overflow-hidden transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/15 ${
        isHovered ? "scale-[1.03] z-20" : "scale-100 z-10"
      }`}
    >
      <Link href={`/shop/${game.slug}`} className="block relative aspect-[3/4] w-full overflow-hidden bg-[#101116]">
        {/* Main Cover Image */}
        <img
          src={images[activeImageIndex] || game.image}
          alt={game.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 z-10">
          <div className="flex items-center gap-1">
            {game.platforms.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-extrabold text-blue-400 border border-blue-500/30 shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>

          {game.metacritic && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-bold text-yellow-400 border border-yellow-500/30">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{(game.metacritic / 10).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bottom Shade & Size Info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f1016] via-[#0f1016]/80 to-transparent pt-12 pb-3 px-3 flex items-end justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              {t(game.genreFa, game.genreEn)}
            </span>
            <h4 className="text-sm font-extrabold text-white line-clamp-1 group-hover:text-orange-400 transition-colors">
              {game.title}
            </h4>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-orange-400 block" dir="ltr">
              {n(game.sizeGb)} GB
            </span>
          </div>
        </div>
      </Link>

      {/* Expanded Hover Action Panel */}
      <div className="p-3 border-t border-white/[0.06] bg-[#181a27] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>{game.year}</span>
          <span>•</span>
          <span className="truncate max-w-[110px]">{game.studio}</span>
        </div>

        <Link
          href={`/shop/${game.slug}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-orange-500/30 shrink-0"
        >
          {isOwned ? (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>{t("دانلود", "Download")}</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>{t("دریافت", "Get Game")}</span>
            </>
          )}
        </Link>
      </div>
    </div>
  );
};

export default GameCard;
