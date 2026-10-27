'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Sparkles, AlertCircle, Gift, CheckCheck, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'bonus' | 'warning';
  read: boolean;
  link?: string;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'تخصیص سهمیه ماهانه جدید',
    message: 'سهمیه دانلود ماه جدید اشتراک شما با موفقیت شارژ شد.',
    time: '۱۰ دقیقه پیش',
    type: 'bonus',
    read: false,
    link: '/dashboard',
  },
  {
    id: '2',
    title: 'اضافه شدن دیتای جدید بازی‌ها',
    message: 'دیتای جدید همراه با دوبله و زیرنویس فارسی اختصاصی اضافه شد.',
    time: '۲ ساعت پیش',
    type: 'info',
    read: false,
    link: '/games',
  },
  {
    id: '3',
    title: 'DNS اختصاصی کنسول',
    message: 'برای اتصال بدون تحریم، DNS اختصاصی را در تنظیمات شبکه کنسول تنظیم کنید.',
    time: '۱ روز پیش',
    type: 'warning',
    read: true,
    link: '/tools',
  },
];

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'bonus':
        return <Gift className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cosmic-purple" />;
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/40 text-text-secondary hover:text-white transition-all shrink-0 group focus:outline-none focus:ring-1 focus:ring-cosmic-purple/50"
        title="اعلان‌ها"
        aria-label="اعلان‌ها و پیام‌ها"
      >
        <Bell className="w-4 h-4 group-hover:scale-110 transition-transform text-text-secondary group-hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse font-roboto">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl glass-card border border-white/15 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl bg-surface-base/95">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cosmic-purple" />
              <span className="text-xs font-black text-white">اعلان‌ها و رویدادها</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadCount} جدید
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-text-muted hover:text-cosmic-purple transition-colors flex items-center gap-1"
                title="علامت‌گذاری همه به عنوان خوانده شده"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>خوانده شد</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">
                هیچ اعلانی وجود ندارد
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    item.read
                      ? 'bg-white/[0.02] border-white/5 opacity-75'
                      : 'bg-white/[0.05] border-white/15 shadow-sm'
                  } hover:bg-white/[0.08] hover:border-cosmic-purple/30`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-white truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-text-muted shrink-0 font-roboto">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="mt-2.5 pt-2 border-t border-white/10">
            <Link
              href={isAuthenticated ? '/dashboard' : '/subscriptions'}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white text-xs font-bold transition-all text-center"
            >
              <span>مشاهده همه اعلان‌ها و گزارش‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
