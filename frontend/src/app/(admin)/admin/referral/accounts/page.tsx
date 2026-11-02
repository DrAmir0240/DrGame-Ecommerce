"use client";

import React, { useEffect, useState } from "react";
import { Landmark, CheckCircle, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function ReferralAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>("/admin-referral/settlement-accounts?page=1&limit=50")
      .then((res) => {
        setAccounts(Array.isArray(res) ? res : res?.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Landmark className="w-6 h-6 text-rose-400" />
          حساب‌های تسویه‌حساب بانکی و ولت‌های تتر
        </h1>
        <p className="text-xs text-slate-400 mt-1">مشاهده شماره‌های شبا، کارت‌های بانکی و آدرس‌های ولت متصل کاربران</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه</th>
              <th className="py-3 px-4">کاربر</th>
              <th className="py-3 px-4">نوع حساب</th>
              <th className="py-3 px-4">نام بانک / شبکه</th>
              <th className="py-3 px-4">شماره شبا / کارت / ولت</th>
              <th className="py-3 px-4">نام صاحب حساب</th>
              <th className="py-3 px-4">وضعیت تایید</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">در حال دریافت...</td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">هیچ حسابی ثبت نشده است.</td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{acc.id}</td>
                  <td className="py-3 px-4 font-medium text-white">کاربر #{acc.user_id}</td>
                  <td className="py-3 px-4">{acc.account_type}</td>
                  <td className="py-3 px-4 text-slate-300">{acc.bank_name || acc.crypto_network || "—"}</td>
                  <td className="py-3 px-4 font-mono text-rose-300">
                    {acc.sheba_number || acc.card_number || acc.crypto_wallet_address || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{acc.account_holder || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      acc.is_verified ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {acc.is_verified ? "تایید شده" : "در انتظار بررسی"}
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
