"use client";

import React from "react";
import { X, Check, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app";

export interface PSCharacterAvatar {
  id: string;
  nameFa: string;
  nameEn: string;
  game: string;
  color: string;
  initials: string;
}

export const PS_AVATARS: PSCharacterAvatar[] = [
  { id: "astro-bot", nameFa: "استرو بات (پیش‌فرض)", nameEn: "Astro Bot", game: "Astro Bot", color: "from-blue-500 to-cyan-400", initials: "AB" },
  { id: "kratos", nameFa: "کریتوس", nameEn: "Kratos", game: "God of War", color: "from-red-600 to-orange-500", initials: "KR" },
  { id: "atreus", nameFa: "آترئوس", nameEn: "Atreus", game: "God of War", color: "from-amber-600 to-yellow-500", initials: "AT" },
  { id: "aloy", nameFa: "الوی", nameEn: "Aloy", game: "Horizon Forbidden West", color: "from-emerald-600 to-teal-500", initials: "AL" },
  { id: "ellie", nameFa: "الی", nameEn: "Ellie", game: "The Last of Us Part II", color: "from-slate-700 to-emerald-700", initials: "EL" },
  { id: "joel", nameFa: "جوئل", nameEn: "Joel Miller", game: "The Last of Us", color: "from-amber-800 to-stone-700", initials: "JM" },
  { id: "nathan-drake", nameFa: "نیتن دریک", nameEn: "Nathan Drake", game: "Uncharted 4", color: "from-sky-700 to-blue-600", initials: "ND" },
  { id: "spider-man", nameFa: "پیتر پارکر (اسپایدرمن)", nameEn: "Spider-Man", game: "Marvel's Spider-Man 2", color: "from-red-600 to-blue-700", initials: "SM" },
  { id: "miles-morales", nameFa: "مایلز مورالس", nameEn: "Miles Morales", game: "Marvel's Spider-Man", color: "from-red-600 to-slate-900", initials: "MM" },
  { id: "jin-sakai", nameFa: "جین ساکای", nameEn: "Jin Sakai", game: "Ghost of Tsushima", color: "from-stone-800 to-red-800", initials: "JS" },
  { id: "ratchet", nameFa: "راچت", nameEn: "Ratchet", game: "Ratchet & Clank", color: "from-orange-500 to-amber-400", initials: "RC" },
  { id: "clank", nameFa: "کلنک", nameEn: "Clank", game: "Ratchet & Clank", color: "from-slate-400 to-slate-600", initials: "CK" },
  { id: "sackboy", nameFa: "سک‌بوی", nameEn: "Sackboy", game: "Sackboy A Big Adventure", color: "from-amber-700 to-yellow-600", initials: "SB" },
  { id: "lara-croft", nameFa: "لارا کرافت", nameEn: "Lara Croft", game: "Tomb Raider", color: "from-emerald-700 to-slate-800", initials: "LC" },
  { id: "geralt", nameFa: "گرالت از ریویا", nameEn: "Geralt of Rivia", game: "The Witcher 3", color: "from-slate-300 to-stone-600", initials: "GR" },
  { id: "arthur-morgan", nameFa: "آرتور مورگان", nameEn: "Arthur Morgan", game: "Red Dead Redemption 2", color: "from-amber-800 to-stone-800", initials: "AM" },
  { id: "cloud-strife", nameFa: "کلاود استرایف", nameEn: "Cloud Strife", game: "Final Fantasy VII Rebirth", color: "from-purple-800 to-indigo-600", initials: "CS" },
  { id: "leon-kennedy", nameFa: "لیان اس کندی", nameEn: "Leon S. Kennedy", game: "Resident Evil 4", color: "from-blue-900 to-slate-800", initials: "LK" },
  { id: "solid-snake", nameFa: "سالید اسنیک", nameEn: "Solid Snake", game: "Metal Gear Solid Delta", color: "from-emerald-900 to-stone-800", initials: "SS" },
  { id: "crash-bandicoot", nameFa: "کراش باندیکوت", nameEn: "Crash Bandicoot", game: "Crash Bandicoot 4", color: "from-orange-600 to-blue-500", initials: "CB" },
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-white">
                {t("کاتالوگ ۲۰ آواتار پلی‌استیشن", "PlayStation 20 Character Avatars")}
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
                onClick={() => {
                  onSelect(av);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group ${
                  isSelected
                    ? "bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/20"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${av.color} flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform relative`}
                >
                  <span>{av.initials}</span>
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center ring-2 ring-[#151722]">
                      <Check className="w-3 h-3" />
                    </span>
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
