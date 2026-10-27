'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Users,
  DollarSign,
  CreditCard,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  TrendingUp,
  Loader2,
  AlertCircle,
  Vault,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';

interface AdminReferralUser {
  id: number;
  fullName: string;
  username: string;
  phone: string;
  referralCode: string;
  layer1Count: number;
  layer2Count: number;
  layer3Count: number;
  totalNetworkCount: number;
  totalEarnedToman: number;
  balanceToman: number;
  isHidden: boolean;
  status: 'active' | 'suspended';
}

interface ReferralOverviewStats {
  total_network_users: number;
  total_commissions_earned: number;
  total_pending_settlements: number;
  active_referrers_count: number;
  treasury_balance: number;
  treasury_collected: number;
  treasury_distributed: number;
}

export default function AdminReferralsPage() {
  const [users, setUsers] = useState<AdminReferralUser[]>([]);
  const [stats, setStats] = useState<ReferralOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const toFarsi = (num: number) => (num || 0).toLocaleString('fa-IR');

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<{
        users: AdminReferralUser[];
        stats: ReferralOverviewStats;
      }>('/admin/referrals');
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error('Failed to load referral overview:', err);
      setError('خطا در دریافت اطلاعات مانیتورینگ رفرال از سرور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleToggleHide = async (userId: number, currentHidden: boolean, userName: string) => {
    try {
      await apiRequest(`/admin/referral/users/${userId}/toggle-hide`, {
        method: 'POST',
      });
      const nextState = !currentHidden;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isHidden: nextState } : u))
      );
      setFeedback(
        nextState
          ? `کاربر «${userName}» بدون حذف ارتباطات شبکه مخفی شد.`
          : `کاربر «${userName}» از حالت مخفی خارج شد.`
      );
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت مخفی‌سازی کاربر.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.referralCode || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term);

    if (filterVisibility === 'visible') return matchesSearch && !u.isHidden;
    if (filterVisibility === 'hidden') return matchesSearch && u.isHidden;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 font-vazir text-right">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-emerald-400" />
            <span>مانیتورینگ جامع زنجیره رفرال و کمیسیون‌ها</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            پایش ۵ شاخص مالی و عملکردی شبکه بازاریابی، مدیریت معرف‌ها و کنترل سوییچ مخفی‌سازی (Hide/Unhide)
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 Financial & Network Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Indicator 1: Total Network Users */}
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل اعضای شبکه</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-roboto pt-1">
            {toFarsi(stats?.total_network_users || 0)}{' '}
            <span className="text-xs font-vazir text-slate-400">کاربر</span>
          </div>
          <span className="text-[10px] text-slate-500 block">در تمامی ۳ لایه</span>
        </div>

        {/* Indicator 2: Total Commissions Earned */}
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل پورسانت‌های کسب‌شده</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-roboto pt-1">
            {toFarsi(stats?.total_commissions_earned || 0)}{' '}
            <span className="text-xs font-vazir text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-slate-500 block">محاسبه‌شده در کل زنجیره</span>
        </div>

        {/* Indicator 3: Pending Settlements */}
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>در انتظار تسویه (موجودی)</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 font-roboto pt-1">
            {toFarsi(stats?.total_pending_settlements || 0)}{' '}
            <span className="text-xs font-vazir text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-slate-500 block">موجودی کیف پول فعال</span>
        </div>

        {/* Indicator 4: Active Direct Referrers */}
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>بازاریابان لایه ۱ فعال</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-roboto pt-1">
            {toFarsi(stats?.active_referrers_count || 0)}{' '}
            <span className="text-xs font-vazir text-slate-400">نفر</span>
          </div>
          <span className="text-[10px] text-slate-500 block">دارای حداقل یک زیرمجموعه</span>
        </div>

        {/* Indicator 5: Treasury Pool Balance */}
        <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>موجودی صندوق پلتفرم</span>
            <Vault className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 font-roboto pt-1">
            {toFarsi(stats?.treasury_balance || 0)}{' '}
            <span className="text-xs font-vazir text-slate-400">تومان</span>
          </div>
          <span className="text-[10px] text-slate-500 block">واریزی مازاد لایه‌های فاقد معرف</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام، تلفن یا کد معرف..."
            className="w-full bg-[#121721] border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <span className="text-xs text-slate-400">وضعیت نمایش:</span>
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value as any)}
            className="bg-[#121721] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">همه کاربران</option>
            <option value="visible">فقط نمایان (عادی)</option>
            <option value="hidden">فقط مخفی‌شده (Hidden)</option>
          </select>
        </div>
      </div>

      {/* Users & Referral Chain Table */}
      <div className="rounded-2xl bg-[#0c1017] border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت داده‌های شبکه رفرال...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#090d13] border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">کاربر معرف</th>
                  <th className="py-3.5 px-4 font-bold">کد معرف</th>
                  <th className="py-3.5 px-4 font-bold text-center">لایه ۱</th>
                  <th className="py-3.5 px-4 font-bold text-center">لایه ۲</th>
                  <th className="py-3.5 px-4 font-bold text-center">لایه ۳</th>
                  <th className="py-3.5 px-4 font-bold text-center">کل شبکه</th>
                  <th className="py-3.5 px-4 font-bold">کل درآمد (تومان)</th>
                  <th className="py-3.5 px-4 font-bold">موجودی کیف پول</th>
                  <th className="py-3.5 px-4 font-bold text-center">وضعیت رفرال</th>
                  <th className="py-3.5 px-4 font-bold text-center">عملیات هاید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      کاربری در شبکه یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        user.isHidden ? 'opacity-60 bg-slate-900/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{user.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                          @{user.username} {user.phone ? `• ${user.phone}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[11px]">
                          {user.referralCode || 'ندارد'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-roboto font-bold text-slate-200">
                        {user.layer1Count}
                      </td>

                      <td className="py-3.5 px-4 text-center font-roboto text-slate-300">
                        {user.layer2Count}
                      </td>

                      <td className="py-3.5 px-4 text-center font-roboto text-slate-400">
                        {user.layer3Count}
                      </td>

                      <td className="py-3.5 px-4 text-center font-roboto font-black text-cyan-400">
                        {user.totalNetworkCount}
                      </td>

                      <td className="py-3.5 px-4 font-roboto font-bold text-emerald-400">
                        {toFarsi(user.totalEarnedToman)}
                      </td>

                      <td className="py-3.5 px-4 font-roboto font-bold text-amber-400">
                        {toFarsi(user.balanceToman)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {user.isHidden ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            مخفی در رنکینگ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            فعال در لیدربرد
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleHide(user.id, user.isHidden, user.fullName)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 mx-auto transition-all ${
                            user.isHidden
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                          title={
                            user.isHidden
                              ? 'نمایش مجدد کاربر در آمارهای عمومی'
                              : 'مخفی‌سازی کاربر بدون آسیب به روابط و درآمدهای زنجیره'
                          }
                        >
                          {user.isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>نمایش</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>هاید (Hide)</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
