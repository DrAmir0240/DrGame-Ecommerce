"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Cpu } from "lucide-react";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";

export const HomeBannerSlots: React.FC = () => {
  const { t } = useApp();

  const [banner2, setBanner2] = useState({
    title: "اشتراک طلایی با ترافیک نامحدود و ۳۵٪ تخفیف ولکام",
    badge: "جشنواره ویژه اشتراک‌ها",
    link: "/subscriptions",
    description: "دسترسی مستقیم و نامحدود به کاتالوگ ۵ ترابایتی بازی‌های کپی‌خور PS4 و PS5.",
  });

  useEffect(() => {
    api.get("/api/v1/settings/public")
      .then((res) => {
        if (res.data?.banner_slot_2) {
          const b = res.data.banner_slot_2;
          setBanner2({
            title: b.title_fa || banner2.title,
            badge: b.badge_fa || banner2.badge,
            link: b.target_url || banner2.link,
            description: b.description_fa || banner2.description,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full my-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Banner Slot 1: Static Jailbreak & Exploits */}
      <Link
        href="/jailbreak"
        className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-[#10192e] via-[#141b30] to-[#101116] p-6 shadow-xl transition-all duration-300 hover:border-blue-500/60 hover:shadow-blue-500/20"
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

      {/* Banner Slot 2: Configurable Admin Banner (Dynamic from API) */}
      <Link
        href={banner2.link}
        className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-[#1c1428] to-[#101116] p-6 shadow-xl transition-all duration-300 hover:border-purple-500/60 hover:shadow-purple-500/20"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-extrabold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>{t(banner2.badge, "Special Promotion")}</span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
              {t(banner2.title, banner2.title)}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              {t(banner2.description, banner2.description)}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 group-hover:text-purple-300">
            <span>{t("مشاهده پلن‌ها و ارتقای سهمیه", "Upgrade to Gold")}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HomeBannerSlots;
