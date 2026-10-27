'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, KeyRound, Mail, Phone, Lock, User, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import { TokenResponse } from '@/types/auth';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authModalInitialTab, setAuth } = useAuthStore();
  const [tab, setTab] = useState<'otp' | 'password' | 'console'>(authModalInitialTab);
  const [isConsoleUA, setIsConsoleUA] = useState(false);

  // OTP State
  const [otpTarget, setOtpTarget] = useState('');
  const [otpStep, setOtpStep] = useState<'target' | 'verify'>('target');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Password State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Console Code State
  const [consoleCode, setConsoleCode] = useState('');

  // Generic State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isPlayStation = ua.includes('playstation') || ua.includes('ps5') || ua.includes('ps4');
      setIsConsoleUA(isPlayStation);
      if (isPlayStation) {
        setTab('console');
      } else {
        setTab(authModalInitialTab);
      }
    }
  }, [authModalInitialTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const resetForms = () => {
    setError(null);
    setSimulatedNotice(null);
    setOtpStep('target');
    setOtpCode('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpTarget) {
      setError('لطفاً شماره موبایل یا آدرس ایمیل خود را وارد نمایید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string; detail?: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ target: otpTarget }),
      });
      setOtpStep('verify');
      if (res.detail) {
        setSimulatedNotice(res.detail);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !fullName || !username || !password) {
      setError('لطفاً تمامی فیلدهای الزامی را پر کنید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          target: otpTarget,
          code: otpCode,
          full_name: fullName,
          username,
          password,
        }),
      });
      setAuth(res);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت‌نام با کد تایید');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setError('نام کاربری و کلمه عبور را وارد نمایید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: loginIdentifier,
          password: loginPassword,
        }),
      });
      setAuth(res);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'نام کاربری یا رمز عبور اشتباه است.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsoleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleCode) {
      setError('کد ۷ رقمی کنسول را وارد نمایید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/login/console', {
        method: 'POST',
        body: JSON.stringify({
          console_code: consoleCode.toUpperCase().trim(),
        }),
      });
      setAuth(res);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'کد ۷ رقمی کنسول نامعتبر است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-2xl glass-card border border-cosmic-purple/40 p-6 shadow-2xl text-right overflow-hidden"
        >
          {/* Header Close */}
          <button
            onClick={() => {
              setAuthModalOpen(false);
              resetForms();
            }}
            className="absolute top-4 left-4 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-cosmic-gradient shadow-neon-purple text-white">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ورود به دکتر گیم</h2>
              <p className="text-xs text-text-muted">دسترسی به بازی‌ها، اشتراک و امکانات اختصاصی</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex p-1 mb-6 rounded-xl bg-surface-card border border-white/5 text-xs font-medium">
            <button
              onClick={() => { setTab('otp'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'otp'
                  ? 'bg-nebula-violet text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              کد یکبار مصرف (OTP)
            </button>
            <button
              onClick={() => { setTab('password'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'password'
                  ? 'bg-nebula-violet text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              رمز عبور
            </button>
            <button
              onClick={() => { setTab('console'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                tab === 'console'
                  ? 'bg-cosmic-purple text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span>کد کنسول</span>
              {isConsoleUA && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Simulation Notice for dev test OTP */}
          {simulatedNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>کد پیامکی (محیط تست): <b>{simulatedNotice.replace('DEBUG_CODE: ', '')}</b></span>
            </div>
          )}

          {/* TAB 1: OTP */}
          {tab === 'otp' && (
            <div>
              {otpStep === 'target' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      شماره موبایل یا ایمیل
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        placeholder="09123456789 یا gamer@domain.com"
                        className="w-full px-4 py-3 rounded-xl bg-surface-base border border-white/10 text-white placeholder-text-muted text-sm focus:outline-none focus:border-nebula-violet transition-colors"
                        required
                      />
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50"
                  >
                    {loading ? 'در حال ارسال کد...' : 'دریافت کد تایید ۶ رقمی'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterOtp} className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-text-secondary">کد تایید ۶ رقمی</label>
                      <button
                        type="button"
                        onClick={() => setOtpStep('target')}
                        className="text-xs text-nebula-violet hover:underline flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>تغییر شماره</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-bold px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">نام کامل</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="علیرضا محمدی"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">نام کاربری انگلیسی</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="gamer_2026"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">کلمه عبور</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50"
                  >
                    {loading ? 'در حال فعال‌سازی...' : 'تکمیل ثبت‌نام و ورود'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Password */}
          {tab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  نام کاربری، ایمیل یا موبایل
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="drgamer"
                    className="w-full px-4 py-3 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                    required
                  />
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  کلمه عبور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                    required
                  />
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50"
              >
                {loading ? 'در حال بررسی...' : 'ورود به حساب کاربری'}
              </button>
            </form>
          )}

          {/* TAB 3: Console Quick Auth */}
          {tab === 'console' && (
            <form onSubmit={handleConsoleLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-cosmic-purple/10 border border-cosmic-purple/30 text-xs text-text-secondary">
                کد ورود اختصاصی ۷ رقمی را از پنل کاربری خود در گوشی یا کامپیوتر برداشته و اینجا وارد کنید تا در کنسول لاگین شوید.
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  کد ۷ رقمی ورود سریع کنسول
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={7}
                    value={consoleCode}
                    onChange={(e) => setConsoleCode(e.target.value.toUpperCase())}
                    placeholder="7X9K2PL"
                    className="w-full text-center uppercase tracking-widest text-xl font-mono font-bold px-4 py-3 rounded-xl bg-surface-base border border-cosmic-purple/40 text-nebula-violet focus:outline-none focus:border-nebula-violet"
                    required
                  />
                  <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5 text-nebula-violet" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50"
              >
                {loading ? 'در حال اعتبارسنجی کنسول...' : 'ورود فوری در کنسول'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
