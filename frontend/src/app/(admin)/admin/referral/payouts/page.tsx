"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function ReferralPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, payoutsRes] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-referral/auth/me"),
        apiRequest<any>("/admin-referral/payouts?page=1&limit=50"),
      ]);
      setCurrentUser(profile);
      setPayouts(Array.isArray(payoutsRes) ? payoutsRes : payoutsRes?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت درخواست‌های تسویه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleProcess = async (status: "COMPLETED" | "REJECTED") => {
    if (isReadOnly || !selectedPayout) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await apiRequest(`/admin-referral/payouts/${selectedPayout.id}/process`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          admin_receipt_url: receiptUrl,
          admin_notes: adminNotes,
        }),
      });
      setSuccessMsg(`درخواست تسویه با موفقیت به وضعیت ${status} تغییر یافت`);
      setProcessModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در پردازش تسویه");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-rose-400" />
            درخواست‌های تسویه‌حساب و واریز پورسانت
          </h1>
          <p className="text-xs text-slate-400 mt-1">تایید فیش بانکی یا شماره تراکنش کریپتو و تسویه با معرف‌ها</p>
        </div>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): شما صرفاً مجاز به بررسی سوابق هستید و امکان تایید یا رد تسویه را ندارید.
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
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه</th>
              <th className="py-3 px-4">کاربر</th>
              <th className="py-3 px-4">مبلغ درخواستی</th>
              <th className="py-3 px-4">وضعیت</th>
              <th className="py-3 px-4">تاریخ ثبت</th>
              <th className="py-3 px-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">در حال بارگذاری...</td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">هیچ درخواستی ثبت نشده است.</td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{p.id}</td>
                  <td className="py-3 px-4 font-medium text-white">کاربر #{p.user_id}</td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-400">
                    {(p.amount_toman || 0).toLocaleString()} تومان
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      p.status === "COMPLETED"
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
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedPayout(p);
                        setReceiptUrl(p.admin_receipt_url || "");
                        setAdminNotes(p.admin_notes || "");
                        setProcessModalOpen(true);
                      }}
                      disabled={isReadOnly}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        isReadOnly
                          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                          : "bg-rose-600 hover:bg-rose-500 text-white"
                      }`}
                    >
                      بررسی و واریز
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {processModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              پردازش تسویه‌حساب #{selectedPayout.id}
            </h3>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>مبلغ:</span>
                <span className="font-mono text-rose-400 font-bold">
                  {(selectedPayout.amount_toman || 0).toLocaleString()} تومان
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">لینک تصویر فیش واریزی (اختیاری)</label>
              <input
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">یادداشت مدیر (شماره پیگیری و ...)</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="واریز از طریق سامانه پایا..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setProcessModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleProcess("REJECTED")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white"
              >
                رد درخواست
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleProcess("COMPLETED")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                تایید و ثبت واریز
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
