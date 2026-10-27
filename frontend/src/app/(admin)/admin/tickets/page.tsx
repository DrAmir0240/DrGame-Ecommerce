"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle,
  X,
  Clock,
  User,
  Filter,
} from "lucide-react";

interface Ticket {
  id: number;
  user_name: string;
  user_phone: string;
  subject: string;
  department: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  messages: Array<{
    id: number;
    sender: "user" | "admin";
    text: string;
    created_at: string;
  }>;
}

const mockTickets: Ticket[] = [
  {
    id: 101,
    user_name: "محمد امینی",
    user_phone: "09121112233",
    subject: "راهنمایی جیلبریک نسخه ۱۱.۰۰ در کنسول PS4",
    department: "پشتیبانی فنی کنسول",
    status: "open",
    created_at: "۱۴۰۳/۰۸/۰۴",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "سلام خسته نباشید، من پیلود گلدهن رو روی نسخه ۱۱ اجرا کردم ولی ارور پی پی پی او ای میده، ممکنه راهنمایی بفرمایید؟",
        created_at: "۱۰:۴۵",
      },
    ],
  },
  {
    id: 102,
    user_name: "سامان ابراهیمی",
    user_phone: "09355556677",
    subject: "عدم کسر حجم در دانلود دیتای بازی خدای جنگ",
    department: "امور حسابداری و سهمیه",
    status: "answered",
    created_at: "۱۴۰۳/۰۸/۰۳",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "سلام، من پلن پرو خریدم اما بعد از دانلود پارت اول ترافیکم کسر نشده هنوز.",
        created_at: "۱۴:۲۰",
      },
      {
        id: 2,
        sender: "admin",
        text: "درود بر شما، لاگ‌های دانلود هر ۵ دقیقه یکبار به صورت تجمیعی سینک می‌شوند و جای نگرانی نیست.",
        created_at: "۱۴:۳۵",
      },
    ],
  },
  {
    id: 103,
    user_name: "پریسا راد",
    user_phone: "09198889900",
    subject: "سوال در خصوص تسویه حساب پورسانت رفرال",
    department: "مالی و رفرال",
    status: "closed",
    created_at: "۱۴۰۳/۰۸/۰۱",
    messages: [
      {
        id: 1,
        sender: "user",
        text: "آیا واریز تتر پورسانت‌ها کارمزد شبکه دارد؟",
        created_at: "۰۹:۱۵",
      },
      {
        id: 2,
        sender: "admin",
        text: "سلام، کارمزد انتقال شبکه ترون توسط سامانه پوشش داده می‌شود و مبلغ خالص به ولت شما می‌نشیند.",
        created_at: "۰۹:۳۰",
      },
    ],
  },
];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMsg = {
      id: Date.now(),
      sender: "admin" as const,
      text: replyText.trim(),
      created_at: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = {
      ...selectedTicket,
      status: "answered" as const,
      messages: [...selectedTicket.messages, newMsg],
    };

    setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setSelectedTicket(updated);
    setReplyText("");
  };

  const handleCloseTicket = (ticketId: number) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "closed" as const } : t))
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "closed" as const } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">
            سامانه مدیریت و پاسخ‌گویی به تیکت‌های پشتیبانی
          </h1>
          <p className="text-xs text-slate-400">
            بررسی پرسش‌های فنی، حسابداری و پیگیری کاربران به صورت چت تعاملی دوطرفه
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121721] rounded-2xl border border-slate-800 self-start sm:self-auto">
          {[
            { label: "همه تیکت‌ها", val: "all" },
            { label: "در انتظار پاسخ", val: "open" },
            { label: "پاسخ داده شده", val: "answered" },
            { label: "بسته شده", val: "closed" },
          ].map((f) => (
            <button
              key={f.val}
              onClick={() => setFilterStatus(f.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === f.val
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">شناسه</th>
                <th className="py-3.5 px-4 font-semibold">کاربر</th>
                <th className="py-3.5 px-4 font-semibold">موضوع تیکت</th>
                <th className="py-3.5 px-4 font-semibold">دپارتمان</th>
                <th className="py-3.5 px-4 font-semibold">تاریخ</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/20">
                  <td className="py-3.5 px-4 font-mono text-slate-400">#{t.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{t.user_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                      {t.user_phone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200">{t.subject}</td>
                  <td className="py-3.5 px-4 text-slate-400">{t.department}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400" dir="ltr">
                    {t.created_at}
                  </td>
                  <td className="py-3.5 px-4">
                    {t.status === "open" ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                        در انتظار پاسخ
                      </span>
                    ) : t.status === "answered" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        پاسخ داده شد
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        بسته شده
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedTicket(t)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 font-semibold text-[11px] flex items-center gap-1 mx-auto transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>مشاهده گفتگو</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two-Way Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-purple-400">#{selectedTicket.id}</span>
                  <h2 className="text-sm font-bold text-white">{selectedTicket.subject}</h2>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ارسال شده توسط {selectedTicket.user_name} ({selectedTicket.user_phone})
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== "closed" && (
                  <button
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    بستن تیکت
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80">
              {selectedTicket.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === "admin" ? "items-start" : "items-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                      m.sender === "admin"
                        ? "bg-purple-950/40 border border-purple-500/30 text-purple-100"
                        : "bg-slate-900 border border-slate-800 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">
                        {m.sender === "admin" ? "پاسخ پشتیبانی دکتر گیم" : selectedTicket.user_name}
                      </span>
                      <span className="font-mono">{m.created_at}</span>
                    </div>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            {selectedTicket.status !== "closed" ? (
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
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-950/40"
                >
                  <Send className="w-3.5 h-3.5" />
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
