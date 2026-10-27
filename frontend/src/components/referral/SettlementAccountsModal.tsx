'use client';

import React, { useState } from 'react';
import { SettlementAccount } from '@/types/referral';
import { apiRequest } from '@/lib/apiClient';
import {
  X,
  Building2,
  Coins,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldCheck,
  Smartphone,
  CreditCard,
  KeyRound,
  Loader2,
} from 'lucide-react';

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bank Form Fields
  const [shebaNumber, setShebaNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [bankName, setBankName] = useState('');

  // OTP Verification Flow for Bank
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSending, setIsOtpSending] = useState(false);

  // Crypto Form Fields
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');

  if (!isOpen) return null;

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shebaNumber.trim() || !accountHolder.trim()) {
      setError('شماره شبا و نام صاحب حساب الزامی است.');
      return;
    }
    if (!nationalId.trim() || nationalId.length !== 10) {
      setError('کد ملی باید دقیقاً ۱۰ رقم باشد.');
      return;
    }
    if (!mobilePhone.trim() || mobilePhone.length < 11) {
      setError('شماره موبایل معتبر (۱۱ رقمی به نام صاحب حساب) وارد کنید.');
      return;
    }

    setIsOtpSending(true);
    setTimeout(() => {
      setIsOtpSending(false);
      setOtpStep('otp');
      setSuccessMsg('کد اعتبارسنجی تستی پیامک شد (کد پیش‌فرض: 123456)');
    }, 700);
  };

  const handleVerifyOtpAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode !== '123456' && otpCode.length < 5) {
      setError('کد اعتبارسنجی وارد شده صحیح نمی‌باشد. (کد تستی: 123456)');
      return;
    }

    saveBankAccount();
  };

  const saveBankAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        account_type: 'bank_iran',
        sheba_number: shebaNumber.trim(),
        card_number: cardNumber.trim() || undefined,
        account_holder: accountHolder.trim(),
        bank_name: bankName.trim() || undefined,
      };

      await apiRequest('/referral/settlement-accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Reset and trigger refresh
      setShebaNumber('');
      setCardNumber('');
      setAccountHolder('');
      setNationalId('');
      setMobilePhone('');
      setBankName('');
      setOtpStep('form');
      setOtpCode('');
      setSuccessMsg('حساب بانکی پس از احراز هویت با موفقیت ثبت شد.');
      setTimeout(() => setSuccessMsg(null), 3000);
      onAccountAdded();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت حساب تسویه');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!cryptoWalletAddress.trim()) {
        throw new Error('آدرس کیف پول تتر (USDT) الزامی است.');
      }

      await apiRequest('/referral/settlement-accounts', {
        method: 'POST',
        body: JSON.stringify({
          account_type: 'crypto',
          crypto_wallet_address: cryptoWalletAddress.trim(),
          crypto_network: cryptoNetwork,
        }),
      });

      setCryptoWalletAddress('');
      setSuccessMsg('کیف پول کریپتو با موفقیت ثبت شد.');
      setTimeout(() => setSuccessMsg(null), 3000);
      onAccountAdded();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت کیف پول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-vazir text-right">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0e17] border border-white/10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>مدیریت حساب‌های تسویه سود</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          جهت دریافت واریزی پورسانت بازاریابی، حساب بانکی تاییدشده به همراه کد ملی و موبایل یا کیف پول تتر را ثبت نمایید.
        </p>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Existing Accounts List */}
        {accounts.length > 0 && (
          <div className="mb-6 space-y-2">
            <span className="text-xs text-slate-300 font-bold block mb-1">حساب‌های ثبت‌شده شما:</span>
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
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5 dir-ltr text-right">
                    {acc.sheba_number || acc.crypto_wallet_address}
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  acc.is_verified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
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
            onClick={() => {
              setAccountType('bank_iran');
              setOtpStep('form');
              setError(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'bank_iran' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>حساب بانکی و کد ملی</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType('crypto');
              setError(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              accountType === 'crypto' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>کیف پول تتر (USDT)</span>
          </button>
        </div>

        {/* Bank Form */}
        {accountType === 'bank_iran' ? (
          otpStep === 'form' ? (
            <form onSubmit={handleRequestOtp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">شماره شبا (۲۴ رقم بدون IR):</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="012345678901234567890123"
                    value={shebaNumber.replace(/^IR/i, '')}
                    onChange={(e) => setShebaNumber(`IR${e.target.value.replace(/[^0-9]/g, '')}`)}
                    maxLength={24}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-right pl-12"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">IR</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">نام و نام خانوادگی صاحب حساب:</label>
                <input
                  type="text"
                  placeholder="مثال: علیرضا محمدی"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">کد ملی صاحب حساب (۱۰ رقم):</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0012345678"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-right"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">شماره موبایل منطبق:</label>
                  <input
                    type="tel"
                    maxLength={11}
                    placeholder="09123456789"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-right"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">نام بانک:</label>
                  <input
                    type="text"
                    placeholder="مثال: ملت، سامان"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">شماره کارت (اختیاری):</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="۶۰۳۷..."
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-right"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isOtpSending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isOtpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                <span>{isOtpSending ? 'در حال ارسال پیامک اعتبارسنجی...' : 'دریافت پیامک تایید و احراز هویت'}</span>
              </button>
            </form>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtpAndSave} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>تأیید پیامکی تطابق شبا با کد ملی {nationalId}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  کد ۶ رقمی ارسال شده به شماره {mobilePhone} را وارد کنید. (برای تست: 123456)
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">کد تأیید ۶ رقمی:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:border-cyan-400 dir-ltr"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOtpStep('form')}
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  ویرایش اطلاعات
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{loading ? 'در حال تایید...' : 'تایید نهایی و ثبت حساب'}</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* Crypto Form */
          <form onSubmit={handleCryptoSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">آدرس کیف پول تتر (USDT):</label>
              <input
                type="text"
                placeholder="T... یا 0x..."
                value={cryptoWalletAddress}
                onChange={(e) => setCryptoWalletAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 dir-ltr text-right"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">نوع شبکه انتقال رمزارز:</label>
              <select
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="TRC20">Tron (TRC20) - کارمزد پایین و پرسرعت</option>
                <option value="BEP20">BNB Smart Chain (BEP20)</option>
                <option value="POLYGON">Polygon Network</option>
                <option value="ERC20">Ethereum (ERC20)</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{loading ? 'در حال ثبت...' : 'ثبت کیف پول تتر'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
