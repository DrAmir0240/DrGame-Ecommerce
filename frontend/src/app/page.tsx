"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  HardDrive,
  Sparkles,
  Zap,
  Play,
  Tv,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { LogoMotion } from "@/components/common/LogoMotion";
import { useLangStore } from "@/stores/langStore";

export default function HomePage() {
  const { lang } = useLangStore();
  const [showMotionModal, setShowMotionModal] = useState(false);
  const isFa = lang === "fa";

  const tiers = [
    {
      name: isFa ? "رایگان" : "Free",
      color: "border-zinc-500/40 text-zinc-300",
      badge: isFa ? "۵ بازی ثابت" : "5 Games",
      price: isFa ? "رایگان (همیشگی)" : "Free Forever",
      quota: isFa ? "نامحدود برای ۵ بازی" : "Unlimited for 5 Games",
      speed: "10 Mbps",
      accent: "bg-zinc-700/30",
    },
    {
      name: isFa ? "برنز" : "Bronze",
      color: "border-amber-600/50 text-amber-400",
      badge: "500 GB",
      price: isFa ? "۶۹۸,۰۰۰ تومان / ماه" : "698K Tomans / mo",
      quota: "500 GB " + (isFa ? "دانلود دیتا" : "Data"),
      speed: "20 Mbps",
      accent: "bg-amber-900/20",
    },
    {
      name: isFa ? "نقره‌ای" : "Silver",
      color: "border-slate-300/60 text-slate-200",
      badge: "1 TB",
      price: isFa ? "۱,۱۹۸,۰۰۰ تومان / ماه" : "1,198K Tomans / mo",
      quota: "1 TB " + (isFa ? "دانلود دیتا" : "Data"),
      speed: "20 Mbps",
      accent: "bg-slate-700/20",
    },
    {
      name: isFa ? "طلایی" : "Gold",
      color: "border-amber-400/80 text-amber-300 shadow-cosmic",
      badge: "2.2 TB VIP",
      price: isFa ? "۲,۹۸۸,۰۰۰ تومان / ماه" : "2,988K Tomans / mo",
      quota: "2.2 TB " + (isFa ? "دانلود اختصاصی" : "VIP Data"),
      speed: "40 Mbps",
      accent: "bg-amber-500/20",
      highlight: true,
    },
  ];

  return (
    <div className="relative overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left/Right Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cosmic-primary/20 border border-cosmic-light/40 text-xs font-semibold text-cosmic-light shadow-cosmic">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              <span>
                {isFa
                  ? "نسل جدید پلتفرم دیتای بازی‌های کنسول PS4 و PS5"
                  : "Next-Gen PS4 & PS5 Console Game Data Platform"}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-tight">
              {isFa ? (
                <>
                  جهان بازی‌های <span className="text-transparent bg-clip-text bg-cosmic-gradient">پلی‌استیشن</span>{" "}
                  در دستان شما
                </>
              ) : (
                <>
                  The Ultimate <span className="text-transparent bg-clip-text bg-cosmic-gradient">PlayStation</span>{" "}
                  Gaming Universe
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {isFa
                ? "دانلود مستقیم دیتای بازی‌های کپی‌خور و ارتقایافته، متادیتای کامل و جوایز RAWG، زیرنویس فارسی، مدیریت سهمیه حجمی با سرعت ۴۰ مگابیت و تجربه کاربری در سطح کنسول پلی‌استیشن."
                : "Direct jailbreak PKG game downloads, enriched RAWG metadata, Persian subtitles, dedicated high-speed quotas, and a console-grade 10-Foot UI experience."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/games"
                data-nav-item="true"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-cosmic-gradient text-white font-bold text-sm shadow-cosmic hover:shadow-cosmic-lg hover:scale-105 transition-all duration-300"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>{isFa ? "مشاهده کاتالوگ بازی‌ها" : "Explore Game Catalog"}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              <button
                onClick={() => setShowMotionModal(true)}
                data-nav-item="true"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl glass-card border border-white/10 hover:border-cosmic-light text-zinc-200 hover:text-white font-medium text-sm transition-all duration-300"
              >
                <Play className="w-4 h-4 text-cosmic-light fill-cosmic-light" />
                <span>{isFa ? "پخش لوگوموشن دکتر گیم" : "Watch Logo Motion"}</span>
              </button>

              <Link
                href="/subscriptions"
                data-nav-item="true"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-medium text-sm transition-all duration-300"
              >
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>{isFa ? "پلن‌های سهمیه" : "Quota Tiers"}</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 max-w-md mx-auto lg:mx-0 border-t border-white/10 text-center lg:text-start">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">300+</p>
                <p className="text-xs text-zinc-500">{isFa ? "بازی کپی‌خور" : "Jailbreak Games"}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-cosmic-light">40 Mbps</p>
                <p className="text-xs text-zinc-500">{isFa ? "سرعت دانلود" : "Max Speed"}</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-amber-400">10-Foot</p>
                <p className="text-xs text-zinc-500">{isFa ? "حالت تلویزیون ۶۰ اینچ" : "TV Mode"}</p>
              </div>
            </div>

          </div>

          {/* Hero Right/Left: Logo Motion Player Banner */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Glow backdrop */}
              <div className="absolute -inset-2 bg-cosmic-gradient rounded-3xl opacity-30 blur-2xl animate-pulse-glow" />

              {/* Logo Motion Card */}
              <LogoMotion className="relative z-10 w-full" autoplay={true} loop={true} />

              {/* Floating Pill: Spatial Nav badge */}
              <div className="absolute -bottom-4 -start-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl glass-panel border border-cosmic-light/40 shadow-cosmic text-xs text-white">
                <Tv className="w-4 h-4 text-cosmic-light" />
                <span>{isFa ? "پشتیبانی از دسته بازی و تلویزیون" : "Gamepad & 10-Foot TV Ready"}</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Subscription Tiers Showcase Section */}
      <section className="relative py-16 bg-oled-surface/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-primary/20 text-cosmic-light text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{isFa ? "پلن‌های اشتراک سهمیه" : "Subscription Tiers"}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              {isFa ? "سهمیه دلخواه خود را انتخاب کنید" : "Choose Your Download Quota"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              {isFa
                ? "از پلن رایگان با ۵ بازی پرطرفدار تا ۲.۲ ترابایت سهمیه VIP با سرعت فوق‌العاده"
                : "From free 5 featured games up to 2.2 TB VIP quota with lightning-fast speeds"}
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className={`glass-card p-6 flex flex-col justify-between border ${tier.color} ${tier.accent} ${
                  tier.highlight ? "ring-2 ring-cosmic-light shadow-cosmic" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mb-6">{tier.price}</p>

                  <div className="space-y-2.5 text-xs text-zinc-300 mb-8">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{tier.quota}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cosmic-light shrink-0" />
                      <span>{tier.speed}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/subscriptions"
                  data-nav-item="true"
                  className={`w-full py-2.5 text-center rounded-xl text-xs font-bold transition-all duration-300 ${
                    tier.highlight
                      ? "bg-cosmic-gradient text-white shadow-cosmic hover:shadow-cosmic-lg"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {isFa ? "انتخاب این پلن" : "Select Tier"}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Modal for Logo Motion */}
      {showMotionModal && (
        <LogoMotion isModal={true} onClose={() => setShowMotionModal(false)} />
      )}

    </div>
  );
}
