"use client";

import React, { useState } from "react";
import { HardDrive, Search, Check, AlertCircle, Clock, Crown, Shield } from "lucide-react";
import { useApp } from "@/lib/app";

interface SubscriptionItem {
  id: string;
  userName: string;
  userEmail: string;
  planName: string;
  planTier: "bronze" | "silver" | "gold";
  quotaTotalGb: number;
  quotaLeftGb: number;
  priceTomans: number;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
}

const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: "SUB-8812",
    userName: "آرمان رحیمی",
    userEmail: "arman@example.com",
    planName: "پلن نقره‌ای ۱ ترابایت",
    planTier: "silver",
    quotaTotalGb: 1024,
    quotaLeftGb: 740,
    priceTomans: 1198000,
    startDate: "۱ مهر ۱۴۰۵",
    endDate: "۱ آبان ۱۴۰۵",
    status: "ACTIVE",
  },
  {
    id: "SUB-8813",
    userName: "رضا محمدی",
    userEmail: "reza.m@gmail.com",
    planName: "پلن طلایی VIP نامحدود",
    planTier: "gold",
    quotaTotalGb: 2252,
    quotaLeftGb: 1820,
    priceTomans: 2988000,
    startDate: "۱۰ مهر ۱۴۰۵",
    endDate: "۱۰ آبان ۱۴۰۵",
    status: "ACTIVE",
  },
  {
    id: "SUB-8814",
    userName: "سارا کیانی",
    userEmail: "sara.kiani@yahoo.com",
    planName: "پلن برنزی ۵۰۰ گیگابایت",
    planTier: "bronze",
    quotaTotalGb: 500,
    quotaLeftGb: 0,
    priceTomans: 698000,
    startDate: "۱ شهریور ۱۴۰۵",
    endDate: "۱ مهر ۱۴۰۵",
    status: "EXPIRED",
  },
  {
    id: "SUB-8815",
    userName: "نوید صادقی",
    userEmail: "navid.s@chmail.ir",
    planName: "پلن نقره‌ای ۱ ترابایت",
    planTier: "silver",
    quotaTotalGb: 1024,
    quotaLeftGb: 910,
    priceTomans: 1198000,
    startDate: "۲۲ مهر ۱۴۰۵",
    endDate: "۲۲ آبان ۱۴۰۵",
    status: "ACTIVE",
  },
];

export const AdminSubscriptionsList: React.FC = () => {
  const { n } = useApp();
  const [subs, setSubs] = useState<SubscriptionItem[]>(DEFAULT_SUBSCRIPTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState("");

  const handleAddBonusQuota = (id: string, bonusGb: number) => {
    setSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, quotaLeftGb: s.quotaLeftGb + bonusGb } : s))
    );
    setFeedback(`سهمیه هدیه +${bonusGb}GB به اشتراک ${id} افزوده شد.`);
    setTimeout(() => setFeedback(""), 3500);
  };

  const filtered = subs.filter((s) => {
    const matchesSearch =
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.planName.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span>لیست اشتراک‌های خریداری شده توسط کاربران (Active Subscriptions)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            سوابق سهمیه ترافیک، تاریخ شروع و انقضا، و ترافیک مصرفی کاربران سامانه
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 font-mono text-xs font-bold border border-purple-500/20">
          اشتراک‌های فعال: {n(subs.filter((s) => s.status === "ACTIVE").length)}
        </span>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو بر اساس نام کاربر، ایمیل، شناسه یا پلن..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {["ALL", "ACTIVE", "EXPIRED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL" ? "همه وضعیت‌ها" : st === "ACTIVE" ? "فعال" : "منقضی شده"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#151722] text-slate-300 border-b border-white/10 font-bold">
            <tr>
              <th className="p-3.5">شناسه و کاربر</th>
              <th className="p-3.5">طرح اشتراک</th>
              <th className="p-3.5">سهمیه ترافیک</th>
              <th className="p-3.5">مبلغ پرداخت</th>
              <th className="p-3.5">بازه اعتبار</th>
              <th className="p-3.5">وضعیت</th>
              <th className="p-3.5 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5">
                  <span className="font-bold text-white block">{s.userName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{s.id} · {s.userEmail}</span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      s.planTier === "gold"
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        : s.planTier === "silver"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {s.planTier === "gold" && <Crown className="w-3 h-3 text-amber-400" />}
                    <span>{s.planName}</span>
                  </span>
                </td>
                <td className="p-3.5">
                  <div className="space-y-1">
                    <span className="font-mono text-slate-200 block">
                      {n(s.quotaLeftGb)} / {n(s.quotaTotalGb)} GB
                    </span>
                    <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, (s.quotaLeftGb / s.quotaTotalGb) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-3.5 font-mono text-slate-200 font-bold">
                  {n(s.priceTomans.toLocaleString())} تومان
                </td>
                <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                  <span>{s.startDate} تا {s.endDate}</span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {s.status === "ACTIVE" ? "فعال" : "منقضی شده"}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleAddBonusQuota(s.id, 50)}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-[11px] transition-colors"
                  >
                    +۵۰GB هدیه
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
