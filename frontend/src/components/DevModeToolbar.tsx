"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  Tv,
  Shield,
  Zap,
  Check,
  ChevronUp,
  ChevronDown,
  Globe,
  Database,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";

export const DevModeToolbar: React.FC = () => {
  const { lang, setLang, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [psMode, setPsMode] = useState(false);
  const [footerVariant, setFooterVariant] = useState<"iran" | "intl">("iran");
  const [authSuccess, setAuthSuccess] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    try {
      const pm = localStorage.getItem("drgame_playstation_mode") === "true";
      setPsMode(pm);
      if (pm) {
        document.documentElement.classList.add("playstation-mode");
      }

      const fv = (localStorage.getItem("drgame_footer_variant") as "iran" | "intl") || "iran";
      setFooterVariant(fv);
    } catch (e) {}
  }, []);

  const togglePSMode = () => {
    const next = !psMode;
    setPsMode(next);
    try {
      localStorage.setItem("drgame_playstation_mode", String(next));
      if (next) {
        document.documentElement.classList.add("playstation-mode");
      } else {
        document.documentElement.classList.remove("playstation-mode");
      }
    } catch (e) {}
  };

  const toggleFooterVariant = () => {
    const next = footerVariant === "iran" ? "intl" : "iran";
    setFooterVariant(next);
    try {
      localStorage.setItem("drgame_footer_variant", next);
      window.dispatchEvent(new CustomEvent("drgame_footer_change", { detail: next }));
    } catch (e) {}
  };

  const handleQuickDevLogin = async () => {
    setLoggingIn(true);
    try {
      const res = await api.post<{ access_token: string }>("/api/v1/auth/dev-login");
      if (res.data?.access_token) {
        localStorage.setItem("drgame_token", res.data.access_token);
        setAuthSuccess(true);
        setTimeout(() => setAuthSuccess(false), 3000);
      }
    } catch (e) {
      localStorage.setItem("drgame_token", "dev_offline_superuser_token");
      setAuthSuccess(true);
      setTimeout(() => setAuthSuccess(false), 3000);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <aside aria-label="Developer Mode Toolbar" className="fixed bottom-4 start-4 z-50 font-sans print:hidden">
      {/* Minimized Pill */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#151722]/90 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-bold shadow-2xl hover:bg-purple-900/40 hover:scale-105 transition-all"
        >
          <Wrench className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
          <span>Dev Toolbar</span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      ) : (
        /* Expanded Floating Card */
        <div className="w-80 rounded-2xl bg-[#151722]/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 font-bold text-white">
              <Wrench className="w-4 h-4 text-purple-400" />
              <span>نوار ابزار توسعه دکتر گیم</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-2">
            {/* 1. Fast Auth */}
            <button
              onClick={handleQuickDevLogin}
              disabled={loggingIn}
              className="w-full py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ورود تستی سوپریوزر (Dev Auth)</span>
              </span>
              {authSuccess ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
              )}
            </button>

            {/* 2. Admin Console shortcut */}
            <Link
              href="/admin"
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>کنسول مدیریت (Admin Panel)</span>
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* 3. PlayStation Mode (10-Foot UI) Toggle */}
            <button
              onClick={togglePSMode}
              className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between font-bold transition-all ${
                psMode
                  ? "bg-purple-600/30 border-purple-500/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-purple-400" />
                <span>حالت پلی‌استیشن (10-Foot Mode)</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${psMode ? "bg-purple-500 text-white font-black" : "bg-black/40 text-slate-400"}`}>
                {psMode ? "فعال" : "غیرفعال"}
              </span>
            </button>

            {/* 4. Footer Switcher Toggle (Iran vs Intl) */}
            <button
              onClick={toggleFooterVariant}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-between font-bold transition-all"
            >
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>تغییر فوتر (Footer Switcher)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {footerVariant === "iran" ? "فوتر ایرانی" : "فوتر بین‌الملل"}
              </span>
            </button>
          </div>

          {/* Quick Environment info */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Node: Tehran-1 Edge</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default DevModeToolbar;
