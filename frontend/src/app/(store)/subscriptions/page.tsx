'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { SubscriptionTier } from '@/types/subscription';
import TierCard from '@/components/subscriptions/TierCard';
import { Zap, HelpCircle, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';

export default function SubscriptionsPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState<1 | 3 | 6>(1);
  const { isAuthenticated } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiRequest<SubscriptionTier[]>('/subscriptions/tiers');
        setTiers(data);
      } catch (e) {
        console.error('Failed to load tiers:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    if (isAuthenticated) {
      fetchQuota();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-vazir text-right">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>اشتراک‌های پرسرعت دیتابیس دکتر گیم</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
          پلن مناسب کنسول خود را انتخاب کنید
        </h1>
        <p className="text-text-secondary text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
          دسترسی پرسرعت و پایدار به آرشیو دیتای بازی‌های PS5، PS4، Nintendo Switch و VR بدون قطعی با سرورهای قدرتمند داخلی و بین‌المللی.
        </p>

        {/* 3-Period Duration Toggle Bar */}
        <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-[#0d121f] border border-white/10 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setDuration(1)}
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              duration === 1
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>۱ ماهه (عادی)</span>
          </button>

          <button
            onClick={() => setDuration(3)}
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              duration === 3
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <span>۳ ماهه</span>
          </button>

          <button
            onClick={() => setDuration(6)}
            className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              duration === 6
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <span>۶ ماهه</span>
          </button>
        </div>
      </div>

      {/* Tiers Grid - Ordered from left to right: Free, Bronze, Silver, Gold */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="ltr">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-[#0e1017]/95 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16" dir="ltr">
          {['free', 'bronze', 'silver', 'gold']
            .map((code) => tiers.find((t) => t.code === code))
            .filter((t): t is SubscriptionTier => Boolean(t))
            .map((tier) => (
              <TierCard
                key={tier.code}
                tier={tier}
                isCurrent={quota?.tier_code === tier.code}
                duration={duration}
              />
            ))}
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto pt-6 border-t border-white/10">
        <h2 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>سوالات متداول اشتراک‌ها</span>
        </h2>
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>تفاوت پلن‌های ۳ ماهه و ۶ ماهه چیست؟</span>
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              با انتخاب دوره‌های طولانی‌تر، سهمیه دانلود شما برای کل بازه تجمیع شده و دغدغه تمدید ماهانه نخواهید داشت.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>آیا ترافیک دانلود بازی‌ها نیم‌بهاء محاسبه می‌شود؟</span>
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              بله، تمامی سرورهای اختصاصی دانلود دکتر گیم داخل دیتاسنترهای معتبر ایران میزبانی می‌شوند و برای تمامی اپراتورهای مخابراتی مشمول تخفیف ترافیک ۵۰٪ نیم‌بهاء هستند.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
