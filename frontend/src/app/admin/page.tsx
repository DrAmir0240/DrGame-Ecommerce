"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Gamepad2,
  BookOpen,
  Users,
  LifeBuoy,
  CreditCard,
  Cpu,
  Wifi,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Search,
  Building,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

export default function AdminDashboardPage() {
  const { t, n } = useApp();
  const [activeModule, setActiveModule] = useState<string>("dns");

  // DNS Banner config state
  const [dnsActive, setDnsActive] = useState(true);
  const [dnsPrimary, setDnsPrimary] = useState("178.22.122.100");
  const [dnsSecondary, setDnsSecondary] = useState("185.51.200.2");
  const [dnsMsg, setDnsMsg] = useState(
    "جهت دور زدن تحریم و افزایش سرعت دانلود کنسول، DNS اختصاصی دکتر گیم را تنظیم کنید:"
  );
  const [dnsSaved, setDnsSaved] = useState(false);

  // Slot 2 Banner state
  const [bannerTitle, setBannerTitle] = useState(
    "اشتراک طلایی با ترافیک نامحدود و ۳۵٪ تخفیف ولکام"
  );
  const [bannerLink, setBannerLink] = useState("/subscriptions");
  const [bannerSaved, setBannerSaved] = useState(false);

  // Referral payouts pending state
  const [payouts, setPayouts] = useState([
    { id: "STL-9901", user: "آرمان رحیمی", amount: 2000000, iban: "IR820120000000001234567890", status: "PENDING" },
    { id: "STL-9902", user: "رضا محمدی", amount: 850000, iban: "IR440180000000009876543210", status: "PENDING" },
  ]);

  const handleApprovePayout = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p))
    );
  };

  const handleSaveDNS = (e: React.FormEvent) => {
    e.preventDefault();
    setDnsSaved(true);
    setTimeout(() => setDnsSaved(false), 2000);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSaved(true);
    setTimeout(() => setBannerSaved(false), 2000);
  };

  const modules = [
    { id: "dns", label: "تنظیمات نوار زرد DNS", icon: Wifi },
    { id: "banners", label: "مدیریت بنرهای صفحه اصلی", icon: ImageIcon },
    { id: "payouts", label: "تایید تسویه‌های رفرال شبا", icon: Building, badge: "۲ در انتظار" },
    { id: "catalog", label: "استخراج و کاتالوگ بازی‌ها", icon: Gamepad2 },
    { id: "orders", label: "تراکنش‌های مالی و درگاه‌ها", icon: CreditCard },
  ];

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-extrabold text-xs border border-red-500/30">
                Admin Panel (Secure Zone)
              </span>
              <span className="text-xs text-slate-400">مسدود در مرورگر کنسول</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              داشبورد راهبری و مدیریت سیستم دکتر گیم
            </h1>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Admin: sysadmin@drgame.ir · Role: SuperAdmin
          </div>
        </div>

        {/* Modules Nav */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-1 rounded-2xl bg-[#151722] border border-white/10 p-2 shadow-xl">
            {modules.map((m) => {
              const Icon = m.icon;
              const active = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModule(m.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </div>
                  {m.badge && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono">
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Module Content */}
          <main className="lg:col-span-3 min-w-0">
            {/* 1. DNS Settings Module */}
            {activeModule === "dns" && (
              <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
                <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-yellow-400" />
                  <span>مدیریت نوار زرد نئونی هشدار DNS بالای هدر</span>
                </h3>

                {dnsSaved && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold">
                    تنظیمات DNS با موفقیت در سراسر سامانه به‌روزرسانی شد.
                  </div>
                )}

                <form onSubmit={handleSaveDNS} className="space-y-4 text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dns-active"
                      checked={dnsActive}
                      onChange={(e) => setDnsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500"
                    />
                    <label htmlFor="dns-active" className="text-white font-bold cursor-pointer">
                      فعال‌سازی نمایش نوار زرد در بالاترین بخش تمامی صفحات
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block">Primary DNS IP:</label>
                      <input
                        type="text"
                        value={dnsPrimary}
                        onChange={(e) => setDnsPrimary(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold block">Secondary DNS IP:</label>
                      <input
                        type="text"
                        value={dnsSecondary}
                        onChange={(e) => setDnsSecondary(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">متن راهنمای هشدار:</label>
                    <textarea
                      rows={2}
                      value={dnsMsg}
                      onChange={(e) => setDnsMsg(e.target.value)}
                      className="w-full rounded-xl bg-[#0f1016] border border-white/10 p-3 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
                  >
                    ذخیره و اعمال تنظیمات DNS
                  </button>
                </form>
              </div>
            )}

            {/* 2. Banner Slots Module */}
            {activeModule === "banners" && (
              <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
                <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-orange-400" />
                  <span>مدیریت اسلات بنر پویای ۲ در صفحه اصلی (OD-5)</span>
                </h3>

                {bannerSaved && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold">
                    بنر پویای ۲ با موفقیت ذخیره شد.
                  </div>
                )}

                <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">تیتر تبلیغاتی بنر ۲:</label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">لینک مقصد کلیک دکمه:</label>
                    <input
                      type="text"
                      value={bannerLink}
                      onChange={(e) => setBannerLink(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
                  >
                    ذخیره بنر تبلیغاتی
                  </button>
                </form>
              </div>
            )}

            {/* 3. Payouts Module */}
            {activeModule === "payouts" && (
              <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
                <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-400" />
                  <span>بررسی و تایید درخواست‌های تسویه حساب شبا (Branch Ledger)</span>
                </h3>

                <div className="divide-y divide-white/10 text-xs">
                  {payouts.map((p) => (
                    <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white">{p.user}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({p.id})</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === "APPROVED"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {p.status === "APPROVED" ? "تایید شده برای پایا" : "در انتظار بررسی"}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono block">{p.iban}</span>
                        <span className="text-orange-400 font-mono font-bold block">{n(p.amount.toLocaleString())} تومان</span>
                      </div>

                      {p.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => handleApprovePayout(p.id)}
                          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow-md"
                        >
                          تایید و صدور حواله پایا
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Catalog Scraper Trigger Module */}
            {activeModule === "catalog" && (
              <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
                <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-blue-400" />
                  <span>موتور ۵ منبعی استخراج کاتالوگ بازی‌ها (Sony, Steam, RAWG)</span>
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="نام بازی یا Sony Concept ID را وارد کنید..."
                    className="flex-1 h-11 rounded-xl bg-[#0f1016] border border-white/10 px-3.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    className="px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0"
                  >
                    استخراج داده
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white"
                  >
                    پاکسازی کش کاورها (Purge /api/cover Cache)
                  </button>
                </div>
              </div>
            )}

            {/* 5. Orders & Financial Module */}
            {activeModule === "orders" && (
              <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
                <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                  تراکنش‌های اخیر و حالت درگاه
                </h3>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  حالت پرداخت ماک (ALLOW_MOCK_PAYMENTS) در محیط دولوپمنت فعال است. در پروداکشن مسدود می‌باشد.
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Page>
  );
}
