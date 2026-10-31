'use client';

import React, { useState } from 'react';
import { ReferralStats } from '@/types/referral';
import { useTranslation } from '@/i18n';
import { Wallet, TrendingUp, Users, ShieldCheck, Copy, Check, Share2 } from 'lucide-react';

interface ReferralStatsCardsProps {
  stats: ReferralStats;
  onOpenWithdrawModal: () => void;
}

export default function ReferralStatsCards({ stats, onOpenWithdrawModal }: ReferralStatsCardsProps) {
  const { t, n, price } = useTranslation();
  const [copied, setCopied] = useState(false);
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${stats.referral_code}`
    : `https://drgame.ir?ref=${stats.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 font-vazir text-start">
      {/* Invite Code & Link Hero Box (Matching screenshot top card) */}
      <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-2 text-start">
          <div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 font-bold inline-block">
              {t('referralStats.badge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t('referralStats.title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            {t('referralStats.description')}
          </p>
        </div>

        {/* Left Action Box: Code pill on top, Copy button below */}
        <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full md:w-auto shrink-0">
          <div className="flex items-center justify-between sm:justify-end gap-3 px-4 py-2 rounded-2xl bg-[#181d29] border border-white/10 text-sm">
            <span className="text-xs text-slate-400">{t('referralStats.codeLabel')}</span>
            <span className="font-mono font-black text-white text-base tracking-widest" dir="ltr">
              {stats.referral_code}
            </span>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('referralStats.copied') : t('referralStats.copy')}</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Grid (Matching screenshot bottom 4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 (Rightmost in RTL): Withdrawable Balance */}
        <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('referralStats.withdrawable')}</span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {price(stats.withdrawable_balance_toman)}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenWithdrawModal}
            className="w-full py-2.5 rounded-xl bg-[#12221b] hover:bg-[#162a22] text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-98 cursor-pointer"
          >
            {t('referralStats.withdrawCta')}
          </button>
        </div>

        {/* Card 2: Total Earned */}
        <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('referralStats.totalEarned')}</span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {price(stats.total_earned_toman)}
            </span>
          </div>

          <span className="text-xs text-slate-400 text-center py-2">
            {t('referralStats.earnedFromNetwork')}
          </span>
        </div>

        {/* Card 3: Direct Referrals */}
        <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('referralStats.directReferrals')}</span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-xs text-slate-400">{t('referralStats.usersUnit')}</span>
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {n(stats.direct_referrals_count)}
            </span>
          </div>

          <span className="text-xs text-slate-400 text-center py-2">
            {t('referralStats.joinedWithCode')}
          </span>
        </div>

        {/* Card 4 (Leftmost in RTL): Active Subscriptions */}
        <div className="rounded-3xl glass-card border border-white/10 bg-[#0e121c]/90 p-5 flex flex-col justify-between min-h-[175px] shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm text-slate-300 font-medium">{t('referralStats.activeSubs')}</span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-xs text-slate-400">{t('referralStats.activeUnit')}</span>
            <span className="text-3xl font-black text-white font-mono" dir="ltr">
              {n(stats.active_subscriptions_count)}
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
