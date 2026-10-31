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
  Menu,
  Tv,
  ChevronLeft,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTvModeStore } from '@/stores/useTvModeStore';
import { useTranslation } from '@/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationDropdown from './NotificationDropdown';
import SubscriptionBadge from './SubscriptionBadge';

export default function Header() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, isAuthenticated, setAuthModalOpen, logout, fetchCurrentUser } = useAuthStore();
  const { isTvMode, toggleTvMode } = useTvModeStore();
  const [showDnsWarning, setShowDnsWarning] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Close drawer on navigation
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileDrawerOpen]);

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

  const navItems = [
    { href: '/', label: t('nav.home'), icon: Home, exact: true, activeColor: 'text-purple-400' },
    { href: '/games', label: t('nav.games'), icon: Gamepad2, activeColor: 'text-cosmic-purple' },
    { href: '/dashboard/downloads', label: t('nav.downloads'), icon: DownloadCloud, activeColor: 'text-cyan-400' },
    { href: '/tools', label: t('nav.tools'), icon: Wrench, activeColor: 'text-amber-400' },
    { href: '/blog', label: t('nav.blog'), icon: BookOpen, activeColor: 'text-emerald-400' },
  ];

  return (
    <>
      {/* Top DNS Warning Banner (Yellow / Amber) */}
      {showDnsWarning && (
        <div className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-slate-950 border-b border-amber-500 shadow-md relative z-50">
          <div className="max-w-[1700px] mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center text-center flex-wrap text-xs sm:text-sm font-bold leading-relaxed">
              <span className="flex items-center gap-1.5 shrink-0 text-slate-950 font-black">
                <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
                <span className="hidden xs:inline">{t('nav.dnsAttention')}</span>
              </span>
              <span>{t('nav.dnsInstruction')}</span>
              <span
                className="font-roboto font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 tracking-wider shadow-inner"
                dir="ltr"
              >
                165.227.83.145
              </span>
            </div>

            <button
              onClick={() => setShowDnsWarning(false)}
              className="p-1 rounded-lg hover:bg-slate-950/15 text-slate-950 shrink-0 transition-colors cursor-pointer"
              title={t('chrome.closeNotice')}
              aria-label={t('chrome.closeNotice')}
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header: Responsive across Large Desktop, Small Desktop, Tablet, and Mobile */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-surface-base/85 backdrop-blur-xl">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">

          {/* =========================================================================
              RIGHT SECTION: Hamburger (Mobile/Tablet) + Desktop Nav Items
             ========================================================================= */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Hamburger Button (visible on mobile and tablet < lg) */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl glass-card border border-white/10 hover:border-purple-500/40 text-slate-200 hover:text-white transition-all cursor-pointer"
              aria-label={t('chrome.openMenu')}
              title={t('chrome.navMenu')}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Navigation Links (Visible on Large and Small Desktop >= lg) */}
            <nav
              aria-label={t('chrome.mainNav')}
              className="hidden lg:flex items-center gap-1 xl:gap-2 shrink-0"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm transition-all duration-200 ${
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
          </div>

          {/* =========================================================================
              CENTER SECTION: DrGame Logo (Centered)
             ========================================================================= */}
          <Link
            href="/"
            className="flex items-center justify-center shrink-0 cursor-pointer select-none group"
            title={t('chrome.homeTitle')}
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cosmic-purple/20 border border-cosmic-purple/30 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_18px_rgba(168,85,247,0.4)] transition-all overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="DrGame Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-start">
                <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                  {t('chrome.brandName')}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-300 font-roboto font-bold tracking-wider">
                  DRGAME.IR
                </span>
              </div>
            </div>
          </Link>

          {/* =========================================================================
              LEFT SECTION: Controls (TV Mode, Subscription, Language, Notifications, Cart, Profile)
             ========================================================================= */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => toggleTvMode()}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isTvMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.7)]'
                  : 'bg-purple-950/70 hover:bg-purple-900 border-purple-500/40 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
              }`}
              title={t('chrome.tvModeTitle')}
            >
              <Tv className="w-4 h-4 text-purple-300" />
              <span>{t('nav.tvMode')}</span>
              {isTvMode && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </button>

            {/* Subscription Badge */}
            <div className="hidden md:block">
              <SubscriptionBadge />
            </div>

            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Shopping Cart Button */}
            <div className="relative group shrink-0 hidden sm:block">
              <button
                type="button"
                className="p-2 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/40 text-slate-200 hover:text-white transition-all group-hover:scale-105 shrink-0 focus:outline-none cursor-pointer"
                aria-label={t('nav.cart')}
              >
                <ShoppingCart className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
              </button>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg bg-surface-card border border-amber-500/30 text-amber-300 text-[11px] font-bold shadow-xl pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 whitespace-nowrap">
                <span>{t('nav.comingSoon')}</span>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-surface-card border-t border-l border-amber-500/30 rotate-45" />
              </div>
            </div>

            {/* User Profile / Auth Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  href="/profile"
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl glass-card border border-white/15 hover:border-cosmic-purple/60 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all overflow-hidden shrink-0 group"
                  title={t('chrome.profileTitle', { name: user.full_name || user.username })}
                  aria-label={t('nav.profile')}
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
                  title={t('nav.logout')}
                  aria-label={t('nav.logout')}
                  className="hidden lg:flex p-2 rounded-xl glass-card border border-white/10 hover:border-red-500/40 text-slate-300 hover:text-red-400 transition-all shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true, 'otp')}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-cosmic-gradient hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-neon-purple transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
              >
                {t('nav.loginRegister')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE & TABLET SLIDE-OVER DRAWER (Responsive off-canvas menu for < lg)
         ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden font-vazir">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Sidebar Content */}
          <div className="relative w-4/5 max-w-sm h-full bg-[#0a0d14]/98 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cosmic-purple/20 border border-cosmic-purple/30 p-1 flex items-center justify-center">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-base font-black text-white block">{t('chrome.brandName')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">DRGAME.IR</span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Mini Card if logged in */}
              {isAuthenticated && user && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 bg-black/40">
                      <img
                        src={user.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{user.full_name || t('auth.welcomeUser')}</div>
                      <div className="text-[10px] text-slate-400 font-mono" dir="ltr">@{user.username || 'user'}</div>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold"
                  >
                    {t('nav.profile')}
                  </Link>
                </div>
              )}

              {/* Navigation Items List */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        active
                          ? 'bg-cosmic-gradient text-white shadow-neon-purple'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-50" />
                    </Link>
                  );
                })}

                {/* Subscriptions link */}
                <Link
                  href="/subscriptions"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    pathname === '/subscriptions'
                      ? 'bg-cosmic-gradient text-white shadow-neon-purple'
                      : 'text-amber-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{t('subscription.subBanner')}</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-50" />
                </Link>
              </nav>

              {/* Language Switcher in Drawer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400">{t('nav.siteLanguage')}</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-6 border-t border-white/10 space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setAuthModalOpen(true, 'otp');
                  }}
                  className="w-full py-3 rounded-2xl bg-cosmic-gradient text-white font-black text-xs shadow-neon-purple flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{t('auth.quickRegister')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE FIXED BOTTOM NAVIGATION BAR (for < md smartphones)
         ========================================================================= */}
      <nav
        aria-label={t('chrome.mobileNav')}
        className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-[#0a0d14]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center py-1 px-1 group transition-all duration-200"
              >
                {/* Active Indicator */}
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
