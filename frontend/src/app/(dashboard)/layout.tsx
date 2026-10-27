'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
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
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: SidebarItem[] = [
  {
    label: 'پروفایل و آواتار سونی',
    href: '/profile',
    icon: <UserIcon className="w-5 h-5" />,
  },
  {
    label: 'دانلودهای من',
    href: '/dashboard/downloads',
    icon: <Download className="w-5 h-5 text-cyan-400" />,
  },
  {
    label: 'کیف پول و درآمد رفرال',
    href: '/referral',
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    label: 'نشست‌ها و دستگاه‌های فعال',
    href: '/sessions',
    icon: <Laptop className="w-5 h-5" />,
  },
  {
    label: 'ارتقا و تمدید اشتراک',
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
  const { user, isAuthenticated, fetchCurrentUser, logout } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();
  const [copiedConsoleCode, setCopiedConsoleCode] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchQuota();
  }, []);

  const copyConsoleCode = () => {
    if (user?.console_auth_code) {
      navigator.clipboard.writeText(user.console_auth_code);
      setCopiedConsoleCode(true);
      setTimeout(() => setCopiedConsoleCode(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Right Sidebar (RTL layout) */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-6 sticky top-24 shadow-2xl backdrop-blur-xl bg-[#0c1017]/80">
            {/* User Mini Profile Header */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-white/10">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-cosmic-purple/60 shadow-neon-purple p-0.5 bg-black/40">
                  <img
                    src={
                      user?.avatar_url ||
                      'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={user?.full_name || 'کاربر'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-[#0c1017] flex items-center justify-center" title="حساب فعال">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              </div>

              <h2 className="text-base font-bold text-white mb-0.5">
                {user?.full_name || 'کاربر دکتر گیم'}
              </h2>
              <span className="text-xs text-text-muted font-roboto" dir="ltr">
                @{user?.username || 'user'}
              </span>
            </div>

            {/* 7-digit Console Auth Code Box */}
            {user?.console_auth_code && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cosmic-purple/30 space-y-1.5 text-center">
                <div className="text-[11px] text-text-muted">کد ۷ رقمی ورود به کنسول:</div>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="font-roboto text-lg font-black tracking-widest text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/20"
                    dir="ltr"
                  >
                    {user.console_auth_code}
                  </span>
                  <button
                    onClick={copyConsoleCode}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="کپی کد کنسول"
                  >
                    {copiedConsoleCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quota Capsule Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cosmic-purple/10 to-transparent border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted flex items-center gap-1.5 font-medium">
                  <HardDrive className="w-3.5 h-3.5 text-cosmic-purple" />
                  سهمیه ترافیک
                </span>
                <span className="text-emerald-400 font-bold">
                  {quota ? `${quota.remaining_quota_gb} GB باقی‌مانده` : '5 GB باقی‌مانده'}
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
                <span>مصرف: {quota?.used_quota_gb || 0} GB</span>
                <span>کل: {quota?.total_quota_gb || 5} GB</span>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cosmic-gradient text-white shadow-neon-purple'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout Action */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Left Main Content */}
        <section className="flex-1 w-full min-w-0">{children}</section>
      </div>
    </div>
  );
}
