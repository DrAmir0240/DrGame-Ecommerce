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
  ShieldCheck,
  FolderHeart,
  History,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/app";
import { USER } from "@/lib/data";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { t, lang, setLang, languages } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
        className="max-w-[1440px] h-full mx-auto px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4"
      >
        {/* Navigation & Brand Links */}
        <div className="flex items-center gap-1 md:gap-4 lg:gap-6 shrink-0">
          {/* 1. Brand Logo (Borderless) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 py-1 pe-2 group transition-all"
            title="DrGame Home"
          >
            <img
              src="/logo.png"
              alt="DrGame"
              className="w-10 h-10 object-contain filter drop-shadow-[0_0_14px_rgba(168,85,247,0.55)] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-start">
              <span className="font-black text-lg tracking-tight text-white leading-none group-hover:text-purple-300 transition-colors">
                DrGame
              </span>
              <span className="text-[10px] text-purple-400/90 font-bold tracking-wider uppercase font-mono">
                PlayStation Edge
              </span>
            </div>
          </Link>


          {/* 2. Games Catalog */}
          <Link
            href="/shop"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              pathname.startsWith("/shop")
                ? "bg-white/10 text-purple-400 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>{t("بازی‌ها", "Games")}</span>
          </Link>

          {/* 3. Specialized Tools */}
          <Link
            href="/tools"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              pathname.startsWith("/tools") || pathname.startsWith("/jailbreak")
                ? "bg-white/10 text-purple-400 shadow-sm"
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
                ? "bg-white/10 text-purple-400 shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4 text-pink-400" />
            <span>{t("مقالات", "Articles")}</span>
          </Link>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* 2-Way Language Switcher (FA / EN) */}
          <button
            type="button"
            onClick={() => setLang(lang === "fa" ? "en" : "fa")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-all font-bold"
            title={lang === "fa" ? "Switch to English" : "تغییر زبان به فارسی"}
          >
            <span className={lang === "fa" ? "text-purple-400 font-black" : "text-slate-400"}>فا</span>
            <span className="text-white/20">/</span>
            <span className={lang === "en" ? "text-purple-400 font-black" : "text-slate-400"}>EN</span>
          </button>

          {/* 5. Subscription Plan Button */}
          {isAuthenticated ? (
            <Link
              href="/panel?tab=subscription"
              title="اشتراک نقره‌ای فعال"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-bold hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">
                {USER.plan === "silver" ? t("اشتراک نقره‌ای", "Silver Plan") : t("اشتراک ویژه", "VIP Plan")}
              </span>
              <span className="text-[10px] text-purple-200/80 font-mono">
                {USER.quotaLeftGb}GB
              </span>
            </Link>
          ) : (
            <Link
              href="/subscriptions"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/25"
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-[#151722] animate-pulse" />
            </button>

            {showNotifications && (
              <div
                dir={lang === "fa" ? "rtl" : "ltr"}
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[#181a27] p-3 shadow-2xl z-50 space-y-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white">
                    {t("اعلان‌های اخیر", "Recent Notifications")}
                  </span>
                  <span className="text-[10px] text-purple-300 font-mono">۱ جدید</span>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="font-semibold text-white">دیتای بازی God of War آپدیت شد</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">پچ نسخه ۱.۰۴ با زیرنویس فارسی اضافه گردید.</p>
                  </div>
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-xs text-purple-400 font-bold hover:text-purple-300 py-1.5 border-t border-white/10 transition-colors"
                >
                  {t("مشاهده همه اعلان‌ها", "View All Notifications")}
                </Link>
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

          {/* 8. User Profile / Dropdown with Admin Access */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pe-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/40 transition-all"
                title="منوی کاربری و مدیریت"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {USER.avatar}
                </div>
                <span className="hidden lg:inline text-xs font-bold text-white">
                  {USER.name.split(" ")[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div
                  dir={lang === "fa" ? "rtl" : "ltr"}
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#151722] p-2 shadow-2xl z-50 text-xs space-y-1"
                >
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 mb-1">
                    <span className="font-extrabold text-white block truncate">{USER.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">PSN: {USER.psnId}</span>
                  </div>

                  <Link
                    href="/panel?tab=profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t("مشخصات حساب کاربری", "User Profile")}</span>
                  </Link>

                  <Link
                    href="/panel?tab=library"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    <FolderHeart className="w-3.5 h-3.5 text-pink-400" />
                    <span>{t("کتابخانه بازی‌های من", "My Games Library")}</span>
                  </Link>

                  <Link
                    href="/panel?tab=orders"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                  >
                    <History className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t("سوابق سفارش‌ها", "Order History")}</span>
                  </Link>

                  {/* DIRECT ADMIN LINK */}
                  <div className="pt-1 border-t border-white/10">
                    <Link
                      href="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all font-bold"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>{t("پنل مدیریت سامانه (Admin)", "Admin Dashboard")}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-purple-500/40 text-xs font-bold text-white hover:bg-white/5 transition-all"
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>{t("ورود / عضویت", "Login")}</span>
            </Link>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
