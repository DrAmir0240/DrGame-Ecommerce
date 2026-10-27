'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Loader2,
  AlertCircle,
  Headphones,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
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

interface TicketDetail {
  id: number;
  tracking_code: string;
  subject: string;
  department: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

interface TicketConversationModalProps {
  ticketId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshList?: () => void;
}

export default function TicketConversationModal({
  ticketId,
  isOpen,
  onClose,
  onRefreshList,
}: TicketConversationModalProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<TicketDetail>(`/tickets/me/${ticketId}`);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری اطلاعات تیکت.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicket();
    } else {
      setTicket(null);
    }
  }, [isOpen, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  if (!isOpen || !ticketId) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      setError(null);
      const sent = await apiRequest<TicketMessage>(`/tickets/me/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: 'open',
              messages: [...prev.messages, sent],
            }
          : null
      );
      setNewMessage('');
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال پیام.');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  const formatMessageTime = (dateStr: string) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-vazir text-right">
      <div className="relative w-full max-w-2xl h-[85vh] rounded-3xl bg-[#0b0e17] border border-white/10 flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0e121e] flex items-center justify-between shrink-0">
          <div className="space-y-1 max-w-[80%]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20" dir="ltr">
                {ticket?.tracking_code}
              </span>
              {ticket && getStatusBadge(ticket.status)}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white truncate">
              {ticket?.subject || 'در حال دریافت اطلاعات تیکت...'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Conversation Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#090b12]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs text-slate-400">در حال دریافت تاریخچه پیام‌ها...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !ticket || ticket.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              پیامی در این تیکت یافت نشد.
            </div>
          ) : (
            ticket.messages.map((msg) => {
              const isAdmin = msg.sender_type === 'admin';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                    {isAdmin ? (
                      <>
                        <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-cyan-300">
                          {msg.sender_name || 'پشتیبانی فنی دکتر گیم'}
                        </span>
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-bold text-slate-300">شما</span>
                      </>
                    )}
                    <span className="text-[10px] text-slate-500 mr-2 font-roboto" dir="ltr">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isAdmin
                        ? 'bg-[#141b2d] border border-cyan-500/30 text-white rounded-tr-sm shadow-md'
                        : 'bg-gradient-to-r from-purple-900/60 to-purple-800/40 border border-purple-500/30 text-white rounded-tl-sm shadow-md'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Modal Footer: Reply Input */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0e121e] shrink-0">
          {ticket?.status === 'closed' ? (
            <div className="p-3 rounded-xl bg-slate-800/80 text-center text-xs text-slate-400 font-bold">
              این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد. در صورت نیاز، تیکت جدیدی ایجاد کنید.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="پاسخ خود را بنویسید..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending || loading}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline">ارسال پاسخ</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
