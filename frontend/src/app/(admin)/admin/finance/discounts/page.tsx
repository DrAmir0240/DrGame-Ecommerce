'use client';

import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, Users, CheckCircle2, AlertCircle, Clock, ShieldCheck, X } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { DepartmentAdminProfile } from '@/components/admin/DepartmentLayout';
import { UserDiscountItem } from '@/types/referral';
import { useTranslation } from '@/i18n';

export default function FinanceDiscountsPage() {
  const { n, price, d } = useTranslation();
  const [activeTab, setActiveTab] = useState<'coupons' | 'user_discounts'>('coupons');
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [userDiscounts, setUserDiscounts] = useState<UserDiscountItem[]>([]);
  const [userDiscountsTotal, setUserDiscountsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);

  // Coupon modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discount_percent: 20,
    max_discount_toman: 50000,
    usage_limit: 100,
  });

  // User discount revocation / bulk modal
  const [userDiscountModalOpen, setUserDiscountModalOpen] = useState(false);
  const [userDiscountForm, setUserDiscountForm] = useState({
    user_ids: '',
    discount_percent: 20,
    duration_days: 7,
    title: 'تخفیف ویژه اشتراک',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, discList, userDiscList] = await Promise.all([
        apiRequest<DepartmentAdminProfile>('/admin-finance/auth/me'),
        apiRequest<any[]>('/admin-finance/discounts'),
        apiRequest<{ items: UserDiscountItem[]; total: number }>('/admin-finance/user-discounts').catch(() => ({
          items: [],
          total: 0,
        })),
      ]);
      setCurrentUser(profile);
      setDiscounts(discList || []);
      setUserDiscounts(userDiscList.items || []);
      setUserDiscountsTotal(userDiscList.total || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در دریافت کدهای تخفیف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === 'read_only';

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiRequest('/admin-finance/discounts', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setForm({ code: '', discount_percent: 20, max_discount_toman: 50000, usage_limit: 100 });
      setSuccessMsg('کد تخفیف جدید با موفقیت ایجاد شد.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ایجاد کد تخفیف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBulkUserDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const rawIds = userDiscountForm.user_ids
      .split(/[\s,]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (rawIds.length === 0) {
      setErrorMsg('حداقل یک شناسه عددی کاربر وارد کنید.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await apiRequest<any>('/admin-finance/user-discounts/bulk', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: rawIds,
          discount_percent: Number(userDiscountForm.discount_percent),
          duration_days: Number(userDiscountForm.duration_days),
          title: userDiscountForm.title,
        }),
      });
      setUserDiscountModalOpen(false);
      setUserDiscountForm({ user_ids: '', discount_percent: 20, duration_days: 7, title: 'تخفیف ویژه اشتراک' });
      setSuccessMsg(res.message || 'تخفیف کاربرمحور با موفقیت ایجاد شد.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت تخفیف‌های کاربرمحور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelUserDiscount = async (id: number) => {
    if (isReadOnly) return;
    if (!confirm('آیا از ابطال این تخفیف کاربر اطمینان دارید؟')) return;
    try {
      await apiRequest(`/admin-finance/user-discounts/${id}`, { method: 'DELETE' });
      setSuccessMsg('تخفیف کاربر با موفقیت ابطال شد.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ابطال تخفیف');
    }
  };

  return (
    <div className="space-y-6 font-vazir text-start">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-amber-400" />
            <span>مدیریت کدهای تخفیف و پروموشن‌های اشتراک</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تعریف کوپن‌های تخفیف متنی عمومی یا اعطای تخفیف‌های کاربرمحور با اعمال خودکار در سبد خرید
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'coupons' ? (
            <button
              onClick={() => setModalOpen(true)}
              disabled={isReadOnly}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isReadOnly
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>کد تخفیف عمومی جدید</span>
            </button>
          ) : (
            <button
              onClick={() => setUserDiscountModalOpen(true)}
              disabled={isReadOnly}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isReadOnly
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>اعطای تخفیف به کاربران</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'coupons'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>کدهای تخفیف عمومی ({n(discounts.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('user_discounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'user_discounts'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تخفیف‌های متصل به کاربر ({n(userDiscountsTotal)})</span>
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): اجازه ساخت یا ویرایش کدهای تخفیف را ندارید.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Coupon Codes Table */}
      {activeTab === 'coupons' && (
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">کد</th>
                  <th className="py-3 px-4">درصد تخفیف</th>
                  <th className="py-3 px-4">سقف تخفیف</th>
                  <th className="py-3 px-4">تعداد مصرف شده</th>
                  <th className="py-3 px-4">سقف کل</th>
                  <th className="py-3 px-4">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      در حال دریافت...
                    </td>
                  </tr>
                ) : discounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      هیچ کد تخفیفی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  discounts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{d.code}</td>
                      <td className="py-3 px-4 font-mono text-white">{d.discount_percent}%</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {price(d.max_discount_toman || 0)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{n(d.used_count || 0)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{n(d.usage_limit || 0)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            d.is_active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {d.is_active ? 'فعال' : 'منقضی'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: User-Bound Discounts Table */}
      {activeTab === 'user_discounts' && (
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">شناسه</th>
                  <th className="py-3 px-4">کاربر هدف</th>
                  <th className="py-3 px-4">عنوان کمپین</th>
                  <th className="py-3 px-4">درصد</th>
                  <th className="py-3 px-4">تاریخ شروع</th>
                  <th className="py-3 px-4">تاریخ انقضا</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      در حال دریافت...
                    </td>
                  </tr>
                ) : userDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      هیچ تخفیف اختصاصی کاربری صادر نشده است.
                    </td>
                  </tr>
                ) : (
                  userDiscounts.map((ud) => {
                    const isExpired = new Date(ud.expires_at) < new Date();
                    return (
                      <tr key={ud.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500">#{ud.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{ud.username}</div>
                          <div className="text-[10px] text-slate-400">{ud.full_name || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-medium">{ud.title}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {ud.discount_percent}٪
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{d(ud.starts_at)}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{d(ud.expires_at)}</td>
                        <td className="py-3 px-4">
                          {ud.is_used ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              مصرف شده
                            </span>
                          ) : !ud.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              ابطال شده
                            </span>
                          ) : isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                              منقضی شده
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              فعال و معتبر
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {ud.is_active && !ud.is_used && !isExpired && (
                            <button
                              type="button"
                              onClick={() => handleCancelUserDiscount(ud.id)}
                              disabled={isReadOnly}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] border border-rose-500/20 cursor-pointer"
                            >
                              ابطال تخفیف
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupon Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">تعریف کد تخفیف جدید</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">کد (انگلیسی یکتا)</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-left font-mono"
                  placeholder="SUMMER50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">درصد</label>
                  <input
                    type="number"
                    required
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">سقف استفاده</label>
                  <input
                    type="number"
                    required
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">سقف مبلغ تخفیف (تومان)</label>
                <input
                  type="number"
                  required
                  value={form.max_discount_toman}
                  onChange={(e) => setForm({ ...form, max_discount_toman: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg font-semibold bg-amber-500 hover:bg-amber-400 text-black cursor-pointer"
                >
                  {submitting ? 'در حال ثبت...' : 'افزودن کد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User-Bound Discount Bulk Create Modal */}
      {userDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>اعطای تخفیف مستقیم به کاربران</span>
              </h3>
              <button
                onClick={() => setUserDiscountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBulkUserDiscount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">
                  شناسه کاربران هدف (با کاما یا فاصله جدا کنید):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 1, 2, 5, 12"
                  value={userDiscountForm.user_ids}
                  onChange={(e) =>
                    setUserDiscountForm({ ...userDiscountForm, user_ids: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold">عنوان نمایشی تخفیف:</label>
                <input
                  type="text"
                  required
                  value={userDiscountForm.title}
                  onChange={(e) =>
                    setUserDiscountForm({ ...userDiscountForm, title: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">درصد تخفیف (٪):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={userDiscountForm.discount_percent}
                    onChange={(e) =>
                      setUserDiscountForm({
                        ...userDiscountForm,
                        discount_percent: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">اعتبار به روز:</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={userDiscountForm.duration_days}
                    onChange={(e) =>
                      setUserDiscountForm({
                        ...userDiscountForm,
                        duration_days: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserDiscountModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-black cursor-pointer"
                >
                  {submitting ? 'در حال ثبت...' : 'اعطای تخفیف به کاربران'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
