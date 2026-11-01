"use client";

import React from "react";
import DepartmentLayout, { DeptNavItem } from "@/components/admin/DepartmentLayout";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Shield,
} from "lucide-react";

const supportNavItems: DeptNavItem[] = [
  { label: "داشبورد پشتیبانی", href: "/admin/support", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "تیکت‌های کاربران", href: "/admin/support/tickets", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "مدیریت کاربران و سهمیه‌ها", href: "/admin/support/users", icon: <Users className="w-5 h-5" /> },
  { label: "مدیریت پرسنل", href: "/admin/support/staff", icon: <Shield className="w-5 h-5" /> },
];

export default function SupportDepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DepartmentLayout
      department="support"
      deptTitleFa="مدیریت پشتیبانی و کاربران"
      deptTitleEn="Support Department"
      accent={{
        color: "text-blue-400",
        border: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
        bgActive: "bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-950/40",
      }}
      navItems={supportNavItems}
    >
      {children}
    </DepartmentLayout>
  );
}
