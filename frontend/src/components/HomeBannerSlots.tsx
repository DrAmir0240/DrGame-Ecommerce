"use client";

import React from "react";
import Link from "next/link";
import { Zap, Sparkles, ArrowRight, ShieldAlert, Cpu } from "lucide-react";
import { useApp } from "@/lib/app";

export const HomeBannerSlots: React.FC = () => {
  const { t } = useApp();

  return (
    <div className="w-full my-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Banner Slot 1: Static Jailbreak & Exploits */}
      <Link
        href="/jailbreak"
        className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-[#10192e] via-[#141b30] to-[#181a27] p-6 shadow-xl transition-all duration-300 hover:border-blue-500/60 hover:shadow-blue-500/20"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>{t("پایگاه اختصاصی هک و جیلبریک", "Jailbreak & Exploit Hub")}</span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-white group-hover:text-blue-300 transition-colors">
              {t(
                "آموزش کامل جیلبریک PS4 و PS5 با ارسال وب‌سوکت پی‌لود",
                "Full PS4 & PS5 Jailbreak Guide with WebSocket Payload Sender"
              )}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              {t(
                "ماتریس سازگاری نسخه‌های فریم‌ورک سونی، فایل‌های فلش USB، هاست‌های محلی و ابزار مستقیم ارسال پی‌لود به پورت‌های ۹۰۲۰ و ۹۰۲۱ کنسول.",
                "Sony firmware compatibility matrix, USB flash packages, and direct WebSocket payload delivery to ports 9020/9021."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 group-hover:text-blue-300">
            <span>{t("ورود به پایگاه جیلبریک", "Explore Jailbreak Hub")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>

      {/* Banner Slot 2: Configurable Admin Banner (Featured Festival / Promotion) */}
      <Link
        href="/subscriptions"
        className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-[#2a130e] via-[#20151f] to-[#181a27] p-6 shadow-xl transition-all duration-300 hover:border-orange-500/60 hover:shadow-orange-500/20"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-[10px] font-extrabold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>{t("جشنواره ویژه اشتراک‌ها", "Special Season Promotion")}</span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-white group-hover:text-orange-300 transition-colors">
              {t(
                "اشتراک طلایی با ترافیک نامحدود و ۳۵٪ تخفیف ولکام",
                "Gold Subscription with Unlimited Edge Traffic & 35% Welcome Discount"
              )}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              {t(
                "دسترسی نامحدود به کاتالوگ بیش از ۳۰۰ بازی، بدون محدودیت زمانی، همراه با سرور دانلود مستقیم نود تهران ۱ و پشتیبانی ۲۴ ساعته.",
                "Unlimited access to 300+ games catalog on low-latency Tehran-1 edge node with 24/7 dedicated engineering support."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-orange-400 group-hover:text-orange-300">
            <span>{t("مشاهده پلن‌ها و فعال‌سازی تخفیف", "View Plans & Activate Discount")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HomeBannerSlots;
