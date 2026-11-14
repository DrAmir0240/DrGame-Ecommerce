'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CreditCard,
  Landmark,
  Coins,
  Share2,
  ShieldBan,
  ArrowLeft,
  CalendarClock,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDate, formatDateTime } from '@/i18n';
import { useDepartmentProfile } from '@/components/admin/DepartmentLayout';
import { ReadOnlyGuardBanner, useAdminToast } from '@/components/admin/referral/AdminToast';
import { ReferralOverviewResponse } from '@/types/referral';

export default function ReferralOverviewPage() {
  const { price, n, locale } = useTranslation();
  const { isReadOnly } = useDepartmentProfile();
  const { showToast } = useAdminToast();
  const [data, setData] = useState<ReferralOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<ReferralOverviewResponse>('/admin-referral/overview');
      setData(res);
    } catch (err: any) {
      showToast('خطا در بارگذاری نمای کلی دپارتمان رفرال', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const m = data?.metrics;

  return (
    <div className="space-y-6" dir="rtl">
      <ReadOnlyGuardBanner visible={isReadOnly} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-rose-400" />
            میز فرماندهی بازاریابی، رفرال و تسویه‌ها
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            پایش زنده تعهدات معوق، درخواست‌های برداشت، تایید حساب‌ها، سلامت زنجیره و صندوق خزانه
          </p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
          به‌روزرسانی لحظه‌ای
        </button>
      </div>

      {/* 6 Live KPI Cards */}
      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl border border-slate-800 bg-[#0c1017] animate-pulse p-5"
            />
          ))}
        </div>
      ) : m ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* KPI 1: Pending Commissions */}
          <Link
            href="/admin/referral/settlement"
            className="group p-5 rounded-2xl bg-[#0c1017] border border-amber-500/25 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">
                پورسانت معوقه آماده تسویه
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {price(m.pending_commissions_toman)}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-slate-400">
                <span>
                  {n(m.pending_beneficiaries_count)} ذی‌نفع ({n(m.pending_transactions_count)} تراکنش)
                </span>
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <CalendarClock className="w-3 h-3" />
                  جمعه: {formatDate(m.next_settlement_date, locale)}
                </span>
              </div>
            </div>
          </Link>

          {/* KPI 2: Pending Payouts */}
          <Link
            href="/admin/referral/payouts"
            className={`group p-5 rounded-2xl bg-[#0c1017] border transition-all flex flex-col justify-between gap-3 ${
              m.pending_payouts_count > 0
                ? 'border-rose-500/40 hover:border-rose-500/70'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">
                برداشت‌های در انتظار واریز
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {n(m.pending_payouts_count)} درخواست
              </div>
              <div className="text-[11px] text-rose-300 mt-2 tabular-nums">
                مجموع تعهد: {price(m.pending_payouts_amount_toman)}
              </div>
            </div>
          </Link>

          {/* KPI 3: Unverified Accounts */}
          <Link
            href="/admin/referral/accounts"
            className={`group p-5 rounded-2xl bg-[#0c1017] border transition-all flex flex-col justify-between gap-3 ${
              m.unverified_accounts_count > 0
                ? 'border-sky-500/35 hover:border-sky-500/60'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">
                حساب‌های بانکی منتظر تایید
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {n(m.unverified_accounts_count)} حساب
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                از مجموع {n(m.total_accounts_count)} حساب ثبت‌شده
              </div>
            </div>
          </Link>

          {/* KPI 4: Treasury Pool Balance */}
          <Link
            href="/admin/referral/treasury"
            className="group p-5 rounded-2xl bg-[#0c1017] border border-emerald-500/25 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">
                موجودی صندوق کل خزانه‌داری
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 tabular-nums">
                {price(m.treasury_balance_toman)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 tabular-nums">
                ورودی کل: {price(m.treasury_total_collected_toman)} · توزیع: {price(m.treasury_total_distributed_toman)}
              </div>
            </div>
          </Link>

          {/* KPI 5: Total Chains */}
          <Link
            href="/admin/referral/tree"
            className="group p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">
                کل پیوندهای شبکه رفرال
              </span>
              <div className="p-2 rounded-xl bg-slate-800 text-rose-400 border border-slate-700">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {n(m.total_chains_count)} پیوند
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 group-hover:text-rose-300 transition-colors">
                ورود به مرکز رهگیری شجره‌نامه
                <ArrowLeft className="w-3 h-3" />
              </div>
            </div>
          </Link>

          {/* KPI 6: Active Blacklist */}
          <Link
            href="/admin/referral/tree?tab=blacklist"
            className="group p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-slate-400">
                کاربران فعال در لیست سیاه
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <ShieldBan className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white tabular-nums">
                {n(m.active_blacklist_count)} کاربر
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                مشاهده و مدیریت مسدودی‌ها و حالت روح
              </div>
            </div>
          </Link>
        </div>
      ) : null}

      {/* Urgent Action Queue + Recent Settlement Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Queue */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 bg-[#0f1520]/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              صف اقدامات فوری (برداشت و تایید حساب)
            </h2>
            <Link
              href="/admin/referral/payouts"
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              مدیریت کامل
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {(!data?.recent_pending_payouts?.length &&
              !data?.recent_pending_accounts?.length) ? (
              <div className="py-10 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-500/70" />
                در حال حاضر درخواست برداشت یا حساب بانکی در صف انتظار وجود ندارد.
              </div>
            ) : (
              <>
                {data?.recent_pending_payouts.map((p) => (
                  <div
                    key={`po-${p.id}`}
                    className="p-3 rounded-xl bg-slate-900/70 border border-rose-500/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px]">
                          برداشت #{n(p.id)}
                        </span>
                        <span className="truncate">{p.user_name || p.user_username}</span>
                        <span className="font-mono text-slate-400 text-[11px]" dir="ltr">
                          @{p.user_username}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                        مبلغ: <strong className="text-emerald-300">{price(p.amount_toman)}</strong> ·{' '}
                        {p.account_type === 'crypto' ? 'تتر / کریپتو' : p.bank_name || 'بانک ایران'}
                      </div>
                    </div>
                    <Link
                      href="/admin/referral/payouts"
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0"
                    >
                      بررسی
                    </Link>
                  </div>
                ))}

                {data?.recent_pending_accounts.map((acc) => (
                  <div
                    key={`acc-${acc.id}`}
                    className="p-3 rounded-xl bg-slate-900/70 border border-sky-500/20 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px]">
                          حساب #{n(acc.id)}
                        </span>
                        <span className="truncate">{acc.account_holder || acc.user_full_name || acc.username}</span>
                        <span className="font-mono text-slate-400 text-[11px]" dir="ltr">
                          @{acc.username}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 truncate" dir="ltr">
                        {acc.sheba_number || acc.crypto_wallet_address || acc.bank_name}
                      </div>
                    </div>
                    <Link
                      href="/admin/referral/accounts"
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shrink-0"
                    >
                      تایید حساب
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Recent Settlement Batches */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 bg-[#0f1520]/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              آخرین بچ‌های آزادسازی پورسانت
            </h2>
            <Link
              href="/admin/referral/settlement"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              مرکز تسویه
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 space-y-2.5 flex-1">
            {!data?.recent_batches?.length ? (
              <div className="py-10 text-center text-xs text-slate-500">
                هنوز بچ تسویه‌ای ثبت نشده است.
              </div>
            ) : (
              data.recent_batches.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/referral/settlement?batch=${encodeURIComponent(b.batch_code)}`}
                  className="block p-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/70 border border-slate-800 hover:border-emerald-500/30 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-emerald-300 font-bold truncate" dir="ltr">
                      {b.batch_code}
                    </span>
                    <span className="font-extrabold text-white tabular-nums shrink-0">
                      {price(b.total_amount_toman)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span>
                      {n(b.beneficiaries_count)} ذی‌نفع · {n(b.total_transactions_count)} تراکنش
                    </span>
                    <span>{formatDateTime(b.created_at, locale)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
