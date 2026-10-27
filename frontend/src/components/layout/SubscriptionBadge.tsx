'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Crown, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';

export default function SubscriptionBadge() {
  const { isAuthenticated } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuota();
    }
  }, [isAuthenticated]);

  // If not authenticated or no active subscription, show "خرید اشتراک"
  if (!isAuthenticated || !quota || !quota.tier_code || quota.tier_code === 'free') {
    return (
      <Link
        href="/subscriptions"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-cosmic-purple/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 border border-amber-500/30 text-amber-300 hover:text-white transition-all text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] shrink-0 group"
        title="خرید اشتراک دکتر گیم"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        <span>خرید اشتراک</span>
      </Link>
    );
  }

  const code = (quota.tier_code || '').toLowerCase();

  // Determine dynamic tier label and styling
  let displayName = quota.tier_name || 'اشتراک ویژه';
  let badgeStyle = {
    container: 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
  };

  if (code.includes('gold') || code.includes('طلا')) {
    displayName = 'اشتراک طلایی';
    badgeStyle = {
      container: 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 text-amber-300 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.35)]',
      icon: <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
    };
  } else if (code.includes('silver') || code.includes('نقره')) {
    displayName = 'اشتراک نقره‌ای';
    badgeStyle = {
      container: 'bg-slate-300/20 text-slate-100 border-slate-300/60 shadow-[0_0_15px_rgba(226,232,240,0.25)]',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-200" />,
    };
  } else if (code.includes('bronze') || code.includes('برنز')) {
    displayName = 'اشتراک برنزی';
    badgeStyle = {
      container: 'bg-amber-800/30 text-amber-300 border-amber-600/60 shadow-[0_0_15px_rgba(217,119,6,0.3)]',
      icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    };
  }

  return (
    <Link
      href="/subscriptions"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 shrink-0 ${badgeStyle.container}`}
      title={`پلن فعال شما: ${displayName} (کلیک جهت مشاهده یا ارتقا)`}
    >
      {badgeStyle.icon}
      <span>{displayName}</span>
    </Link>
  );
}
