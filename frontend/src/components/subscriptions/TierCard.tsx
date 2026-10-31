'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  Zap,
  Gamepad2,
  HardDrive,
  FileText,
  Sparkles,
  LayoutGrid,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';

interface TierCardProps {
  tier: SubscriptionTier;
  isCurrent?: boolean;
  duration?: 1 | 3 | 6;
}

interface FreeGameItem {
  id: number;
  title_fa: string;
  title_en: string;
  slug: string;
  cover_image_url: string;
  release_year?: number;
  platforms?: string[];
}

export default function TierCard({ tier, isCurrent = false, duration = 1 }: TierCardProps) {
  const { t, price, size } = useTranslation();
  const isFree = tier.code === 'free';
  const isBronze = tier.code === 'bronze';
  const isSilver = tier.code === 'silver';
  const isGold = tier.code === 'gold';

  const [freeGames, setFreeGames] = useState<FreeGameItem[]>([]);
  const [loadingFreeGames, setLoadingFreeGames] = useState(false);

  useEffect(() => {
    if (isFree) {
      setLoadingFreeGames(true);
      apiRequest<FreeGameItem[]>('/subscriptions/free-tier-games')
        .then((data) => setFreeGames(data || []))
        .catch((err) => console.error('Failed to load free tier games:', err))
        .finally(() => setLoadingFreeGames(false));
    }
  }, [isFree]);

  // Dynamic price calculation based on duration
  const getDynamicPrice = () => {
    const dKey = duration === 1 ? '1_month' : `${duration}_months`;
    if (tier.durations && tier.durations[dKey]) {
      return tier.durations[dKey].price_toman;
    }
    const base = tier.price_toman || 0;
    return base * duration;
  };

  const dynamicPrice = getDynamicPrice();

  // Period label
  const periodLabel =
    duration === 1
      ? t('plans.period.days30')
      : duration === 3
        ? t('plans.period.days90')
        : t('plans.period.days180');

  // Dynamic quota display
  const getDynamicQuota = () => {
    const dKey = duration === 1 ? '1_month' : `${duration}_months`;
    let totalGb = 0;
    if (tier.durations && tier.durations[dKey]) {
      totalGb = tier.durations[dKey].quota_gb;
    } else {
      totalGb = (tier.quota_gb || (isBronze ? 500 : isSilver ? 1000 : 2200)) * duration;
    }
    const formattedSize = totalGb >= 1000 ? size(totalGb / 1000, 'TB') : size(totalGb, 'GB');
    return t('plans.quota.download', { size: formattedSize });
  };

  // Outer border & card styles
  let outerCardStyle = 'border border-white/10 bg-[#0e1017]/95';
  if (isGold) {
    outerCardStyle = 'border border-amber-500/70 shadow-2xl shadow-amber-500/10 bg-[#0e1017]/95';
  }

  // --- FREE TIER CARD ---
  if (isFree) {
    return (
      <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`}>
        <div>
          {/* Top Banner Box */}
          <div className="bg-white text-slate-900 rounded-2xl p-5 mb-6 shadow-md text-center">
            <h3 className="text-2xl font-black text-slate-950 mb-1.5 font-vazir">{t('plans.free.badge')}</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium font-vazir">
              {t('plans.free.description')}
            </p>
          </div>

          {/* Price Header */}
          <div className="text-center mb-6">
            <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">{t('plans.free.priceTitle')}</div>
            <div className="text-xs text-slate-400 font-medium font-vazir">{t('plans.free.priceNote')}</div>
          </div>

          {/* Free Games Box */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#12151e]/80 p-3 space-y-2.5 mb-8">
            <div className="text-[11px] font-bold text-slate-400 mb-1 px-1">
              {t('plans.free.gamesTitle')}
            </div>
            {loadingFreeGames ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{t('plans.free.gamesLoading')}</span>
              </div>
            ) : freeGames.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                {t('plans.free.gamesEmpty')}
              </div>
            ) : (
              freeGames.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="border border-slate-700/60 bg-[#161b26] hover:bg-[#1c2230] rounded-xl p-2 flex items-center justify-between transition-all group block"
                >
                  <div className="text-start pl-2">
                    <span className="text-xs font-bold text-slate-200 tracking-wide font-vazir block">
                      {game.title_fa || game.title_en}
                    </span>
                    {game.title_en && (
                      <span className="text-[10px] text-slate-400 font-roboto" dir="ltr">
                        {game.title_en}
                      </span>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-sm bg-black/40">
                    <img
                      src={game.cover_image_url}
                      alt={game.title_fa}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* CTA Button: دانلود رایگان */}
        <div>
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
            >
              {t('plans.currentPlan')}
            </button>
          ) : (
            <Link
              href="/games?tier=free"
              className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm text-center block shadow-lg hover:shadow-white/20 transition-all font-vazir"
            >
              {t('plans.free.cta')}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- BRONZE TIER CARD ---
  if (isBronze) {
    const priceText = price(dynamicPrice || 698000);
    return (
      <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`}>
        <div>
          {/* Top Banner Box */}
          <div className="bg-[#c57e48] text-white rounded-2xl p-5 mb-6 shadow-md text-center">
            <h3 className="text-2xl font-black mb-1.5 font-vazir">{t('plans.bronze.name')}</h3>
            <p className="text-xs text-white/95 leading-relaxed font-medium font-vazir">
              {t('plans.bronze.tagline')}
            </p>
          </div>

          {/* Price Header */}
          <div className="text-center mb-5">
            <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">
              <span>{priceText}</span>
            </div>
            <div className="text-xs text-slate-400 font-medium font-vazir">{periodLabel}</div>
          </div>

          {/* Highlight Capsule */}
          <div className="border border-[#c57e48]/50 bg-[#16120e] rounded-xl py-2.5 px-4 flex items-center justify-center gap-2.5 text-xs text-white font-bold mb-6 font-vazir">
            <span>{getDynamicQuota()}</span>
            <HardDrive className="w-4 h-4 text-[#c57e48]" />
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-6 text-xs text-slate-200 font-medium font-vazir">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#c57e48] shrink-0" />
                <span>{t('plans.bronze.features.speed')}</span>
              </div>
              <Zap className="w-4 h-4 text-[#c57e48] shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#c57e48] shrink-0" />
                <span>{t('plans.bronze.features.consoles')}</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-[#c57e48] shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t('plans.bronze.features.noRetro')}</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-slate-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t('plans.bronze.features.noSubtitles')}</span>
              </div>
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t('plans.bronze.features.noDlc')}</span>
              </div>
              <Sparkles className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>

          {/* Warning Box */}
          <div className="border border-rose-900/50 bg-rose-950/20 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-rose-300 leading-relaxed mb-6 font-vazir">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{t('plans.warning')}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
            >
              {t('plans.currentPlan')}
            </button>
          ) : (
            <Link
              href={`/checkout?tier=bronze&duration=${duration}`}
              className="w-full py-3.5 rounded-xl bg-[#c57e48] hover:bg-[#b46d37] text-white font-black text-sm text-center block shadow-lg hover:shadow-[#c57e48]/30 transition-all font-vazir"
            >
              {t('plans.bronze.cta')}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- SILVER TIER CARD ---
  if (isSilver) {
    const priceText = price(dynamicPrice || 1198000);
    return (
      <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`}>
        <div>
          {/* Top Banner Box */}
          <div className="bg-[#d4d8df] text-slate-900 rounded-2xl p-5 mb-6 shadow-md text-center">
            <h3 className="text-2xl font-black mb-1.5 font-vazir">{t('plans.silver.name')}</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium font-vazir">
              {t('plans.silver.tagline')}
            </p>
          </div>

          {/* Price Header */}
          <div className="text-center mb-5">
            <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">
              <span>{priceText}</span>
            </div>
            <div className="text-xs text-slate-400 font-medium font-vazir">{periodLabel}</div>
          </div>

          {/* Highlight Capsule */}
          <div className="border border-slate-500/50 bg-[#11161d] rounded-xl py-2.5 px-4 flex items-center justify-center gap-2.5 text-xs text-white font-bold mb-6 font-vazir">
            <span>{getDynamicQuota()}</span>
            <HardDrive className="w-4 h-4 text-slate-300" />
          </div>

          {/* Features List */}
          <div className="space-y-4 mb-6 text-xs text-slate-200 font-medium font-vazir">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{t('plans.silver.features.speed')}</span>
              </div>
              <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{t('plans.silver.features.consoles')}</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{t('plans.silver.features.extras')}</span>
              </div>
              <FileText className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>{t('plans.silver.features.themes')}</span>
              </div>
              <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t('plans.silver.features.excluded')}</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>

          {/* Warning Box */}
          <div className="border border-rose-900/50 bg-rose-950/20 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-rose-300 leading-relaxed mb-6 font-vazir">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{t('plans.warning')}</span>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
            >
              {t('plans.currentPlan')}
            </button>
          ) : (
            <Link
              href={`/checkout?tier=silver&duration=${duration}`}
              className="w-full py-3.5 rounded-xl bg-[#d4d8df] hover:bg-white text-slate-950 font-black text-sm text-center block shadow-lg hover:shadow-slate-300/30 transition-all font-vazir"
            >
              {t('plans.silver.cta')}
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- GOLD TIER CARD ---
  const priceText = price(dynamicPrice || 2988000);
  return (
    <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`}>
      <div>
        {/* Top Banner Box */}
        <div className="bg-[#181920] border border-amber-500/40 text-amber-400 rounded-2xl p-5 mb-6 shadow-md text-center">
          <h3 className="text-2xl font-black mb-1.5 font-vazir text-amber-400">{t('plans.gold.name')}</h3>
          <p className="text-xs text-amber-200/90 leading-relaxed font-medium font-vazir">
            {t('plans.gold.tagline')}
          </p>
        </div>

        {/* Price Header */}
        <div className="text-center mb-5">
          <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">
            <span>{priceText}</span>
          </div>
          <div className="text-xs text-slate-400 font-medium font-vazir">{periodLabel}</div>
        </div>

        {/* Highlight Capsule */}
        <div className="border border-amber-500/60 bg-[#1c180e] rounded-xl py-2.5 px-4 flex items-center justify-center gap-2.5 text-xs text-amber-300 font-bold mb-6 font-vazir">
          <span>{getDynamicQuota()}</span>
          <HardDrive className="w-4 h-4 text-amber-400" />
        </div>

        {/* Features List */}
        <div className="space-y-4 mb-6 text-xs text-slate-200 font-medium font-vazir">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('plans.gold.features.speed')}</span>
            </div>
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('plans.gold.features.consoles')}</span>
            </div>
            <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('plans.gold.features.categories')}</span>
            </div>
            <LayoutGrid className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('plans.gold.features.extras')}</span>
            </div>
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('plans.gold.features.themes')}</span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* Warning Box */}
        <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed mb-6 font-vazir">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{t('plans.warning')}</span>
        </div>
      </div>

      {/* CTA Button */}
      <div>
        {isCurrent ? (
          <button
            disabled
            className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
          >
            {t('plans.currentPlan')}
          </button>
        ) : (
          <Link
            href={`/checkout?tier=gold&duration=${duration}`}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm text-center block shadow-lg shadow-amber-500/20 transition-all font-vazir"
          >
            {t('plans.gold.cta')}
          </Link>
        )}
      </div>
    </div>
  );
}
