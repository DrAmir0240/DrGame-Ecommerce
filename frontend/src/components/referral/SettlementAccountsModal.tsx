'use client';

import React, { useState } from 'react';
import { SettlementAccount } from '@/types/referral';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';
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
  Trash2,
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
  const { t } = useTranslation();
  const [accountType, setAccountType] = useState<'bank_iran' | 'crypto'>('bank_iran');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!shebaNumber.trim() || !accountHolder.trim()) {
      setError(t('referralUI.settlement.errShebaHolder'));
      return;
    }
    if (!nationalId.trim() || nationalId.length !== 10) {
      setError(t('referralUI.settlement.errNationalId'));
      return;
    }
    if (!mobilePhone.trim() || mobilePhone.length < 11) {
      setError(t('referralUI.settlement.errMobile'));
      return;
    }

    try {
      setIsOtpSending(true);
      const res = await apiRequest<{
        status: string;
        phone: string;
        expires_in_seconds: number;
        test_otp_code?: string;
        message: string;
      }>('/referral/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: mobilePhone.trim() }),
      });

      setOtpStep('otp');
      setSuccessMsg(res.message || t('referralUI.settlement.otpSent'));
      if (res.test_otp_code) {
        // Pre-fill or log for development mode test code convenience
        console.log('[Settlement OTP Test Code]:', res.test_otp_code);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال کد تایید پیامکی');
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyOtpAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode.trim() || otpCode.trim().length < 5) {
      setError(t('referralUI.settlement.errOtp'));
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
        national_code: nationalId.trim(),
        phone: mobilePhone.trim(),
        otp_code: otpCode.trim(),
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
      setSuccessMsg(t('referralUI.settlement.bankSaved'));
      setTimeout(() => setSuccessMsg(null), 3000);
      onAccountAdded();
    } catch (err: any) {
      setError(err.message || t('referralUI.settlement.errBankSave'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (deletingId) return;
    try {
      setDeletingId(accountId);
      setError(null);
      await apiRequest(`/referral/settlement-accounts/${accountId}`, {
        method: 'DELETE',
      });
      setSuccessMsg('حساب تسویه با موفقیت حذف گردید.');
      setTimeout(() => setSuccessMsg(null), 3000);
      onAccountAdded();
    } catch (err: any) {
      setError(err.message || 'خطا در حذف حساب تسویه');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCryptoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!cryptoWalletAddress.trim()) {
        throw new Error(t('referralUI.settlement.errWalletRequired'));
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
      setSuccessMsg(t('referralUI.settlement.walletSaved'));
      setTimeout(() => setSuccessMsg(null), 3000);
      onAccountAdded();
    } catch (err: any) {
      setError(err.message || t('referralUI.settlement.errWalletSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-vazir text-start">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0e17] border border-white/10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all float-left"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span>{t('referralUI.settlement.title')}</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {t('referralUI.settlement.subtitle')}
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
            <span className="text-xs text-slate-300 font-bold block mb-1">{t('referralUI.settlement.existingAccounts')}</span>
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
                      {acc.account_type === 'bank_iran'
                        ? `${acc.bank_name || t('referralUI.settlement.bankFallback')} (${acc.account_holder})`
                        : t('referralUI.settlement.cryptoAccount', { network: acc.crypto_network || '' })}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5 dir-ltr text-start">
                    {acc.sheba_number || acc.crypto_wallet_address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    acc.is_verified ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {acc.is_verified ? t('referralUI.settlement.verified') : t('referralUI.settlement.pending')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc.id)}
                    disabled={deletingId === acc.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                    title="حذف حساب"
                  >
                    {deletingId === acc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
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
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              accountType === 'bank_iran' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('referralUI.settlement.tabBank')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountType('crypto');
              setError(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              accountType === 'crypto' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{t('referralUI.settlement.tabCrypto')}</span>
          </button>
        </div>

        {/* Bank Form */}
        {accountType === 'bank_iran' ? (
          otpStep === 'form' ? (
            <form onSubmit={handleRequestOtp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.shebaLabel')}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="012345678901234567890123"
                    value={shebaNumber.replace(/^IR/i, '')}
                    onChange={(e) => setShebaNumber(`IR${e.target.value.replace(/[^0-9]/g, '')}`)}
                    maxLength={24}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-start pl-12"
                    required
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono font-bold">IR</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.holderLabel')}</label>
                <input
                  type="text"
                  placeholder={t('referralUI.settlement.holderPlaceholder')}
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.nationalIdLabel')}</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0012345678"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-start"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.mobileLabel')}</label>
                  <input
                    type="tel"
                    maxLength={11}
                    placeholder="09123456789"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-start"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">{t('referralUI.settlement.bankNameLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('referralUI.settlement.bankNamePlaceholder')}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">{t('referralUI.settlement.cardLabel')}</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder={t('referralUI.settlement.cardPlaceholder')}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 dir-ltr text-start"
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isOtpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                <span>{isOtpSending ? t('referralUI.settlement.otpSending') : t('referralUI.settlement.requestOtp')}</span>
              </button>
            </form>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOtpAndSave} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>{t('referralUI.settlement.otpTitle', { nationalId })}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  {t('referralUI.settlement.otpHint', { phone: mobilePhone })}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.otpLabel')}</label>
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
                  className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {t('referralUI.settlement.editInfo')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{loading ? t('referralUI.settlement.verifying') : t('referralUI.settlement.confirmSave')}</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* Crypto Form */
          <form onSubmit={handleCryptoSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.walletLabel')}</label>
              <input
                type="text"
                placeholder={t('referralUI.settlement.walletPlaceholder')}
                value={cryptoWalletAddress}
                onChange={(e) => setCryptoWalletAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 dir-ltr text-start"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">{t('referralUI.settlement.networkLabel')}</label>
              <select
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="TRC20">{t('referralUI.settlement.networks.trc20')}</option>
                <option value="BEP20">{t('referralUI.settlement.networks.bep20')}</option>
                <option value="POLYGON">{t('referralUI.settlement.networks.polygon')}</option>
                <option value="ERC20">{t('referralUI.settlement.networks.erc20')}</option>
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{loading ? t('referralUI.settlement.submitting') : t('referralUI.settlement.submitCrypto')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
