"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Grid,
  Layers,
  DollarSign,
  CreditCard,
  CheckCircle,
  MessageSquare,
  Tag,
  LogOut,
  Menu,
  Shield,
  ChevronLeft,
  Sliders,
  Share2,
} from "lucide-react";
import { AdminProfile } from "@/types/admin";
import { apiRequest } from "@/lib/apiClient";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "داشبورد کلان", href: "/admin/dashboard", icon: <Home className="w-5 h-5" /> },
  { label: "مدیریت بنرهای اصلی", href: "/admin/banners", icon: <Sliders className="w-5 h-5" /> },
  { label: "مدیریت کاربران و سهمیه", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
  { label: "کاتالوگ بازی‌ها", href: "/admin/games", icon: <Grid className="w-5 h-5" /> },
  { label: "مدیریت ژانرهای بازی", href: "/admin/genres", icon: <Layers className="w-5 h-5 text-emerald-400" /> },
  { label: "پلن‌ها و بازی‌های رایگان", href: "/admin/subscriptions", icon: <Layers className="w-5 h-5" /> },
  { label: "مانیتورینگ زنجیره رفرال", href: "/admin/referrals", icon: <Share2 className="w-5 h-5" /> },
  { label: "پایش مالی (ریالی / ارزی)", href: "/admin/finance", icon: <DollarSign className="w-5 h-5" /> },
  { label: "کارتابل تسویه رفرال", href: "/admin/payouts", icon: <CreditCard className="w-5 h-5" /> },
  { label: "تایید حساب‌های بانکی", href: "/admin/bank-accounts", icon: <CheckCircle className="w-5 h-5" /> },
  { label: "تیکت‌های پشتیبانی", href: "/admin/tickets", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "کدهای تخفیف", href: "/admin/discounts", icon: <Tag className="w-5 h-5" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("drgame_admin_token");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    // Load admin profile from cache first for immediate responsiveness
    const storedAdmin = localStorage.getItem("drgame_admin_profile");
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        // Ignore JSON error
      }
    }

    // Verify admin token against backend to ensure active session and eliminate 403 errors
    apiRequest<AdminProfile>('/admin/auth/me')
      .then((profile) => {
        setAdmin(profile);
        localStorage.setItem("drgame_admin_profile", JSON.stringify(profile));
      })
      .catch((err) => {
        console.warn("Admin session verification failed:", err);
        localStorage.removeItem("drgame_admin_token");
        localStorage.removeItem("drgame_admin_profile");
        router.replace("/admin/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    localStorage.removeItem("drgame_admin_token");
    localStorage.removeItem("drgame_admin_profile");
    router.replace("/admin/login");
  };

  if (isLoginPage) {
    return <main className="min-h-screen bg-[#07090e] text-slate-100">{children}</main>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">درحال بررسی گواهی مدیریت...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Right Sidebar (RTL) */}
      <aside
        className={`bg-[#0c1017] border-l border-slate-800/80 transition-all duration-300 flex flex-col z-20 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-bold text-base bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                پنل مدیریت کلان
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors mx-auto"
            title="تغییر اندازه سایدبار"
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
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/40"
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

        {/* Admin User Quick Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090d13]">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {admin?.username || "مدیر ارشد"}
                </span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  ● {admin?.role || "superadmin"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="خروج از حساب مدیریت"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors"
            >
              مشاهده فروشگاه دکتر گیم
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
              Admin Session Active
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
