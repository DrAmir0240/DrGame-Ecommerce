'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';
import {
  Coins,
  Gift,
  History,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function AdminReferralTreasuryPage() {
  const { t, n, price, d } = useTranslation();
  const [treasury, setTreasury] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantForm, setGrantForm] = useState({
    user_id: '',
    amount_toman: 100000,
    description: 'پاداش مسابقه هفتگی رفرال',
  });
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any>('/admin-referral/treasury');
      setTreasury(data.pool);
      setLogs(data.recent_logs || []);
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'خطا در بارگذاری موجودی خزانه‌داری' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGrantReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.user_id) return;
    setGrantSubmitting(true);
    setAlertMsg(null);
    try {
      const res = await apiRequest<any>('/admin-referral/treasury/grant-reward', {
        method: 'POST',
        body: JSON.stringify({
          user_id: Number(grantForm.user_id),
          amount_toman: Number(grantForm.amount_toman),
          description: grantForm.description,
        }),
      });
      setAlertMsg({
        type: 'success',
        text: `پاداش به مبلغ ${price(res.granted_amount)} با موفقیت به کاربر ${res.user_id} اعطا شد.`,
      });
      setGrantForm({ user_id: '', amount_toman: 100000, description: 'پاداش مسابقه هفتگی رفرال' });
      await loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'خطا در اعطای پاداش از خزانه' });
    } finally {
      setGrantSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-vazir text-start">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Coins className="w-6 h-6 text-amber-400" />
          <span>استخر خزانه‌داری پلتفرم (Referral Treasury Pool)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          مدیریت ذخیره مانده‌های نامحدود تقسیم‌نشده رفرال و اعطای جوایز ویژه به برترین بازاریابان شبکه
        </p>
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

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-amber-500/30 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>موجودی فعلی خزانه</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Current Balance
            </span>
          </div>
          <div className="text-3xl font-black text-white font-mono" dir="ltr">
            {price(treasury?.balance_toman || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            موجود و آماده برای اعطای پاداش به کاربران
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1017] border border-emerald-500/30 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-300">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>کل ورودی انباشته به خزانه</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Total Inflow
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono" dir="ltr">
            {price(treasury?.total_collected_toman || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            حاصل از مانده‌های تقسیم‌نشده و کاربران غیرفعال
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c1017] border border-purple-500/30 space-y-2 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-purple-300">
              <TrendingDown className="w-4 h-4 text-purple-400" />
              <span>کل پاداش‌های اعطاشده</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Total Granted
            </span>
          </div>
          <div className="text-3xl font-black text-purple-300 font-mono" dir="ltr">
            {price(treasury?.total_distributed_toman || 0)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            واریز شده به کیف پول بازاریابان برتر
          </span>
        </div>
      </div>

      {/* Grant Reward Form */}
      <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Gift className="w-4 h-4 text-rose-400" />
          <span>اعطای پاداش تشویقی از محل صندوق پلتفرم</span>
        </h3>

        <form onSubmit={handleGrantReward} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">شناسه کاربر هدف (User ID):</label>
            <input
              type="number"
              required
              placeholder="مثال: 12"
              value={grantForm.user_id}
              onChange={(e) => setGrantForm({ ...grantForm, user_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">مبلغ پاداش (تومان):</label>
            <input
              type="number"
              required
              min="1000"
              step="1000"
              value={grantForm.amount_toman}
              onChange={(e) => setGrantForm({ ...grantForm, amount_toman: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-bold">شرح / دلیل پاداش:</label>
            <input
              type="text"
              required
              value={grantForm.description}
              onChange={(e) => setGrantForm({ ...grantForm, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={grantSubmitting || !grantForm.user_id}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-40 cursor-pointer"
            >
              {grantSubmitting ? 'در حال ثبت...' : 'اعطای فوری پاداش به کاربر'}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>لاگ‌های حسابرسی صندوق خزانه‌داری (Treasury Audit Logs)</span>
          </h2>
          <span className="text-xs text-slate-500">آخرین ۵۰ رویداد</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold">
                <th className="py-3 px-4 text-start">شناسه</th>
                <th className="py-3 px-4 text-start">نوع عملیات</th>
                <th className="py-3 px-4 text-start">مبلغ</th>
                <th className="py-3 px-4 text-start">شرح رویداد</th>
                <th className="py-3 px-4 text-start">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    در حال بارگذاری لاگ‌ها...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    هیچ رکوردی در لاگ خزانه‌داری یافت نشد.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{log.id}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.action_type === 'deposit_leftover'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : log.action_type === 'admin_reward'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {log.action_type === 'deposit_leftover'
                          ? 'واریز مانده رفرال'
                          : log.action_type === 'admin_reward'
                          ? 'پاداش ادمینی'
                          : 'ریست موجودی'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold" dir="ltr">
                      <span className={log.amount_toman >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {log.amount_toman >= 0 ? '+' : ''}
                        {price(log.amount_toman)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{log.description}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {d(log.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
