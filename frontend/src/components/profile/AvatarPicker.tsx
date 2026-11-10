'use client';

import React, { useState, useRef } from 'react';
import { Check, Sparkles, Upload, Loader2, Gamepad2 } from 'lucide-react';
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

export default function AvatarPicker({ currentAvatarUrl, onSelect }: AvatarPickerProps) {
  const { t, locale, n } = useTranslation();
  const [selected, setSelected] = useState<string>(
    getValidAvatarUrl(currentAvatarUrl) || SONY_PRESET_AVATARS[0].url
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Validate: image, max 5MB
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

  const isCustomAvatar = !SONY_PRESET_AVATARS.some((a) => a.url === selected);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Gamepad2 className="w-4 h-4 text-nebula-violet" />
          <span>{t('avatar.title') || 'آواتارهای رسمی کنسولی سونی (PlayStation)'}</span>
        </div>
        <span className="text-xs text-text-muted">
          {locale === 'fa' ? `${n(SONY_PRESET_AVATARS.length)} کاراکتر اختصاصی` : `${SONY_PRESET_AVATARS.length} Iconic Characters`}
        </span>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {uploadError}
        </div>
      )}

      {/* Grid: 21 slots = 1 upload + 20 PlayStation character avatars */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {/* Slot 0: Custom Image Upload */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className={`relative group rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-300 p-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
            isCustomAvatar
              ? 'border-nebula-violet shadow-neon-purple scale-105 bg-cosmic-purple/25'
              : 'border-dashed border-white/20 hover:border-white/40 bg-surface-card hover:bg-white/5'
          }`}
          title={t('avatar.upload.title')}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-cosmic-purple animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
          )}
          <span className="text-[9px] text-text-muted group-hover:text-white transition-colors text-center font-medium px-1 line-clamp-1">
            {uploading ? t('avatar.upload.uploading') : t('avatar.upload.title')}
          </span>

          {isCustomAvatar && selected && (
            <>
              <img
                src={selected}
                alt={t('avatar.upload.custom')}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-cosmic-purple/40 backdrop-blur-[1px] flex items-center justify-center">
                <div className="p-1 rounded-full bg-nebula-violet text-white shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 20 Official PlayStation Character Avatars */}
        {SONY_PRESET_AVATARS.map((avatar) => {
          const isSelected = selected === avatar.url;
          const charName = locale === 'fa' ? avatar.name_fa : avatar.name_en;
          const gameTitle = locale === 'fa' ? avatar.game_fa : avatar.game_en;
          const fullLabel = `${charName} · ${gameTitle}`;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleSelect(avatar.url)}
              className={`relative group rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-300 p-1 cursor-pointer ${
                isSelected
                  ? 'border-nebula-violet shadow-neon-purple scale-105 bg-cosmic-purple/20'
                  : 'border-white/10 hover:border-white/30 bg-surface-card hover:scale-102'
              }`}
              title={fullLabel}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-black/40">
                <img
                  src={avatar.url}
                  alt={fullLabel}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-cosmic-purple/30 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="p-1 rounded-full bg-nebula-violet text-white shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
