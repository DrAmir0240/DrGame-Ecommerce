'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  HardDrive,
  Database,
  ArrowRight,
  X,
  ShieldAlert,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import { GameDownloadLink } from '@/types/game';

interface DownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: GameDownloadLink | null;
  gameTitle: string;
}

export default function DownloadConfirmModal({
  isOpen,
  onClose,
  link,
  gameTitle,
}: DownloadConfirmModalProps) {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen || !link) return null;

  const fileSize = link.file_size_gb || 0;
  const currentQuota = quota?.remaining_quota_gb || 0;
  const remainingAfter = Math.max(0, currentQuota - fileSize);
  const hasEnoughQuota = currentQuota >= fileSize;

  const toFarsi = (num: number) =>
    Number(num.toFixed(1)).toLocaleString('fa-IR');

  const handleConfirmDownload = async () => {
    setIsProcessing(true);
    try {
      // Trigger native browser download
      const a = document.createElement('a');
      a.href = link.download_url;
      a.download = `${gameTitle}-${link.part_name || 'download'}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadStarted(true);
      // Refresh quota in background
      setTimeout(() => {
        fetchQuota();
      }, 1000);

      setTimeout(() => {
        setDownloadStarted(false);
        onClose();
      }, 2000);
    } catch (e) {
      console.error('Download trigger error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 text-right font-vazir">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0d121f] border border-white/15 p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تایید دانلود و کسر سهمیه</h3>
              <p className="text-xs text-text-muted mt-0.5">{gameTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          /* Not Logged In */
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">ورود به حساب الزامی است</h4>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                برای دانلود با ترافیک نیم‌بهاء و استفاده از سهمیه اشتراک، ابتدا وارد حساب کاربری خود شوید.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                setAuthModalOpen(true, 'otp');
              }}
              className="px-6 py-2.5 rounded-xl bg-cosmic-gradient hover:opacity-95 text-white font-bold text-xs shadow-neon-purple transition-all"
            >
              ورود / ثبت‌نام در دکتر گیم
            </button>
          </div>
        ) : !hasEnoughQuota ? (
          /* Quota Insufficient */
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>سهمیه حجم باقیمانده ناکافی است</span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                حجم فایل انتخابی <span className="font-bold text-white font-roboto">{fileSize} GB</span> است، در حالی که سهمیه باقیمانده شما تنها <span className="font-bold text-white font-roboto">{toFarsi(currentQuota)} GB</span> می‌باشد.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
              >
                بستن
              </button>
              <Link
                href="/subscriptions"
                onClick={onClose}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>ارتقا و خرید حجم دانلود</span>
              </Link>
            </div>
          </div>
        ) : downloadStarted ? (
          /* Success Feedback */
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">دانلود با موفقیت آغاز شد</h4>
            <p className="text-xs text-text-muted">
              در حال انتقال به نرم‌افزار دانلود منیجر...
            </p>
          </div>
        ) : (
          /* Normal Confirmation with Quota Breakdown */
          <div className="space-y-4">
            {/* File Info */}
            <div className="p-3.5 rounded-2xl bg-[#141b2d] border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">نام پارت / فایل:</span>
                <span className="font-bold text-white">{link.part_name || `پارت #${link.part_number}`}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">حجم فایل:</span>
                <span className="font-bold text-amber-400 font-roboto">{fileSize} GB</span>
              </div>
            </div>

            {/* Quota Deduction Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[11px] text-text-muted block">سهمیه فعلی:</span>
                <span className="text-sm font-bold text-white font-roboto">
                  {toFarsi(currentQuota)} GB
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                <span className="text-[11px] text-cyan-300 block">سهمیه پس از کسر:</span>
                <span className="text-sm font-bold text-cyan-400 font-roboto">
                  {toFarsi(remainingAfter)} GB
                </span>
              </div>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-amber-300">توجه:</strong> با تایید و آغاز دانلود، مقدار{' '}
                <span className="font-bold text-white font-roboto" dir="ltr">{fileSize} GB</span> از سهمیه مصرفی اشتراک شما کسر خواهد شد و در تاریخچه دانلودهای شما ثبت می‌گردد.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmDownload}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isProcessing ? 'در حال ثبت...' : 'تایید و شروع دانلود'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
