"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Search, ShieldCheck, CheckCircle, Clock, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function FinanceTransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grantForm, setGrantForm] = useState({
    user_id: "",
    tier_code: "PRO",
    duration_days: 30,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, txRes] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-finance/auth/me"),
        apiRequest<any[]>("/admin-finance/transactions?page=1&limit=50"),
      ]);
      setCurrentUser(profile);
      setPayments(Array.isArray(txRes) ? txRes : (txRes as any)?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت تراکنش‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await apiRequest(`/admin-finance/users/${grantForm.user_id}/grant-subscription`, {
        method: "POST",
        body: JSON.stringify({
          tier_code: grantForm.tier_code,
          duration_days: Number(grantForm.duration_days),
        }),
      });
      setSuccessMsg(`اشتراک ${grantForm.tier_code} با موفقیت به کاربر #${grantForm.user_id} اعطا شد`);
      setGrantModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در اعطای اشتراک دستی");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            تراکنش‌ها و پرداخت‌های پلتفرم
          </h1>
          <p className="text-xs text-slate-400 mt-1">مشاهده فاکتورها، وضعیت درگاه‌ها و تایید دستی اشتراک</p>
        </div>

        <button
          onClick={() => setGrantModalOpen(true)}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
            isReadOnly ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          اعطای اشتراک دستی
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): مشاهده لاگ‌ها مجاز است اما امکان تایید یا اعطای دستی اشتراک وجود ندارد.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
          {successMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه</th>
              <th className="py-3 px-4">کاربر</th>
              <th className="py-3 px-4">پلن انتخابی</th>
              <th className="py-3 px-4">مبلغ پرداختی</th>
              <th className="py-3 px-4">روش پرداخت</th>
              <th className="py-3 px-4">کد رهگیری</th>
              <th className="py-3 px-4">وضعیت</th>
              <th className="py-3 px-4">تاریخ ثبت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">در حال دریافت تراکنش‌ها...</td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">هیچ تراکنشی یافت نشد.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{p.id}</td>
                  <td className="py-3 px-4 font-medium text-white">کاربر #{p.user_id}</td>
                  <td className="py-3 px-4 font-mono text-amber-300">{p.tier_code}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                    {(p.final_price || 0).toLocaleString()} تومان
                  </td>
                  <td className="py-3 px-4 text-slate-400">{p.payment_method || "درگاه آنلاین"}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{p.transaction_ref || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      p.status === "COMPLETED" || p.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : p.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("fa-IR") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {grantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">اعطای اشتراک دستی</h3>
            <form onSubmit={handleGrant} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">شناسه کاربر (User ID)</label>
                <input
                  type="number"
                  required
                  value={grantForm.user_id}
                  onChange={(e) => setGrantForm({ ...grantForm, user_id: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  placeholder="12"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">کد پلن</label>
                <select
                  value={grantForm.tier_code}
                  onChange={(e) => setGrantForm({ ...grantForm, tier_code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="FREE">FREE</option>
                  <option value="PLUS">PLUS</option>
                  <option value="PRO">PRO</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">مدت زمان (روز)</label>
                <input
                  type="number"
                  required
                  value={grantForm.duration_days}
                  onChange={(e) => setGrantForm({ ...grantForm, duration_days: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  placeholder="30"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {submitting ? "در حال ثبت..." : "اعطا و فعال‌سازی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
