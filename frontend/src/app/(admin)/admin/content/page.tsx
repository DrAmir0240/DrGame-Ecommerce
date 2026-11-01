"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Tags, Newspaper, Sliders, Users, PlusCircle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function ContentDashboardPage() {
  const [stats, setStats] = useState({
    gamesCount: 0,
    genresCount: 0,
    blogsCount: 0,
    bannersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<any[]>("/admin-content/games?page=1&limit=1").catch(() => ({ total: 0 })),
      apiRequest<any[]>("/admin-content/genres").catch(() => []),
      apiRequest<any[]>("/admin-content/blogs?page=1&limit=1").catch(() => ({ total: 0 })),
      apiRequest<any[]>("/admin-content/banners").catch(() => []),
    ]).then(([gamesRes, genresRes, blogsRes, bannersRes]) => {
      setStats({
        gamesCount: Array.isArray(gamesRes) ? gamesRes.length : (gamesRes?.total || 0),
        genresCount: Array.isArray(genresRes) ? genresRes.length : 0,
        blogsCount: Array.isArray(blogsRes) ? blogsRes.length : (blogsRes?.total || 0),
        bannersCount: Array.isArray(bannersRes) ? bannersRes.length : 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { title: "کاتالوگ بازی‌ها", count: stats.gamesCount, href: "/admin/content/games", icon: <Gamepad2 className="w-6 h-6 text-emerald-400" /> },
    { title: "ژانرهای ثبت‌شده", count: stats.genresCount, href: "/admin/content/genres", icon: <Tags className="w-6 h-6 text-emerald-400" /> },
    { title: "مقالات وبلاگ", count: stats.blogsCount, href: "/admin/content/blogs", icon: <Newspaper className="w-6 h-6 text-emerald-400" /> },
    { title: "بنرهای فعال", count: stats.bannersCount, href: "/admin/content/banners", icon: <Sliders className="w-6 h-6 text-emerald-400" /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">داشبورد دپارتمان محتوا و کاتالوگ</h1>
        <p className="text-xs text-slate-400 mt-1">
          مدیریت کلیه بازی‌ها، پارت‌های دانلودی، ژانرها، بنرهای تبلیغاتی و مقالات تحلیلی پلتفرم
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                {c.icon}
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-1 transition-all" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {loading ? "..." : c.count}
            </div>
            <div className="text-xs text-slate-400 mt-1">{c.title}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-2xl bg-[#0c1017] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          دسترسی‌های سریع دپارتمان محتوا
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/content/games"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            مدیریت و افزودن بازی جدید
          </Link>
          <Link
            href="/admin/content/blogs"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            انتشار مقاله در وبلاگ
          </Link>
          <Link
            href="/admin/content/banners"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            تنظیم بنرهای اسلایدر صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
