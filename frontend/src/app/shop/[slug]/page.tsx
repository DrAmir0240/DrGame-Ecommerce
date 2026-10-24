"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Download,
  Share2,
  Bookmark,
  Check,
  Star,
  HardDrive,
  FileArchive,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  X,
  Sparkles,
  Zap,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { PlayStationFeatureCards } from "@/components/PlayStationFeatureCards";
import { GameHeroBanner } from "@/components/GameHeroBanner";
import { useApp } from "@/lib/app";
import { GAMES, USER, type Game } from "@/lib/data";
import { api } from "@/lib/api";


export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { t, n } = useApp();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [downloadingPart, setDownloadingPart] = useState<number | null>(null);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [userQuota, setUserQuota] = useState<number>(USER.quotaLeftGb || 120.4);

  const currentGame: Game =
    GAMES.find((g) => g.slug === slug) || GAMES[0];

  const [fullDescription, setFullDescription] = useState<string>(currentGame.description || "");
  const [descTab, setDescTab] = useState<"desc" | "story" | "specs">("desc");
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  useEffect(() => {
    // Check wishlist state
    try {
      const saved = JSON.parse(localStorage.getItem("drgame_library") || "[]");
      setIsWishlisted(saved.includes(currentGame.slug));
    } catch (e) {}

    // Load rich description from descriptions.json
    fetch("/data/descriptions.json")
      .then((res) => res.json())
      .then((data) => {
        const entry = data[slug] || data[currentGame.slug];
        if (entry?.description_fa) {
          setFullDescription(entry.description_fa);
        } else if (entry?.description) {
          setFullDescription(entry.description);
        }
      })
      .catch(() => {});
  }, [slug, currentGame.slug]);

  const handleToggleWishlist = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("drgame_library") || "[]");
      let next: string[];
      if (isWishlisted) {
        next = saved.filter((s) => s !== currentGame.slug);
        setIsWishlisted(false);
      } else {
        next = [...saved, currentGame.slug];
        setIsWishlisted(true);
      }
      localStorage.setItem("drgame_library", JSON.stringify(next));
    } catch (e) {}
  };


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
    {
      category: "دیتای اصلی خود بازی (Main Game Data)",
      format: "FPKG",
      badge: "دیتای اصلی",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      sizeGb: currentGame.sizeGb,
      sha256: "9a7d4e5f...b831",
      ready: true,
    },
    {
      category: "زیرنویس فارسی اختصاصی (Persian Subtitles)",
      format: "FPKG",
      badge: "زیرنویس",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      sizeGb: 0.18,
      sha256: "3f9e2b1c...d880",
      ready: true,
    },
    {
      category: "فایل چیت و سیو ۱۰۰٪ (Cheat & Trainer)",
      format: "ZIP",
      badge: "چیت و سیو",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      sizeGb: 0.03,
      sha256: "8e7c1a2d...f502",
      ready: true,
    },
    {
      category: "دی‌ال‌سی و آپدیت‌ها (DLC & Updates)",
      format: "FPKG",
      badge: "الحاقی و پچ",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      sizeGb: Math.round(currentGame.sizeGb * 0.22 * 10) / 10 || 12.4,
      sha256: "1e3d5a7b...c449",
      ready: true,
    },
    {
      category: "دوبله فارسی اختصاصی (Persian Dubbing)",
      format: "FPKG",
      badge: "دوبله فارسی",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      sizeGb: 2.4,
      sha256: "7b8d9c0a...f112",
      ready: true,
    },
  ];

  const handleDownloadPart = async (item: typeof fileParts[0], idx: number) => {
    // 1. Quota Check
    if (userQuota < item.sizeGb) {
      setQuotaModalOpen(true);
      return;
    }

    setDownloadingPart(idx);
    try {
      // 2. Request download token from backend
      const res = await api.post(`/api/v1/games/${slug}/download/${idx + 1}`);
      const downloadUrl = res.data?.download_url || `https://cdn.drgame.ir/dl/${slug}/${encodeURIComponent(item.category)}.${item.format.toLowerCase()}`;

      // 3. Deduct quota
      setUserQuota((prev) => Math.max(0, Math.round((prev - item.sizeGb) * 10) / 10));

      // 4. Trigger download in browser
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${slug}-file${idx + 1}.${item.format.toLowerCase()}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      // Fallback direct download simulation if API network unreachable
      setUserQuota((prev) => Math.max(0, Math.round((prev - item.sizeGb) * 10) / 10));
      window.open(`https://cdn.drgame.ir/dl/${slug}/file${idx + 1}.${item.format.toLowerCase()}`, "_blank");
    } finally {
      setTimeout(() => setDownloadingPart(null), 1000);
    }
  };

  return (
    <Page>
      {/* Dynamic Ambient Wash Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 10%, rgba(124, 58, 237, 0.25) 0%, rgba(7, 7, 9, 0) 75%)",
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
          <span className="text-purple-400 font-bold">{currentGame.title}</span>
        </nav>

        {/* 1. Cinematic Hero Showcase Banner (Separate Cover Poster + Like/Dislike) */}
        <GameHeroBanner
          game={currentGame}
          isWishlisted={isWishlisted}
          onWishlistToggle={handleToggleWishlist}
        />

        {/* 2. PlayStation 3-Card Feature Overview (Aligned with GameDr-Website-Source) */}
        <PlayStationFeatureCards game={currentGame} gameTitle={currentGame.title} />

        {/* 3. Compact Download Files Box: 5 Categorized Files */}
        <section
          id="game-files-section"
          className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#151722]/90 backdrop-blur-md p-5 sm:p-6 shadow-2xl space-y-4 scroll-mt-24"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                <FileArchive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {t("باکس دانلود فایل‌های رسمی بازی", "Official Game Download Files")}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {t("سرور اختصاصی لبه تهران · پهنای باند حداکثری و پشتیبانی از Resume", "Tehran Edge Node · Uncapped Max Speed")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              <span>{n(userQuota)} GB {t("سهمیه", "Quota")}</span>
            </div>
          </div>

          {/* Compact 5 Files List */}
          <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-black/20">
            {fileParts.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:px-4 hover:bg-white/[0.03] transition-colors gap-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-xs sm:text-sm block truncate">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      فرمت: {item.format} · SHA256: {item.sha256}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-1 sm:pt-0">
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-200 font-mono text-xs font-bold">
                    {n(item.sizeGb)} GB
                  </span>

                  <button
                    type="button"
                    data-action={idx === 0 ? "download-primary" : undefined}
                    disabled={downloadingPart === idx}
                    onClick={() => handleDownloadPart(item, idx)}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingPart === idx ? "animate-bounce" : ""}`} />
                    <span>
                      {downloadingPart === idx
                        ? t("در حال دریافت...", "Preparing...")
                        : t("دانلود", "Download")}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Quota Exceeded Modal */}
        {quotaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-3xl border border-purple-500/40 bg-[#101116] p-6 shadow-2xl space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
                <HardDrive className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-white">
                  {t("سهمیه دانلود حساب شما کافی نیست", "Insufficient Download Quota")}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    `سهمیه باقیمانده شما ${n(userQuota)} گیگابایت است که برای دانلود این پارت ۲۵ گیگابایتی کافی نمی‌باشد. جهت افزایش سهمیه، اشتراک خود را ارتقا دهید.`,
                    `Your quota is ${userQuota} GB, which is insufficient for this 25 GB part. Please upgrade your subscription.`
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/subscriptions"
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
                >
                  {t("ارتقای پلن اشتراک", "Upgrade Subscription")}
                </Link>
                <button
                  type="button"
                  onClick={() => setQuotaModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs"
                >
                  {t("بستن", "Dismiss")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Report Broken Link Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181920] p-6 shadow-2xl space-y-4">
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
                <div className="text-center py-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-white font-bold">
                    {t("گزارش شما با موفقیت به تیم فنی ارسال شد.", "Report submitted successfully.")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <p className="text-slate-300 leading-relaxed">
                    {t(
                      "در صورت خرابی پارت‌ها یا خطای هش SHA256، گزارش خود را ثبت نمایید تا لینک جدید جایگزین گردد.",
                      "If any part or SHA256 checksum fails, report it here."
                    )}
                  </p>
                  <textarea
                    rows={3}
                    placeholder={t("توضیحات خطا...", "Describe the error...")}
                    className="w-full bg-[#101116] border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReportSent(true);
                      setTimeout(() => {
                        setReportModalOpen(false);
                        setReportSent(false);
                      }, 2000);
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
                  >
                    {t("ارسال گزارش به پشتیبانی", "Submit Report")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
