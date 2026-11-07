'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';
import {
  GitFork,
  Search,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Coins,
  Wallet,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function AdminReferralTreePage() {
  const { t, n, price, d } = useTranslation();
  const [userIdInput, setUserIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTree = async (uid: string) => {
    if (!uid.trim()) return;
    setLoading(true);
    setAlertMsg(null);
    try {
      const data = await apiRequest<any>(`/admin-referral/tree/${uid.trim()}`);
      setTreeData(data);
    } catch (err: any) {
      setTreeData(null);
      setAlertMsg({ type: 'error', text: err.message || 'کاربر یافت نشد.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTree(userIdInput);
  };

  const handleToggleHidden = async () => {
    if (!treeData) return;
    const newStatus = !treeData.user.is_referral_hidden;
    setToggleLoading(true);
    try {
      await apiRequest(`/admin-referral/users/${treeData.user.id}/hidden-status`, {
        method: 'PUT',
        body: JSON.stringify({ is_referral_hidden: newStatus }),
      });
      setTreeData((prev: any) => ({
        ...prev,
        user: { ...prev.user, is_referral_hidden: newStatus },
      }));
      setAlertMsg({
        type: 'success',
        text: `وضعیت پنهان‌سازی کاربر با موفقیت به «${newStatus ? 'پنهان و دورزدن' : 'فعال و مرئی'}» تغییر یافت.`,
      });
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'خطا در تغییر وضعیت پنهان‌سازی' });
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-vazir text-start">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <GitFork className="w-6 h-6 text-rose-400" />
          <span>کاوشگر شجره‌نامه و ساختار شبکه رفرال (Tree Explorer)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          رهگیری مسیر معرف‌های بالادستی (Uplines)، بررسی ریزش شبکه و تغییر وضعیت کاربر مخفی (Pass-Through)
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <input
            type="number"
            placeholder="شناسه کاربری (User ID) را وارد کنید..."
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[#0c1017] border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !userIdInput}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>{loading ? 'در حال جستجو...' : 'کاوش کاربر'}</span>
        </button>
      </form>

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

      {treeData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Target User Center Card */}
          <div className="p-6 rounded-3xl bg-[#0c1017] border border-rose-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg">
                  {treeData.user.id}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{treeData.user.username}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                      {treeData.user.referral_code}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {treeData.user.full_name} | {treeData.user.phone || 'بدون شماره'}
                  </div>
                </div>
              </div>

              {/* Toggle Hidden Status Button */}
              <div className="flex items-center gap-3">
                <div className="text-xs text-end">
                  <span className="text-slate-400 block text-[11px]">وضعیت پنهان‌سازی معرف:</span>
                  <span
                    className={`font-bold ${
                      treeData.user.is_referral_hidden ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {treeData.user.is_referral_hidden ? 'پنهان (Pass-Through دور زده می‌شود)' : 'مرئی (دریافت سهم عادی)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleHidden}
                  disabled={toggleLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    treeData.user.is_referral_hidden
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {treeData.user.is_referral_hidden ? (
                    <EyeOff className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{treeData.user.is_referral_hidden ? 'آشکارسازی کاربر' : 'پنهان‌سازی از شبکه'}</span>
                </button>
              </div>
            </div>

            {/* Wallet Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">موجودی قابل برداشت:</span>
                <span className="text-base font-black text-emerald-400 font-mono" dir="ltr">
                  {price(treeData.wallet.withdrawable_balance_toman)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">پورسانت معلق این هفته:</span>
                <span className="text-base font-black text-amber-300 font-mono" dir="ltr">
                  {price(treeData.wallet.pending_balance_toman)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">مجموع سود ادوار:</span>
                <span className="text-base font-black text-white font-mono" dir="ltr">
                  {price(treeData.wallet.total_earned_toman)}
                </span>
              </div>
            </div>
          </div>

          {/* Uplines Section */}
          <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-cyan-400" />
              <span>زنجیره بالادستی‌ها (Uplines Chain - معرف‌های بالادست)</span>
              <span className="text-xs text-slate-500 font-normal">
                ({n(treeData.uplines.length)} سطح بالادست ثبت‌شده)
              </span>
            </h3>

            {treeData.uplines.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                این کاربر بدون کد معرف ثبت نام کرده است (Root User).
              </div>
            ) : (
              <div className="space-y-2">
                {treeData.uplines.map((up: any) => (
                  <div
                    key={up.user_id}
                    className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                      up.is_referral_hidden
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-[11px]">
                        لایه {n(up.level)}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-white text-xs">{up.username}</span>
                        <span className="text-slate-400 text-[11px] mr-2">({up.full_name || '—'})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {up.is_referral_hidden && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                          پنهان (دور زده شده)
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setUserIdInput(String(up.user_id));
                          fetchTree(String(up.user_id));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                      >
                        مشاهده این کاربر
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Downlines Section */}
          <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-emerald-400" />
              <span>زیرمجموعه‌های مستقیم لایه ۱ (Direct Downlines)</span>
              <span className="text-xs text-slate-500 font-normal">
                ({n(treeData.direct_downlines.length)} نفر ثبت‌شده)
              </span>
            </h3>

            {treeData.direct_downlines.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                این کاربر هنوز هیچ زیرمجموعه مستقیمی ندارد.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {treeData.direct_downlines.map((dn: any) => (
                  <div
                    key={dn.user_id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-white">{dn.username}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{dn.full_name || '—'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserIdInput(String(dn.user_id));
                        fetchTree(String(dn.user_id));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                    >
                      کاوش
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
