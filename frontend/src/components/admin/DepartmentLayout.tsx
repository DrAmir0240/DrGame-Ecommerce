'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Shield,
  Eye,
  KeyRound,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import {
  getDepartmentAdminToken,
  clearDepartmentAdminToken,
  DepartmentType,
} from '@/lib/authTokens';
import { apiRequest, ApiError } from '@/lib/apiClient';

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
  access_level: 'read_only' | 'full_crud';
  department: string;
}

export type DepartmentAccentColor = 'purple' | 'rose' | 'emerald' | 'blue' | 'amber' | 'cyan';

const SPINNER_BY_ACCENT: Record<DepartmentAccentColor, string> = {
  purple: 'border-purple-500',
  rose: 'border-rose-500',
  emerald: 'border-emerald-500',
  blue: 'border-blue-500',
  amber: 'border-amber-500',
  cyan: 'border-cyan-500',
};

interface DepartmentProfileContextValue {
  admin: DepartmentAdminProfile | null;
  isReadOnly: boolean;
  loading: boolean;
  department: DepartmentType | null;
}

const DepartmentProfileContext = createContext<DepartmentProfileContextValue>({
  admin: null,
  isReadOnly: false,
  loading: true,
  department: null,
});

export function useDepartmentProfile() {
  return useContext(DepartmentProfileContext);
}

interface DepartmentLayoutProps {
  department: DepartmentType;
  deptTitleFa: string;
  deptTitleEn: string;
  accentColor?: DepartmentAccentColor;
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
  accentColor = 'purple',
  accent,
  navItems,
  children,
}: DepartmentLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [admin, setAdmin] = useState<DepartmentAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === `/admin/${department}/login`;

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('drgame_admin_sidebar_collapsed');
      if (saved !== null) {
        setCollapsed(saved === 'true');
      }
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('drgame_admin_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

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
    if (typeof window !== 'undefined') {
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
        if (typeof window !== 'undefined') {
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
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-slate-400" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className={`w-8 h-8 border-2 ${SPINNER_BY_ACCENT[accentColor]} border-t-transparent rounded-full animate-spin`} />
          <span className="text-sm">در حال احراز هویت دپارتمان {deptTitleFa}...</span>
        </div>
      </div>
    );
  }

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const isCollapsedMode = !isMobile && collapsed;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
            className={`flex items-center rounded-xl text-sm font-medium transition-all relative group ${
              isCollapsedMode
                ? 'justify-center p-3'
                : 'gap-3 px-3.5 py-2.5'
            } ${
              isActive
                ? `${accent.bgActive} text-white shadow-lg`
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
            title={isCollapsedMode ? item.label : undefined}
          >
            <div className="flex-shrink-0">{item.icon}</div>
            {!isCollapsedMode && <span className="truncate">{item.label}</span>}

            {/* Desktop Tooltip for collapsed mode */}
            {isCollapsedMode && (
              <div className="absolute right-full mr-2 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {item.label}
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const renderProfileFooter = (isMobile = false) => {
    const isCollapsedMode = !isMobile && collapsed;

    return (
      <div className="p-3 border-t border-slate-800/80 bg-[#090d13]">
        {!isCollapsedMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col truncate min-w-0 pr-1">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {admin?.full_name || admin?.username || 'پرسنل دپارتمان'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono truncate" dir="ltr">
                  @{admin?.username}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title="خروج از حساب دپارتمان"
                aria-label="خروج از حساب دپارتمان"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Permission Badge */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/50">
              {admin?.access_level === 'full_crud' ? (
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
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer relative group"
              title="خروج از حساب"
              aria-label="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
              <div className="absolute right-full mr-2 px-2 py-1 bg-slate-900 border border-slate-700 text-rose-300 text-xs rounded-lg whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                خروج
              </div>
            </button>
            <div
              className={`w-2 h-2 rounded-full ${
                admin?.access_level === 'full_crud' ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-amber-400 ring-2 ring-amber-500/30'
              }`}
              title={admin?.access_level === 'full_crud' ? 'دسترسی کامل' : 'فقط خواندنی'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#07090e] text-slate-100 flex overflow-hidden antialiased font-vazir" dir="rtl">
      {/* =========================================================================
          DESKTOP SIDEBAR (Collapsible w-64 <-> w-20, fixed full height on lg:)
         ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0c1017] border-l border-slate-800/80 h-full shrink-0 z-20 overflow-hidden transition-[width] duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 shrink-0 px-4 border-b border-slate-800 flex items-center ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent.badge}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-sm text-white truncate">{deptTitleFa}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate">{deptTitleEn}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="جمع کردن نوار کناری"
                aria-label="جمع کردن نوار کناری"
              >
                <PanelRightClose className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer ${accent.badge}`}
              title="باز کردن نوار کناری"
              aria-label="باز کردن نوار کناری"
            >
              <PanelRightOpen className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        {renderNavLinks(false)}

        {/* Profile Footer */}
        {renderProfileFooter(false)}
      </aside>

      {/* =========================================================================
          MOBILE SLIDE-OVER DRAWER (Rendered via Portal on document.body)
         ========================================================================= */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {mobileOpen && (
              <div className="fixed inset-0 z-[100] lg:hidden font-vazir" dir="rtl">
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer touch-none"
                  onClick={() => setMobileOpen(false)}
                  onTouchMove={(e) => e.preventDefault()}
                />

                {/* Drawer Panel */}
                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-[#0c1017] border-l border-slate-800 z-[101] shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain"
                >
                  <div>
                    {/* Drawer Header */}
                    <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent.badge}`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-white truncate">{deptTitleFa}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{deptTitleEn}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="بستن منو"
                        aria-label="بستن منو"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Nav Links */}
                    {renderNavLinks(true)}
                  </div>

                  {/* Profile Footer */}
                  {renderProfileFooter(true)}
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* =========================================================================
          MAIN CONTENT AREA (Top Fixed Navbar + Scrollable Page Content)
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar (Fixed at top, never scrolls away) */}
        <header className="h-16 shrink-0 px-4 sm:px-6 border-b border-slate-800/80 bg-[#0c1017]/95 backdrop-blur-md z-30 flex items-center justify-between gap-3 sticky top-0 shadow-sm">
          {/* Right Section: Mobile Trigger, Desktop Collapse Toggle & Hub Link */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile / Tablet Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center gap-1.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="منوی دپارتمان"
              aria-label="منوی دپارتمان"
            >
              <Menu className="w-5 h-5 text-slate-200" />
              <span className="text-xs font-bold sm:inline hidden">منو</span>
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden lg:flex p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors cursor-pointer"
              title={collapsed ? 'گسترش نوار کناری' : 'جمع کردن نوار کناری'}
              aria-label={collapsed ? 'گسترش نوار کناری' : 'جمع کردن نوار کناری'}
            >
              {collapsed ? (
                <PanelRightOpen className="w-4 h-4" />
              ) : (
                <PanelRightClose className="w-4 h-4" />
              )}
            </button>

            {/* Hub Link */}
            <Link
              href="/admin/hub"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800/50 hover:bg-slate-800 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700/50 transition-colors shrink-0"
            >
              <span>هاب دپارتمان‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Left Section: Department Badge & Admin info */}
          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-mono border whitespace-nowrap ${accent.badge}`}>
              دپارتمان: {department.toUpperCase()}
            </span>
          </div>
        </header>

        {/* Page Content (Scrolls smoothly underneath the fixed header) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 min-w-0 max-w-full overscroll-contain">
          <DepartmentProfileContext.Provider
            value={{
              admin,
              isReadOnly: admin?.access_level === 'read_only',
              loading,
              department,
            }}
          >
            {children}
          </DepartmentProfileContext.Provider>
        </main>
      </div>
    </div>
  );
}
