'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import AvatarPicker from '@/components/profile/AvatarPicker';
import GameCard from '@/components/games/GameCard';
import { GameCardItem } from '@/types/game';
import {
  User,
  Copy,
  Check,
  ShieldCheck,
  KeyRound,
  Share2,
  Sparkles,
  AlertCircle,
  Bookmark,
  Gamepad2,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

function ProfileContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'wishlist' ? 'wishlist' : 'profile';

  const { user, isAuthenticated, fetchCurrentUser, updateUser } = useAuthStore();
  const { t, d } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'wishlist'>(initialTab);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Wishlist state
  const [wishlistGames, setWishlistGames] = useState<GameCardItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Change Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'wishlist' && isAuthenticated) {
      setWishlistLoading(true);
      apiRequest<GameCardItem[]>('/games/wishlist')
        .then((data) => setWishlistGames(data || []))
        .catch((err) => console.error('Failed to load wishlist:', err))
        .finally(() => setWishlistLoading(false));
    }
  }, [activeTab, isAuthenticated]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleUpdateProfile = async (avatarUrl?: string) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload: { full_name?: string; avatar_url?: string } = { full_name: fullName };
      if (avatarUrl) {
        payload.avatar_url = avatarUrl;
      }
      const updated = await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      updateUser(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Update profile error:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwMessage(null);
    try {
      await apiRequest('/users/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPw,
          new_password: newPw,
        }),
      });
      setPwMessage(t('profile.password.success'));
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      setPwError(err.message || t('profile.password.error'));
    }
  };

  if (!user && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <AlertCircle className="w-12 h-12 text-nebula-violet mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">{t('profile.guestTitle')}</h2>
        <p className="text-sm text-text-muted">{t('profile.guestDescription')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-start font-vazir">
      {/* Hero Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 glass-card border border-cosmic-purple/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cosmic-purple/20 blur-3xl -z-10 rounded-full" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-nebula-violet shadow-neon-purple shrink-0">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
              alt={user?.full_name || t('profile.avatarAlt')}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-start space-y-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user?.full_name}</h1>
              <span className="text-sm text-nebula-violet font-roboto">@{user?.username}</span>
            </div>
            <p className="text-xs text-text-secondary">
              {t('profile.memberSince', { date: user?.created_at ? d(user.created_at) : '—' })}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-gradient-to-r from-cosmic-purple to-nebula-violet text-white shadow-neon-purple'
              : 'text-text-muted hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>اطلاعات کاربری و امنیت</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'text-text-muted hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>علاقه‌مندی‌ها (Wishlist)</span>
        </button>
      </div>

      {activeTab === 'wishlist' ? (
        /* Wishlist View */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-cyan-400" />
                <span>بازی‌های ذخیره‌شده در علاقه‌مندی‌ها</span>
              </h2>
              <p className="text-xs text-text-muted mt-1">
                بازی‌هایی که برای دانلود یا بررسی نشان کرده‌اید
              </p>
            </div>
          </div>

          {wishlistLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
              <span className="text-xs text-slate-400">در حال دریافت بازی‌های علاقه‌مندی...</span>
            </div>
          ) : wishlistGames.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#0d121f] border border-white/5 space-y-3">
              <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-white">لیست علاقه‌مندی‌های شما خالی است</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                می‌توانید با کلیک روی آیکون بوکمارک در صفحه هر بازی، آن را به لیست علاقه‌مندی‌های خود اضافه کنید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {wishlistGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Profile & Security Settings View */
        <div className="space-y-8">
          {/* Console Quick Auth & Referral Code Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persistent 7-Digit Console Auth Code */}
            <div className="p-6 rounded-2xl glass-card border border-cosmic-purple/40 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <KeyRound className="w-5 h-5 text-nebula-violet" />
                  <span>{t('profile.consoleCode.title')}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cosmic-purple/20 text-nebula-violet border border-cosmic-purple/30">
                  {t('profile.consoleCode.badge')}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {t('profile.consoleCode.description')}
              </p>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-base border border-cosmic-purple/30">
                <span className="text-2xl font-roboto font-extrabold tracking-widest text-nebula-violet">
                  {user?.console_auth_code || '7X9K2PL'}
                </span>
                <button
                  onClick={() => copyToClipboard(user?.console_auth_code || '7X9K2PL', 'console')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cosmic-purple/20 hover:bg-cosmic-purple/40 text-nebula-violet text-xs font-semibold transition-all cursor-pointer"
                >
                  {copiedCode === 'console' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode === 'console' ? t('profile.copied') : t('profile.copyCode')}</span>
                </button>
              </div>
            </div>

            {/* 8-Digit Referral Code */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <span>{t('profile.referralCode.title')}</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {t('profile.referralCode.badge')}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {t('profile.referralCode.description')}
              </p>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-base border border-white/10">
                <span className="text-2xl font-roboto font-extrabold tracking-widest text-emerald-400">
                  {user?.referral_code || 'REF8X92K'}
                </span>
                <button
                  onClick={() => copyToClipboard(user?.referral_code || 'REF8X92K', 'referral')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  {copiedCode === 'referral' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode === 'referral' ? t('profile.copied') : t('profile.copyCode')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sony Console Avatar Picker */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6">
            <AvatarPicker
              currentAvatarUrl={user?.avatar_url}
              onSelect={(url) => handleUpdateProfile(url)}
            />
          </div>

          {/* Profile Info Form */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white">{t('profile.form.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-2">{t('profile.form.fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-2">{t('profile.form.username')}</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base/50 border border-white/5 text-text-muted text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateProfile()}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white text-sm font-semibold shadow-neon-purple transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? t('profile.form.saving') : t('profile.form.save')}
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> {t('profile.form.saveSuccess')}
                </span>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6">
            <h3 className="text-lg font-bold text-white">{t('profile.password.title')}</h3>
            {pwMessage && <div className="text-xs text-emerald-400">{pwMessage}</div>}
            {pwError && <div className="text-xs text-red-400">{pwError}</div>}
            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-2">{t('profile.password.current')}</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-2">{t('profile.password.new')}</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all cursor-pointer"
                >
                  {t('profile.password.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProfileContent />
    </Suspense>
  );
}
