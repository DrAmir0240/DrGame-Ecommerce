"use client";

import React from "react";
import DepartmentLayout, { DeptNavItem } from "@/components/admin/DepartmentLayout";
import {
  LayoutDashboard,
  CreditCard,
  Layers,
  Tag,
  Users,
} from "lucide-react";

const financeNavItems: DeptNavItem[] = [
  { label: "داشبورد مالی", href: "/admin/finance", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "تراکنش‌ها و پرداخت‌ها", href: "/admin/finance/transactions", icon: <CreditCard className="w-5 h-5" /> },
  { label: "پلن‌های اشتراک", href: "/admin/finance/plans", icon: <Layers className="w-5 h-5" /> },
  { label: "کدهای تخفیف", href: "/admin/finance/discounts", icon: <Tag className="w-5 h-5" /> },
  { label: "مدیریت پرسنل", href: "/admin/finance/staff", icon: <Users className="w-5 h-5" /> },
];

export default function FinanceDepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DepartmentLayout
      department="finance"
      deptTitleFa="مدیریت امور مالی و اشتراک‌ها"
      deptTitleEn="Finance Department"
      accent={{
        color: "text-amber-400",
        border: "border-amber-500/30",
        badge: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
        bgActive: "bg-gradient-to-r from-amber-600 to-amber-700 shadow-amber-950/40",
      }}
      navItems={financeNavItems}
    >
      {children}
    </DepartmentLayout>
  );
}
