'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { Gift, Wallet, Users, Copy, Check, ArrowLeft } from 'lucide-react';

export default function ReferralSummaryBanner() {
  const { user, isAuthenticated } = useAuthStore();
  const [copied, setCopied] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const referralCode = user.referral_code || (user.phone ? `DG-${user.phone.slice(-4)}` : 'DG-PRO');
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${referralCode}` : `https://drgame.ir?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      <div className="rounded-2xl glass-card border border-cosmic-purple/30 bg-gradient-to-r from-cosmic-purple/20 via-surface-card to-surface-card p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-neon-purple/20">
        <div className="flex items-center gap-4 text-right w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-cosmic-purple/30 border border-cosmic-purple/50 flex items-center justify-center shrink-0 text-white">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>باشگاه درآمدزایی دکتر گیم</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                ۱۰٪ پاداش نقدی
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              با دعوت دوستان به دکتر گیم، به ازای هر خرید اشتراک، ۱۰٪ اعتبار هدیه بدون سقف دریافت کنید.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          {/* Referral Code Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="text-text-muted">کد معرف شما:</span>
            <span className="font-mono font-bold text-white tracking-wider">{referralCode}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-lg hover:bg-white/10 text-cosmic-purple hover:text-white transition-all"
              title="کپی لینک اختصاصی دعوت"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all shadow-neon-purple"
          >
            <span>مدیریت کیف پول</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
