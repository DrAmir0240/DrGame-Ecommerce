'use client';

import React from 'react';
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
} from 'lucide-react';
import { SubscriptionTier } from '@/types/subscription';

interface TierCardProps {
  tier: SubscriptionTier;
  isCurrent?: boolean;
  duration?: 1 | 3 | 6;
}

// 5 Free Tier Games matching the reference design
const FREE_GAMES = [
  {
    title: 'Watch Dogs 2',
    image: 'https://media.rawg.io/media/games/f52/f52cf6ba08089cd5f1a9c8f7fcc93d1f.jpg',
  },
  {
    title: 'GTA V',
    image: 'https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg',
  },
  {
    title: 'Rocket League',
    image: 'https://media.rawg.io/media/games/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg',
  },
  {
    title: 'Mortal Kombat 11',
    image: 'https://media.rawg.io/media/games/eb5/eb514db62d397c64288160d5bd8fd67a.jpg',
  },
  {
    title: 'Brawlhalla',
    image: 'https://media.rawg.io/media/games/35b/35b47c4d85cd6e08f3e2ca43ea5ce7bb.jpg',
  },
];

export default function TierCard({ tier, isCurrent = false, duration = 1 }: TierCardProps) {
  const isFree = tier.code === 'free';
  const isBronze = tier.code === 'bronze';
  const isSilver = tier.code === 'silver';
  const isGold = tier.code === 'gold';

  // Format price cleanly with Vazir font
  const formatToman = (toman: number) => toman.toLocaleString('fa-IR');

  // Dynamic price calculation based on duration
  const getDynamicPrice = () => {
    const base = tier.price_toman || 0;
    if (duration === 3) {
      return (tier as any).price_3m_toman || Math.round(base * 3 * 0.90);
    }
    if (duration === 6) {
      return (tier as any).price_6m_toman || Math.round(base * 6 * 0.80);
    }
    return base;
  };

  const dynamicPrice = getDynamicPrice();

  // Period label
  const periodLabel = duration === 1 ? '/ ۳۰ روز' : duration === 3 ? '/ ۹۰ روز (۳ ماهه)' : '/ ۱۸۰ روز (۶ ماهه)';

  // Dynamic quota display
  const getDynamicQuota = () => {
    const totalGb = (tier.quota_gb || (isBronze ? 500 : isSilver ? 1000 : 2200)) * duration;
    if (totalGb >= 1000) {
      const tb = (totalGb / 1000).toFixed(1).replace('.0', '');
      return `${tb} TB دانلود بازی`;
    }
    return `${totalGb} GB دانلود بازی`;
  };

  // Outer border & card styles
  let outerCardStyle = 'border border-white/10 bg-[#0e1017]/95';
  if (isGold) {
    outerCardStyle = 'border border-amber-500/70 shadow-2xl shadow-amber-500/10 bg-[#0e1017]/95';
  }

  // --- FREE TIER CARD ---
  if (isFree) {
    return (
      <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`} dir="rtl">
        <div>
          {/* Top Banner Box */}
          <div className="bg-white text-slate-900 rounded-2xl p-5 mb-6 shadow-md text-center">
            <h3 className="text-2xl font-black text-slate-950 mb-1.5 font-vazir">رایگان</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium font-vazir">
              این پلن به بازی‌های منتخب دسترسی می‌دهد و حجم دانلودشان رایگان است.
            </p>
          </div>

          {/* Price Header */}
          <div className="text-center mb-6">
            <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">رایگان</div>
            <div className="text-xs text-slate-400 font-medium font-vazir">یک‌بار برای همیشه</div>
          </div>

          {/* 5 Free Games Box */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#12151e]/80 p-3 space-y-2.5 mb-8">
            {FREE_GAMES.map((game) => (
              <div
                key={game.title}
                className="border border-slate-700/60 bg-[#161b26] hover:bg-[#1c2230] rounded-xl p-2 flex items-center justify-between transition-all group"
              >
                <span className="text-xs font-bold text-slate-200 tracking-wide font-sans pl-2" dir="ltr">
                  {game.title}
                </span>
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-sm bg-black/40">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button: دانلود رایگان */}
        <div>
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
            >
              پلن فعال شما
            </button>
          ) : (
            <Link
              href="/games?tier=free"
              className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm text-center block shadow-lg hover:shadow-white/20 transition-all font-vazir"
            >
              دانلود رایگان
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- BRONZE TIER CARD ---
  if (isBronze) {
    const priceText = formatToman(dynamicPrice || 698000);
    return (
      <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`} dir="rtl">
        <div>
          {/* Top Banner Box */}
          <div className="bg-[#c57e48] text-white rounded-2xl p-5 mb-6 shadow-md text-center">
            <h3 className="text-2xl font-black mb-1.5 font-vazir">برنز</h3>
            <p className="text-xs text-white/95 leading-relaxed font-medium font-vazir">
              شروعی اقتصادی با سرعت اختصاصی و دیتای پرسرعت بازی‌ها.
            </p>
          </div>

          {/* Price Header */}
          <div className="text-center mb-5">
            <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">
              <span>{priceText}</span> <span className="text-xl font-bold">تومان</span>
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
                <span>حداکثر سرعت دانلود: ۲۰ مگابیت برثانیه</span>
              </div>
              <Zap className="w-4 h-4 text-[#c57e48] shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#c57e48] shrink-0" />
                <span>بازی‌های PS4 و PS5</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-[#c57e48] shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>بازی‌های PS1, PS2, PS3, Nintendo و Xbox</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-slate-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>خرید زیرنویس در این پلن در دسترس نیست</span>
              </div>
              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>خرید DLC در این پلن در دسترس نیست</span>
              </div>
              <Sparkles className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>

          {/* Warning Box */}
          <div className="border border-rose-900/50 bg-rose-950/20 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-rose-300 leading-relaxed mb-6 font-vazir">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>با تمام شدن سهمیه، نمی‌توانی بازی جدیدی باز کنی. بازی‌های بازشده تا پایان مهلت در دسترس می‌مانند.</span>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
            >
              پلن فعال شما
            </button>
          ) : (
            <Link
              href={`/checkout?tier=bronze&duration=${duration}`}
              className="w-full py-3.5 rounded-xl bg-[#c57e48] hover:bg-[#b46d37] text-white font-black text-sm text-center block shadow-lg hover:shadow-[#c57e48]/30 transition-all font-vazir"
            >
              انتخاب برنز
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- SILVER TIER CARD ---
  if (isSilver) {
    const priceText = formatToman(dynamicPrice || 1198000);
    return (
      <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`} dir="rtl">
        <div>
          {/* Top Banner Box */}
          <div className="bg-[#d4d8df] text-slate-900 rounded-2xl p-5 mb-6 shadow-md text-center">
            <h3 className="text-2xl font-black mb-1.5 font-vazir">نقره‌ای</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium font-vazir">
              پلنی متعادل با دسترسی به پلتفرم‌های بیشتر و دیتای حجیم.
            </p>
          </div>

          {/* Price Header */}
          <div className="text-center mb-5">
            <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">
              <span>{priceText}</span> <span className="text-xl font-bold">تومان</span>
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
                <span>حداکثر سرعت دانلود: ۲۰ مگابیت برثانیه</span>
              </div>
              <Zap className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>بازی‌های PS2, PS3, PS4 و PS5</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>امکان خرید زیرنویس و DLC</span>
              </div>
              <FileText className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>تم‌ها شامل پلن نقره‌ای نیستند</span>
              </div>
              <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-slate-500 shrink-0" />
                <span>بازی‌های PS1, Xbox و Nintendo شامل پلن نیستند</span>
              </div>
              <Gamepad2 className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          </div>

          {/* Warning Box */}
          <div className="border border-rose-900/50 bg-rose-950/20 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-rose-300 leading-relaxed mb-6 font-vazir">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>با تمام شدن سهمیه، نمی‌توانی بازی جدیدی باز کنی. بازی‌های بازشده تا پایان مهلت در دسترس می‌مانند.</span>
          </div>
        </div>

        {/* CTA Button */}
        <div>
          {isCurrent ? (
            <button
              disabled
              className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
            >
              پلن فعال شما
            </button>
          ) : (
            <Link
              href={`/checkout?tier=silver&duration=${duration}`}
              className="w-full py-3.5 rounded-xl bg-[#d4d8df] hover:bg-white text-slate-950 font-black text-sm text-center block shadow-lg hover:shadow-slate-300/30 transition-all font-vazir"
            >
              انتخاب نقره‌ای
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- GOLD TIER CARD ---
  const priceText = formatToman(dynamicPrice || 2988000);
  return (
    <div className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${outerCardStyle}`} dir="rtl">
      <div>
        {/* Top Banner Box */}
        <div className="bg-[#181920] border border-amber-500/40 text-amber-400 rounded-2xl p-5 mb-6 shadow-md text-center">
          <h3 className="text-2xl font-black mb-1.5 font-vazir text-amber-400">طلایی</h3>
          <p className="text-xs text-amber-200/90 leading-relaxed font-medium font-vazir">
            دسترسی گسترده به پلتفرم‌ها، سرعت بالاتر و دیتای اختصاصی بازی‌ها.
          </p>
        </div>

        {/* Price Header */}
        <div className="text-center mb-5">
          <div className="text-3xl sm:text-4xl font-black text-white font-vazir mb-1">
            <span>{priceText}</span> <span className="text-xl font-bold">تومان</span>
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
              <span>حداکثر سرعت دانلود: ۴۰ مگابیت برثانیه</span>
            </div>
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>بازی‌های Xbox 360, PS1, PS2, PS3, Nintendo و PS4, PS5</span>
            </div>
            <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>دسترسی به همه دسته‌بندی‌های بازی</span>
            </div>
            <LayoutGrid className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>امکان خرید زیرنویس و DLC</span>
            </div>
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-400 shrink-0" />
              <span>تم‌ها همراه پلن طلایی</span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* Warning Box */}
        <div className="border border-amber-500/30 bg-amber-950/20 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-amber-200 leading-relaxed mb-6 font-vazir">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>با تمام شدن سهمیه، نمی‌توانی بازی جدیدی باز کنی. بازی‌های بازشده تا پایان مهلت در دسترس می‌مانند.</span>
        </div>
      </div>

      {/* CTA Button */}
      <div>
        {isCurrent ? (
          <button
            disabled
            className="w-full py-3.5 rounded-xl bg-white/20 text-white font-bold text-sm text-center cursor-default font-vazir"
          >
            پلن فعال شما
          </button>
        ) : (
          <Link
            href={`/checkout?tier=gold&duration=${duration}`}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm text-center block shadow-lg shadow-amber-500/20 transition-all font-vazir"
          >
            انتخاب طلایی
          </Link>
        )}
      </div>
    </div>
  );
}
