'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Clock,
  User,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2,
  Headphones,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';

interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'user' | 'admin';
  sender_name?: string | null;
  message: string;
  created_at: string;
}

interface AdminTicketItem {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  tracking_code: string;
  subject: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
}

interface AdminTicketDetail extends AdminTicketItem {
  messages: TicketMessage[];
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<AdminTicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<AdminTicketItem[]>('/admin/tickets');
      setTickets(data || []);
    } catch (err: any) {
      console.error('Failed to load admin tickets:', err);
      setError('خطا در دریافت لیست تیکت‌ها از سرور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenTicket = async (ticket: AdminTicketItem) => {
    try {
      setLoadingDetail(true);
      setSelectedTicket({ ...ticket, messages: [] });
      const detail = await apiRequest<AdminTicketDetail>(`/admin/tickets/${ticket.id}`);
      setSelectedTicket(detail);
    } catch (err: any) {
      alert(err.message || 'خطا در بارگذاری پیام‌های تیکت.');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || sending) return;

    try {
      setSending(true);
      const res = await apiRequest<TicketMessage>(`/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      });

      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'answered',
              messages: [...prev.messages, res],
            }
          : null
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'answered' } : t))
      );
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پاسخ.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    try {
      await apiRequest(`/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed' }),
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: 'closed' } : t))
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: 'closed' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'خطا در بستن تیکت.');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  const getStatusBadge = (status: AdminTicketItem['status']) => {
    switch (status) {
      case 'answered':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">پاسخ داده شد</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">در حال بررسی</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">بسته شده</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">در انتظار پاسخ</span>;
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
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 font-vazir text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <Headphones className="w-5 h-5 text-emerald-400" />
            <span>سامانه مدیریت و پاسخ‌گویی به تیکت‌های پشتیبانی</span>
          </h1>
          <p className="text-xs text-slate-400">
            بررسی پرسش‌های فنی، حسابداری و پیگیری کاربران به صورت چت تعاملی دوطرفه متصل به دیتابیس زنده
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121721] rounded-2xl border border-slate-800 self-start sm:self-auto">
          {[
            { label: 'همه تیکت‌ها', val: 'all' },
            { label: 'در انتظار پاسخ', val: 'open' },
            { label: 'پاسخ داده شده', val: 'answered' },
            { label: 'بسته شده', val: 'closed' },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterStatus(f.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === f.val
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tickets List Table */}
      <div className="bg-[#0c1017] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت تیکت‌ها...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">کد پیگیری</th>
                  <th className="py-3.5 px-4 font-semibold">کاربر</th>
                  <th className="py-3.5 px-4 font-semibold">موضوع تیکت</th>
                  <th className="py-3.5 px-4 font-semibold">دپارتمان</th>
                  <th className="py-3.5 px-4 font-semibold">تاریخ</th>
                  <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                  <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      هیچ تیکتی در این بخش یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/20">
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold" dir="ltr">
                        {t.tracking_code || `#${t.id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{t.user_name || 'کاربر'}</div>
                        <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                          {t.user_phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">{t.subject}</td>
                      <td className="py-3.5 px-4 text-slate-400">{t.department}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenTicket(t)}
                          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold text-[11px] flex items-center gap-1 mx-auto transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>مشاهده و پاسخ</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-Way Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-purple-400 font-bold" dir="ltr">
                    {selectedTicket.tracking_code || `#${selectedTicket.id}`}
                  </span>
                  <h2 className="text-sm font-bold text-white">{selectedTicket.subject}</h2>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ارسال شده توسط {selectedTicket.user_name} ({selectedTicket.user_phone})
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== 'closed' && (
                  <button
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    بستن تیکت
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 custom-scrollbar">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <span className="text-xs text-slate-400">در حال بارگذاری پیام‌ها...</span>
                </div>
              ) : selectedTicket.messages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  پیامی در این تیکت وجود ندارد.
                </div>
              ) : (
                selectedTicket.messages.map((m) => {
                  const isAdmin = m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                          isAdmin
                            ? 'bg-purple-950/40 border border-purple-500/30 text-purple-100 rounded-tr-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold text-slate-300">
                            {isAdmin ? 'پاسخ پشتیبانی دکتر گیم' : selectedTicket.user_name}
                          </span>
                          <span className="font-mono">{formatDate(m.created_at)}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input Box */}
            {selectedTicket.status !== 'closed' ? (
              <form onSubmit={handleSendReply} className="flex gap-2 pt-2 flex-shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="متن پاسخ رسمی برای کاربر..."
                  className="flex-1 bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-950/40 disabled:opacity-50 transition-all shrink-0"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>ارسال پاسخ</span>
                </button>
              </form>
            ) : (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
