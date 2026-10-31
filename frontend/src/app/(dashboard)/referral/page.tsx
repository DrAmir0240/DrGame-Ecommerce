'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import {
  ReferralStats,
  CommissionTransaction,
  CommissionTransactionListResponse,
  SettlementAccount,
} from '@/types/referral';
import { useAuthStore } from '@/stores/useAuthStore';
import ReferralStatsCards from '@/components/referral/ReferralStatsCards';
import SettlementAccountsModal from '@/components/referral/SettlementAccountsModal';
import WithdrawalModal from '@/components/referral/WithdrawalModal';
import TransactionsTable from '@/components/referral/TransactionsTable';
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

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalTx, setTotalTx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<'1' | '2' | '3' | 'all'>('1');

  // Modals state
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const loadAllData = async () => {
    try {
      const layerParam = selectedLayer !== 'all' ? `&layer=${selectedLayer}` : '';
      const [statsData, accountsData, txData, withdrawalsData] = await Promise.all([
        apiRequest<ReferralStats>('/referral/stats'),
        apiRequest<SettlementAccount[]>('/referral/settlement-accounts'),
        apiRequest<CommissionTransactionListResponse>(`/referral/transactions?page=${page}&page_size=15${layerParam}`),
        apiRequest<WithdrawalHistoryItem[]>('/referral/withdrawals').catch(() => []),
      ]);
      setStats(statsData);
      setAccounts(accountsData || []);
      setTransactions(txData.items || []);
      setTotalTx(txData.total || 0);
      setWithdrawals(withdrawalsData || []);
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, selectedLayer]);

  // Clean empty state instead of fake demo data
  const emptyStats: ReferralStats = {
    referral_code: '...',
    withdrawable_balance_toman: 0,
    total_earned_toman: 0,
    total_withdrawn_toman: 0,
    direct_referrals_count: 0,
    active_subscriptions_count: 0,
  };

  const activeStats = stats || emptyStats;

  return (
    <div className="max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-10 space-y-10">
      {!isAuthenticated && (
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
              {t('referral.settlementBadge')}
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {t('referral.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Layer Filter Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d121f] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">{t('referral.layerFilterLabel')}</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value as any)}
            className="px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="1">{t('referral.layers.one')}</option>
            <option value="2">{t('referral.layers.two')}</option>
            <option value="3">{t('referral.layers.three')}</option>
            <option value="all">{t('referral.layers.all')}</option>
          </select>
        </div>
      </div>

      {/* Stats Cards & Referral Link */}
      <ReferralStatsCards
        stats={activeStats}
        onOpenWithdrawModal={() => setIsWithdrawModalOpen(true)}
      />

      {/* Halving Model Explanation & Legal Disclaimer Box */}
      <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>{t('referral.formula.title')}</span>
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">
            {t('referral.formula.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#141b2d] border border-emerald-500/20 space-y-1">
            <span className="text-text-muted block text-[11px]">{t('referral.formula.layer1Label')}</span>
            <span className="text-lg font-black text-emerald-400">{t('referral.formula.layer1Value')}</span>
            <span className="text-[10px] text-text-muted block">{t('referral.formula.layer1Note')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141b2d] border border-cyan-500/20 space-y-1">
            <span className="text-text-muted block text-[11px]">{t('referral.formula.layer2Label')}</span>
            <span className="text-lg font-black text-cyan-400">{t('referral.formula.layer2Value')}</span>
            <span className="text-[10px] text-text-muted block">{t('referral.formula.layer2Note')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141b2d] border border-amber-500/20 space-y-1">
            <span className="text-text-muted block text-[11px]">{t('referral.formula.layer3Label')}</span>
            <span className="text-lg font-black text-amber-400">{t('referral.formula.layer3Value')}</span>
            <span className="text-[10px] text-text-muted block">{t('referral.formula.layer3Note')}</span>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>{t('referral.terms.title')}</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {t('referral.terms.item1')}
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {t('referral.terms.item2')}
          </p>
        </div>
      </div>

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
                      {w.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>واریز شد</span>
                        </span>
                      ) : w.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3" />
                          <span>رد شد</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          <span>در حال بررسی</span>
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
        </div>
      )}

      {/* Transactions Table */}
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
    </div>
  );
}
