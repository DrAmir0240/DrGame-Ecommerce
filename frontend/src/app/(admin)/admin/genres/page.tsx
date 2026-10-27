'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Save,
  X,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';

interface GenreItem {
  id: number;
  name_fa: string;
  name_en: string;
  slug: string;
  icon_name?: string | null;
  display_order: number;
  is_top8: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<GenreItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name_fa: '',
    name_en: '',
    slug: '',
    icon_name: 'Gamepad2',
    display_order: 1,
    is_top8: false,
    is_active: true,
  });

  const fetchGenres = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<GenreItem[]>('/admin/genres');
      setGenres(data || []);
    } catch (err: any) {
      console.error('Failed to load genres:', err);
      setError('خطا در بارگذاری ژانرهای بازی از سرور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleOpenAdd = () => {
    setEditingGenre(null);
    setFormData({
      name_fa: '',
      name_en: '',
      slug: '',
      icon_name: 'Gamepad2',
      display_order: genres.length + 1,
      is_top8: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (genre: GenreItem) => {
    setEditingGenre(genre);
    setFormData({
      name_fa: genre.name_fa,
      name_en: genre.name_en,
      slug: genre.slug,
      icon_name: genre.icon_name || 'Gamepad2',
      display_order: genre.display_order,
      is_top8: genre.is_top8,
      is_active: genre.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این ژانر اطمینان دارید؟')) return;

    try {
      await apiRequest(`/admin/genres/${id}`, { method: 'DELETE' });
      setGenres((prev) => prev.filter((g) => g.id !== id));
      setFeedback('ژانر با موفقیت حذف شد.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در حذف ژانر.');
    }
  };

  const handleToggleActive = async (genre: GenreItem) => {
    try {
      const updated = await apiRequest<GenreItem>(`/admin/genres/${genre.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !genre.is_active }),
      });
      setGenres((prev) => prev.map((g) => (g.id === genre.id ? updated : g)));
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت ژانر.');
    }
  };

  const handleToggleTop8 = async (genre: GenreItem) => {
    try {
      const updated = await apiRequest<GenreItem>(`/admin/genres/${genre.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_top8: !genre.is_top8 }),
      });
      setGenres((prev) => prev.map((g) => (g.id === genre.id ? updated : g)));
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر برچسب Top 8.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_fa || !formData.slug) {
      alert('عنوان فارسی و اسلاگ ژانر الزامی است.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name_fa: formData.name_fa.trim(),
        name_en: formData.name_en.trim() || formData.name_fa.trim(),
        slug: formData.slug.trim().toLowerCase(),
        icon_name: formData.icon_name?.trim() || 'Gamepad2',
        display_order: Number(formData.display_order),
        is_top8: formData.is_top8,
        is_active: formData.is_active,
      };

      if (editingGenre) {
        const updated = await apiRequest<GenreItem>(`/admin/genres/${editingGenre.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setGenres((prev) => prev.map((g) => (g.id === editingGenre.id ? updated : g)));
        setFeedback('ژانر با موفقیت به‌روزرسانی شد.');
      } else {
        const created = await apiRequest<GenreItem>('/admin/genres', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setGenres((prev) => [...prev, created]);
        setFeedback('ژانر جدید با موفقیت اضافه شد.');
      }

      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره ژانر.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-vazir text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>مدیریت دسته‌بندی و ژانرهای بازی‌ها</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تعریف، ویرایش ترتیب نمایش و نشان ۸ ژانر برتر (Top 8) صفحه اصلی متصل به پایگاه داده
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن ژانر جدید</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Genres Table */}
      <div className="rounded-2xl bg-[#0c1017] border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت ژانرها...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#090d13] border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">ترتیب</th>
                  <th className="py-3.5 px-4 font-bold">نام فارسی ژانر</th>
                  <th className="py-3.5 px-4 font-bold">نام انگلیسی</th>
                  <th className="py-3.5 px-4 font-bold">اسلاگ (Slug)</th>
                  <th className="py-3.5 px-4 font-bold text-center">۸ ژانر برتر (Top 8)</th>
                  <th className="py-3.5 px-4 font-bold text-center">وضعیت</th>
                  <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {genres.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      هیچ ژانری تعریف نشده است.
                    </td>
                  </tr>
                ) : (
                  genres.map((genre) => (
                    <tr key={genre.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        #{genre.display_order}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {genre.name_fa}
                      </td>
                      <td className="py-3.5 px-4 font-roboto text-slate-400">
                        {genre.name_en}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400" dir="ltr">
                        {genre.slug}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleTop8(genre)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all inline-flex items-center gap-1 ${
                            genre.is_top8
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${genre.is_top8 ? 'fill-amber-300' : ''}`} />
                          <span>{genre.is_top8 ? 'Top 8 فعال' : 'عادی'}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(genre)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            genre.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {genre.is_active ? 'فعال' : 'غیرفعال'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(genre)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="ویرایش"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(genre.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Genre Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>{editingGenre ? 'ویرایش ژانر' : 'افزودن ژانر جدید'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">نام فارسی ژانر:</label>
                <input
                  type="text"
                  required
                  value={formData.name_fa}
                  onChange={(e) => setFormData({ ...formData, name_fa: e.target.value })}
                  placeholder="مثلاً: اکشن ماجراجویی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">نام انگلیسی ژانر:</label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Action-Adventure"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-roboto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اسلاگ URL (Slug):</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="action-adventure"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">ترتیب نمایش:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">نام آیکون لوسید (اختیاری):</label>
                <input
                  type="text"
                  value={formData.icon_name}
                  onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                  placeholder="Gamepad2, Swords, Flame, Trophy, ..."
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_top8}
                    onChange={(e) => setFormData({ ...formData, is_top8: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200 font-bold">نمایش در ۸ ژانر برتر (Top 8)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200 font-bold">فعال در سایت</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  <span>ذخیره ژانر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
