"use client";

import React, { useEffect, useState } from "react";
import {
  Layers,
  CheckCircle,
  Plus,
  Trash2,
  Zap,
  HardDrive,
  FileText,
  Sparkles,
  Headphones,
  ShieldCheck,
  Save,
  Check,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import { AdminFreeTierGame, AdminSubscriptionItem, AdminGameItem } from "@/types/admin";
import { SubscriptionTier } from "@/types/subscription";
import { apiRequest } from "@/lib/apiClient";

export default function AdminSubscriptionsPage() {
  const [freeGames, setFreeGames] = useState<AdminFreeTierGame[]>([]);
  const [allGames, setAllGames] = useState<AdminGameItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [adminTiers, setAdminTiers] = useState<SubscriptionTier[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [savingFree, setSavingFree] = useState(false);
  const [freeMessage, setFreeMessage] = useState<string | null>(null);

  // 3-Period Tier Config State
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6>(1);
  const [tierPrices, setTierPrices] = useState<Record<string, number>>({});
  const [tierQuotas, setTierQuotas] = useState<Record<string, number>>({});
  const [tierFeatures, setTierFeatures] = useState<Record<string, {
    allow_data: boolean;
    allow_cheat: boolean;
    allow_dlc: boolean;
    allow_subtitles: boolean;
    allow_dubbing: boolean;
  }>>({
    bronze: { allow_data: true, allow_cheat: false, allow_dlc: false, allow_subtitles: false, allow_dubbing: false },
    silver: { allow_data: true, allow_cheat: false, allow_dlc: true, allow_subtitles: true, allow_dubbing: false },
    gold: { allow_data: true, allow_cheat: true, allow_dlc: true, allow_subtitles: true, allow_dubbing: true },
  });
  const [isSavingTiers, setIsSavingTiers] = useState(false);
  const [tierSaveMsg, setTierSaveMsg] = useState<string | null>(null);
  const [tierSaveError, setTierSaveError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Subscription Tiers (Price, Quotas, Features, Durations)
      const tiersData = await apiRequest<SubscriptionTier[]>("/admin/subscription-tiers");
      if (tiersData) {
        setAdminTiers(tiersData);

        const newPrices: Record<string, number> = {};
        const newQuotas: Record<string, number> = {};
        const newFeatures: Record<string, any> = { ...tierFeatures };

        tiersData.forEach((t) => {
          newFeatures[t.code] = {
            allow_data: t.allow_data ?? true,
            allow_cheat: t.allow_cheat ?? false,
            allow_dlc: t.allow_dlc ?? false,
            allow_subtitles: t.allow_subtitles ?? false,
            allow_dubbing: t.allow_dubbing ?? false,
          };

          [1, 3, 6].forEach((m) => {
            const dKey = m === 1 ? '1_month' : `${m}_months`;
            const dur = t.durations?.[dKey];
            newPrices[`${t.code}-${m}`] = dur?.price_toman ?? ((t.price_toman || 0) * m);
            newQuotas[`${t.code}-${m}`] = dur?.quota_gb ?? ((t.quota_gb || 0) * m);
          });
        });

        setTierPrices(newPrices);
        setTierQuotas(newQuotas);
        setTierFeatures(newFeatures);
      }

      // 2. Free tier games
      const freeData = await apiRequest<AdminFreeTierGame[]>("/admin/free-tier-games");
      if (freeData) setFreeGames(freeData);

      // 3. All games for dropdown
      const gamesData = await apiRequest<{ items: AdminGameItem[] }>("/admin/games?page_size=100");
      if (gamesData) {
        setAllGames(gamesData.items || []);
      }

      // 4. Subscriptions list
      const subsData = await apiRequest<{ items: AdminSubscriptionItem[] }>("/admin/subscriptions?page_size=20");
      if (subsData) {
        setSubscriptions(subsData.items || []);
      }
    } catch (err) {
      console.error('Failed to load admin subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePriceChange = (tier: string, value: number) => {
    setTierPrices((prev) => ({
      ...prev,
      [`${tier}-${selectedDuration}`]: value,
    }));
  };

  const handleQuotaChange = (tier: string, value: number) => {
    setTierQuotas((prev) => ({
      ...prev,
      [`${tier}-${selectedDuration}`]: value,
    }));
  };

  const handleFeatureToggle = (tier: string, feature: 'allow_data' | 'allow_cheat' | 'allow_dlc' | 'allow_subtitles' | 'allow_dubbing') => {
    setTierFeatures((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [feature]: !prev[tier]?.[feature],
      },
    }));
  };

  const handleSaveTiers = async () => {
    try {
      setIsSavingTiers(true);
      setTierSaveMsg(null);
      setTierSaveError(null);
      const token = localStorage.getItem("drgame_admin_token");

      const tierCodes = ['free', 'bronze', 'silver', 'gold'];
      const batchPayload = tierCodes.map((code) => {
        const features = tierFeatures[code] || {
          allow_data: true,
          allow_cheat: false,
          allow_dlc: false,
          allow_subtitles: false,
          allow_dubbing: false,
        };

        return {
          code,
          price_toman: tierPrices[`${code}-1`] || 0,
          quota_gb: tierQuotas[`${code}-1`] || 0,
          allow_data: features.allow_data,
          allow_cheat: features.allow_cheat,
          allow_dlc: features.allow_dlc,
          allow_subtitles: features.allow_subtitles,
          allow_dubbing: features.allow_dubbing,
          durations: {
            "1": { price_toman: tierPrices[`${code}-1`] || 0, quota_gb: tierQuotas[`${code}-1`] || 0 },
            "3": { price_toman: tierPrices[`${code}-3`] || 0, quota_gb: tierQuotas[`${code}-3`] || 0 },
            "6": { price_toman: tierPrices[`${code}-6`] || 0, quota_gb: tierQuotas[`${code}-6`] || 0 },
          },
        };
      });

      await apiRequest("/admin/subscription-tiers", {
        method: "PUT",
        body: JSON.stringify({ tiers: batchPayload }),
      });

      setTierSaveMsg("تمام مبالغ، سهمیه‌های ۹ گانه و مجوزهای دانلود با موفقیت در پایگاه داده ذخیره و به روز رسانی شدند.");
      setTimeout(() => setTierSaveMsg(null), 4000);
      fetchData();
    } catch (err: any) {
      setTierSaveError(err.message || "خطا در ذخیره‌سازی");
    } finally {
      setIsSavingTiers(false);
    }
  };

  const handleAddFreeGame = async () => {
    if (!selectedGameId) return;
    if (freeGames.length >= 5) {
      alert("حداکثر ۵ بازی مجاز در پلن رایگان قابل ثبت است.");
      return;
    }

    const currentIds = freeGames.map((g) => g.game_id);
    if (currentIds.includes(Number(selectedGameId))) {
      alert("این بازی قبلاً در لیست مجاز قرار داده شده است.");
      return;
    }

    const newIds = [...currentIds, Number(selectedGameId)];
    await updateFreeGames(newIds);
  };

  const handleRemoveFreeGame = async (gameId: number) => {
    const newIds = freeGames.map((g) => g.game_id).filter((id) => id !== gameId);
    await updateFreeGames(newIds);
  };

  const updateFreeGames = async (ids: number[]) => {
    try {
      setSavingFree(true);
      setFreeMessage(null);
      await apiRequest("/admin/free-tier-games", {
        method: "POST",
        body: JSON.stringify({ game_ids: ids }),
      });
      setFreeMessage("لیست بازی‌های مجاز پلن رایگان با موفقیت ذخیره شد.");
      fetchData();
      setSelectedGameId("");
    } catch (err: any) {
      setFreeMessage(err.message || "خطا در به‌روزرسانی بازی‌های رایگان");
    } finally {
      setSavingFree(false);
    }
  };

  return (
    <div className="space-y-8 font-vazir text-right" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white mb-1 flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-purple-400" />
          <span>تنظیمات تعرفه، حجم اشتراک‌های ۹ گانه و دسترسی دانلود</span>
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          تعیین داینامیک قیمت و سهمیه دانلود هر پلن برای دوره‌های ۱، ۳ و ۶ ماهه، همراه با اعطای ویژگی‌های دانلود بخش‌های مختلف بازی
        </p>
      </div>

      {/* Messages */}
      {tierSaveMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-950/20">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{tierSaveMsg}</span>
        </div>
      )}

      {tierSaveError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2.5">
          <X className="w-5 h-5 shrink-0" />
          <span>{tierSaveError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. 3-PERIOD PRICING & QUOTA EDITOR (9 COMBINATIONS)                       */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-200">
                پیکربندی تعرفه و حجم سهمیه پلن‌ها (دوره‌های ۱، ۳ و ۶ ماهه)
              </h2>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                تغییر مبالغ به تومان و حجم سهمیه به گیگابایت برای هر دوره زمانی
              </span>
            </div>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#141b2d] border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedDuration(1)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDuration === 1
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>۱ ماهه (پایه)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDuration(3)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDuration === 3
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>۳ ماهه</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDuration(6)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDuration === 6
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>۶ ماهه</span>
            </button>
          </div>
        </div>

        {/* 4 Cards Grid for current duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'free', title: 'پلن رایگان (Free)', color: 'text-slate-300', border: 'border-slate-700', isFree: true },
            { key: 'bronze', title: 'پلن برنزی (Bronze)', color: 'text-amber-400', border: 'border-amber-500/30', isFree: false },
            { key: 'silver', title: 'پلن نقره‌ای (Silver)', color: 'text-cyan-300', border: 'border-cyan-500/30', isFree: false },
            { key: 'gold', title: 'پلن طلایی (Gold VIP)', color: 'text-yellow-400', border: 'border-yellow-500/30', isFree: false },
          ].map((t) => {
            const price = tierPrices[`${t.key}-${selectedDuration}`] ?? 0;
            const quota = tierQuotas[`${t.key}-${selectedDuration}`] ?? 0;

            return (
              <div
                key={t.key}
                className={`p-5 rounded-3xl bg-[#121721] border ${t.border} space-y-4 shadow-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                    <span className={`text-xs font-bold ${t.color}`}>{t.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      دوره {selectedDuration} ماهه
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        قیمت این دوره (تومان):
                      </label>
                      <input
                        type="number"
                        disabled={t.isFree}
                        value={price}
                        onChange={(e) => handlePriceChange(t.key, Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-roboto focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                      />
                      {!t.isFree && price > 0 && (
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {price.toLocaleString('fa-IR')} تومان
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        سهمیه حجم دانلودی (GB):
                      </label>
                      <input
                        type="number"
                        value={quota}
                        onChange={(e) => handleQuotaChange(t.key, Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-roboto focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {quota >= 1000 ? `${(quota / 1000).toFixed(1)} ترابایت` : `${quota} گیگابایت`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOWNLOAD FEATURES MATRIX (طلایی، نقره‌ای، برنزی)                       */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-200">
              ویژگی‌های دانلود انواع بخش‌های بازی (دسته‌بندی‌های سه‌گانه اشتراک)
            </h2>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              تعیین اجازه دانلود دیتای بازی، چیت، دی‌ال‌سی، زیرنویس فارسی و دوبله اختصاصی برای هر پلن اشتراک
            </span>
          </div>
        </div>

        {/* 3 Tier Columns for Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { key: 'bronze', title: 'اشتراک برنزی (Bronze)', border: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-400' },
            { key: 'silver', title: 'اشتراک نقره‌ای (Silver)', border: 'border-cyan-500/40', badge: 'bg-cyan-500/10 text-cyan-300' },
            { key: 'gold', title: 'اشتراک طلایی VIP (Gold)', border: 'border-yellow-500/40', badge: 'bg-yellow-500/10 text-yellow-400' },
          ].map((tier) => {
            const feats = tierFeatures[tier.key] || {
              allow_data: true,
              allow_cheat: false,
              allow_dlc: false,
              allow_subtitles: false,
              allow_dubbing: false,
            };

            const featureItems = [
              { id: 'allow_data' as const, label: 'دیتای خود بازی', icon: HardDrive, desc: 'دانلود پارت‌های اصلی دیتا' },
              { id: 'allow_cheat' as const, label: 'چیت و ترینر بازی', icon: Zap, desc: 'سیوگیم‌ها و ترینرهای اختصاصی' },
              { id: 'allow_dlc' as const, label: 'بسته‌های الحاقی (DLC)', icon: Sparkles, desc: 'افزونه‌ها و محتوای دانلودی اضافی' },
              { id: 'allow_subtitles' as const, label: 'زیرنویس فارسی بازی', icon: FileText, desc: 'ترجمه اختصاصی منوها و زیرنویس' },
              { id: 'allow_dubbing' as const, label: 'دوبله فارسی بازی', icon: Headphones, desc: 'صوت دوبله گویندگان فارسی' },
            ];

            return (
              <div
                key={tier.key}
                className={`p-5 rounded-3xl bg-[#121721] border ${tier.border} space-y-4 shadow-xl`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-white">{tier.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tier.badge}`}>
                    مجوزهای دانلود
                  </span>
                </div>

                <div className="space-y-2.5">
                  {featureItems.map((item) => {
                    const isEnabled = feats[item.id];
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleFeatureToggle(tier.key, item.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isEnabled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-xl ${isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{item.label}</span>
                            <span className="text-[10px] text-slate-400">{item.desc}</span>
                          </div>
                        </div>

                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isEnabled
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-slate-800 text-transparent border-slate-700'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save All Tiers & Features Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSaveTiers}
            disabled={isSavingTiers}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-95 active:scale-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
          >
            {isSavingTiers ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {isSavingTiers ? 'در حال ثبت در دیتابیس...' : 'ذخیره سراسری مبالغ، سهمیه‌ها و ویژگی‌های اشتراک'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FREE TIER 5-GAMES MANAGEMENT                                           */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                پیکربندی ۵ بازی مجاز در اشتراک رایگان
              </h2>
              <span className="text-[11px] text-slate-400">
                کاربران با پلن رایگان تنها مجاز به دانلود دیتای این عناوین منتخب هستند.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono self-start sm:self-auto">
            {freeGames.length} / 5 بازی انتخاب شده
          </span>
        </div>

        {/* Add game dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <select
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value ? Number(e.target.value) : "")}
            className="w-full sm:w-80 bg-[#121721] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">انتخاب بازی از کاتالوگ...</option>
            {allGames.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title_fa} ({g.title_en})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddFreeGame}
            disabled={savingFree || !selectedGameId || freeGames.length >= 5}
            className="w-full sm:w-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن به پلن رایگان</span>
          </button>
        </div>

        {freeMessage && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs">
            {freeMessage}
          </div>
        )}

        {/* Free Games Selected List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
          {freeGames.map((fg) => (
            <div
              key={fg.id}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between relative group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-12 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                  {fg.cover_image_url ? (
                    <img src={fg.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600">
                      No Img
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {fg.title_fa}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                    {fg.title_en}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFreeGame(fg.game_id)}
                className="w-full py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف از رایگان</span>
              </button>
            </div>
          ))}
          {freeGames.length === 0 && (
            <div className="col-span-full py-6 text-center text-xs text-slate-500">
              هنوز عنوانی برای پلن رایگان انتخاب نشده است.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. USER SUBSCRIPTIONS AUDIT LOG TABLE                                     */}
      {/* ========================================================================= */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-[#121721] flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>فهرست اشتراک‌های صادرشده کاربران</span>
          </h2>
          <span className="text-[11px] text-slate-400">آخرین تراکنش‌ها</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">شناسه</th>
                <th className="py-3 px-4 font-semibold">کاربر</th>
                <th className="py-3 px-4 font-semibold">پلن</th>
                <th className="py-3 px-4 font-semibold">تاریخ شروع</th>
                <th className="py-3 px-4 font-semibold">تاریخ انقضا</th>
                <th className="py-3 px-4 font-semibold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    اشتراکی یافت نشد.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-mono text-slate-400">#{s.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{s.user_name || "کاربر"}</span>
                      <span className="block text-[11px] text-slate-500 font-mono" dir="ltr">
                        {s.user_phone}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
                        {s.tier_code.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono" dir="ltr">
                      {new Date(s.starts_at).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono" dir="ltr">
                      {new Date(s.expires_at).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="py-3 px-4">
                      {s.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          فعال
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-[10px]">
                          منقضی
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
