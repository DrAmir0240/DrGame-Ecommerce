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
  BookOpen,
  Settings,
} from "lucide-react";
import { AdminProfile } from "@/types/admin";
import { apiRequest, ApiError } from "@/lib/apiClient";
import { getAdminToken, clearAdminTokens } from "@/lib/authTokens";
import { useTranslation } from "@/i18n";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { labelKey: "admin.layout.nav.dashboard", href: "/admin/dashboard", icon: <Home className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.banners", href: "/admin/banners", icon: <Sliders className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.games", href: "/admin/games", icon: <Grid className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.genres", href: "/admin/genres", icon: <Layers className="w-5 h-5 text-emerald-400" /> },
  { labelKey: "admin.layout.nav.subscriptions", href: "/admin/subscriptions", icon: <Layers className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.referrals", href: "/admin/referrals", icon: <Share2 className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.finance", href: "/admin/finance", icon: <DollarSign className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.payouts", href: "/admin/payouts", icon: <CreditCard className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.bankAccounts", href: "/admin/bank-accounts", icon: <CheckCircle className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.tickets", href: "/admin/tickets", icon: <MessageSquare className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.discounts", href: "/admin/discounts", icon: <Tag className="w-5 h-5" /> },
  { labelKey: "admin.layout.nav.blog", href: "/admin/blog", icon: <BookOpen className="w-5 h-5 text-indigo-400" /> },
  { labelKey: "admin.layout.nav.settings", href: "/admin/settings", icon: <Settings className="w-5 h-5 text-purple-400" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
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

    const token =
      getAdminToken() ||
      (typeof window !== "undefined" ? localStorage.getItem("drgame_admin_token") : null);

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    // Load admin profile from cache first for immediate responsiveness
    const storedAdmin = typeof window !== "undefined" ? localStorage.getItem("drgame_admin_profile") : null;
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        // Ignore JSON error
      }
    }

    // Verify admin token against backend to ensure active session and eliminate 403 errors
    apiRequest<AdminProfile>("/admin/auth/me")
      .then((profile) => {
        setAdmin(profile);
        if (typeof window !== "undefined") {
          localStorage.setItem("drgame_admin_profile", JSON.stringify(profile));
        }
      })
      .catch((err) => {
        console.warn("Admin session verification warning:", err);
        // ONLY log out if the backend actively rejected the credentials (HTTP 401 or 403)
        // Network drops or delays should never log the admin out!
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearAdminTokens();
          router.replace("/admin/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoginPage, router]);

  const handleLogout = () => {
    clearAdminTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("drgame_admin_profile");
    }
    router.replace("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading && !admin) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cosmic-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">{t("admin.layout.verifyingSession")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-row overflow-hidden font-vazir">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } bg-[#0c1017] border-l border-slate-800/80 transition-all duration-300 flex flex-col justify-between shrink-0 z-20`}
      >
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-cosmic-purple" />
                <span className="font-bold text-sm tracking-wide text-white">
                  {t("admin.layout.brand")}
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mx-auto"
              title={t("admin.layout.toggleSidebar")}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const label = t(item.labelKey);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    active
                      ? "bg-cosmic-purple text-white shadow-lg shadow-purple-900/30"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                  title={collapsed ? label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="overflow-hidden pr-1">
                <p className="text-xs font-bold text-white truncate">
                  {admin?.username || t("admin.layout.defaultAdminName")}
                </p>
                <p className="text-[10px] text-slate-500 font-mono uppercase truncate">
                  {admin?.role || "super_admin"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title={t("admin.layout.logout")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title={t("admin.layout.logoutShort")}
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
              {t("admin.layout.viewStore")}
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-mono">
              {t("admin.layout.sessionActive")}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
