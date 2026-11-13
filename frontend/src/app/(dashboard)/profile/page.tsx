'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import AvatarPicker from '@/components/profile/AvatarPicker';
import ConsolePairWidget from '@/components/profile/ConsolePairWidget';
import GameCard from '@/components/games/GameCard';
import { GameCardItem } from '@/types/game';
import { MySubscriptionStatus } from '@/types/subscription';
import {
  User,
  Copy,
  Check,
  ShieldCheck,
  Share2,
  Sparkles,
  AlertCircle,
  Bookmark,
  Gamepad2,
  Loader2,
  Laptop,
  ArrowLeft,
  Crown,
  HardDrive,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Zap,
  Search,
  Trash2,
  ExternalLink,
  Info,
  Clock,
  ArrowUpRight,
  Tv,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

type ProfileTab = 'overview' | 'info' | 'console' | 'wishlist' | 'security' | 'referral';

function getPasswordStrength(pw: string): { percent: number; label: string; color: string } {
  if (!pw) return { percent: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { percent: 25, label: 'ضعیف', color: 'bg-rose-500 text-rose-400' };
  if (score === 2) return { percent: 50, label: 'متوسط', color: 'bg-amber-500 text-amber-400' };
  if (score === 3) return { percent: 75, label: 'مناسب', color: 'bg-blue-500 text-blue-400' };
  return { percent: 100, label: 'بسیار قوی و ایمن', color: 'bg-emerald-500 text-emerald-400' };
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as ProfileTab | null;

  const validTabs: ProfileTab[] = ['overview', 'info', 'console', 'wishlist', 'security', 'referral'];
  const initialTab: ProfileTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'overview';

  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, fetchCurrentUser, updateUser } = useAuthStore();
  const { t, d, n, size } = useTranslation();

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Edit Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subscription Quota State
  const [subStatus, setSubStatus] = useState<MySubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  // Wishlist State
  const [wishlistGames, setWishlistGames] = useState<GameCardItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Change Password State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
  }, [user]);

  // Load subscription status
  useEffect(() => {
    if (isAuthenticated) {
      setSubLoading(true);
      apiRequest<MySubscriptionStatus>('/subscriptions/my-status')
        .then((data) => setSubStatus(data))
        .catch(() => setSubStatus(null))
        .finally(() => setSubLoading(false));
    }
  }, [isAuthenticated]);

  // Load wishlist games
  useEffect(() => {
    if (isAuthenticated) {
      setWishlistLoading(true);
      apiRequest<GameCardItem[]>('/games/wishlist')
        .then((data) => setWishlistGames(data || []))
        .catch((err) => console.error('Failed to load wishlist:', err))
        .finally(() => setWishlistLoading(false));
    }
  }, [isAuthenticated]);

  // Sync tab with URL if changed
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleUpdateProfile = async (avatarUrl?: string) => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload: { full_name?: string; avatar_url?: string } = { full_name: fullName.trim() };
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

    if (newPw !== confirmPw) {
      setPwError('تکرار کلمه عبور با کلمه عبور جدید مطابقت ندارد.');
      return;
    }

    if (newPw.length < 6) {
      setPwError('کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setPwLoading(true);
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
      setConfirmPw('');
    } catch (err: any) {
      setPwError(err.message || t('profile.password.error'));
    } finally {
      setPwLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (gameId: number) => {
    setRemovingId(gameId);
    try {
      await apiRequest(`/games/${gameId}/wishlist`, { method: 'POST' });
      setWishlistGames((prev) => prev.filter((g) => g.id !== gameId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredWishlist = useMemo(() => {
    if (!wishlistSearch.trim()) return wishlistGames;
    const q = wishlistSearch.toLowerCase().trim();
    return wishlistGames.filter(
      (g) =>
        (g.title_fa && g.title_fa.toLowerCase().includes(q)) ||
        (g.title_en && g.title_en.toLowerCase().includes(q))
    );
  }, [wishlistGames, wishlistSearch]);

  const pwStrength = useMemo(() => getPasswordStrength(newPw), [newPw]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <Loader2 className="w-8 h-8 text-nebula-violet animate-spin" />
      </div>
    );
  }

  if (!user && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-cosmic-purple/15 border border-cosmic-purple/30 flex items-center justify-center text-nebula-violet mb-4 shadow-neon-purple">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">{t('profile.guestTitle')}</h2>
        <p className="text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
          {t('profile.guestDescription')}
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-cosmic-gradient text-white text-sm font-bold shadow-neon-purple hover:opacity-90 transition-all"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  // Quota percentage calculations
  const totalQuota = subStatus?.quota?.total_quota_gb || 0;
  const usedQuota = subStatus?.quota?.used_quota_gb || 0;
  const remainingQuota = subStatus?.quota?.remaining_quota_gb || 0;
  const quotaPercent = totalQuota > 0 ? Math.min(100, Math.round((usedQuota / totalQuota) * 100)) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 text-start font-vazir">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* AAA Gamer Hero Banner Header                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#121829] via-[#0d1220] to-[#070a13] border border-white/10 overflow-hidden shadow-2xl">
        {/* Ambient Cosmic Purple & Cyan Halos */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cosmic-purple/25 blur-3xl -z-0 rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/15 blur-3xl -z-0 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar and Basic User Meta */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-start">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-nebula-violet/80 p-0.5 bg-black/50 shadow-neon-purple">
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.full_name || t('profile.avatarAlt')}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="absolute -bottom-2 -left-2 p-1.5 rounded-xl bg-cosmic-purple text-white shadow-lg hover:bg-nebula-violet transition-colors cursor-pointer border border-white/20"
                title="تغییر آواتار سونی"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user?.full_name || 'کاربر گرامی'}
                </h1>
                {user?.is_verified && (
                  <span
                    className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    title="حساب تایید شده دکتر گیم"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>تایید هویت</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-roboto">
                <span className="text-nebula-violet font-semibold">@{user?.username}</span>
                {user?.phone && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{user.phone}</span>
                  </>
                )}
              </div>

              <p className="text-xs text-text-muted flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('profile.memberSince', { date: user?.created_at ? d(user.created_at) : '—' })}</span>
              </p>
            </div>
          </div>

          {/* Quick Subscription / Quota Highlight Card */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 min-w-[240px]">
            {subStatus?.has_active_subscription ? (
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 backdrop-blur-md space-y-2 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>{subStatus.tier?.name_fa || 'اشتراک ویژه فعال'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    فعال ✔
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>ترافیک باقی‌مانده:</span>
                    <span className="text-white font-bold">{size(remainingQuota)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(quotaPercent, 4)}%` }}
                    />
                  </div>
                </div>

                {subStatus.end_date && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                    <span>انقضا:</span>
                    <span className="font-mono text-slate-300">{d(subStatus.end_date)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-black/40 border border-cosmic-purple/30 backdrop-blur-md space-y-2.5 shadow-lg text-center sm:text-start">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-cosmic-purple" />
                    <span>کاربر عادی (بدون اشتراک)</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  با تهیه اشتراک حجمی، ترافیک پرسرعت نیم‌بهاء برای دانلود دیتای کنسول دریافت کنید.
                </p>
                <Link
                  href="/subscriptions"
                  className="block w-full py-2 rounded-xl bg-gradient-to-r from-cosmic-purple to-nebula-violet hover:opacity-95 text-white text-xs font-black text-center shadow-neon-purple transition-all"
                >
                  مشاهده پلن‌های اشتراک
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-pink-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-slate-400 block text-[10px]">علاقه‌مندی‌ها</span>
              <span className="font-bold text-white font-mono">{n(wishlistGames.length)} بازی</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-slate-400 block text-[10px]">سهمیه ترافیک</span>
              <span className="font-bold text-white font-mono">
                {totalQuota > 0 ? size(remainingQuota) : '—'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-slate-400 block text-[10px]">کد معرف شما</span>
              <span className="font-bold text-emerald-400 font-mono tracking-wider">
                {user?.referral_code || 'REF8X92K'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
            <Tv className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-slate-400 block text-[10px]">ورود به کنسول</span>
              <span className="font-bold text-white font-mono">
                {user?.console_auth_code ? 'کد آماده' : 'سریع'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Modern Segmented Navigation Tabs                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0d1220] border border-white/10 overflow-x-auto scrollbar-none shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-cosmic-purple to-nebula-violet text-white shadow-neon-purple'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>داشبورد و سهمیه</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'info'
              ? 'bg-gradient-to-r from-cosmic-purple to-nebula-violet text-white shadow-neon-purple'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4" />
          <span>مشخصات و آواتار</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>علاقه‌مندی‌ها</span>
          {wishlistGames.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono font-black">
              {n(wishlistGames.length)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'console'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>اتصال کنسول PS4/PS5</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg shadow-amber-500/25'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>امنیت و رمز عبور</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'referral'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>معرف و درآمد</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Tab 1: Overview & Subscription Quota Dashboard                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Quota & Traffic Consumption Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1423] border border-white/10 space-y-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-cyan-400" />
                  <span>وضعیت سهمیه ترافیک و اشتراک کنسول</span>
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  میزان ترافیک پرسرعت مصرف‌شده و حجم آزاد اکانت شما برای دانلود فایل‌های بازی
                </p>
              </div>

              <Link
                href="/subscriptions"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-purple to-nebula-violet hover:opacity-95 text-white text-xs font-black shadow-neon-purple transition-all"
              >
                <span>خرید یا تمدید اشتراک</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quota Progress Bar Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">درصد ترافیک مصرف شده</span>
                <span className="font-mono font-black text-cyan-400 text-sm">{quotaPercent}%</span>
              </div>
              <div className="w-full bg-black/60 border border-white/10 rounded-full h-4 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(quotaPercent, 2)}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block">حجم کل اشتراک</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {totalQuota > 0 ? size(totalQuota) : '۰ GB'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block">ترافیک مصرف‌شده</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {size(usedQuota)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] text-emerald-300 block">سهمیه باقیمانده</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {size(remainingQuota)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/downloads"
              className="p-5 rounded-2xl bg-[#0f1423] border border-white/10 hover:border-cyan-500/40 transition-all hover:-translate-y-1 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    دانلودهای من
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    مشاهده لیست فایل‌ها، لینک‌های مستقیم و سابقه دریافت دیتا
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-cyan-400 font-semibold mt-4">
                <span>مشاهده آرشیو</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/gamepad"
              className="p-5 rounded-2xl bg-[#0f1423] border border-white/10 hover:border-purple-500/40 transition-all hover:-translate-y-1 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                    تست دسته DualSense
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    بررسی لرزش هپتیک، دریفت آنالوگ، ژیروسکوپ و میکروفون با مدل سه‌بعدی
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-semibold mt-4">
                <span>اجرای تست دسته</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/tools/jailbreak"
              className="p-5 rounded-2xl bg-[#0f1423] border border-white/10 hover:border-amber-500/40 transition-all hover:-translate-y-1 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    ابزارهای جیلبریک
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    سرور DNS اختصاصی، پیلودهای GoldHEN و راهنمای فریمورها
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-amber-400 font-semibold mt-4">
                <span>مشاهده ابزارها</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/dashboard/tickets"
              className="p-5 rounded-2xl bg-[#0f1423] border border-white/10 hover:border-emerald-500/40 transition-all hover:-translate-y-1 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    پشتیبانی و تیکت‌ها
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    پاسخگویی فنی ۲۴ ساعته در ۷ روز هفته برای حل مشکلات دانلود
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-emerald-400 font-semibold mt-4">
                <span>ارسال تیکت</span>
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Tab 2: Personal Info & Sony Avatars                                */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sony Console Avatar Picker */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1423] border border-white/10 space-y-6 shadow-xl">
            <AvatarPicker
              currentAvatarUrl={user?.avatar_url}
              onSelect={(url) => handleUpdateProfile(url)}
            />
          </div>

          {/* Profile Details Form */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1423] border border-white/10 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-nebula-violet" />
                <span>اطلاعات فردی و تماس</span>
              </h3>
              <span className="text-xs text-text-muted font-mono">شناسه کاربر: #{user?.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {t('profile.form.fullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام کامل خود را وارد کنید"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-nebula-violet transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {t('profile.form.username')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/5 text-slate-400 text-sm cursor-not-allowed font-roboto"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  شماره موبایل ثبت‌شده
                </label>
                <input
                  type="text"
                  value={user?.phone || 'ثبت نشده'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/5 text-slate-400 text-sm cursor-not-allowed font-roboto"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  پست الکترونیکی (ایمیل)
                </label>
                <input
                  type="text"
                  value={user?.email || 'ثبت نشده'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/5 text-slate-400 text-sm cursor-not-allowed font-roboto"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleUpdateProfile()}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cosmic-purple to-nebula-violet hover:opacity-90 text-white text-sm font-bold shadow-neon-purple transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('profile.form.saving')}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t('profile.form.save')}</span>
                  </>
                )}
              </button>

              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('profile.form.saveSuccess')}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Tab 3: Console Sync & PlayStation Pairing                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'console' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* PlayStation Console Pair Live Widget */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1423] border border-cyan-500/30 space-y-6 shadow-xl relative overflow-hidden">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                <span>اتصال کنسول و همگام‌سازی لحظه‌ای (Console Pairing)</span>
              </h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                با اتصال کنسول به حساب کاربری، دیتای بازی‌ها و سوابق شما با مرورگر اختصاصی کنسول سوییچ و پلی‌استیشن هماهنگ می‌شود.
              </p>
            </div>

            {/* Embedded Live Console Pairing Widget */}
            <div className="max-w-md mx-auto">
              <ConsolePairWidget />
            </div>

            {/* Step-by-Step Instructions */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-slate-300">راهنمای اتصال ۳ مرحله‌ای در کنسول:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono">
                    ۱
                  </span>
                  <span className="font-bold text-white block">باز کردن مرورگر کنسول</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    در کنسول PS4 یا PS5 خود وارد مرورگر شوید یا از طریق DNS اختصاصی وارد هاست شوید.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono">
                    ۲
                  </span>
                  <span className="font-bold text-white block">وارد کردن کد تایید</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    کد ۷ رقمی موقت را در صفحه ورود کنسول تایپ کنید تا بدون وارد کردن رمز متصل شوید.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold font-mono">
                    ۳
                  </span>
                  <span className="font-bold text-white block">دانلود مستقیم به کنسول</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    لینک‌های دیتای بازی مستقیماً برای پکیج اینستالر (Package Installer) ارسال می‌شوند.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Tab 4: Wishlist (Games Saved for Later)                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-pink-400" />
                <span>بازی‌های نشان‌شده در علاقه‌مندی‌ها ({n(wishlistGames.length)} مورد)</span>
              </h2>
              <p className="text-xs text-text-muted mt-1">
                عناوینی که برای دانلود بعدی یا بررسی ذخیره کرده‌اید
              </p>
            </div>

            {/* Quick search inside wishlist */}
            {wishlistGames.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={wishlistSearch}
                  onChange={(e) => setWishlistSearch(e.target.value)}
                  placeholder="جستجو در علاقه‌مندی‌ها..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            )}
          </div>

          {wishlistLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto" />
              <span className="text-xs text-slate-400 block">در حال بارگذاری لیست علاقه‌مندی‌ها...</span>
            </div>
          ) : wishlistGames.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[#0f1423] border border-white/5 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
                <Bookmark className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">لیست علاقه‌مندی‌های شما خالی است</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                  می‌توانید با کلیک روی آیکون بوکمارک در کارت هر بازی، آن را به لیست علاقه‌مندی‌های خود اضافه کنید.
                </p>
              </div>
              <Link
                href="/games"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-pink-600/25"
              >
                <span>مشاهده کاتالوگ بازی‌ها</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : filteredWishlist.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 rounded-2xl bg-white/[0.02] border border-white/5">
              موردی مطابق با جستجوی «{wishlistSearch}» در علاقه‌مندی‌ها یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredWishlist.map((game) => (
                <div key={game.id} className="relative group">
                  <GameCard game={game} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFromWishlist(game.id);
                    }}
                    disabled={removingId === game.id}
                    className="absolute top-2 left-2 z-20 p-2 rounded-xl bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
                    title="حذف از علاقه‌مندی‌ها"
                  >
                    {removingId === game.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Tab 5: Security, Password & Active Sessions                        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Sessions Overview Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1423] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Laptop className="w-5 h-5 text-amber-400" />
                <span>امنیت حساب و نشست‌های فعال</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                محافظت سشن
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              کنترل نشست‌های همزمان روی مرورگر، موبایل و کنسول‌های PS4/PS5 و لغو دسترسی‌های مشکوک.
            </p>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-white block">نشست جاری: دستگاه تایید شده</span>
                  <span className="text-[11px] text-text-muted">آخرین فعالیت همین لحظه</span>
                </div>
              </div>
              <Link
                href="/sessions"
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <span>مدیریت همه نشست‌ها</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#0f1423] border border-white/10 space-y-6 shadow-xl">
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>{t('profile.password.title')}</span>
              </h3>
              <p className="text-xs text-text-muted mt-1">
                برای حفظ امنیت حساب، کلمه عبوری با ترکیب حروف بزرگ، کوچک، اعداد و نمادها انتخاب کنید.
              </p>
            </div>

            {pwMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwMessage}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('profile.password.current')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('profile.password.new')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-500 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    تکرار کلمه عبور جدید
                  </label>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  />
                </div>
              </div>

              {/* Password Strength Indicator */}
              {newPw && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">قدرت کلمه عبور:</span>
                    <span className={`font-bold ${pwStrength.color.split(' ')[1]}`}>
                      {pwStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${pwStrength.color.split(' ')[0]}`}
                      style={{ width: `${pwStrength.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-black transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  {pwLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال به‌روزرسانی...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t('profile.password.submit')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Tab 6: Referral, Commission & Earnings Dashboard                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'referral' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#0c1f1a] to-[#091512] border border-emerald-500/30 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <span>{t('profile.referralCode.title')}</span>
                </h2>
                <p className="text-xs text-emerald-300/80 mt-1">
                  {t('profile.referralCode.description')}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold self-start sm:self-auto">
                {t('profile.referralCode.badge')}
              </span>
            </div>

            {/* Referral Code Big Box */}
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-start space-y-0.5">
                <span className="text-[11px] text-slate-400 block">کد اختصاصی معرفی شما:</span>
                <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-emerald-400 select-all" dir="ltr">
                  {user?.referral_code || 'REF8X92K'}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => copyToClipboard(user?.referral_code || 'REF8X92K', 'code')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  {copiedCode === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode === 'code' ? 'کپی شد ✔' : 'کپی کد معرف'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${typeof window !== 'undefined' ? window.location.origin : 'https://drgame.ir'}?ref=${user?.referral_code || 'REF8X92K'}`,
                      'link'
                    )
                  }
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedCode === 'link' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedCode === 'link' ? 'لینک کپی شد' : 'کپی لینک مستقیم'}</span>
                </button>
              </div>
            </div>

            {/* 4-Tier Commission Explanation */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300">پلن کمیسیون چندسطحی هوشمند:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] text-slate-400 block">سطح ۱ (مستقیم)</span>
                  <span className="text-base font-black text-emerald-400 font-mono">۱۰٪</span>
                  <span className="text-[9px] text-slate-500 block">از تمام خریدها</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] text-slate-400 block">سطح ۲</span>
                  <span className="text-base font-black text-emerald-400 font-mono">۵٪</span>
                  <span className="text-[9px] text-slate-500 block">معرف‌های رده دوم</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] text-slate-400 block">سطح ۳</span>
                  <span className="text-base font-black text-emerald-400 font-mono">۲.۵٪</span>
                  <span className="text-[9px] text-slate-500 block">معرف‌های رده سوم</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] text-slate-400 block">سطح ۴</span>
                  <span className="text-base font-black text-emerald-400 font-mono">۱٪</span>
                  <span className="text-[9px] text-slate-500 block">شبکه معرف‌ها</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                تسویه خودکار درگاه‌های ریالی (پایا/ساتنا) و تتر (USDT TRC20)
              </span>
              <Link
                href="/referral"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <span>ورود به داشبورد درآمد و تسویه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
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
