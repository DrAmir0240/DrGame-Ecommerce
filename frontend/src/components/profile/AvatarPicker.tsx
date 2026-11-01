'use client';

import React, { useState, useRef } from 'react';
import { Check, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { apiRequest } from '@/lib/apiClient';

export const SONY_PRESET_AVATARS = [
  { id: 'kratos', nameKey: 'avatar.preset.kratos', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80' },
  { id: 'spidey', nameKey: 'avatar.preset.spidey', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80' },
  { id: 'aloy', nameKey: 'avatar.preset.aloy', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'jin', nameKey: 'avatar.preset.jin', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'joel', nameKey: 'avatar.preset.joel', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'astro', nameKey: 'avatar.preset.astro', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
];

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  onSelect: (url: string) => void;
}

export default function AvatarPicker({ currentAvatarUrl, onSelect }: AvatarPickerProps) {
  const { t, n } = useTranslation();
  const [selected, setSelected] = useState<string>(currentAvatarUrl || SONY_PRESET_AVATARS[0].url);
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
          // Do NOT set Content-Type — browser adds boundary automatically
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
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isCustomAvatar = !SONY_PRESET_AVATARS.some((a) => a.url === selected);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="w-4 h-4 text-nebula-violet" />
          <span>{t('avatar.title')}</span>
        </div>
        <span className="text-xs text-text-muted">{t('avatar.subtitle', { count: n(121) })}</span>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {uploadError}
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {/* Upload slot */}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className={`relative group rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-300 p-1 flex flex-col items-center justify-center gap-2 ${
            isCustomAvatar
              ? 'border-nebula-violet shadow-neon-purple scale-105 bg-cosmic-purple/20'
              : 'border-dashed border-white/20 hover:border-white/40 bg-surface-card'
          }`}
          title={t('avatar.upload.title')}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-cosmic-purple animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-text-muted group-hover:text-white transition-colors" />
          )}
          <span className="text-[10px] text-text-muted group-hover:text-white transition-colors">
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
                  <Check className="w-4 h-4 stroke-[3]" />
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

        {/* Preset avatars */}
        {SONY_PRESET_AVATARS.map((avatar) => {
          const isSelected = selected === avatar.url;
          const label = t(avatar.nameKey);
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleSelect(avatar.url)}
              className={`relative group rounded-2xl overflow-hidden aspect-square border-2 transition-all duration-300 p-1 ${
                isSelected
                  ? 'border-nebula-violet shadow-neon-purple scale-105 bg-cosmic-purple/20'
                  : 'border-white/10 hover:border-white/30 bg-surface-card'
              }`}
              title={label}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <img
                  src={avatar.url}
                  alt={label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-cosmic-purple/40 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="p-1 rounded-full bg-nebula-violet text-white shadow-md">
                    <Check className="w-4 h-4 stroke-[3]" />
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
