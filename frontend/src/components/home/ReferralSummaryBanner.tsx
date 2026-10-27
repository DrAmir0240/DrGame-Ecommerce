'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import { ReferralStats } from '@/types/referral';
import ReferralStatsCards from '@/components/referral/ReferralStatsCards';

export default function ReferralSummaryBanner() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await apiRequest<ReferralStats>('/referral/stats');
        if (isMounted && data) {
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load referral stats on home:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Active stats or fallback based on current user info
  const activeStats: ReferralStats = stats || {
    referral_code: user.referral_code || (user.phone ? `DG-${user.phone.slice(-4)}` : 'DG-PRO'),
    withdrawable_balance_toman: 0,
    total_earned_toman: 0,
    total_withdrawn_toman: 0,
    direct_referrals_count: 0,
    active_subscriptions_count: 0,
  };

  const handleWithdrawClick = () => {
    router.push('/referral');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2" aria-label="خلاصه درآمد و رفرال دکتر گیم">
      {isLoading && !stats ? (
        <div className="animate-pulse space-y-4">
          <div className="h-44 rounded-3xl bg-white/5 border border-white/10" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-40 rounded-3xl bg-white/5 border border-white/10" />
            <div className="h-40 rounded-3xl bg-white/5 border border-white/10" />
            <div className="h-40 rounded-3xl bg-white/5 border border-white/10" />
            <div className="h-40 rounded-3xl bg-white/5 border border-white/10" />
          </div>
        </div>
      ) : (
        <ReferralStatsCards
          stats={activeStats}
          onOpenWithdrawModal={handleWithdrawClick}
        />
      )}
    </section>
  );
}
