'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';

export const SONY_PRESET_AVATARS = [
  { id: 'kratos', name: 'کریتوس (God of War)', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80' },
  { id: 'spidey', name: 'مرد عنکبوتی (Marvel)', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80' },
  { id: 'aloy', name: 'الوی (Horizon Forbidden West)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'jin', name: 'جین ساکای (Ghost of Tsushima)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'joel', name: 'جوئل (The Last of Us)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'astro', name: 'استرو بات (Astro Bot)', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
];

interface AvatarPickerProps {
  currentAvatarUrl?: string | null;
  onSelect: (url: string) => void;
}

export default function AvatarPicker({ currentAvatarUrl, onSelect }: AvatarPickerProps) {
  const [selected, setSelected] = useState<string>(currentAvatarUrl || SONY_PRESET_AVATARS[0].url);

  const handleSelect = (url: string) => {
    setSelected(url);
    onSelect(url);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="w-4 h-4 text-nebula-violet" />
          <span>آواتارهای رسمی کنسولی سونی</span>
        </div>
        <span className="text-xs text-text-muted">طراحی طبق الگوی نمایه ۱۲۱</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {SONY_PRESET_AVATARS.map((avatar) => {
          const isSelected = selected === avatar.url;
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
              title={avatar.name}
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <img
                  src={avatar.url}
                  alt={avatar.name}
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
