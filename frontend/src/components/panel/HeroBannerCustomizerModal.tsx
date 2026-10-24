"use client";

import React from "react";
import { X, Check, Image as ImageIcon, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app";

export interface GameBannerOption {
  id: string;
  title: string;
  gameSlug: string;
  imageUrl: string;
}

export const GAME_BANNER_OPTIONS: GameBannerOption[] = [
  {
    id: "gow-ragnarok",
    title: "God of War Ragnarök",
    gameSlug: "god-of-war-ragnarok",
    imageUrl: "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
  },
  {
    id: "tlou-part1",
    title: "The Last of Us Part I",
    gameSlug: "the-last-of-us-part-i",
    imageUrl: "https://media.rawg.io/media/games/618/618c204facf0e8da3719859ec7680224.jpg",
  },
  {
    id: "spider-man-2",
    title: "Marvel's Spider-Man 2",
    gameSlug: "marvels-spider-man-2",
    imageUrl: "https://media.rawg.io/media/games/7cf/7cfc92f8b5257e1081512a830153835f.jpg",
  },
  {
    id: "rdr2",
    title: "Red Dead Redemption 2",
    gameSlug: "red-dead-redemption-2",
    imageUrl: "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
  },
  {
    id: "horizon-fw",
    title: "Horizon Forbidden West",
    gameSlug: "horizon-zero-dawn",
    imageUrl: "https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg",
  },
  {
    id: "elden-ring",
    title: "Elden Ring",
    gameSlug: "elden-ring",
    imageUrl: "https://media.rawg.io/media/games/d82/d8236ac5909747380be7cac8847c3e61.jpg",
  },
  {
    id: "cyberpunk",
    title: "Cyberpunk 2077: Phantom Liberty",
    gameSlug: "cyberpunk-2077",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "ghost-tsushima",
    title: "Ghost of Tsushima: Director's Cut",
    gameSlug: "ghost-of-tsushima",
    imageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
  },
];

interface HeroBannerCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl: string;
  onSelectBanner: (banner: GameBannerOption) => void;
}

export const HeroBannerCustomizerModal: React.FC<HeroBannerCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentBannerUrl,
  onSelectBanner,
}) => {
  const { t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#151722] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {t("انتخاب تصویر هیرو بنر پروفایل", "Choose Profile Hero Banner")}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  "والپیپر دلخواه خود را از میان برترین عناوین شاخص پلی‌استیشن انتخاب کنید",
                  "Select your profile backdrop from top PlayStation showcase games"
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {GAME_BANNER_OPTIONS.map((item) => {
            const isSelected = currentBannerUrl === item.imageUrl;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectBanner(item);
                  onClose();
                }}
                className={`relative group rounded-2xl overflow-hidden border-2 text-start transition-all aspect-[16/10] ${
                  isSelected
                    ? "border-purple-500 shadow-lg shadow-purple-500/30 scale-[1.02]"
                    : "border-white/10 hover:border-white/30 hover:scale-[1.02]"
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {isSelected && (
                  <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="absolute bottom-2 start-2 end-2">
                  <span className="text-[11px] font-bold text-white leading-tight block truncate">
                    {item.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بنر انتخابی بلافاصله در بالای پنل کاربری ذخیره و نمایش داده می‌شود.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-colors"
          >
            {t("بستن", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBannerCustomizerModal;
