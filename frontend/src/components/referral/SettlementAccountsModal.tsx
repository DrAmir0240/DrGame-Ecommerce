'use client';

import React, { useState } from 'react';
import { SettlementAccount } from '@/types/referral';
import { apiRequest } from '@/lib/apiClient';
import { X, Building2, Coins, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

interface SettlementAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: SettlementAccount[];
  onAccountAdded: () => void;
}

export default function SettlementAccountsModal({
  isOpen,
  onClose,
  accounts,
  onAccountAdded,
}: SettlementAccountsModalProps) {
  const [accountType, setAccountType] = useState<'bank_iran' | 'crypto'>('bank_iran');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank Form
  const [shebaNumber, setShebaNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');

  // Crypto Form
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = { account_type: accountType };

      if (accountType === 'bank_iran') {
        if (!shebaNumber.trim() || !accountHolder.trim()) {
          throw new Error('شماره شبا و نام صاحب حساب الزامی است.');
        }
        payload.sheba_number = shebaNumber.trim();
        payload.card_number = cardNumber.trim() || undefined;
        payload.account_holder = accountHolder.trim();
        payload.bank_name = bankName.trim() || undefined;
      } else {
        if (!cryptoWalletAddress.trim()) {
          throw new Error('آدرس کیف پول تتر (USDT) الزامی است.');
        }
        payload.crypto_wallet_address = cryptoWalletAddress.trim();
        payload.crypto_network = cryptoNetwork;
      }

      await apiRequest('/referral/settlement-accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Reset and trigger refresh
      setShebaNumber('');
      setCardNumber('');
      setAccountHolder('');
      setBankName('');
      setCryptoWalletAddress('');
      onAccountAdded();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت حساب تسویه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl glass-card border border-white/10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white mb-2">مدیریت حساب‌های تسویه</h3>
        <p className="text-xs text-text-secondary mb-6">
          جهت دریافت واریزی پورسانت، حساب بانکی داخلی یا کیف پول کریپتو خود را ثبت نمایید.
        </p>

        {/* Existing Accounts List */}
        {accounts.length > 0 && (
          <div className="mb-6 space-y-2">
            <span className="text-xs text-text-muted font-bold block mb-1">حساب‌های ثبت‌شده شما:</span>
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    {acc.account_type === 'bank_iran' ? (
                      <Building2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Coins className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="font-bold text-white">
                      {acc.account_type === 'bank_iran' ? `${acc.bank_name || 'حساب بانکی'} (${acc.account_holder})` : `کیف پول USDT (${acc.crypto_network})`}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-muted font-mono block mt-0.5 dir-ltr text-right">
                    {acc.sheba_number || acc.crypto_wallet_address}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  acc.is_verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {acc.is_verified ? 'تایید شده' : 'در انتظار تایید'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Account Type Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setAccountType('bank_iran')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'bank_iran' ? 'bg-cosmic-purple text-white shadow-neon-purple' : 'text-text-muted hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>حساب بانکی (شبا)</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('crypto')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'crypto' ? 'bg-cosmic-purple text-white shadow-neon-purple' : 'text-text-muted hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>کیف پول تتر (USDT)</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {accountType === 'bank_iran' ? (
            <>
              <div>
                <label className="block text-xs text-text-muted mb-1">شماره شبا (با IR)</label>
                <input
                  type="text"
                  placeholder="IR..."
                  value={shebaNumber}
                  onChange={(e) => setShebaNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cosmic-purple dir-ltr text-right"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">نام و نام خانوادگی صاحب حساب</label>
                <input
                  type="text"
                  placeholder="مثال: علی احمدی"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">نام بانک</label>
                  <input
                    type="text"
                    placeholder="مثال: ملت"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">شماره کارت (اختیاری)</label>
                  <input
                    type="text"
                    placeholder="۶۰۳۷..."
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cosmic-purple dir-ltr text-right"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-text-muted mb-1">آدرس کیف پول تتر (USDT)</label>
                <input
                  type="text"
                  placeholder="T... یا 0x..."
                  value={cryptoWalletAddress}
                  onChange={(e) => setCryptoWalletAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cosmic-purple dir-ltr text-right"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">نوع شبکه رمزارز</label>
                <select
                  value={cryptoNetwork}
                  onChange={(e) => setCryptoNetwork(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                >
                  <option value="TRC20">Tron (TRC20) - کارمزد پایین</option>
                  <option value="ERC20">Ethereum (ERC20)</option>
                  <option value="BEP20">BNB Chain (BEP20)</option>
                  <option value="POLYGON">Polygon Network</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-95 text-white font-bold text-xs shadow-neon-purple transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{loading ? 'در حال ثبت...' : 'ثبت حساب تسویه جدید'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
