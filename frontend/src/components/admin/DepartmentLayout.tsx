"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LogOut,
  ChevronLeft,
  Shield,
  UserCheck,
  AlertCircle,
  Eye,
  KeyRound,
} from "lucide-react";
import {
  getDepartmentAdminToken,
  clearDepartmentAdminToken,
  DepartmentType,
} from "@/lib/authTokens";
import { apiRequest, ApiError } from "@/lib/apiClient";

export interface DeptNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface DepartmentAdminProfile {
  id: number;
  username: string;
  email?: string;
  mobile?: string;
  full_name?: string;
  access_level: "read_only" | "full_crud";
  department: string;
}

interface DepartmentLayoutProps {
  department: DepartmentType;
  deptTitleFa: string;
  deptTitleEn: string;
  accent: {
    color: string;
    border: string;
    badge: string;
    bgActive: string;
  };
  navItems: DeptNavItem[];
  children: React.ReactNode;
}

export default function DepartmentLayout({
  department,
  deptTitleFa,
  deptTitleEn,
  accent,
  navItems,
  children,
}: DepartmentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [admin, setAdmin] = useState<DepartmentAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === `/admin/${department}/login`;

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const token = getDepartmentAdminToken(department);
    if (!token) {
      router.replace(`/admin/${department}/login`);
      return;
    }

    // Try reading cached profile
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`drgame_${department}_admin_profile`);
      if (stored) {
        try {
          setAdmin(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }

    apiRequest<DepartmentAdminProfile>(`/admin-${department}/auth/me`)
      .then((profile) => {
        setAdmin(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            `drgame_${department}_admin_profile`,
            JSON.stringify(profile)
          );
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearDepartmentAdminToken(department);
          router.replace(`/admin/${department}/login`);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [department, isLoginPage, router]);

  const handleLogout = () => {
    clearDepartmentAdminToken(department);
    router.replace(`/admin/${department}/login`);
  };

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#07090e] text-slate-100">{children}</main>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">در حال احراز هویت دپارتمان {deptTitleFa}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row antialiased" dir="rtl">
      {/* Right Sidebar */}
      <aside
        className={`bg-[#0c1017] border-l border-slate-800/80 transition-all duration-300 flex flex-col z-20 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent.badge}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white truncate">{deptTitleFa}</span>
                <span className="text-[10px] text-slate-400 font-mono">{deptTitleEn}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors mx-auto"
            title="تغییر وضعیت نوار کناری"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `${accent.bgActive} text-white shadow-lg`
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Permission Indicator */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090d13]">
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {admin?.full_name || admin?.username || "پرسنل دپارتمان"}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    @{admin?.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="خروج از حساب دپارتمان"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Permission Badge */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/50">
                {admin?.access_level === "full_crud" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <KeyRound className="w-3 h-3" />
                    دسترسی کامل (CRUD)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    <Eye className="w-3 h-3" />
                    فقط مشاهده (Read-Only)
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="خروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-800/80 bg-[#0c1017]/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/hub"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
            >
              هاب دپارتمان‌ها
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono border ${accent.badge}`}>
              دپارتمان: {department.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
