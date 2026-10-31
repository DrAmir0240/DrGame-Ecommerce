'use client';

import React from 'react';
import { BlogCategory } from '@/types/blog';
import { Search, Filter, Flame, Clock, Eye, Layers } from 'lucide-react';
import { useTranslation, DynamicText } from '@/i18n';

const SORT_OPTIONS = [
  { id: 'newest', key: 'blogUI.sort.newest', icon: Clock },
  { id: 'popular', key: 'blogUI.sort.popular', icon: Flame },
  { id: 'views', key: 'blogUI.sort.views', icon: Eye },
];

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
  const { t, locale } = useTranslation();
  return (
    <div className="space-y-6">
      {/* Search Box */}
      <div className="glass-card rounded-3xl border border-white/10 p-5">
        <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-cosmic-purple" />
          <span>{t('blogUI.searchTitle')}</span>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('blogUI.searchPlaceholder')}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-text-muted focus:outline-none focus:border-cosmic-purple"
        />
      </div>

      {/* Sorting Tabs */}
      <div className="glass-card rounded-3xl border border-white/10 p-5 space-y-3">
        <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>{t('blogUI.sortTitle')}</span>
        </span>
        <div className="space-y-1 text-xs">
          {SORT_OPTIONS.map((item) => {
            const Icon = item.icon;
            const active = sort === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSortChange(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-start transition-all ${
                  active
                    ? 'bg-cosmic-purple text-white font-bold shadow-neon-purple'
                    : 'text-text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(item.key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories List */}
      <div className="glass-card rounded-3xl border border-white/10 p-5 space-y-3">
        <span className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{t('blogUI.categoriesTitle')}</span>
        </span>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-start px-3 py-2 rounded-xl transition-all ${
              selectedCategory === ''
                ? 'bg-white/15 text-white font-bold'
                : 'text-text-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            {t('blogUI.allPosts')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-start px-3 py-2 rounded-xl transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`}
            >
              {locale === 'en' && cat.name_en ? (
                cat.name_en
              ) : (
                <DynamicText text={cat.name_fa} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
