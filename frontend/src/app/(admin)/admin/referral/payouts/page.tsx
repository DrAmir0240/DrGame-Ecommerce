'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n';
import { useDepartmentProfile } from '@/components/admin/DepartmentLayout';
import {
  ReadOnlyGuardBanner,
  useAdminToast,
} from '@/components/admin/referral/AdminToast';
import CopyableValue from '@/components/admin/referral/CopyableValue';
import { AdminPayoutItem, AdminPayoutListResponse } from '@/types/referral';

type StatusTab = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminReferralPayoutsPage() {
  const { price, n, locale } = useTranslation();
  const { isReadOnly } = useDepartmentProfile();
  const { showToast } = useAdminToast();

  const [data, setData] = useState<AdminPayoutListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [processingItem, setProcessingItem] = useState<AdminPayoutItem | null>(null);
  const [actionStatus, setActionStatus] = useState<'approved' | 'rejected'>('approved');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [inspectReceiptItem, setInspectReceiptItem] = useState<AdminPayoutItem | null>(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status_filter: statusTab,
      });
      if (search.trim()) params.set('search', search.trim());
      const res = await apiRequest<AdminPayoutListResponse>(
        `/admin-referral/payouts?${params.toString()}`
      );
      setData(res);
    } catch (err: any) {
      showToast('خطا در دریافت لیست درخواست‌های برداشت', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusTab, search, showToast]);

  useEffect(() => {
    const timer = setTimeout(loadPayouts, 200);
    return () => clearTimeout(timer);
  }, [loadPayouts]);

  const openProcessModal = (item: AdminPayoutItem, mode: 'approved' | 'rejected') => {
    setProcessingItem(item);
    setActionStatus(mode);
    setReceiptUrl('');
    setNotes('');
  };

  const handleSubmitProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingItem) return;
    setSubmitting(true);
    try {
      await apiRequest(`/admin-referral/payouts/${processingItem.id}/process`, {
        method: 'POST',
        body: JSON.stringify({
          new_status: actionStatus,
          admin_receipt_url: receiptUrl.trim() || null,
          admin_notes: notes.trim() || null,
        }),
      });
      showToast(
        actionStatus === 'approved'
          ? 'درخواست برداشت تایید و تسویه شد'
          : 'درخواست برداشت رد و مبلغ به کیف پول کاربر برگشت داده شد',
        actionStatus === 'approved' ? 'success' : 'info'
      );
      setProcessingItem(null);
      await loadPayouts();
    } catch (err: any) {
      showToast('خطا در پردازش درخواست برداشت', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = data?.summary;
  const items = data?.items || [];

  return (
    <div className="space-y-6" dir="rtl">
      <ReadOnlyGuardBanner visible={isReadOnly} />

      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-400" />
            درخواست‌های برداشت و واریز وجه (شبا و تتر)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            بررسی اطلاعات مقصد واریز همکاران، ثبت شماره پیگیری/فیش بانکی یا رد درخواست همراه با بازگشت خودکار وجه به کیف پول
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 tabular-nums">
            در انتظار: <strong>{n(summary?.pending_count || 0)}</strong> ({price(summary?.pending_amount_toman || 0)})
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
            تاییدشده: <strong>{n(summary?.approved_count || 0)}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300">
            ردشده: <strong>{n(summary?.rejected_count || 0)}</strong>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'pending', label: 'در انتظار واریز' },
            { key: 'approved', label: 'تایید و واریزشده' },
            { key: 'rejected', label: 'ردشده' },
            { key: 'all', label: 'همه درخواست‌ها' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusTab(tab.key as StatusTab);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                statusTab === tab.key
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو نام، یوزرنیم، موبایل، شبا یا شناسه..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">شناسه / تاریخ</th>
                <th className="py-3.5 px-4">کاربر درخواست‌دهنده</th>
                <th className="py-3.5 px-4">مبلغ برداشت</th>
                <th className="py-3.5 px-4">مقصد واریز (شبا / کارت / ولت)</th>
                <th className="py-3.5 px-4">وضعیت</th>
                <th className="py-3.5 px-4 text-center">اقدام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block ml-2 text-rose-400" />
                    در حال بارگذاری درخواست‌ها...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    هیچ درخواست برداشتی در این بخش ثبت نشده است.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-200">#{item.id}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(item.created_at, locale)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <Link
                        href={`/admin/referral/tree?user_id=${item.user_id}`}
                        className="font-bold text-white hover:text-rose-300 block"
                      >
                        {item.user_name || item.user_username}
                      </Link>
                      <div className="text-[11px] font-mono text-rose-300" dir="ltr">
                        @{item.user_username || `user_${item.user_id}`}
                      </div>
                      {item.user_phone && (
                        <div>
                          <CopyableValue value={item.user_phone} maxWidthClass="max-w-[130px]" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-black text-emerald-300 text-sm tabular-nums">
                      {price(item.amount_toman)}
                    </td>

                    <td className="py-3.5 px-4 space-y-1.5">
                      {item.account_type === 'crypto' ? (
                        <>
                          <div className="text-[11px] font-semibold text-sky-300">
                            رمزارز · شبکه {item.crypto_network || 'USDT'}
                          </div>
                          <CopyableValue value={item.crypto_wallet_address} maxWidthClass="max-w-[240px]" />
                        </>
                      ) : (
                        <>
                          <div className="text-[11px] font-semibold text-slate-200">
                            {item.bank_name || 'بانک ایران'} · {item.account_holder || '—'}
                          </div>
                          {item.sheba_number && (
                            <div>
                              <CopyableValue value={item.sheba_number} maxWidthClass="max-w-[240px]" />
                            </div>
                          )}
                          {item.card_number && (
                            <div>
                              <CopyableValue value={item.card_number} maxWidthClass="max-w-[200px]" />
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                          <Clock className="w-3 h-3" />
                          در انتظار واریز
                        </span>
                      ) : item.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          تایید و واریزشده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-semibold">
                          <XCircle className="w-3 h-3" />
                          ردشده (عودت وجه)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => openProcessModal(item, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            واریز و تایید
                          </button>
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => openProcessModal(item, 'rejected')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/30 text-[11px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            رد
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setInspectReceiptItem(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          فیش و یادداشت
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(data?.total || 0) > 20 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              صفحه قبل
            </button>
            <span>
              صفحه {n(page)} از {n(Math.ceil((data?.total || 0) / 20))}
            </span>
            <button
              type="button"
              disabled={page * 20 >= (data?.total || 0)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              صفحه بعد
            </button>
          </div>
        )}
      </div>

      {/* Process Payout Modal */}
      {processingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  actionStatus === 'approved' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {actionStatus === 'approved' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    تایید و ثبت واریز برداشت #{processingItem.id}
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    رد درخواست و بازگشت به کیف پول
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setProcessingItem(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">درخواست‌دهنده:</span>
                <strong className="text-white">
                  {processingItem.user_name} (@{processingItem.user_username})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مبلغ قابل واریز:</span>
                <strong className="text-emerald-300 tabular-nums">
                  {price(processingItem.amount_toman)}
                </strong>
              </div>
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-slate-400 shrink-0">حساب مقصد:</span>
                <CopyableValue
                  value={
                    processingItem.sheba_number ||
                    processingItem.crypto_wallet_address ||
                    processingItem.card_number
                  }
                />
              </div>
            </div>

            <form onSubmit={handleSubmitProcess} className="space-y-3.5">
              {actionStatus === 'approved' && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">
                    شماره پیگیری بانکی / لینک رسید واریز
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="شماره ارجاع پایا/ساتنا یا TxHash..."
                    dir="ltr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  توضیحات ادمین {actionStatus === 'rejected' ? '(علت رد درخواست)' : '(اختیاری)'}
                </label>
                <textarea
                  rows={2}
                  required={actionStatus === 'rejected'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    actionStatus === 'rejected'
                      ? 'مثلاً عدم تطابق مالک شبا با کاربر...'
                      : 'توضیحات تکمیلی واریز...'
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProcessingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 ${
                    actionStatus === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {actionStatus === 'approved' ? 'ثبت تایید و واریز' : 'رد درخواست و عودت مبلغ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Processed Receipt/Notes Modal */}
      {inspectReceiptItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                جزئیات رسید و ممیزی برداشت #{inspectReceiptItem.id}
              </h3>
              <button
                type="button"
                onClick={() => setInspectReceiptItem(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px] mb-1">کد پیگیری / لینک رسید</div>
                <CopyableValue value={inspectReceiptItem.admin_receipt_url} />
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px] mb-1">یادداشت مدیر</div>
                <div className="text-slate-200">{inspectReceiptItem.admin_notes || 'ثبت نشده'}</div>
              </div>
              <div className="text-[11px] text-slate-400">
                زمان پردازش:{' '}
                {inspectReceiptItem.processed_at
                  ? formatDateTime(inspectReceiptItem.processed_at, locale)
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
