'use client';

import React from 'react';
import DepartmentLayout, { DeptNavItem } from '@/components/admin/DepartmentLayout';
import { AdminToastProvider } from '@/components/admin/referral/AdminToast';
import {
  LayoutDashboard,
  GitFork,
  Clock,
  CreditCard,
  Landmark,
  Coins,
  Users,
} from 'lucide-react';

const referralNavItems: DeptNavItem[] = [
  { label: 'نمای کلی و هشدارها', href: '/admin/referral', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'شبکه، شجره‌نامه و لیست سیاه', href: '/admin/referral/tree', icon: <GitFork className="w-5 h-5" /> },
  { label: 'آزادسازی پورسانت‌های معوق', href: '/admin/referral/settlement', icon: <Clock className="w-5 h-5" /> },
  { label: 'درخواست‌های واریز (شبا و تتر)', href: '/admin/referral/payouts', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'تایید حساب‌های بانکی و ولت', href: '/admin/referral/accounts', icon: <Landmark className="w-5 h-5" /> },
  { label: 'خزانه‌داری و پاداش‌ها', href: '/admin/referral/treasury', icon: <Coins className="w-5 h-5" /> },
  { label: 'مدیریت پرسنل دپارتمان', href: '/admin/referral/staff', icon: <Users className="w-5 h-5" /> },
];

export default function ReferralDepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DepartmentLayout
      department="referral"
      deptTitleFa="مدیریت بازاریابی و رفرال"
      deptTitleEn="Referral Department"
      accentColor="rose"
      accent={{
        color: 'text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
        bgActive: 'bg-gradient-to-r from-rose-600 to-rose-700 shadow-rose-950/40',
      }}
      navItems={referralNavItems}
    >
      <AdminToastProvider>{children}</AdminToastProvider>
    </DepartmentLayout>
  );
}
