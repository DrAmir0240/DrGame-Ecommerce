"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Gamepad2, Cpu, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Page } from "@/components/Shell";
import { QuickGamepadTester } from "@/components/QuickGamepadTester";
import { AdvancedDualSenseTester } from "@/components/AdvancedDualSenseTester";
import { useApp } from "@/lib/app";

export default function GamepadHubPage() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<"quick" | "advanced">("quick");

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
            <Gamepad2 className="w-4 h-4" />
            <span>{t("سامانه تست و کالیبراسیون گیم‌پد دکتر گیم", "Gamepad Diagnostic Studio")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            {t("تست سلامت و عیب‌یابی دسته‌های بازی", "Controller Health Check & Calibration Hub")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            {t(
              "سنجش دقیق دریفت شوک‌های آنالوگ، محرک‌های تطبیقی DualSense، ژیروسکوپ سنسور ۶ محوره و ویبره هپتیک کنترلرها بدون نیاز به نصب نرم‌افزار.",
              "Inspect analog stick drift, DualSense adaptive triggers, 6-axis gyroscope, and haptic feedback via browser Gamepad & WebHID APIs."
            )}
          </p>
        </div>

        {/* Tab 1 vs Tab 2 Switcher (A3 Decision) */}
        <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-[#151722] border border-white/10 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === "quick"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>{t("تستر سریع نیتیو", "Quick Native Tester")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === "advanced"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t("تستر پیشرفته DualSense", "Advanced DualSense")}</span>
          </button>
        </div>

        {/* Active Tab Component */}
        {activeTab === "quick" ? <QuickGamepadTester /> : <AdvancedDualSenseTester />}
      </div>
    </Page>
  );
}
