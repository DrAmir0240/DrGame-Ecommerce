'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/apiClient';
import { SubscriptionTier, DiscountValidationResult, CheckoutResponse } from '@/types/subscription';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import { ShieldCheck, Tag, ArrowRight, CheckCircle2, AlertCircle, Sparkles, CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tierCode = searchParams.get('tier') || 'silver';

  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { fetchQuota } = useQuotaStore();

  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [discountResult, setDiscountResult] = useState<DiscountValidationResult | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<CheckoutResponse | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTier() {
      try {
        const tiers = await apiRequest<SubscriptionTier[]>('/subscriptions/tiers');
        const found = tiers.find((t) => t.code === tierCode) || tiers.find((t) => t.code === 'silver');
        if (found) setTier(found);
      } catch (e) {
        console.error('Failed to load tier details:', e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTier();
  }, [tierCode]);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim() || !tier) return;

    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const priceToman = tier.price_toman ?? (tier.price_irr ? Math.floor(tier.price_irr / 10) : 0);
      const res = await apiRequest<DiscountValidationResult>('/subscriptions/discount/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: discountCode.trim(),
          original_price: priceToman,
        }),
      });
      setDiscountResult(res);
    } catch (err: any) {
      setDiscountResult(null);
      setDiscountError(err.message || 'کد تخفیف معتبر نیست یا منقضی شده است.');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (!tier) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const isValidDiscount = discountResult?.valid || discountResult?.is_valid;
      const res = await apiRequest<CheckoutResponse>('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({
          tier_code: tier.code,
          discount_code: isValidDiscount ? discountResult.code : undefined,
          payment_method: 'simulation',
        }),
      });

      setCheckoutSuccess(res);
      // Refresh global quota
      fetchQuota();
    } catch (err: any) {
      setCheckoutError(err.message || 'خطا در برقراری ارتباط با درگاه پرداخت.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cosmic-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tier) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">پلن اشتراک پیدا نشد</h2>
        <Link href="/subscriptions" className="text-cosmic-purple hover:underline text-sm">
          مشاهده تمام پلن‌ها
        </Link>
      </div>
    );
  }

  const originalPriceToman = tier.price_toman ?? (tier.price_irr ? Math.floor(tier.price_irr / 10) : 0);
  const discountToman = discountResult ? (discountResult.discount_amount ?? Math.floor((discountResult.discount_amount_irr || 0) / 10)) : 0;
  const finalPriceToman = discountResult ? (discountResult.final_price ?? Math.floor((discountResult.final_price_irr || 0) / 10)) : originalPriceToman;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Back button */}
      <Link
        href="/subscriptions"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors mb-8"
      >
        <ArrowRight className="w-4 h-4" />
        <span>بازگشت به لیست اشتراک‌ها</span>
      </Link>

      {checkoutSuccess ? (
        /* Order Success View */
        <div className="glass-card rounded-3xl border border-emerald-500/30 p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            پرداخت با موفقیت انجام شد!
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            اشتراک شما بلافاصله فعال گردید و حجم آن به حسابتان منظور شد.
          </p>

          <div className="max-w-md mx-auto rounded-2xl bg-white/[0.03] border border-white/10 p-5 mb-8 text-right space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">شماره پیگیری تراکنش:</span>
              <span className="font-mono font-bold text-white">
                {checkoutSuccess.tracking_code || checkoutSuccess.transaction_ref || 'TRX-SUCCESS'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">پلن خریداری شده:</span>
              <span className="font-bold text-white">
                {checkoutSuccess.tier_name || tier.name_fa || tier.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">مبلغ پرداخت شده:</span>
              <span className="font-mono font-bold text-emerald-400">
                {(checkoutSuccess.final_amount_irr
                  ? Math.floor(checkoutSuccess.final_amount_irr / 10)
                  : finalPriceToman
                ).toLocaleString('fa-IR')}{' '}
                تومان
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">اعتبار تا تاریخ:</span>
              <span className="font-mono text-text-muted">
                {new Date(checkoutSuccess.expires_at || checkoutSuccess.end_date || Date.now()).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/games"
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-cosmic-gradient text-white font-bold text-sm shadow-neon-purple hover:opacity-95 transition-all"
            >
              دانلود بازی‌ها
            </Link>
            <Link
              href="/profile"
              className="w-full sm:w-auto px-8 py-3 rounded-2xl glass-card border border-white/10 hover:border-white/20 text-white font-bold text-sm transition-all"
            >
              مشاهده پروفایل و سهمیه
            </Link>
          </div>
        </div>
      ) : (
        /* Order Review and Payment View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan Summary */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8">
              <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                <div>
                  <span className="text-xs text-text-muted block mb-1">پلن انتخابی شما:</span>
                  <h2 className="text-2xl font-black text-white">{tier.name_fa || tier.name}</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-cosmic-purple/20 border border-cosmic-purple/40 text-cosmic-purple text-xs font-bold">
                  {tier.badge || (tier.code === 'gold' ? 'طلایی VIP' : tier.code === 'silver' ? 'نقره‌ای محبوب' : tier.code === 'bronze' ? 'اقتصادی' : 'پایه رایگان')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-text-muted block mb-1">حجم اختصاصی</span>
                  <span className="text-lg font-black text-white font-mono">{tier.quota_gb} گیگابایت</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-text-muted block mb-1">مدت اعتبار</span>
                  <span className="text-lg font-black text-white">۳۰ روز کامل</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-text-muted block mb-1">سرعت دانلود</span>
                  <span className="text-lg font-black text-emerald-400">
                    {tier.speed_limit_mbps
                      ? `${tier.speed_limit_mbps} مگابیت`
                      : tier.max_download_speed_mbps
                        ? `${tier.max_download_speed_mbps} مگابیت`
                        : 'نامحدود'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <span className="text-xs text-text-muted block mb-1">دانلود همزمان</span>
                  <span className="text-lg font-black text-white">
                    {tier.concurrent_downloads || (tier.code === 'gold' ? 5 : tier.code === 'silver' ? 3 : 2)} پارت همزمان
                  </span>
                </div>
              </div>

              {/* Coupon Form */}
              <div className="pt-6 border-t border-white/5">
                <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-cosmic-purple" />
                  <span>کد تخفیف دارید؟</span>
                </span>

                <form onSubmit={handleApplyDiscount} className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="کد تخفیف (مثال: GAMEON)"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-text-muted focus:outline-none focus:border-cosmic-purple"
                  />
                  <button
                    type="submit"
                    disabled={discountLoading || !discountCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {discountLoading ? 'بررسی...' : 'اعمال'}
                  </button>
                </form>

                {discountResult && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{discountResult.message} ({discountResult.discount_percent}٪ تخفیف اعمال شد)</span>
                  </div>
                )}

                {discountError && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{discountError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checkout Box */}
          <div className="space-y-6">
            <div className="glass-card rounded-3xl border border-white/10 p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cosmic-purple" />
                  <span>فاکتور نهایی</span>
                </h3>

                <div className="space-y-3 text-xs border-b border-white/5 pb-4 mb-4">
                  <div className="flex justify-between text-text-secondary">
                    <span>مبلغ پلن:</span>
                    <span className="font-mono text-white">{originalPriceToman.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  {discountResult && (
                    <div className="flex justify-between text-emerald-400">
                      <span>تخفیف ({discountResult.discount_percent}٪):</span>
                      <span className="font-mono">- {discountToman.toLocaleString('fa-IR')} تومان</span>
                    </div>
                  )}
                  <div className="flex justify-between text-text-secondary">
                    <span>مالیات و کارمزد:</span>
                    <span className="text-white">۰ تومان</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-sm font-bold text-white">مبلغ قابل پرداخت:</span>
                  <span className="text-2xl font-black text-white font-mono">
                    {finalPriceToman.toLocaleString('fa-IR')} <span className="text-xs font-normal text-text-muted">تومان</span>
                  </span>
                </div>

                {checkoutError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 rounded-2xl bg-cosmic-gradient hover:opacity-95 text-white font-black text-sm shadow-neon-purple transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{checkoutLoading ? 'در حال اتصال به درگاه...' : 'پرداخت آنلاین و فعال‌سازی'}</span>
                </button>

                <p className="text-[11px] text-text-muted text-center mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>پرداخت امن از طریق شبکه شتاب با شبیه‌ساز رسمی</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CheckoutContent />
    </Suspense>
  );
}
