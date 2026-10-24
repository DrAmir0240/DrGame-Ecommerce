"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { BookOpen, Search, Clock, Calendar, ArrowRight, Tag, Flame, X, User } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";
import { ARTICLES, Article } from "@/data/articles";

function ArticlesContent() {
  const { t, n, lang } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Sync with searchParams
  useEffect(() => {
    const qTag = searchParams.get("tag");
    const qCat = searchParams.get("category");
    if (qTag) setSelectedTag(qTag);
    if (qCat) setSelectedCategory(qCat);
  }, [searchParams]);

  const categories = [
    { id: "ALL", name: "همه مقالات", count: 48 },
    { id: "اخبار دنیای گیم", name: "اخبار دنیای گیم", count: 18 },
    { id: "راهنما و ترفندهای کنسول", name: "راهنما و ترفندهای کنسول", count: 12 },
    { id: "آموزش‌های تخصصی جیلبریک", name: "آموزش‌های تخصصی جیلبریک", count: 9 },
    { id: "نقد و بررسی تخصصی بازی‌ها", name: "نقد و بررسی تخصصی بازی‌ها", count: 5 },
    { id: "سخت‌افزار و لوازم جانبی", name: "سخت‌افزار و لوازم جانبی", count: 4 },
  ];

  const popularTags = ["#PS5_Pro", "#GoldHEN", "#DualSense", "#Jailbreak", "#Hardware", "#PSSR", "#Coop"];

  const filteredArticles = ARTICLES.filter((a) => {
    const matchesCat = selectedCategory === "ALL" || a.category === selectedCategory;
    const matchesTag = !selectedTag || a.tags.includes(selectedTag);
    const matchesQuery =
      !searchQuery.trim() ||
      a.titleFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerptFa.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesTag && matchesQuery;
  });

  const handleSelectTag = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      router.push("/articles");
    } else {
      setSelectedTag(tag);
      router.push(`/articles?tag=${encodeURIComponent(tag)}`);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-10">
      {/* Header Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold">
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

      {/* Active Filter Pill */}
      {selectedTag && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs">
          <Tag className="w-4 h-4 text-purple-400" />
          <span className="text-slate-300">
            {t("فیلتر فعال برچسب:", "Active Tag Filter:")}
          </span>
          <span className="font-mono font-bold text-purple-300">{selectedTag}</span>
          <button
            onClick={() => handleSelectTag(selectedTag)}
            className="ms-auto flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
            <span>{t("حذف فیلتر", "Clear")}</span>
          </button>
        </div>
      )}

      {/* Macro Layout: Left Grid (1fr) + Right Sidebar (300px) */}
      <div dir="ltr" className="flex flex-col lg:flex-row items-start gap-8 w-full">
        {/* Main Articles Grid (Left Column) */}
        <main
          dir={lang === "fa" ? "rtl" : "ltr"}
          className="flex-1 min-w-0 w-full space-y-6"
        >
          {filteredArticles.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-12 text-center space-y-3">
              <p className="text-slate-400 text-sm">مقاله‌ای با این مشخصات یافت نشد.</p>
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                نمایش همه مقالات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((art) => (
                <article
                  key={art.slug}
                  className="rounded-3xl border border-white/10 bg-[#151722] overflow-hidden shadow-xl hover:border-purple-500/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="aspect-[16/9] w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={art.image}
                        alt={art.titleFa}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-bold text-purple-400 border border-purple-500/30">
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
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>{t(art.readTimeFa, art.readTimeEn)}</span>
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                        {t(art.titleFa, art.titleEn)}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {t(art.excerptFa, art.excerptEn)}
                      </p>

                      {/* Tag badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {art.tags.slice(0, 3).map((tg) => (
                          <span
                            key={tg}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-purple-300"
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between text-xs mt-4">
                    <span className="text-slate-400 text-[11px]">{art.author.name}</span>
                    <Link
                      href={`/articles/${art.slug}`}
                      className="flex items-center gap-1 font-bold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <span>{t("مطالعه کامل", "Read Article")}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        {/* Physical Right Sidebar (300px) */}
        <aside
          dir={lang === "fa" ? "rtl" : "ltr"}
          className="w-full lg:w-[300px] shrink-0 space-y-6"
        >
          {/* Search */}
          <div className="rounded-2xl border border-white/10 bg-[#151722] p-4 shadow-xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("جستجو در مقالات...", "Search articles...")}
                className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Categories */}
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
                        ? "bg-purple-600 text-white font-bold"
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

          {/* Popular Tags */}
          <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-white pb-2 border-b border-white/10 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-400" />
              <span>{t("برچسب‌های داغ", "Trending Tags")}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {popularTags.map((tg) => {
                const active = selectedTag === tg;
                return (
                  <button
                    key={tg}
                    onClick={() => handleSelectTag(tg)}
                    className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all ${
                      active
                        ? "bg-purple-600 border-purple-500 text-white font-bold shadow-md shadow-purple-500/20"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    {tg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Most Read Articles */}
          <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-3">
            <h3 className="font-extrabold text-sm text-white pb-2 border-b border-white/10 flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-400" />
              <span>{t("داغ‌ترین مقالات هفته", "Most Read This Week")}</span>
            </h3>
            <div className="space-y-2.5">
              {ARTICLES.slice(0, 3).map((a) => (
                <Link
                  key={a.slug}
                  href={`/articles/${a.slug}`}
                  className="group block p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all space-y-1"
                >
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-400 line-clamp-2">
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
  );
}

export default function ArticlesPage() {
  return (
    <Page>
      <Suspense fallback={<div className="p-8 text-center text-slate-400">در حال بارگذاری مقالات...</div>}>
        <ArticlesContent />
      </Suspense>
    </Page>
  );
}
