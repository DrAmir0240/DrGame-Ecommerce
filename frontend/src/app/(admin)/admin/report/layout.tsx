"use client";

import React from "react";
import DepartmentLayout, { DeptNavItem } from "@/components/admin/DepartmentLayout";
import {
  BarChart3,
  ShieldAlert,
  Users,
} from "lucide-react";

const reportNavItems: DeptNavItem[] = [
  { label: "داشبورد تحلیلی و چارت‌ها", href: "/admin/report", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "لاگ‌های امنیتی (Audit Logs)", href: "/admin/report/audit-logs", icon: <ShieldAlert className="w-5 h-5" /> },
  { label: "مدیریت پرسنل", href: "/admin/report/staff", icon: <Users className="w-5 h-5" /> },
];

export default function ReportDepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DepartmentLayout
      department="report"
      deptTitleFa="گزارش‌گیری، آمار و نظارت"
      deptTitleEn="Report & Audit Department"
      accent={{
        color: "text-purple-400",
        border: "border-purple-500/30",
        badge: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
        bgActive: "bg-gradient-to-r from-purple-600 to-purple-700 shadow-purple-950/40",
      }}
      navItems={reportNavItems}
    >
      {children}
    </DepartmentLayout>
  );
}
