'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  GitFork,
  Wallet,
  Landmark,
  ShoppingBag,
  ShieldBan,
  ShieldCheck,
  EyeOff,
  Eye,
  Zap,
  AlertTriangle,
  Loader2,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n';
import { AdminTreeResponse } from '@/types/referral';
import CopyableValue from './CopyableValue';
import { ANOMALY_FLAG_META, useAdminToast } from './AdminToast';
import {
  BlacklistActionModal,
  BlacklistTargetUser,
  UnblockConfirmModal,
} from './BlacklistModals';

interface NodeInspectorDrawerProps {
  userId: number | null;
  isReadOnly: boolean;
  onClose: () => void;
  onFocusInTree: (userId: number) => void;
  onTraceOrder: (orderPaymentId: number) => void;
  onMutated: () => void;
}

export default function NodeInspectorDrawer({
  userId,
  isReadOnly,
  onClose,
  onFocusInTree,
  onTraceOrder,
  onMutated,
}: NodeInspectorDrawerProps) {
  const { price, n, locale } = useTranslation();
  const { showToast } = useAdminToast();
  const [data, setData] = useState<AdminTreeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Action modals
  const [blacklistTarget, setBlacklistTarget] = useState<BlacklistTargetUser | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<BlacklistTargetUser | null>(null);
  const [hiddenConfirmOpen, setHiddenConfirmOpen] = useState(false);
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadInspector = async (uid: number) => {
    setLoading(true);
    try {
      const res = await apiRequest<AdminTreeResponse>(`/admin-referral/tree/${uid}`);
      setData(res);
    } catch (err: any) {
      showToast('خطا در دریافت اطلاعات بازرسی کاربر', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadInspector(userId);
    } else {
      setData(null);
    }
  }, [userId]);

  const handleToggleHidden = async () => {
    if (!data) return;
    setSubmitting(true);
    const nextHidden = !data.user.is_referral_hidden;
    try {
      await apiRequest(`/admin-referral/users/${data.user.id}/hidden-status`, {
        method: 'PUT',
        body: JSON.stringify({ is_referral_hidden: nextHidden }),
      });
      showToast(
        nextHidden
          ? 'کاربر با موفقیت مخفی (Pass-Through) شد'
          : 'کاربر به چرخه عادی آبشار بازگردانده شد',
        'success'
      );
      setHiddenConfirmOpen(false);
      await loadInspector(data.user.id);
      onMutated();
    } catch (err: any) {
      showToast('خطا در تغییر وضعیت پنهان‌سازی', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleasePending = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const res = await apiRequest<{ settled_amount_toman: number; message?: string }>(
        `/admin-referral/settlement/release-user/${data.user.id}`,
        { method: 'POST' }
      );
      showToast(
        res?.message || 'پورسانت‌های معوقه کاربر آزادسازی شد',
        'success',
        `مبلغ آزادشده: ${price(res?.settled_amount_toman || 0)}`
      );
      setReleaseConfirmOpen(false);
      await loadInspector(data.user.id);
      onMutated();
    } catch (err: any) {
      showToast('خطا در رفع تعویق پورسانت', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMutationSuccess = async () => {
    if (userId) {
      await loadInspector(userId);
    }
    onMutated();
  };

  return (
    <>
      <AnimatePresence>
        {userId !== null && (
          <div className="fixed inset-0 z-[105] flex justify-end" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-[#0c1017] border-r border-slate-800 h-full flex flex-col shadow-2xl mr-auto"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-[#090d13]">
                <div className="min-w-0">
                  <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    بازرس دقیق گره شبکه
                  </div>
                  <div className="text-sm font-extrabold text-white truncate mt-0.5">
                    {data ? data.user.full_name || data.user.username : 'در حال بارگذاری...'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
                  aria-label="بستن کشو"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {loading && !data ? (
                  <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-400" />
                    در حال بارگذاری پرونده کاربر...
                  </div>
                ) : data ? (
                  <>
                    {/* Identity Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {data.user.full_name || 'بدون نام'}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                            <span className="font-mono text-rose-300" dir="ltr">
                              @{data.user.username}
                            </span>
                            <span>·</span>
                            <span className="font-mono" dir="ltr">
                              #{data.user.id}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onFocusInTree(data.user.id);
                            onClose();
                          }}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow"
                        >
                          <GitFork className="w-3.5 h-3.5" />
                          محور درخت شود
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                        <div>
                          <div className="text-[10px] text-slate-500 mb-0.5">موبایل</div>
                          <CopyableValue value={data.user.phone} maxWidthClass="max-w-[140px]" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 mb-0.5">کد معرفی</div>
                          <CopyableValue value={data.user.referral_code} maxWidthClass="max-w-[120px]" />
                        </div>
                      </div>

                      {/* Status & Anomaly Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                            data.user.has_active_subscription
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {data.user.has_active_subscription ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {data.user.has_active_subscription ? 'اشتراک فعال دارد' : 'بدون اشتراک فعال'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {n(data.user.direct_children_count)} مستقیم / {n(data.user.total_subtree_count)} کل زیرشاخه
                        </span>
                        {data.user.anomaly_flags.map((flag) => {
                          const meta = ANOMALY_FLAG_META[flag];
                          if (!meta) return null;
                          return (
                            <span
                              key={flag}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {meta.label}
                            </span>
                          );
                        })}
                      </div>

                      {data.active_blacklist && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-rose-300">
                            <ShieldBan className="w-3.5 h-3.5" />
                            این کاربر در لیست سیاه فعال قرار دارد
                          </div>
                          <div>علت: {data.active_blacklist.reason || 'ثبت بدون شرح'}</div>
                        </div>
                      )}
                    </div>

                    {/* Wallet Section */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                        کیف پول و پورسانت‌ها
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="text-[10px] text-amber-300">معوقه (در انتظار)</div>
                          <div className="text-xs font-bold text-white tabular-nums mt-1">
                            {price(data.wallet.pending_balance_toman)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="text-[10px] text-emerald-300">قابل برداشت</div>
                          <div className="text-xs font-bold text-white tabular-nums mt-1">
                            {price(data.wallet.withdrawable_balance_toman)}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70">
                          <div className="text-[10px] text-slate-400">مجموع کسب‌شده</div>
                          <div className="text-xs font-bold text-white tabular-nums mt-1">
                            {price(data.wallet.total_earned_toman)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Control Actions */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-200">
                        اقدامات مستقیم کنترلی
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {data.user.is_referral_blocked || data.active_blacklist ? (
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() =>
                              setUnblockTarget({
                                userId: data.user.id,
                                username: data.user.username,
                                fullName: data.user.full_name,
                              })
                            }
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            خروج از لیست سیاه و رفع روح‌شدگی
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() =>
                              setBlacklistTarget({
                                userId: data.user.id,
                                username: data.user.username,
                                fullName: data.user.full_name,
                              })
                            }
                            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShieldBan className="w-4 h-4" />
                            مسدودسازی / روح‌کردن کاربر
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => setHiddenConfirmOpen(true)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                            data.user.is_referral_hidden
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 hover:bg-amber-500/25'
                              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          {data.user.is_referral_hidden ? (
                            <>
                              <Eye className="w-4 h-4" />
                              حذف حالت مخفی (بازگشت به لایه‌ها)
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              پنهان‌سازی در آبشار (Pass-Through)
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isReadOnly || data.wallet.pending_balance_toman <= 0}
                          onClick={() => setReleaseConfirmOpen(true)}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Zap className="w-4 h-4" />
                          رفع تعویق آنی پورسانت معوق ({price(data.wallet.pending_balance_toman)})
                        </button>
                      </div>
                    </div>

                    {/* Settlement Accounts */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-sky-400" />
                        حساب‌های تسویه ثبت‌شده ({n(data.settlement_accounts.length)})
                      </h4>
                      {data.settlement_accounts.length === 0 ? (
                        <div className="text-[11px] text-slate-500 py-2">
                          حسابی ثبت نشده است.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {data.settlement_accounts.map((acc) => (
                            <div
                              key={acc.id}
                              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-white">
                                  {acc.account_type === 'crypto'
                                    ? `کریپتو (${acc.crypto_network || 'USDT'})`
                                    : `${acc.bank_name || 'بانک ایران'} · ${acc.account_holder || ''}`}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    acc.is_verified
                                      ? 'bg-emerald-500/15 text-emerald-300'
                                      : 'bg-amber-500/15 text-amber-300'
                                  }`}
                                >
                                  {acc.is_verified ? 'تاییدشده' : 'در انتظار تایید'}
                                </span>
                              </div>
                              <div>
                                {acc.account_type === 'crypto' ? (
                                  <CopyableValue value={acc.crypto_wallet_address} />
                                ) : (
                                  <CopyableValue value={acc.sheba_number || acc.card_number} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Orders */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-purple-400" />
                        آخرین خریدهای اشتراک ({n(data.recent_orders.length)})
                      </h4>
                      {data.recent_orders.length === 0 ? (
                        <div className="text-[11px] text-slate-500 py-2">
                          خریدی برای این کاربر ثبت نشده است.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {data.recent_orders.map((ord) => (
                            <div
                              key={ord.id}
                              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>سفارش #{ord.id}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                    {ord.tier_code}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {price(ord.final_price)} ·{' '}
                                  {formatDateTime(ord.created_at, locale)}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  onTraceOrder(ord.id);
                                  onClose();
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-semibold shrink-0"
                              >
                                ردیابی آبشار
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Modals for direct actions */}
      <BlacklistActionModal
        target={blacklistTarget}
        onClose={() => setBlacklistTarget(null)}
        onSuccess={handleMutationSuccess}
      />
      <UnblockConfirmModal
        target={unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onSuccess={handleMutationSuccess}
      />

      {/* Toggle Hidden Confirmation Modal */}
      {hiddenConfirmOpen && data && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-[#0c1017] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              {data.user.is_referral_hidden ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              {data.user.is_referral_hidden
                ? 'بازگرداندن کاربر به چرخه آبشار'
                : 'پنهان‌سازی کاربر در آبشار (Pass-Through)'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.user.is_referral_hidden ? (
                <>
                  با خارج کردن <strong className="text-white">@{data.user.username}</strong> از حالت مخفی، او دوباره سهم لایه خودش را دریافت می‌کند و درصد معرف‌های بالاتر به حالت استاندارد برمی‌گردد.
                </>
              ) : (
                <>
                  با پنهان‌سازی <strong className="text-white">@{data.user.username}</strong>، در محاسبه آبشار پورسانت خریدهای زیرمجموعه از روی او پرش می‌شود و درصد معرف‌های بالاتر یک پله افزایش می‌یابد (سهم او به صندوق خزانه نمی‌رود).
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setHiddenConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleToggleHidden}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                تایید تغییر وضعیت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Release Confirmation Modal */}
      {releaseConfirmOpen && data && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-[#0c1017] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              رفع تعویق آنی پورسانت معوق
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تمام پورسانت‌های در انتظار کاربر{' '}
              <strong className="text-white">@{data.user.username}</strong> به مبلغ{' '}
              <strong className="text-emerald-300">
                {price(data.wallet.pending_balance_toman)}
              </strong>{' '}
              هم‌اکنون آزاد شده و به موجودی قابل برداشت کیف پول منتقل می‌شود.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReleaseConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleReleasePending}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                آزادسازی آنی
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
