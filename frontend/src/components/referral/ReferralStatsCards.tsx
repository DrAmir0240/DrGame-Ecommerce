'use client';

import React, { useState } from 'react';
import { ReferralStats } from '@/types/referral';
import { useTranslation } from '@/i18n';
import {
  Wallet,
  TrendingUp,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Clock,
  Sparkles,
  MessageCircle,
  Share2,
} from 'lucide-react';

interface ReferralStatsCardsProps {
  stats: ReferralStats;
  onOpenWithdrawModal: () => void;
  onOpenCalculator?: () => void;
}

export default function ReferralStatsCards({
  stats,
  onOpenWithdrawModal,
  onOpenCalculator,
}: ReferralStatsCardsProps) {
  const { t, n, price } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}?ref=${stats.referral_code}`
      : `https://drgame.ir?ref=${stats.referral_code}`;

  const marketingPitch = `🎮 با اشتراک ویژه دکترگیم به آرشیو ده‌ها ترابایت دیتای بازی‌های PS4/PS5 با ترافیک نامحدود و پرسرعت دسترسی پیدا کن!
برای دریافت اشتراک با کد تخفیف اختصاصی من از لینک زیر وارد شو:
${referralLink}
کد معرف: ${stats.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyMarketingText = () => {
    navigator.clipboard.writeText(marketingPitch);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-4 font-vazir text-start">
      {/* Invite Code & Link Hero Box */}
      <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-2 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-bold inline-block">
              {t('referralStats.badge')}
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>تسویه منظم هفتگی (جمعه‌ها)</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t('referralStats.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            {t('referralStats.description')}
          </p>
        </div>

        {/* Action Buttons Box */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-end gap-2.5 w-full md:w-auto shrink-0">
          <div className="flex items-center justify-between sm:justify-end gap-3 px-4 py-2 rounded-2xl bg-[#181d29] border border-white/10 text-sm">
            <span className="text-xs text-slate-400">{t('referralStats.codeLabel')}</span>
            <span className="font-mono font-black text-white text-base tracking-widest" dir="ltr">
              {stats.referral_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? t('referralStats.copied') : t('referralStats.copy')}</span>
            </button>

            <button
              type="button"
              onClick={copyMarketingText}
              title="کپی متن کامل بازاریابی همراه لینک برای پیام‌رسان‌ها"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1f2738] hover:bg-[#283247] text-cyan-300 border border-cyan-500/20 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-300" /> : <MessageCircle className="w-4 h-4" />}
              <span>{copiedText ? 'متن کپی شد' : 'متن پیام آماده'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stats Grid: Dual Wallets (Withdrawable + Weekly Pending) & Network Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Withdrawable Balance (Settled) */}
        <div className="rounded-3xl glass-card border border-emerald-500/30 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm text-slate-300 font-bold block">موجودی قابل برداشت</span>
                <span className="text-[10px] text-emerald-400 font-semibold">تسویه‌شده و قطعی</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {price(stats.withdrawable_balance_toman)}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenWithdrawModal}
            disabled={stats.withdrawable_balance_toman < 50000}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:bg-[#12221b] disabled:text-emerald-600 active:scale-98 cursor-pointer"
          >
            {t('referralStats.withdrawCta')}
          </button>
        </div>

        {/* Card 2: Weekly Pending Balance */}
        <div className="rounded-3xl glass-card border border-amber-500/30 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm text-slate-300 font-bold block">پورسانت این هفته</span>
                <span className="text-[10px] text-amber-400 font-semibold">در انتظار تسویه هفتگی</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-black text-amber-300 font-mono" dir="ltr">
              {price(stats.pending_balance_toman || 0)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-[#1a1712] border border-amber-500/20 text-[11px] text-amber-200/90 flex items-center justify-between">
            <span className="text-slate-400">موعد تسویه بعدی:</span>
            <span className="font-bold text-amber-300">جمعه ساعت ۲۳:۵۹</span>
          </div>
        </div>

        {/* Card 3: Total Earned */}
        <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm text-slate-300 font-medium block">{t('referralStats.totalEarned')}</span>
              <span className="text-[10px] text-slate-500">مجموع درآمد کل ادوار</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {price(stats.total_earned_toman)}
            </span>
          </div>

          {onOpenCalculator ? (
            <button
              type="button"
              onClick={onOpenCalculator}
              className="w-full py-2 rounded-xl bg-[#181d29] hover:bg-[#202737] text-purple-300 border border-purple-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>شبیه‌ساز درآمد من</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 text-center py-2">
              {t('referralStats.earnedFromNetwork')}
            </span>
          )}
        </div>

        {/* Card 4: Network Size & Active Subscribers */}
        <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs sm:text-sm text-slate-300 font-medium block">اعضای شبکه</span>
              <span className="text-[10px] text-cyan-400 font-semibold">{n(stats.active_subscriptions_count)} مشترک فعال</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-xs text-slate-400">معرفی مستقیم:</span>
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {n(stats.direct_referrals_count)}
            </span>
          </div>

          <span className="text-xs text-emerald-400 font-medium text-center py-2">
            {t('referralStats.recurringCommission')}
          </span>
        </div>
      </div>
    </div>
  );
}
