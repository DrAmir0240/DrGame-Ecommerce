'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldOff,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n/I18nProvider';
import { formatDateTime } from '@/i18n';
import { useDepartmentProfile } from '@/components/admin/DepartmentLayout';
import {
  ReadOnlyGuardBanner,
  useAdminToast,
} from '@/components/admin/referral/AdminToast';
import CopyableValue from '@/components/admin/referral/CopyableValue';
import {
  AdminSettlementAccountItem,
  AdminSettlementAccountListResponse,
} from '@/types/referral';

export default function AdminReferralAccountsPage() {
  const { n, locale } = useTranslation();
  const { isReadOnly } = useDepartmentProfile();
  const { showToast } = useAdminToast();

  const [data, setData] = useState<AdminSettlementAccountListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [accountType, setAccountType] = useState<'all' | 'bank_iran' | 'crypto'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [verifyTarget, setVerifyTarget] = useState<{
    account: AdminSettlementAccountItem;
    nextVerified: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        verified_filter: verifiedFilter,
        account_type: accountType,
      });
      if (search.trim()) params.set('search', search.trim());
      const res = await apiRequest<AdminSettlementAccountListResponse>(
        `/admin-referral/settlement-accounts?${params.toString()}`
      );
      setData(res);
    } catch (err: any) {
      showToast('خطا در بارگذاری حساب‌های تسویه', 'error', err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, verifiedFilter, accountType, search, showToast]);

  useEffect(() => {
    const timer = setTimeout(loadAccounts, 200);
    return () => clearTimeout(timer);
  }, [loadAccounts]);

  const handleConfirmVerify = async () => {
    if (!verifyTarget) return;
    setSubmitting(true);
    try {
      await apiRequest(
        `/admin-referral/settlement-accounts/${verifyTarget.account.id}/verify`,
        {
          method: 'PUT',
          body: JSON.stringify({ is_verified: verifyTarget.nextVerified }),
        }
      );
      showToast(
        verifyTarget.nextVerified
          ? 'حساب بانکی/ولت با موفقیت تایید شد'
          : 'تایید حساب لغو و به وضعیت معلق بازگردانده شد',
        verifyTarget.nextVerified ? 'success' : 'warning'
      );
      setVerifyTarget(null);
      await loadAccounts();
    } catch (err: any) {
      showToast('خطا در تغییر وضعیت تایید حساب', 'error', err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = data?.summary;
  const items = data?.items || [];

  return (
    <div className="space-y-6" dir="rtl">
      <ReadOnlyGuardBanner visible={isReadOnly} />

      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-rose-400" />
            تایید و ممیزی حساب‌های بانکی و ولت تسویه
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            انطباق صاحب حساب، کدملی و شماره شبا/کارت/آدرس تتر کاربران پیش از تایید نهایی برای واریزها
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
            کل: <strong>{n(summary?.total_count || 0)}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300">
            در انتظار تایید: <strong>{n(summary?.pending_count || 0)}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
            تاییدشده: <strong>{n(summary?.verified_count || 0)}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'همه حساب‌ها' },
            { key: 'pending', label: 'منتظر تایید' },
            { key: 'verified', label: 'تاییدشده' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setVerifiedFilter(opt.key as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                verifiedFilter === opt.key
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <select
            value={accountType}
            onChange={(e) => {
              setAccountType(e.target.value as any);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
          >
            <option value="all">همه نوع‌ها (بانکی + کریپتو)</option>
            <option value="bank_iran">حساب بانکی ایران (شبا/کارت)</option>
            <option value="crypto">ولت کریپتو (تتر)</option>
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="جستجو صاحب حساب، کدملی، شبا، موبایل، یوزرنیم..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">کاربر مالک حساب</th>
                <th className="py-3.5 px-4">هویت بانکی / کدملی</th>
                <th className="py-3.5 px-4">اطلاعات شبا / کارت / ولت</th>
                <th className="py-3.5 px-4">وضعیت تایید</th>
                <th className="py-3.5 px-4">تاریخ ثبت</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin inline-block ml-2 text-rose-400" />
                    در حال بارگذاری حساب‌ها...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    حسابی مطابق این جستجو و فیلتر یافت نشد.
                  </td>
                </tr>
              ) : (
                items.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 space-y-1">
                      <Link
                        href={`/admin/referral/tree?user_id=${acc.user_id}`}
                        className="font-bold text-white hover:text-rose-300 block"
                      >
                        {acc.user_full_name || acc.username}
                      </Link>
                      <div className="text-[11px] font-mono text-rose-300" dir="ltr">
                        @{acc.username || `user_${acc.user_id}`} (#{acc.user_id})
                      </div>
                      {acc.user_phone && (
                        <div>
                          <CopyableValue value={acc.user_phone} maxWidthClass="max-w-[130px]" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div className="font-semibold text-slate-200">
                        {acc.account_holder || '—'}
                      </div>
                      {acc.bank_name && (
                        <div className="text-[11px] text-slate-400">{acc.bank_name}</div>
                      )}
                      {acc.national_code && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <span>کدملی:</span>
                          <CopyableValue value={acc.national_code} maxWidthClass="max-w-[110px]" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      {acc.account_type === 'crypto' ? (
                        <>
                          <div className="text-[11px] font-bold text-sky-300">
                            رمزارز ({acc.crypto_network || 'USDT'})
                          </div>
                          <CopyableValue value={acc.crypto_wallet_address} maxWidthClass="max-w-[240px]" />
                        </>
                      ) : (
                        <>
                          {acc.sheba_number && (
                            <div>
                              <CopyableValue value={acc.sheba_number} maxWidthClass="max-w-[240px]" />
                            </div>
                          )}
                          {acc.card_number && (
                            <div>
                              <CopyableValue value={acc.card_number} maxWidthClass="max-w-[200px]" />
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {acc.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          تاییدشده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                          <XCircle className="w-3 h-3" />
                          در انتظار تایید
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      {formatDateTime(acc.created_at, locale)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {acc.is_verified ? (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            setVerifyTarget({ account: acc, nextVerified: false })
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                          لغو تایید
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            setVerifyTarget({ account: acc, nextVerified: true })
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          تایید حساب
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(data?.total || 0) > 20 && (
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              صفحه قبل
            </button>
            <span>
              صفحه {n(page)} از {n(Math.ceil((data?.total || 0) / 20))}
            </span>
            <button
              type="button"
              disabled={page * 20 >= (data?.total || 0)}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40"
            >
              صفحه بعد
            </button>
          </div>
        )}
      </div>

      {/* Verify/Revoke Confirmation Modal */}
      {verifyTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-bold flex items-center gap-2 ${
                  verifyTarget.nextVerified ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {verifyTarget.nextVerified ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <ShieldOff className="w-4 h-4" />
                )}
                {verifyTarget.nextVerified
                  ? 'تایید نهایی حساب تسویه'
                  : 'لغو تایید حساب تسویه'}
              </h3>
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              حساب متعلق به{' '}
              <strong className="text-white">
                {verifyTarget.account.account_holder ||
                  verifyTarget.account.user_full_name ||
                  verifyTarget.account.username}
              </strong>{' '}
              (<span className="font-mono" dir="ltr">
                {verifyTarget.account.sheba_number ||
                  verifyTarget.account.crypto_wallet_address ||
                  verifyTarget.account.card_number}
              </span>)
              {verifyTarget.nextVerified
                ? ' برای واریزهای بعدی تایید و فعال می‌شود.'
                : ' از حالت تاییدشده خارج می‌شود.'}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVerifyTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmVerify}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 ${
                  verifyTarget.nextVerified
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                تایید عملیات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
