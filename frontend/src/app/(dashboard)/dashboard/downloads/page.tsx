'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  HardDrive,
  Calendar,
  CheckCircle2,
  Database,
  Sparkles,
  Gamepad2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import { apiRequest } from '@/lib/apiClient';

interface DownloadHistoryItem {
  id: number;
  game_id: number;
  game_title: string;
  game_title_en: string;
  cover_url?: string | null;
  file_id: number;
  file_type: string;
  part_name: string;
  file_title: string;
  file_size_gb: number;
  downloaded_at: string;
  status: string;
}

export default function MyDownloadsPage() {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuota();
      setIsLoading(true);
      setError(null);
      apiRequest<DownloadHistoryItem[]>('/users/me/downloads')
        .then((data) => setHistory(data || []))
        .catch((err) => {
          console.error('Failed to load downloads history:', err);
          setError('خطا در دریافت تاریخچه دانلودها از سرور.');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  const toFarsi = (num: number) =>
    Number((num || 0).toFixed(1)).toLocaleString('fa-IR');

  const totalConsumedGb = history.reduce((sum, item) => sum + (item.file_size_gb || 0), 0);

  const getFileTypeBadge = (type: string) => {
    switch (type) {
      case 'cheat':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">چیت و ترینر</span>;
      case 'dlc':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">بسته الحاقی (DLC)</span>;
      case 'subtitle':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">زیرنویس فارسی</span>;
      case 'dubbing':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">دوبله اختصاصی</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">دیتای رسمی بازی</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-vazir text-right">
      
      {!isAuthenticated && (
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>برای مشاهده سوابق اختصاصی دانلود و مصرف سهمیه اکانت خود، لطفاً وارد شوید.</span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true, 'otp')}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shrink-0 shadow-lg shadow-cyan-500/20"
          >
            ورود به حساب کاربری
          </button>
        </div>
      )}
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>سوابق دریافت فایل و مصرف سهمیه ترافیک</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            دانلودهای من
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            آرشیو ثبت‌شده از دیتای بازی‌ها، پچ‌ها و فایل‌های دریافت شده در اشتراک فعلی شما
          </p>
        </div>

        <Link
          href="/games"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-bold transition-all shrink-0"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>کاتالوگ بازی‌ها</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>تعداد کل دانلودها</span>
            <Download className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-roboto pt-2">
            {toFarsi(history.length)} <span className="text-xs font-vazir text-slate-400">فایل</span>
          </div>
        </div>

        {/* Consumed GB */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مجموع حجم مصرفی</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-roboto pt-2">
            {toFarsi(totalConsumedGb)} <span className="text-xs font-vazir text-slate-400">گیگابایت</span>
          </div>
        </div>

        {/* Remaining Quota */}
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>سهمیه باقیمانده اشتراک</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-roboto pt-2">
            {toFarsi(quota?.remaining_quota_gb || 0)} <span className="text-xs font-vazir text-slate-400">گیگابایت</span>
          </div>
        </div>
      </div>

      {/* Download History Table / Cards */}
      <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تاریخچه فایل‌های دریافت شده</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            نمایش {toFarsi(history.length)} رکورد
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت تاریخچه دانلودها...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Download className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-white">هنوز فایلی دانلود نکرده‌اید</h4>
            <p className="text-xs text-slate-400">
              برای دانلود بازی‌ها به صفحه کاتالوگ مراجعه فرمایید.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#141b2d] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-white/15"
              >
                {/* Game & File Info */}
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.game_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                        <Gamepad2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/games/${item.game_id}`}
                        className="text-sm font-bold text-white hover:text-cyan-400 transition-colors"
                      >
                        {item.game_title}
                      </Link>
                      {getFileTypeBadge(item.file_type)}
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {item.part_name || item.file_title}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 font-roboto">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{item.file_size_gb} GB</span>
                      </span>
                      <span className="flex items-center gap-1 font-roboto text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(item.downloaded_at)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge (NO RE-DOWNLOAD BUTTON AS REQUESTED) */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ثبت در سوابق مصرفی</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
