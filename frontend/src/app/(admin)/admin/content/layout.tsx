"use client";

import React from "react";
import DepartmentLayout, { DeptNavItem } from "@/components/admin/DepartmentLayout";
import {
  LayoutDashboard,
  Gamepad2,
  CloudDownload,
  Tags,
  Newspaper,
  Sliders,
  Users,
} from "lucide-react";

const contentNavItems: DeptNavItem[] = [
  { label: "داشبورد محتوا", href: "/admin/content", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "کاتالوگ بازی‌ها", href: "/admin/content/games", icon: <Gamepad2 className="w-5 h-5" /> },
  { label: "دریافت کاتالوگ", href: "/admin/content/catalog-sync", icon: <CloudDownload className="w-5 h-5" /> },
  { label: "ژانرها و دسته‌ها", href: "/admin/content/genres", icon: <Tags className="w-5 h-5" /> },
  { label: "پست‌ها و وبلاگ", href: "/admin/content/blogs", icon: <Newspaper className="w-5 h-5" /> },
  { label: "بنرهای صفحه اصلی", href: "/admin/content/banners", icon: <Sliders className="w-5 h-5" /> },
  { label: "مدیریت پرسنل", href: "/admin/content/staff", icon: <Users className="w-5 h-5" /> },
];

export default function ContentDepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DepartmentLayout
      department="content"
      deptTitleFa="مدیریت محتوا و بازی‌ها"
      deptTitleEn="Content Department"
      accent={{
        color: "text-emerald-400",
        border: "border-emerald-500/30",
        badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
        bgActive: "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-950/40",
      }}
      navItems={contentNavItems}
    >
      {children}
    </DepartmentLayout>
  );
}
