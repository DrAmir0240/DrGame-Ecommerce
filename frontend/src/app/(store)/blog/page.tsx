'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { BlogPostCard, BlogPostListResponse, BlogCategory } from '@/types/blog';
import BlogCard from '@/components/blog/BlogCard';
import BlogFilterSidebar from '@/components/blog/BlogFilterSidebar';
import { BookOpen, Sparkles } from 'lucide-react';

export default function BlogCatalogPage() {
  const [posts, setPosts] = useState<BlogPostCard[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories once
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await apiRequest<BlogCategory[]>('/blog/categories');
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch posts on filters change
  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.set('category', selectedCategory);
        if (search.trim()) queryParams.set('search', search.trim());
        if (sort) queryParams.set('sort', sort);
        queryParams.set('page', String(page));
        queryParams.set('page_size', '12');

        const res = await apiRequest<BlogPostListResponse>(`/blog/posts?${queryParams.toString()}`);
        setPosts(res.items);
        setTotal(res.total);
      } catch (err) {
        console.error('Failed to load posts:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPosts();
  }, [selectedCategory, search, sort, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cosmic-purple/10 border border-cosmic-purple/30 text-cosmic-purple text-xs font-bold">
          <BookOpen className="w-4 h-4" />
          <span>مجله و پایگاه دانش دکتر گیم</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          اخبار، نقد و آموزش‌های تخصصی کنسول
        </h1>
        <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
          جدیدترین راهنماهای انتقال دیتای بازی‌ها، فریمورهای کپی‌خور و تحلیل عناوین روز دنیای گیمینگ توسط تیم تحریریه دکتر گیم.
        </p>
      </div>

      {/* Main Grid: Sidebar + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BlogFilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(slug) => {
              setSelectedCategory(slug);
              setPage(1);
            }}
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(s) => {
              setSort(s);
              setPage(1);
            }}
          />
        </div>

        {/* Posts Grid */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-[5/6] rounded-3xl glass-card animate-pulse border border-white/5" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card rounded-3xl border border-white/10 p-12 text-center text-text-muted text-xs">
              مقاله‌ای با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {Math.ceil(total / 12) > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl glass-card border border-white/10 text-xs text-white disabled:opacity-40"
              >
                صفحه قبل
              </button>
              <span className="text-xs text-text-muted font-mono">
                صفحه {page} از {Math.ceil(total / 12)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 12)}
                className="px-4 py-2 rounded-xl glass-card border border-white/10 text-xs text-white disabled:opacity-40"
              >
                صفحه بعد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
