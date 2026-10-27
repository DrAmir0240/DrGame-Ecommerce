'use client';

import React, { useState } from 'react';
import { SettlementAccount } from '@/types/referral';
import { apiRequest } from '@/lib/apiClient';
import { X, Wallet, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawableBalanceToman: number;
  accounts: SettlementAccount[];
  onWithdrawSuccess: () => void;
}

export default function WithdrawalModal({
  isOpen,
  onClose,
  withdrawableBalanceToman,
  accounts,
  onWithdrawSuccess,
}: WithdrawalModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    accounts.length > 0 ? accounts[0].id : ''
  );
  const [amountToman, setAmountToman] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseInt(amountToman.replace(/,/g, ''), 10) || 0;
  const remaining = withdrawableBalanceToman - numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) {
      setError('لطفاً یک حساب تسویه انتخاب کنید.');
      return;
    }
    if (numAmount < 50000) {
      setError('حداقل مبلغ قابل برداشت ۵۰,۰۰۰ تومان می‌باشد.');
      return;
    }
    if (numAmount > withdrawableBalanceToman) {
      setError('مبلغ درخواستی بیشتر از موجودی قابل برداشت است.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiRequest('/referral/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          settlement_account_id: selectedAccountId,
          amount_toman: numAmount,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onWithdrawSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت درخواست برداشت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl glass-card border border-white/10 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <span>درخواست برداشت وجه</span>
        </h3>
        <p className="text-xs text-text-secondary mb-6">
          واریز وجه به حساب‌های بانکی داخلی از طریق پایا/ساتنا و به کیف پول‌های کریپتو به صورت تتر انجام می‌پذیرد.
        </p>

        {success ? (
          <div className="text-center py-8 space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">درخواست برداشت با موفقیت ثبت شد</h4>
            <p className="text-xs text-text-muted">
              مبلغ مورد نظر پس از بررسی واحد مالی به حساب شما واریز خواهد شد.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Balance Status */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-text-muted">موجودی فعلی:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {withdrawableBalanceToman.toLocaleString('fa-IR')} تومان
              </span>
            </div>

            {/* Select Settlement Account */}
            <div>
              <label className="block text-xs text-text-muted mb-1">واریز به حساب:</label>
              {accounts.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  ابتدا باید یک حساب بانکی یا کیف پول رمزارز در بخش حساب‌های تسویه ثبت نمایید.
                </div>
              ) : (
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type === 'bank_iran'
                        ? `${acc.bank_name || 'بانک'} - ${acc.account_holder} (${acc.sheba_number?.slice(0, 10)}...)`
                        : `USDT ${acc.crypto_network} (${acc.crypto_wallet_address?.slice(0, 12)}...)`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-xs text-text-muted mb-1">مبلغ درخواستی (تومان):</label>
              <input
                type="number"
                placeholder="حداقل ۵۰,۰۰۰ تومان"
                min={50000}
                max={withdrawableBalanceToman}
                value={amountToman}
                onChange={(e) => setAmountToman(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-cosmic-purple"
                required
              />
            </div>

            {/* Remaining Calculation */}
            {numAmount > 0 && (
              <div className="flex justify-between text-xs text-text-muted px-1">
                <span>موجودی پس از برداشت:</span>
                <span className={`font-mono font-bold ${remaining < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {remaining.toLocaleString('fa-IR')} تومان
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || accounts.length === 0 || numAmount < 50000 || numAmount > withdrawableBalanceToman}
              className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-95 text-white font-bold text-xs shadow-neon-purple transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>{loading ? 'در حال ثبت درخواست...' : 'تایید و ثبت نهایی برداشت'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
