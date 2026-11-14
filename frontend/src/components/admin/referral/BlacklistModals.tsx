'use client';

import React, { useEffect, useState } from 'react';
import { ShieldBan, ShieldCheck, Loader2, X } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAdminToast } from './AdminToast';

export interface BlacklistTargetUser {
  userId: number;
  username: string;
  fullName?: string;
}

interface BlacklistActionModalProps {
  target: BlacklistTargetUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BlacklistActionModal({
  target,
  onClose,
  onSuccess,
}: BlacklistActionModalProps) {
  const { showToast } = useAdminToast();
  const [blockReferral, setBlockReferral] = useState(true);
  const [blockSubscription, setBlockSubscription] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setBlockReferral(true);
      setBlockSubscription(false);
      setReason('');
    }
  }, [target]);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReferral && !blockSubscription) {
      showToast('حداقل یکی از دو گزینه مسدودیت را انتخاب کنید', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message?: string }>(
        `/admin-referral/users/${target.userId}/blacklist`,
        {
          method: 'POST',
          body: JSON.stringify({
            block_referral: blockReferral,
            block_subscription: blockSubscription,
            reason: reason.trim(),
          }),
        }
      );
      showToast(res?.message || 'کاربر در لیست سیاه ثبت شد', 'success');
      onClose();
      onSuccess();
    } catch (err: any) {
      showToast('خطا در مسدودسازی کاربر', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-[#0c1017] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <ShieldBan className="w-5 h-5" />
              اعمال محدودیت و لیست سیاه
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              کاربر:{' '}
              <strong className="text-white">{target.fullName || target.username}</strong>{' '}
              (<span className="font-mono text-rose-300" dir="ltr">@{target.username}</span>)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-rose-500/30 transition-colors">
            <input
              type="checkbox"
              checked={blockReferral}
              onChange={(e) => setBlockReferral(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-rose-500 rounded"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-bold text-white">
                مسدودیت پورسانت و روح‌شدن (Ghost Mode)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                کاربر در ساختار لایه‌های زنجیره باقی می‌ماند اما سهم پورسانت او در خریدهای زیرمجموعه‌ها مستقیم به{' '}
                <strong className="text-amber-300">صندوق کل پلتفرم</strong> واریز می‌شود تا بالادست‌ها جابجا نشوند.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer hover:border-rose-500/30 transition-colors">
            <input
              type="checkbox"
              checked={blockSubscription}
              onChange={(e) => setBlockSubscription(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-rose-500 rounded"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-bold text-white">
                لغو اشتراک فعلی و ممنوعیت خرید (Subscription Ban)
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                اشتراک‌های فعال کاربر فوراً باطل شده، سهمیه دانلود او قفل می‌شود و ثبت‌نام مجدد با کدملی/نام او مسدود می‌گردد.
              </p>
            </div>
          </label>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              علت مسدودسازی (ثبت در گزارش ممیزی)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="مثال: ساخت زنجیره سوری برای سوءاستفاده از پورسانت لایه‌ای..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-1.5 disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              ثبت در لیست سیاه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface UnblockConfirmModalProps {
  target: BlacklistTargetUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function UnblockConfirmModal({
  target,
  onClose,
  onSuccess,
}: UnblockConfirmModalProps) {
  const { showToast } = useAdminToast();
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleUnblock = async () => {
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message?: string }>(
        `/admin-referral/users/${target.userId}/blacklist`,
        { method: 'DELETE' }
      );
      showToast(res?.message || 'کاربر با موفقیت رفع مسدودیت شد', 'success');
      onClose();
      onSuccess();
    } catch (err: any) {
      showToast('خطا در رفع مسدودیت', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-[#0c1017] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            رفع مسدودیت و خروج از لیست سیاه
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          آیا مطمئن هستید که کاربر{' '}
          <strong className="text-white">{target.fullName || target.username}</strong> (
          <span className="font-mono text-emerald-300" dir="ltr">@{target.username}</span>) از لیست سیاه خارج شود؟ حالت روح رفرال و تحریم اشتراک او برداشته خواهد شد.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleUnblock}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center gap-1.5 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            بله، رفع مسدودیت شود
          </button>
        </div>
      </div>
    </div>
  );
}
