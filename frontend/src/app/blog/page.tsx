"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Clock,
  User,
  Tag,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";
import { BLOG_POSTS, BLOG_CATEGORIES, BlogPost } from "@/lib/data";

export default function BlogPage() {
  const { t, n } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchCategory =
      selectedCategory === "all" || post.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === "" ||
      post.titleFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tagsFa.some((tag) => tag.includes(searchQuery)) ||
      post.tagsEn.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const featured = BLOG_POSTS[0];

  return (
    <Page>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pb-12 pt-6">
        {/* Header Section */}
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
          <div className="absolute -end-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-2">
                  <BookOpen size={18} />
                </span>
                <span className="font-latin text-xs font-bold uppercase tracking-wider text-accent-2">
                  DrGame Gaming Chronicles
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-fg md:text-3xl">
                {t("بلاگ تخصصی، اخبار و راهنمای کنسول", "Gaming Blog, News & Console Guides")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-fg-2">
                {t(
                  "تحلیل‌های فنی فریمورهای جدید PS5 و PS4، راهنمای سخت‌افزار و هارد SSD، بررسی بازی‌های روز و مقالات افزایش سرعت شبکه.",
                  "Deep technical dives into PS5/PS4 firmwares, SSD hardware benchmarks, game analyses, and network optimization insights."
                )}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search
                size={16}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder={t("جستجو در مقالات و تگ‌ها...", "Search articles and tags...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface-2 ps-9 pe-4 text-xs font-medium text-fg placeholder:text-muted focus:border-accent-2 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Featured Post Hero */}
        {selectedCategory === "all" && !searchQuery && (
          <section>
            <Link
              href={`/blog/${featured.slug}`}
              className="group relative block overflow-hidden rounded-card border border-line bg-surface transition-all duration-300 hover:border-accent-2 hover:shadow-glow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
                <div className="relative aspect-video lg:aspect-auto lg:h-full lg:col-span-7 overflow-hidden">
                  <img
                    src={featured.thumbnail}
                    alt={featured.titleFa}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-bg via-transparent to-transparent lg:hidden" />
                </div>

                <div className="flex flex-col justify-center gap-4 p-6 lg:p-10 lg:col-span-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent-soft px-3 py-1 font-latin text-[10px] font-bold text-accent-2">
                      {t("مقاله برگزیده", "Featured Article")}
                    </span>
                    <span className="text-xs text-muted">•</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Clock size={12} />
                      <span>{n(featured.readTimeMin)} {t("دقیقه مطالعه", "min read")}</span>
                    </span>
                  </div>

                  <h2 className="text-xl font-black text-fg group-hover:text-accent-2 transition-colors lg:text-2xl">
                    {t(featured.titleFa, featured.titleEn)}
                  </h2>

                  <p className="text-xs text-fg-2 leading-relaxed">
                    {t(featured.excerptFa, featured.excerptEn)}
                  </p>

                  <div className="mt-2 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
                    <span className="font-semibold text-fg">
                      {t(featured.authorFa, featured.authorEn)}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-accent-2">
                      <span>{t("مطالعه مقاله کامل", "Read Full Article")}</span>
                      <ArrowRight size={14} className="rtl:rotate-180" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {BLOG_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-accent-2 text-white shadow-glow-sm"
                    : "border border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg"
                }`}
              >
                {t(cat.nameFa, cat.nameEn)}
              </button>
            );
          })}
        </div>

        {/* Blog Posts Grid */}
        <section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="group flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-accent-2 hover:shadow-glow-sm"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                    <img
                      src={post.thumbnail}
                      alt={post.titleFa}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-3 end-3 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Clock size={11} />
                      <span>{n(post.readTimeMin)} {t("دقیقه", "min")}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 p-5">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-semibold text-accent-2">
                        {t(post.category.toUpperCase(), post.category.toUpperCase())}
                      </span>
                      <span>{t(post.dateFa, post.dateEn)}</span>
                    </div>

                    <Link href={`/blog/${post.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-bold text-fg group-hover:text-accent-2 transition-colors">
                        {t(post.titleFa, post.titleEn)}
                      </h3>
                    </Link>

                    <p className="line-clamp-2 text-xs text-fg-2 leading-relaxed">
                      {t(post.excerptFa, post.excerptEn)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-line p-5 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {(t("fa", "en") === "fa" ? post.tagsFa : post.tagsEn).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center justify-between text-xs font-bold text-accent-2 hover:underline"
                  >
                    <span>{t("مطالعه مطلب", "Read Article")}</span>
                    <ArrowRight size={14} className="rtl:rotate-180" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
