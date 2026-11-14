"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, User, AlertCircle, ArrowLeft, ChevronLeft } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/apiClient";
import { setDepartmentAdminToken, DepartmentType } from "@/lib/authTokens";

import { DepartmentAccentColor } from "./DepartmentLayout";

const LOGIN_ACCENTS: Record<
  DepartmentAccentColor,
  { selection: string; glow: string; focusBorder: string }
> = {
  purple: {
    selection: "selection:bg-purple-500 selection:text-white",
    glow: "bg-purple-600/10",
    focusBorder: "focus:border-purple-500",
  },
  rose: {
    selection: "selection:bg-rose-500 selection:text-white",
    glow: "bg-rose-600/10",
    focusBorder: "focus:border-rose-500",
  },
  emerald: {
    selection: "selection:bg-emerald-500 selection:text-white",
    glow: "bg-emerald-600/10",
    focusBorder: "focus:border-emerald-500",
  },
  blue: {
    selection: "selection:bg-blue-500 selection:text-white",
    glow: "bg-blue-600/10",
    focusBorder: "focus:border-blue-500",
  },
  amber: {
    selection: "selection:bg-amber-500 selection:text-white",
    glow: "bg-amber-600/10",
    focusBorder: "focus:border-amber-500",
  },
  cyan: {
    selection: "selection:bg-cyan-500 selection:text-white",
    glow: "bg-cyan-600/10",
    focusBorder: "focus:border-cyan-500",
  },
};

interface DepartmentLoginPageProps {
  department: DepartmentType;
  deptTitleFa: string;
  deptTitleEn: string;
  badgeColor: string;
  accentBtn: string;
  accentColor?: DepartmentAccentColor;
  icon: React.ReactNode;
}

export default function DepartmentLoginPage({
  department,
  deptTitleFa,
  deptTitleEn,
  badgeColor,
  accentBtn,
  accentColor = "purple",
  icon,
}: DepartmentLoginPageProps) {
  const theme = LOGIN_ACCENTS[accentColor] || LOGIN_ACCENTS.purple;
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await apiRequest<{
        access_token: string;
        token_type: string;
        admin: any;
      }>(`/admin-${department}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res && res.access_token) {
        setDepartmentAdminToken(department, res.access_token);
        if (typeof window !== "undefined" && res.admin) {
          localStorage.setItem(
            `drgame_${department}_admin_profile`,
            JSON.stringify(res.admin)
          );
        }
        router.replace(`/admin/${department}`);
      } else {
        setErrorMsg("پاسخ نامعتبر از سرور دریافت شد");
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        setErrorMsg("نام کاربری یا رمز عبور اشتباه است");
      } else {
        setErrorMsg(err.message || "خطا در برقراری ارتباط با سرور");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center p-4 ${theme.selection}`} dir="rtl">
      {/* Background radial glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 ${theme.glow} rounded-full blur-3xl`} />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Hub Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/hub"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            بازگشت به هاب دپارتمان‌ها
          </Link>
          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            Zero-Trust Isolation
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#0c1017] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">
                ورود به {deptTitleFa}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {deptTitleEn}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                نام کاربری دپارتمان
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none ${theme.focusBorder} font-mono text-left transition-colors pl-9`}
                  placeholder="admin_username"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none ${theme.focusBorder} font-mono text-left transition-colors pl-9`}
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${accentBtn} ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "در حال اعتبارسنجی..." : "ورود به سامانه دپارتمان"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500 leading-tight block">
              احراز هویت این دپارتمان در جدول مستقل بررسی شده و توکن صادرشده فاقد دسترسی به سایر بخش‌هاست.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
