'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Eye,
} from 'lucide-react';
import { AnomalyFlagType } from '@/types/referral';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface AdminToastContextValue {
  showToast: (title: string, variant?: ToastVariant, description?: string) => void;
}

const AdminToastContext = createContext<AdminToastContextValue>({
  showToast: () => {},
});

export function useAdminToast() {
  return useContext(AdminToastContext);
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: React.ReactNode; titleColor: string }
> = {
  success: {
    container: 'bg-[#0d1915]/95 border-emerald-500/40 shadow-emerald-950/50',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    titleColor: 'text-emerald-200',
  },
  error: {
    container: 'bg-[#1a0d12]/95 border-rose-500/40 shadow-rose-950/50',
    icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    titleColor: 'text-rose-200',
  },
  warning: {
    container: 'bg-[#1a150b]/95 border-amber-500/40 shadow-amber-950/50',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    titleColor: 'text-amber-200',
  },
  info: {
    container: 'bg-[#0d1520]/95 border-sky-500/40 shadow-sky-950/50',
    icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    titleColor: 'text-sky-200',
  },
};

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, variant: ToastVariant = 'info', description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, title, variant, description }]);
      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  return (
    <AdminToastContext.Provider value={{ showToast }}>
      {children}
      {/* Floating bottom-left stack for RTL layout */}
      <div
        className="fixed bottom-4 left-4 z-[120] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)] pointer-events-none"
        dir="rtl"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const style = VARIANT_STYLES[toast.variant];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className={`pointer-events-auto rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-2.5 ${style.container}`}
              >
                <div className="mt-0.5">{style.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold leading-snug ${style.titleColor}`}>
                    {toast.title}
                  </div>
                  {toast.description && (
                    <div className="text-[11px] text-slate-300/90 mt-1 leading-relaxed">
                      {toast.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
                  aria-label="بستن اعلان"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AdminToastContext.Provider>
  );
}

export function ReadOnlyGuardBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-2.5 text-xs text-amber-300 flex items-center gap-2.5">
      <Eye className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        حساب شما دارای سطح دسترسی <strong>فقط مشاهده (Read-Only)</strong> است. عملیات تغییردهنده (تایید برداشت، تسویه، تایید حساب، بلک‌لیست و اعطای پاداش) غیرفعال هستند.
      </span>
    </div>
  );
}

export const ANOMALY_FLAG_META: Record<
  AnomalyFlagType,
  { label: string; badgeClass: string }
> = {
  blocked_in_chain: {
    label: 'عضو مسدود/روح‌شده',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  hidden_pass_through: {
    label: 'عبور مخفی (Pass-Through)',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  subscription_banned: {
    label: 'تحریم خرید اشتراک',
    badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-500/40',
  },
  many_inactive_downlines: {
    label: 'زیرمجموعه غیرفعال بالا (≥۵)',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  },
  zero_commission_cluster: {
    label: 'شاخه بدون درآمد',
    badgeClass: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/25',
  },
};
