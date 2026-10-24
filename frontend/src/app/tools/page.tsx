"use client";

import React from "react";
import Link from "next/link";
import { Wrench, Gamepad2, Cpu, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function ToolsIndexPage() {
  const { t } = useApp();

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-bold">
            <Wrench className="w-4 h-4" />
            <span>{t("جعبه ابزار تخصصی کنسول دکتر گیم", "Console Engineering Tools")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            {t("ابزارهای نرم‌افزاری و سخت‌افزاری کنسول", "Hardware Diagnostics & Firmware Utilities")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            {t(
              "مجموعه ابزارهای آنلاین جهت تست عیب‌یابی دسته‌های بازی، تزریق وب‌سوکت پی‌لودهای جیلبریک، و راهنمای راه‌اندازی DNS ضدتحریم.",
              "Online tools for controller diagnostics, local WebSocket payload injection, and anti-telemetry DNS setup."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tool 1: Gamepad Diagnostics */}
          <Link
            href="/tools/gamepad"
            className="group rounded-3xl border border-white/10 bg-[#151722] p-8 shadow-xl hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold shadow-lg">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white group-hover:text-purple-400 transition-colors">
                {t("تستر دوگانه گیم‌پد و DualSense", "Dual Gamepad & DualSense Tester")}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                {t(
                  "تست بلادرنگ دریفت شوک‌های آنالوگ، محرک‌های تطبیقی، تاچ‌پد خازنی و ژیروسکوپ سه‌بعدی کنترلرهای DualSense و تمامی دسته‌های استاندارد با WebHID.",
                  "Real-time analog stick drift testing, adaptive triggers force simulation, multi-touch touchpad, and 3D gyro."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
              <span>{t("ورود به تستر دسته", "Launch Gamepad Tester")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 2: Jailbreak Hub */}
          <Link
            href="/jailbreak"
            className="group rounded-3xl border border-white/10 bg-[#151722] p-8 shadow-xl hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold shadow-lg">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-white group-hover:text-blue-400 transition-colors">
                {t("پایگاه ارسال پی‌لود جیلبریک کنسول", "Jailbreak WebSocket Payload Hub")}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                {t(
                  "ماتریس سازگاری نسخه‌های فریم‌ورک PS4 و PS5، ارسال پی‌لود GoldHEN از طریق وب‌سوکت محلی، و راهنمای ساخت فلش مموری اکسپلویت.",
                  "Sony firmware compatibility matrix, local network GoldHEN payload sender, and USB flashing toolkit."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <span>{t("ورود به پایگاه جیلبریک", "Launch Jailbreak Hub")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </Page>
  );
}
