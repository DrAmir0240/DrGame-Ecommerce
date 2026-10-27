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

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "");

interface SettlementAcc {
  id: number;
  user_id: number;
  account_type: "sheba" | "card" | "crypto";
  sheba_number: string | null;
  card_number: string | null;
  bank_name: string | null;
  crypto_wallet_address: string | null;
  crypto_network: string | null;
  is_verified: boolean;
  is_default: boolean;
  created_at: string;
}

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<SettlementAcc[]>([]);
  const [loading, setLoading] = useState(true);

  // We can fetch settlement accounts or list from payouts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("drgame_admin_token");
      // Use payouts query to get accounts or direct query
      const res = await fetch(`${API_BASE}/api/admin/payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const payouts = await res.json();
        const accs: SettlementAcc[] = payouts.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          account_type: p.account_type,
          sheba_number: p.sheba_number,
          card_number: p.card_number,
          bank_name: "سامانه بانکی",
          crypto_wallet_address: p.crypto_wallet_address,
          crypto_network: p.crypto_network,
          is_verified: p.status === "approved",
          is_default: true,
          created_at: p.created_at,
        }));
        setAccounts(accs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleToggleVerify = async (accountId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("drgame_admin_token");
      const res = await fetch(`${API_BASE}/api/admin/bank-accounts/${accountId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_verified: !currentStatus }),
      });
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === accountId ? { ...a, is_verified: !currentStatus } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white mb-1">
          کارتابل تایید شماره شبا، کارت بانکی و کیف پول کریپتو
        </h1>
        <p className="text-xs text-slate-400">
          اعتبارسنجی مشخصات بانکی و آدرس ولت‌های تتر جهت جلوگیری از خطای واریز پورسانت رفرال
        </p>
      </div>

      {/* Accounts Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">شناسه</th>
                <th className="py-3.5 px-4 font-semibold">کاربر</th>
                <th className="py-3.5 px-4 font-semibold">نوع حساب</th>
                <th className="py-3.5 px-4 font-semibold">شماره حساب / آدرس ولت</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت تایید</th>
                <th className="py-3.5 px-4 font-semibold text-center">تغییر وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    درحال دریافت حساب‌های تسویه...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    حساب تسویه‌ای برای نمایش یافت نشد.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/20">
                    <td className="py-3.5 px-4 font-mono text-slate-400">#{acc.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">User #{acc.user_id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {acc.account_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300" dir="ltr">
                      {acc.sheba_number || acc.card_number || acc.crypto_wallet_address || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.is_verified ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          تایید شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                          در انتظار اعتبارسنجی
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleVerify(acc.id, acc.is_verified)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                          acc.is_verified
                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {acc.is_verified ? "لغو تایید" : "تایید حساب"}
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
