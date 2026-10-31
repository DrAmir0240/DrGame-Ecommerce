"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Check,
  X,
  Percent,
  Clock,
} from "lucide-react";
import { AdminDiscountCode } from "@/types/admin";
import { apiRequest } from "@/lib/apiClient";
import { useTranslation } from "@/i18n";

export default function AdminDiscountsPage() {
  const { t, n, price, percent: formatPercent } = useTranslation();
  const [discounts, setDiscounts] = useState<AdminDiscountCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState<number>(20);
  const [maxDiscount, setMaxDiscount] = useState<number>(50000);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<AdminDiscountCode[]>("/admin/discounts");
      setDiscounts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage(t("admin.discounts.codeRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      await apiRequest("/admin/discounts", {
        method: "POST",
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount_percent: Number(percent),
          max_discount_toman: Number(maxDiscount) || null,
          usage_limit: Number(usageLimit),
        }),
      });

      setMessage(t("admin.discounts.created"));
      fetchDiscounts();
      setTimeout(() => setShowModal(false), 1000);
    } catch (err: any) {
      setMessage(err.message || t("admin.discounts.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin.discounts.confirmDelete"))) return;
    try {
      await apiRequest(`/admin/discounts/${id}`, {
        method: "DELETE",
      });
      fetchDiscounts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">
            {t("admin.discounts.title")}
          </h1>
          <p className="text-xs text-slate-400">
            {t("admin.discounts.subtitle")}
          </p>
        </div>

        <button
          onClick={() => {
            setCode("");
            setPercent(20);
            setMaxDiscount(50000);
            setUsageLimit(100);
            setMessage(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t("admin.discounts.create")}</span>
        </button>
      </div>

      {/* Discounts Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">{t("admin.discounts.table.id")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.discounts.table.code")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.discounts.table.percent")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.discounts.table.maxDiscount")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.discounts.table.usage")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.discounts.table.status")}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t("admin.discounts.table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t("admin.discounts.loading")}
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {t("admin.discounts.empty")}
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400">#{d.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs tracking-wider">
                        {d.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {formatPercent(d.discount_percent)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {d.max_discount_toman
                        ? price(d.max_discount_toman)
                        : t("admin.discounts.unlimited")}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300" dir="ltr">
                      {n(d.used_count)} / {n(d.usage_limit)}
                    </td>
                    <td className="py-3.5 px-4">
                      {d.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          {t("admin.discounts.status.active")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-[10px]">
                          {t("admin.discounts.status.inactive")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title={t("admin.discounts.deleteTitle")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>{t("admin.discounts.modal.title")}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">{t("admin.discounts.modal.codeLabel")}</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("admin.discounts.modal.codePlaceholder")}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">{t("admin.discounts.modal.percentLabel")}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percent}
                    onChange={(e) => setPercent(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">{t("admin.discounts.modal.maxDiscountLabel")}</label>
                  <input
                    type="number"
                    step="1000"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">{t("admin.discounts.modal.usageLabel")}</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              {message && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                  {message}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  {t("admin.discounts.modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {submitting ? t("admin.discounts.modal.submitting") : t("admin.discounts.modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
