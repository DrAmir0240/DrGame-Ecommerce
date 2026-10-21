"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  User,
  Share2,
  BookOpen,
  Tag,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";
import { BLOG_POSTS, BlogPost, DNS_CONFIG } from "@/lib/data";

export default function BlogPostDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const { t, n } = useApp();

  const post = BLOG_POSTS.find((p) => p.slug === slug) ?? BLOG_POSTS[0];
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <Page>
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-16 pt-8">
        {/* Back Link */}
        <div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-fg-2 hover:text-accent-2 transition-colors"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            <span>{t("بازگشت به مقالات بلاگ", "Back to Blog Posts")}</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="rounded-full bg-accent-soft px-3 py-1 font-bold text-accent-2">
              {t(post.category.toUpperCase(), post.category.toUpperCase())}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              <span>{t(post.dateFa, post.dateEn)}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              <span>{n(post.readTimeMin)} {t("دقیقه زمان مطالعه", "min read")}</span>
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-fg md:text-4xl leading-tight">
            {t(post.titleFa, post.titleEn)}
          </h1>

          <div className="flex items-center justify-between border-b border-line pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-xs text-accent-2">
                <User size={16} />
              </div>
              <div>
                <span className="block text-xs font-bold text-fg">
                  {t(post.authorFa, post.authorEn)}
                </span>
                <span className="text-[10px] text-muted">
                  {t("تحریریه فنی و آزمایشگاه دکتر گیم", "DrGame Technical Team")}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(window.location.href);
                  alert(t("لینک مقاله کپی شد!", "Article link copied!"));
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-fg-2 hover:text-fg hover:border-accent-2 transition-colors cursor-pointer"
            >
              <Share2 size={13} />
              <span>{t("اشتراک‌گذاری", "Share")}</span>
            </button>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line shadow-card">
          <img
            src={post.thumbnail}
            alt={post.titleFa}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <article className="prose prose-invert max-w-none text-fg-2 text-sm leading-relaxed flex flex-col gap-6">
          <p className="text-base font-medium text-fg leading-relaxed">
            {t(post.excerptFa, post.excerptEn)}
          </p>

          <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
            <h4 className="flex items-center gap-2 font-bold text-fg text-sm">
              <Wifi size={16} className="text-accent-2" />
              {t("نکته طلایی برای کاربران کنسول", "Pro Tip for PlayStation Gamers")}
            </h4>
            <p className="mt-1 text-xs text-fg-2 leading-relaxed">
              {t(
                `جهت دستیابی به حداکثر سرعت در انتقال دیتای این بازی‌ها، استفاده از DNS نود تهران ۱ (Primary: ${DNS_CONFIG.primary}) را فراموش نکنید تا از قطعی و ارورهای دیتای خراب سونی جلوگیری شود.`,
                `To maximize package download throughput, remember to set Primary DNS to ${DNS_CONFIG.primary} on your console.`
              )}
            </p>
          </div>

          <div className="whitespace-pre-line text-sm leading-relaxed">
            {t(post.contentFa, post.contentEn)}
          </div>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-6">
            <span className="text-xs font-bold text-muted flex items-center gap-1">
              <Tag size={13} />
              {t("برچسب‌ها:", "Tags:")}
            </span>
            {(t("fa", "en") === "fa" ? post.tagsFa : post.tagsEn).map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-fg"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>

        {/* Related Posts */}
        <section className="mt-12 border-t border-line pt-8">
          <SectionTitle>{t("مطالب پیشنهادی و مرتبط", "Related Articles")}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {relatedPosts.map((rel) => (
              <Link
                key={rel.id}
                href={`/blog/${rel.slug}`}
                className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4 hover:border-accent-2 hover:shadow-glow-sm transition-all"
              >
                <img
                  src={rel.thumbnail}
                  alt={rel.titleFa}
                  className="size-20 rounded-lg object-cover shrink-0"
                />
                <div>
                  <h4 className="font-bold text-xs text-fg line-clamp-2 hover:text-accent-2 transition-colors">
                    {t(rel.titleFa, rel.titleEn)}
                  </h4>
                  <span className="text-[11px] text-muted mt-1 block">
                    {n(rel.readTimeMin)} {t("دقیقه مطالعه", "min read")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
