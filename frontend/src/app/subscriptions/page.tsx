"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Crown, Sparkles, HardDrive, Zap, Shield, ArrowRight, Star } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";
import { usePlans, type PlanConfig } from "@/lib/plans";

export default function SubscriptionsPage() {
  const { t, n } = useApp();
  const { plans } = usePlans();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold">
            <Crown className="w-4 h-4 text-purple-400" />
            <span>{t("تعرفه‌ها و طرح‌های اشتراک دکتر گیم", "DrGame Subscription Plans")}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {t("دانلود فوق‌سریع بازی‌ها با ترافیک لبه تهران", "Ultra-Fast Game Downloads with Uncapped Edge CDN")}
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {t(
              "تمام پلن‌های اشتراک دارای حداکثر سرعت دانلود بدون محدودیت پهنای باند و اتصال مستقیم به سرورهای لبه تهران ۱ هستند.",
              "All subscription tiers come with uncapped maximum download speeds and direct Tehran-1 edge connectivity."
            )}
          </p>

          {/* Billing Cycle Selector */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-[#101116] border border-white/10 text-xs font-bold mt-4">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl transition-all ${
                billingCycle === "monthly"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t("اشتراک ماهانه", "Monthly Billing")}
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{t("اشتراک سالانه", "Yearly Billing")}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                -۲۰٪ تخفیف
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => {
            const isGold = plan.id === "gold" || plan.isVip;
            const price =
              billingCycle === "yearly"
                ? Math.round(plan.price * 12 * 0.8)
                : plan.price;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all ${
                  isGold
                    ? "bg-gradient-to-b from-amber-500/[0.12] via-[#151722] to-[#151722] border-2 border-amber-400 shadow-[0_0_40px_rgba(245,197,66,0.25)] scale-[1.02]"
                    : "bg-[#151722] border border-white/10 hover:border-white/20 shadow-xl"
                }`}
              >
                {/* VIP Gold Tag */}
                {isGold && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{plan.badgeFa}</span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-xl font-black ${
                          isGold ? "text-amber-300 text-2xl" : "text-white"
                        }`}
                      >
                        {t(plan.nameFa, plan.nameEn)}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {t(plan.descFa, plan.descEn)}
                      </p>
                    </div>
                    {isGold && (
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                        <Crown className="w-6 h-6 fill-amber-400" />
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="pt-2 pb-4 border-b border-white/10">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`font-black text-3xl sm:text-4xl tracking-tight font-mono ${
                          isGold ? "text-amber-300" : "text-white"
                        }`}
                      >
                        {n(price.toLocaleString("fa-IR"))}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">
                        {t("تومان", "TOMAN")} / {billingCycle === "yearly" ? t("سالانه", "year") : t("ماهانه", "month")}
                      </span>
                    </div>

                    {/* Quota & Uncapped Max Speed */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono font-bold flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                        <span>{n(plan.quotaGb)} GB {t("سهمیه", "Quota")}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                        <span>{t(plan.speedFa, plan.speedEn)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-slate-400 block">
                      {t("خدمات و امکانات پلن:", "Plan Features:")}
                    </span>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {plan.featuresFa.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isGold ? "text-amber-400" : "text-purple-400"
                            }`}
                          />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-8">
                  <Link
                    href={`/panel?tab=subscription&select=${plan.id}`}
                    className={`w-full py-3.5 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                      isGold
                        ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/25 hover:scale-[1.02]"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25 hover:scale-[1.02]"
                    }`}
                  >
                    <span>{t("انتخاب و خرید اشتراک", "Subscribe Now")}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Page>
  );
}
