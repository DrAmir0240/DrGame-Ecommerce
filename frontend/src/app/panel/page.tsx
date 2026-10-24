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
  Trash2,
  Bell,
  Image as ImageIcon,
} from "lucide-react";

import { Page } from "@/components/Shell";
import { AvatarSelectorModal, PS_AVATARS, type PSCharacterAvatar } from "@/components/panel/AvatarSelectorModal";
import { HeroBannerCustomizerModal, GAME_BANNER_OPTIONS, type GameBannerOption } from "@/components/panel/HeroBannerCustomizerModal";
import { NotificationsCenterTab } from "@/components/panel/NotificationsCenterTab";
import { PayoutAccountsManager } from "@/components/panel/PayoutAccountsManager";
import { ReferralTab } from "@/components/panel/ReferralTab";
import { useApp } from "@/lib/app";
import { USER, GAMES } from "@/lib/data";
import { api } from "@/lib/api";

function PanelContent() {
  const searchParams = useSearchParams();
  const { t, n } = useApp();

  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<PSCharacterAvatar>(PS_AVATARS[0]);

  // Profile Hero Banner State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [userBannerUrl, setUserBannerUrl] = useState<string>(GAME_BANNER_OPTIONS[0].imageUrl);

  useEffect(() => {
    try {
      const savedBanner = localStorage.getItem("drgame_user_banner");
      if (savedBanner) {
        setUserBannerUrl(savedBanner);
      }
    } catch (e) {}
  }, []);

  const handleSelectBanner = (banner: GameBannerOption) => {
    setUserBannerUrl(banner.imageUrl);
    try {
      localStorage.setItem("drgame_user_banner", banner.imageUrl);
    } catch (e) {}
  };

  // Profile Form State
  const [fullName, setFullName] = useState(USER.name);
  const [psnId, setPsnId] = useState(USER.psnId);
  const [phone, setPhone] = useState("09123456789");
  const [email, setEmail] = useState("arman@example.com");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Orders State
  const [orders, setOrders] = useState<any[]>([
    {
      tracking_code: "TRK-98124",
      plan_name: "اشتراک ۱ ماهه نقره‌ای",
      created_at: "۱ مهر ۱۴۰۵",
      final_price_irr: 1198000,
      payment_status: "PAID",
      gateway: "شاپرک (زیبال)",
    },
  ]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [libraryGames, setLibraryGames] = useState(() => GAMES.slice(0, 4));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("drgame_library") || "[]");
      if (saved.length > 0) {
        const matched = GAMES.filter((g) => saved.includes(g.slug));
        if (matched.length > 0) setLibraryGames(matched);
      }
    } catch (e) {}
  }, []);

  const handleRemoveFromLibrary = (slug: string) => {
    setLibraryGames((prev) => {
      const next = prev.filter((g) => g.slug !== slug);
      try {
        localStorage.setItem("drgame_library", JSON.stringify(next.map((x) => x.slug)));
      } catch (e) {}
      return next;
    });
  };

  // Keep tab synced with query param if present
  useEffect(() => {
    const qTab = searchParams.get("tab");
    if (qTab) setActiveTab(qTab);
  }, [searchParams]);

  // Fetch real orders from database
  useEffect(() => {
    let isMounted = true;
    setLoadingOrders(true);
    api.get<any[]>("/api/v1/orders/my-orders")
      .then((res) => {
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setOrders(res.data);
        }
      })
      .catch(() => {
        // Retain fallback order
      })
      .finally(() => {
        if (isMounted) setLoadingOrders(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    try {
      await api.put("/api/v1/auth/profile", {
        full_name: fullName,
        email,
        phone,
      });
      setProfileMsg("مشخصات پروفایل با موفقیت ذخیره شد.");
      setTimeout(() => setProfileMsg(""), 4000);
    } catch {
      setProfileMsg("مشخصات محلی به‌روزرسانی شد.");
      setTimeout(() => setProfileMsg(""), 4000);
    } finally {
      setSavingProfile(false);
    }
  };

  const tabs = [
    { id: "profile", labelFa: "اطلاعات و پروفایل", labelEn: "Profile Info", icon: UserCheck },
    { id: "notifications", labelFa: "مرکز اعلانات", labelEn: "Notifications", icon: Bell, badge: "جدید" },
    { id: "library", labelFa: "کتابخانه بازی‌های من", labelEn: "My Library", icon: Gamepad2 },
    { id: "orders", labelFa: "سوابق سفارش‌ها و پرداخت", labelEn: "Orders & Billing", icon: Receipt },
    { id: "subscription", labelFa: "سهمیه و وضعیت ترافیک", labelEn: "Quota & Plan", icon: HardDrive },
    { id: "security", labelFa: "دستگاه‌ها و امنیت", labelEn: "Devices & Security", icon: Shield },
    { id: "tickets", labelFa: "پشتیبانی و تیکت‌ها", labelEn: "Support Tickets", icon: LifeBuoy },
    { id: "referral", labelFa: "معرفی، درآمد و تسویه", labelEn: "Affiliate & Earnings", icon: Share2, badge: "۲۱٪ پورسانت" },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* 1. Profile Header with Customizable Game Hero Backdrop */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#151722] shadow-2xl">
        {/* Game Hero Cover Art */}
        <div className="h-44 md:h-64 w-full relative overflow-hidden bg-[#0d0e14]">
          <img
            src={userBannerUrl}
            alt="User Hero Banner"
            className="w-full h-full object-cover object-center transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151722] via-[#151722]/50 to-transparent" />
          <div className="absolute inset-0 bg-purple-950/20 mix-blend-color" />

          {/* Banner Selector Trigger Button */}
          <button
            type="button"
            onClick={() => setIsBannerModalOpen(true)}
            className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:border-purple-400 group"
          >
            <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>تغییر کاور هیرو</span>
          </button>
        </div>

        {/* User Identity Info */}
        <div className="relative z-10 px-6 pb-6 pt-0 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-right">
            {/* 96px Avatar Frame */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#151722] shadow-xl shadow-purple-500/20 ring-2 ring-purple-500/40 bg-[#0f1016]">
                <img
                  src={currentAvatar.image}
                  alt={currentAvatar.nameFa || "Avatar"}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform group-hover:scale-110"
                title="تغییر آواتار کنسول"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-white">{fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-purple-400" />
                  <span>عضو ویژه پلی‌استیشن</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                PSN ID: <strong className="text-purple-400">{psnId}</strong> · عضو از فروردین ۱۴۰۳
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/subscriptions"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all"
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
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/25"
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
                        isActive ? "bg-black/30 text-white" : "bg-purple-500/20 text-purple-300"
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

              {profileMsg && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">شناسه شبکه پلی‌استیشن (PSN ID):</label>
                    <input
                      type="text"
                      value={psnId}
                      onChange={(e) => setPsnId(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">شماره موبایل (تایید شده با OTP):</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 block font-bold">پست الکترونیکی:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all disabled:opacity-50"
                >
                  {savingProfile ? "در حال ذخیره..." : "ذخیره تغییرات در دیتابیس"}
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: My Games Library */}
          {activeTab === "library" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white">
                  کتابخانه بازی‌های من (My Games Library)
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                  {n(libraryGames.length)} بازی
                </span>
              </div>

              {libraryGames.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <p className="text-slate-400 text-sm">هیچ بازی در کتابخانه یا لیست علاقه‌مندی شما ثبت نشده است.</p>
                  <Link
                    href="/shop"
                    className="inline-block px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                  >
                    مشاهده فروشگاه بازی‌ها
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {libraryGames.map((g) => (
                    <div
                      key={g.slug}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4 hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={g.image} alt={g.title} className="w-12 h-16 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">{g.title}</h4>
                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                            {n(g.sizeGb)} GB · آماده دانلود
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/shop/${g.slug}#game-files-section`}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>دانلود</span>
                        </Link>
                        <button
                          onClick={() => handleRemoveFromLibrary(g.slug)}
                          title="حذف از کتابخانه"
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Orders */}
          {activeTab === "orders" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                سوابق سفارش‌ها و صورت‌حساب‌های مالی
              </h3>

              {loadingOrders ? (
                <div className="py-6 text-center text-slate-400 text-xs">در حال دریافت لیست سفارش‌ها از پایگاه داده...</div>
              ) : orders.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">هنوز سفارشی ثبت نشده است.</div>
              ) : (
                <div className="space-y-2 text-xs">
                  {orders.map((ord, idx) => (
                    <div key={ord.tracking_code || idx} className="p-3.5 rounded-2xl bg-white/5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{ord.plan_name || "اشتراک دانلود DrGame"}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {ord.created_at || "اخیراً"} · پیگیری: {ord.tracking_code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white block">{n((ord.final_price_irr || 0).toLocaleString())} تومان</span>
                        <span className="text-green-400 font-bold text-[10px]">
                          {ord.payment_status === "PAID" ? "پرداخت موفق (دیتابیس)" : ord.payment_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Subscription & Quota */}
          {activeTab === "subscription" && (
            <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
              <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
                وضعیت سهمیه ترافیک و اشتراک
              </h3>
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">پلن نقره‌ای ۱ ترابایت</span>
                  <span className="text-xs text-slate-400 font-mono">انقضا: ۱۸ روز دیگر</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
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
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
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

          {/* Tab: Notifications Center (TSK-08-07) */}
          {activeTab === "notifications" && <NotificationsCenterTab />}

          {/* Tab 7: Referral & Payout Accounts (TSK-08-07) */}
          {activeTab === "referral" && (
            <div className="space-y-8">
              <ReferralTab />
              <PayoutAccountsManager />
            </div>
          )}
        </main>
      </div>

      {/* 20 Avatar Selector Modal (TSK-04-23) */}
      <AvatarSelectorModal
        isOpen={isAvatarModalOpen}
        selectedAvatarId={currentAvatar.id}
        onSelect={(av) => setCurrentAvatar(av)}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      {/* Hero Banner Customizer Modal (TSK-08-07) */}
      <HeroBannerCustomizerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        currentBannerUrl={userBannerUrl}
        onSelectBanner={handleSelectBanner}
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

