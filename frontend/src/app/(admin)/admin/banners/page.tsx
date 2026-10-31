'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Gamepad2,
  Sparkles,
  Save,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';

interface BannerSlide {
  id: number;
  position: number; // 1: games, 2: services
  badge: string;
  title_fa: string;
  title_en?: string | null;
  description: string;
  backdrop_url: string;
  link_href: string;
  cta_text: string;
  platforms: string[];
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const STATUS_KEY: Record<string, string> = {
  active: 'admin.banners.status.active',
  inactive: 'admin.banners.status.inactive',
};

export default function AdminBannersPage() {
  const { t, n } = useTranslation();
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'games' | 'services'>('games');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    position: 1,
    badge: '',
    title_fa: '',
    title_en: '',
    description: '',
    backdrop_url: '',
    link_href: '',
    cta_text: t('admin.banners.defaults.ctaText'),
    platforms: 'PS5, PS4',
    display_order: 1,
    is_active: true,
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<BannerSlide[]>('/home/admin/banners');
      setSlides(data);
    } catch (err: any) {
      console.error('Failed to fetch banners:', err);
      setError(t('admin.banners.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const activePosition = activeTab === 'games' ? 1 : 2;
  const filteredSlides = slides
    .filter((s) => s.position === activePosition)
    .sort((a, b) => a.display_order - b.display_order);

  const handleOpenAdd = () => {
    setEditingSlide(null);
    setFormData({
      position: activePosition,
      badge: activeTab === 'games' ? t('admin.banners.defaults.badgeGame') : t('admin.banners.defaults.badgeService'),
      title_fa: '',
      title_en: '',
      description: '',
      backdrop_url: '',
      link_href: activeTab === 'games' ? '/games' : '/subscriptions',
      cta_text: activeTab === 'games' ? t('admin.banners.defaults.ctaGame') : t('admin.banners.defaults.ctaSubscription'),
      platforms: activeTab === 'games' ? 'PS5, PS4' : 'PS5, PS4, Xbox',
      display_order: filteredSlides.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide: BannerSlide) => {
    setEditingSlide(slide);
    setFormData({
      position: slide.position,
      badge: slide.badge,
      title_fa: slide.title_fa,
      title_en: slide.title_en || '',
      description: slide.description,
      backdrop_url: slide.backdrop_url,
      link_href: slide.link_href,
      cta_text: slide.cta_text,
      platforms: (slide.platforms || []).join(', '),
      display_order: slide.display_order,
      is_active: slide.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.banners.confirm.delete'))) return;

    try {
      await apiRequest(`/home/admin/banners/${id}`, { method: 'DELETE' });
      setSlides((prev) => prev.filter((s) => s.id !== id));
      setFeedback(t('admin.banners.feedback.deleted'));
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || t('admin.banners.errors.deleteFailed'));
    }
  };

  const handleToggleActive = async (slide: BannerSlide) => {
    try {
      const updated = await apiRequest<BannerSlide>(`/home/admin/banners/${slide.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !slide.is_active }),
      });
      setSlides((prev) => prev.map((s) => (s.id === slide.id ? updated : s)));
    } catch (err: any) {
      alert(err.message || t('admin.banners.errors.toggleFailed'));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title_fa || !formData.backdrop_url) {
      alert(t('admin.banners.errors.requiredFields'));
      return;
    }

    try {
      setSubmitting(true);
      const platformsArray = formData.platforms
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        position: activePosition,
        badge: formData.badge,
        title_fa: formData.title_fa,
        title_en: formData.title_en || null,
        description: formData.description,
        backdrop_url: formData.backdrop_url,
        link_href: formData.link_href,
        cta_text: formData.cta_text,
        platforms: platformsArray,
        display_order: Number(formData.display_order),
        is_active: formData.is_active,
      };

      if (editingSlide) {
        const updated = await apiRequest<BannerSlide>(
          `/home/admin/banners/${editingSlide.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        setSlides((prev) =>
          prev.map((s) => (s.id === editingSlide.id ? updated : s))
        );
        setFeedback(t('admin.banners.feedback.updated'));
      } else {
        const created = await apiRequest<BannerSlide>('/home/admin/banners', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSlides((prev) => [...prev, created]);
        setFeedback(t('admin.banners.feedback.created'));
      }

      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || t('admin.banners.errors.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-vazir text-start">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <span>{t('admin.banners.title')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('admin.banners.subtitle')}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.banners.addSlide')}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'games'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>{t('admin.banners.tabs.games', { count: n(slides.filter((s) => s.position === 1).length) })}</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('admin.banners.tabs.services', { count: n(slides.filter((s) => s.position === 2).length) })}</span>
        </button>
      </div>

      {/* Slides Table */}
      <div className="rounded-2xl bg-[#0c1017] border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-400">{t('admin.banners.loading')}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#090d13] border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">{t('admin.banners.table.priority')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('admin.banners.table.preview')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('admin.banners.table.title')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('admin.banners.table.badge')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('admin.banners.table.link')}</th>
                  <th className="py-3.5 px-4 font-bold">{t('admin.banners.table.status')}</th>
                  <th className="py-3.5 px-4 font-bold text-center">{t('admin.banners.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSlides.map((slide) => (
                  <tr key={slide.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      #{slide.display_order}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-20 h-11 rounded-lg overflow-hidden border border-slate-700 bg-black/50">
                        <img
                          src={slide.backdrop_url}
                          alt={slide.title_fa}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{slide.title_fa}</div>
                      {slide.title_en && (
                        <div className="text-[11px] text-slate-400 font-roboto">{slide.title_en}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                        {slide.badge}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {slide.link_href}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(slide)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                          slide.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {t(STATUS_KEY[slide.is_active ? 'active' : 'inactive'] ?? 'common.unknown')}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(slide)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title={t('admin.banners.actions.edit')}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(slide.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                          title={t('admin.banners.actions.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSlides.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {t('admin.banners.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Add Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>{editingSlide ? t('admin.banners.modal.editTitle') : t('admin.banners.modal.addTitle')}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">{t('admin.banners.form.titleFa')}</label>
                <input
                  type="text"
                  required
                  value={formData.title_fa}
                  onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                  placeholder={t('admin.banners.placeholders.titleFa')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">{t('admin.banners.form.titleEn')}</label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  placeholder="God of War Ragnarok"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-roboto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('admin.banners.form.badge')}</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder={t('admin.banners.placeholders.badge')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('admin.banners.form.displayOrder')}</label>
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
                <label className="text-slate-300 font-bold">{t('admin.banners.form.backdropUrl')}</label>
                <input
                  type="url"
                  required
                  value={formData.backdrop_url}
                  onChange={(e) => setFormData({ ...formData, backdrop_url: e.target.value })}
                  placeholder={t('admin.banners.placeholders.backdropUrl')}
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-roboto text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">{t('admin.banners.form.description')}</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('admin.banners.placeholders.description')}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('admin.banners.form.platforms')}</label>
                  <input
                    type="text"
                    value={formData.platforms}
                    onChange={(e) => setFormData({ ...formData, platforms: e.target.value })}
                    placeholder="PS5, PS4"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('admin.banners.form.ctaText')}</label>
                  <input
                    type="text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder={t('admin.banners.placeholders.ctaText')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">{t('admin.banners.form.linkHref')}</label>
                <input
                  type="text"
                  value={formData.link_href}
                  onChange={(e) => setFormData({ ...formData, link_href: e.target.value })}
                  placeholder="/games/1"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {t('admin.banners.modal.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  <span>{t('admin.banners.modal.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
