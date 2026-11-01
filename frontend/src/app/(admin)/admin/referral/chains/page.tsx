"use client";

import React, { useEffect, useState } from "react";
import { Share2, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function ReferralChainsPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<any>("/admin-referral/chains?page=1&limit=50")
      .then((res) => {
        setChains(Array.isArray(res) ? res : res?.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-6 h-6 text-rose-400" />
          زنجیره‌های رفرال و پیوندهای عضویت
        </h1>
        <p className="text-xs text-slate-400 mt-1">مشاهده درخت معرفی کاربران و پورسانت‌های ثبت‌شده</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه پیوند</th>
              <th className="py-3 px-4">کاربر زیرمجموعه</th>
              <th className="py-3 px-4">معرف (Invited By)</th>
              <th className="py-3 px-4">تاریخ پیوند</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">در حال دریافت...</td>
              </tr>
            ) : chains.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">هیچ زنجیره‌ای ثبت نشده است.</td>
              </tr>
            ) : (
              chains.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{c.id}</td>
                  <td className="py-3 px-4 font-medium text-white">کاربر #{c.user_id}</td>
                  <td className="py-3 px-4 font-mono text-rose-400 font-bold">کاربر #{c.referrer_id}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("fa-IR") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
