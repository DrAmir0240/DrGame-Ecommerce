'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Tag,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  Layers,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import {
  AdminBlogPost,
  AdminBlogCategory,
  AdminBlogPostCreate,
  AdminBlogCategoryCreate,
} from '@/types/blog';
import { useTranslation } from '@/i18n';

type TabType = 'posts' | 'categories';

const EMPTY_POST: AdminBlogPostCreate = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  cover_image_url: '',
  category_id: 0,
  reading_time_minutes: 5,
  is_published: true,
};

const EMPTY_CATEGORY: AdminBlogCategoryCreate = {
  name: '',
  slug: '',
  description: '',
};

export default function AdminBlogPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabType>('posts');

  // Posts state
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsSearch, setPostsSearch] = useState('');
  const [postsLoading, setPostsLoading] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<AdminBlogCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);
  const [postForm, setPostForm] = useState<AdminBlogPostCreate>(EMPTY_POST);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminBlogCategory | null>(null);
  const [catForm, setCatForm] = useState<AdminBlogCategoryCreate>(EMPTY_CATEGORY);
  const [savingCat, setSavingCat] = useState(false);

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const searchQ = postsSearch ? `&search=${encodeURIComponent(postsSearch)}` : '';
      const data = await apiRequest<{
        items: AdminBlogPost[];
        total: number;
        page: number;
        page_size: number;
      }>(`/admin/blog/posts?page=${postsPage}&page_size=10${searchQ}`);
      setPosts(data.items || []);
      setPostsTotal(data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch blog posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await apiRequest<AdminBlogCategory[]>('/admin/blog/categories');
      setCategories(data || []);
    } catch (err: any) {
      console.error('Failed to fetch blog categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [postsPage, postsSearch]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const openPostModal = (post?: AdminBlogPost) => {
    if (post) {
      setEditingPost(post);
      setPostForm({
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        content: post.content,
        cover_image_url: post.cover_image_url,
        category_id: post.category_id,
        reading_time_minutes: post.reading_time_minutes,
        is_published: post.is_published,
      });
    } else {
      setEditingPost(null);
      setPostForm(EMPTY_POST);
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingPost) {
        await apiRequest(`/admin/blog/posts/${editingPost.id}`, {
          method: 'PUT',
          body: JSON.stringify(postForm),
        });
      } else {
        await apiRequest('/admin/blog/posts', {
          method: 'POST',
          body: JSON.stringify(postForm),
        });
      }
      setShowModal(false);
      fetchPosts();
    } catch (err: any) {
      setFormError(err.message || 'خطا در ذخیره مقاله');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('آیا از حذف این مقاله اطمینان دارید؟')) return;
    try {
      await apiRequest(`/admin/blog/posts/${id}`, { method: 'DELETE' });
      fetchPosts();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف مقاله');
    }
  };

  const openCatModal = (cat?: AdminBlogCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatForm({
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
      });
    } else {
      setEditingCategory(null);
      setCatForm(EMPTY_CATEGORY);
    }
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      if (editingCategory) {
        await apiRequest(`/admin/blog/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(catForm),
        });
      } else {
        await apiRequest('/admin/blog/categories', {
          method: 'POST',
          body: JSON.stringify(catForm),
        });
      }
      setShowCatModal(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره دسته‌بندی');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
    try {
      await apiRequest(`/admin/blog/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'خطا در حذف دسته‌بندی');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">مدیریت وبلاگ</h1>
          <p className="text-xs text-slate-400">مقالات، راهنماها و دسته‌بندی‌های وبلاگ دکتر گیم</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('posts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'posts'
                ? 'bg-cosmic-purple text-white'
                : 'bg-white/5 text-text-muted hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline-block ml-1" />
            مقالات
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === 'categories'
                ? 'bg-cosmic-purple text-white'
                : 'bg-white/5 text-text-muted hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5 inline-block ml-1" />
            دسته‌بندی‌ها
          </button>
        </div>
      </div>

      {/* Posts Tab */}
      {tab === 'posts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={postsSearch}
                onChange={(e) => {
                  setPostsSearch(e.target.value);
                  setPostsPage(1);
                }}
                placeholder="جستجو در عنوان یا محتوا..."
                className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-9 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <button
              onClick={() => openPostModal()}
              className="px-4 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              مقاله جدید
            </button>
          </div>

          <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">مقاله</th>
                    <th className="py-3.5 px-4 font-semibold">دسته‌بندی</th>
                    <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                    <th className="py-3.5 px-4 font-semibold">زمان مطالعه</th>
                    <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {postsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        در حال بارگذاری...
                      </td>
                    </tr>
                  ) : posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        هیچ مقاله‌ای یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    posts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {p.cover_image_url && (
                              <img
                                src={p.cover_image_url}
                                alt={p.title}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-slate-200">{p.title}</div>
                              <div className="text-[11px] text-slate-500 font-mono">/{p.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-300 text-[11px]">
                            {p.category_name || `ID: ${p.category_id}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.is_published ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                              <Eye className="w-3 h-3" /> منتشر شده
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                              <EyeOff className="w-3 h-3" /> پیش‌نویس
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {p.reading_time_minutes} دقیقه
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openPostModal(p)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cosmic-purple transition-colors"
                              title="ویرایش"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(p.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {postsTotal > 10 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-800">
                <button
                  onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                  disabled={postsPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-xs disabled:opacity-30"
                >
                  قبلی
                </button>
                <span className="text-xs text-slate-400">
                  صفحه {postsPage} از {Math.ceil(postsTotal / 10)}
                </span>
                <button
                  onClick={() => setPostsPage((p) => p + 1)}
                  disabled={postsPage >= Math.ceil(postsTotal / 10)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-xs disabled:opacity-30"
                >
                  بعدی
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openCatModal()}
              className="px-4 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              دسته‌بندی جدید
            </button>
          </div>

          <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">نام</th>
                    <th className="py-3.5 px-4 font-semibold">اسلاگ</th>
                    <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {categoriesLoading ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        در حال بارگذاری...
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500">
                        هیچ دسته‌بندی‌ای یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-200">{c.name}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">/{c.slug}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openCatModal(c)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cosmic-purple transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0d121f] border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingPost ? 'ویرایش مقاله' : 'مقاله جدید'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">عنوان</label>
                  <input
                    value={postForm.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPostForm((prev) => ({
                        ...prev,
                        title: val,
                        slug: prev.slug || generateSlug(val),
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">اسلاگ</label>
                  <input
                    value={postForm.slug}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, slug: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">خلاصه</label>
                <input
                  value={postForm.summary}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, summary: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">تصویر کاور (URL)</label>
                <input
                  value={postForm.cover_image_url}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">دسته‌بندی</label>
                  <select
                    value={postForm.category_id}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                  >
                    <option value={0}>انتخاب کنید...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">زمان مطالعه (دقیقه)</label>
                  <input
                    type="number"
                    min={1}
                    value={postForm.reading_time_minutes}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, reading_time_minutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postForm.is_published}
                      onChange={(e) => setPostForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                      className="w-4 h-4 rounded border-white/20 bg-surface-base text-cosmic-purple"
                    />
                    <span className="text-xs text-text-secondary">منتشر شده</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1.5">محتوا (HTML)</label>
                <textarea
                  value={postForm.content}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                  required
                  rows={10}
                  className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingPost ? 'بروزرسانی' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0d121f] border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
              </h2>
              <button onClick={() => setShowCatModal(false)} className="p-1.5 rounded-xl hover:bg-white/10 text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">نام</label>
                <input
                  value={catForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCatForm((prev) => ({
                      ...prev,
                      name: val,
                      slug: prev.slug || generateSlug(val),
                    }));
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">اسلاگ</label>
                <input
                  value={catForm.slug}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">توضیحات</label>
                <input
                  value={catForm.description}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-base border border-white/10 text-white text-xs focus:outline-none focus:border-cosmic-purple"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-5 py-2 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingCategory ? 'بروزرسانی' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
