"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Calendar,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Tag,
  Check,
  BookOpen,
  ChevronLeft,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";
import { ARTICLES, Article } from "@/data/articles";

export default function ArticleDetailPage() {
  const { t, n, lang } = useApp();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const article = ARTICLES.find((a) => a.slug === slug) || ARTICLES[0];

  // Reading progress bar
  const [readingProgress, setReadingProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Likes & Dislikes state with localStorage
  const [likes, setLikes] = useState(article.likes);
  const [dislikes, setDislikes] = useState(article.dislikes);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(`drgame_article_vote_${article.slug}`);
      if (savedVote === "like" || savedVote === "dislike") {
        setUserVote(savedVote);
      }
    } catch (e) {}
  }, [article.slug]);

  const handleVote = (type: "like" | "dislike") => {
    if (userVote === type) {
      // Toggle off
      setUserVote(null);
      if (type === "like") setLikes((v) => v - 1);
      if (type === "dislike") setDislikes((v) => v - 1);
      try {
        localStorage.removeItem(`drgame_article_vote_${article.slug}`);
      } catch (e) {}
    } else {
      if (userVote === "like") setLikes((v) => v - 1);
      if (userVote === "dislike") setDislikes((v) => v - 1);

      setUserVote(type);
      if (type === "like") setLikes((v) => v + 1);
      if (type === "dislike") setDislikes((v) => v + 1);

      try {
        localStorage.setItem(`drgame_article_vote_${article.slug}`, type);
      } catch (e) {}
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const relatedArticles = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);
  const content = lang === "fa" ? article.contentFa : article.contentEn;

  return (
    <Page>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-purple-400 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>{t("بازگشت به همه مقالات", "Back to Articles")}</span>
          </Link>
          <span className="text-xs text-purple-400 font-mono px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            {article.category}
          </span>
        </div>

        {/* Header Block */}
        <header className="space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
            {t(article.titleFa, article.titleEn)}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t(article.excerptFa, article.excerptEn)}
          </p>

          {/* Metadata & Author Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/10 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
              />
              <div>
                <h4 className="font-bold text-white text-xs">{article.author.name}</h4>
                <p className="text-[11px] text-slate-400">{article.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>{t(article.dateFa, article.dateEn)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{t(article.readTimeFa, article.readTimeEn)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>{n(article.views)} {t("بازدید", "views")}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-[21/9] w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40">
          <img
            src={article.image}
            alt={article.titleFa}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <article className="space-y-8 text-slate-200 text-sm md:text-base leading-loose">
          {content.map((sec, idx) => (
            <section key={idx} className="space-y-4">
              {sec.heading && (
                <h2 className="text-xl md:text-2xl font-extrabold text-white pt-4 pb-2 border-b border-white/10 flex items-center gap-2">
                  <span className="w-2 h-6 bg-purple-500 rounded-full inline-block" />
                  <span>{sec.heading}</span>
                </h2>
              )}
              {sec.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-slate-300 text-justify">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </article>

        {/* Tags & Action Bar */}
        <div className="pt-6 border-t border-white/10 space-y-6">
          {/* Clickable Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>{t("برچسب‌ها:", "Tags:")}</span>
            </span>
            {article.tags.map((tg) => (
              <button
                key={tg}
                onClick={() => router.push(`/articles?tag=${encodeURIComponent(tg)}`)}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-purple-300 text-xs font-mono transition-all"
              >
                {tg}
              </button>
            ))}
          </div>

          {/* Social Feedback Bar: Like, Dislike, Share */}
          <div className="p-4 rounded-2xl bg-[#151722] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline">
                {t("آیا این مقاله برای شما مفید بود؟", "Was this article helpful?")}
              </span>
              <button
                onClick={() => handleVote("like")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  userVote === "like"
                    ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{n(likes)}</span>
              </button>
              <button
                onClick={() => handleVote("dislike")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  userVote === "dislike"
                    ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{n(dislikes)}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t("لینک کپی شد!", "Copied!")}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t("اشتراک‌گذاری", "Share")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Related Articles */}
        <section className="space-y-4 pt-8 border-t border-white/10">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span>{t("سایر مقالات پیشنهادی دکتر گیم", "Related Articles")}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/articles/${rel.slug}`}
                className="group rounded-2xl border border-white/10 bg-[#151722] overflow-hidden hover:border-purple-500/40 transition-all flex flex-col justify-between p-4 space-y-3"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/40">
                  <img
                    src={rel.image}
                    alt={rel.titleFa}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                  {t(rel.titleFa, rel.titleEn)}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{t(rel.readTimeFa, rel.readTimeEn)}</span>
                  <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 text-purple-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
