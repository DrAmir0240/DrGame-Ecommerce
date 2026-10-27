'use client';

import React, { useState } from 'react';
import { ReferralStats } from '@/types/referral';
import { Wallet, TrendingUp, Users, ShieldCheck, Copy, Check, Share2 } from 'lucide-react';

interface ReferralStatsCardsProps {
  stats: ReferralStats;
  onOpenWithdrawModal: () => void;
}

export default function ReferralStatsCards({ stats, onOpenWithdrawModal }: ReferralStatsCardsProps) {
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
    <div className="space-y-6">
      {/* Invite Code & Link Hero Box */}
      <div className="rounded-3xl glass-card border border-cosmic-purple/30 bg-gradient-to-r from-cosmic-purple/15 via-surface-card to-surface-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-neon-purple/10">
        <div className="space-y-1 text-right w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-cosmic-purple/20 text-cosmic-purple border border-cosmic-purple/30 font-bold">
              لینک اختصاصی بازاریابی
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            کد معرف و لینک دعوت شما
          </h2>
          <p className="text-xs text-text-secondary max-w-xl">
            با دعوت دوستان، از تمامی خریدهای آن‌ها و شبکه زیرمجموعه تا ۱۰ سطح پورسانت نقدی دریافت کنید (۵۰٪ از کل صندوق برای سطح ۱).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm">
            <span className="text-xs text-text-muted">کد معرف:</span>
            <span className="font-mono font-black text-white text-base tracking-widest">{stats.referral_code}</span>
          </div>

          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cosmic-gradient hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-neon-purple transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد!' : 'کپی لینک اختصاصی'}</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Withdrawable Balance */}
        <div className="rounded-3xl glass-card border border-emerald-500/20 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-muted">موجودی قابل برداشت</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-black text-white font-mono">
              {stats.withdrawable_balance_toman.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-text-muted">تومان</span>
          </div>
          <button
            onClick={onOpenWithdrawModal}
            disabled={stats.withdrawable_balance_toman < 50000}
            className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ثبت درخواست تسویه
          </button>
        </div>

        {/* Card 2: Total Earned */}
        <div className="rounded-3xl glass-card border border-cosmic-purple/20 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-muted">کل درآمد کسب‌شده</span>
            <div className="w-10 h-10 rounded-2xl bg-cosmic-purple/20 text-cosmic-purple flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-black text-white font-mono">
              {stats.total_earned_toman.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-text-muted">تومان</span>
          </div>
          <span className="text-[11px] text-text-muted">تسهیم شده از شبکه معرف‌ها</span>
        </div>

        {/* Card 3: Direct Referrals */}
        <div className="rounded-3xl glass-card border border-cyan-500/20 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-muted">تعداد اعضای مستقیم (سطح ۱)</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-black text-white font-mono">
              {stats.direct_referrals_count.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-text-muted">کاربر</span>
          </div>
          <span className="text-[11px] text-text-muted">ثبت‌نام کرده با کد دعوت شما</span>
        </div>

        {/* Card 4: Active Subscriptions */}
        <div className="rounded-3xl glass-card border border-amber-500/20 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-muted">اشتراک‌های فعال زیرمجموعه</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-2xl font-black text-white font-mono">
              {stats.active_subscriptions_count.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-text-muted">اشتراک فعال</span>
          </div>
          <span className="text-[11px] text-emerald-400">تولیدکننده پورسانت مستمر</span>
        </div>
      </div>
    </div>
  );
}
