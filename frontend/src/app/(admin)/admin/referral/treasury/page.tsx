'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Coins,
  Award,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
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
import ReferralUserSearchInput from '@/components/admin/referral/ReferralUserSearchInput';
import { ReferralUserSearchItem } from '@/types/referral';

interface TreasuryLogItem {
  id: number;
  amount_toman: number;
  currency: string;
  action_type: string;
  order_id?: number | null;
  description: string;
  created_at: string;
}

interface TreasuryResponse {
  pool: {
    id: number;
    currency: string;
    balance_toman: number;
    total_collected_toman: number;
    total_distributed_toman: number;
    updated_at: string;
  };
  recent_logs: TreasuryLogItem[];
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  deposit_leftover: 'واریز مانده آبشار',
  ghosted_referral_divert: 'انحراف سهم عضو روح‌شده',
  admin_reward: 'پاداش ادمینی',
  admin_reset: 'ریست خزانه',
};

export default function AdminReferralTreasuryPage() {
  const { price, n, locale } = useTranslation();
  const { isReadOnly } = useDepartmentProfile();
  const { showToast } = useAdminToast();

  const [data, setData] = useState<TreasuryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');

  const [selectedUser, setSelectedUser] = useState<ReferralUserSearchItem | null>(null);
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTreasury = useCallback(async () => {
    setLoading(true);
    try {
      const qs =
        actionFilter !== 'all'
          ? `?action_type=${encodeURIComponent(actionFilter)}`
          : '';
      const res = await apiRequest<TreasuryResponse>(`/admin-referral/treasury${qs}`);
      setData(res);
    } catch (err: any) {
      showToast('خطا در بارگذاری وضعیت خزانه کل', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, showToast]);

  useEffect(() => {
    loadTreasury();
  }, [loadTreasury]);

  const numericAmount = parseInt(rawAmount.replace(/[^\d]/g, ''), 10) || 0;
  const currentBalance = data?.pool?.balance_toman || 0;
  const remainingAfterGrant = currentBalance - numericAmount;

  const handleAmountChange = (val: string) => {
    const digitsOnly = val.replace(/[^\d]/g, '');
    setRawAmount(digitsOnly);
  };

  const formattedInputAmount = numericAmount > 0 ? numericAmount.toLocaleString('en-US') : '';

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      showToast('ابتدا کاربر دریافت‌کننده پاداش را انتخاب کنید', 'warning');
      return;
    }
    if (numericAmount <= 0) {
      showToast('مبلغ پاداش باید بزرگ‌تر از صفر باشد', 'warning');
      return;
    }
    if (numericAmount > currentBalance) {
      showToast('مبلغ پاداش از موجودی فعلی صندوق خزانه‌داری بیشتر است', 'error');
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmGrant = async () => {
    if (!selectedUser || numericAmount <= 0) return;
    setSubmitting(true);
    try {
      await apiRequest('/admin-referral/treasury/grant-reward', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount_toman: numericAmount,
          description: description.trim() || 'پاداش مدیریتی از صندوق خزانه',
        }),
      });
      showToast(
        'پاداش با موفقیت از صندوق خزانه اعطا شد',
        'success',
        `${price(numericAmount)} به کیف پول @${selectedUser.username} واریز گردید`
      );
      setConfirmOpen(false);
      setSelectedUser(null);
      setRawAmount('');
      setDescription('');
      await loadTreasury();
    } catch (err: any) {
      showToast('خطا در اعطای پاداش خزانه', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <ReadOnlyGuardBanner visible={isReadOnly} />

      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-5">
        <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-rose-400" />
          مدیریت صندوق کل خزانه‌داری و اعطای پاداش ویژه
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          پایش مانده بودجه‌های جمع‌آوری‌شده از انتهای زنجیره‌ها و سهام اعضای روح‌شده و اعطای جایزه مستقیم به کاربران فعال
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-emerald-500/30">
          <div className="text-xs text-slate-400">موجودی قابل توزیع صندوق</div>
          <div className="text-2xl font-black text-emerald-400 tabular-nums mt-1">
            {price(currentBalance)}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800">
          <div className="text-xs text-slate-400">مجموع کل ورودی انباشته</div>
          <div className="text-2xl font-black text-white tabular-nums mt-1">
            {price(data?.pool?.total_collected_toman || 0)}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800">
          <div className="text-xs text-slate-400">مجموع کل پاداش‌های پرداخت‌شده</div>
          <div className="text-2xl font-black text-rose-400 tabular-nums mt-1">
            {price(data?.pool?.total_distributed_toman || 0)}
          </div>
        </div>
      </div>

      {/* Grant Form + Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grant Reward Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0c1017] p-5 space-y-4 h-fit">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            اعطای پاداش مستقیم به کاربر
          </h2>

          <form onSubmit={handlePreSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                انتخاب کاربر دریافت‌کننده
              </label>
              <ReferralUserSearchInput
                selectedUser={selectedUser}
                onSelect={(u) => setSelectedUser(u)}
                onClear={() => setSelectedUser(null)}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                مبلغ پاداش (تومان)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formattedInputAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="مثال: 500,000"
                dir="ltr"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              {numericAmount > 0 && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">مبلغ به حروف عددی:</span>
                  <strong className="text-emerald-300 tabular-nums">{price(numericAmount)}</strong>
                </div>
              )}
              {numericAmount > 0 && (
                <div className="mt-1.5 text-[11px] flex items-center justify-between px-1">
                  <span className="text-slate-500">مانده خزانه پس از اعطا:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      remainingAfterGrant < 0 ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {price(remainingAfterGrant)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                بابت / شرح تراکنش (ثبت در کیف پول کاربر و لاگ خزانه)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: پاداش عملکرد برتر بازاریابی ماه..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isReadOnly || !selectedUser || numericAmount <= 0 || remainingAfterGrant < 0}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Award className="w-4 h-4" />
              بررسی و اعطای پاداش
            </button>
          </form>
        </div>

        {/* Treasury Logs Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 bg-[#0f1520]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">
              دفتر کل گردش مالی صندوق خزانه ({n(data?.recent_logs?.length || 0)} رویداد اخیر)
            </h2>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="all">همه رویدادها</option>
              <option value="deposit_leftover">واریز مانده آبشار</option>
              <option value="ghosted_referral_divert">انحراف عضو روح‌شده</option>
              <option value="admin_reward">پاداش ادمینی</option>
              <option value="admin_reset">ریست خزانه</option>
            </select>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[540px] overflow-y-auto">
            {loading && !data ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin inline-block ml-2 text-rose-400" />
                در حال بارگذاری گردش خزانه...
              </div>
            ) : !data?.recent_logs?.length ? (
              <div className="py-12 text-center text-xs text-slate-500">
                رویدادی در این فیلتر ثبت نشده است.
              </div>
            ) : (
              data.recent_logs.map((log) => {
                const isCredit = log.amount_toman >= 0;
                return (
                  <div
                    key={log.id}
                    className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCredit
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {log.description}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                            {ACTION_TYPE_LABELS[log.action_type] || log.action_type}
                          </span>
                          {log.order_id && (
                            <span className="font-mono text-sky-300" dir="ltr">
                              Order #{log.order_id}
                            </span>
                          )}
                          <span>{formatDateTime(log.created_at, locale)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`font-black tabular-nums shrink-0 ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCredit ? '+' : ''}
                      {price(log.amount_toman)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirm Grant Modal */}
      {confirmOpen && selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-emerald-500/35 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Award className="w-5 h-5" />
                تایید اعطای پاداش از خزانه
              </h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">دریافت‌کننده:</span>
                <strong className="text-white">
                  {selectedUser.full_name} (@{selectedUser.username})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مبلغ پاداش:</span>
                <strong className="text-emerald-300 tabular-nums">{price(numericAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مانده خزانه پس از کسر:</span>
                <strong className="text-slate-200 tabular-nums">{price(remainingAfterGrant)}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmGrant}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                تایید و واریز پاداش
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
