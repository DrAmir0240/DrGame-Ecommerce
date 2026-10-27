'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { User, Copy, Check, ShieldCheck, KeyRound, Share2, Sparkles, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, fetchCurrentUser, updateUser } = useAuthStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setPwMessage('کلمه عبور با موفقیت به‌روزرسانی شد.');
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      setPwError(err.message || 'خطا در تغییر رمز عبور');
    }
  };

  if (!user && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <AlertCircle className="w-12 h-12 text-nebula-violet mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">برای مشاهده نمایه وارد شوید</h2>
        <p className="text-sm text-text-muted">لطفاً از طریق دکمه ورود در بالای صفحه اقدام نمایید.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-right">
      {/* Hero Header */}
      <div className="relative rounded-3xl p-6 sm:p-8 glass-card border border-cosmic-purple/30 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cosmic-purple/20 blur-3xl -z-10 rounded-full" />
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-nebula-violet shadow-neon-purple shrink-0">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
              alt={user?.full_name || 'Gamer'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user?.full_name}</h1>
              <span className="text-sm text-nebula-violet font-roboto">@{user?.username}</span>
            </div>
            <p className="text-xs text-text-secondary">
              عضویت از تاریخ: {user?.created_at ? new Date(user.created_at).toLocaleDateString('fa-IR') : '۱۴۰۵'}
            </p>
          </div>
        </div>
      </div>

      {/* Console Quick Auth & Referral Code Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Persistent 7-Digit Console Auth Code */}
        <div className="p-6 rounded-2xl glass-card border border-cosmic-purple/40 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <KeyRound className="w-5 h-5 text-nebula-violet" />
              <span>کد دائمی ورود سریع کنسول</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cosmic-purple/20 text-nebula-violet border border-cosmic-purple/30">
              ویژه PS4 / PS5
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            با وارد کردن این کد ۷ رقمی در مرورگر کنسول خود، بلافاصله و بدون تایپ رمز طولانی وارد حساب می‌شوید.
          </p>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-base border border-cosmic-purple/30">
            <span className="text-2xl font-roboto font-extrabold tracking-widest text-nebula-violet">
              {user?.console_auth_code || '7X9K2PL'}
            </span>
            <button
              onClick={() => copyToClipboard(user?.console_auth_code || '7X9K2PL', 'console')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cosmic-purple/20 hover:bg-cosmic-purple/40 text-nebula-violet text-xs font-semibold transition-all"
            >
              {copiedCode === 'console' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode === 'console' ? 'کپی شد' : 'کپی کد'}</span>
            </button>
          </div>
        </div>

        {/* 8-Digit Referral Code */}
        <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <span>کد معرف شما (رفرال)</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              درآمد دلاری و ریالی
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            کد اختصاصی معرفی به دوستان؛ به ازای هر خرید زیرمجموعه از ۳ سطح پورسانت خودکار بهره‌مند شوید.
          </p>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-base border border-white/10">
            <span className="text-2xl font-roboto font-extrabold tracking-widest text-emerald-400">
              {user?.referral_code || 'REF8X92K'}
            </span>
            <button
              onClick={() => copyToClipboard(user?.referral_code || 'REF8X92K', 'referral')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all"
            >
              {copiedCode === 'referral' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode === 'referral' ? 'کپی شد' : 'کپی کد'}</span>
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
        <h3 className="text-lg font-bold text-white">ویرایش مشخصات فردی</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-2">نام و نام خانوادگی</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-2">نام کاربری (غیرقابل تغییر)</label>
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
            className="px-6 py-2.5 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white text-sm font-semibold shadow-neon-purple transition-all disabled:opacity-50"
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> اطلاعات با موفقیت به‌روزرسانی شد.
            </span>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="p-6 rounded-2xl glass-card border border-white/10 space-y-6">
        <h3 className="text-lg font-bold text-white">تغییر کلمه عبور</h3>
        {pwMessage && <div className="text-xs text-emerald-400">{pwMessage}</div>}
        {pwError && <div className="text-xs text-red-400">{pwError}</div>}
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-2">کلمه عبور فعلی</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-base border border-white/10 text-white text-sm focus:outline-none focus:border-nebula-violet"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-2">کلمه عبور جدید</label>
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
              className="px-6 py-2.5 rounded-xl bg-surface-card hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all"
            >
              به‌روزرسانی رمز عبور
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
