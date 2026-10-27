'use client';

import React from 'react';
import Link from 'next/link';
import { BlogPostCard } from '@/types/blog';
import { Clock, Eye, ThumbsUp, ArrowLeft } from 'lucide-react';

interface BlogCardProps {
  post: BlogPostCard;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug || post.id}`}
      className="group relative rounded-3xl overflow-hidden glass-card border border-white/10 hover:border-cosmic-purple/50 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 shadow-lg"
    >
      <div>
        {/* 5:6 Aspect Ratio Container */}
        <div className="relative w-full aspect-[5/6] overflow-hidden bg-surface-card">
          <img
            src={post.cover_image_url}
            alt={post.title_fa}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-oled via-oled/60 to-transparent" />

          {/* Category Badge & Reading Time */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold text-cyan-300">
              {post.category_name}
            </span>

            <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{post.reading_time_min} دقیقه</span>
            </span>
          </div>

          {/* Bottom Card Content */}
          <div className="absolute bottom-0 inset-x-0 p-4 space-y-2 text-right">
            <h3 className="text-sm sm:text-base font-black text-white group-hover:text-cosmic-purple transition-colors line-clamp-2 leading-snug">
              {post.title_fa}
            </h3>

            <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
              {post.summary}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-text-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{post.views_count}</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ThumbsUp className="w-3 h-3" />
                  <span>{post.likes_count}</span>
                </span>
              </div>

              <span className="font-mono">
                {new Date(post.created_at).toLocaleDateString('fa-IR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
