'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Database, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';

export default function QuotaPill() {
  const { isAuthenticated } = useAuthStore();
  const { quota, fetchQuota, isLoading } = useQuotaStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuota();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !quota) {
    return null;
  }

  const remaining = quota.remaining_quota_gb;
  const total = quota.total_quota_gb;
  const percentage = total > 0 ? (remaining / total) * 100 : 0;

  // Determine color theme
  let statusColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  let barColor = 'bg-emerald-500';

  if (quota.is_exhausted || percentage < 15) {
    statusColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse';
    barColor = 'bg-rose-500';
  } else if (percentage < 35) {
    statusColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    barColor = 'bg-amber-500';
  }

  const toFarsi = (num: number) =>
    Number(num.toFixed(1))
      .toLocaleString('fa-IR');

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs font-medium transition-all ${statusColor} hover:brightness-110 shrink-0`}
        title="وضعیت حجم دانلود"
      >
        <Database className="w-3.5 h-3.5 shrink-0" />
        <span className="font-roboto font-bold tracking-tight text-[11px] sm:text-xs">
          <span className="inline sm:hidden">{toFarsi(remaining)} GB</span>
          <span className="hidden sm:inline">
            {toFarsi(remaining)} / {toFarsi(total)} GB
          </span>
        </span>
        <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden hidden md:block">
          <div
            className={`h-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </button>

      {/* Dropdown details */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl glass-card border border-white/10 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <div>
                <span className="text-xs text-text-muted block">پلن فعلی:</span>
                <span className="text-sm font-black text-white">{quota.tier_name}</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${statusColor}`}>
                {percentage > 15 ? 'فعال' : 'رو به اتمام'}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>حجم باقیمانده:</span>
                <span className="font-bold text-white font-roboto">{toFarsi(remaining)} GB</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>کل سهمیه:</span>
                <span className="font-bold text-white font-roboto">{toFarsi(total)} GB</span>
              </div>
              {quota.expires_at && (
                <div className="flex justify-between text-text-secondary">
                  <span>تاریخ انقضا:</span>
                  <span className="font-roboto text-text-muted">
                    {new Date(quota.expires_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              )}
            </div>

            <Link
              href="/subscriptions"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all shadow-neon-purple"
            >
              <span>ارتقا و خرید حجم</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
