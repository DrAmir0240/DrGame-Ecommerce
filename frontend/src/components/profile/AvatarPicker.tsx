'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Check,
  Upload,
  Loader2,
  Gamepad2,
  Layers,
  Flame,
  Star,
  Swords,
  Heart,
  Ghost,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { apiRequest } from '@/lib/apiClient';
import {
  SONY_PRESET_AVATARS,
  DEFAULT_PSN_AVATAR,
  getValidAvatarUrl,
  PsnPresetAvatar,
} from '@/lib/avatar';

export { SONY_PRESET_AVATARS, DEFAULT_PSN_AVATAR };

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  onSelect: (url: string) => void;
}

type FranchiseKey = 'all' | 'gow' | 'tlou' | 'spiderman' | 'exclusives' | 'classics' | 'custom';

interface FranchiseTab {
  id: FranchiseKey;
  label_fa: string;
  label_en: string;
  icon: React.ElementType;
  ids?: string[];
}

const FRANCHISE_TABS: FranchiseTab[] = [
  { id: 'all', label_fa: 'همه', label_en: 'All', icon: Layers },
  { id: 'gow', label_fa: 'خدای جنگ', label_en: 'God of War', icon: Swords, ids: ['kratos', 'atreus'] },
  { id: 'tlou', label_fa: 'لست آو آس', label_en: 'TLOU', icon: Heart, ids: ['ellie', 'joel', 'dina', 'jesse'] },
  { id: 'spiderman', label_fa: 'اسپایدرمن', label_en: 'Spider-Man', icon: Flame, ids: ['spider-man', 'miles-morales', 'miles-morales-neon'] },
  {
    id: 'exclusives',
    label_fa: 'انحصاری‌ها',
    label_en: 'Exclusives',
    icon: Star,
    ids: ['aloy', 'jin-sakai', 'bloodborne-hunter', 'nathan-drake', 'elena-fisher'],
  },
  {
    id: 'classics',
    label_fa: 'کلاسیک',
    label_en: 'Classics',
    icon: Ghost,
    ids: ['astro-bot', 'ratchet', 'sackboy', 'sly-cooper', 'jak', 'journey-traveler'],
  },
  { id: 'custom', label_fa: 'آپلود عکس', label_en: 'Upload', icon: Upload },
];

export default function AvatarPicker({ currentAvatarUrl, onSelect }: AvatarPickerProps) {
  const { t, locale, n } = useTranslation();
  const [selected, setSelected] = useState<string>(
    getValidAvatarUrl(currentAvatarUrl) || SONY_PRESET_AVATARS[0].url
  );
  const [activeCategory, setActiveCategory] = useState<FranchiseKey>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPreset = useMemo(() => {
    return SONY_PRESET_AVATARS.find((a) => a.url === selected) || null;
  }, [selected]);

  const isCustomAvatar = !selectedPreset;

  const filteredAvatars = useMemo(() => {
    if (activeCategory === 'all') return SONY_PRESET_AVATARS;
    if (activeCategory === 'custom') return [];
    const tab = FRANCHISE_TABS.find((t) => t.id === activeCategory);
    if (!tab?.ids) return SONY_PRESET_AVATARS;
    return SONY_PRESET_AVATARS.filter((a) => tab.ids!.includes(a.id));
  }, [activeCategory]);

  const handleSelect = (url: string) => {
    setSelected(url);
    onSelect(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(t('avatar.upload.invalidType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('avatar.upload.tooLarge'));
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiRequest<{ avatar_url: string; message: string }>(
        '/users/profile/upload-avatar',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (data.avatar_url) {
        setSelected(data.avatar_url);
        onSelect(data.avatar_url);
      }
    } catch (err: any) {
      setUploadError(err.message || t('avatar.upload.error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-4 font-vazir text-start">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Compact Status Bar (Selected Avatar Mini-Badge)                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0b0e17] border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-nebula-violet p-0.5 bg-[#0e1322] shrink-0 shadow-sm">
            <img
              src={selected}
              alt="Selected Avatar"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {selectedPreset
                  ? locale === 'fa'
                    ? selectedPreset.name_fa
                    : selectedPreset.name_en
                  : 'آواتار اختصاصی'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20">
                فعال ✔
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              {selectedPreset ? `${selectedPreset.game_fa}` : 'تصویر آپلود شده'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b2b] hover:bg-[#1a243a] text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cosmic-purple" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-cosmic-purple" />
          )}
          <span>{uploading ? 'آپلود...' : 'آپلود تصویر'}</span>
        </button>
      </div>

      {uploadError && (
        <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {uploadError}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Category Filter Pills (Compact)                                   */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FRANCHISE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-cosmic-purple text-white shadow-sm border border-nebula-violet'
                  : 'bg-[#0f1422] text-slate-400 hover:text-white hover:bg-[#151c2f] border border-slate-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{locale === 'fa' ? tab.label_fa : tab.label_en}</span>
            </button>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* Compact Grid of Avatars (Sleek PSN Icon Style)                    */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeCategory === 'custom' ? (
        <div
          onClick={handleUploadClick}
          className="p-6 rounded-xl bg-[#0b0e17] border-2 border-dashed border-slate-700 hover:border-cosmic-purple/60 transition-all text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#141b2b] border border-slate-700 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-cosmic-purple animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-cosmic-purple" />
            )}
          </div>
          <span className="text-xs font-bold text-white">برای انتخاب یا کشیدن تصویر کلیک کنید</span>
          <span className="text-[10px] text-slate-400 font-mono">JPG / PNG / WebP تا ۵ مگابایت</span>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2.5">
          {/* Slot 0 in "All": Compact Upload Slot */}
          {activeCategory === 'all' && (
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className={`relative rounded-xl border transition-all aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden ${
                isCustomAvatar
                  ? 'border-nebula-violet ring-2 ring-nebula-violet bg-[#121827]'
                  : 'border-dashed border-slate-700 hover:border-slate-500 bg-[#0b0e17] hover:bg-[#121827]'
              }`}
              title="آپلود عکس دلخواه"
            >
              {isCustomAvatar && selected ? (
                <div className="relative w-full h-full">
                  <img src={selected} alt="Custom" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 p-0.5 rounded-full bg-nebula-violet text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>
              ) : (
                <>
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-cosmic-purple animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[9px] font-bold text-slate-300">آپلود</span>
                </>
              )}
            </button>
          )}

          {/* Preset Character Avatars */}
          {filteredAvatars.map((avatar) => {
            const isSelected = selected === avatar.url;
            const charName = locale === 'fa' ? avatar.name_fa : avatar.name_en;
            const gameTitle = locale === 'fa' ? avatar.game_fa : avatar.game_en;

            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handleSelect(avatar.url)}
                className={`group relative rounded-xl border transition-all duration-150 aspect-square overflow-hidden cursor-pointer p-0.5 bg-[#0b0e17] ${
                  isSelected
                    ? 'border-nebula-violet ring-2 ring-nebula-violet shadow-[0_0_12px_rgba(168,85,247,0.45)] scale-105'
                    : 'border-slate-800 hover:border-slate-600 hover:scale-102'
                }`}
                title={`${charName} · ${gameTitle}`}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden bg-black/40">
                  <img
                    src={avatar.url}
                    alt={charName}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                  />

                  {/* Corner Checkmark Pill */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 p-0.5 rounded-full bg-nebula-violet text-white shadow-md">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Subtle Tiny Bottom Label */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 py-0.5 px-1 text-center">
                    <span className="text-[9px] font-bold text-slate-200 block truncate leading-tight">
                      {charName}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
