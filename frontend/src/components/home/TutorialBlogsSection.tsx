'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';

interface BlogPostItem {
  id: number;
  title_fa: string;
  title_en?: string;
  slug: string;
  category_name: string;
  category_slug: string;
  cover_image_url: string;
  reading_time_min: number;
  summary: string;
  created_at: string;
}

export default function TutorialBlogsSection() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ items: BlogPostItem[] }>('/blog/posts?page_size=5')
      .then((data) => setPosts(data.items || []))
      .catch((err) => console.error('Failed to load tutorial blog posts:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 my-4">
        <div className="h-80 rounded-3xl bg-[#0c1017] border border-white/5 flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  const featured = posts[0];
  const others = posts.slice(1);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 my-4 font-vazir text-right">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              مقالات و آموزش‌های تخصصی نصب دیتا
            </h2>
            <span className="text-xs text-slate-400 hidden sm:inline">
              راهنماهای گام‌به‌گام انتقال بدون دردسر دیتا به کنسول‌های نسل هشتم و نهم
            </span>
          </div>
        </div>

        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span>مشاهده همه آموزش‌ها</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid: 1 Featured Big Card + 4 Compact Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Large Card */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="lg:col-span-6 group relative rounded-3xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all flex flex-col justify-end min-h-[340px] p-6 shadow-xl bg-[#090c13]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url(${featured.cover_image_url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090c13] via-[#090c13]/80 to-transparent" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  {featured.category_name}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{featured.reading_time_min} دقیقه</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
                {featured.title_fa}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {featured.summary}
              </p>
            </div>
          </Link>
        )}

        {/* Compact Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {others.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.slug}`}
              className="group p-4 rounded-2xl bg-[#0c1017] border border-white/10 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-cyan-400 font-bold">{item.category_name}</span>
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.reading_time_min} دقیقه</span>
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-relaxed">
                  {item.title_fa}
                </h4>
              </div>

              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>{formatDate(item.created_at)}</span>
                <span className="group-hover:translate-x-[-2px] transition-transform text-white">
                  مطالعه ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
