"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ShieldCheck, Zap, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";

export default function AuthPage() {
  const { t, lang } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await api.post<{ access_token: string }>("/api/v1/auth/login", {
          username_or_email: username,
          password: password,
        });
        if (res.data?.access_token) {
          localStorage.setItem("drgame_token", res.data.access_token);
          router.push("/panel");
        }
      } else {
        await api.post("/api/v1/auth/register", {
          username,
          email,
          password,
        });
        // Auto login after register
        const res = await api.post<{ access_token: string }>("/api/v1/auth/login", {
          username_or_email: username,
          password: password,
        });
        if (res.data?.access_token) {
          localStorage.setItem("drgame_token", res.data.access_token);
          router.push("/panel");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleDevOneClickLogin = async () => {
    setDevLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post<{ access_token: string }>("/api/v1/auth/dev-login");
      if (res.data?.access_token) {
        localStorage.setItem("drgame_token", res.data.access_token);
        router.push("/panel");
      }
    } catch (e: any) {
      // Local fallback token for testing if backend is unreachable
      localStorage.setItem("drgame_token", "dev_superuser_offline_token");
      router.push("/panel");
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <Page>
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151722]/95 backdrop-blur-xl p-8 shadow-2xl space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {mode === "login"
                ? t("ورود به حساب کاربری", "Sign in to DrGame")
                : t("ساخت حساب کاربری جدید", "Create DrGame Account")}
            </h1>
            <p className="text-xs text-slate-400">
              {t(
                "به سامانه بازی‌های کنسولی و سرویس‌های پرسرعت خوش آمدید",
                "Access your high-speed console games and cloud library"
              )}
            </p>
          </div>

          {/* Dev Mode One-Click Button */}
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>حالت توسعه و تست (Dev Fast-Pass)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300">
                Superuser
              </span>
            </div>
            <button
              type="button"
              onClick={handleDevOneClickLogin}
              disabled={devLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{devLoading ? "در حال دریافت مجوز..." : "ورود سریع تستی با ۱ کلیک"}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-mono">
              {t("یا با اطلاعات اختصاصی", "OR")}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold block">
                {mode === "login" ? t("نام کاربری یا ایمیل", "Username or Email") : t("نام کاربری", "Username")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 ps-10 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold block">
                  {t("ایمیل معتبر", "Email Address")}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 ps-10 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-bold block">
                {t("رمز عبور", "Password")}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 ps-10 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {loading
                ? "در حال پردازش..."
                : mode === "login"
                ? t("ورود به حساب", "Sign In")
                : t("ثبت نام و ایجاد حساب", "Register")}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs text-slate-400 hover:text-purple-400 transition-colors"
            >
              {mode === "login"
                ? t("حساب کاربری ندارید؟ ثبت نام کنید", "Don't have an account? Sign up")
                : t("قبلاً ثبت نام کرده‌اید؟ وارد شوید", "Already have an account? Sign in")}
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
