"use client";

import React from "react";
import Link from "next/link";
import { HardDrive, Crown, Star, Flame, Sparkles, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/app";
import { USER } from "@/lib/data";

export const ShopRightSidebar: React.FC = () => {
  const { t, n } = useApp();

  const top5Games = [
    { rank: 1, title: "God of War Ragnarök", score: 9.6, badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30", slug: "god-of-war" },
    { rank: 2, title: "Elden Ring", score: 9.5, badgeColor: "text-slate-300 bg-slate-500/10 border-slate-500/30", slug: "elden-ring" },
    { rank: 3, title: "Red Dead Redemption 2", score: 9.7, badgeColor: "text-amber-600 bg-amber-600/10 border-amber-600/30", slug: "red-dead-redemption-2" },
    { rank: 4, title: "Cyberpunk 2077", score: 9.2, badgeColor: "text-slate-400 bg-white/5 border-white/10", slug: "cyberpunk-2077" },
    { rank: 5, title: "Spider-Man 2", score: 9.1, badgeColor: "text-slate-400 bg-white/5 border-white/10", slug: "spider-man-2" },
  ];

  const categories = [
    { titleFa: "همه بازی‌ها", titleEn: "All Games", count: 1248 },
    { titleFa: "داستانی و ماجراجویی", titleEn: "Story & Adventure", count: 320 },
    { titleFa: "رقابتی و آنلاین", titleEn: "Competitive & Online", count: 215 },
    { titleFa: "جهان‌باز", titleEn: "Open World", count: 180 },
    { titleFa: "انحصاری کنسول سونی", titleEn: "Console Exclusive", count: 95 },
    { titleFa: "بازی‌های مستقل شاخص", titleEn: "Indie Gems", count: 140 },
  ];

  return (
    <aside className="w-full lg:w-[300px] shrink-0 space-y-5">
      {/* 1. Subscription & Quota Box */}
      <div className="bg-[#151722] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">
              {USER.plan === "silver" ? t("اشتراک نقره‌ای فعال", "Active Silver Plan") : t("اشتراک کاربر", "User Plan")}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {USER.renewsFa}
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">{t("سهمیه دانلود باقی‌مانده:", "Remaining Quota:")}</span>
            <span className="font-mono font-bold text-white">
              {n(USER.quotaLeftGb)} / {n(USER.quotaTotalGb)} GB
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              style={{ width: `${(USER.quotaLeftGb / USER.quotaTotalGb) * 100}%` }}
            />
          </div>
        </div>

        <Link
          href="/subscriptions"
          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
        >
          <span>{t("ارتقا یا تمدید اشتراک", "Upgrade / Renew Plan")}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {/* 2. Top 5 of the Week (games.jpg specification) */}
      <div className="bg-[#151722] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="font-extrabold text-sm text-white">
            {t("برترین‌های هفته", "Top 5 of the Week")}
          </h3>
        </div>

        <div className="space-y-2">
          {top5Games.map((item) => (
            <Link
              key={item.slug}
              href={`/shop/${item.slug}`}
              className="group flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 font-mono ${item.badgeColor}`}
                >
                  {item.rank}
                </span>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-orange-400 truncate">
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-yellow-400 shrink-0 ps-2">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span>{item.score}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Fast Categories with Counters */}
      <div className="bg-[#151722] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="font-extrabold text-sm text-white pb-2 border-b border-white/10">
          {t("دسته‌بندی‌های کاتالوگ", "Catalog Categories")}
        </h3>
        <div className="space-y-1.5 text-xs">
          {categories.map((c, idx) => (
            <Link
              key={idx}
              href="/shop"
              className="flex items-center justify-between py-1.5 px-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>{t(c.titleFa, c.titleEn)}</span>
              <span className="font-mono text-[11px] text-slate-400 px-2 py-0.5 rounded-full bg-white/5">
                {n(c.count)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Special Offer Banner Card */}
      <div className="relative overflow-hidden rounded-2xl border border-pink-500/40 bg-gradient-to-br from-[#2b1020] via-[#1a1226] to-[#151722] p-5 shadow-xl group">
        <div className="flex items-center justify-between mb-3">
          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-extrabold uppercase border border-pink-500/30">
            {t("پیشنهاد ویژه", "Special Offer")}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white text-xs font-extrabold shadow-sm">
            -35%
          </span>
        </div>

        <h4 className="text-sm font-extrabold text-white mb-1">
          Cyberpunk 2077: Phantom Liberty
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {t("بسته الحاقی فانتوم لیبرتی با دوبله و زیرنویس فارسی آماده دریافت مستقیم.", "DLC expansion with low-latency edge caching.")}
        </p>

        <Link
          href="/shop/cyberpunk-2077"
          className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/30 transition-all"
        >
          <span>{t("مشاهده بسته الحاقی", "View DLC Pack")}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </aside>
  );
};

export default ShopRightSidebar;
