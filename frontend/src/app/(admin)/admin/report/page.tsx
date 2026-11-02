"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  DownloadCloud,
  DollarSign,
  ShieldAlert,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

interface ChartPoint {
  date: string;
  value: number;
}

export default function ReportDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [salesChart, setSalesChart] = useState<ChartPoint[]>([]);
  const [usersChart, setUsersChart] = useState<ChartPoint[]>([]);
  const [downloadsChart, setDownloadsChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Safely extract ChartPoint array from any API response structure
  const normalizeChartData = (res: any, defaultKey = "value"): ChartPoint[] => {
    if (!res) return [];
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.timeline)
      ? res.timeline
      : [];

    if (!Array.isArray(list)) return [];

    return list.map((item: any) => ({
      date: String(item.date || item.day || ""),
      value: Number(
        item[defaultKey] ??
        item.value ??
        item.users ??
        item.count ??
        item.amount ??
        item.revenue ??
        item.gb ??
        0
      ),
    }));
  };

  useEffect(() => {
    Promise.all([
      apiRequest("/admin-report/dashboard-stats").catch(() => null),
      apiRequest("/admin-report/charts/sales?days=14").catch(() => []),
      apiRequest("/admin-report/charts/users?days=14").catch(() => []),
      apiRequest("/admin-report/charts/downloads?days=14").catch(() => []),
    ]).then(([statsRes, salesRes, usersRes, downloadsRes]) => {
      setStats(statsRes);
      setSalesChart(normalizeChartData(salesRes, "value"));
      setUsersChart(normalizeChartData(usersRes, "users"));
      setDownloadsChart(normalizeChartData(downloadsRes, "value"));
      setLoading(false);
    });
  }, []);

  // Simple SVG Line Chart Renderer (Zero dependencies, max performance)
  const renderSvgAreaChart = (rawData: any, strokeColor: string, fillColor: string) => {
    const data: ChartPoint[] = Array.isArray(rawData) ? rawData : [];
    if (!data || data.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center text-slate-500 text-xs">
          داده‌ای برای نمایش این نمودار وجود ندارد.
        </div>
      );
    }

    const width = 500;
    const height = 160;
    const padding = 20;

    const values = data.map((d) => d.value);
    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((d.value - minVal) / range) * (height - 2 * padding);
      return { x, y, value: d.value, date: d.date };
    });

    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id={`grad-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" />

          {/* Fill area */}
          <path d={areaD} fill={`url(#grad-${strokeColor})`} />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3" fill="#0c1017" stroke={strokeColor} strokeWidth="2" className="transition-all hover:r-5" />
            </g>
          ))}
        </svg>

        {/* Labels below chart */}
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-2">
          <span>{data[0]?.date || ""}</span>
          <span>{data[Math.floor(data.length / 2)]?.date || ""}</span>
          <span>{data[data.length - 1]?.date || ""}</span>
        </div>
      </div>
    );
  };

  const statCards = [
    {
      title: "مجموع درآمد پلتفرم",
      value: `${(stats?.total_revenue_toman || 0).toLocaleString()} تومان`,
      icon: <DollarSign className="w-6 h-6 text-purple-400" />,
    },
    {
      title: "کاربران ثبت‌نام شده",
      value: `${(stats?.total_users || 0).toLocaleString()} کاربر`,
      icon: <Users className="w-6 h-6 text-purple-400" />,
    },
    {
      title: "اشتراک‌های فعال",
      value: `${(stats?.active_subscriptions || 0).toLocaleString()} مشترک`,
      icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
    },
    {
      title: "ترافیک دانلود مصرفی",
      value: `${(stats?.total_downloads_gb || 0).toLocaleString()} GB`,
      icon: <DownloadCloud className="w-6 h-6 text-purple-400" />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            داشبورد جامع آمار و گزارش‌های عملکردی
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            چارت‌های بلادرنگ از روند فروش، ثبت‌نام کاربران، دانلودها و سلامت سیستم
          </p>
        </div>

        <Link
          href="/admin/report/audit-logs"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40 transition-all self-start sm:self-auto"
        >
          <ShieldAlert className="w-4 h-4" />
          مشاهده لاگ‌های امنیتی (Audit Logs)
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c) => (
          <div
            key={c.title}
            className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800"
          >
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 w-fit mb-3">
              {c.icon}
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {loading ? "..." : c.value}
            </div>
            <div className="text-xs text-slate-400 mt-1">{c.title}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="font-bold text-sm text-white">روند فروش و درآمد (۱۴ روز اخیر)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">تومان</span>
          </div>
          {renderSvgAreaChart(salesChart, "#10b981", "#10b981")}
        </div>

        {/* Users Growth Chart */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <h3 className="font-bold text-sm text-white">رشد عضویت کاربران جدید (۱۴ روز اخیر)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">تعداد کاربر</span>
          </div>
          {renderSvgAreaChart(usersChart, "#a855f7", "#a855f7")}
        </div>

        {/* Bandwidth / Downloads Chart */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h3 className="font-bold text-sm text-white">حجم ترافیک دانلود مصرفی سرورها (گیگابایت)</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">GB / Day</span>
          </div>
          {renderSvgAreaChart(downloadsChart, "#06b6d4", "#06b6d4")}
        </div>
      </div>
    </div>
  );
}
