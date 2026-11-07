'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';
import {
  Clock,
  Play,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Coins,
  Receipt,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { SettlementPreviewResponse, SettlementBatchItem } from '@/types/referral';

export default function AdminReferralSettlementPage() {
  const { t, n, price, d } = useTranslation();
  const [preview, setPreview] = useState<SettlementPreviewResponse | null>(null);
  const [history, setHistory] = useState<SettlementBatchItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prevData, histData] = await Promise.all([
        apiRequest<SettlementPreviewResponse>('/admin-referral/settlement/preview').catch(() => null),
        apiRequest<{ items: SettlementBatchItem[]; total: number }>(
          `/admin-referral/settlement/history?page=${page}&page_size=15`
        ).catch(() => ({ items: [], total: 0 })),
      ]);
      setPreview(prevData);
      setHistory(histData.items || []);
      setHistoryTotal(histData.total || 0);
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ type: 'error', text: err.message || 'خطا در بارگذاری اطلاعات تسویه' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleExecuteSettlement = async () => {
    if (!preview || preview.total_pending_amount_toman === 0) {
      alert('تراکنش معوقه‌ای برای تسویه وجود ندارد.');
      return;
    }
    const confirmSettle = window.confirm(
      `آیا از اجرای تسویه هفتگی برای ${n(preview.total_beneficiaries)} کاربر به مجموع مبلغ ${price(
        preview.total_pending_amount_toman
      )} اطمینان دارید؟ مبالغ فوراً به موجودی قابل برداشت واریز خواهد شد.`
    );
    if (!confirmSettle) return;

    setExecuting(true);
    setAlertMsg(null);
    try {
      const res = await apiRequest<any>('/admin-referral/settlement/execute', {
        method: 'POST',
      });
      setAlertMsg({ type: 'success', text: res.message || 'تسویه هفتگی با موفقیت اجرا شد.' });
      await loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'خطا در اجرای تسویه هفتگی' });
    } finally {
      setExecuting(false);
    }
  };

  const totalPages = Math.ceil(historyTotal / 15) || 1;

  return (
    <div className="space-y-6 font-vazir text-start">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-rose-400" />
            <span>مرکز فرماندهی تسویه هفتگی پورسانت‌ها</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            بررسی و تجمیع هفتگی پورسانت‌های معلق رفرال و انتقال به موجودی قابل برداشت ذی‌نفعان
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>پیش‌نمایش دوره‌ای (Dry-Run)</span>
          </button>

          <button
            type="button"
            onClick={handleExecuteSettlement}
            disabled={executing || !preview || preview.total_pending_amount_toman === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-95 text-black font-black text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>{executing ? 'در حال اجرای تسویه...' : 'اجرای تسویه هفتگی (Execute Batch)'}</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {alertMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Summary Cards of Current Week */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-amber-500/30 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>مجموع پورسانت‌های معلق این دوره</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Pending
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono" dir="ltr">
            {price(preview?.total_pending_amount_toman || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            آماده برای تسویه و واریز به کیف پول کاربران
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1017] border border-cyan-500/30 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>تعداد ذی‌نفعان دوره</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Beneficiaries
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono" dir="ltr">
            {n(preview?.total_beneficiaries || 0)} <span className="text-xs text-slate-400 font-vazir">کاربر</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            تعداد حساب‌های یکتایی که پورسانت دریافت خواهند کرد
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1017] border border-purple-500/30 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-purple-300">
              <Receipt className="w-4 h-4 text-purple-400" />
              <span>تعداد تراکنش‌های معلق</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Transactions
            </span>
          </div>
          <div className="text-2xl font-black text-white font-mono" dir="ltr">
            {n(preview?.total_pending_transactions || 0)} <span className="text-xs text-slate-400 font-vazir">رکورد لجر</span>
          </div>
          <span className="text-[11px] text-slate-500 block">
            تراکنش‌های ناشی از خرید اشتراک زیرمجموعه‌ها
          </span>
        </div>
      </div>

      {/* Settlement History Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <span>تاریخچه بچ‌های تسویه‌شده هفتگی (Settlement Batches)</span>
          </h2>
          <span className="text-xs text-slate-500">
            مجموع {n(historyTotal)} بچ ثبت شده
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold">
                <th className="py-3 px-4 text-start">شناسه / کد بچ</th>
                <th className="py-3 px-4 text-start">مبلغ کل تسویه</th>
                <th className="py-3 px-4 text-center">تعداد تراکنش</th>
                <th className="py-3 px-4 text-center">تعداد ذی‌نفعان</th>
                <th className="py-3 px-4 text-center">نوع مجری</th>
                <th className="py-3 px-4 text-start">تاریخ و ساعت اجرا</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    در حال بارگذاری تاریخچه تسویه‌ها...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    هنوز هیچ بچ تسویه هفتگی در سیستم ثبت نشده است.
                  </td>
                </tr>
              ) : (
                history.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {batch.batch_code}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400" dir="ltr">
                      {price(batch.total_amount_toman)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300">
                      {n(batch.total_transactions_count)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {n(batch.beneficiaries_count)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                        {batch.executed_by_type === 'admin' ? 'ادمین پلتفرم' : 'جاب زمان‌بندی (Cron)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {d(batch.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              صفحه {n(page)} از {n(totalPages)}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dry-Run Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#0e121c] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">پیش‌نمایش کاربران و مبالغ در انتظار تسویه</h3>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span>تعداد کاربران: <strong className="text-white">{n(preview?.total_beneficiaries || 0)}</strong></span>
                <span>مجموع مبالغ: <strong className="text-emerald-400">{price(preview?.total_pending_amount_toman || 0)}</strong></span>
              </div>

              <div className="overflow-x-auto max-h-[50vh]">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">کاربر</th>
                      <th className="py-2.5 px-3 text-start">نام</th>
                      <th className="py-2.5 px-3 text-center">تعداد تراکنش</th>
                      <th className="py-2.5 px-3 text-end">مبلغ واریزی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {preview?.beneficiaries.map((b) => (
                      <tr key={b.user_id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-300">
                          {b.username}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{b.full_name || '—'}</td>
                        <td className="py-2.5 px-3 text-center text-slate-400">{n(b.transactions_count)}</td>
                        <td className="py-2.5 px-3 text-end font-mono font-bold text-emerald-400" dir="ltr">
                          {price(b.pending_amount_toman)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
