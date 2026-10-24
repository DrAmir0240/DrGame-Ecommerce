"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Trash2, ShieldAlert, Sparkles, MessageSquare, CreditCard, Clock } from "lucide-react";
import { useApp } from "@/lib/app";

export interface SystemNotification {
  id: string;
  titleFa: string;
  titleEn: string;
  messageFa: string;
  messageEn: string;
  type: "system" | "ticket" | "order" | "referral";
  date: string;
  isRead: boolean;
}

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: "notif-1",
    titleFa: "پاسخ جدید به تیکت پشتیبانی #TKT-891",
    titleEn: "New Reply to Support Ticket #TKT-891",
    messageFa: "کارشناس پشتیبانی فنی دکتر گیم به تیکت شما در رابطه با راهنمای FPKG پاسخ داد.",
    messageEn: "Support specialist replied to your ticket regarding FPKG installation.",
    type: "ticket",
    date: "۲ ساعت پیش",
    isRead: false,
  },
  {
    id: "notif-2",
    titleFa: "اشتراک طلایی VIP شما با موفقیت فعال شد",
    titleEn: "Your Gold VIP Subscription is Active",
    messageFa: "سهمیه ۲,۲۵۰ گیگابایت ترافیک فوق‌سریع لبه تهران ۱ به حساب کاربری شما افزوده شد.",
    messageEn: "2,250 GB edge quota added to your account with uncapped speed.",
    type: "order",
    date: "دیروز",
    isRead: false,
  },
  {
    id: "notif-3",
    titleFa: "واریز کمیسیون رفرال دعوت از دوستان",
    titleEn: "Referral Commission Credited",
    messageFa: "مبلغ ۴۱۹,۳۰۰ تومان کمیسیون خرید اشتراک توسط کاربر دعوت‌شده به کیف پول شما واریز گردید.",
    messageEn: "419,300 Tomans referral bonus has been credited to your wallet.",
    type: "referral",
    date: "۳ روز پیش",
    isRead: true,
  },
  {
    id: "notif-4",
    titleFa: "به‌روزرسانی سرورهای دانلود لبه تهران",
    titleEn: "Tehran Edge CDN Infrastructure Update",
    messageFa: "ظرفیت پهنای باند سرورهای مستقیم تهران تا ۴۰ گیگابیت بر ثانیه ارتقا پیدا کرد.",
    messageEn: "Edge bandwidth upgraded to 40 Gbps for faster concurrent downloads.",
    type: "system",
    date: "۱ هفته پیش",
    isRead: true,
  },
];

export const NotificationsCenterTab: React.FC = () => {
  const { t, n } = useApp();
  const [notifications, setNotifications] = useState<SystemNotification[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("drgame_user_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const saveToStorage = (list: SystemNotification[]) => {
    setNotifications(list);
    try {
      localStorage.setItem("drgame_user_notifications", JSON.stringify(list));
    } catch (e) {}
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveToStorage(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveToStorage(updated);
  };

  const handleDelete = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveToStorage(updated);
  };

  const filtered = notifications.filter((item) => (filter === "unread" ? !item.isRead : true));
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-lg">
                {n(unreadCount)}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">
              {t("مرکز اعلانات و پیام‌های سیستمی", "Notifications Center")}
            </h3>
            <p className="text-xs text-slate-400">
              {t("وضعیت سفارش‌ها، پاسخ‌های پشتیبانی و اعلانات فنی سامانه", "System notices, order status and support ticket updates")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#0f1016] border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                filter === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {t("همه", "All")}
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
                filter === "unread" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{t("خوانده‌نشده", "Unread")}</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono flex items-center justify-center">
                  {n(unreadCount)}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold px-2 py-1"
            >
              {t("خوانده شدن همه", "Mark all as read")}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs space-y-2">
          <Bell className="w-8 h-8 text-slate-600 mx-auto" />
          <p>{t("هیچ اعلان جدیدی وجود ندارد.", "No notifications found.")}</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5 space-y-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl transition-all flex items-start justify-between gap-4 ${
                !item.isRead
                  ? "bg-purple-600/[0.08] border border-purple-500/20"
                  : "hover:bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === "ticket"
                      ? "bg-blue-500/20 text-blue-300"
                      : item.type === "order"
                      ? "bg-amber-500/20 text-amber-300"
                      : item.type === "referral"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {item.type === "ticket" && <MessageSquare className="w-4 h-4" />}
                  {item.type === "order" && <CreditCard className="w-4 h-4" />}
                  {item.type === "referral" && <Sparkles className="w-4 h-4" />}
                  {item.type === "system" && <ShieldAlert className="w-4 h-4" />}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">
                      {t(item.titleFa, item.titleEn)}
                    </span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t(item.messageFa, item.messageEn)}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {item.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-colors"
                    title="علامت‌گذاری به عنوان خوانده‌شده"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                  title="حذف اعلان"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsCenterTab;
