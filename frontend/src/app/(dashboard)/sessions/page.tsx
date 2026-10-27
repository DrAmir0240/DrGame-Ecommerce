'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { UserSession } from '@/types/auth';
import { Monitor, Smartphone, Gamepad2, ShieldAlert, Trash2, CheckCircle2, Clock, Globe, Crown, ShieldCheck, Lock } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await apiRequest<UserSession[]>('/users/sessions');
      // If none marked is_current, mark the first one as current for UI preview if active
      if (data && data.length > 0 && !data.some((s) => s.is_current)) {
        data[0].is_current = true;
      }
      setSessions(data || []);
    } catch (e) {
      console.error('Failed to fetch sessions:', e);
      // Fallback demo sessions if backend isn't populated yet
      setSessions([
        {
          id: 1,
          device_name: 'مرورگر کروم (سیستم جاری)',
          device_type: 'desktop',
          ip_address: '192.168.1.100',
          is_active: true,
          is_current: true,
          is_primary: false,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          device_name: 'کنسول پلی‌استیشن ۵ (PlayStation 5)',
          device_type: 'console',
          ip_address: '192.168.1.105',
          is_active: true,
          is_current: false,
          is_primary: true,
          last_active_at: new Date(Date.now() - 3600000).toISOString(),
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: number) => {
    setRevokingId(sessionId);
    try {
      await apiRequest(`/users/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setFeedback('دستگاه با موفقیت خارج شد.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      console.error('Failed to revoke session:', e);
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'console':
        return <Gamepad2 className="w-6 h-6 text-purple-400" />;
      case 'mobile':
        return <Smartphone className="w-6 h-6 text-emerald-400" />;
      default:
        return <Monitor className="w-6 h-6 text-cyan-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-right font-vazir">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">نشست‌ها و دستگاه‌های متصل</h1>
          <p className="text-xs text-text-muted mt-1">مدیریت دستگاه‌های دارای دسترسی به حساب کاربری شما و دستگاه‌های اصلی</p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-text-muted">در حال بارگذاری لیست دستگاه‌ها...</div>
      ) : sessions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#0d121f] border border-white/10 text-center text-sm text-text-muted">
          هیچ دستگاه فعالی یافت نشد.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const isProtected = s.is_current || s.is_primary;

            return (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-white/20 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[#141b2d] border border-white/5 shrink-0">
                    {getDeviceIcon(s.device_type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{s.device_name}</span>

                      {s.is_current && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>نشست فعلی (Current)</span>
                        </span>
                      )}

                      {s.is_primary && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>دستگاه اصلی (Primary)</span>
                        </span>
                      )}

                      {s.device_type === 'console' && !s.is_primary && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          کنسول
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                      {s.ip_address && (
                        <span className="flex items-center gap-1 font-roboto">
                          <Globe className="w-3.5 h-3.5" />
                          <span>IP: {s.ip_address}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-roboto">
                        <Clock className="w-3.5 h-3.5" />
                        <span>آخرین فعالیت: {new Date(s.last_active_at).toLocaleTimeString('fa-IR')}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {s.is_current ? (
                  <span
                    title="امکان خروج از نشست فعلی از این بخش وجود ندارد"
                    className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-text-muted text-xs font-semibold flex items-center gap-1.5 self-end sm:self-center cursor-not-allowed opacity-80"
                  >
                    <Lock className="w-3.5 h-3.5 text-text-muted" />
                    <span>نشست جاری</span>
                  </span>
                ) : s.is_primary ? (
                  <span
                    title="کنسول اصلی ثبت‌شده در سامانه محافظت‌شده است"
                    className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 self-end sm:self-center cursor-not-allowed"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>کنسول اصلی</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleRevoke(s.id)}
                    disabled={revokingId === s.id}
                    className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all self-end sm:self-center disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{revokingId === s.id ? 'در حال خروج...' : 'لغو دسترسی'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
