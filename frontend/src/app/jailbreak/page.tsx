"use client";

import React from "react";
import Link from "next/link";
import { Cpu, Terminal, ArrowRight, ExternalLink, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function JailbreakPage() {
  const { t } = useApp();

  const handleJailbreakClick = () => {
    // Redirects directly to google.com as instructed (user will configure target payload URL later)
    window.location.href = "https://google.com";
  };

  return (
    <Page>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-white transition-colors">
            {t("خانه", "Home")}
          </Link>
          <span>/</span>
          <span className="text-purple-400 font-bold">{t("جیلبریک کنسول", "Console Jailbreak")}</span>
        </nav>

        {/* Central Jailbreak Hub Card */}
        <div className="relative rounded-3xl border border-white/10 bg-[#151722]/95 backdrop-blur-xl p-8 md:p-12 shadow-2xl space-y-8 text-center overflow-hidden">
          {/* Ambient Lighting */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Badge & Title */}
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>{t("سامانه اجرای مستقیم جیلبریک کنسول", "Console WebKit Exploit Runner")}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {t("راهنمای اجرای جیلبریک پلی‌استیشن", "PlayStation Jailbreak Guide")}
            </h1>

            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              {t(
                "برای فعال‌سازی و بارگذاری کِرنل هک، مراحل ۳ گانه زیر را در کنسول خود طی کنید و روی دکمه اجرای جیلبریک بزنید.",
                "Follow the 3 simple steps below on your PlayStation console to trigger the jailbreak payload."
              )}
            </p>
          </div>

          {/* 3 Clear Ordered Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start relative z-10">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 font-mono font-black text-sm flex items-center justify-center border border-purple-500/30">
                ۱
              </div>
              <h3 className="font-extrabold text-sm text-white">
                {t("تنظیم دی‌ان‌اس (DNS)", "Setup DNS")}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t(
                  "در تنظیمات شبکه کنسول، دی‌ان‌اس اختصاصی دکتر گیم را به عنوان Primary DNS وارد کنید.",
                  "Enter the DrGame custom DNS in your console network settings."
                )}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-300 font-mono font-black text-sm flex items-center justify-center border border-blue-500/30">
                ۲
              </div>
              <h3 className="font-extrabold text-sm text-white">
                {t("باز کردن مرورگر کنسول", "Open Console Browser")}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t(
                  "از طریق کنسول، وب‌سایت دکتر گیم را باز کنید و وارد بخش جیلبریک شوید.",
                  "Launch the web browser on your console and navigate to the Jailbreak section."
                )}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 relative">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 font-mono font-black text-sm flex items-center justify-center border border-emerald-500/30">
                ۳
              </div>
              <h3 className="font-extrabold text-sm text-white">
                {t("کلیک روی دکمه جیلبریک", "Click Jailbreak Button")}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t(
                  "بر روی دکمه زیر کلیک کنید تا عملیات بارگذاری پی‌لود و جیلبریک آغاز گردد.",
                  "Click the button below to start injecting the payload and jailbreaking."
                )}
              </p>
            </div>
          </div>

          {/* The Single Jailbreak Button (Redirects to Google.com) */}
          <div className="pt-4 relative z-10">
            <button
              type="button"
              onClick={handleJailbreakClick}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base md:text-lg shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all border border-purple-400/40 cursor-pointer"
            >
              <Terminal className="w-5 h-5 text-purple-200" />
              <span>{t("اجرای جیلبریک کنسول", "Start Console Jailbreak")}</span>
              <ExternalLink className="w-5 h-5 text-purple-200" />
            </button>
            <span className="block text-[11px] text-slate-500 font-mono mt-3">
              Redirect Target: https://google.com (Configurable in settings)
            </span>
          </div>
        </div>
      </div>
    </Page>
  );
}
