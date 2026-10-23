"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Crown, Sparkles, HardDrive, Zap, Shield, ArrowRight } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function SubscriptionsPage() {
  const { t, n } = useApp();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      id: "free",
      nameFa: "پلن رایگان",
      nameEn: "Free Tier",
      price: 0,
      quotaGb: 0,
      speedFa: "محدود به بازی‌های رایگان",
      speedEn: "Free games only",
      badge: null,
      descFa: "دسترسی پایه به پلتفرم و دانلود عناوین رایگان و ابزارها",
      descEn: "Base access to free game titles and console tools",
      features: [
        "دسترسی نامحدود به بازی‌های Free Plan",
        "تست آنلاین گیم‌پد DualSense",
        "دسترسی به مقالات و اخبار گیمینگ",
        "ترافیک استاندارد صف عادی",
      ],
      notIncluded: [
        "دسترسی به بازی‌های پریمیوم PS5 و PS4",
        "دانلود دیتای بازی‌های هک‌شده جیلبریک",
        "زیرنویس‌های فارسی اختصاصی",
        "اولویت در پشتیبانی و دانلود نیم‌بها",
      ],
      borderClass: "border-white/10",
      accentBg: "bg-white/5",
      btnClass: "bg-white/10 hover:bg-white/15 text-white",
    },
    {
      id: "bronze",
      nameFa: "پلن برنزی",
      nameEn: "Bronze Tier",
      price: 698000,
      quotaGb: 500,
      speedFa: "استاندارد (تا ۵۰ مگابیت)",
      speedEn: "Standard (up to 50 Mbps)",
      badge: "اقتصادی",
      descFa: "مناسب برای گیمرهای نسل ۸ با حجم دانلود ماهانه متوسط",
      descEn: "Ideal for PS4 gamers with moderate monthly downloads",
      features: [
        "۵۰۰ گیگابایت سهمیه دانلود ماهیانه",
        "دسترسی کامل به آرشیو دیتای PS4",
        "دانلود پکیج‌های جیلبریک و فلش",
        "۳ دانلود همزمان با لینک مستقیم",
        "پشتیبانی تیکتی استاندارد",
      ],
      notIncluded: [
        "دیتای بازی‌های نسل ۹ (PS5)",
        "زیرنویس‌های فارسی اختصاصی",
        "سرعت دانلود گیگابیتی بدون لیمیت",
      ],
      borderClass: "border-amber-700/40",
      accentBg: "bg-amber-900/10",
      btnClass: "bg-amber-700 hover:bg-amber-600 text-white",
    },
    {
      id: "silver",
      nameFa: "پلن نقره‌ای",
      nameEn: "Silver Tier",
      price: 1198000,
      quotaGb: 1024,
      speedFa: "پرسرعت (تا ۱۰۰ مگابیت)",
      speedEn: "High-Speed (up to 100 Mbps)",
      badge: "محبوب‌ترین",
      descFa: "کامل‌ترین انتخاب برای تجربه بازی‌های جدید PS5 و PS4",
      descEn: "Most popular choice for all PS5 and PS4 games",
      features: [
        "۱,۰۲۴ گیگابایت (۱ ترابایت) سهمیه ترافیک",
        "دسترسی به تمامی بازی‌های PS5 و PS4",
        "به‌روزرسانی خودکار پچ‌ها و DLCها",
        "۵ دانلود همزمان با قابلیت Resume",
        "بسته‌های زیرنویس فارسی دکتر گیم",
        "پشتیبانی مستقیم در تلگرام",
      ],
      notIncluded: ["پهنای باند اختصاصی VIP"],
      borderClass: "border-slate-400/40",
      accentBg: "bg-slate-700/10",
      btnClass: "bg-slate-200 hover:bg-white text-slate-900 font-extrabold",
    },
    {
      id: "gold",
      nameFa: "پلن طلایی VIP",
      nameEn: "Gold VIP Tier",
      price: 2988000,
      quotaGb: 2252.8,
      speedFa: "نامحدود ۱ گیگابیت اختصاصی",
      speedEn: "Unmetered 1Gbps Dedicated",
      badge: "پیشنهادی دکتر گیم",
      descFa: "نهایت سرعت و خدمات بدون مرز با پشتیبانی تلفنی ۲۴ ساعته",
      descEn: "Ultimate speed with 24/7 dedicated engineering support",
      features: [
        "۲.۲ ترابایت سهمیه دانلود ویژه گیمرهای حرفه‌ای",
        "دسترسی VIP به نود لبه اختصاصی تهران ۱",
        "دانلود همزمان نامحدود بدون افت پینگ",
        "تمام زیرنویس‌ها، دوبله‌ها و تم‌های اختصاصی",
        "اولویت ۱ در اضافه شدن بازی‌های درخواستی",
        "پشتیبانی تلفنی و واتس‌اپ ۲۴ ساعته اختصاصی",
      ],
      notIncluded: [],
      borderClass: "border-orange-500 shadow-orange-500/25 shadow-2xl",
      accentBg: "bg-gradient-to-b from-orange-500/10 to-transparent",
      btnClass: "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/30",
    },
  ];

  const comparisonRows = [
    { title: "سهمیه ترافیک ماهانه", free: "۰ گیگابایت", bronze: "۵۰۰ GB", silver: "۱,۰۲۴ GB (1TB)", gold: "۲,۲۵۲ GB (2.2TB)" },
    { title: "دانلود همزمان", free: "۱ فایل", bronze: "۳ فایل", silver: "۵ فایل", gold: "نامحدود" },
    { title: "سرعت دانلود سرور", free: "عادی", bronze: "استاندارد", silver: "پرسرعت", gold: "حداکثر ۱Gbps اختصاصی" },
    { title: "آرشیو بازی‌های PS5", free: false, bronze: false, silver: true, gold: true },
    { title: "آرشیو بازی‌های PS4 و جیلبریک", free: false, bronze: true, silver: true, gold: true },
    { title: "زیرنویس‌های فارسی اختصاصی", free: false, bronze: false, silver: true, gold: true },
    { title: "پشتیبانی فنی", free: "تیکت عادی", bronze: "تیکت ۱۲ ساعته", silver: "تلگرام ۴ ساعته", gold: "تلفنی ۲۴/۷ آنی" },
  ];

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
            <Crown className="w-4 h-4 text-orange-400" />
            <span>{t("پلن‌های اشتراک پرسرعت دکتر گیم", "DrGame Membership Tiers")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            {t("انتخاب پلن دانلود متناسب با نیاز شما", "Choose Your High-Speed Download Plan")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {t(
              "اتصال مستقیم به سرورهای لبه تهران ۱ با پهنای باند اختصاصی و دانلود نیم‌بها بدون اعمال فیلترینگ و تحریم",
              "Direct low-latency connection to Tehran-1 edge node with zero restrictions"
            )}
          </p>
        </div>

        {/* 1. Four Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-3xl border ${p.borderClass} ${p.accentBg} bg-[#151722] p-6 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}
            >
              {p.badge && (
                <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold shadow-sm">
                  {p.badge}
                </span>
              )}

              <div>
                <h3 className="text-lg font-extrabold text-white">{t(p.nameFa, p.nameEn)}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px] leading-relaxed">
                  {t(p.descFa, p.descEn)}
                </p>

                {/* Price Display */}
                <div className="my-5 pb-5 border-b border-white/10">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    {p.price === 0 ? t("رایگان", "Free") : n(p.price.toLocaleString())}
                  </span>
                  {p.price > 0 && (
                    <span className="text-xs text-slate-400 ms-1.5">{t("تومان / ماهانه", "IRT / month")}</span>
                  )}
                  <span className="block text-[11px] text-orange-400 font-mono mt-1 font-bold">
                    {p.quotaGb === 0 ? "ترافیک پایه" : `${n(p.quotaGb)} GB ترافیک خالص`}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6 text-xs">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-200">
                      <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  {p.notIncluded.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-500">
                      <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <span className="line-through">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={p.price === 0 ? "/shop" : `/checkout?plan=${p.id}`}
                className={`w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${p.btnClass}`}
              >
                <span>{p.price === 0 ? t("شروع رایگان", "Start Free") : t("خرید اشتراک", "Choose Plan")}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          ))}
        </div>

        {/* 2. Detailed Feature Matrix Table */}
        <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="text-base md:text-lg font-extrabold text-white">
              {t("جدول مقایسه تفصیلی امکانات پلن‌های اشتراک", "Detailed Feature Comparison Matrix")}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold">
                  <th className="py-3 px-4 text-start">قابلیت / ویژگی</th>
                  <th className="py-3 px-4 text-center">پلن رایگان</th>
                  <th className="py-3 px-4 text-center text-amber-500">پلن برنزی</th>
                  <th className="py-3 px-4 text-center text-slate-300">پلن نقره‌ای</th>
                  <th className="py-3 px-4 text-center text-orange-400">پلن طلایی VIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-300 text-start">{row.title}</td>
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.free === "boolean" ? (
                        row.free ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-slate-400 font-mono">{row.free}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.bronze === "boolean" ? (
                        row.bronze ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-amber-400 font-mono font-bold">{row.bronze}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.silver === "boolean" ? (
                        row.silver ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-slate-200 font-mono font-bold">{row.silver}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {typeof row.gold === "boolean" ? (
                        row.gold ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />
                      ) : (
                        <span className="text-orange-400 font-mono font-bold">{row.gold}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Page>
  );
}
