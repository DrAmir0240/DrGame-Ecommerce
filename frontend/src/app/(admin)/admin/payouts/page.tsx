"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Check,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { AdminPayoutItem } from "@/types/admin";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "");

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayoutItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Process modal state
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutItem | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("drgame_admin_token");
      const url = new URL(`${API_BASE}/api/admin/payouts`);
      if (filterStatus) url.searchParams.set("status", filterStatus);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("خطا در دریافت لیست تسویه‌ها");
      const data = await res.json();
      setPayouts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [filterStatus]);

  const openProcessModal = (p: AdminPayoutItem, type: "approved" | "rejected") => {
    setSelectedPayout(p);
    setActionType(type);
    setReceiptUrl("");
    setAdminNotes(type === "approved" ? "تسویه با موفقیت واریز شد" : "اطلاعات حساب نامعتبر است");
    setModalMessage(null);
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    try {
      setSubmitting(true);
      setModalMessage(null);
      const token = localStorage.getItem("drgame_admin_token");

      const res = await fetch(`${API_BASE}/api/admin/payouts/${selectedPayout.id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_status: actionType,
          admin_receipt_url: receiptUrl.trim() || null,
          admin_notes: adminNotes.trim(),
        }),
      });

      if (!res.ok) throw new Error("خطا در پردازش تسویه");
      setModalMessage(
        actionType === "approved"
          ? "درخواست با موفقیت تایید شد."
          : "درخواست رد شد و مبلغ به کیف پول کاربر بازگشت داده شد."
      );
      fetchPayouts();
      setTimeout(() => setSelectedPayout(null), 1200);
    } catch (err: any) {
      setModalMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">
            کارتابل تسویه پورسانت‌های رفرال
          </h1>
          <p className="text-xs text-slate-400">
            بررسی و تایید درخواست‌های واریز وجه، ثبت کد پیگیری و عودت خودکار وجه در صورت رد
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121721] rounded-2xl border border-slate-800 self-start sm:self-auto">
          {[
            { label: "همه", val: "" },
            { label: "در انتظار بررسی", val: "pending" },
            { label: "واریز شده", val: "approved" },
            { label: "رد شده", val: "rejected" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterStatus(f.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === f.val
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">شناسه</th>
                <th className="py-3.5 px-4 font-semibold">کاربر</th>
                <th className="py-3.5 px-4 font-semibold">مبلغ درخواستی</th>
                <th className="py-3.5 px-4 font-semibold">حساب مقصد</th>
                <th className="py-3.5 px-4 font-semibold">تاریخ درخواست</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                <th className="py-3.5 px-4 font-semibold text-center">اقدام مدیر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    درحال دریافت کارتابل تسویه...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    درخواست تسویه‌ای یافت نشد.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400">#{p.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{p.user_name || "کاربر"}</div>
                      <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                        {p.user_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {formatPrice(p.amount_toman)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.account_type === "sheba" ? (
                        <div>
                          <span className="text-[10px] text-slate-500 block">شماره شبا:</span>
                          <span className="font-mono text-slate-300 text-[11px]" dir="ltr">
                            {p.sheba_number || "—"}
                          </span>
                        </div>
                      ) : p.account_type === "card" ? (
                        <div>
                          <span className="text-[10px] text-slate-500 block">شماره کارت:</span>
                          <span className="font-mono text-slate-300 text-[11px]" dir="ltr">
                            {p.card_number || "—"}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-cyan-400 block font-mono">
                            USDT {p.crypto_network || "TRC20"}:
                          </span>
                          <span className="font-mono text-slate-300 text-[11px]" dir="ltr">
                            {p.crypto_wallet_address || "—"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono" dir="ltr">
                      {new Date(p.created_at).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === "pending" ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                          در انتظار اقدام
                        </span>
                      ) : p.status === "approved" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          واریز شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                          رد شده (عودت)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openProcessModal(p, "approved")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تایید واریز</span>
                          </button>
                          <button
                            onClick={() => openProcessModal(p, "rejected")}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>رد درخواست</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 text-[11px]">
                          پردازش شده
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve / Reject Process Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>
                  {actionType === "approved" ? "تایید واریز تسویه" : "رد درخواست تسویه وجه"}
                </span>
              </div>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">کاربر:</span>
                <span className="text-slate-200 font-semibold">{selectedPayout.user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">مبلغ واریز:</span>
                <span className="text-emerald-400 font-bold">
                  {formatPrice(selectedPayout.amount_toman)}
                </span>
              </div>
            </div>

            {actionType === "rejected" && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>توجه: با رد درخواست، مبلغ فوراً به کیف پول کاربر عودت داده خواهد شد.</span>
              </div>
            )}

            <form onSubmit={handleProcessSubmit} className="space-y-3.5 text-xs">
              {actionType === "approved" && (
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    آدرس تصویر یا لینک فیش واریز
                  </label>
                  <input
                    type="url"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="https://.../receipt.jpg"
                    className="w-full bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-medium">یادداشت مدیر</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {modalMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                  {modalMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white font-semibold rounded-xl flex items-center gap-1.5 ${
                    actionType === "approved"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {submitting
                    ? "درحال ثبت..."
                    : actionType === "approved"
                    ? "تایید نهایی واریز"
                    : "ثبت رد درخواست"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
