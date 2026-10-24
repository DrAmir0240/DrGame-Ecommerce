"use client";

import { useState, useEffect } from "react";

export interface PlanConfig {
  id: "bronze" | "silver" | "gold";
  nameFa: string;
  nameEn: string;
  price: number;
  quotaGb: number;
  speedFa: string;
  speedEn: string;
  badgeFa: string;
  badgeEn: string;
  descFa: string;
  descEn: string;
  featuresFa: string[];
  featuresEn: string[];
  isVip?: boolean;
}

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: "bronze",
    nameFa: "پلن برنزی",
    nameEn: "Bronze Tier",
    price: 698000,
    quotaGb: 500,
    speedFa: "حداکثر سرعت بدون محدودیت",
    speedEn: "Maximum Uncapped Speed",
    badgeFa: "اقتصادی",
    badgeEn: "Economy",
    descFa: "مناسب برای گیمرهای نسل ۸ با حجم دانلود ماهانه مناسب",
    descEn: "Ideal for PS4 gamers with moderate monthly downloads",
    featuresFa: [
      "۵۰۰ گیگابایت سهمیه دانلود ماهیانه",
      "دسترسی به تمام بازی‌های نسل ۸",
      "۳ دانلود همزمان با لینک مستقیم",
      "حداکثر سرعت بدون محدودیت پهنای باند",
      "پشتیبانی تیکتی استاندارد",
    ],
    featuresEn: [
      "500 GB monthly download quota",
      "Access to all Gen-8 game archive",
      "3 concurrent direct downloads",
      "Maximum uncapped download speed",
      "Standard ticket support",
    ],
    isVip: false,
  },
  {
    id: "silver",
    nameFa: "پلن نقره‌ای",
    nameEn: "Silver Tier",
    price: 1198000,
    quotaGb: 1024,
    speedFa: "حداکثر سرعت بدون محدودیت",
    speedEn: "Maximum Uncapped Speed",
    badgeFa: "محبوب‌ترین",
    badgeEn: "Most Popular",
    descFa: "کامل‌ترین انتخاب برای تجربه بازی‌های جدید PS5 و PS4",
    descEn: "Most popular choice for all PS5 and PS4 games",
    featuresFa: [
      "۱,۰۲۴ گیگابایت سهمیه ترافیک ماهانه",
      "دسترسی به تمامی بازی‌های PS5 و PS4",
      "به‌روزرسانی خودکار پچ‌ها و DLCها",
      "۵ دانلود همزمان با قابلیت Resume",
      "حداکثر سرعت بدون محدودیت پهنای باند",
      "بسته‌های زیرنویس فارسی اختصاصی",
    ],
    featuresEn: [
      "1,024 GB monthly traffic quota",
      "Access to all PS5 and PS4 titles",
      "Automatic updates & DLCs",
      "5 concurrent downloads with resume",
      "Maximum uncapped download speed",
      "Exclusive Persian subtitles",
    ],
    isVip: false,
  },
  {
    id: "gold",
    nameFa: "پلن طلایی VIP",
    nameEn: "Gold VIP Tier",
    price: 2988000,
    quotaGb: 2252,
    speedFa: "حداکثر سرعت بدون محدودیت",
    speedEn: "Maximum Uncapped Speed",
    badgeFa: "پیشنهاد طلایی دکتر گیم",
    badgeEn: "Golden VIP Recommendation",
    descFa: "تجربه نهایی و نامحدود گیمینگ با ترافیک حجمی فوق‌العاده و اولویت مطلق",
    descEn: "Ultimate unrestricted gaming experience with huge quota and priority",
    featuresFa: [
      "۲,۲۵۲ گیگابایت سهمیه ترافیک فوق‌حجمی",
      "دسترسی نامحدود به کل کاتالوگ و FPKGها",
      "حداکثر سرعت بدون محدودیت پهنای باند",
      "دانلود همزمان نامحدود بدون افت پهنای باند",
      "زیرنویس و دوبله فارسی رایگان تمام عناوین",
      "پشتیبانی اختصاصی تلفنی و تلگرامی ۲۴ ساعته",
    ],
    featuresEn: [
      "2,252 GB super-high download quota",
      "Unrestricted access to all games & FPKGs",
      "Maximum uncapped download speed",
      "Unlimited simultaneous downloads",
      "Free Persian subtitles & dubbing",
      "24/7 dedicated Telegram & phone support",
    ],
    isVip: true,
  },
];

export function getStoredPlans(): PlanConfig[] {
  if (typeof window === "undefined") return DEFAULT_PLANS;
  try {
    const raw = localStorage.getItem("drgame_plans_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return DEFAULT_PLANS;
}

export function saveStoredPlans(plans: PlanConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("drgame_plans_config", JSON.stringify(plans));
    window.dispatchEvent(new CustomEvent("drgame_plans_change", { detail: plans }));
  } catch (e) {}
}

export function usePlans() {
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS);

  useEffect(() => {
    setPlans(getStoredPlans());

    const handlePlansChange = (e: any) => {
      if (Array.isArray(e.detail)) {
        setPlans(e.detail);
      } else {
        setPlans(getStoredPlans());
      }
    };

    window.addEventListener("drgame_plans_change", handlePlansChange);
    return () => window.removeEventListener("drgame_plans_change", handlePlansChange);
  }, []);

  return { plans, setPlans, saveStoredPlans };
}
