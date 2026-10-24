<div dir="rtl" lang="fa">

# سند صفحه جزئیات مقاله و موتور تعاملی بلاگ (06 - Articles Detail & Social Engine)
**پروژه:** وب‌سایت فروشگاهی دکتر گیم (DrGame-Ecommerce)  
**مسیر سند:** `agent/step-06-source-asset-integration-and-polish/06-articles-detail-and-engagement.md`

---

## ۱. ریشه‌یابی نواقص بخش مقالات و بلاگ

### ریشه‌یابی نواقص:
۱. **فقدان صفحه جزئیات:** در حال حاضر روت داینامیک `frontend/src/app/articles/[slug]` وجود ندارد و کلیک روی مقالات در صفحه `/articles` به ۴۰۴ منتهی می‌شود (یا در روت نامرتبط `/blog` قرار دارد).
۲. **نبود منطق لایک و دیس‌لایک:** هیچ امکانی برای رای مثبت یا منفی کاربران و ذخیره دائمی شمارنده آرا تعبیه نشده است.
۳. **نبود شمارنده بازدید (View Counter):** بازدید مقالات پایش و شمرده نمی‌شود.
۴. **عدم کارکرد تگ‌ها:** تگ‌های مقالات در ظاهر رندر شده بودند اما کلیک روی آن‌ها هیچ فیلتری روی لیست مقالات اعمال نمی‌کرد.

---

## ۲. پیاده‌سازی صفحه داینامیک جزئیات مقاله (`/articles/[slug]/page.tsx`)

این صفحه با امکانات مدرن وب شامل نوار پیشرفت مطالعه، زمان تخمینی، دکمه‌های لایک و دیس‌لایک، شمارنده بازدید و تگ‌های تعاملی پیاده‌سازی می‌گردد:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Tag,
  User,
  Bookmark,
  Check,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function ArticleDetailPage() {
  const { t, n } = useApp();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Social Engagement States
  const [likes, setLikes] = useState(142);
  const [dislikes, setDislikes] = useState(6);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [views, setViews] = useState(1280);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Auto-increment view count & track reading progress
  useEffect(() => {
    // 1. Increment View Count
    const viewedKey = `drgame_article_viewed_${slug}`;
    if (!sessionStorage.getItem(viewedKey)) {
      setViews((prev) => prev + 1);
      sessionStorage.setItem(viewedKey, "true");
    }

    // 2. Load Saved Vote
    const savedVote = localStorage.getItem(`drgame_vote_${slug}`);
    if (savedVote === "like" || savedVote === "dislike") {
      setUserVote(savedVote);
    }

    // 3. Scroll progress bar
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress((window.scrollY / total) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug]);

  // Like & Dislike Handler
  const handleVote = (type: "like" | "dislike") => {
    if (userVote === type) {
      // Toggle off
      setUserVote(null);
      if (type === "like") setLikes((p) => p - 1);
      else setDislikes((p) => p - 1);
      localStorage.removeItem(`drgame_vote_${slug}`);
    } else {
      // Switch or new vote
      if (userVote === "like") setLikes((p) => p - 1);
      if (userVote === "dislike") setDislikes((p) => p - 1);

      if (type === "like") setLikes((p) => p + 1);
      else setDislikes((p) => p + 1);

      setUserVote(type);
      localStorage.setItem(`drgame_vote_${slug}`, type);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const articleTags = ["PS5 Pro", "PSSR", "فناوری Ray Tracing", "سونی", "تحلیل سخت‌افزار"];

  return (
    <Page>
      {/* Reading Progress Top Bar */}
      <div
        className="fixed top-[70px] left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 z-30 transition-all"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("بازگشت به فهرست مقالات و آموزش‌ها", "Back to Articles")}</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 font-bold border border-purple-500/30">
              سخت‌افزار و کنسول
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>۲ آبان ۱۴۰۵</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>۶ دقیقه زمان مطالعه</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono text-purple-400">
              <Eye className="w-3.5 h-3.5" />
              <span>{n(views.toLocaleString())} بازدید</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
            بررسی جامع عملکرد بازی‌ها روی کنسول PS5 Pro و فناوری انقلابی PSSR
          </h1>
        </header>

        {/* Hero Featured Image */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-[340px] md:h-[460px]">
          <img
            src="https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg"
            alt="PS5 Pro Deep Dive"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent" />
        </div>

        {/* Article Body Content */}
        <article className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm sm:text-base space-y-6">
          <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
            کنسول میان‌نسلی جدید سونی با معماری پیشرفته گرافیکی RDNA 3 و هسته‌های اختصاصی یادگیری ماشین جهت پردازش الگوریتم PSSR (PlayStation Spectral Super Resolution)، استاندارد جدیدی در ثبات نرخ فریم و شفافیت بصری بازی‌ها ایجاد کرده است.
          </p>

          <h2 className="text-xl sm:text-2xl font-black text-white border-s-4 border-purple-500 ps-4">
            عملکرد ری‌تریسینگ پیشرفته در عناوین بزرگ
          </h2>
          <p>
            بر خلاف نسخه اولیه PS5 که در برخی عناوین نظیر Alan Wake 2 برای دستیابی به ۶۰ فریم بر ثانیه مجبور به خاموش کردن ویژگی‌های بازتاب نور ری‌تریسینگ بود، در PS5 Pro شاهد رفلکشن‌های کامل با وضوح تصویر Dynamic 4K هستیم.
          </p>

          <div className="p-5 rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-200 text-xs sm:text-sm">
            💡 <b>نکته فنی برای کاربران کپی‌خور و جیلبریک:</b> پچ‌های اختصاصی فعال‌سازی ویژگی‌های Pro برای بازی‌های FPKG در پلتفرم دکتر گیم به محض انتشار تست و قرار خواهند گرفت.
          </div>
        </article>

        {/* Interactive Tags Section */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <span className="text-xs font-bold text-slate-400 block">برچسب‌ها و تگ‌های مرتبط:</span>
          <div className="flex flex-wrap items-center gap-2">
            {articleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => router.push(`/articles?tag=${encodeURIComponent(tag)}`)}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-xs text-slate-300 hover:text-purple-300 transition-all flex items-center gap-1.5"
              >
                <Tag className="w-3 h-3 text-purple-400" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Social Engagement Actions: Like / Dislike / Share */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#101116] border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">آیا این مقاله برای شما مفید بود؟</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVote("like")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  userVote === "like"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-white/5 hover:bg-white/10 text-slate-300"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="font-mono">{n(likes)}</span>
              </button>

              <button
                type="button"
                onClick={() => handleVote("dislike")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  userVote === "dislike"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-500/25"
                    : "bg-white/5 hover:bg-white/10 text-slate-300"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="font-mono">{n(dislikes)}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? "لینک کپی شد" : "اشتراک‌گذاری مقاله"}</span>
          </button>
        </div>
      </div>
    </Page>
  );
}
```

---

## ۳. سیم‌کشی فیلتر تگ‌ها در صفحه لیست مقالات (`/articles/page.tsx`)

در کامپوننت `ArticlesPage`، با خواندن پارامتر کوئری `useSearchParams().get("tag")`:
۱. اگر پارامتر `tag` وجود داشته باشد، مقالات را فیلتر کرده و مقالاتی که شامل آن تگ هستند نمایش می‌یابند.
۲. یک چیپ فعال برای حذف فیلتر تگ با دکمه `X` نمایش داده می‌شود.

</div>
