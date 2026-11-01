"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, CreditCard, Layers, Tag, ArrowLeft, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function FinanceDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/admin-finance/overview")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setData({
          total_revenue_toman: 0,
          total_transactions: 0,
          active_plans_count: 0,
          active_discounts_count: 0,
        });
        setLoading(false);
      });
  }, []);

  const cards = [
    {
      title: "مجموع درآمد پلتفرم",
      value: `${(data?.total_revenue_toman || 0).toLocaleString()} تومان`,
      icon: <DollarSign className="w-6 h-6 text-amber-400" />,
      href: "/admin/finance/transactions",
    },
    {
      title: "تراکنش‌های موفق",
      value: `${(data?.total_transactions || 0).toLocaleString()} تراکنش`,
      icon: <CreditCard className="w-6 h-6 text-amber-400" />,
      href: "/admin/finance/transactions",
    },
    {
      title: "پلن‌های اشتراک تعریف‌شده",
      value: `${data?.active_plans_count || 0} پلن`,
      icon: <Layers className="w-6 h-6 text-amber-400" />,
      href: "/admin/finance/plans",
    },
    {
      title: "کدهای تخفیف فعال",
      value: `${data?.active_discounts_count || 0} کد`,
      icon: <Tag className="w-6 h-6 text-amber-400" />,
      href: "/admin/finance/discounts",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد دپارتمان مالی و اشتراک</h1>
        <p className="text-xs text-slate-400 mt-1">
          نظارت بر درآمدهای سامانه، گردش تراکنش‌های بانکی، پلن‌های اشتراک و کدهای تخفیف
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                {c.icon}
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all" />
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {loading ? "..." : c.value}
            </div>
            <div className="text-xs text-slate-400 mt-1">{c.title}</div>
          </Link>
        ))}
      </div>

      {/* Grant Manual Subscription Helper Card */}
      <div className="p-6 rounded-2xl bg-[#0c1017] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">اعطای اشتراک دستی به کاربر</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیران مالی با دسترسی کامل می‌توانند برای تایید پرداخت‌های کارت‌به‌کارت مستقیماً اشتراک کاربر را فعال نمایند.
            </p>
          </div>
        </div>
        <Link
          href="/admin/finance/transactions"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white whitespace-nowrap transition-colors"
        >
          مشاهده تراکنش‌ها و اعطای اشتراک
        </Link>
      </div>
    </div>
  );
}
