'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  Gamepad2,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  X,
  Layers,
} from 'lucide-react';

interface BannerSlide {
  id: string;
  bannerType: 'games' | 'services';
  badge: string;
  titleFa: string;
  titleEn?: string;
  description: string;
  backdropUrl: string;
  linkHref: string;
  ctaText: string;
  platforms?: string;
  order: number;
  isActive: boolean;
}

const INITIAL_SLIDES: BannerSlide[] = [
  {
    id: 'g-1',
    bannerType: 'games',
    badge: 'بازی منتخب ماه',
    titleFa: 'خدای جنگ: رگناروک',
    titleEn: 'God of War Ragnarök',
    description: 'همراه با کریتوس و آترئوس به سفری اسطوره‌ای در میان ۹ قلمرو اسکاندیناوی بروید.',
    backdropUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    linkHref: '/games/1',
    ctaText: 'مشاهده جزئیات و دانلود',
    platforms: 'PS5, PS4',
    order: 1,
    isActive: true,
  },
  {
    id: 'g-2',
    bannerType: 'games',
    badge: 'جدیدترین عنوان اکشن',
    titleFa: 'اسپایدرمن ۲ مارول',
    titleEn: "Marvel's Spider-Man 2",
    description: 'تار زدن در سراسر نیویورک با پیتر پارکر و مایلز مورالز با سرعت لودینگ صفر.',
    backdropUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1600&auto=format&fit=crop&q=80',
    linkHref: '/games/2',
    ctaText: 'دانلود مستقیم',
    platforms: 'PS5',
    order: 2,
    isActive: true,
  },
  {
    id: 's-1',
    bannerType: 'services',
    badge: 'تخفیف ویژه دوره‌ای',
    titleFa: 'اشتراک ۶ ماهه طلایی با ۲۰٪ تخفیف',
    titleEn: 'Gold 6-Month Plan',
    description: 'دسترسی نامحدود به دیتای بازی‌ها، سرور فوق‌سریع و دوبله‌های اختصاصی دکتر گیم.',
    backdropUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80',
    linkHref: '/subscriptions',
    ctaText: 'خرید اشتراک با تخفیف',
    order: 1,
    isActive: true,
  },
  {
    id: 's-2',
    bannerType: 'services',
    badge: 'کنسول پلی‌استیشن',
    titleFa: 'آموزش نصب DNS اختصاصی و انتقال دیتا',
    titleEn: 'Custom DNS Setup',
    description: 'بدون قطعی و با بالاترین پهنای باند کنسول خود را مستقیماً به مخزن بازی‌ها متصل کنید.',
    backdropUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1600&auto=format&fit=crop&q=80',
    linkHref: '/blog/dns-guide',
    ctaText: 'مشاهده راهنما',
    order: 2,
    isActive: true,
  },
];

export default function AdminBannersPage() {
  const [slides, setSlides] = useState<BannerSlide[]>(INITIAL_SLIDES);
  const [activeTab, setActiveTab] = useState<'games' | 'services'>('games');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<Partial<BannerSlide>>({
    badge: '',
    titleFa: '',
    titleEn: '',
    description: '',
    backdropUrl: '',
    linkHref: '',
    ctaText: 'مشاهده و دانلود',
    platforms: 'PS5, PS4',
    order: 1,
    isActive: true,
  });

  const filteredSlides = slides
    .filter((s) => s.bannerType === activeTab)
    .sort((a, b) => a.order - b.order);

  const handleOpenAdd = () => {
    setEditingSlide(null);
    setFormData({
      bannerType: activeTab,
      badge: activeTab === 'games' ? 'بازی ویژه' : 'خدمت ویژه',
      titleFa: '',
      titleEn: '',
      description: '',
      backdropUrl: '',
      linkHref: activeTab === 'games' ? '/games' : '/subscriptions',
      ctaText: 'مشاهده و اقدام',
      platforms: 'PS5, PS4',
      order: filteredSlides.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slide: BannerSlide) => {
    setEditingSlide(slide);
    setFormData(slide);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این اسلاید اطمینان دارید؟')) {
      setSlides((prev) => prev.filter((s) => s.id !== id));
      setFeedback('اسلاید با موفقیت حذف شد.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleToggleActive = (id: string) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleFa || !formData.backdropUrl) {
      alert('لطفاً عنوان و آدرس تصویر را وارد کنید.');
      return;
    }

    if (editingSlide) {
      setSlides((prev) =>
        prev.map((s) =>
          s.id === editingSlide.id ? ({ ...s, ...formData } as BannerSlide) : s
        )
      );
      setFeedback('اسلاید با موفقیت به‌روزرسانی شد.');
    } else {
      const newSlide: BannerSlide = {
        ...formData,
        id: `slide-${Date.now()}`,
        bannerType: activeTab,
      } as BannerSlide;
      setSlides((prev) => [...prev, newSlide]);
      setFeedback('اسلاید جدید با موفقیت اضافه شد.');
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-8 font-vazir text-right">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-400" />
            <span>مدیریت بنرهای دوگانه صفحه اصلی (Double Hero Banners)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تنظیم اسلایدهای بنر اول (بازی‌های شاخص) و بنر دوم (خدمات و پلن‌های پلتفرم) با ارتفاع ۲/۳
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن اسلاید جدید</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
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
          <span>بنر ۱: بازی‌های شاخص AAA ({slides.filter((s) => s.bannerType === 'games').length})</span>
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
          <span>بنر ۲: خدمات و تخفیف‌های اشتراک ({slides.filter((s) => s.bannerType === 'services').length})</span>
        </button>
      </div>

      {/* Slides Table */}
      <div className="rounded-2xl bg-[#0c1017] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#090d13] border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-bold">اولویت</th>
                <th className="py-3.5 px-4 font-bold">پیش‌نمایش تصویر</th>
                <th className="py-3.5 px-4 font-bold">عنوان اسلاید</th>
                <th className="py-3.5 px-4 font-bold">بج / تگ</th>
                <th className="py-3.5 px-4 font-bold">لینک هدف</th>
                <th className="py-3.5 px-4 font-bold">وضعیت</th>
                <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSlides.map((slide) => (
                <tr key={slide.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                    #{slide.order}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-20 h-11 rounded-lg overflow-hidden border border-slate-700 bg-black/50">
                      <img
                        src={slide.backdropUrl}
                        alt={slide.titleFa}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{slide.titleFa}</div>
                    {slide.titleEn && (
                      <div className="text-[11px] text-slate-400 font-roboto">{slide.titleEn}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                      {slide.badge}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {slide.linkHref}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(slide.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        slide.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {slide.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(slide)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="ویرایش"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Slide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <span>{editingSlide ? 'ویرایش اسلاید بنر' : 'افزودن اسلاید جدید'}</span>
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
                <label className="text-slate-300 font-bold">عنوان فارسی اسلاید:</label>
                <input
                  type="text"
                  required
                  value={formData.titleFa || ''}
                  onChange={(e) => setFormData({ ...formData, titleFa: e.target.value })}
                  placeholder="مثلاً: خدای جنگ رگناروک"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">عنوان انگلیسی (اختیاری):</label>
                <input
                  type="text"
                  value={formData.titleEn || ''}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="God of War Ragnarok"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-roboto"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">بج / تگ کوچک:</label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="بازی منتخب ماه"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">اولویت نمایش (ترتیب):</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order || 1}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">آدرس تصویر پس‌زمینه (URL):</label>
                <input
                  type="url"
                  required
                  value={formData.backdropUrl || ''}
                  onChange={(e) => setFormData({ ...formData, backdropUrl: e.target.value })}
                  placeholder="https://... یا /uploads/..."
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-roboto text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">توضیحات کوتاه اسلاید:</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="متن کوتاه جذاب..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">لینک دکمه (Href):</label>
                  <input
                    type="text"
                    value={formData.linkHref || ''}
                    onChange={(e) => setFormData({ ...formData, linkHref: e.target.value })}
                    placeholder="/games/1"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">متن دکمه (CTA):</label>
                  <input
                    type="text"
                    value={formData.ctaText || ''}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="مشاهده جزئیات و دانلود"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره اسلاید</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
