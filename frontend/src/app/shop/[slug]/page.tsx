"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Star,
  Play,
  Heart,
  Share2,
  ShieldAlert,
  HardDrive,
  FileArchive,
  Wrench,
  Languages,
  Check,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  X,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { PlayStationFeatureCards } from "@/components/PlayStationFeatureCards";
import { PlayStationGlyph } from "@/components/PlayStationGlyph";
import { useApp } from "@/lib/app";
import { GAMES, USER, game as getGame } from "@/lib/data";

export default function GameDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "god-of-war";
  const currentGame = getGame(slug);
  const { t, n } = useApp();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Smooth scroll handler for the primary download CTA
  const handleScrollToDownload = () => {
    const target = document.getElementById("game-files-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const primaryBtn = target.querySelector<HTMLButtonElement>(
        'button[data-action="download-primary"]'
      );
      setTimeout(() => {
        primaryBtn?.focus();
      }, 600);
    }
  };

  const fileParts = [
    { part: "پارت ۱ (دیتای اصلی)", sizeGb: 25.0, sha256: "9a7d4e5f...b831", ready: true },
    { part: "پارت ۲ (دیتای اصلی)", sizeGb: 25.0, sha256: "4c2e1f8a...e904", ready: true },
    { part: "پارت ۳ (دیتای اصلی)", sizeGb: 25.0, sha256: "7b8d9c0a...f112", ready: true },
    { part: "پارت ۴ (آپدیت v1.35)", sizeGb: 9.4, sha256: "1e3d5a7b...c449", ready: true },
    { part: "پارت ۵ (زیرنویس فارسی اختصاصی)", sizeGb: 1.0, sha256: "3f9e2b1c...d880", ready: true },
  ];

  return (
    <Page>
      {/* Dynamic Ambient Wash Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 10%, rgba(255, 87, 34, 0.25) 0%, rgba(15, 16, 22, 0) 75%)",
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            {t("خانه", "Home")}
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-white transition-colors">
            {t("فروشگاه بازی‌ها", "Shop")}
          </Link>
          <span>/</span>
          <span className="text-orange-400 font-bold">{currentGame.title}</span>
        </nav>

        {/* 1. Hero Showcase Banner & Card */}
        <div className="relative rounded-3xl border border-white/10 bg-[#151722] overflow-hidden shadow-2xl p-6 md:p-8">
          {/* Blurred Background Hero Art */}
          <div className="absolute inset-0 opacity-20 overflow-hidden pointer-events-none">
            <img
              src={currentGame.image}
              alt=""
              className="w-full h-full object-cover filter blur-3xl scale-125"
            />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
            {/* Left Physical: Vertical Cover 240px */}
            <div className="w-full md:w-[240px] shrink-0 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/50">
              <img
                src={currentGame.image}
                alt={currentGame.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Physical: Game Metadata & Primary CTAs */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {currentGame.platforms.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 font-extrabold text-xs"
                  >
                    {p}
                  </span>
                ))}
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300 text-xs font-semibold">
                  CUSA-31459 · Region 1
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/30">
                  {t("دیتای رسمی سالم و تست‌شده", "Verified Sony Package")}
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {currentGame.title}
                </h1>
                <p className="text-sm font-semibold text-slate-400 mt-1">
                  {t(currentGame.genreFa, currentGame.genreEn)} • {currentGame.studio} • {currentGame.year}
                </p>
              </div>

              {/* Metacritic & Ratings */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span className="font-extrabold font-mono text-sm">
                    {(currentGame.metacritic / 10).toFixed(1)} / 10
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    ({currentGame.metacritic} Metascore)
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  <span>حجم کل پکیج: </span>
                  <strong className="text-white font-mono">{n(currentGame.sizeGb)} GB</strong>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {/* Download CTA with Smooth Scroll */}
                <button
                  type="button"
                  onClick={handleScrollToDownload}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{t("دانلود دیتای بازی", "Download Game Data")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all text-xs font-bold ${
                    isWishlisted
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-400" : ""}`} />
                  <span>{isWishlisted ? t("نشان شده", "Wishlisted") : t("علاقه‌مندی", "Wishlist")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{t("گزارش خرابی", "Report Issue")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Three PlayStation Profile Cards (TSK-04-14) */}
        <PlayStationFeatureCards game={currentGame} />

        {/* 3. Download Files Section (#game-files-section for TSK-04-13) */}
        <section
          id="game-files-section"
          className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {t("فایل‌ها و پارت‌های دانلود مستقیم", "Direct Download Files & Parts")}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t(
                    "سرور مستقیم لبه تهران ۱ با پهنای باند اختصاصی و پشتیبانی از Resume و ابزارهای دانلود منجیر",
                    "Tehran-1 edge node with unmetered bandwidth, resume capability, and IDM support"
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <HardDrive className="w-4 h-4" />
              <span>
                {t("سهمیه حساب:", "Quota:")} {n(USER.quotaLeftGb)} GB
              </span>
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-3">
            {fileParts.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.part}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-slate-300 font-mono">
                      {n(item.sizeGb)} GB
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>SHA256: {item.sha256}</span>
                    <span className="text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> سالم
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    data-action={idx === 0 ? "download-primary" : undefined}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("دانلود مستقیم", "Download")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Report Broken Link Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181a27] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{t("گزارش خرابی دیتای بازی", "Report File Issue")}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSent ? (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs text-center space-y-1">
                  <p className="font-bold">گزارش شما با موفقیت ثبت گردید.</p>
                  <p className="text-[11px] text-slate-400">تیم فنی ظرف حداکثر ۲ ساعت فایل را بازبینی خواهد کرد.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setReportSent(true);
                    setTimeout(() => {
                      setReportSent(false);
                      setReportModalOpen(false);
                    }, 2000);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">نوع مشکل:</label>
                    <select className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-xs text-white">
                      <option>لینک دانلود پاسخ نمی‌دهد (Timeout)</option>
                      <option>خطای چک‌سام / اکسترکت نشدن فایل ZIP</option>
                      <option>عدم شناسایی پکیج روی کنسول PS5/PS4</option>
                      <option>سایر موارد</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">توضیحات تکمیلی:</label>
                    <textarea
                      rows={3}
                      placeholder="شماره پارت معیوب یا کد خطای کنسول را شرح دهید..."
                      className="w-full rounded-xl bg-[#0f1016] border border-white/10 p-3 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-semibold hover:bg-white/10"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                    >
                      ارسال گزارش
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
