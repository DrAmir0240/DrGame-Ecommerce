'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Star, ChevronLeft, Gamepad2, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { getMediaUrl } from '@/lib/media';

interface SimilarGameItem {
  id: number;
  title_fa: string;
  title_en: string;
  slug: string;
  rating?: number;
  download_size_gb?: number;
  platforms?: string[];
  cover_image_url?: string;
  likes_count?: number;
}

interface SimilarGamesCarouselProps {
  gameId: number | string;
}

export default function SimilarGamesCarousel({ gameId }: SimilarGamesCarouselProps) {
  const [similarGames, setSimilarGames] = useState<SimilarGameItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    apiRequest<SimilarGameItem[]>(`/games/${gameId}/similar`)
      .then((data) => setSimilarGames(data || []))
      .catch((err) => console.error('Failed to load similar games:', err))
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 space-y-4 font-vazir text-right">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          <h2 className="text-xl sm:text-2xl font-black text-white">بازی‌های مشابه و پیشنهادی</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (similarGames.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-14 space-y-5 font-vazir text-right">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-purple-600 shadow-[0_0_12px_#22d3ee]" />
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              بازی‌های مشابه و عناوین پیشنهادی
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ۵ بازی محبوب که با این عنوان هم‌ژانر هستند
            </p>
          </div>
        </div>

        <Link
          href="/games"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span>مشاهده همه بازی‌ها</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {similarGames.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className="group relative rounded-2xl overflow-hidden bg-[#0d111a] border border-white/10 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-xl hover:shadow-cyan-500/10"
          >
            {/* Cover Image Container */}
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
              {game.cover_image_url ? (
                <img
                  src={getMediaUrl(game.cover_image_url)}
                  alt={game.title_fa || game.title_en}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                  <Gamepad2 className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d111a] via-transparent to-black/20" />

              {/* Rating Badge */}
              {game.rating && game.rating > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-amber-300 text-[10px] font-bold font-roboto">
                  <Star className="w-3 h-3 fill-amber-300 stroke-none" />
                  <span>{game.rating.toFixed(1)}</span>
                </div>
              )}

              {/* Platforms */}
              {game.platforms && game.platforms.length > 0 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {game.platforms.slice(0, 2).map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] font-bold border border-white/10"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="p-3.5 space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug">
                {game.title_fa || game.title_en}
              </h3>
              {game.title_en && (
                <p className="text-[10px] text-slate-400 font-roboto line-clamp-1" dir="ltr">
                  {game.title_en}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
