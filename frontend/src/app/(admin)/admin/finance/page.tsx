"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Shield,
  CheckCircle,
  Clock,
} from "lucide-react";
import { FinanceOverview } from "@/types/admin";
import { apiRequest } from "@/lib/apiClient";
import { useTranslation } from "@/i18n";

const FINANCE_STATUS_KEY: Record<string, string> = {
  paid: "admin.finance.transactions.status.paid",
  pending: "admin.finance.transactions.status.pending",
  failed: "admin.finance.transactions.status.failed",
};

export default function AdminFinancePage() {
  const { t, n, price } = useTranslation();
  const [finance, setFinance] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<FinanceOverview>("/admin/finance/overview");
        setFinance(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinance();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">
            {t("admin.finance.title")}
          </h1>
          <p className="text-xs text-slate-400">
            {t("admin.finance.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 flex items-center gap-1.5 font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            {t("admin.finance.auditLocked")}
          </span>
        </div>
      </div>

      {/* Dual Currency KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent bg-[#0c1017] border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t("admin.finance.kpis.domestic.label")}</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? "..." : price(finance?.total_domestic_volume_toman || 0)}
          </div>
          <span className="text-[11px] text-emerald-400/80 block">
            {t("admin.finance.kpis.domestic.hint")}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-transparent bg-[#0c1017] border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t("admin.finance.kpis.crypto.label")}</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading
              ? "..."
              : t("admin.finance.kpis.crypto.value", {
                  count: n(finance?.total_crypto_orders_count || 0),
                })}
          </div>
          <span className="text-[11px] text-cyan-400/80 block">
            {t("admin.finance.kpis.crypto.hint")}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent bg-[#0c1017] border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">{t("admin.finance.kpis.orders.label")}</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading
              ? "..."
              : t("admin.finance.kpis.orders.value", {
                  count: n(finance?.total_orders_count || 0),
                })}
          </div>
          <span className="text-[11px] text-purple-400/80 block">
            {t("admin.finance.kpis.orders.hint")}
          </span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-[#121721] flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            {t("admin.finance.transactions.title")}
          </h2>
          <span className="text-[11px] text-slate-400">
            {t("admin.finance.transactions.latest", { count: n(50) })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.orderCode")}</th>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.userId")}</th>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.plan")}</th>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.amount")}</th>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.paymentMethod")}</th>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.reference")}</th>
                <th className="py-3 px-4 font-semibold">{t("admin.finance.transactions.table.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {!finance || finance.recent_transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    {t("admin.finance.transactions.empty")}
                  </td>
                </tr>
              ) : (
                finance.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-mono text-slate-400">#{tx.id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {t("admin.finance.transactions.userRef", { id: tx.user_id })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                        {tx.tier_code.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {price(tx.amount_toman)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-mono text-[11px]">
                        {tx.payment_method === "crypto_usdt"
                          ? "USDT TRC20"
                          : t("admin.finance.transactions.paymentBank")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]" dir="ltr">
                      {tx.transaction_ref || "AUTO_REF"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {FINANCE_STATUS_KEY[tx.status]
                          ? t(FINANCE_STATUS_KEY[tx.status])
                          : tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
