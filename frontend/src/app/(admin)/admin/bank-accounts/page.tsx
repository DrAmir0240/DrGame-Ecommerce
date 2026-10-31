"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  CreditCard,
  Shield,
  AlertCircle,
  Check,
} from "lucide-react";

import { apiRequest } from "@/lib/apiClient";
import { useTranslation } from "@/i18n";

interface SettlementAcc {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  account_type: string;
  sheba_number: string | null;
  card_number: string | null;
  account_holder?: string | null;
  bank_name: string | null;
  national_code?: string | null;
  phone?: string | null;
  crypto_wallet_address: string | null;
  crypto_network: string | null;
  is_verified: boolean;
  is_active?: boolean;
  created_at: string;
}

export default function AdminBankAccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<SettlementAcc[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real settlement accounts from /admin/bank-accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<SettlementAcc[]>("/admin/bank-accounts");
      setAccounts(data || []);
    } catch (err) {
      console.error("Failed to fetch settlement accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleToggleVerify = async (accountId: number, currentStatus: boolean) => {
    try {
      await apiRequest(`/admin/bank-accounts/${accountId}/verify`, {
        method: "POST",
        body: JSON.stringify({ is_verified: !currentStatus }),
      });
      setAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, is_verified: !currentStatus } : a))
      );
    } catch (err) {
      console.error("Failed to toggle verification:", err);
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white mb-1">
          {t("admin.bankAccounts.title")}
        </h1>
        <p className="text-xs text-slate-400">
          {t("admin.bankAccounts.subtitle")}
        </p>
      </div>

      {/* Accounts Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold text-start">{t("admin.bankAccounts.table.id")}</th>
                <th className="py-3.5 px-4 font-semibold text-start">{t("admin.bankAccounts.table.user")}</th>
                <th className="py-3.5 px-4 font-semibold text-start">{t("admin.bankAccounts.table.accountType")}</th>
                <th className="py-3.5 px-4 font-semibold text-start">{t("admin.bankAccounts.table.accountValue")}</th>
                <th className="py-3.5 px-4 font-semibold text-start">{t("admin.bankAccounts.table.verifyStatus")}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t("admin.bankAccounts.table.toggle")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t("admin.bankAccounts.loading")}
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    {t("admin.bankAccounts.empty")}
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400">#{acc.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div>
                        <span>{acc.user_name || `کاربر #${acc.user_id}`}</span>
                        {acc.account_holder && (
                          <span className="block text-[11px] text-slate-400">
                            صاحب حساب: {acc.account_holder}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {acc.account_type === "bank_iran" ? "بانک ایران" : acc.account_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300" dir="ltr">
                      <div>
                        <span>{acc.sheba_number || acc.card_number || acc.crypto_wallet_address || "—"}</span>
                        {acc.bank_name && (
                          <span className="block text-[11px] text-slate-500 font-sans" dir="rtl">
                            {acc.bank_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.is_verified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          {t("admin.bankAccounts.verified")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                          {t("admin.bankAccounts.pending")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleVerify(acc.id, acc.is_verified)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          acc.is_verified
                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {acc.is_verified
                          ? t("admin.bankAccounts.actions.revoke")
                          : t("admin.bankAccounts.actions.verify")}
                      </button>
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
