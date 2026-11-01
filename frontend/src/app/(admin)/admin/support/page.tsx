"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Users, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function SupportDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<any>("/admin-support/users?page=1&limit=1").catch(() => ({ total: 0 })),
      apiRequest<any>("/admin-support/tickets?status=open&page=1&limit=1").catch(() => ({ total: 0 })),
    ]).then(([usersRes, ticketsRes]) => {
      setStats({
        totalUsers: usersRes?.total || (Array.isArray(usersRes) ? usersRes.length : 0),
        openTickets: ticketsRes?.total || (Array.isArray(ticketsRes) ? ticketsRes.length : 0),
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      title: "تیکت‌های در انتظار پاسخ",
      value: `${stats.openTickets} تیکت باز`,
      icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
      href: "/admin/support/tickets",
    },
    {
      title: "کاربران ثبت‌نام شده",
      value: `${stats.totalUsers} کاربر`,
      icon: <Users className="w-6 h-6 text-blue-400" />,
      href: "/admin/support/users",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد دپارتمان پشتیبانی و ارتباط با مشتریان</h1>
        <p className="text-xs text-slate-400 mt-1">
          رسیدگی به پیام‌ها و تیکت‌ها، بازبینی پرونده کاربران و تنظیم سهمیه حجم اختصاصی
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-blue-500/40 transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                {c.icon}
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:-translate-x-1 transition-all" />
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
          <h3 className="font-bold text-sm text-white">اقدامات سریع پشتیبانی</h3>
          <p className="text-xs text-slate-400 mt-1">مشاهده آخرین تیکت‌های باز و رسیدگی سریع به سوالات مشترکین</p>
        </div>
        <Link
          href="/admin/support/tickets"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          ورود به تیکت‌ها
        </Link>
      </div>
    </div>
  );
}
