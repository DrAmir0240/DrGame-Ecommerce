'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Clock, Database, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';

export default function CircularQuotaWidget() {
  const { isAuthenticated } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuota();
    }
  }, [isAuthenticated]);

  const toFarsi = (num: number | string) =>
    Number(num).toLocaleString('fa-IR');

  // If not logged in or no subscription data
  if (!isAuthenticated || !quota) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/subscriptions"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cosmic-purple/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/30 text-amber-300 hover:text-white transition-all text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>خرید اشتراک و دانلود بازی‌ها</span>
        </Link>
      </div>
    );
  }

  // Calculate days remaining
  let daysRemaining = 30;
  if (quota.expires_at) {
    const diffTime = new Date(quota.expires_at).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const remaining = Math.round(quota.remaining_quota_gb);
  const total = Math.round(quota.total_quota_gb) || 100;
  const percentage = Math.min(100, Math.max(0, (remaining / total) * 100));

  // Determine circular donut stroke color
  let strokeColor = '#06b6d4'; // Cyan default
  if (percentage < 15) {
    strokeColor = '#f43f5e'; // Rose
  } else if (percentage < 35) {
    strokeColor = '#f59e0b'; // Amber
  }

  // SVG circular properties
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 text-right">
      {/* 1. زمان باقی‌مانده اشتراک */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-card/80 border border-white/10 backdrop-blur-md">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted">زمان باقی‌مانده اشتراک:</span>
          <span className="text-xs font-bold text-cyan-300 font-roboto" dir="rtl">
            {toFarsi(daysRemaining)} روز
          </span>
        </div>
      </div>

      {/* 2. حجم باقی‌مانده اشتراک دانلود همراه با پیشرفت دایره‌ای */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-card/80 border border-white/10 backdrop-blur-md">
        {/* Circular Progress Ring */}
        <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 40 40">
            {/* Background Circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3.5"
              fill="transparent"
            />
            {/* Dynamic Progress Circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <Database className="w-3.5 h-3.5 text-cyan-400 absolute inset-0 m-auto" />
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted">حجم باقی‌مانده اشتراک:</span>
          <span className="text-xs font-bold text-cyan-300 font-roboto" dir="rtl">
            {toFarsi(remaining)} گیگابایت
          </span>
        </div>
      </div>
    </div>
  );
}
