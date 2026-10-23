"use client";

import React, { useState } from "react";
import { BookOpen, Cpu, Trophy, Sparkles, Volume2, Gamepad2, Shield, Clock } from "lucide-react";
import { useApp } from "@/lib/app";
import { PlayStationGlyph } from "./PlayStationGlyph";
import type { Game } from "@/lib/data";

interface PlayStationFeatureCardsProps {
  game: Game;
  storyText?: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  playtimeHours?: number;
}

export const PlayStationFeatureCards: React.FC<PlayStationFeatureCardsProps> = ({
  game,
  storyText,
  developer,
  publisher,
  releaseDate,
  playtimeHours = 45,
}) => {
  const { t, n } = useApp();
  const [activeTab, setActiveTab] = useState<"story" | "features" | "studio">("story");

  const defaultStory =
    storyText ||
    t(
      `روایتی حماسی و فراموش‌نشدنی در دنیای ${game.title}. سفری پر از چالش‌های نفس‌گیر، نبردهای سرنوشت‌ساز و اکتشافات هیجان‌انگیز که شما را تا آخرین ثانیه مجذوب خود می‌کند.`,
      `An epic and unforgettable journey through the world of ${game.title}. Filled with gripping challenges, destiny-defining battles and awe-inspiring discoveries.`
    );

  return (
    <div className="w-full space-y-6">
      {/* Tab Selectors */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("story")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === "story"
              ? "bg-orange-600 text-white shadow-md shadow-orange-500/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t("داستان و سرگذشت", "Story & Lore")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("features")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === "features"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{t("ویژگی‌های فنی و DualSense", "Features & DualSense")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("studio")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === "studio"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>{t("استودیو و جوایز", "Studio & Awards")}</span>
        </button>
      </div>

      {/* 1. Story & Lore Card */}
      {activeTab === "story" && (
        <div className="rounded-2xl border border-white/10 bg-[#151722] p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <PlayStationGlyph type="triangle" className="w-4 h-4" />
            </span>
            <h3 className="text-base md:text-lg font-extrabold text-white">
              {t("قلب بازی — داستان، شخصیت‌ها و جهان روایی", "The Heart of the Game — Story & Characters")}
            </h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
            {defaultStory}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] text-slate-400 block">{t("تم کلی روایت", "Narrative Theme")}</span>
              <span className="text-xs font-bold text-white mt-1 block">حماسی، اساطیری، بقا</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] text-slate-400 block">{t("مدت زمان بخش داستانی", "Main Story Length")}</span>
              <span className="text-xs font-bold text-orange-400 font-mono mt-1 block">
                ~{n(playtimeHours)} {t("ساعت", "hours")}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] text-slate-400 block">{t("تکمیل ۱۰۰٪ و پلاتینیوم", "Platinum Trophy")}</span>
              <span className="text-xs font-bold text-purple-400 font-mono mt-1 block">
                ~{n(playtimeHours * 2)} {t("ساعت", "hours")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Features & DualSense Card */}
      {activeTab === "features" && (
        <div className="rounded-2xl border border-blue-500/20 bg-[#151722] p-6 shadow-xl space-y-5 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </span>
            <h3 className="text-base md:text-lg font-extrabold text-white">
              {t("ویژگی‌های سخت‌افزاری پلی‌استیشن ۵ و قابلیت‌های کنترلر DualSense", "PS5 Hardware & DualSense Capabilities")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <PlayStationGlyph type="l2" size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">تریگرهای تطبیق‌پذیر (Adaptive Triggers)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  مقاومت دینامیک دکمه‌های L2 و R2 هنگام کشیدن کمان، شلیک سلاح‌های سنگین یا ترمز اتومبیل.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">بازخورد لمسی (Haptic Feedback)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  لرزش‌های بسیار دقیق لمسی بازتاب‌دهنده گام برداشتن در برف، بارش باران و ضربات سلاح.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">صدای سه‌بعدی طوفانی (Tempest 3D Audio)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  تفکیک جهتی صدای پای دشمنان و محیط‌های جنگلی از طریق هدست‌های استریو یا تلویزیون.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">بهینه‌سازی ویژه PS5 Pro</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  پشتیبانی از فناوری PSSR، رزولوشن 4K با نرخ ۶۰ فریم بر ثانیه پایدار و ری‌تریسینگ پیشرفته.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Studio & Awards Card */}
      {activeTab === "studio" && (
        <div className="rounded-2xl border border-purple-500/20 bg-[#151722] p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </span>
            <h3 className="text-base md:text-lg font-extrabold text-white">
              {t("سازندگان، ناشر جهانی و افتخارات بازی", "Developers, Publisher & Recognition")}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block">{t("استودیوی سازنده", "Developer")}</span>
              <span className="text-sm font-bold text-white mt-1 block">{developer || game.studio}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block">{t("ناشر بین‌المللی", "Publisher")}</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {publisher || "Sony Interactive Entertainment"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block">{t("تاریخ انتشار رسمی", "Release Date")}</span>
              <span className="text-sm font-bold text-white mt-1 block">{releaseDate || game.year}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block">{t("امتیاز متاکریتیک سونی", "Metacritic Score")}</span>
              <span className="text-sm font-bold text-yellow-400 font-mono mt-1 block">
                {game.metacritic} / 100 (Universal Acclaim)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayStationFeatureCards;
