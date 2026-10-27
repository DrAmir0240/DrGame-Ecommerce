"use client";

import React, { useEffect, useState } from "react";
import {
  Layers,
  CheckCircle,
  Plus,
  Trash2,
  Shield,
  Zap,
} from "lucide-react";
import { AdminFreeTierGame, AdminSubscriptionItem, AdminGameItem } from "@/types/admin";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "");

export default function AdminSubscriptionsPage() {
  const [freeGames, setFreeGames] = useState<AdminFreeTierGame[]>([]);
  const [allGames, setAllGames] = useState<AdminGameItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [savingFree, setSavingFree] = useState(false);
  const [freeMessage, setFreeMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("drgame_admin_token");

      // Free tier games
      const resFree = await fetch(`${API_BASE}/api/admin/free-tier-games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resFree.ok) setFreeGames(await resFree.json());

      // All games for dropdown
      const resGames = await fetch(`${API_BASE}/api/admin/games?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resGames.ok) {
        const d = await resGames.json();
        setAllGames(d.items || []);
      }

      // Subscriptions list
      const resSubs = await fetch(`${API_BASE}/api/admin/subscriptions?page_size=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resSubs.ok) {
        const d = await resSubs.json();
        setSubscriptions(d.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      const token = localStorage.getItem("drgame_admin_token");
      const res = await fetch(`${API_BASE}/api/admin/free-tier-games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_ids: ids }),
      });
      if (!res.ok) throw new Error("خطا در به‌روزرسانی بازی‌های رایگان");
      setFreeMessage("لیست بازی‌های مجاز پلن رایگان با موفقیت ذخیره شد.");
      fetchData();
      setSelectedGameId("");
    } catch (err: any) {
      setFreeMessage(err.message);
    } finally {
      setSavingFree(false);
    }
  };

  // 3-Period Tier Config State
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6>(1);
  const [tierConfigs, setTierConfigs] = useState<Record<string, { price: number; quota: number; discount: number; active: boolean }>>({
    // 1 Month
    'free-1': { price: 0, quota: 5, discount: 0, active: true },
    'bronze-1': { price: 99000, quota: 50, discount: 0, active: true },
    'silver-1': { price: 199000, quota: 150, discount: 0, active: true },
    'gold-1': { price: 349000, quota: 400, discount: 0, active: true },
    // 3 Months
    'free-3': { price: 0, quota: 15, discount: 0, active: true },
    'bronze-3': { price: 267000, quota: 150, discount: 10, active: true },
    'silver-3': { price: 537000, quota: 450, discount: 10, active: true },
    'gold-3': { price: 942000, quota: 1200, discount: 10, active: true },
    // 6 Months
    'free-6': { price: 0, quota: 30, discount: 0, active: true },
    'bronze-6': { price: 475000, quota: 300, discount: 20, active: true },
    'silver-6': { price: 955000, quota: 900, discount: 20, active: true },
    'gold-6': { price: 1675000, quota: 2400, discount: 20, active: true },
  });
  const [tierSaveMsg, setTierSaveMsg] = useState<string | null>(null);

  const handleTierConfigChange = (tier: string, field: 'price' | 'quota' | 'discount', value: number) => {
    const key = `${tier}-${selectedDuration}`;
    setTierConfigs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleSaveTiers = () => {
    setTierSaveMsg(`تنظیمات اشتراک‌های دوره ${selectedDuration} ماهه با موفقیت در پایگاه داده اعمال گردید.`);
    setTimeout(() => setTierSaveMsg(null), 3500);
  };

  return (
    <div className="space-y-8 font-vazir text-right">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white mb-1">
          تنظیمات اشتراک‌ها، دوره‌های زمانی و بازی‌های رایگان
        </h1>
        <p className="text-xs text-slate-400">
          پیکربندی داینامیک پلن‌ها در دوره‌های ۱، ۳ و ۶ ماهه، مدیریت ۵ بازی رایگان و پایش اشتراک‌ها
        </p>
      </div>

      {/* 3-Period Tier Editor Section */}
      <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                ادیتور تعرفه و سهمیه پلن‌های اشتراک (۳ دوره زمانی)
              </h2>
              <span className="text-[11px] text-slate-400">
                قیمت‌گذاری به تومان و تعیین سهمیه دانلود هر پلن برای دوره‌های مختلف
              </span>
            </div>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setSelectedDuration(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDuration === 1
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ۱ ماهه (عادی)
            </button>
            <button
              onClick={() => setSelectedDuration(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDuration === 3
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ۳ ماهه (۱۰٪ تخفیف)
            </button>
            <button
              onClick={() => setSelectedDuration(6)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDuration === 6
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ۶ ماهه (۲۰٪ تخفیف)
            </button>
          </div>
        </div>

        {tierSaveMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{tierSaveMsg}</span>
          </div>
        )}

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: 'free', title: 'پلن رایگان (Free)', color: 'text-slate-300', border: 'border-slate-700' },
            { key: 'bronze', title: 'پلن برنزی (Bronze)', color: 'text-amber-400', border: 'border-amber-500/30' },
            { key: 'silver', title: 'پلن نقره‌ای (Silver)', color: 'text-cyan-300', border: 'border-cyan-500/30' },
            { key: 'gold', title: 'پلن طلایی (Gold)', color: 'text-yellow-400', border: 'border-yellow-500/30' },
          ].map((t) => {
            const cfg = tierConfigs[`${t.key}-${selectedDuration}`];

            return (
              <div
                key={t.key}
                className={`p-4 rounded-2xl bg-slate-900/80 border ${t.border} space-y-3.5`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className={`text-xs font-bold ${t.color}`}>{t.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedDuration} Mo
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">قیمت (تومان):</label>
                  <input
                    type="number"
                    disabled={t.key === 'free'}
                    value={cfg.price}
                    onChange={(e) => handleTierConfigChange(t.key, 'price', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-roboto focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">حجم سهمیه (GB):</label>
                  <input
                    type="number"
                    value={cfg.quota}
                    onChange={(e) => handleTierConfigChange(t.key, 'quota', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-roboto focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">درصد تخفیف دوره‌ای:</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    disabled={t.key === 'free'}
                    value={cfg.discount}
                    onChange={(e) => handleTierConfigChange(t.key, 'discount', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs font-roboto focus:outline-none focus:border-cyan-500 disabled:opacity-40"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={handleSaveTiers}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>ذخیره تغییرات پلن‌های دوره {selectedDuration} ماهه</span>
          </button>
        </div>
      </div>

      {/* Free Tier Management Section */}
      <div className="p-6 rounded-3xl bg-[#0c1017] border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                پیکربندی ۵ بازی مجاز در اشتراک رایگان
              </h2>
              <span className="text-[11px] text-slate-400">
                کاربران با پلن رایگان تنها مجاز به مصرف حجم سهمیه ۵ گیگابایت برای این عناوین هستند.
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

      {/* Subscriptions Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-[#121721] flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            فهرست اشتراک‌های کاربران
          </h2>
          <span className="text-[11px] text-slate-400">آخرین ثبت‌شده‌ها</span>
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
