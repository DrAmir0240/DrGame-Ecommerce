"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/common/Logo";
import { useLangStore } from "@/stores/langStore";
import { ShieldCheck, Zap, DownloadCloud, Tv } from "lucide-react";

export const Footer: React.FC = () => {
  const { lang } = useLangStore();

  const isFa = lang === "fa";

  return (
    <footer className="relative mt-20 border-t border-white/10 glass-panel bg-oled-bg/80 pt-12 pb-24 md:pb-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10 border-b border-white/5 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <Zap className="w-5 h-5 text-cosmic-light" />
            <div>
              <p className="font-bold text-white">{isFa ? "سرعت دانلود ۴۰ مگابیت" : "40 Mbps Dedicated Speed"}</p>
              <p className="text-[11px] text-zinc-500">{isFa ? "سرورهای قدرتمند ایران" : "Direct Fast Download"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <DownloadCloud className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-bold text-white">{isFa ? "دیتای تست‌شده کنسول" : "Tested PS4/PS5 Data"}</p>
              <p className="text-[11px] text-zinc-500">{isFa ? "سازگار با تمامی فرم‌ویرها" : "Compatible with all PKGs"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <Tv className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-bold text-white">{isFa ? "سازگار با تلویزیون ۶۰ اینچ" : "10-Foot UI TV Mode"}</p>
              <p className="text-[11px] text-zinc-500">{isFa ? "ناوبری با کنترلر و دسته" : "Gamepad & D-Pad Ready"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <ShieldCheck className="w-5 h-5 text-cosmic-accent" />
            <div>
              <p className="font-bold text-white">{isFa ? "پشتیبانی و تضمین سلامت" : "Verified & Safe Files"}</p>
              <p className="text-[11px] text-zinc-500">{isFa ? "بدون ارور و بدافزار" : "100% Clean Game Data"}</p>
            </div>
          </div>
        </div>

        {/* Links and Brand info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-xs leading-relaxed max-w-md text-zinc-400">
              {isFa
                ? "دکتر گیم، پلتفرم پیشرو و تخصصی اشتراک دانلود بازی‌های پلی‌استیشن ۴ و ۵ کپی‌خور و کنسول‌های رترو. ارائه جدیدترین بازی‌های روز با متادیتا و جوایز RAWG، زیرنویس فارسی، DLC و سیستم گیمیفیکیشن گیمرها."
                : "DrGame is the premier platform for PlayStation 4 & 5 jailbreak game downloads, retro catalogs, RAWG synced metadata, trophies, and gamified subscriptions."}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {isFa ? "دسترسی سریع" : "Quick Links"}
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/games" className="hover:text-cosmic-light transition-colors">{isFa ? "فروشگاه بازی‌ها" : "Game Catalog"}</Link></li>
              <li><Link href="/subscriptions" className="hover:text-cosmic-light transition-colors">{isFa ? "پلن‌های اشتراک حجمی" : "Subscription Tiers"}</Link></li>
              <li><Link href="/news" className="hover:text-cosmic-light transition-colors">{isFa ? "مجله و اخبار گیمینگ" : "Gaming News"}</Link></li>
              <li><Link href="/notifications" className="hover:text-cosmic-light transition-colors">{isFa ? "مرکز اعلان‌ها" : "Notifications"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
              {isFa ? "پلتفرم‌های پشتیبانی‌شده" : "Supported Consoles"}
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {["PS5", "PS4 Pro", "PS3", "PS2", "PS1", "Xbox 360", "Nintendo"].map((platform) => (
                <span
                  key={platform}
                  className="px-2 py-1 rounded bg-white/5 border border-white/10 text-zinc-300 font-mono"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-white/5 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} DrGame E-Commerce Platform. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
