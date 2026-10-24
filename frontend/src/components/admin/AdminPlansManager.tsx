"use client";

import React, { useState, useEffect } from "react";
import { Crown, Check, Plus, Trash2, Edit3, Sparkles } from "lucide-react";
import { usePlans, type PlanConfig } from "@/lib/plans";
import { useApp } from "@/lib/app";

export const AdminPlansManager: React.FC = () => {
  const { n } = useApp();
  const { plans, saveStoredPlans } = usePlans();
  const [editablePlans, setEditablePlans] = useState<PlanConfig[]>(plans);
  const [feedback, setFeedback] = useState("");
  const [newFeatureText, setNewFeatureText] = useState<{ [planId: string]: string }>({});

  useEffect(() => {
    setEditablePlans(plans);
  }, [plans]);

  const handleUpdateField = (
    index: number,
    field: keyof PlanConfig,
    value: string | number | boolean
  ) => {
    setEditablePlans((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleUpdateFeature = (planIndex: number, featureIndex: number, text: string) => {
    setEditablePlans((prev) => {
      const next = [...prev];
      const feats = [...next[planIndex].featuresFa];
      feats[featureIndex] = text;
      next[planIndex] = { ...next[planIndex], featuresFa: feats };
      return next;
    });
  };

  const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
    setEditablePlans((prev) => {
      const next = [...prev];
      const feats = next[planIndex].featuresFa.filter((_, idx) => idx !== featureIndex);
      next[planIndex] = { ...next[planIndex], featuresFa: feats };
      return next;
    });
  };

  const handleAddFeature = (planIndex: number, planId: string) => {
    const text = newFeatureText[planId]?.trim();
    if (!text) return;

    setEditablePlans((prev) => {
      const next = [...prev];
      next[planIndex] = {
        ...next[planIndex],
        featuresFa: [...next[planIndex].featuresFa, text],
      };
      return next;
    });

    setNewFeatureText((prev) => ({ ...prev, [planId]: "" }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredPlans(editablePlans);
    setFeedback("تمامی تغییرات قیمت‌ها، عناوین و خدمات پلن‌ها با موفقیت در سراسر سامانه ذخیره گردید.");
    setTimeout(() => setFeedback(""), 4000);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>مدیریت داینامیک پلن‌ها، قیمت‌ها و خدمات اشتراک (Plans Editor)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ویرایش زنده عنوان، قیمت، نشان، و افزودن یا حذف خدمات و ویژگی‌های پلن‌های برنزی، نقره‌ای و طلایی VIP
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
        >
          <Check className="w-4 h-4" />
          <span>ذخیره تغییرات کلیه پلن‌ها</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {editablePlans.map((plan, planIdx) => {
          const isGold = plan.id === "gold" || plan.isVip;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 space-y-4 text-xs ${
                isGold
                  ? "bg-gradient-to-b from-amber-500/[0.08] to-[#14151d] border-amber-400/40 shadow-xl shadow-amber-500/5"
                  : "bg-white/[0.02] border-white/10"
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span
                  className={`font-black text-sm flex items-center gap-1.5 ${
                    isGold ? "text-amber-400" : "text-white"
                  }`}
                >
                  {isGold && <Crown className="w-4 h-4 text-amber-400" />}
                  <span>{plan.id.toUpperCase()} PLAN</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isGold ? "bg-amber-400/20 text-amber-300" : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {plan.badgeFa}
                </span>
              </div>

              {/* Title & Badge Form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">عنوان فارسی پلن:</label>
                  <input
                    type="text"
                    value={plan.nameFa}
                    onChange={(e) => handleUpdateField(planIdx, "nameFa", e.target.value)}
                    className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-2.5 text-white font-bold focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">قیمت پلن (تومان):</label>
                  <input
                    type="number"
                    value={plan.price}
                    onChange={(e) => handleUpdateField(planIdx, "price", Number(e.target.value))}
                    className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-2.5 text-white font-mono font-bold focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block text-left font-mono">
                    معادل: {n(plan.price.toLocaleString())} تومان
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">سهمیه ترافیک (گیگابایت):</label>
                  <input
                    type="number"
                    value={plan.quotaGb}
                    onChange={(e) => handleUpdateField(planIdx, "quotaGb", Number(e.target.value))}
                    className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">برچسب تبلیغاتی (Badge):</label>
                  <input
                    type="text"
                    value={plan.badgeFa}
                    onChange={(e) => handleUpdateField(planIdx, "badgeFa", e.target.value)}
                    className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-2.5 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Features List */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-slate-300 font-bold block flex items-center justify-between">
                  <span>خدمات و ویژگی‌های داینامیک پلن:</span>
                  <span className="text-[10px] text-purple-400 font-mono">
                    {n(plan.featuresFa.length)} مورد
                  </span>
                </label>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pe-1">
                  {plan.featuresFa.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleUpdateFeature(planIdx, fIdx, e.target.value)}
                        className="flex-1 h-8 rounded-lg bg-[#070709] border border-white/10 px-2 text-[11px] text-white focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(planIdx, fIdx)}
                        title="حذف این خدمت"
                        className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Feature input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="عنوان خدمت جدید..."
                    value={newFeatureText[plan.id] || ""}
                    onChange={(e) =>
                      setNewFeatureText({ ...newFeatureText, [plan.id]: e.target.value })
                    }
                    className="flex-1 h-8 rounded-lg bg-[#070709] border border-white/10 px-2 text-[11px] text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddFeature(planIdx, plan.id)}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors shrink-0"
                    title="افزودن خدمت جدید"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
