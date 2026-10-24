"use client";

import React from "react";
import { X, Check, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";

export interface PSCharacterAvatar {
  id: string;
  nameFa: string;
  nameEn: string;
  image: string;
  game: string;
}

export const PS_AVATARS: PSCharacterAvatar[] = [
  { id: "kratos", nameFa: "کریتوس", nameEn: "Kratos", game: "God of War Ragnarök", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2001_xl.png" },
  { id: "atreus", nameFa: "آترئوس", nameEn: "Atreus", game: "God of War", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2002_xl.png" },
  { id: "ellie", nameFa: "الی", nameEn: "Ellie", game: "The Last of Us Part II", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2073_xl.png" },
  { id: "joel", nameFa: "جوئل", nameEn: "Joel", game: "The Last of Us", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2080_xl.png" },
  { id: "aloy", nameFa: "اِلوی", nameEn: "Aloy", game: "Horizon Forbidden West", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_E/E2096_xl.png" },
  { id: "ratchet", nameFa: "رچت", nameEn: "Ratchet", game: "Ratchet & Clank Rift Apart", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2103_xl.png" },
  { id: "sackboy", nameFa: "سک‌بوی", nameEn: "Sackboy", game: "Sackboy: A Big Adventure", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_E/E2109_xl.png" },
  { id: "spider-man", nameFa: "مرد عنکبوتی", nameEn: "Spider-Man", game: "Marvel's Spider-Man 2", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2114_xl.png" },
  { id: "miles-morales", nameFa: "مایلز مورالس", nameEn: "Miles Morales", game: "Marvel's Spider-Man", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2117_xl.png" },
  { id: "miles-morales-neon", nameFa: "مایلز مورالس (نئونی)", nameEn: "Miles Morales Neon", game: "Spider-Man", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2118_xl.png" },
  { id: "nathan-drake", nameFa: "نیتن دریک", nameEn: "Nathan Drake", game: "Uncharted 4", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/UP90001004025_XL.png" },
  { id: "bloodborne-hunter", nameFa: "شکارچی بلادبورن", nameEn: "Bloodborne Hunter", game: "Bloodborne", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_J/J2060_xl.png" },
  { id: "jak", nameFa: "جک", nameEn: "Jak", game: "Jak and Daxter", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A0005_XL.png" },
  { id: "journey-traveler", nameFa: "مسافر Journey", nameEn: "Journey Traveler", game: "Journey", image: "https://static-resource.np.community.playstation.net/avatar_xl/WWS_A/A2011_xl.png" },
  { id: "astro-bot", nameFa: "آسترو بات", nameEn: "Astro Bot", game: "Astro Bot", image: "https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/JP9000/PPSA21559_00-PREORDERAVATAR01_C931593F47B5D7394549_xl.png" },
  { id: "jin-sakai", nameFa: "جین ساکای", nameEn: "Jin Sakai", game: "Ghost of Tsushima", image: "https://psn-rsc.prod.dl.playstation.net/psn-rsc/avatar/EP9000/CUSA13323_00-AV00000000000001_62CCBEC7437D02076B02_xl.png" },
  { id: "dina", nameFa: "دینا", nameEn: "Dina", game: "The Last of Us Part II", image: "https://image.api.playstation.com/cdn/UP9000/CUSA07820_00/wvJCTO4Ez6oxbTOLRK8HAHU4I9lo2rlo.png" },
  { id: "jesse", nameFa: "جسی", nameEn: "Jesse", game: "The Last of Us Part II", image: "https://image.api.playstation.com/cdn/UP9000/CUSA07820_00/QnccaKZCCOY0iTi1QEJgLYKJ0zhkQgB7.png" },
  { id: "elena-fisher", nameFa: "النا فیشر", nameEn: "Elena Fisher", game: "Uncharted", image: "https://image.api.playstation.com/cdn/HP9000/CUSA00912_00/AzZf7nNNJj6KmPv8OlGDoEXMSHfqlyNGKmaBvR6i0nSNqEdYePetmTN00M4n1rOK.png" },
  { id: "sly-cooper", nameFa: "اسلای کوپر", nameEn: "Sly Cooper", game: "Sly Cooper", image: "https://image.api.playstation.com/cdn/UP9000/CUSA00223_00/w1ucD8fBBxPnnDJ7CNJoDLTw0D76zt15.png" },
];

interface AvatarSelectorModalProps {
  isOpen: boolean;
  selectedAvatarId: string;
  onSelect: (avatar: PSCharacterAvatar) => void;
  onClose: () => void;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  selectedAvatarId,
  onSelect,
  onClose,
}) => {
  const { t } = useApp();

  if (!isOpen) return null;

  const handleSelect = async (av: PSCharacterAvatar) => {
    try {
      await api.put("/api/v1/auth/avatar", { avatar_id: av.id, avatar_image: av.image });
    } catch {
      // Offline fallback
    }
    onSelect(av);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-white">
                {t("کاتالوگ ۲۰ آواتار رسمی پلی‌استیشن", "Official PlayStation 20 Avatars")}
              </h3>
              <p className="text-xs text-slate-400">
                {t("آواتار کاراکتر مورد علاقه خود را برای نمایش در پروفایل انتخاب کنید", "Select your favourite console hero")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 20 Avatar Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
          {PS_AVATARS.map((av) => {
            const isSelected = selectedAvatarId === av.id;
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => handleSelect(av)}
                className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group ${
                  isSelected
                    ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/40"
                    : "bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10"
                }`}
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 group-hover:scale-105 transition-transform">
                  <img
                    src={av.image}
                    alt={av.nameFa}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image network fails
                      (e.currentTarget as HTMLImageElement).src =
                        "https://static-resource.np.community.playstation.net/avatar_xl/default/Defaultavatar_xl.png";
                    }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-purple-600/40 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 w-full">
                  <span className="text-xs font-bold text-white truncate block">{t(av.nameFa, av.nameEn)}</span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{av.game}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectorModal;
