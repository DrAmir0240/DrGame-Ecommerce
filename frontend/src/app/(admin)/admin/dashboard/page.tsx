"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Layers,
  Grid,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  Activity,
  CheckCircle,
} from "lucide-react";
import { AdminDashboardStats } from "@/types/admin";
import { apiRequest } from "@/lib/apiClient";
import { useTranslation } from "@/i18n";

export default function AdminDashboardPage() {
  const { t, n, price } = useTranslation();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest<AdminDashboardStats>("/admin/stats");
        setStats(data);
      } catch (err: any) {
        setError(err.message || t("admin.dashboard.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: t("admin.dashboard.cards.users"),
      value: stats ? n(stats.total_users) : n(0),
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      bg: "from-cyan-500/10 to-transparent",
      border: "border-cyan-500/20",
      link: "/admin/users",
    },
    {
      title: t("admin.dashboard.cards.activeSubscriptions"),
      value: stats ? n(stats.active_subscriptions) : n(0),
      icon: <Layers className="w-6 h-6 text-emerald-400" />,
      bg: "from-emerald-500/10 to-transparent",
      border: "border-emerald-500/20",
      link: "/admin/subscriptions",
    },
    {
      title: t("admin.dashboard.cards.games"),
      value: stats ? n(stats.total_games) : n(0),
      icon: <Grid className="w-6 h-6 text-purple-400" />,
      bg: "from-purple-500/10 to-transparent",
      border: "border-purple-500/20",
      link: "/admin/games",
    },
    {
      title: t("admin.dashboard.cards.pendingPayouts"),
      value: stats ? n(stats.pending_payouts) : n(0),
      icon: <CreditCard className="w-6 h-6 text-amber-400" />,
      bg: "from-amber-500/10 to-transparent",
      border: "border-amber-500/20",
      link: "/admin/payouts",
    },
    {
      title: t("admin.dashboard.cards.totalRevenue"),
      value: stats ? price(stats.total_revenue_toman) : price(0),
      icon: <DollarSign className="w-6 h-6 text-emerald-400" />,
      bg: "from-emerald-500/10 to-cyan-500/5",
      border: "border-emerald-500/30",
      link: "/admin/finance",
      colSpan: "md:col-span-2",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{t("admin.dashboard.title")}</h1>
          <p className="text-xs text-slate-400">
            {t("admin.dashboard.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("admin.dashboard.coreStatus")}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.link}
            className={`p-6 rounded-3xl bg-gradient-to-br ${card.bg} bg-[#0c1017] border ${card.border} hover:border-slate-600 transition-all hover:translate-y-[-2px] group relative overflow-hidden ${
              card.colSpan || ""
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/50 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-white">
                {loading ? (
                  <div className="w-20 h-7 bg-slate-800 rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              {t("admin.dashboard.quickActions.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/admin/users"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("admin.dashboard.quickActions.users.title")}</div>
                <div className="text-[11px] text-slate-400">{t("admin.dashboard.quickActions.users.description")}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              href="/admin/payouts"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("admin.dashboard.quickActions.payouts.title")}</div>
                <div className="text-[11px] text-slate-400">{t("admin.dashboard.quickActions.payouts.description")}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              href="/admin/games"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/40 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("admin.dashboard.quickActions.games.title")}</div>
                <div className="text-[11px] text-slate-400">{t("admin.dashboard.quickActions.games.description")}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </Link>

            <Link
              href="/admin/subscriptions"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 mb-0.5">{t("admin.dashboard.quickActions.freeGames.title")}</div>
                <div className="text-[11px] text-slate-400">{t("admin.dashboard.quickActions.freeGames.description", { count: n(5) })}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Security & System Info Box */}
        <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              {t("admin.dashboard.security.title")}
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">{t("admin.dashboard.security.authLevel")}</span>
              <span className="text-emerald-400 font-mono">Isolated Admin JWT</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">{t("admin.dashboard.security.quotaCache")}</span>
              <span className="text-slate-200 font-mono">Redis Standalone</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
              <span className="text-slate-400">{t("admin.dashboard.security.database")}</span>
              <span className="text-slate-200 font-mono">PostgreSQL 16 Async</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400">{t("admin.dashboard.security.commissionEngine")}</span>
              <span className="text-cyan-400 font-mono">79/21 Halving Pool</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
