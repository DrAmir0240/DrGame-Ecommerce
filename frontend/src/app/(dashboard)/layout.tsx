'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import { useTranslation } from '@/i18n';
import { getAccessToken } from '@/lib/authTokens';
import ConsolePairWidget from '@/components/profile/ConsolePairWidget';
import {
  User as UserIcon,
  Share2,
  Laptop,
  Copy,
  Check,
  Zap,
  LogOut,
  ShieldCheck,
  HardDrive,
  ExternalLink,
  Download,
  Headphones,
  Receipt,
  Bell,
  Menu,
  X,
} from 'lucide-react';

interface SidebarItem {
  labelKey: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: SidebarItem[] = [
  {
    labelKey: 'dashboard.nav.profile',
    href: '/profile',
    icon: <UserIcon className="w-5 h-5" />,
  },
  {
    labelKey: 'dashboard.nav.downloads',
    href: '/dashboard/downloads',
    icon: <Download className="w-5 h-5 text-cyan-400" />,
  },
  {
    labelKey: 'dashboard.nav.tickets',
    href: '/dashboard/tickets',
    icon: <Headphones className="w-5 h-5 text-purple-400" />,
  },
  {
    labelKey: 'dashboard.nav.payments',
    href: '/dashboard/payments',
    icon: <Receipt className="w-5 h-5 text-emerald-400" />,
  },
  {
    labelKey: 'dashboard.nav.notifications',
    href: '/dashboard/notifications',
    icon: <Bell className="w-5 h-5 text-amber-400" />,
  },
  {
    labelKey: 'dashboard.nav.referral',
    href: '/referral',
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    labelKey: 'dashboard.nav.sessions',
    href: '/sessions',
    icon: <Laptop className="w-5 h-5" />,
  },
  {
    labelKey: 'dashboard.nav.subscriptions',
    href: '/subscriptions',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
  },
];

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, size, dir, locale } = useTranslation();
  const { user, isAuthenticated, fetchCurrentUser, logout } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();
  const [copiedConsoleCode, setCopiedConsoleCode] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchQuota();
  }, []);

  // Client-side safeguard for route protection
  useEffect(() => {
    if (mounted && !isAuthenticated && !getAccessToken()) {
      router.replace('/?auth=required');
    }
  }, [mounted, isAuthenticated, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!mobileDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [mobileDrawerOpen]);

  const copyConsoleCode = () => {
    if (user?.console_auth_code) {
      navigator.clipboard.writeText(user.console_auth_code);
      setCopiedConsoleCode(true);
      setTimeout(() => setCopiedConsoleCode(false), 2000);
    }
  };

  const renderSidebarContent = (onItemClick?: () => void) => (
    <div className="space-y-6">
      {/* User Mini Profile Header */}
      <div className="flex flex-col items-center text-center pb-4 border-b border-white/10">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cosmic-purple/60 shadow-neon-purple p-0.5 bg-black/40">
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.full_name || t('dashboard.userAlt')}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="absolute -bottom-1 -end-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-[#0c1017] flex items-center justify-center" title={t('dashboard.activeAccount')}>
            <ShieldCheck className="w-3 h-3 text-white" />
          </div>
        </div>

        <h2 className="text-base font-bold text-white mb-0.5">
          {user?.full_name || t('dashboard.defaultUserName')}
        </h2>
        <span className="text-xs text-text-muted font-roboto" dir="ltr">
          @{user?.username || 'user'}
        </span>
      </div>

      {/* Dynamic 2-minute Console Pair Widget */}
      <ConsolePairWidget />

      {/* Quota Capsule Widget */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-cosmic-purple/10 to-transparent border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted flex items-center gap-1.5 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-cosmic-purple" />
            {t('dashboard.quotaTitle')}
          </span>
          <span className="text-emerald-400 font-bold">
            {t('dashboard.quotaRemaining', { size: size(quota ? quota.remaining_quota_gb : 5) })}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cosmic-purple to-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                quota && quota.total_quota_gb > 0
                  ? (quota.used_quota_gb / quota.total_quota_gb) * 100
                  : 0
              )}%`,
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-text-muted">
          <span>{t('dashboard.quotaUsed', { size: size(quota?.used_quota_gb || 0) })}</span>
          <span>{t('dashboard.quotaTotal', { size: size(quota?.total_quota_gb || 5) })}</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-cosmic-gradient text-white shadow-neon-purple'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Action */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={() => {
            if (onItemClick) onItemClick();
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('dashboard.logout')}</span>
        </button>
      </div>
    </div>
  );

  if (mounted && !isAuthenticated && !getAccessToken()) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">در حال انتقال...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={dir}
      className={`max-w-[1700px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 w-full text-start ${
        locale === 'fa' || locale === 'ar' ? 'font-vazir' : 'font-sans'
      }`}
    >
      {/* Mobile Top Navigation Bar (Triggers Slide-over Drawer) */}
      <div className="lg:hidden mb-6 p-3 sm:p-4 rounded-2xl bg-[#0c1017]/95 border border-white/10 flex items-center justify-between shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-cosmic-purple/60 p-0.5 bg-black/40 shrink-0">
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
              }
              alt={user?.full_name || t('dashboard.userAlt')}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-white">{user?.full_name || t('dashboard.defaultUserName')}</div>
            <div className="text-[10px] text-text-muted font-roboto" dir="ltr">@{user?.username || 'user'}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 font-bold text-xs transition-all active:scale-95 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
        >
          <Menu className="w-4 h-4 text-purple-400" />
          <span>{t('dashboard.userMenu')}</span>
        </button>
      </div>

      {/* Mobile Slide-over Drawer (Portaled to body to sit above Header & Footer) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {mobileDrawerOpen && (
              <div
                dir={dir}
                className={`fixed inset-0 z-[100] lg:hidden ${
                  locale === 'fa' || locale === 'ar' ? 'font-vazir' : 'font-sans'
                }`}
              >
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer touch-none"
                  onClick={() => setMobileDrawerOpen(false)}
                  onTouchMove={(e) => e.preventDefault()}
                />

                {/* Drawer Panel */}
                <motion.aside
                  initial={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: dir === 'rtl' ? '-100%' : '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed inset-y-0 end-0 max-w-[85vw] w-80 bg-[#0c1017] border-s border-white/10 z-[101] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-5 overflow-y-auto flex flex-col justify-between overscroll-contain"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>{t('dashboard.drawerTitle')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMobileDrawerOpen(false)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={t('common.close') || 'بستن'}
                        aria-label={t('common.close') || 'بستن'}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {renderSidebarContent(() => setMobileDrawerOpen(false))}
                  </div>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Main Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Desktop Sticky Right Sidebar */}
        <aside className="hidden lg:block lg:w-72 shrink-0">
          <div className="glass-card rounded-3xl p-6 border border-white/10 sticky top-24 shadow-2xl backdrop-blur-xl bg-[#0c1017]/80">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 w-full min-w-0">{children}</section>
      </div>
    </div>
  );
}
