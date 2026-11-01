"use client";

import React, { useEffect, useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function FinanceDiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_percent: 20,
    max_discount_toman: 50000,
    usage_limit: 100,
  });
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, discList] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-finance/auth/me"),
        apiRequest<any[]>("/admin-finance/discounts"),
      ]);
      setCurrentUser(profile);
      setDiscounts(discList || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت کدهای تخفیف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await apiRequest("/admin-finance/discounts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setForm({ code: "", discount_percent: 20, max_discount_toman: 50000, usage_limit: 100 });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ایجاد کد تخفیف");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-400" />
            کدهای تخفیف اشتراک
          </h1>
          <p className="text-xs text-slate-400 mt-1">ایجاد و مدیریت کمپین‌های تخفیفی روی پلن‌ها</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
            isReadOnly ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}
        >
          <Plus className="w-4 h-4" />
          کد تخفیف جدید
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): اجازه ساخت یا ویرایش کدهای تخفیف را ندارید.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
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
                <td colSpan={6} className="py-8 text-center text-slate-500">در حال دریافت...</td>
              </tr>
            ) : discounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">هیچ کد تخفیفی یافت نشد.</td>
              </tr>
            ) : (
              discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">{d.code}</td>
                  <td className="py-3 px-4 font-mono text-white">{d.discount_percent}%</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{(d.max_discount_toman || 0).toLocaleString()} تومان</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{d.used_count || 0}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{d.usage_limit || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      d.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {d.is_active ? "فعال" : "منقضی"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">تعریف کد تخفیف جدید</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">کد (انگلیسی یکتا)</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="SUMMER50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">درصد</label>
                  <input
                    type="number"
                    required
                    value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">سقف استفاده</label>
                  <input
                    type="number"
                    required
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">سقف مبلغ تخفیف (تومان)</label>
                <input
                  type="number"
                  required
                  value={form.max_discount_toman}
                  onChange={(e) => setForm({ ...form, max_discount_toman: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {submitting ? "در حال ثبت..." : "افزودن کد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
