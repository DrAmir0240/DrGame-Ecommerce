"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Share2, CreditCard, Landmark, DollarSign, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function ReferralDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest("/admin-referral/chains?page=1&limit=1").catch(() => ({ total: 0 })),
      apiRequest("/admin-referral/payouts?status=PENDING&page=1&limit=1").catch(() => ({ total: 0 })),
      apiRequest("/admin-referral/settlement-accounts?page=1&limit=1").catch(() => ({ total: 0 })),
    ]).then(([chainsRes, payoutsRes, accountsRes]) => {
      setData({
        totalChains: chainsRes?.total || (Array.isArray(chainsRes) ? chainsRes.length : 0),
        pendingPayouts: payoutsRes?.total || (Array.isArray(payoutsRes) ? payoutsRes.length : 0),
        totalAccounts: accountsRes?.total || (Array.isArray(accountsRes) ? accountsRes.length : 0),
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      title: "درخواست‌های تسویه در انتظار",
      value: `${data?.pendingPayouts || 0} درخواست`,
      icon: <CreditCard className="w-6 h-6 text-rose-400" />,
      href: "/admin/referral/payouts",
    },
    {
      title: "زنجیره‌های رفرال فعال",
      value: `${data?.totalChains || 0} پیوند`,
      icon: <Share2 className="w-6 h-6 text-rose-400" />,
      href: "/admin/referral/chains",
    },
    {
      title: "حساب‌های بانکی و شبا",
      value: `${data?.totalAccounts || 0} حساب`,
      icon: <Landmark className="w-6 h-6 text-rose-400" />,
      href: "/admin/referral/accounts",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد دپارتمان بازاریابی رفرال و خزانه‌داری</h1>
        <p className="text-xs text-slate-400 mt-1">
          نظارت بر زنجیره‌های دعوت چندسطحی، تسویه پورسانت معرف‌ها و مدیریت استخر پاداش
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-rose-500/40 transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                {c.icon}
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:-translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {loading ? "..." : c.value}
            </div>
            <div className="text-xs text-slate-400 mt-1">{c.title}</div>
          </Link>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#0c1017] border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">بررسی درخواست‌های تسویه حساب</h3>
          <p className="text-xs text-slate-400 mt-1">واریز شبا یا تتر به حساب‌های تایید شده کاربران</p>
        </div>
        <Link
          href="/admin/referral/payouts"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
        >
          ورود به بخش تسویه‌ها
        </Link>
      </div>
    </div>
  );
}
