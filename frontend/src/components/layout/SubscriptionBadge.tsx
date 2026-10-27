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

  // If not authenticated or no quota loaded yet, show "خرید اشتراک"
  if (!isAuthenticated || !quota || !quota.tier_code) {
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
  const name = quota.tier_name || 'اشتراک ویژه';

  // Determine tier styling
  let badgeStyle = {
    container: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
  };

  if (code.includes('gold') || code.includes('طلا')) {
    badgeStyle = {
      container: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
      icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
    };
  } else if (code.includes('silver') || code.includes('نقره')) {
    badgeStyle = {
      container: 'bg-slate-300/15 text-slate-200 border-slate-300/40 shadow-[0_0_12px_rgba(226,232,240,0.15)]',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />,
    };
  } else if (code.includes('bronze') || code.includes('برنز')) {
    badgeStyle = {
      container: 'bg-orange-500/15 text-orange-300 border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.15)]',
      icon: <Sparkles className="w-3.5 h-3.5 text-orange-400" />,
    };
  } else if (code.includes('free') || code.includes('رایگان')) {
    badgeStyle = {
      container: 'bg-cosmic-purple/15 text-purple-300 border-cosmic-purple/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
    };
  }

  return (
    <Link
      href="/subscriptions"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 shrink-0 ${badgeStyle.container}`}
      title={`پلن فعال: ${name} (کلیک جهت مشاهده یا ارتقا)`}
    >
      {badgeStyle.icon}
      <span>{name}</span>
    </Link>
  );
}
