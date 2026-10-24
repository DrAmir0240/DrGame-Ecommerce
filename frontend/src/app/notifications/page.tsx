"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, ArrowRight, ShieldAlert, Cpu, Sparkles, User, ExternalLink } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

interface NotificationItem {
  id: string;
  type: "system" | "account" | "security";
  titleFa: string;
  titleEn: string;
  bodyFa: string;
  bodyEn: string;
  dateFa: string;
  dateEn: string;
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "system",
    titleFa: "افزایش پهنای باند نود لبه تهران ۱ به ۱۰ گیگابیت",
    titleEn: "Tehran-1 Edge Node Upgraded to 10Gbps",
    bodyFa: "پهنای باند مستقیم زیرساخت برای دانلود بازی‌های حجیم PS5 تا ۱۰ برابر افزایش یافت. تمامی دانلودها اکنون با پینگ زیر ۸ میلی‌ثانیه انجام می‌شوند.",
    bodyEn: "Direct infrastructure edge link has been upgraded for blazing fast downloads with sub-8ms latency.",
    dateFa: "امروز، ۱۰:۱۵",
    dateEn: "Today, 10:15",
    read: false,
    link: "/shop",
  },
  {
    id: "notif-2",
    type: "security",
    titleFa: "یادآوری تنظیم DNS اختصاصی برای جلوگیری از خطای سونی",
    titleEn: "DNS Configuration Reminder for PlayStation Consoles",
    bodyFa: "برای دسترسی بدون قطعی به سرورهای محلی، آدرس DNS کنسول را روی 0.0.0.0 یا Primary DNS دکتر گیم تنظیم نمایید.",
    bodyEn: "Ensure your console DNS is configured correctly to avoid Sony telemetry blocks.",
    dateFa: "دیروز، ۱۸:۳۰",
    dateEn: "Yesterday, 18:30",
    read: false,
    link: "/articles/goldhen-ps4-1100-guide",
  },
  {
    id: "notif-3",
    type: "system",
    titleFa: "انتشار پیلود GoldHEN v2.4b17 برای فریم‌ورک ۱۱.۰۰",
    titleEn: "GoldHEN v2.4b17 Payload Released for FW 11.00",
    bodyFa: "نسخه جدید پیلود با ثبات ۹۹.۸ درصدی و پشتیبانی خودکار از بارگذاری پلاگین‌های FPS Unlock در بخش جیلبریک قرار گرفت.",
    bodyEn: "New stable payload with plugin support has been added to the jailbreak repository.",
    dateFa: "۳ روز پیش",
    dateEn: "3 days ago",
    read: true,
    link: "/jailbreak",
  },
  {
    id: "notif-4",
    type: "account",
    titleFa: "شارژ سهمیه ترافیک ماهانه ۵۰۰ گیگابایت",
    titleEn: "Monthly 500GB Traffic Quota Refreshed",
    bodyFa: "سهمیه دانلود حساب کاربری شما با موفقیت برای ماه جدید تمدید شد و آماده استفاده است.",
    bodyEn: "Your monthly bandwidth quota has been refilled successfully.",
    dateFa: "۵ روز پیش",
    dateEn: "5 days ago",
    read: true,
    link: "/panel",
  },
];

export default function NotificationsPage() {
  const { t, n, lang } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "system" | "account" | "security">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const filtered = notifications.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "system":
        return <Cpu className="w-5 h-5 text-purple-400" />;
      case "security":
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case "account":
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <Page>
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {t("مرکز اعلان‌ها و پیام‌ها", "Notifications Center")}
              </h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-xs font-mono font-bold">
                  {n(unreadCount)} {t("جدید", "new")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {t(
                "گزارش‌های به‌روزرسانی سرورها، امنیت حساب، و تغییرات دیتابیس بازی‌ها",
                "System updates, security alerts, and catalog notifications"
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4 text-purple-400" />
              <span>{t("علامت‌گذاری همه به عنوان خوانده‌شده", "Mark all read")}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(
            [
              { id: "all", labelFa: "همه اعلان‌ها", labelEn: "All" },
              { id: "system", labelFa: "به‌روزرسانی‌های سیستم", labelEn: "System" },
              { id: "account", labelFa: "حساب کاربری و سهمیه", labelEn: "Account" },
              { id: "security", labelFa: "هشدارهای امنیتی و کنسول", labelEn: "Security" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                filter === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-[#151722] text-slate-400 hover:text-white hover:bg-white/5 border border-white/10"
              }`}
            >
              {t(tab.labelFa, tab.labelEn)}
            </button>
          ))}
        </div>

        {/* Notification Cards */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#151722] p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">هیچ اعلانی در این دسته‌بندی وجود ندارد.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  item.read
                    ? "bg-[#151722]/60 border-white/5"
                    : "bg-[#151722] border-purple-500/30 shadow-lg shadow-purple-500/5"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-extrabold ${item.read ? "text-slate-300" : "text-white"}`}>
                        {t(item.titleFa, item.titleEn)}
                      </h3>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-purple-400 inline-block animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(item.bodyFa, item.bodyEn)}
                    </p>

                    <div className="flex items-center gap-4 pt-1 text-[11px] font-mono text-slate-500">
                      <span>{t(item.dateFa, item.dateEn)}</span>
                      {item.link && (
                        <Link
                          href={item.link}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold font-sans"
                        >
                          <span>{t("مشاهده جزئیات", "View details")}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeNotification(item.id)}
                  title="حذف این اعلان"
                  className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
