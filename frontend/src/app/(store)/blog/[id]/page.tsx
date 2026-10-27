'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/apiClient';
import { BlogPostDetail } from '@/types/blog';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  ArrowRight,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  User,
  Share2,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const idOrSlug = params.id as string;
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [voteLoading, setVoteLoading] = useState(false);

  useEffect(() => {
    async function loadPost() {
      try {
        const data = await apiRequest<BlogPostDetail>(`/blog/posts/${idOrSlug}`);
        setPost(data);
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        setIsLoading(false);
      }
    }
    if (idOrSlug) {
      loadPost();
    }
  }, [idOrSlug]);

  const handleVote = async (action: 'like' | 'dislike') => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!post || voteLoading) return;

    setVoteLoading(true);
    try {
      const res = await apiRequest<{
        status: string;
        current_state: 'like' | 'dislike' | null;
        likes_count: number;
        dislikes_count: number;
      }>(`/blog/posts/${post.id}/${action}`, {
        method: 'POST',
      });

      setPost((prev) =>
        prev
          ? {
              ...prev,
              user_interaction: res.current_state,
              likes_count: res.likes_count,
              dislikes_count: res.dislikes_count,
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to toggle vote:', err);
    } finally {
      setVoteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="h-96 rounded-3xl glass-card animate-pulse border border-white/5" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <BookOpen className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">مقاله مورد نظر پیدا نشد</h2>
        <Link href="/blog" className="text-cosmic-purple text-xs hover:underline">
          بازگشت به مقالات
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به مجله</span>
        </Link>

        <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-cyan-300 font-bold">
          {post.category_name}
        </span>
      </div>

      {/* Hero Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
          {post.title_fa}
        </h1>

        {post.title_en && (
          <span className="block text-xs sm:text-sm text-text-muted font-mono tracking-wider">
            {post.title_en}
          </span>
        )}

        {/* Metadata Bar */}
        <div className="flex items-center gap-4 text-xs text-text-muted border-y border-white/5 py-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-white">
            <User className="w-4 h-4 text-cosmic-purple" />
            <span>{post.author_name}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="font-mono">{new Date(post.created_at).toLocaleDateString('fa-IR')}</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-mono">{post.reading_time_min} دقیقه زمان مطالعه</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-text-muted" />
            <span className="font-mono">{post.views_count.toLocaleString('fa-IR')} بازدید</span>
          </span>
        </div>
      </div>

      {/* Cover Image Banner */}
      <div className="relative w-full aspect-video rounded-3xl overflow-hidden glass-card border border-white/10 shadow-2xl">
        <img
          src={post.cover_image_url}
          alt={post.title_fa}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-oled via-transparent to-transparent" />
      </div>

      {/* Main Content Body */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-10 leading-relaxed text-sm sm:text-base text-text-secondary space-y-6">
        <p className="whitespace-pre-line leading-loose text-white/90">
          {post.content_fa}
        </p>
      </div>

      {/* Interactive Voting Bar (Green Like / Red Dislike) */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">آیا این مقاله برای شما مفید بود؟</h4>
          <p className="text-xs text-text-muted">با ثبت نظر خود به ارتقای محتوای دیتابیس دکتر گیم کمک کنید.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Like Button */}
          <button
            onClick={() => handleVote('like')}
            disabled={voteLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all text-xs font-bold ${
              post.user_interaction === 'like'
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'glass-card border-white/10 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>مفید بود ({post.likes_count.toLocaleString('fa-IR')})</span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={() => handleVote('dislike')}
            disabled={voteLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all text-xs font-bold ${
              post.user_interaction === 'dislike'
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                : 'glass-card border-white/10 text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>نیاز به تکمیل ({post.dislikes_count.toLocaleString('fa-IR')})</span>
          </button>
        </div>
      </div>
    </article>
  );
}
