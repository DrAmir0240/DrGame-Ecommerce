'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Sparkles,
  Gift,
  AlertCircle,
  CheckCheck,
  Trash2,
  ExternalLink,
  Loader2,
  Clock,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';

interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'bonus' | 'warning' | 'alert';
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export default function MyNotificationsPage() {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

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
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAllAsRead = async () => {
    try {
      await apiRequest('/users/me/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/users/me/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/users/me/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const filtered = safeNotifications.filter((n) => {
    if (filterType === 'unread') return !n.is_read;
    if (filterType === 'bonus') return n.type === 'bonus';
    if (filterType === 'warning') return n.type === 'warning' || n.type === 'alert';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return <Gift className="w-5 h-5 text-emerald-400" />;
      case 'warning':
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const unreadCount = safeNotifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-vazir text-right">
      {!isAuthenticated && (
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>جهت مشاهده اعلانات و پیام‌های شخصی حساب خود، لطفاً وارد شوید.</span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true, 'otp')}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shrink-0"
          >
            ورود به حساب
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Bell className="w-4 h-4" />
            <span>پیام‌ها، رویدادها و هشدارهای سیستمی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            مرکز اعلانات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            اطلاع‌رسانی وضعیت اشتراک، پاداش‌های رفرال، بازی‌های جدید و پیام‌های پشتیبانی
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-bold text-xs transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            <span>علامت‌گذاری همه به عنوان خوانده شده</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { label: 'همه اعلانات', val: 'all', count: notifications.length },
          { label: 'خوانده‌نشده', val: 'unread', count: unreadCount },
          { label: 'پاداش و پورسانت', val: 'bonus', count: notifications.filter((n) => n.type === 'bonus').length },
          { label: 'هشدار و امنیت', val: 'warning', count: notifications.filter((n) => n.type === 'warning' || n.type === 'alert').length },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setFilterType(tab.val)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              filterType === tab.val
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت اعلانات...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0d121f] border border-white/10 text-center space-y-3">
            <Bell className="w-12 h-12 text-slate-600 mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-white">اعلانی یافت نشد</h4>
            <p className="text-xs text-slate-400">
              هیچ پیامی در این دسته‌بندی وجود ندارد.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.is_read && markAsRead(item.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                item.is_read
                  ? 'bg-[#0d121f]/60 border-white/5 opacity-80'
                  : 'bg-[#141b2d] border-cyan-500/30 shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">
                      {item.title}
                    </h3>
                    {!item.is_read && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        جدید
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-roboto">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(item.created_at)}</span>
                    </span>

                    {item.link && (
                      <Link
                        href={item.link}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                      >
                        <span>مشاهده صفحه مربوطه</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="حذف اعلان"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
