"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gamepad2,
  Wrench,
  BookOpen,
  Crown,
  Bell,
  ShoppingCart,
  User,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/lib/app";
import { USER } from "@/lib/data";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { t, lang, setLang, languages } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // In real app, user might be null or authenticated
  const isAuthenticated = true; // Parity with USER mock

  return (
    <header
      className="sticky top-0 z-40 w-full h-[70px] bg-[#151722] border-b border-white/[0.08] shadow-md transition-colors"
      style={{ minHeight: "70px" }}
    >
      {/* 
        Fixed Physical Left-to-Right Container:
        Always dir="ltr" to enforce the strict Gamer Muscle Memory policy:
        [1. Logo] [2. Games] [3. Tools] [4. Articles] ... [8. User Profile]
      */}
      <div
        dir="ltr"
        className="max-w-[1440px] h-full mx-auto px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4"
      >
        {/* Left Side: Navigation Links (1 to 4) */}
        <div className="flex items-center gap-1 md:gap-4 lg:gap-6 shrink-0">
          {/* 1. Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 py-1 pe-2 rounded-lg hover:opacity-90 transition-opacity"
            title="DrGame Home"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/50 flex items-center justify-center font-extrabold text-orange-500 text-lg shadow-sm">
              DG
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                DrGame
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Console Edge
              </span>
            </div>
          </Link>

          {/* 2. Games Catalog */}
          <Link
            href="/shop"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              pathname.startsWith("/shop")
                ? "bg-white/10 text-orange-400 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-orange-500" />
            <span>{t("بازی‌ها", "Games")}</span>
          </Link>

          {/* 3. Specialized Tools */}
          <Link
            href="/tools"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              pathname.startsWith("/tools") || pathname.startsWith("/jailbreak")
                ? "bg-white/10 text-orange-400 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>{t("ابزارها", "Tools")}</span>
          </Link>

          {/* 4. Articles & Guides */}
          <Link
            href="/articles"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              pathname.startsWith("/articles")
                ? "bg-white/10 text-orange-400 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>{t("مقالات", "Articles")}</span>
          </Link>
        </div>

        {/* Right Side: Actions (5 to 8) */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Quick Language Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Change Language"
            >
              <span className="uppercase font-bold">{lang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#181a27] p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      lang === l.code
                        ? "bg-orange-500/20 text-orange-400 font-bold"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Subscription Plan Button */}
          {isAuthenticated ? (
            <Link
              href="/panel?tab=subscription"
              title="اشتراک نقره‌ای فعال"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">
                {USER.plan === "silver" ? t("اشتراک نقره‌ای", "Silver Plan") : t("اشتراک ویژه", "VIP Plan")}
              </span>
              <span className="text-[10px] text-amber-200/80 font-mono">
                {USER.quotaLeftGb}GB
              </span>
            </Link>
          ) : (
            <Link
              href="/subscriptions"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-orange-500/25"
            >
              <Crown className="w-3.5 h-3.5 text-white" />
              <span>{t("خرید اشتراک", "Subscribe")}</span>
            </Link>
          )}

          {/* 6. Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              title={t("اعلان‌ها", "Notifications")}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#151722] animate-pulse" />
            </button>

            {showNotifications && (
              <div
                dir={lang === "fa" || lang === "ar" ? "rtl" : "ltr"}
                className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#181a27] p-3 shadow-xl z-50"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white">
                    {t("اعلان‌های اخیر", "Recent Notifications")}
                  </span>
                  <span className="text-[10px] text-slate-400">۱ جدید</span>
                </div>
                <div className="py-2.5 space-y-2 text-xs text-slate-300">
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="font-semibold text-white">دیتای بازی God of War آپدیت شد</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">پچ نسخه ۱.۰۴ با زیرنویس فارسی اضافه گردید.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 7. Shopping Cart with Coming Soon Tooltip */}
          <div className="relative group">
            <button
              type="button"
              disabled
              className="p-2 rounded-lg text-slate-500 cursor-not-allowed opacity-60 hover:opacity-80 transition-opacity"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-slate-200 shadow-md">
              {t("سبد خرید — به‌زودی", "Cart — Coming Soon")}
            </div>
          </div>

          {/* 8. User Profile / Login */}
          {isAuthenticated ? (
            <Link
              href="/panel"
              className="flex items-center gap-2 p-1.5 pe-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/40 transition-all"
              title="پنل کاربری"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {USER.avatar}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-white">
                {USER.name.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-orange-500/40 text-xs font-bold text-white hover:bg-white/5 transition-all"
            >
              <User className="w-3.5 h-3.5 text-orange-400" />
              <span>{t("ورود / عضویت", "Login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
