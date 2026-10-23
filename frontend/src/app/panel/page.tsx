"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Gamepad2,
  Receipt,
  HardDrive,
  Shield,
  LifeBuoy,
  Share2,
  Camera,
  Crown,
  Sparkles,
  Check,
  Clock,
  ArrowRight,
  LogOut,
  Download,
  AlertCircle,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { AvatarSelectorModal, PS_AVATARS, type PSCharacterAvatar } from "@/components/panel/AvatarSelectorModal";
import { ReferralTab } from "@/components/panel/ReferralTab";
import { useApp } from "@/lib/app";
import { USER, GAMES } from "@/lib/data";

function PanelContent() {
  const searchParams = useSearchParams();
  const { t, n } = useApp();

  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<PSCharacterAvatar>(PS_AVATARS[0]);

  // Keep tab synced with query param if present
  useEffect(() => {
    const qTab = searchParams.get("tab");
    if (qTab) setActiveTab(qTab);
  }, [searchParams]);

  const tabs = [
    { id: "profile", labelFa: "اطلاعات و پروفایل", labelEn: "Profile Info", icon: UserCheck },
    { id: "library", labelFa: "کتابخانه بازی‌های من", labelEn: "My Library", icon: Gamepad2 },
    { id: "orders", labelFa: "سوابق سفارش‌ها و پرداخت", labelEn: "Orders & Billing", icon: Receipt },
    { id: "subscription", labelFa: "سهمیه و وضعیت ترافیک", labelEn: "Quota & Plan", icon: HardDrive },
    { id: "security", labelFa: "دستگاه‌ها و امنیت", labelEn: "Devices & Security", icon: Shield },
    { id: "tickets", labelFa: "پشتیبانی و تیکت‌ها", labelEn: "Support Tickets", icon: LifeBuoy },
    { id: "referral", labelFa: "معرفی و درآمد (رفرال)", labelEn: "Affiliate & Earnings", icon: Share2, badge: "۲۱٪ پورسانت" },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* 1. Profile Header with Decorative Cover Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#151722] shadow-2xl">
        {/* Decorative Hex Cover Art */}
        <div className="h-44 md:h-56 w-full bg-gradient-to-r from-orange-950 via-[#1c1827] to-purple-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ff5722_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151722] to-transparent" />
        </div>

        {/* User Identity Info */}
        <div className="relative z-10 px-6 pb-6 pt-0 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-right">
            {/* 96px Avatar Frame */}
            <div className="relative group">
              <div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentAvatar.color} border-4 border-[#151722] shadow-xl shadow-orange-500/20 flex items-center justify-center text-white font-black text-2xl ring-2 ring-orange-500/40`}
              >
                {currentAvatar.initials}
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-lg transition-transform group-hover:scale-110"
                title="تغییر آواتار کنسول"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-white">{USER.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>عضو نقره‌ای</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                PSN ID: <strong className="text-blue-400">{USER.psnId}</strong> · عضو از فروردین ۱۴۰۳
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/subscriptions"
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all"
            >
              ارتقای اشتراک
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Panel Layout: Sidebar Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar: 7 Tabs */}
        <aside className="lg:col-span-1 space-y-2">
          <div className="rounded-2xl border border-white/10 bg-[#151722] p-2 space-y-1 shadow-xl">
            {tabs.map((tb) => {
              const Icon = tb.icon;
              const isActive = activeTab === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{t(tb.labelFa, tb.labelEn)}</span>
                  </div>
                  {tb.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                        isActive ? "bg-black/30 text-white" : "bg-orange-500/20 text-orange-300"
                      }`}
                    >
                      {tb.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="lg:col-span-3 min-w-0">
          {/* Tab 1: Profile Info */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                مشخصات حساب کاربری
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    defaultValue={USER.name}
                    className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">شناسه شبکه پلی‌استیشن (PSN ID):</label>
                  <input
                    type="text"
                    defaultValue={USER.psnId}
                    className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">شماره موبایل (تایید شده با OTP):</label>
                  <input
                    type="text"
                    defaultValue="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold">پست الکترونیکی:</label>
                  <input
                    type="email"
                    defaultValue="arman@example.com"
                    className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                className="py-2.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
              >
                ذخیره تغییرات پروفایل
              </button>
            </div>
          )}

          {/* Tab 2: My Games Library */}
          {activeTab === "library" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                کتابخانه بازی‌های من (My Games Library)
              </h3>
              <div className="space-y-3">
                {GAMES.slice(0, 4).map((g) => (
                  <div
                    key={g.slug}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img src={g.image} alt="" className="w-12 h-16 rounded-lg object-cover" />
                      <div>
                        <h4 className="font-bold text-white text-xs">{g.title}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{n(g.sizeGb)} GB · آماده دانلود</span>
                      </div>
                    </div>
                    <Link
                      href={`/shop/${g.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Orders */}
          {activeTab === "orders" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                سوابق سفارش‌ها و صورت‌حساب‌های مالی
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">اشتراک ۱ ماهه نقره‌ای</span>
                    <span className="text-[11px] text-slate-400 font-mono">۱ مهر ۱۴۰۵ · پیگیری: TRK-98124</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white block">{n("۱,۱۹۸,۰۰۰")} تومان</span>
                    <span className="text-green-400 font-bold text-[10px]">موفق (شاپرک)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Subscription & Quota */}
          {activeTab === "subscription" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                وضعیت سهمیه ترافیک و اشتراک
              </h3>
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">پلن نقره‌ای ۱ ترابایت</span>
                  <span className="text-xs text-slate-400 font-mono">انقضا: ۱۸ روز دیگر</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${(USER.quotaLeftGb / USER.quotaTotalGb) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>باقی‌مانده: {n(USER.quotaLeftGb)} GB</span>
                  <span>کل سهمیه: {n(USER.quotaTotalGb)} GB</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Devices & Security */}
          {activeTab === "security" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                دستگاه‌ها و امنیت حساب
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">کنسول PlayStation 5 (مرورگر وب‌کیت سونی)</span>
                    <span className="text-[11px] text-slate-400 font-mono">IP: 2.188.42.10 · تهران · هم‌اکنون فعال</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold text-[10px]">
                    دستگاه جاری
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Support Tickets */}
          {activeTab === "tickets" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white">تیکت‌های پشتیبانی</h3>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold"
                >
                  ارسال تیکت جدید
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">درخواست اضافه شدن پچ فارسی بازی Horizon</span>
                  <span className="text-[11px] text-slate-400 font-mono">شماره: TCK-4819 · ۲ روز پیش</span>
                </div>
                <span className="text-green-400 font-bold">پاسخ داده شده</span>
              </div>
            </div>
          )}

          {/* Tab 7: Referral Tab (TSK-04-24) */}
          {activeTab === "referral" && <ReferralTab />}
        </main>
      </div>

      {/* 20 Avatar Selector Modal (TSK-04-23) */}
      <AvatarSelectorModal
        isOpen={isAvatarModalOpen}
        selectedAvatarId={currentAvatar.id}
        onSelect={(av) => setCurrentAvatar(av)}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </div>
  );
}

export default function UserPanelPage() {
  return (
    <Page>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading panel...</div>}>
        <PanelContent />
      </Suspense>
    </Page>
  );
}
