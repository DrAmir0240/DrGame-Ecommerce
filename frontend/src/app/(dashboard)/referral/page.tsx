'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import {
  ReferralStats,
  CommissionTransaction,
  CommissionTransactionListResponse,
  SettlementAccount,
  NetworkTreeResponse,
} from '@/types/referral';
import { useAuthStore } from '@/stores/useAuthStore';
import ReferralStatsCards from '@/components/referral/ReferralStatsCards';
import SettlementAccountsModal from '@/components/referral/SettlementAccountsModal';
import WithdrawalModal from '@/components/referral/WithdrawalModal';
import TransactionsTable from '@/components/referral/TransactionsTable';
import ReferralCalculatorModal from '@/components/referral/ReferralCalculatorModal';
import ReferralNetworkTable from '@/components/referral/ReferralNetworkTable';
import {
  Building2,
  Coins,
  CreditCard,
  Plus,
  HelpCircle,
  Share2,
  CheckCircle2,
  Layers,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  ArrowDownLeft,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';

interface WithdrawalHistoryItem {
  id: number;
  settlement_account_id: number;
  amount_toman: number;
  status: 'pending' | 'approved' | 'rejected' | string;
  tx_hash?: string | null;
  admin_note?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export default function ReferralDashboardPage() {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { t, n, price, d } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [networkTree, setNetworkTree] = useState<NetworkTreeResponse | null>(null);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistoryItem[]>([]);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalTx, setTotalTx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<'1' | '2' | '3' | 'all'>('all');
  const [selectedTreeLevel, setSelectedTreeLevel] = useState<number | 'all'>('all');

  // Modals state
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const loadAllData = async () => {
    try {
      const layerParam = selectedLayer !== 'all' ? `&layer=${selectedLayer}` : '';
      const [statsData, treeData, accountsData, txData, withdrawalsData] = await Promise.all([
        apiRequest<ReferralStats>('/referral/stats'),
        apiRequest<NetworkTreeResponse>('/referral/network-tree').catch(() => null),
        apiRequest<SettlementAccount[]>('/referral/settlement-accounts'),
        apiRequest<CommissionTransactionListResponse>(
          `/referral/transactions?page=${page}&page_size=15${layerParam}`
        ),
        apiRequest<{ items: WithdrawalHistoryItem[]; total: number; page: number; page_size: number }>(
          `/referral/withdrawals?page=${withdrawalsPage}&page_size=10`
        ).catch(() => ({ items: [], total: 0, page: 1, page_size: 10 })),
      ]);
      setStats(statsData);
      setNetworkTree(treeData);
      setAccounts(accountsData || []);
      setTransactions(txData.items || []);
      setTotalTx(txData.total || 0);
      setWithdrawals(withdrawalsData.items || []);
      setWithdrawalsTotal(withdrawalsData.total || 0);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, selectedLayer, withdrawalsPage]);

  const emptyStats: ReferralStats = {
    referral_code: '...',
    withdrawable_balance_toman: 0,
    pending_balance_toman: 0,
    next_settlement_date: null,
    total_earned_toman: 0,
    total_withdrawn_toman: 0,
    direct_referrals_count: 0,
    active_subscriptions_count: 0,
  };

  const activeStats = stats || emptyStats;

  return (
    <div className="max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-10 space-y-10 font-vazir text-start">
      {mounted && !isAuthenticated && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{t('referral.loginPrompt')}</span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true, 'otp')}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shrink-0 cursor-pointer"
          >
            {t('referral.loginButton')}
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>{t('referral.title')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              تسویه هفتگی جمعه‌ها
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            سیستم پورسانت چندلایه‌ای نامحدود با مدل تقسیم نصف‌شونده و تسویه منظم هفتگی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a2133] hover:bg-[#222b42] border border-purple-500/30 text-purple-300 text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-purple-400" />
            <span>شبیه‌ساز درآمد من</span>
          </button>

          <button
            onClick={() => setIsAccountsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card border border-white/10 hover:border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-cosmic-purple" />
            <span>{t('referral.accountsButton', { count: n(accounts.length) })}</span>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={!stats || stats.withdrawable_balance_toman < 50000}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all shadow-neon-purple disabled:opacity-40 cursor-pointer"
          >
            <span>{t('referral.withdraw')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards & Marketing Toolkit */}
      <ReferralStatsCards
        stats={activeStats}
        onOpenWithdrawModal={() => setIsWithdrawModalOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      {/* Dynamic Multi-Tier Waterfall Network Visualizer */}
      {(() => {
        const activeLevels = networkTree?.levels || [];
        return (
          <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>پوشش سطوح شبکه و توزیع آبشاری سود (Infinite Waterfall)</span>
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mt-1">
                  کل بودجه بازاریابی پلتفرم ۲۱٪ از هر خرید اشتراک است که به صورت نصف‌شونده (Halving) تا عمق شبکه بین معرف‌ها توزیع می‌شود.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {activeLevels.length === 0 ? (
                  <span className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-800/80 text-slate-400 font-bold border border-slate-700/50 inline-flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    بدون لایه فعال
                  </span>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedTreeLevel}
                      onChange={(e) => setSelectedTreeLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="appearance-none bg-[#141b2d] border border-cyan-500/40 hover:border-cyan-400 text-white text-xs font-bold rounded-xl px-4 py-2 pe-8 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-sm"
                    >
                      <option value="all">همه لایه‌های فعال ({n(activeLevels.length)} لایه)</option>
                      {activeLevels.map((lvl) => (
                        <option key={lvl.level} value={lvl.level}>
                          لایه {n(lvl.level)} ({lvl.percentage}٪ سود - {n(lvl.members_count)} عضو)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
                <div className="text-xs text-slate-400 hidden sm:block">
                  کل اعضای شبکه: <span className="font-bold text-white">{n(networkTree?.total_members || 0)}</span> نفر
                </div>
              </div>
            </div>

            {/* Dynamic Content: Empty State vs All Levels Grid vs Single Level Detail */}
            {activeLevels.length === 0 ? (
              <div className="py-10 px-6 rounded-2xl bg-[#141a29]/40 border border-dashed border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">بدون لایه فعال</h4>
                  <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                    در حال حاضر هیچ لایه‌ای در شبکه شما فعال نیست. با ارسال لینک یا کد معرف خود به اولین دوست، لایه ۱ شما (با سهم ۱۰.۵٪ سود مستقیم از هر خرید) به طور خودکار فعال خواهد شد.
                  </p>
                </div>
              </div>
            ) : selectedTreeLevel === 'all' ? (
              <div
                className={`grid gap-4 text-xs ${
                  activeLevels.length === 1
                    ? 'grid-cols-1'
                    : activeLevels.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : activeLevels.length === 3
                    ? 'grid-cols-1 sm:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {activeLevels.map((lvl) => (
                  <div
                    key={lvl.level}
                    onClick={() => setSelectedTreeLevel(lvl.level)}
                    className={`p-4 rounded-2xl border transition-all space-y-2 cursor-pointer hover:scale-[1.02] ${
                      lvl.level === 1
                        ? 'bg-[#141f2d] border-cyan-500/30 hover:border-cyan-500/60'
                        : lvl.level === 2
                        ? 'bg-[#19152b] border-purple-500/30 hover:border-purple-500/60'
                        : lvl.level === 3
                        ? 'bg-[#221c17] border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-[#141b2d] border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">لایه {n(lvl.level)}</span>
                      <span className="font-mono font-black text-xs text-emerald-400">{lvl.percentage}٪</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>تعداد اعضا:</span>
                      <span className="font-bold text-white">{n(lvl.members_count)} نفر</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>مشترکین فعال:</span>
                      <span className="font-bold text-cyan-400">{n(lvl.active_subscribers_count)} نفر</span>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">سود تجمیعی:</span>
                      <span className="font-mono font-bold text-emerald-300 text-xs" dir="ltr">
                        {price(lvl.total_earned_toman)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const lvl = activeLevels.find((l) => l.level === selectedTreeLevel);
                if (!lvl) return null;
                const conversionRate =
                  lvl.members_count > 0
                    ? Math.round((lvl.active_subscribers_count / lvl.members_count) * 100)
                    : 0;
                return (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#141f2d] to-[#0c1420] border border-cyan-500/40 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                          L{lvl.level}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">جزئیات درآمد لایه {n(lvl.level)}</h4>
                          <p className="text-[11px] text-text-secondary">
                            {lvl.level === 1
                              ? 'زیرمجموعه‌های مستقیم شما'
                              : `زیرمجموعه‌های معرفی‌شده توسط لایه ${n(lvl.level - 1)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">سهم پورسانت از هر خرید:</span>
                          <span className="font-mono font-black text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                            {lvl.percentage}٪
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedTreeLevel('all')}
                          className="text-xs text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer"
                        >
                          نمایش همه لایه‌ها
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-[#0e1320] border border-white/5 space-y-1">
                        <span className="text-[11px] text-slate-400">تعداد کل اعضا</span>
                        <div className="text-lg font-black text-white">{n(lvl.members_count)} نفر</div>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0e1320] border border-white/5 space-y-1">
                        <span className="text-[11px] text-slate-400">مشترکین فعال (درآمدزا)</span>
                        <div className="text-lg font-black text-cyan-400">{n(lvl.active_subscribers_count)} نفر</div>
                        <div className="text-[10px] text-slate-500 font-bold">نرخ اشتراک: {n(conversionRate)}٪</div>
                      </div>
                      <div className="p-4 rounded-xl bg-[#0e1320] border border-white/5 space-y-1">
                        <span className="text-[11px] text-slate-400">سود تجمیعی کسب‌شده</span>
                        <div className="text-lg font-mono font-black text-emerald-300" dir="ltr">
                          {price(lvl.total_earned_toman)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Legal Disclaimer Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>نکات و ضوابط تسویه هفتگی و صندوق پلتفرم</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                ۱. پورسانت‌های هر سفارش تا پایان هفته در وضعیت «معلق» قرار داشته و در پایان هر هفته (جمعه ساعت ۲۳:۵۹) به صورت خودکار به موجودی قابل برداشت واریز می‌شوند.
              </p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                ۲. سهم پورسانت اعضایی که در لحظه خرید اشتراک فعال ندارند به صندوق پلتفرم منظور می‌شود و کاربران پنهان‌شده در زنجیره دور زده می‌شوند (Pass-Through).
              </p>
            </div>
          </div>
        );
      })()}

      {/* Downlines Roster Table with Privacy Masking */}
      <ReferralNetworkTable
        currentLevelFilter={selectedTreeLevel === 'all' ? null : selectedTreeLevel}
        availableLevels={networkTree?.levels?.map((l) => l.level) || []}
        onSelectLevelFilter={(lvl) => setSelectedTreeLevel(lvl === null ? 'all' : lvl)}
      />

      {/* Withdrawals Request History Table */}
      {withdrawals.length > 0 && (
        <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              <span>تاریخچه درخواست‌های تسویه و برداشت</span>
            </h3>
            <span className="text-xs text-slate-400">{n(withdrawals.length)} درخواست ثبت‌شده</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-[11px]">
                  <th className="py-3 px-4 text-start font-bold">شناسه</th>
                  <th className="py-3 px-4 text-start font-bold">مبلغ تسویه</th>
                  <th className="py-3 px-4 text-start font-bold">وضعیت</th>
                  <th className="py-3 px-4 text-start font-bold">تاریخ ثبت</th>
                  <th className="py-3 px-4 text-start font-bold">رسید / توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">#{w.id}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 font-roboto">{price(w.amount_toman)}</td>
                    <td className="py-3.5 px-4">
                      {w.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>واریز شد</span>
                        </span>
                      ) : w.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>تایید شده (در نوبت حواله)</span>
                        </span>
                      ) : w.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          <span>رد شد</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          <span>در انتظار بررسی</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-roboto dir-ltr text-start">
                      {d(w.created_at, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {w.tx_hash ? (
                        <span className="font-mono text-[11px] text-cyan-400">{w.tx_hash}</span>
                      ) : (
                        w.admin_note || '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {withdrawalsTotal > 10 && (
            <div className="flex items-center justify-center gap-2 py-3 border-t border-white/5">
              <button
                onClick={() => setWithdrawalsPage((p) => Math.max(1, p - 1))}
                disabled={withdrawalsPage === 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-xs disabled:opacity-30 text-white"
              >
                قبلی
              </button>
              <span className="text-xs text-text-muted">
                صفحه {withdrawalsPage} از {Math.ceil(withdrawalsTotal / 10)}
              </span>
              <button
                onClick={() => setWithdrawalsPage((p) => p + 1)}
                disabled={withdrawalsPage >= Math.ceil(withdrawalsTotal / 10)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-xs disabled:opacity-30 text-white"
              >
                بعدی
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transactions Table with Settlement Status */}
      <TransactionsTable
        transactions={transactions}
        isLoading={isLoading}
        page={page}
        total={totalTx}
        pageSize={15}
        onPageChange={(p) => setPage(p)}
      />

      {/* Modals */}
      <SettlementAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accounts}
        onAccountAdded={loadAllData}
      />

      {stats && (
        <WithdrawalModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          withdrawableBalanceToman={stats.withdrawable_balance_toman}
          accounts={accounts}
          onWithdrawSuccess={loadAllData}
        />
      )}

      <ReferralCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        referralCode={activeStats.referral_code}
      />
    </div>
  );
}
