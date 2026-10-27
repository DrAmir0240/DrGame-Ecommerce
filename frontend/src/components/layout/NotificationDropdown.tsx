'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Sparkles, AlertCircle, Gift, CheckCheck, ChevronLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';

interface ApiNotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'bonus' | 'warning' | 'alert';
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export default function NotificationDropdown() {
  const { isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await apiRequest<any>('/users/me/notifications');
      const list = Array.isArray(data) ? data : (data?.items || []);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

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

  const markAllAsRead = async () => {
    try {
      await apiRequest('/users/me/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/users/me/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return <Gift className="w-4 h-4 text-emerald-400" />;
      case 'warning':
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMin = Math.floor((now.getTime() - past.getTime()) / 60000);
      if (diffMin < 1) return 'هم‌اکنون';
      if (diffMin < 60) return `${diffMin} دقیقه پیش`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} ساعت پیش`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} روز پیش`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && isAuthenticated) fetchNotifications();
        }}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all shrink-0 group focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        title="اعلان‌ها"
        aria-label="اعلان‌ها و پیام‌ها"
      >
        <Bell className="w-4 h-4 group-hover:scale-110 transition-transform text-slate-300 group-hover:text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse font-roboto">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-2xl bg-[#0b0e17]/95 text-right font-vazir">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5 px-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black text-white">اعلان‌ها و رویدادها</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-roboto">
                  {unreadCount} جدید
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
                title="علامت‌گذاری همه به عنوان خوانده شده"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>خوانده شد</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5 custom-scrollbar">
            {!isAuthenticated ? (
              <div className="py-6 text-center text-xs text-slate-400">
                برای مشاهده اعلان‌ها لطفاً ابتدا وارد شوید.
              </div>
            ) : loading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>در حال بارگذاری اعلان‌ها...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                هیچ اعلانی در حال حاضر وجود ندارد.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.is_read && markAsRead(item.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    item.is_read
                      ? 'bg-white/[0.02] border-white/5 opacity-70'
                      : 'bg-white/[0.06] border-white/15 shadow-sm'
                  } hover:bg-white/[0.09] hover:border-cyan-500/30`}
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
                        <span className="text-[10px] text-slate-400 shrink-0 font-roboto" dir="ltr">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
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
              href={isAuthenticated ? '/dashboard/notifications' : '/subscriptions'}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all text-center"
            >
              <span>مرکز اعلانات و پیام‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
