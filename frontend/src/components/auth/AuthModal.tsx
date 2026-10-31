'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, KeyRound, Phone, Lock, User, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      setError(t('auth.errors.phoneRequired'));
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
      setError(err.message || t('auth.errors.otpSend'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !fullName || !username || !password) {
      setError(t('auth.errors.requiredFields'));
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
      setAuthModalOpen(false);
      resetForms();
    } catch (err: any) {
      setError(err.message || t('auth.errors.register'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      setError(t('auth.errors.credentials'));
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
    if (!consoleCode) {
      setError(t('auth.errors.consoleCode'));
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
          className="relative w-full max-w-md rounded-2xl glass-card border border-cosmic-purple/40 p-6 shadow-2xl overflow-hidden"
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
              <h2 className="text-xl font-bold text-white">{t('auth.loginToDrGame')}</h2>
              <p className="text-xs text-text-muted">{t('auth.loginSubtitle')}</p>
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
              {t('auth.otpTab')}
            </button>
            <button
              onClick={() => { setTab('password'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                tab === 'password'
                  ? 'bg-nebula-violet text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {t('auth.passwordTab')}
            </button>
            <button
              onClick={() => { setTab('console'); resetForms(); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
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
              <span>{t('auth.errors.testCode')} <b>{simulatedNotice.replace('DEBUG_CODE: ', '')}</b></span>
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
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        placeholder={t('auth.phoneOrEmailPlaceholder')}
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
                    {loading ? t('auth.sendingOtp') : t('auth.sendOtp')}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterOtp} className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-text-secondary">{t('auth.sendOtp')}</label>
                      <button
                        type="button"
                        onClick={() => setOtpStep('target')}
                        className="text-xs text-nebula-violet hover:underline flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>{t('auth.changeTarget')}</span>
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
                    <label className="block text-xs text-text-secondary mb-1">{t('auth.fullName')}</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('auth.fullNamePlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">{t('auth.username')}</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('auth.usernamePlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">{t('auth.password')}</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 mt-2 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-medium text-sm transition-all shadow-neon-purple disabled:opacity-50"
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
                  {t('auth.password')}
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
                {loading ? t('auth.consoleValidating') : t('auth.consoleLoginBtn')}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
