"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Clock, Calendar, ArrowRight, Tag, Flame, User } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function ArticlesPage() {
  const { t, n, lang } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const articles = [
    {
      slug: "ps5-pro-enhanced-analysis",
      titleFa: "بررسی جامع عملکرد بازی‌ها روی کنسول PS5 Pro و فناوری PSSR",
      titleEn: "PS5 Pro Performance Deep Dive: PSSR & Advanced Ray Tracing",
      excerptFa: "کنسول میان‌نسلی سونی چگونه بازی‌های بزرگ نظیر Final Fantasy VII Rebirth و Alan Wake 2 را متحول کرده است؟",
      excerptEn: "How Sony's mid-gen refresh enhances flagship titles with high framerates and clean upscaling.",
      author: "تیم تحریریه دکتر گیم",
      dateFa: "۲ آبان ۱۴۰۵",
      dateEn: "Oct 24, 2026",
      readTimeFa: "۶ دقیقه مطالعه",
      readTimeEn: "6 min read",
      category: "سخت‌افزار و لوازم جانبی",
      image: "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
    },
    {
      slug: "goldhen-ps4-1100-guide",
      titleFa: "آموزش کامل جیلبریک PS4 فریم‌ورک ۱۱.۰۰ با روش PPPwn",
      titleEn: "Complete PS4 11.00 Jailbreak Guide using PPPwn C++",
      excerptFa: "راهنمای اتصال کابل اترنت LAN، ارسال پکت‌های PPPoE و اجرای بدون باگ پکیج‌های FPKG.",
      excerptEn: "Step-by-step ethernet LAN packet injection and FPKG package installation.",
      author: "واحد مهندسی نرم‌افزار",
      dateFa: "۲۸ مهر ۱۴۰۵",
      dateEn: "Oct 20, 2026",
      readTimeFa: "۸ دقیقه مطالعه",
      readTimeEn: "8 min read",
      category: "آموزش‌های تخصصی جیلبریک",
      image: "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
    },
    {
      slug: "dualsense-drift-prevention",
      titleFa: "راهنمای پیشگیری و کالیبراسیون دریفت شوک‌های آنالوگ دسته DualSense",
      titleEn: "DualSense Stick Drift Prevention & Deadzone Calibration",
      excerptFa: "بررسی دلایل فرسایش پتانسیومترها و نحوه سنجش ددزون با ابزارهای تست WebHID دکتر گیم.",
      excerptEn: "Understanding potentiometer wear and calibrating deadzones via WebHID diagnostic tools.",
      author: "مهندسی سخت‌افزار",
      dateFa: "۲۵ مهر ۱۴۰۵",
      dateEn: "Oct 17, 2026",
      readTimeFa: "۵ دقیقه مطالعه",
      readTimeEn: "5 min read",
      category: "راهنما و ترفندهای کنسول",
      image: "https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg",
    },
    {
      slug: "best-coop-games-2026",
      titleFa: "بهترین بازی‌های کوآپ و دونفره خانوادگی برای پلی‌استیشن ۵",
      titleEn: "Top Co-op & Multiplayer Games on PlayStation 5",
      excerptFa: "معرفی عناوین سرگرم‌کننده چندنفره محلی (Split-Screen) با پشتیبانی کامل از بازخورد لمسی کنترلر.",
      excerptEn: "Curated local split-screen multiplayer games supporting DualSense haptic feedback.",
      author: "آرمان رحیمی",
      dateFa: "۲۱ مهر ۱۴۰۵",
      dateEn: "Oct 13, 2026",
      readTimeFa: "۷ دقیقه مطالعه",
      readTimeEn: "7 min read",
      category: "نقد و بررسی تخصصی بازی‌ها",
      image: "https://media.rawg.io/media/games/618/618c204facf0e8da3719859ec7680224.jpg",
    },
  ];

  const categories = [
    { id: "ALL", name: "همه مقالات", count: 48 },
    { id: "اخبار دنیای گیم", name: "اخبار دنیای گیم", count: 18 },
    { id: "راهنما و ترفندهای کنسول", name: "راهنما و ترفندهای کنسول", count: 12 },
    { id: "آموزش‌های تخصصی جیلبریک", name: "آموزش‌های تخصصی جیلبریک", count: 9 },
    { id: "نقد و بررسی تخصصی بازی‌ها", name: "نقد و بررسی تخصصی بازی‌ها", count: 5 },
    { id: "سخت‌افزار و لوازم جانبی", name: "سخت‌افزار و لوازم جانبی", count: 4 },
  ];

  const tags = ["#PS5_Pro", "#GoldHEN", "#DualSense", "#GTA_VI", "#PSSR", "#Jailbreak"];

  const filteredArticles = articles.filter((a) => {
    const matchesCat = selectedCategory === "ALL" || a.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      a.titleFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.titleEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-10">
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
            <BookOpen className="w-4 h-4" />
            <span>{t("دانشنامه و وبلاگ تحلیلی دکتر گیم", "DrGame Engineering Blog & Guides")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            {t("مقالات، اخبار و راهنماهای تخصصی کنسول", "Console Articles, News & Engineering Guides")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {t(
              "جدیدترین تحلیل‌های سخت‌افزاری کنسول‌های سونی، آموزش‌های جامع فریم‌ورک و مقالات راهنمای بازی‌ها.",
              "In-depth hardware reviews, jailbreak guides, and gaming engineering analysis."
            )}
          </p>
        </div>

        {/* 
          Fixed Physical Layout (Section 6.1 & 7.8):
          Macro layout container is dir="ltr":
          [Left/Center: Articles Grid 1fr] [Right: 300px Category Sidebar]
        */}
        <div
          dir="ltr"
          className="flex flex-col lg:flex-row items-start gap-8 w-full"
        >
          {/* Main Articles Grid (Left/Center Column - 1fr) */}
          <main
            dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
            className="flex-1 min-w-0 w-full space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((art) => (
                <article
                  key={art.slug}
                  className="rounded-3xl border border-white/10 bg-[#151722] overflow-hidden shadow-xl hover:border-orange-500/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={art.image}
                        alt={art.titleFa}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-orange-400 border border-orange-500/30">
                        {art.category}
                      </span>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{t(art.dateFa, art.dateEn)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          <span>{t(art.readTimeFa, art.readTimeEn)}</span>
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                        {t(art.titleFa, art.titleEn)}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {t(art.excerptFa, art.excerptEn)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">{art.author}</span>
                    <Link
                      href={`/articles/${art.slug}`}
                      className="flex items-center gap-1 font-bold text-orange-400 hover:text-orange-300"
                    >
                      <span>{t("مطالعه کامل", "Read Article")}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* Physical Right Sidebar (Fixed 300px in ALL languages) */}
          <aside
            dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
            className="w-full lg:w-[300px] shrink-0 space-y-6"
          >
            {/* 1. Article Search Box */}
            <div className="rounded-2xl border border-white/10 bg-[#151722] p-4 shadow-xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("جستجو در مقالات...", "Search articles...")}
                  className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* 2. Topic Categories with Counters */}
            <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-3">
              <h3 className="font-extrabold text-sm text-white pb-2 border-b border-white/10">
                {t("دسته‌بندی‌های موضوعی", "Article Categories")}
              </h3>
              <div className="space-y-1.5 text-xs">
                {categories.map((c) => {
                  const active = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition-all ${
                        active
                          ? "bg-orange-600 text-white font-bold"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>{c.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          active ? "bg-black/30 text-white" : "bg-white/5 text-slate-400"
                        }`}
                      >
                        {n(c.count)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Popular Tags Cloud */}
            <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-3">
              <h3 className="font-extrabold text-sm text-white pb-2 border-b border-white/10 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-400" />
                <span>{t("برچسب‌های داغ", "Trending Tags")}</span>
              </h3>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {tags.map((tg) => (
                  <span
                    key={tg}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors font-mono text-[11px]"
                  >
                    {tg}
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Most Read Articles of the Week */}
            <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-3">
              <h3 className="font-extrabold text-sm text-white pb-2 border-b border-white/10 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>{t("داغ‌ترین مقالات هفته", "Most Read This Week")}</span>
              </h3>
              <div className="space-y-2.5">
                {articles.slice(0, 3).map((a) => (
                  <Link
                    key={a.slug}
                    href={`/articles/${a.slug}`}
                    className="group block p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all space-y-1"
                  >
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-orange-400 line-clamp-2">
                      {a.titleFa}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {a.dateFa}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Page>
  );
}
