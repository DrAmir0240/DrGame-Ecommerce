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
} from 'lucide-react';
import Link from 'next/link';

export default function ReferralDashboardPage() {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
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
      const [statsData, accountsData, txData] = await Promise.all([
        apiRequest<ReferralStats>('/referral/stats'),
        apiRequest<SettlementAccount[]>('/referral/settlement-accounts'),
        apiRequest<CommissionTransactionListResponse>(`/referral/transactions?page=${page}&page_size=15${layerParam}`),
      ]);
      setStats(statsData);
      setAccounts(accountsData);
      setTransactions(txData.items);
      setTotalTx(txData.total);
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

  const SAMPLE_STATS: ReferralStats = {
    referral_code: 'DRGAME-VIP',
    withdrawable_balance_toman: 1850000,
    total_earned_toman: 4850000,
    total_withdrawn_toman: 3000000,
    direct_referrals_count: 14,
    active_subscriptions_count: 9,
  };

  const activeStats = stats || SAMPLE_STATS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>حالت نمایش نمونه میزکار بازاریابی. برای دسترسی به لینک اختصاصی خود و برداشت پورسانت، وارد شوید.</span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true, 'otp')}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shrink-0"
          >
            ورود به حساب
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>میزکار بازاریابی ارجاعی و کیف پول</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              تسویه مستقیم
            </span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            کسب درآمد پایدار از تمامی خریدهای اشتراک شبکه کاربران معرفی‌شده توسط شما تا ۱۰ سطح
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAccountsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card border border-white/10 hover:border-white/20 text-white text-xs font-bold transition-all"
          >
            <CreditCard className="w-4 h-4 text-cosmic-purple" />
            <span>حساب‌های تسویه ({accounts.length})</span>
          </button>

          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={!stats || stats.withdrawable_balance_toman < 50000}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all shadow-neon-purple disabled:opacity-40"
          >
            <span>برداشت وجه</span>
          </button>
        </div>
      </div>

      {/* Layer Filter Dropdown Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d121f] border border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">فیلتر لایه شبکه زیرمجموعه‌ها:</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value as any)}
            className="px-4 py-2 rounded-xl bg-[#141b2d] border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="1">لایه ۱ (مستقیم - ۱۰٪ پورسانت) - پیش‌فرض</option>
            <option value="2">لایه ۲ (غیرمستقیم - ۵٪ پورسانت)</option>
            <option value="3">لایه ۳ (غیرمستقیم - ۲.۵٪ پورسانت)</option>
            <option value="all">همه لایه‌های شبکه</option>
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
            <span>فرمول محاسبه پورسانت نصف‌شونده پلکانی (Halving Commission Formula)</span>
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">
            در مدل درآمدزایی دکتر گیم، درصد پورسانت پایه اولیه توسط سیستم تعیین شده و در هر لایه صعودی به سمت بالا نصف می‌گردد:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#141b2d] border border-emerald-500/20 space-y-1">
            <span className="text-text-muted block text-[11px]">لایه ۱ (معرف مستقیم)</span>
            <span className="text-lg font-black text-emerald-400">۱۰٪ از مبلغ خرید</span>
            <span className="text-[10px] text-text-muted block">نصف کل پورسانت پایه ۲۰ درصدی</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141b2d] border border-cyan-500/20 space-y-1">
            <span className="text-text-muted block text-[11px]">لایه ۲ (معرف بالادستی ۲)</span>
            <span className="text-lg font-black text-cyan-400">۵٪ از مبلغ خرید</span>
            <span className="text-[10px] text-text-muted block">نصف پورسانت لایه اول</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#141b2d] border border-amber-500/20 space-y-1">
            <span className="text-text-muted block text-[11px]">لایه ۳ (معرف بالادستی ۳)</span>
            <span className="text-lg font-black text-amber-400">۲.۵٪ از مبلغ خرید</span>
            <span className="text-[10px] text-text-muted block">نصف پورسانت لایه دوم (ادامه تا بی‌نهایت)</span>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>قوانین، شرایط پرداخت و سلب مسئولیت حقوقی:</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            ۱. پورسانت بازاریابی صرفاً پس از پرداخت موفق و فعال‌سازی اشتراک توسط کاربر دعوت‌شده محاسبه و به موجودی قابل تسویه افزوده خواهد شد.
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            ۲. پلتفرم دکتر گیم حق نظارت مستمر بر سلامت تراکنش‌ها، رفتارهای مشکوک یا ایجاد زنجیره‌های خودارجاعی (Self-referral) را برای خود محفوظ دانسته و در صورت کشف تقلب، حساب کاربری و موجودی مسدود خواهد گردید.
          </p>
        </div>
      </div>

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
