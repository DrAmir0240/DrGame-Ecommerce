"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { QuotaPill } from "@/components/layout/QuotaPill";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLangStore } from "@/stores/langStore";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { lang } = useLangStore();
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", label: lang === "fa" ? "خانه" : "Home" },
    { href: "/games", label: lang === "fa" ? "فروشگاه بازی‌ها" : "Store" },
    { href: "/subscriptions", label: lang === "fa" ? "اشتراک‌ها" : "Subscriptions" },
    { href: "/news", label: lang === "fa" ? "اخبار و مقالات" : "News" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass-panel shadow-lg backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Right Section: Logo & Primary Nav Links */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Logo size="md" />

          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  data-nav-item="true"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-white bg-cosmic-primary/25 border border-cosmic-light/40 shadow-cosmic"
                      : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center Section: Live Search Pill */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "fa"
                  ? "جستجو در بیش از ۳۰۰ بازی، ژانر یا استودیو..."
                  : "Search in 300+ games, genres, studios..."
              }
              data-nav-item="true"
              className="w-full bg-oled-surface/70 border border-white/10 focus:border-cosmic-light rounded-full py-2.5 ps-10 pe-4 text-xs text-white placeholder-zinc-500 transition-all duration-300 focus:shadow-cosmic focus:bg-oled-surface"
            />
            <Search className="absolute start-3.5 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Left Section: Quota, Notifications, Theme, Lang, User */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <QuotaPill />

          <Link
            href="/notifications"
            data-nav-item="true"
            title="اعلان‌ها"
            className="relative p-2.5 rounded-xl border border-white/10 hover:border-cosmic-light transition-all duration-300 bg-white/5 hover:bg-cosmic-primary/20 text-zinc-300 hover:text-white"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-cosmic-accent animate-ping" />
            <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-cosmic-accent" />
          </Link>

          <ThemeToggle />
          <LanguageSwitcher />

          <Link
            href="/profile"
            data-nav-item="true"
            className="flex items-center gap-2 p-1.5 pe-3 rounded-full border border-white/10 hover:border-cosmic-light bg-gradient-to-r from-cosmic-primary/20 to-transparent hover:shadow-cosmic transition-all duration-300"
          >
            <div className="w-7 h-7 rounded-full bg-cosmic-gradient flex items-center justify-center text-white shadow-sm">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-white">
              {lang === "fa" ? "حساب کاربری" : "Profile"}
            </span>
          </Link>
        </div>

      </div>
    </header>
  );
};
