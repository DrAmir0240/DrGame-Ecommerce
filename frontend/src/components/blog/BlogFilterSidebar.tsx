'use client';

import React from 'react';
import { BlogCategory } from '@/types/blog';
import { Search, Filter, Flame, Clock, Eye, Layers } from 'lucide-react';

interface BlogFilterSidebarProps {
  categories: BlogCategory[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
}

export default function BlogFilterSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: BlogFilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Search Box */}
      <div className="glass-card rounded-3xl border border-white/10 p-5">
        <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-cosmic-purple" />
          <span>جستجو در مقالات</span>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="عنوان یا مبحث مورد نظر..."
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-text-muted focus:outline-none focus:border-cosmic-purple"
        />
      </div>

      {/* Sorting Tabs */}
      <div className="glass-card rounded-3xl border border-white/10 p-5 space-y-3">
        <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>مرتب‌سازی بر اساس</span>
        </span>
        <div className="space-y-1 text-xs">
          {[
            { id: 'newest', label: 'تازه‌ترین مقالات', icon: Clock },
            { id: 'popular', label: 'محبوب‌ترین (بیشترین لایک)', icon: Flame },
            { id: 'views', label: 'پربازدیدترین‌ها', icon: Eye },
          ].map((item) => {
            const Icon = item.icon;
            const active = sort === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSortChange(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-right transition-all ${
                  active
                    ? 'bg-cosmic-purple text-white font-bold shadow-neon-purple'
                    : 'text-text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories List */}
      <div className="glass-card rounded-3xl border border-white/10 p-5 space-y-3">
        <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>دسته‌بندی‌های موضوعی</span>
        </span>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-right px-3 py-2 rounded-xl transition-all ${
              selectedCategory === ''
                ? 'bg-white/15 text-white font-bold'
                : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            همه مقالات
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-right px-3 py-2 rounded-xl transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {cat.name_fa}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
