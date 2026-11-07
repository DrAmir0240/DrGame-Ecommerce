"use client";

import React from "react";
import DepartmentLayout, { DeptNavItem } from "@/components/admin/DepartmentLayout";
import {
  LayoutDashboard,
  CreditCard,
  Share2,
  Landmark,
  Users,
  Clock,
  GitFork,
  Coins,
} from "lucide-react";

const referralNavItems: DeptNavItem[] = [
  { label: "داشبورد رفرال", href: "/admin/referral", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "مرکز تسویه هفتگی", href: "/admin/referral/settlement", icon: <Clock className="w-5 h-5" /> },
  { label: "کاوشگر شجره‌نامه", href: "/admin/referral/tree", icon: <GitFork className="w-5 h-5" /> },
  { label: "خزانه‌داری پلتفرم", href: "/admin/referral/treasury", icon: <Coins className="w-5 h-5" /> },
  { label: "درخواست‌های تسویه", href: "/admin/referral/payouts", icon: <CreditCard className="w-5 h-5" /> },
  { label: "زنجیره‌های دعوت", href: "/admin/referral/chains", icon: <Share2 className="w-5 h-5" /> },
  { label: "حساب‌های بانکی و شبا", href: "/admin/referral/accounts", icon: <Landmark className="w-5 h-5" /> },
  { label: "مدیریت پرسنل", href: "/admin/referral/staff", icon: <Users className="w-5 h-5" /> },
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
      accent={{
        color: "text-rose-400",
        border: "border-rose-500/30",
        badge: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
        bgActive: "bg-gradient-to-r from-rose-600 to-rose-700 shadow-rose-950/40",
      }}
      navItems={referralNavItems}
    >
      {children}
    </DepartmentLayout>
  );
}
