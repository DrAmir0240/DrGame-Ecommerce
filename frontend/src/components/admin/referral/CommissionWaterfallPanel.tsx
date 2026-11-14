'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  Coins,
  EyeOff,
  Loader2,
  Receipt,
  Search,
  ShieldBan,
  CheckCircle2,
  Clock,
  Landmark,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n';
import {
  OrderWaterfallTraceResponse,
  RecentCommissionOrderItem,
} from '@/types/referral';
import { useAdminToast } from './AdminToast';

interface CommissionWaterfallPanelProps {
  focusedUserId: number | null;
  focusedUsername?: string;
  externalOrderId?: number | null;
  onInspectUser: (userId: number) => void;
}

export default function CommissionWaterfallPanel({
  focusedUserId,
  focusedUsername,
  externalOrderId,
  onInspectUser,
}: CommissionWaterfallPanelProps) {
  const { price, n, locale } = useTranslation();
  const { showToast } = useAdminToast();

  // Real Order Trace State
  const [recentOrders, setRecentOrders] = useState<RecentCommissionOrderItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [traceData, setTraceData] = useState<OrderWaterfallTraceResponse | null>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);

  useEffect(() => {
    setLoadingOrders(true);
    const qs = focusedUserId ? `?user_id=${focusedUserId}&limit=15` : '?limit=15';
    apiRequest<RecentCommissionOrderItem[]>(`/admin-referral/commissions/recent-orders${qs}`)
      .then((rows) => {
        setRecentOrders(rows || []);
        if (rows?.length && !externalOrderId) {
          setSelectedOrderId(String(rows[0].order_payment_id));
        }
      })
      .catch(() => setRecentOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [focusedUserId, externalOrderId]);

  useEffect(() => {
    if (externalOrderId) {
      setSelectedOrderId(String(externalOrderId));
      runOrderTrace(externalOrderId);
    }
  }, [externalOrderId]);

  const runOrderTrace = async (oid: number) => {
    if (!oid) return;
    setLoadingTrace(true);
    try {
      const res = await apiRequest<OrderWaterfallTraceResponse>(
        `/admin-referral/orders/${oid}/trace`
      );
      setTraceData(res);
    } catch (err: any) {
      showToast('خطا در ردیابی آبشار سفارش', 'error', err?.message);
    } finally {
      setLoadingTrace(false);
    }
  };

  useEffect(() => {
    if (selectedOrderId) {
      const numeric = parseInt(selectedOrderId, 10);
      if (!Number.isNaN(numeric) && numeric > 0) {
        runOrderTrace(numeric);
      }
    }
  }, [selectedOrderId]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0f1520]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            ردیاب مالی آبشار پورسانت ۲۱٪ هر سفارش (Order Waterfall Tracer)
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            کالبدشکافی تقسیم واقعی پورسانت یک سفارش ثبت‌شده بین لایه‌های بالادست و خزانه کل
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-semibold self-start sm:self-auto">
          <Receipt className="w-3.5 h-3.5" />
          ردیاب سفارش واقعی
        </span>
      </div>

      {/* Real Order Trace Content */}
      <div className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-8">
              <label className="block text-[11px] text-slate-400 mb-1.5">
                انتخاب از آخرین سفارش‌های شبکه {focusedUsername ? `(مرتبط با @${focusedUsername})` : ''}
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                disabled={loadingOrders}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {recentOrders.length === 0 ? (
                  <option value="">سفارشی در این شاخه یافت نشد</option>
                ) : (
                  recentOrders.map((o) => (
                    <option key={o.order_payment_id} value={String(o.order_payment_id)}>
                      سفارش #{o.order_payment_id} — @{o.buyer_username} ({price(o.final_price)}) · سهم کاربران: {price(o.user_commission_toman)} · خزانه: {price(o.treasury_commission_toman)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const oid = parseInt(selectedOrderId, 10);
                if (oid) runOrderTrace(oid);
              }}
              className="md:col-span-4 flex items-center gap-2"
            >
              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 mb-1.5">
                  یا ورود شماره سفارش
                </label>
                <input
                  type="number"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  placeholder="Order ID"
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="submit"
                disabled={loadingTrace || !selectedOrderId}
                className="mt-5 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingTrace ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                ردیابی
              </button>
            </form>
          </div>

          {loadingTrace ? (
            <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              در حال تحلیل دفتر کل سفارش...
            </div>
          ) : traceData ? (
            <div className="space-y-4">
              {/* Order Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400">مبلغ پرداختی سفارش #{traceData.order.id}</div>
                  <div className="text-sm font-extrabold text-white tabular-nums mt-1">
                    {price(traceData.order.final_price)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspectUser(traceData.order.buyer.id)}
                    className="text-[11px] text-sky-400 hover:underline mt-1 font-mono"
                    dir="ltr"
                  >
                    خریدار: @{traceData.order.buyer.username}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="text-[10px] text-sky-300">کل بودجه ۲۱٪ شبکه</div>
                  <div className="text-sm font-extrabold text-white tabular-nums mt-1">
                    {price(traceData.summary.budget_21_toman)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    ۷۹٪ فروشگاه: {price(traceData.summary.shop_share_79_toman)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-300">توزیع به معرف‌های شبکه</div>
                  <div className="text-sm font-extrabold text-white tabular-nums mt-1">
                    {price(traceData.summary.user_distributed_toman)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    تسویه‌شده: {price(traceData.summary.settled_toman)} · معوقه: {price(traceData.summary.pending_toman)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-amber-300">انتقال به صندوق کل خزانه</div>
                  <div className="text-sm font-extrabold text-white tabular-nums mt-1">
                    {price(traceData.summary.treasury_diverted_toman)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatDateTime(traceData.order.created_at, locale)}
                  </div>
                </div>
              </div>

              {/* Recorded Ledgers Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>ردیف‌های دفتر کل ثبت‌شده (Commission Ledger)</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    {n(traceData.recorded_ledgers.length)} ردیف
                  </span>
                </div>
                {traceData.recorded_ledgers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    برای این سفارش هنوز ردیف پورسانتی ثبت نشده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">لایه</th>
                          <th className="py-2.5 px-3">ذی‌نفع</th>
                          <th className="py-2.5 px-3">مبلغ</th>
                          <th className="py-2.5 px-3">وضعیت</th>
                          <th className="py-2.5 px-3">شرح و بچ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {traceData.recorded_ledgers.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono">
                              {l.tier_level === 0 ? (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                  مانده (Leftover)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 text-[10px]">
                                  لایه {n(l.tier_level)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {l.beneficiary_type === 'treasury' ? (
                                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                                  <Landmark className="w-3.5 h-3.5 shrink-0" />
                                  <span>صندوق کل خزانه</span>
                                  {l.username && (
                                    <span className="text-[10px] text-rose-300 font-mono" dir="ltr">
                                      (بابت @{l.username})
                                    </span>
                                  )}
                                </div>
                              ) : l.user_id ? (
                                <button
                                  type="button"
                                  onClick={() => onInspectUser(l.user_id!)}
                                  className="text-right hover:text-rose-300 transition-colors"
                                >
                                  <div className="font-semibold text-white">
                                    {l.full_name || l.username}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400" dir="ltr">
                                    @{l.username}
                                  </div>
                                </button>
                              ) : (
                                <span className="text-slate-400">سیستمی</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white tabular-nums">
                              {price(l.amount_toman)}
                            </td>
                            <td className="py-2.5 px-3">
                              {l.settlement_status === 'settled' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  تسویه‌شده
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                                  <Clock className="w-3 h-3" />
                                  معوقه
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-300">
                              <div>{l.description}</div>
                              {l.settlement_batch_id && (
                                <div className="text-[10px] text-emerald-400 font-mono mt-0.5" dir="ltr">
                                  Batch: {l.settlement_batch_id}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              یک سفارش را برای مشاهده کالبدشکافی پورسانت انتخاب کنید.
            </div>
          )}
      </div>
    </div>
  );
}
