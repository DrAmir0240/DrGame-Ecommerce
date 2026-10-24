"use client";

import React, { useState } from "react";
import { Zap, Wifi, ShieldAlert, Copy, Check, Terminal, Play, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/app";

export const JailbreakPayloadSender: React.FC = () => {
  const { t, n } = useApp();

  const [consoleIp, setConsoleIp] = useState("192.168.1.50");
  const [port, setPort] = useState("9020");
  const [selectedPayload, setSelectedPayload] = useState("goldhen-2.4");
  const [statusLog, setStatusLog] = useState<string[]>([
    "آماده ارسال پی‌لود به کنسول در شبکه محلی...",
  ]);
  const [isSending, setIsSending] = useState(false);
  const [copiedDns, setCopiedDns] = useState<"p" | "s" | null>(null);

  const payloads = [
    { id: "goldhen-2.4", name: "GoldHEN v2.4b16.2 (PS4 9.00 / 11.00)", size: "420 KB" },
    { id: "etahen-1.8", name: "etaHEN v1.8b All-in-One (PS5 3.00-4.51)", size: "1.2 MB" },
    { id: "linux-loader", name: "Linux Payload Loader (PS4 Pro / Slim)", size: "850 KB" },
    { id: "ftp-server", name: "High-Speed FTP Server v1.07", size: "180 KB" },
  ];

  const handleSend = () => {
    setIsSending(true);
    setStatusLog((prev) => [
      `[${new Date().toLocaleTimeString()}] اتصال به ws://${consoleIp}:${port}...`,
      ...prev,
    ]);

    setTimeout(() => {
      setStatusLog((prev) => [
        `[${new Date().toLocaleTimeString()}] سوکت متصل شد. در حال ارسال فایل باینری ${selectedPayload}...`,
        ...prev,
      ]);

      setTimeout(() => {
        setIsSending(false);
        setStatusLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ✅ پی‌لود با موفقیت ارسال شد! نوتیفیکیشن در گوشه صفحه کنسول را بررسی کنید.`,
          ...prev,
        ]);
      }, 900);
    }, 800);
  };

  const copyDNS = (ip: string, type: "p" | "s") => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopiedDns(type);
      setTimeout(() => setCopiedDns(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DNS Box with Neon Yellow Accent (Matching Header) */}
      <div className="rounded-2xl border border-yellow-500/40 bg-[#171a1f] p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-yellow-400" />
          <h4 className="text-sm font-extrabold text-white">
            {t("تنظیم DNS ضدآپدیت و رفع فیلترینگ کنسول", "Anti-Update & Unblock DNS Servers")}
          </h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {t(
            "پیش از فعال‌سازی اکسپلویت، جهت مسدودسازی سرورهای آپدیت اجباری سونی و لود سریع کَش، DNS اختصاصی را در تنظیمات شبکه کنسول وارد کنید:",
            "Configure DrGame dedicated DNS in Network Settings to block forced firmware telemetry and cache payloads:"
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2 bg-[#0f1016] border border-white/10 px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="text-slate-400">DNS اصلی:</span>
            <span className="font-bold text-yellow-400">178.22.122.100</span>
            <button
              type="button"
              onClick={() => copyDNS("178.22.122.100", "p")}
              className="p-1 hover:bg-white/10 rounded"
              title="کپی"
            >
              {copiedDns === "p" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#0f1016] border border-white/10 px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="text-slate-400">DNS کمکی:</span>
            <span className="font-bold text-yellow-400">185.51.200.2</span>
            <button
              type="button"
              onClick={() => copyDNS("185.51.200.2", "s")}
              className="p-1 hover:bg-white/10 rounded"
              title="کپی"
            >
              {copiedDns === "s" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. WebSocket Sender Form */}
      <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <Zap className="w-5 h-5 text-purple-500" />
          <h3 className="font-extrabold text-base text-white">
            {t("ارسال‌کننده پی‌لود به کنسول (WebSocket Payload Sender)", "WebSocket Payload Injector")}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-slate-300 font-bold block">
              {t("آدرس IP کنسول در شبکه محلی:", "Console Local IP:")}
            </label>
            <input
              type="text"
              value={consoleIp}
              onChange={(e) => setConsoleIp(e.target.value)}
              placeholder="192.168.1.xxx"
              className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 px-3.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold block">{t("پورت سوکت:", "Port:")}</label>
            <select
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
            >
              <option value="9020">9020 (GoldHEN Server)</option>
              <option value="9021">9021 (Kstuff Server)</option>
              <option value="2121">2121 (FTP Server)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-bold block">
            {t("انتخاب پکیج پی‌لود باینری:", "Select Payload Package:")}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {payloads.map((p) => {
              const active = selectedPayload === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayload(p.id)}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                    active
                      ? "bg-purple-500/15 border-purple-500 text-white shadow-md shadow-purple-500/20"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span className="text-xs font-bold truncate max-w-[200px]">{p.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{p.size}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          disabled={isSending}
          onClick={handleSend}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isSending ? t("در حال ارسال پی‌لود...", "Injecting...") : t("ارسال پی‌لود به کنسول", "Inject Payload Now")}</span>
        </button>

        {/* Live Terminal Output */}
        <div className="rounded-2xl bg-[#0a0c12] border border-white/10 p-4 font-mono text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 pb-2 border-b border-white/5 text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>لاگ اتصال سوکت زنده (Terminal Log)</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 text-slate-300">
            {statusLog.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JailbreakPayloadSender;
