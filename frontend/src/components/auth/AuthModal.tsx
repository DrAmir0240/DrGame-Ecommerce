'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, KeyRound, Phone, Lock, User, ArrowLeft, CheckCircle2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import { TokenResponse } from '@/types/auth';
import { useTranslation } from '@/i18n';

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, setAuthModalOpen, authModalInitialTab, setAuth } = useAuthStore();
  const [tab, setTab] = useState<'otp' | 'password' | 'console'>(authModalInitialTab);
  const [isConsoleUA, setIsConsoleUA] = useState(false);

  // OTP State
  const [otpTarget, setOtpTarget] = useState('');
  const [otpStep, setOtpStep] = useState<'target' | 'verify'>('target');
  const [otpCode, setOtpCode] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);

  // Password State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    setIsRegisterMode(false);
    setFullName('');
    setUsername('');
    setPassword('');
    setLoginIdentifier('');
    setLoginPassword('');
    setConsoleCode('');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = otpTarget.trim();
    if (!cleanTarget) {
      setError(t('auth.errors.phoneRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ message: string; detail?: string }>('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({
          target: cleanTarget,
          phone_number: cleanTarget,
        }),
      });
      setOtpStep('verify');
      if (res.detail) {
        setSimulatedNotice(res.detail);
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.otpSend'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    const cleanTarget = otpTarget.trim();
    if (!cleanCode) {
      setError(t('auth.errors.requiredFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If user toggled manual registration form and entered credentials, call /auth/register
      if (isRegisterMode && (fullName.trim() || username.trim() || password.trim())) {
        if (!fullName.trim() || !username.trim() || !password.trim()) {
          setError(t('auth.errors.requiredFields'));
          setLoading(false);
          return;
        }

        const res = await apiRequest<TokenResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            target: cleanTarget,
            phone_number: cleanTarget,
            code: cleanCode,
            full_name: fullName.trim(),
            username: username.trim(),
            password: password.trim(),
          }),
        });
        setAuth(res);
        setAuthModalOpen(false);
        resetForms();
      } else {
        // Fast passwordless OTP login (supports existing users and auto-creates accounts seamlessly)
        const res = await apiRequest<TokenResponse>('/auth/login/otp', {
          method: 'POST',
          body: JSON.stringify({
            target: cleanTarget,
            phone_number: cleanTarget,
            code: cleanCode,
          }),
        });
        setAuth(res);
        setAuthModalOpen(false);
        resetForms();
      }
    } catch (err: any) {
      setError(err.message || t('auth.errors.register'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLogin = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();
    if (!cleanLogin || !cleanPass) {
      setError(t('auth.errors.credentials'));
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
      setError(err.message || t('auth.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleConsoleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanConsoleCode = consoleCode.toUpperCase().trim();
    if (!cleanConsoleCode) {
      setError(t('auth.errors.consoleCode'));
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
      setError(err.message || t('auth.errors.invalidConsoleCode'));
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
          className="relative w-full max-w-md rounded-2xl glass-card border border-cosmic-purple/40 p-6 shadow-2xl overflow-hidden bg-[#101116]"
        >
          {/* Header Close */}
          <button
            onClick={() => {
              setAuthModalOpen(false);
              resetForms();
            }}
            className="absolute top-4 left-4 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-cosmic-gradient shadow-neon-purple text-white">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('auth.loginToDrGame')}</h2>
              <p className="text-xs text-text-muted">{t('auth.loginSubtitle')}</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex p-1 mb-6 rounded-xl bg-[#0d121f] border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setTab('otp'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'otp'
                  ? 'bg-nebula-violet text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {t('auth.otpTab')}
            </button>
            <button
              type="button"
              onClick={() => { setTab('password'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'password'
                  ? 'bg-nebula-violet text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {t('auth.passwordTab')}
            </button>
            <button
              type="button"
              onClick={() => { setTab('console'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                tab === 'console'
                  ? 'bg-cosmic-purple text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <span>{t('auth.consoleTab')}</span>
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
              <span>{t('auth.errors.testCode')} <b className="font-mono text-sm tracking-wider">{simulatedNotice.replace('DEBUG_CODE: ', '')}</b></span>
            </div>
          )}

          {/* TAB 1: OTP */}
          {tab === 'otp' && (
            <div>
              {otpStep === 'target' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      {t('auth.phoneOrEmail')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        placeholder={t('auth.phoneOrEmailPlaceholder')}
                        className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet transition-colors text-left"
                        required
                        autoFocus
                      />
                      <Phone className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? t('auth.sendingOtp') : t('auth.sendOtp')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-text-secondary">{t('auth.sendOtp')}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('target');
                          setOtpCode('');
                          setError(null);
                        }}
                        className="text-xs text-nebula-violet hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{t('auth.changeTarget')}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-xl font-bold px-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Optional New User Registration Toggle */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                      className="text-[11px] text-text-secondary hover:text-nebula-violet transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isRegisterMode ? '− ورود سریع بدون ثبت مشخصات' : '+ ساخت حساب کاربری جدید (اختیاری)'}</span>
                    </button>
                  </div>

                  {isRegisterMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">{t('auth.fullName')}</label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={t('auth.fullNamePlaceholder')}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet placeholder:text-text-muted"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-text-secondary mb-1">{t('auth.username')}</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={t('auth.usernamePlaceholder')}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet placeholder:text-text-muted text-left"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-text-secondary mb-1">{t('auth.password')}</label>
                        <input
                          type="password"
                          dir="ltr"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('auth.passwordPlaceholder')}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet placeholder:text-text-muted text-left"
                        />
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 4}
                    className="w-full py-3 mt-2 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? t('auth.activating') : t('auth.verifyAndLogin')}
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
                  {t('auth.phoneOrEmail')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="drgamer / 0912... / gamer@mail.com"
                    className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet placeholder:text-text-muted text-left"
                    required
                    autoFocus
                  />
                  <User className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-11 pe-11 py-3 rounded-xl bg-[#0d121f] border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet placeholder:text-text-muted text-left"
                    required
                  />
                  <Lock className="absolute start-3.5 top-3.5 w-4 h-4 text-text-muted pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3.5 top-3.5 text-text-muted hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
              >
                {loading ? t('auth.verifying') : t('auth.loginWithPassword')}
              </button>
            </form>
          )}

          {/* TAB 3: Console Quick Auth */}
          {tab === 'console' && (
            <form onSubmit={handleConsoleLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-cosmic-purple/10 border border-cosmic-purple/30 text-xs text-text-secondary">
                {t('auth.consoleHint')}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  {t('auth.consoleLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={7}
                    value={consoleCode}
                    onChange={(e) => setConsoleCode(e.target.value.toUpperCase())}
                    placeholder="7X9K2PL"
                    className="w-full text-center uppercase tracking-widest text-xl font-mono font-bold px-11 py-3 rounded-xl bg-[#0d121f] border border-cosmic-purple/40 text-nebula-violet focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet"
                    required
                    autoFocus
                  />
                  <KeyRound className="absolute start-3.5 top-3.5 w-5 h-5 text-nebula-violet pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50 cursor-pointer"
              >
                {loading ? t('auth.consoleValidating') : t('auth.consoleLoginBtn')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
