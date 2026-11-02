'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gamepad2,
  KeyRound,
  Phone,
  Mail,
  Lock,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles,
  Share2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import { TokenResponse } from '@/types/auth';
import { useTranslation } from '@/i18n';

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, setAuthModalOpen, authModalInitialTab, setAuth } = useAuthStore();

  const deploymentMode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE || 'domestic';
  const isDomestic = deploymentMode === 'domestic';

  const [tab, setTab] = useState<'otp' | 'password' | 'register' | 'console'>('otp');
  const [isConsoleUA, setIsConsoleUA] = useState(false);

  // OTP Login State
  const [otpTarget, setOtpTarget] = useState('');
  const [otpStep, setOtpStep] = useState<'target' | 'verify'>('target');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Register State
  const [regTarget, setRegTarget] = useState('');
  const [regStep, setRegStep] = useState<'target' | 'verify'>('target');
  const [regCode, setRegCode] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Password Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Console Code State
  const [consoleCode, setConsoleCode] = useState('');

  // Generic State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect PlayStation User-Agent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isPlayStation = ua.includes('playstation') || ua.includes('ps5') || ua.includes('ps4');
      setIsConsoleUA(isPlayStation);
      if (isPlayStation) {
        setTab('console');
      } else {
        if (authModalInitialTab === 'console') {
          setTab('otp');
        } else {
          setTab(authModalInitialTab);
        }
      }
    }
  }, [authModalInitialTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const resetForms = () => {
    setError(null);
    setSimulatedNotice(null);
    setOtpStep('target');
    setOtpCode('');
    setRegStep('target');
    setRegCode('');
    setRegFullName('');
    setRegUsername('');
    setRegPassword('');
    setRegReferralCode('');
    setLoginIdentifier('');
    setLoginPassword('');
    setConsoleCode('');
  };

  // Real-time target validator
  const validateTarget = (val: string) => {
    const clean = val.trim();
    if (!clean) return { valid: false, message: null, type: 'empty' };

    if (isDomestic) {
      if (clean.includes('@') || /[a-zA-Z]/.test(clean)) {
        return {
          valid: false,
          message: 'در نسخه داخلی، ثبت‌نام فقط با شماره موبایل ایران امکان‌پذیر است.',
          type: 'error',
        };
      }
      if (/^09\d{9}$/.test(clean)) {
        return { valid: true, message: 'شماره معتبر همراه ایران', type: 'success' };
      }
      if (clean.startsWith('09')) {
        return {
          valid: false,
          message: `در حال وارد کردن شماره (${clean.length}/۱۱ رقم)...`,
          type: 'warning',
        };
      }
      return {
        valid: false,
        message: 'شماره موبایل باید با ۰۹ شروع شود.',
        type: 'error',
      };
    } else {
      if (/^\d+$/.test(clean) || clean.startsWith('09')) {
        return {
          valid: false,
          message: 'In international mode, registration is only via Email.',
          type: 'error',
        };
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        return { valid: true, message: 'Valid international email address', type: 'success' };
      }
      return {
        valid: false,
        message: 'Enter complete email format (e.g. name@domain.com)',
        type: 'warning',
      };
    }
  };

  // 1. Send OTP for Login
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = otpTarget.trim();
    const validation = validateTarget(cleanTarget);
    if (!validation.valid) {
      setError(validation.message || 'لطفاً مقدار ورودی معتبر وارد نمایید.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string; detail?: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ target: cleanTarget }),
      });
      setOtpStep('verify');
      if (res.detail) setSimulatedNotice(res.detail);
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit OTP Login
  const handleOtpLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    const cleanTarget = otpTarget.trim();
    if (!cleanCode) {
      setError('لطفاً کد تایید دریافتی را وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/login/otp', {
        method: 'POST',
        body: JSON.stringify({
          target: cleanTarget,
          code: cleanCode,
        }),
      });
      setAuth(res);
      setAuthModalOpen(false);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'کد تایید وارد شده نامعتبر یا منقضی شده است.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send OTP for Registration
  const handleSendRegOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = regTarget.trim();
    const validation = validateTarget(cleanTarget);
    if (!validation.valid) {
      setError(validation.message || 'لطفاً مقدار ورودی معتبر وارد نمایید.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string; detail?: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ target: cleanTarget }),
      });
      setRegStep('verify');
      if (res.detail) setSimulatedNotice(res.detail);
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال کد تایید');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit Full Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = regTarget.trim();
    const cleanCode = regCode.trim();
    const cleanFullName = regFullName.trim();
    const cleanUsername = regUsername.trim();
    const cleanPassword = regPassword.trim();
    const cleanReferral = regReferralCode.trim() || undefined;

    if (!cleanCode || !cleanFullName || !cleanUsername || !cleanPassword) {
      setError('لطفاً تمامی فیلدهای الزامی فرم ثبت‌نام را تکمیل فرمایید.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(cleanUsername)) {
      setError('نام کاربری باید بین ۳ تا ۵۰ کاراکتر و فقط شامل حروف انگلیسی، اعداد یا _ باشد.');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('کلمه عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          target: cleanTarget,
          code: cleanCode,
          full_name: cleanFullName,
          username: cleanUsername,
          password: cleanPassword,
          referral_code: cleanReferral,
        }),
      });
      setAuth(res);
      setAuthModalOpen(false);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'خطا در تکمیل ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  // 5. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLogin = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();
    if (!cleanLogin || !cleanPass) {
      setError('لطفاً نام کاربری/شماره و کلمه عبور را وارد کنید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: cleanLogin,
          password: cleanPass,
        }),
      });
      setAuth(res);
      setAuthModalOpen(false);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'نام کاربری یا کلمه عبور وارد شده نادرست است.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Console Login (PS4 / PS5)
  const handleConsoleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanConsoleCode = consoleCode.toUpperCase().trim();
    if (!cleanConsoleCode) {
      setError('لطفاً کد ورود کنسول را وارد کنید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<TokenResponse>('/auth/login/console', {
        method: 'POST',
        body: JSON.stringify({
          console_code: cleanConsoleCode,
        }),
      });
      setAuth(res);
      setAuthModalOpen(false);
      resetForms();
    } catch (err: any) {
      setError(err.message || 'کد ورود کنسول نامعتبر است یا منقضی شده است.');
    } finally {
      setLoading(false);
    }
  };

  const otpValidation = validateTarget(otpTarget);
  const regValidation = validateTarget(regTarget);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-2xl glass-card border border-cosmic-purple/40 p-6 shadow-2xl overflow-hidden bg-[#101116] max-h-[92vh] overflow-y-auto"
        >
          {/* Header Close */}
          <button
            type="button"
            onClick={() => {
              setAuthModalOpen(false);
              resetForms();
            }}
            className="absolute top-5 ltr:right-5 rtl:left-5 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-cosmic-gradient shadow-neon-purple text-white">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isConsoleUA ? 'ورود به حساب کنسول پلی‌استیشن' : 'ورود و ثبت‌نام در دکتر گیم'}
              </h2>
              <p className="text-xs text-text-muted">
                {isConsoleUA
                  ? 'ورود سریع بهینه شده برای مرورگر PS4 و PS5'
                  : isDomestic
                  ? 'سامانه یکپارچه کاربران دکتر گیم (ایران)'
                  : 'DrGame Global Gamer Network'}
              </p>
            </div>
          </div>

          {/* =========================================================================
              NAVIGATION TABS
              - If PlayStation detected: ONLY show console badge (no tab navigation).
              - If Desktop/Mobile: Show OTP, Password, and Register tabs (Hide Console).
             ========================================================================= */}
          {isConsoleUA ? (
            <div className="mb-6 p-3 rounded-xl bg-cosmic-purple/15 border border-cosmic-purple/30 flex items-center justify-between text-xs">
              <span className="font-bold text-nebula-violet flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4" />
                کنسول شناسایی شد: پلی‌استیشن
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          ) : (
            <div className="flex p-1 mb-6 rounded-xl bg-[#0d121f] border border-white/10 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setTab('otp');
                  resetForms();
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer font-bold ${
                  tab === 'otp'
                    ? 'bg-nebula-violet text-white shadow-neon-purple'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                ورود با OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('password');
                  resetForms();
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer font-bold ${
                  tab === 'password'
                    ? 'bg-nebula-violet text-white shadow-neon-purple'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                ورود با رمز عبور
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  resetForms();
                }}
                className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer font-bold ${
                  tab === 'register'
                    ? 'bg-cosmic-purple text-white shadow-neon-purple'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                ثبت‌نام جدید
              </button>
            </div>
          )}

          {/* Error Banner */}
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
              <span>
                کد آزمایشی سرور:{' '}
                <b className="font-mono text-sm tracking-wider">
                  {simulatedNotice.replace('DEBUG_CODE: ', '')}
                </b>
              </span>
            </div>
          )}

          {/* =========================================================================
              TAB 1: OTP FAST LOGIN
             ========================================================================= */}
          {!isConsoleUA && tab === 'otp' && (
            <div>
              {otpStep === 'target' ? (
                <form onSubmit={handleSendLoginOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-2">
                      {isDomestic ? 'شماره تلفن همراه' : 'Email Address'}
                    </label>
                    <div className="relative w-full box-border" dir="ltr">
                      <input
                        type={isDomestic ? 'tel' : 'email'}
                        dir="ltr"
                        style={{ colorScheme: 'dark' }}
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        placeholder={isDomestic ? '09123456789' : 'user@example.com'}
                        className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet transition-colors text-left caret-purple-400 selection:bg-purple-600 selection:text-white"
                        required
                        autoFocus
                      />
                      {isDomestic ? (
                        <Phone className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                      ) : (
                        <Mail className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                      )}
                    </div>

                    {/* Live Validator Badge */}
                    {otpValidation.message && (
                      <div
                        className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${
                          otpValidation.type === 'success'
                            ? 'text-emerald-400'
                            : otpValidation.type === 'warning'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {otpValidation.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{otpValidation.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !otpValidation.valid}
                    className="w-full box-border py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer active:scale-[0.99]"
                  >
                    {loading ? 'در حال ارسال کد...' : 'دریافت کد ورود ۶ رقمی'}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('register');
                        resetForms();
                      }}
                      className="text-xs text-nebula-violet hover:underline cursor-pointer"
                    >
                      حساب کاربری ندارید؟ ثبت‌نام مشخصات کامل
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleOtpLoginSubmit} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-text-secondary">کد تایید ۶ رقمی دریافتی</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('target');
                          setOtpCode('');
                          setError(null);
                        }}
                        className="text-xs text-nebula-violet hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>تغییر شماره / ایمیل</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      style={{ colorScheme: 'dark' }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-2xl font-bold px-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-emerald-400 focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet caret-purple-400 selection:bg-purple-600"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 4}
                    className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'در حال ورود...' : 'ورود فوری به حساب کاربری'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: PASSWORD LOGIN
             ========================================================================= */}
          {!isConsoleUA && tab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">
                  نام کاربری، شماره موبایل یا ایمیل
                </label>
                <div className="relative w-full box-border" dir="ltr">
                  <input
                    type="text"
                    dir="ltr"
                    style={{ colorScheme: 'dark' }}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="gamer2026 / 0912... / user@domain.com"
                    className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet transition-colors text-left caret-purple-400 selection:bg-purple-600 selection:text-white"
                    required
                    autoFocus
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">کلمه عبور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    style={{ colorScheme: 'dark' }}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-11 pe-11 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet transition-colors text-left caret-purple-400 selection:bg-purple-600 selection:text-white"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'در حال بررسی...' : 'ورود با کلمه عبور'}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTab('otp');
                    resetForms();
                  }}
                  className="text-text-muted hover:text-white cursor-pointer"
                >
                  ورود سریع بدون رمز
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    resetForms();
                  }}
                  className="text-nebula-violet hover:underline font-bold cursor-pointer"
                >
                  حساب ندارید؟ ثبت‌نام کنید
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              TAB 3: FULL REGISTRATION FORM
             ========================================================================= */}
          {!isConsoleUA && tab === 'register' && (
            <div>
              {regStep === 'target' ? (
                <form onSubmit={handleSendRegOtp} className="space-y-4">
                  <div className="p-3 rounded-xl bg-cosmic-purple/10 border border-cosmic-purple/25 text-xs text-text-secondary leading-relaxed">
                    برای شروع ثبت‌نام، شماره تماس یا ایمیل معتبر خود را جهت دریافت کد تایید وارد کنید.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-2">
                      {isDomestic ? 'شماره همراه (ایران)' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <input
                        type={isDomestic ? 'tel' : 'email'}
                        dir="ltr"
                        style={{ colorScheme: 'dark' }}
                        value={regTarget}
                        onChange={(e) => setRegTarget(e.target.value)}
                        placeholder={isDomestic ? '09123456789' : 'user@example.com'}
                        className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet transition-colors text-left caret-purple-400 selection:bg-purple-600 selection:text-white"
                        required
                        autoFocus
                      />
                      {isDomestic ? (
                        <Phone className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                      ) : (
                        <Mail className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                      )}
                    </div>

                    {/* Live Validator Badge */}
                    {regValidation.message && (
                      <div
                        className={`mt-1.5 text-[11px] flex items-center gap-1.5 ${
                          regValidation.type === 'success'
                            ? 'text-emerald-400'
                            : regValidation.type === 'warning'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {regValidation.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{regValidation.message}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !regValidation.valid}
                    className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'در حال ارسال کد...' : 'تایید شماره و رفتن به فرم ثبت‌نام'}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('password');
                        resetForms();
                      }}
                      className="text-xs text-text-muted hover:text-white cursor-pointer"
                    >
                      قبلاً ثبت‌نام کرده‌اید؟ ورود با کلمه عبور
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-xs text-text-secondary">
                      تایید کد ارسال شده به <b className="text-white" dir="ltr">{regTarget}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRegStep('target');
                        setRegCode('');
                        setError(null);
                      }}
                      className="text-xs text-nebula-violet hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>تغییر</span>
                    </button>
                  </div>

                  {/* OTP Code */}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      کد تایید ۶ رقمی
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      style={{ colorScheme: 'dark' }}
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-xl font-bold px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-emerald-400 focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet caret-purple-400"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      نام و نام خانوادگی
                    </label>
                    <input
                      type="text"
                      style={{ colorScheme: 'dark' }}
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="علیرضا محمدی"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet caret-purple-400"
                      required
                    />
                  </div>

                  {/* Unique Username */}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      نام کاربری دلخواه (یکتا و به انگلیسی)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        style={{ colorScheme: 'dark' }}
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="gamer_2026"
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet text-left caret-purple-400 font-mono"
                        required
                      />
                      <User className="absolute start-3 top-3 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Password with Eye Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      کلمه عبور (حداقل ۶ کاراکتر)
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        dir="ltr"
                        style={{ colorScheme: 'dark' }}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet text-left caret-purple-400"
                        required
                      />
                      <Lock className="absolute start-3 top-3 w-4 h-4 text-text-muted pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute end-3 top-3 text-text-muted hover:text-white transition-colors cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Optional Referral Code */}
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      کد معرف (اختیاری)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        style={{ colorScheme: 'dark' }}
                        value={regReferralCode}
                        onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                        placeholder="مثلاً: REF8X92K"
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-amber-300 placeholder:text-slate-500 text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet text-left caret-purple-400 font-mono tracking-wider"
                      />
                      <Share2 className="absolute start-3 top-3 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || regCode.length < 4 || !regFullName || !regUsername || !regPassword}
                    className="w-full py-3 mt-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{loading ? 'در حال ثبت‌نام...' : 'تکمیل ثبت‌نام و ساخت حساب'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 4: CONSOLE QUICK AUTH (PlayStation PS4 / PS5 Only)
             ========================================================================= */}
          {tab === 'console' && (
            <form onSubmit={handleConsoleLogin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cosmic-purple/10 border border-cosmic-purple/30 text-xs text-text-secondary leading-relaxed">
                کد ورود موقت ۲ دقیقه‌ای را از پنل کاربری خود در تلفن همراه یا کامپیوتر تولید کرده و در کادر زیر وارد کنید تا بدون نیاز به تایپ پسورد، در کنسول وارد شوید.
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">
                  کد ورود سریع کنسول (۶ الی ۷ کاراکتر)
                </label>
                <div className="relative w-full box-border" dir="ltr">
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    style={{ colorScheme: 'dark' }}
                    value={consoleCode}
                    onChange={(e) => setConsoleCode(e.target.value.toUpperCase())}
                    placeholder="7X9K2P"
                    className="w-full text-center uppercase tracking-widest text-2xl font-mono font-bold px-11 py-3.5 rounded-xl bg-[#0d121f] border border-cosmic-purple/40 text-emerald-400 focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet caret-purple-400"
                    required
                    autoFocus
                  />
                  <KeyRound className="absolute start-3.5 top-4 w-5 h-5 text-nebula-violet pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || consoleCode.length < 6}
                className="w-full py-3.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white font-bold text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{loading ? 'در حال تایید کنسول...' : 'ورود فوری به کنسول پلی‌استیشن'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}