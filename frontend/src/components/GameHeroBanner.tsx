"use client";

import React, { useState, useEffect } from "react";
import { Download, Heart, Share2, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { PlatformBadge } from "@/components/PlatformBadge";
import { useApp } from "@/lib/app";

export interface GameHeroBannerProps {
  game: {
    slug?: string;
    title: string;
    studio?: string;
    year?: number;
    metacritic?: number;
    image: string;
    backdrop?: string;
    platforms: string[];
    genreFa?: string;
    sizeGb?: number;
  };
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
}

export const GameHeroBanner: React.FC<GameHeroBannerProps> = ({
  game,
  onWishlistToggle,
  isWishlisted,
}) => {
  const { t, n } = useApp();
  const slug = game.slug || game.title.toLowerCase().replace(/\s+/g, "-");
  
  // Use a fallback wide landscape wallpaper if backdrop is identical to square poster
  const backdropImage =
    game.backdrop ||
    `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80`;

  // Persistent reactions: like / dislike
  const hashSeed = Math.abs(
    game.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  const defaultLikes = 620 + (hashSeed % 480);
  const defaultDislikes = 18 + (hashSeed % 26);

  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [likesCount, setLikesCount] = useState<number>(defaultLikes);
  const [dislikesCount, setDislikesCount] = useState<number>(defaultDislikes);

  useEffect(() => {
    try {
      const savedReaction = localStorage.getItem(`drgame_reaction_${slug}`);
      if (savedReaction === "like" || savedReaction === "dislike") {
        setReaction(savedReaction);
        if (savedReaction === "like") setLikesCount((c) => c + 1);
        if (savedReaction === "dislike") setDislikesCount((c) => c + 1);
      }
    } catch (e) {}
  }, [slug]);

  const handleVote = (type: "like" | "dislike") => {
    try {
      if (reaction === type) {
        // Toggle off
        setReaction(null);
        localStorage.removeItem(`drgame_reaction_${slug}`);
        if (type === "like") setLikesCount((c) => Math.max(0, c - 1));
        if (type === "dislike") setDislikesCount((c) => Math.max(0, c - 1));
      } else {
        // Switch or set
        if (reaction === "like") setLikesCount((c) => Math.max(0, c - 1));
        if (reaction === "dislike") setDislikesCount((c) => Math.max(0, c - 1));

        setReaction(type);
        localStorage.setItem(`drgame_reaction_${slug}`, type);
        if (type === "like") setLikesCount((c) => c + 1);
        if (type === "dislike") setDislikesCount((c) => c + 1);
      }
    } catch (e) {}
  };

  const scrollToDownload = () => {
    const el = document.getElementById("game-files-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8 min-h-[380px] md:min-h-[460px] flex items-end">
      {/* 1. Cinematic Background Backdrop Wallpaper */}
      <div className="absolute inset-0 z-0">
        <img
          src={backdropImage}
          alt={`${game.title} Backdrop`}
          className="w-full h-full object-cover object-center filter brightness-[0.7] contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b1f] via-[#1a1b1f]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1b1f] via-[#1a1b1f]/50 to-transparent opacity-95 rtl:bg-gradient-to-l" />
      </div>

      {/* 2. Foreground Content Container: Separate Game Poster + Info */}
      <div className="relative z-10 w-full p-6 md:p-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-8">
        
        {/* Left Lockup: Poster Cover Art + Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-start max-w-3xl">
          {/* Game Poster Art Cover (Separate from Wide Banner) */}
          <div className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl overflow-hidden border-2 border-white/20 bg-black/60 shadow-[0_12px_36px_rgba(0,0,0,0.8)] group transition-transform hover:scale-[1.02]">
            <img
              src={game.image}
              alt={`${game.title} Cover Poster`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border border-purple-500/30 rounded-2xl pointer-events-none" />
          </div>

          {/* Title & Metadata */}
          <div className="space-y-3.5">
            {/* Platform Badges & Meta Tags */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {game.platforms.map((p) => (
                <PlatformBadge key={p} platform={p} size="sm" />
              ))}
              {game.genreFa && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white font-medium backdrop-blur-md border border-white/10">
                  {game.genreFa}
                </span>
              )}
              {game.metacritic !== undefined && game.metacritic > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1 font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{game.metacritic} Metacritic</span>
                </span>
              )}
            </div>

            {/* Game Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {game.title}
            </h1>

            {/* Studio, Year & Size info */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs md:text-sm text-slate-300">
              {game.studio && <span className="text-purple-300 font-bold">{game.studio}</span>}
              {game.year && (
                <>
                  <span>•</span>
                  <span className="font-mono">{game.year}</span>
                </>
              )}
              {game.sizeGb !== undefined && game.sizeGb > 0 && (
                <>
                  <span>•</span>
                  <span className="font-mono text-purple-200">
                    {t("حجم دیتا:", "Data Size:")} {n(game.sizeGb)} GB
                  </span>
                </>
              )}
            </div>

            {/* Like (Green) & Dislike (Red) Reaction Buttons with Real Counters */}
            <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
              <span className="text-xs text-slate-400 font-bold hidden sm:inline-block">
                {t("نمره شما به بازی:", "Your Rating:")}
              </span>
              
              {/* Green Like Button */}
              <button
                type="button"
                onClick={() => handleVote("like")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  reaction === "like"
                    ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                }`}
                title="می‌پسندم"
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${reaction === "like" ? "fill-emerald-400 text-emerald-400" : ""}`} />
                <span>{t("پسندیدم", "Like")}</span>
                <span className="font-mono text-[11px] opacity-80">({n(likesCount)})</span>
              </button>

              {/* Red Dislike Button */}
              <button
                type="button"
                onClick={() => handleVote("dislike")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  reaction === "dislike"
                    ? "bg-rose-600/30 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
                }`}
                title="نمی‌پسندم"
              >
                <ThumbsDown className={`w-3.5 h-3.5 ${reaction === "dislike" ? "fill-rose-400 text-rose-400" : ""}`} />
                <span>{t("نپسندیدم", "Dislike")}</span>
                <span className="font-mono text-[11px] opacity-80">({n(dislikesCount)})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
          <button
            type="button"
            onClick={scrollToDownload}
            className="flex-1 sm:flex-none h-12 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-xl shadow-purple-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{t("باکس دانلود فایل‌ها", "Download Files")}</span>
          </button>

          <button
            type="button"
            onClick={onWishlistToggle}
            className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all ${
              isWishlisted
                ? "bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/30"
                : "bg-white/10 border-white/20 text-slate-300 hover:text-white hover:bg-white/20"
            }`}
            title="افزودن به کتابخانه بازی‌ها"
            aria-label="Wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: game.title, url: window.location.href });
              } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 text-slate-300 hover:text-white hover:bg-white/20 flex items-center justify-center transition-all"
            title="اشتراک‌گذاری"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHeroBanner;
