"use client";

import React from "react";
import { Trophy, Star, Shield, Volume2, Gamepad2, Sparkles, BookOpen, Building, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/app";
import { PlayStationGlyph } from "./PlayStationGlyph";
import type { Game } from "@/lib/data";

interface PlayStationFeatureCardsProps {
  game?: Game;
  gameTitle?: string;
  storyText?: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
}

export const PlayStationFeatureCards: React.FC<PlayStationFeatureCardsProps> = ({
  game,
  gameTitle,
  storyText,
  developer,
  publisher,
  releaseDate,
}) => {
  const { t, n } = useApp();
  const title = game?.title || gameTitle || "بازی پلی‌استیشن";
  const studio = game?.studio || developer || "PlayStation Studios";
  const metacritic = game?.metacritic ?? 88;
  const isPS5Supported = Boolean(game?.platforms?.includes("PS5"));

  const defaultStory =
    storyText ||
    game?.description ||
    t(
      `روایتی حماسی و فراموش‌نشدنی در دنیای ${title}. سفری پر از چالش‌های نفس‌گیر، نبردهای سرنوشت‌ساز و اکتشافات هیجان‌انگیز که شما را تا آخرین ثانیه مجذوب خود می‌کند. فضاسازی خیره‌کننده بصری و کارگردانی صوتی این اثر، تجربه‌ای مثال‌زدنی در بازی‌های کنسولی است.`,
      `An epic and unforgettable journey through the world of ${title}. Filled with gripping challenges, destiny-defining battles and awe-inspiring discoveries.`
    );

  return (
    <div className="w-full space-y-6">
      {/* Heading Row */}
      <div className="flex items-end justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-xs font-black text-purple-400 uppercase tracking-widest block mb-1">
            {t("مشخصات فنی و استودیو", "PlayStation Profile")}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {t("جزئیات رسمی و ویژگی‌های بازی", "Game Details & Specifications")}
          </h2>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline-block">
          {t("بر پایه داده‌های معتبر پایگاه پلی‌استیشن", "Based on PlayStation Store Details")}
        </span>
      </div>

      {/* 3 Detail Cards Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card 1: استودیو و جوایز (Recognition & Studio) */}
        <article className="relative rounded-2xl border border-white/10 bg-[#151722]/80 backdrop-blur-md p-6 shadow-xl space-y-5 overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="absolute top-0 end-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              {t("استودیو سازنده و افتخارات", "Recognition & Studio")}
            </span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>

          {/* Studio Lockup */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-black text-purple-300 text-xl shadow-lg shadow-purple-600/10 shrink-0">
              <Building className="w-6 h-6 text-purple-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block font-medium">
                {t("استودیو خلق‌کننده اثر", "Creator Studio")}
              </span>
              <strong className="text-white text-base font-extrabold truncate block">
                {studio}
              </strong>
            </div>
          </div>

          {/* Awards List */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>{t("جوایز و تحسین‌های بین‌المللی", "Awards & Honours")}</span>
              <span className="text-[10px] text-purple-400 font-mono">The Game Awards</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>برنده جایزه بهترین کارگردانی هنری و بصری</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>نامزد بهترین بازی سال در فستیوال TGA</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>برترین موسیقی متن و مهندسی صدا</span>
              </li>
            </ul>
          </div>
        </article>

        {/* Card 2: ویژگی‌های اجرای بازی (Play Features & Support) */}
        <article className="relative rounded-2xl border border-white/10 bg-[#151722]/80 backdrop-blur-md p-6 shadow-xl space-y-4 overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="absolute top-0 end-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              {t("ویژگی‌های فنی و اجرا", "Play Features")}
            </span>
            <Gamepad2 className="w-4 h-4 text-blue-400" />
          </div>

          {/* Ratings Panel (Metacritic & Age Rating) */}
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center font-mono shadow-md shadow-emerald-600/30 shrink-0">
                {metacritic}
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px]">Metacritic Score</span>
                <strong className="text-white font-bold">{t("نمره منتقدین", "Critic Score")}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 border-s border-white/10 ps-3">
              <span className="w-7 h-8 rounded border border-white/30 bg-black/60 text-white font-black text-xs flex items-center justify-center font-mono">
                M
              </span>
              <div className="text-[10px] text-slate-300">
                <strong className="block text-white">ESRB: Mature 17+</strong>
                <span className="text-slate-400">مناسب بالای ۱۷ سال</span>
              </div>
            </div>
          </div>

          {/* Support List */}
          <ul className="divide-y divide-white/5 text-xs text-slate-300">
            <li className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">{t("حالت بازی:", "Players Mode:")}</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                {game?.mode || t("تک‌نفره داستانی", "Single-Player Story")}
              </span>
            </li>
            <li className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400">{t("مهندسی صدا:", "Audio Engine:")}</span>
              <span className="text-white font-medium flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Tempest 3D Audio</span>
              </span>
            </li>

            {/* DUALSENSE TECHNICAL FEATURES: ONLY SHOWN IF PS5 IS SUPPORTED */}
            {isPS5Supported ? (
              <>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t("بازخورد لمسی (Haptic):", "Haptic Feedback:")}</span>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>پشتیبانی کامل DualSense</span>
                  </span>
                </li>
                <li className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <PlayStationGlyph type="cross" className="w-3 h-3 text-blue-400" />
                    <span>{t("تریگر تطبیق‌پذیر (Adaptive):", "Adaptive Triggers:")}</span>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>فعال در دسته PS5</span>
                  </span>
                </li>
              </>
            ) : (
              <li className="py-2.5 flex items-center justify-between text-slate-400">
                <span>{t("کنترلر:", "Controller:")}</span>
                <span className="font-medium text-slate-300">DualShock 4 / کنترلر استاندارد</span>
              </li>
            )}
          </ul>
        </article>

        {/* Card 3: داستان و جهان بازی (The Story & Lore) */}
        <article className="relative rounded-2xl border border-white/10 bg-[#151722]/80 backdrop-blur-md p-6 shadow-xl space-y-4 overflow-hidden group hover:border-purple-500/40 transition-colors flex flex-col justify-between">
          <div className="absolute top-0 end-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t("قلب بازی و روایت", "The Story & Lore")}
              </span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>

            <h3 className="text-base font-extrabold text-white">
              {t("جهان روایی و ماجراجویی", "The Narrative Journey")}
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-48 overflow-y-auto pr-1">
              {defaultStory}
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t("مدت زمان گیم‌پلی:", "Story Playtime:")}</span>
            <span className="text-purple-300 font-bold font-mono">~۴۵ ساعت محتوای داستانی</span>
          </div>
        </article>
      </div>
    </div>
  );
};

export default PlayStationFeatureCards;
