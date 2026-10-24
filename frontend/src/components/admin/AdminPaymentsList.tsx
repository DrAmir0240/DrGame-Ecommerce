"use client";

import React, { useState } from "react";
import { CreditCard, Search, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { useApp } from "@/lib/app";

interface PaymentItem {
  id: string;
  trackingCode: string;
  userName: string;
  userEmail: string;
  amountTomans: number;
  gateway: string;
  paymentMethod: "SHAPARAK" | "CRYPTO_USDT" | "WALLET";
  referenceId: string;
  date: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
}

const DEFAULT_PAYMENTS: PaymentItem[] = [
  {
    id: "PAY-1001",
    trackingCode: "TRK-98124",
    userName: "آرمان رحیمی",
    userEmail: "arman@example.com",
    amountTomans: 1198000,
    gateway: "زیبال (شاپرک)",
    paymentMethod: "SHAPARAK",
    referenceId: "REF-74892109",
    date: "۱ مهر ۱۴۰۵ - ۱۶:۴۰",
    status: "SUCCESS",
  },
  {
    id: "PAY-1002",
    trackingCode: "TRK-98125",
    userName: "رضا محمدی",
    userEmail: "reza.m@gmail.com",
    amountTomans: 2988000,
    gateway: "زرین‌پال",
    paymentMethod: "SHAPARAK",
    referenceId: "REF-88410291",
    date: "۱۰ مهر ۱۴۰۵ - ۲۱:۱۵",
    status: "SUCCESS",
  },
  {
    id: "PAY-1003",
    trackingCode: "TRK-98126",
    userName: "فرزاد حسینی",
    userEmail: "farzad_h@hotmail.com",
    amountTomans: 698000,
    gateway: "تتر (TRC-20)",
    paymentMethod: "CRYPTO_USDT",
    referenceId: "TXID-0x9e88...a41",
    date: "۱۸ مهر ۱۴۰۵ - ۰۲:۱۰",
    status: "FAILED",
  },
  {
    id: "PAY-1004",
    trackingCode: "TRK-98127",
    userName: "نوید صادقی",
    userEmail: "navid.s@chmail.ir",
    amountTomans: 1198000,
    gateway: "زیبال (شاپرک)",
    paymentMethod: "SHAPARAK",
    referenceId: "REF-99210444",
    date: "۲۲ مهر ۱۴۰۵ - ۱۱:۳۰",
    status: "SUCCESS",
  },
];

export const AdminPaymentsList: React.FC = () => {
  const { n } = useApp();
  const [payments] = useState<PaymentItem[]>(DEFAULT_PAYMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
      p.userName.toLowerCase().includes(search.toLowerCase()) ||
      p.referenceId.toLowerCase().includes(search.toLowerCase()) ||
      p.gateway.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <span>لیست تراکنش‌ها و پرداخت‌های کاربران (User Payments)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            سوابق تراکنش‌های درگاه شاپرک، رمزارز و تسویه‌های بانکی در دیتابیس
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 font-mono text-xs font-bold border border-purple-500/20">
          کل تراکنش‌ها: {n(payments.length)}
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو بر اساس کد پیگیری، نام کاربر، شماره ارجاع یا درگاه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {["ALL", "SUCCESS", "FAILED"].map((st) => (
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
              {st === "ALL" ? "همه وضعیت‌ها" : st === "SUCCESS" ? "موفق" : "ناموفق"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#151722] text-slate-300 border-b border-white/10 font-bold">
            <tr>
              <th className="p-3.5">کد رهگیری و کاربر</th>
              <th className="p-3.5">مبلغ (تومان)</th>
              <th className="p-3.5">درگاه پرداخت</th>
              <th className="p-3.5">شماره ارجاع شاپرک</th>
              <th className="p-3.5">تاریخ و ساعت</th>
              <th className="p-3.5 text-center">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5">
                  <span className="font-bold text-white block font-mono">{p.trackingCode}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{p.userName}</span>
                </td>
                <td className="p-3.5 font-mono text-white font-bold text-sm">
                  {n(p.amountTomans.toLocaleString())} تومان
                </td>
                <td className="p-3.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 font-bold border border-white/10">
                    {p.gateway}
                  </span>
                </td>
                <td className="p-3.5 font-mono text-purple-300">{p.referenceId}</td>
                <td className="p-3.5 font-mono text-slate-400 text-[11px]">{p.date}</td>
                <td className="p-3.5 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === "SUCCESS"
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {p.status === "SUCCESS" ? (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span>{p.status === "SUCCESS" ? "پرداخت موفق" : "تراکنش ناموفق"}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
