"use client";

import React, { useState, useEffect } from "react";
import {
  CloudDownload,
  Calendar,
  Star,
  Gamepad2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowUpDown,
  History,
  ExternalLink,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { getMediaUrl } from "@/lib/media";

interface CatalogGame {
  id: number;
  source_id: string;
  title_en: string;
  slug: string;
  released: string | null;
  rating: number;
  metacritic: number | null;
  platforms: string[];
  genres: string[];
  cover_image_url: string | null;
  is_updated: boolean;
}

interface SyncJob {
  id: number;
  status: string;
  platforms: string[];
  date_from: string | null;
  date_to: string | null;
  min_rating: number;
  sort_by: string;
  requested_count: number;
  imported_count: number;
  updated_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface SyncResponse {
  success: boolean;
  job_id: number;
  imported_count: number;
  updated_count: number;
  total_count: number;
  message: string;
  games: CatalogGame[];
}

export default function CatalogSyncPage() {
  // Form State
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["PS5", "PS4"]);
  const [dateFrom, setDateFrom] = useState<string>("2023-01-01");
  const [dateTo, setDateTo] = useState<string>("2024-12-31");
  const [minRating, setMinRating] = useState<number>(0.0);
  const [sortBy, setSortBy] = useState<string>("release_date_desc");
  const [count, setCount] = useState<number>(10);

  // Execution & UI State
  const [syncing, setSyncing] = useState<boolean>(false);
  const [wiping, setWiping] = useState<boolean>(false);
  const [showWipeModal, setShowWipeModal] = useState<boolean>(false);
  const [recentGames, setRecentGames] = useState<CatalogGame[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Load History on Mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await apiRequest<SyncJob[]>("/admin-content/catalog/history?limit=10");
      setSyncHistory(data || []);
    } catch {
      // silently handle during initial load
    } finally {
      setLoadingHistory(false);
    }
  };

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleQuickDate = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) {
      setFeedback({ type: "error", message: "لطفاً حداقل یک پلتفرم انتخاب کنید." });
      return;
    }

    setSyncing(true);
    setFeedback({
      type: "info",
      message: "در حال استعلام از مرجع کاتالوگ، نرمال‌سازی متادیتا و آپلود تصاویر ۱۰۸۰p به باکت S3 لیارا...",
    });

    try {
      const payload = {
        platforms: selectedPlatforms,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        min_rating: minRating,
        sort_by: sortBy,
        count: Number(count),
      };

      const res = await apiRequest<SyncResponse>("/admin-content/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res && res.success) {
        setRecentGames(res.games || []);
        setFeedback({
          type: "success",
          message: res.message || `با موفقیت ${res.imported_count} بازی اضافه و ${res.updated_count} بازی آپدیت شد.`,
        });
        loadHistory();
      } else {
        setFeedback({ type: "error", message: "خطا در دریافت پاسخ از سرور کاتالوگ." });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "خطای غیرمنتظره در ارتباط با سرور کاتالوگ رخ داد.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleWipeCatalog = async () => {
    setWiping(true);
    try {
      const res = await apiRequest<{ success: boolean; deleted_games_count: number; message: string }>(
        "/admin-content/catalog/wipe",
        { method: "DELETE" }
      );
      setRecentGames([]);
      setShowWipeModal(false);
      setFeedback({
        type: "success",
        message: res.message || "تمامی بازی‌های دیتابیس با موفقیت پاک‌سازی شدند.",
      });
      loadHistory();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "خطا در پاک‌سازی کاتالوگ دیتابیس.",
      });
    } finally {
      setWiping(false);
    }
  };

  const platformBadges: { [key: string]: { label: string; bg: string; border: string; text: string } } = {
    PS5: { label: "PlayStation 5", bg: "bg-purple-900/40", border: "border-purple-500/40", text: "text-purple-300" },
    PS4: { label: "PlayStation 4", bg: "bg-blue-900/40", border: "border-blue-500/40", text: "text-blue-300" },
    Xbox: { label: "Xbox Series / One", bg: "bg-emerald-900/40", border: "border-emerald-500/40", text: "text-emerald-300" },
    Switch: { label: "Nintendo Switch", bg: "bg-rose-900/40", border: "border-rose-500/40", text: "text-rose-300" },
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
              <CloudDownload className="w-7 h-7" />
            </span>
            <span>دریافت و همگام‌سازی کاتالوگ بازی‌ها</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            استعلام مستقیم متادیتای بازی‌ها، فیلترهای زمانی و پلتفرم، و ذخیره‌سازی دائمی تصاویر باکیفیت ۱۰۸۰p در S3 لیارا.
          </p>
        </div>

        {/* Wipe Catalog Action Button */}
        <button
          onClick={() => setShowWipeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all font-medium text-sm self-start md:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          <span>پاک‌سازی کاتالوگ فعلی دیتابیس</span>
        </button>
      </div>

      {/* Alerts / Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : feedback.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {feedback.type === "success" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
            {feedback.type === "error" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            {feedback.type === "info" && <RotateCcw className="w-5 h-5 flex-shrink-0 animate-spin" />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity"
          >
            بستن
          </button>
        </div>
      )}

      {/* Main Grid: Form & Result preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Form Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={handleSync}
            className="bg-[#0f1422]/90 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>فیلترهای استعلام و دریافت کاتالوگ</span>
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Live Catalog Provider
              </span>
            </div>

            {/* 1. Platforms Multi-Select */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>انتخاب پلتفرم‌های کنسولی:</span>
                <span className="text-gray-500 text-[11px] font-normal">حداقل یک مورد باید انتخاب باشد</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(platformBadges).map(([key, info]) => {
                  const isSelected = selectedPlatforms.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePlatform(key)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? `${info.bg} ${info.border} ${info.text} ring-2 ring-emerald-500/30 scale-[1.02]`
                          : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span className="text-xs font-bold font-mono">{key}</span>
                      <span className="text-[10px] opacity-75">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Date Range */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>بازه تاریخ انتشار بازی‌ها:</span>
                </label>
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDate("2024-01-01", "2024-12-31")}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[11px]"
                  >
                    ۲۰۲۴
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("2023-01-01", "2023-12-31")}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[11px]"
                  >
                    ۲۰۲۳
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("2023-01-01", "2024-12-31")}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold"
                  >
                    ۲۰۲۳ تا ۲۰۲۴
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">از تاریخ (شروع بازه):</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">تا تاریخ (پایان بازه):</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 3. Min Rating & Sort Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Min Rating */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-gray-300 font-bold flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>حداقل امتیاز کاربری:</span>
                  </label>
                  <span className="font-bold font-mono text-amber-400">
                    {minRating > 0 ? `${minRating} از ۵.۰` : "همه امتیازها"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-black/40 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>همه</span>
                  <span>۲.۵</span>
                  <span>۴.۰</span>
                  <span>۵.۰</span>
                </div>
              </div>

              {/* Sort Strategy */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <ArrowUpDown className="w-4 h-4 text-emerald-400" />
                  <span>ترتیب مرتب‌سازی نتایج:</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="release_date_desc">تاریخ انتشار (جدیدترین به قدیمی‌ترین)</option>
                  <option value="release_date_asc">تاریخ انتشار (قدیمی‌ترین به جدیدترین)</option>
                  <option value="rating_desc">بالاترین امتیاز کاربری و منتقدان</option>
                </select>
              </div>
            </div>

            {/* 4. Requested Count */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                <span>تعداد بازی‌های درخواستی جهت دریافت:</span>
                <span className="font-mono text-emerald-400 font-bold">{count} بازی</span>
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono border transition-all ${
                      count === num
                        ? "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20"
                        : "bg-black/30 border-white/10 text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {num} عدد
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={syncing}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-sm ${
                  syncing
                    ? "bg-emerald-600/50 text-white cursor-wait"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-lg shadow-emerald-500/25"
                }`}
              >
                {syncing ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>در حال دریافت کاتالوگ و آپلود مدیا به S3 لیارا...</span>
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-5 h-5" />
                    <span>دریافت و همگام‌سازی کاتالوگ ({count} بازی)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 Col): System Architecture Info Card */}
        <div className="space-y-6">
          <div className="bg-[#0f1422]/90 border border-white/10 rounded-2xl p-6 space-y-5 backdrop-blur-md">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <Info className="w-5 h-5 text-teal-400" />
              <span>اصول معماری سامانه کاتالوگ</span>
            </h3>

            <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-emerald-400 block">✔ شناسه خنثی (source_id):</span>
                <p className="text-gray-400">
                  هیچ نامی از سرویس خارجی در ستون‌های دیتابیس وجود ندارد و از فیلد جنریک استفاده می‌شود.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-teal-400 block">✔ منطق هوشمند Upsert:</span>
                <p className="text-gray-400">
                  اگر بازی از قبل در دیتابیس باشد متادیتا و اسکرین‌شات‌ها آپدیت می‌شوند؛ در غیر این صورت بازی جدید ثبت می‌شود.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-blue-400 block">✔ آپلود خودکار ۱۰۸۰p به S3 لیارا:</span>
                <p className="text-gray-400">
                  کاور، هیرو بنر و ۶ اسکرین‌شات در سطل اختصاصی لیارا آپلود و مستقل از اینترنت بین‌الملل لود می‌شوند.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="font-bold text-rose-400 block">✔ بدون پارت دانلود خودکار:</span>
                <p className="text-gray-400">
                  هیچ پارت دانلودی به صورت خودکار یا فیک برای بازی‌ها تولید نمی‌شود.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section: Newly Synced Games */}
      {recentGames.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>بازی‌های دریافت/به‌روزرسانی‌شده در آخرین عملیات ({recentGames.length} مورد)</span>
            </h2>
            <span className="text-xs text-gray-400 font-mono">
              ثبت‌شده با شناسه یکتای source_id
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentGames.map((game) => (
              <div
                key={game.id}
                className="bg-[#0f1422] border border-white/10 rounded-2xl overflow-hidden flex flex-col group hover:border-emerald-500/40 transition-all hover:scale-[1.02]"
              >
                {/* Cover Image */}
                <div className="relative aspect-[3/4] bg-black/60 overflow-hidden">
                  {game.cover_image_url ? (
                    <img
                      src={getMediaUrl(game.cover_image_url)}
                      alt={game.title_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Gamepad2 className="w-12 h-12" />
                    </div>
                  )}

                  {/* Status Badge: New vs Updated */}
                  <span
                    className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md ${
                      game.is_updated
                        ? "bg-blue-500/90 text-white"
                        : "bg-emerald-500/90 text-black font-extrabold"
                    }`}
                  >
                    {game.is_updated ? "به‌روزرسانی شد" : "جدید ✔"}
                  </span>

                  {/* Rating */}
                  {game.rating > 0 && (
                    <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-amber-400 text-xs font-bold flex items-center gap-1">
                      ★ {game.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {game.title_en}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      شناسه: {game.source_id} | {game.released || "نامشخص"}
                    </p>
                  </div>

                  {/* Platforms */}
                  <div className="flex flex-wrap gap-1">
                    {game.platforms.map((p) => (
                      <span
                        key={p}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 font-mono"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>سوابق عملیات‌های دریافت کاتالوگ</span>
          </h2>
          <button
            onClick={loadHistory}
            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تازه‌سازی</span>
          </button>
        </div>

        <div className="bg-[#0f1422]/90 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-gray-400 font-medium">
                <tr>
                  <th className="p-3.5">شناسه</th>
                  <th className="p-3.5">وضعیت</th>
                  <th className="p-3.5">پلتفرم‌ها</th>
                  <th className="p-3.5">بازه تاریخ</th>
                  <th className="p-3.5">تعداد درخواستی</th>
                  <th className="p-3.5">ثبت جدید</th>
                  <th className="p-3.5">به‌روزرسانی</th>
                  <th className="p-3.5">زمان ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {loadingHistory ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      در حال بارگذاری سوابق...
                    </td>
                  </tr>
                ) : syncHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      هنوز هیچ عملیات دریافتی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  syncHistory.map((job) => (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-mono text-gray-400">#{job.id}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : job.status === "in_progress"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {job.status === "completed"
                            ? "موفق"
                            : job.status === "in_progress"
                            ? "در حال اجرا"
                            : "ناموفق"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex gap-1 font-mono text-[10px]">
                          {(job.platforms || []).map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">
                        {job.date_from && job.date_to ? `${job.date_from} تا ${job.date_to}` : "همه تاریخ‌ها"}
                      </td>
                      <td className="p-3.5 font-mono text-center">{job.requested_count}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold text-center">
                        {job.imported_count}
                      </td>
                      <td className="p-3.5 font-mono text-blue-400 font-bold text-center">
                        {job.updated_count}
                      </td>
                      <td className="p-3.5 font-mono text-gray-400 text-[11px]">
                        {job.created_at ? new Date(job.created_at).toLocaleString("fa-IR") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Wipe Catalog */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121727] border border-rose-500/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">تایید حذف کامل کاتالوگ بازی‌ها</h3>
                <p className="text-xs text-rose-400/80">این عملیات غیرقابل بازگشت است!</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              با تایید این درخواست، تمامی بازی‌های موجود در پایگاه داده همراه با تعاملات کاربران، لینک‌ها و فایل‌های وابسته به طور کامل حذف خواهند شد تا بتوانید کاتالوگ تمیز را از ابتدا دریافت و تست نمایید.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={wiping}
                onClick={() => setShowWipeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={wiping}
                onClick={handleWipeCatalog}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                {wiping ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>در حال پاک‌سازی...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>بله، پاک‌سازی کامل کن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
