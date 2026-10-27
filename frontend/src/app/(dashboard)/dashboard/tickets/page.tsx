'use client';

import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import NewTicketModal from '@/components/tickets/NewTicketModal';
import TicketConversationModal from '@/components/tickets/TicketConversationModal';

interface TicketListItem {
  id: number;
  tracking_code: string;
  subject: string;
  department: string;
  priority: string;
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
}

export default function MyTicketsPage() {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);

  const fetchTickets = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await apiRequest<TicketListItem[]>('/tickets/me');
      setTickets(data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const toFarsi = (num: number) => (num || 0).toLocaleString('fa-IR');

  const filteredTickets = tickets.filter((t) => {
    const term = search.toLowerCase();
    const matchesSearch =
      t.subject.toLowerCase().includes(term) ||
      t.tracking_code.toLowerCase().includes(term);

    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return matchesSearch;
  });

  const getStatusBadge = (status: TicketListItem['status']) => {
    switch (status) {
      case 'answered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">پاسخ داده شده</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">در حال بررسی</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">بسته شده</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">در انتظار پاسخ</span>;
    }
  };

  const getDepartmentLabel = (dept: string) => {
    switch (dept) {
      case 'technical':
        return 'پشتیبانی فنی';
      case 'downloads':
        return 'دانلود دیتا';
      case 'financial':
        return 'مالی و اشتراک';
      default:
        return 'عمومی';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">فوری</span>;
      case 'low':
        return <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">عادی</span>;
      default:
        return <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">متوسط</span>;
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

  // Stats calculation
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const answeredCount = tickets.filter((t) => t.status === 'answered').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-vazir text-right">
      {!isAuthenticated && (
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>جهت مشاهده و پیگیری تیکت‌های پشتیبانی، لطفاً وارد حساب خود شوید.</span>
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
            <Headphones className="w-4 h-4" />
            <span>مرکز تماس و پشتیبانی اختصاصی مشترکین</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            تیکت‌های پشتیبانی
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ارتباط مستقیم و دوطرفه با تیم فنی و مالی دکتر گیم، ارسال گزارش و حل سریع مشکلات
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              setAuthModalOpen(true, 'otp');
            } else {
              setIsNewModalOpen(true);
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تیکت جدید</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>کل تیکت‌های ثبت شده</span>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-roboto pt-2">
            {toFarsi(totalCount)} <span className="text-xs font-vazir text-slate-400">تیکت</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>در حال پیگیری</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-roboto pt-2">
            {toFarsi(openCount)} <span className="text-xs font-vazir text-slate-400">تیکت</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>پاسخ داده شده</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-roboto pt-2">
            {toFarsi(answeredCount)} <span className="text-xs font-vazir text-slate-400">تیکت</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d121f] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی موضوع یا کد پیگیری..."
            className="w-full bg-[#141b2d] border border-white/10 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">در انتظار پاسخ</option>
            <option value="in_progress">در حال بررسی</option>
            <option value="answered">پاسخ داده شده</option>
            <option value="closed">بسته شده</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-5 sm:p-6 shadow-2xl">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت تیکت‌ها...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-white">تیکتی یافت نشد</h4>
            <p className="text-xs text-slate-400">
              {tickets.length === 0
                ? 'شما تاکنون تیکت پشتیبانی ثبت نکرده‌اید. با کلیک بر روی دکمه بالا مشکل خود را با ما در میان بگذارید.'
                : 'تیکتی با این فیلتر یا عبارت جستجو پیدا نشد.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setActiveTicketId(ticket.id)}
                className="p-4 rounded-2xl bg-[#141b2d] border border-white/5 hover:border-cyan-500/40 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20" dir="ltr">
                      {ticket.tracking_code}
                    </span>
                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-md bg-white/5">
                      {getDepartmentLabel(ticket.department)}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {ticket.subject}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-roboto">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(ticket.updated_at || ticket.created_at)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button className="px-3 py-1.5 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-300 text-xs font-bold transition-all flex items-center gap-1">
                    <span>مشاهده گفتگو</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <NewTicketModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onTicketCreated={fetchTickets}
      />

      <TicketConversationModal
        ticketId={activeTicketId}
        isOpen={Boolean(activeTicketId)}
        onClose={() => setActiveTicketId(null)}
        onRefreshList={fetchTickets}
      />
    </div>
  );
}
