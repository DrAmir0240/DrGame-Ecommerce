"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cpu, ShieldCheck, Download, Check, AlertTriangle, ExternalLink, HardDrive } from "lucide-react";
import { Page } from "@/components/Shell";
import { JailbreakPayloadSender } from "@/components/JailbreakPayloadSender";
import { useApp } from "@/lib/app";

export default function JailbreakPage() {
  const { t } = useApp();
  const [platformFilter, setPlatformFilter] = useState<"ALL" | "PS4" | "PS5">("ALL");

  const matrix = [
    { platform: "PS4", fw: "5.05 / 6.72", status: "پایدار و بدون فلش", tool: "GoldHEN v2.3", stability: "۱۰۰٪", method: "مرورگر وب‌کیت آفلاین", safe: true },
    { platform: "PS4", fw: "9.00", status: "محبوب‌ترین نگارش", tool: "GoldHEN v2.4b16", stability: "۹۸٪", method: "وب‌کیت + فلش مموری exfathax", safe: true },
    { platform: "PS4", fw: "11.00", status: "نگارش جدید", tool: "PPPwn C++", stability: "۹۰٪", method: "اتصال کابل شبکه LAN با PPPoE", safe: true },
    { platform: "PS5", fw: "3.00 تا 4.51", status: "اکسپلویت کامل", tool: "etaHEN + Kstuff", stability: "۹۵٪", method: "اکسپلویت IPv6 UMTX کِرنل", safe: true },
    { platform: "PS5", fw: "5.00 به بالا", status: "غیرقابل جیلبریک", tool: "در دست توسعه", stability: "۰٪", method: "تحت بررسی تیم‌های هک", safe: false },
  ];

  const filteredMatrix = matrix.filter((item) =>
    platformFilter === "ALL" ? true : item.platform === platformFilter
  );

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-10">
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-bold">
            <Cpu className="w-4 h-4" />
            <span>{t("پایگاه تخصصی هک و جیلبریک کنسول‌ها", "Jailbreak & Homebrew Hub")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            {t("مرجع سازگاری فریم‌ورک و ارسال مستقیم پی‌لود", "Firmware Compatibility Matrix & Payload Delivery")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            {t(
              "بررسی دقیق وضعیت جیلبریک تمام نگارش‌های نرم‌افزاری PS4 و PS5، ارسال پی‌لود به پورت‌های کنسول و دانلود ایمیج‌های استاندارد فلش USB.",
              "Detailed jailbreak firmware matrix, WebSocket payload injector, and verified USB exploit images."
            )}
          </p>
        </div>

        {/* 1. Interactive Compatibility Matrix */}
        <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <h3 className="text-base font-extrabold text-white">
              {t("ماتریس سازگاری نسخه‌های فریم‌ورک سونی", "Sony Firmware Compatibility Matrix")}
            </h3>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f1016] border border-white/10 text-xs">
              {(["ALL", "PS4", "PS5"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    platformFilter === p ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p === "ALL" ? t("همه", "All") : p}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold">
                  <th className="py-3 px-4 text-start">کنسول</th>
                  <th className="py-3 px-4 text-start">نسخه فریم‌ورک (Firmware)</th>
                  <th className="py-3 px-4 text-start">وضعیت هک</th>
                  <th className="py-3 px-4 text-start">ابزار اکسپلویت</th>
                  <th className="py-3 px-4 text-center">ضریب پایداری</th>
                  <th className="py-3 px-4 text-start">روش فعال‌سازی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-white text-start">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[11px]">
                        {row.platform}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-400 text-start">{row.fw}</td>
                    <td className="py-3.5 px-4 text-start">
                      <span className={`inline-flex items-center gap-1 font-semibold ${row.safe ? "text-green-400" : "text-red-400"}`}>
                        {row.safe ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-300 text-start">{row.tool}</td>
                    <td className="py-3.5 px-4 font-mono text-center text-slate-200">{row.stability}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-start">{row.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Payload Sender & DNS Setup Component (TSK-04-19) */}
        <JailbreakPayloadSender />

        {/* 3. USB Flashing Tutorial Guide */}
        <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
            <HardDrive className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-extrabold text-white">
              {t("راهنمای گام‌به‌گام آماده‌سازی فلش مموری اکسپلویت (exFAT)", "USB Exploit Drive Setup Guide")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                ۱
              </span>
              <h4 className="text-sm font-bold text-white">فرمت با ساختار exFAT</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                یک فلش مموری استاندارد USB 3.0 یا 2.0 را به کامپیوتر متصل کرده و با فایل‌سیستم exFAT به صورت کامل فرمت کنید.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                ۲
              </span>
              <h4 className="text-sm font-bold text-white">رایت فایل ایمیج exfathax.img</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ایمیج مخصوص را دانلود کرده و با نرم‌افزار Rufus یا Win32DiskImager روی درایو فلش رایت نمایید.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                ۳
              </span>
              <h4 className="text-sm font-bold text-white">اتصال به کنسول هنگام پیام</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                مرورگر کنسول را باز کرده و پس از نمایش پیام "Insert USB now"، فلش را به پورت کنسول متصل نمایید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
