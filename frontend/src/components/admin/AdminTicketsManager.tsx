"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Send,
  Check,
  X,
  User,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/app";

interface TicketMessage {
  id: string;
  sender: "USER" | "ADMIN";
  senderName: string;
  text: string;
  timestamp: string;
}

interface TicketItem {
  id: string;
  user: string;
  email: string;
  subject: string;
  department: string;
  priority: "HIGH" | "NORMAL" | "URGENT";
  status: "OPEN" | "ANSWERED" | "CLOSED";
  createdAt: string;
  messages: TicketMessage[];
}

const DEFAULT_TICKETS: TicketItem[] = [
  {
    id: "TCK-4819",
    user: "آرمان رحیمی",
    email: "arman@example.com",
    subject: "درخواست اضافه شدن پچ فارسی بازی Horizon Forbidden West",
    department: "بخش بازی‌ها و دوبله",
    priority: "HIGH",
    status: "ANSWERED",
    createdAt: "۲ روز پیش",
    messages: [
      {
        id: "msg-1",
        sender: "USER",
        senderName: "آرمان رحیمی",
        text: "سلام و وقت بخیر، آیا امکانش هست پچ زیرنویس فارسی نسخه کامل Horizon Forbidden West رو هم به لیست دانلود اضافه کنید؟ با تشکر.",
        timestamp: "۲ روز پیش - ۱۴:۳۰",
      },
      {
        id: "msg-2",
        sender: "ADMIN",
        senderName: "پشتیبانی فنی دکتر گیم",
        text: "سلام آرمان عزیز، فایل زیرنویس فارسی اختصاصی و تست‌شده نسخه ۱.۰۴ به باکس دانلود ۵‌گانه بازی هورایزن اضافه گردید. می‌توانید هم‌اکنون از صفحه بازی بخش فایل ۲ آن را دریافت کنید.",
        timestamp: "۲ روز پیش - ۱۶:۴۵",
      },
    ],
  },
  {
    id: "TCK-4820",
    user: "رضا محمدی",
    email: "reza.m@gmail.com",
    subject: "مشکل در سرعت دانلود فایل دیتای اصلی اسپایدرمن ۲",
    department: "پشتیبانی سرور و شبکه",
    priority: "URGENT",
    status: "OPEN",
    createdAt: "۳ ساعت پیش",
    messages: [
      {
        id: "msg-3",
        sender: "USER",
        senderName: "رضا محمدی",
        text: "درود، هنگام دانلود دیتای اصلی اسپایدرمن روی کنسول با DNS دکتر گیم سرعت روی ۲ مگابایت محدود شده. اشتراک VIP طلایی دارم. ممنون میشم بررسی کنید.",
        timestamp: "۳ ساعت پیش - ۱۰:۱۵",
      },
    ],
  },
  {
    id: "TCK-4821",
    user: "سارا کیانی",
    email: "sara.kiani@yahoo.com",
    subject: "راهنمایی در مورد جیلبریک PS5 فریمور ۴.۰۳",
    department: "مرکز جیلبریک و ابزارها",
    priority: "NORMAL",
    status: "OPEN",
    createdAt: "دیروز",
    messages: [
      {
        id: "msg-4",
        sender: "USER",
        senderName: "سارا کیانی",
        text: "سلام، کنسول من روی نسخه فریمور ۴.۰۳ هست. آیا صفحه جیلبریک جدید سایت برای این فریمور پایدار هست؟",
        timestamp: "دیروز - ۱۸:۰۰",
      },
    ],
  },
];

const STORAGE_KEY = "drgame_admin_tickets";

export const AdminTicketsManager: React.FC = () => {
  const { n } = useApp();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setTickets(JSON.parse(saved));
      } else {
        setTickets(DEFAULT_TICKETS);
      }
    } catch {
      setTickets(DEFAULT_TICKETS);
    }
  }, []);

  const saveTickets = (updated: TicketItem[]) => {
    setTickets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenConversation = (ticket: TicketItem) => {
    setActiveTicket(ticket);
    setReplyText("");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      sender: "ADMIN",
      senderName: "پشتیبانی دکتر گیم (مدیریت سیستم)",
      text: replyText.trim(),
      timestamp: "هم‌اکنون",
    };

    const updatedTicket: TicketItem = {
      ...activeTicket,
      status: "ANSWERED",
      messages: [...activeTicket.messages, newMsg],
    };

    const updatedTickets = tickets.map((t) =>
      t.id === activeTicket.id ? updatedTicket : t
    );

    saveTickets(updatedTickets);
    setActiveTicket(updatedTicket);
    setReplyText("");
    setFeedback("پاسخ شما با موفقیت به تیکت اضافه و وضعیت به «پاسخ داده شده» تغییر یافت.");
    setTimeout(() => setFeedback(""), 4000);
  };

  const handleCloseTicket = (ticketId: string) => {
    const updated = tickets.map((t) =>
      t.id === ticketId ? { ...t, status: "CLOSED" as const } : t
    );
    saveTickets(updated);
    if (activeTicket?.id === ticketId) {
      setActiveTicket({ ...activeTicket, status: "CLOSED" });
    }
    setFeedback("تیکت با موفقیت بسته شد.");
    setTimeout(() => setFeedback(""), 3000);
  };

  const filtered = tickets.filter((t) => {
    return (
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-purple-400" />
            <span>مدیریت تیکت‌های پشتیبانی و گفتگو با کاربران (Support Tickets)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده جزئیات کامل پیام‌ها، پاسخگویی بلادرنگ و ادامه گفتگو در تیکت‌های ارسالی
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 font-mono text-xs font-bold border border-purple-500/20">
          تیکت‌های در انتظار: {n(tickets.filter((t) => t.status === "OPEN").length)}
        </span>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="جستجو بر اساس عنوان تیکت، شماره، کاربر یا دپارتمان..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Tickets List */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#151722] text-slate-300 border-b border-white/10 font-bold">
            <tr>
              <th className="p-3.5">شناسه و عنوان تیکت</th>
              <th className="p-3.5">کاربر ارائه‌دهنده</th>
              <th className="p-3.5">دپارتمان</th>
              <th className="p-3.5">اولویت</th>
              <th className="p-3.5">وضعیت</th>
              <th className="p-3.5">تاریخ ثبت</th>
              <th className="p-3.5 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5">
                  <span className="font-bold text-white block text-sm">{t.subject}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{t.id}</span>
                </td>
                <td className="p-3.5">
                  <span className="font-bold text-white block">{t.user}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{t.email}</span>
                </td>
                <td className="p-3.5 text-slate-300">{t.department}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === "URGENT"
                        ? "bg-red-500/20 text-red-300"
                        : t.priority === "HIGH"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {t.priority === "URGENT" ? "فوری" : t.priority === "HIGH" ? "بالا" : "عادی"}
                  </span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === "OPEN"
                        ? "bg-amber-500/20 text-amber-300"
                        : t.status === "ANSWERED"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {t.status === "OPEN" ? "در انتظار پاسخ" : t.status === "ANSWERED" ? "پاسخ داده شده" : "بسته شده"}
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">{t.createdAt}</td>
                <td className="p-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleOpenConversation(t)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/25 mx-auto"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>مشاهده گفتگو و پاسخ</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Conversation Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/20 bg-[#12141c] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#151722]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-purple-400 text-xs font-bold">{activeTicket.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      activeTicket.status === "OPEN"
                        ? "bg-amber-500/20 text-amber-300"
                        : activeTicket.status === "ANSWERED"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {activeTicket.status === "OPEN"
                      ? "در انتظار پاسخ"
                      : activeTicket.status === "ANSWERED"
                      ? "پاسخ داده شده"
                      : "بسته شده"}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-white mt-1">{activeTicket.subject}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  کاربر: {activeTicket.user} ({activeTicket.email}) · دپارتمان: {activeTicket.department}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTicket.status !== "CLOSED" && (
                  <button
                    type="button"
                    onClick={() => handleCloseTicket(activeTicket.id)}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 text-xs font-bold transition-colors"
                  >
                    بستن تیکت
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[50vh]">
              {activeTicket.messages.map((msg) => {
                const isAdmin = msg.sender === "ADMIN";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                        {isAdmin ? (
                          <Shield className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        <span>{msg.senderName}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-lg ${
                        isAdmin
                          ? "bg-purple-950/40 border border-purple-500/30 text-purple-100"
                          : "bg-white/5 border border-white/10 text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Area (Continue Conversation) */}
            <div className="p-4 border-t border-white/10 bg-[#151722] space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400">پاسخ‌های سریع:</span>
                {[
                  "در حال بررسی و تست پچ روی سرور هستیم.",
                  "فایل مورد نظر به باکس ۵ گانه اضافه گردید.",
                  "سهمیه ترافیک دانلود شما هدیه شارژ شد.",
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setReplyText((prev) => (prev ? prev + " " + txt : txt))}
                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-medium"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="flex gap-3">
                <textarea
                  rows={3}
                  required
                  placeholder="پاسخ خود را برای کاربر بنویسید..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 rounded-xl bg-[#070709] border border-white/10 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  type="submit"
                  className="px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-purple-600/30 transition-all shrink-0 hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال پاسخ</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
