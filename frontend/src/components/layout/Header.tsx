'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Gamepad2,
  DownloadCloud,
  Wrench,
  BookOpen,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationDropdown from './NotificationDropdown';
import SubscriptionBadge from './SubscriptionBadge';

// Desktop navigation items (ordered from rightmost to center in RTL)
const NAV_ITEMS = [
  { href: '/', label: 'خانه', icon: Home, exact: true, activeColor: 'text-purple-400' },
  { href: '/games', label: 'بازی‌ها', icon: Gamepad2, activeColor: 'text-cosmic-purple' },
  { href: '/dashboard/downloads', label: 'دانلودها', icon: DownloadCloud, activeColor: 'text-cyan-400' },
  { href: '/tools', label: 'ابزار', icon: Wrench, activeColor: 'text-amber-400' },
  { href: '/blog', label: 'مقالات', icon: BookOpen, activeColor: 'text-emerald-400' },
];

// Mobile fixed bottom navigation (5 main destinations)
const MOBILE_BOTTOM_NAV = [
  { href: '/', label: 'خانه', icon: Home, exact: true },
  { href: '/games', label: 'بازی‌ها', icon: Gamepad2 },
  { href: '/dashboard/downloads', label: 'دانلودها', icon: DownloadCloud },
  { href: '/tools', label: 'ابزار', icon: Wrench },
  { href: '/blog', label: 'مقالات', icon: BookOpen },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, setAuthModalOpen, logout, fetchCurrentUser } = useAuthStore();
  const [showDnsWarning, setShowDnsWarning] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Do not render storefront header inside the admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isNavActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
  };

  return (
    <>
      {/* Top DNS Warning Banner (Yellow / Amber) */}
      {showDnsWarning && (
        <div className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-slate-950 border-b border-amber-500 shadow-md relative z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center text-center flex-wrap text-xs sm:text-sm font-bold leading-relaxed">
              <span className="flex items-center gap-1.5 shrink-0 text-slate-950 font-black">
                <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
                <span className="hidden xs:inline">توجه:</span>
              </span>
              <span>برای دسترسی به وب‌سایت دکتر گیم روی کنسول DNS اختصاصی :</span>
              <span
                className="font-roboto font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 tracking-wider shadow-inner"
                dir="ltr"
              >
                165.227.83.145
              </span>
              <span>دکتر گیم را وارد کنسول خود کنید</span>
            </div>

            <button
              onClick={() => setShowDnsWarning(false)}
              className="p-1 rounded-lg hover:bg-slate-950/15 text-slate-950 shrink-0 transition-colors"
              title="بستن اعلان"
              aria-label="بستن اعلان"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header: 11 Elements from Left to Right */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-surface-base/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* =========================================================================
              RIGHT SECTION (Visual Right in RTL): Navigation Links (Items 11 down to 7)
              11. خانه (Home) | 10. بازی‌ها (Games) | 9. دانلودها (Downloads) | 8. ابزار (Tools) | 7. مقالات (Articles)
             ========================================================================= */}
          <nav
            aria-label="منوی اصلی وب‌سایت"
            className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs lg:text-sm transition-all duration-200 ${
                    active
                      ? 'bg-white/15 text-white border border-white/25 shadow-[0_0_15px_rgba(168,85,247,0.35)] font-bold'
                      : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? item.activeColor : 'text-slate-300 group-hover:text-white transition-colors'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* =========================================================================
              CENTER SECTION: DrGame Logo (Item 6) - Centered without <a> / <Link> tag
             ========================================================================= */}
          <div className="flex items-center justify-center shrink-0 cursor-default select-none group">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cosmic-purple/20 border border-cosmic-purple/30 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_18px_rgba(168,85,247,0.4)] transition-all overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="DrGame Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-right">
                <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                  دکتر گیم
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-300 font-roboto font-bold tracking-wider">
                  DRGAME.IR
                </span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              LEFT SECTION (Visual Left in RTL): Controls (Items 5 down to 1)
              5. اشتراک فعال / خرید | 4. تغییر زبان | 3. اعلان‌ها | 2. سبد خرید | 1. پروفایل / ورود
             ========================================================================= */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 5. نشان اشتراک فعال یا دکمه خرید اشتراک */}
            <div className="hidden sm:block">
              <SubscriptionBadge />
            </div>

            {/* 4. سوئیچ زبان */}
            <LanguageSwitcher />

            {/* 3. اعلان‌ها (Notification Dropdown) */}
            <NotificationDropdown />

            {/* 2. آیکون سبد خرید با هاور انیمیشنی «به‌زودی» */}
            <div className="relative group shrink-0">
              <button
                type="button"
                className="p-2 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/40 text-slate-200 hover:text-white transition-all group-hover:scale-105 shrink-0 focus:outline-none"
                aria-label="سبد خرید (به‌زودی)"
              >
                <ShoppingCart className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
              </button>

              {/* Tooltip on hover */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg bg-surface-card border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-xl pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 whitespace-nowrap">
                <span>به‌زودی</span>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-card border-t border-l border-amber-500/30 rotate-45" />
              </div>
            </div>

            {/* 1. دکمه پروفایل مینیمال / ورود کاربر */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href="/profile"
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass-card border border-white/15 hover:border-cosmic-purple/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all overflow-hidden shrink-0 group"
                  title={`پروفایل کاربر: ${user.full_name || user.username}`}
                  aria-label="پروفایل کاربری"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'User Avatar'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-slate-200 group-hover:text-cosmic-purple transition-colors" />
                  )}
                </Link>

                <button
                  onClick={() => logout()}
                  title="خروج از حساب"
                  aria-label="خروج از حساب"
                  className="hidden md:flex p-2 rounded-xl glass-card border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-all shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true, 'otp')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-cosmic-gradient hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-neon-purple transition-all whitespace-nowrap shrink-0"
              >
                ورود / ثبت‌نام
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (5 Items) */}
      <nav
        aria-label="نوار دسترسی سریع موبایل"
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#0a0d14]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-center justify-around">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center py-1.5 px-1 group transition-all duration-200"
              >
                {/* Active Neon Bar Indicator */}
                {active && (
                  <span className="absolute -top-1 inset-x-3 h-[2.5px] rounded-full bg-cosmic-purple shadow-[0_0_10px_#a855f7]" />
                )}

                <div
                  className={`p-1 rounded-xl transition-all duration-200 ${
                    active
                      ? 'text-cosmic-purple scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                      : 'text-slate-400 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`text-[10px] leading-tight transition-colors duration-200 ${
                    active
                      ? 'font-bold text-white'
                      : 'font-medium text-slate-300 group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
