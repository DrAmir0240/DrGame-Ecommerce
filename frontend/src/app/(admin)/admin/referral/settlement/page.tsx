'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  Play,
  Loader2,
  Search,
  Zap,
  X,
  Users,
  Receipt,
  CalendarCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n';
import { useDepartmentProfile } from '@/components/admin/DepartmentLayout';
import {
  ReadOnlyGuardBanner,
  useAdminToast,
} from '@/components/admin/referral/AdminToast';
import {
  SettlementBatchDetailsResponse,
  SettlementBatchItem,
  SettlementPreviewBeneficiary,
} from '@/types/referral';

interface EnrichedPreviewBeneficiary extends SettlementPreviewBeneficiary {
  phone?: string | null;
  is_referral_blocked?: boolean;
  is_referral_hidden?: boolean;
}

interface PreviewResponse {
  total_pending_amount_toman: number;
  total_pending_transactions: number;
  total_beneficiaries: number;
  filtered_beneficiaries_count?: number;
  beneficiaries: EnrichedPreviewBeneficiary[];
  period_end: string;
}

function SettlementCenterContent() {
  const searchParams = useSearchParams();
  const { price, n, locale } = useTranslation();
  const { isReadOnly } = useDepartmentProfile();
  const { showToast } = useAdminToast();

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [batches, setBatches] = useState<SettlementBatchItem[]>([]);
  const [batchesTotal, setBatchesTotal] = useState(0);
  const [batchesPage, setBatchesPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'amount_desc' | 'amount_asc' | 'tx_desc'>('amount_desc');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  // Confirmation modals
  const [confirmGlobal, setConfirmGlobal] = useState(false);
  const [confirmSelected, setConfirmSelected] = useState(false);
  const [singleTarget, setSingleTarget] = useState<EnrichedPreviewBeneficiary | null>(null);
  const [executing, setExecuting] = useState(false);

  // Batch Details Drawer
  const [activeBatchCode, setActiveBatchCode] = useState<string | null>(
    searchParams.get('batch')
  );
  const [batchDetails, setBatchDetails] = useState<SettlementBatchDetailsResponse | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);

  const fetchPreview = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort_by: sortBy });
      if (search.trim()) params.set('search', search.trim());
      const res = await apiRequest<PreviewResponse>(
        `/admin-referral/settlement/preview?${params.toString()}`
      );
      setPreview(res);
    } catch (err: any) {
      showToast('خطا در دریافت لیست پورسانت‌های معوق', 'error', err?.message);
    }
  }, [search, sortBy, showToast]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiRequest<{
        items: SettlementBatchItem[];
        total: number;
      }>(`/admin-referral/settlement/history?page=${batchesPage}&page_size=15`);
      setBatches(res.items || []);
      setBatchesTotal(res.total || 0);
    } catch (err: any) {
      showToast('خطا در دریافت تاریخچه بچ‌های تسویه', 'error', err?.message);
    }
  }, [batchesPage, showToast]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPreview(), fetchHistory()]);
    setLoading(false);
  }, [fetchPreview, fetchHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!activeBatchCode) {
      setBatchDetails(null);
      return;
    }
    setLoadingBatch(true);
    apiRequest<SettlementBatchDetailsResponse>(
      `/admin-referral/settlement/batches/${encodeURIComponent(activeBatchCode)}`
    )
      .then((res) => setBatchDetails(res))
      .catch((err: any) =>
        showToast('خطا در بارگذاری جزئیات بچ تسویه', 'error', err?.message)
      )
      .finally(() => setLoadingBatch(false));
  }, [activeBatchCode, showToast]);

  const beneficiaries = preview?.beneficiaries || [];
  const allVisibleSelected =
    beneficiaries.length > 0 &&
    beneficiaries.every((b) => selectedUserIds.includes(b.user_id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(beneficiaries.map((b) => b.user_id));
    }
  };

  const toggleUserSelect = (uid: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const selectedTotalAmount = beneficiaries
    .filter((b) => selectedUserIds.includes(b.user_id))
    .reduce((acc, b) => acc + b.pending_amount_toman, 0);

  const handleGlobalExecute = async () => {
    setExecuting(true);
    try {
      const res = await apiRequest<{
        status: string;
        message: string;
        settled_amount_toman: number;
      }>('/admin-referral/settlement/execute', { method: 'POST' });
      showToast(
        res.message || 'تسویه سراسری با موفقیت انجام شد',
        res.status === 'empty' ? 'info' : 'success',
        res.settled_amount_toman ? `مبلغ آزادشده: ${price(res.settled_amount_toman)}` : undefined
      );
      setConfirmGlobal(false);
      setSelectedUserIds([]);
      await loadAll();
    } catch (err: any) {
      showToast('خطا در اجرای تسویه سراسری', 'error', err?.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleReleaseSelected = async () => {
    if (!selectedUserIds.length) return;
    setExecuting(true);
    try {
      const res = await apiRequest<{
        status: string;
        message: string;
        settled_amount_toman: number;
      }>('/admin-referral/settlement/release-selected', {
        method: 'POST',
        body: JSON.stringify({ user_ids: selectedUserIds }),
      });
      showToast(
        res.message || 'تسویه کاربران منتخب انجام شد',
        res.status === 'empty' ? 'info' : 'success',
        res.settled_amount_toman ? `مبلغ کل: ${price(res.settled_amount_toman)}` : undefined
      );
      setConfirmSelected(false);
      setSelectedUserIds([]);
      await loadAll();
    } catch (err: any) {
      showToast('خطا در آزادسازی کاربران منتخب', 'error', err?.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleReleaseSingle = async () => {
    if (!singleTarget) return;
    setExecuting(true);
    try {
      const res = await apiRequest<{
        status: string;
        message: string;
        settled_amount_toman: number;
      }>(`/admin-referral/settlement/release-user/${singleTarget.user_id}`, {
        method: 'POST',
      });
      showToast(
        res.message || 'رفع تعویق تکی با موفقیت انجام شد',
        'success',
        `مبلغ واریزشده به قابل برداشت: ${price(res.settled_amount_toman)}`
      );
      setSingleTarget(null);
      setSelectedUserIds((prev) => prev.filter((id) => id !== singleTarget.user_id));
      await loadAll();
    } catch (err: any) {
      showToast('خطا در آزادسازی تکی پورسانت', 'error', err?.message);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <ReadOnlyGuardBanner visible={isReadOnly} />

      {/* Header & Global Action */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-rose-400" />
            مرکز آزادسازی پورسانت‌های معوق (Settlement Center)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            بررسی صف پورسانت‌های معوقه، آزادسازی تکی یا گروهی منتخبان و ممیزی دقیق هر بچ تسویه
          </p>
        </div>

        <button
          type="button"
          disabled={isReadOnly || !preview || preview.total_pending_amount_toman <= 0}
          onClick={() => setConfirmGlobal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed self-start lg:self-auto"
        >
          <Play className="w-4 h-4" />
          اجرای تسویه سراسری (همه ذی‌نفعان)
        </button>
      </div>

      {/* 3 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0c1017] border border-amber-500/25">
          <div className="text-xs text-slate-400">جمع کل پورسانت معوق در صف</div>
          <div className="text-2xl font-black text-amber-300 tabular-nums mt-1">
            {price(preview?.total_pending_amount_toman || 0)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800">
          <div className="text-xs text-slate-400">تعداد ذی‌نفعان آماده تسویه</div>
          <div className="text-2xl font-black text-white tabular-nums mt-1">
            {n(preview?.total_beneficiaries || 0)} نفر
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800">
          <div className="text-xs text-slate-400">تعداد ردیف تراکنش معوق</div>
          <div className="text-2xl font-black text-sky-300 tabular-nums mt-1">
            {n(preview?.total_pending_transactions || 0)} ردیف
          </div>
        </div>
      </div>

      {/* Smart Settlement Queue */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#0f1520]/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی ذی‌نفع (نام، یوزرنیم، موبایل، ID)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="amount_desc">مرتب‌سازی: بیشترین مبلغ معوقه</option>
              <option value="amount_asc">کمترین مبلغ معوقه</option>
              <option value="tx_desc">بیشترین تعداد تراکنش</option>
            </select>
          </div>

          {selectedUserIds.length > 0 && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3.5 py-2">
              <span className="text-xs text-emerald-200">
                <strong>{n(selectedUserIds.length)}</strong> کاربر انتخاب شد ({price(selectedTotalAmount)})
              </span>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => setConfirmSelected(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40"
              >
                تسویه منتخبان
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-emerald-500 rounded"
                    aria-label="انتخاب همه ذی‌نفعان"
                  />
                </th>
                <th className="py-3.5 px-4 font-semibold">کاربر ذی‌نفع</th>
                <th className="py-3.5 px-4 font-semibold">تعداد تراکنش معوق</th>
                <th className="py-3.5 px-4 font-semibold">مبلغ آماده آزادسازی</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت شبکه</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && !preview ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block ml-2 text-rose-400" />
                    در حال بارگذاری صف تسویه...
                  </td>
                </tr>
              ) : beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    هیچ پورسانت معوقه‌ای برای نمایش وجود ندارد.
                  </td>
                </tr>
              ) : (
                beneficiaries.map((b) => (
                  <tr key={b.user_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(b.user_id)}
                        onChange={() => toggleUserSelect(b.user_id)}
                        className="w-4 h-4 accent-emerald-500 rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/referral/tree?user_id=${b.user_id}`}
                        className="group inline-flex flex-col"
                      >
                        <span className="font-bold text-white group-hover:text-rose-300 flex items-center gap-1">
                          {b.full_name || b.username}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-[11px] font-mono text-rose-300" dir="ltr">
                          @{b.username} (#{b.user_id})
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">
                      {n(b.transactions_count)} تراکنش
                    </td>
                    <td className="py-3 px-4 font-extrabold text-amber-300 tabular-nums">
                      {price(b.pending_amount_toman)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {b.is_referral_blocked && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px]">
                            روح‌شده
                          </span>
                        )}
                        {b.is_referral_hidden && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px]">
                            مخفی
                          </span>
                        )}
                        {!b.is_referral_blocked && !b.is_referral_hidden && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px]">
                            فعال
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setSingleTarget(b)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        رفع تعویق آنی
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Batch History */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-[#0f1520]/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              تاریخچه بچ‌های تسویه اجراشده
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              برای مشاهده لیست دریافت‌کنندگان و ردیف‌های دفتر کل هر بچ روی ردیف کلیک کنید
            </p>
          </div>
          <span className="text-xs text-slate-400">کل: {n(batchesTotal)} بچ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">کد بچ (Batch Code)</th>
                <th className="py-3.5 px-4">مبلغ تسویه‌شده</th>
                <th className="py-3.5 px-4">ذی‌نفع / تراکنش</th>
                <th className="py-3.5 px-4">مجری</th>
                <th className="py-3.5 px-4">تاریخ اجرا</th>
                <th className="py-3.5 px-4 text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    هنوز هیچ بچ تسویه‌ای ثبت نشده است.
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setActiveBatchCode(b.batch_code)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-emerald-300 font-bold" dir="ltr">
                      {b.batch_code}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-white tabular-nums">
                      {price(b.total_amount_toman)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {n(b.beneficiaries_count)} نفر · {n(b.total_transactions_count)} ردیف
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                        {b.executed_by_type === 'cron' ? 'زمان‌بندی جمعه' : 'ادمین رفرال'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {formatDateTime(b.created_at, locale)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBatchCode(b.batch_code);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px]"
                      >
                        مشاهده ردیف‌ها
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {batchesTotal > 15 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              disabled={batchesPage <= 1}
              onClick={() => setBatchesPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              صفحه قبل
            </button>
            <span>صفحه {n(batchesPage)}</span>
            <button
              type="button"
              disabled={batchesPage * 15 >= batchesTotal}
              onClick={() => setBatchesPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              صفحه بعد
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {confirmGlobal && preview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-emerald-500/35 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تایید اجرای تسویه سراسری
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تمام پورسانت‌های معوقه به مبلغ کل{' '}
              <strong className="text-white">{price(preview.total_pending_amount_toman)}</strong> برای{' '}
              <strong className="text-white">{n(preview.total_beneficiaries)} ذی‌نفع</strong> به موجودی قابل برداشت کیف پول آن‌ها منتقل خواهد شد.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmGlobal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={executing}
                onClick={handleGlobalExecute}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                {executing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                اجرای قطعی تسویه
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmSelected && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-emerald-500/35 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Users className="w-5 h-5" />
              تایید تسویه گروهی منتخبان
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              آیا پورسانت معوقه <strong className="text-white">{n(selectedUserIds.length)} کاربر منتخب</strong> به مبلغ{' '}
              <strong className="text-emerald-300">{price(selectedTotalAmount)}</strong> در یک بچ واحد آزادسازی شود؟
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmSelected(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={executing}
                onClick={handleReleaseSelected}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                {executing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                بله، آزادسازی شود
              </button>
            </div>
          </div>
        </div>
      )}

      {singleTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-emerald-500/35 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              تایید رفع تعویق آنی کاربر
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              پورسانت‌های معوقه{' '}
              <strong className="text-white">{singleTarget.full_name || singleTarget.username}</strong>{' '}
              (<span className="font-mono" dir="ltr">@{singleTarget.username}</span>) به مبلغ{' '}
              <strong className="text-emerald-300">{price(singleTarget.pending_amount_toman)}</strong> هم‌اکنون به موجودی قابل برداشت او منتقل می‌شود.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSingleTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={executing}
                onClick={handleReleaseSingle}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                {executing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                آزادسازی آنی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Details Slide-Over Drawer */}
      <AnimatePresence>
        {activeBatchCode && (
          <div className="fixed inset-0 z-[105] flex justify-end" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveBatchCode(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-xl bg-[#0c1017] border-r border-slate-800 h-full flex flex-col shadow-2xl mr-auto"
            >
              <div className="p-5 border-b border-slate-800 bg-[#090d13] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <Receipt className="w-4 h-4" />
                    جزئیات کامل بچ تسویه
                  </div>
                  <div className="font-mono text-sm font-bold text-white mt-0.5 truncate" dir="ltr">
                    {activeBatchCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBatchCode(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {loadingBatch ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    در حال دریافت ردیف‌های بچ...
                  </div>
                ) : batchDetails ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] text-emerald-300">کل مبلغ بچ</div>
                        <div className="text-xs font-black text-white mt-1 tabular-nums">
                          {price(batchDetails.batch.total_amount_toman)}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">ذی‌نفعان</div>
                        <div className="text-xs font-black text-white mt-1">
                          {n(batchDetails.batch.beneficiaries_count)} نفر
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">تعداد ردیف</div>
                        <div className="text-xs font-black text-white mt-1">
                          {n(batchDetails.batch.total_transactions_count)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {batchDetails.ledgers.map((l) => (
                        <div
                          key={l.id}
                          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{l.full_name || l.username || `کاربر #${l.user_id}`}</span>
                              {l.username && (
                                <span className="text-[11px] font-mono text-rose-300" dir="ltr">
                                  @{l.username}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">{l.description}</div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              سفارش #{l.order_payment_id} · لایه {n(l.tier_level)}
                            </div>
                          </div>
                          <div className="font-extrabold text-emerald-300 tabular-nums shrink-0">
                            {price(l.amount_toman)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminReferralSettlementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
          در حال بارگذاری مرکز تسویه...
        </div>
      }
    >
      <SettlementCenterContent />
    </Suspense>
  );
}
