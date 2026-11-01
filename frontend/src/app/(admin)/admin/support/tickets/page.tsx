"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, ticketsRes] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-support/auth/me"),
        apiRequest<any>("/admin-support/tickets?page=1&limit=50"),
      ]);
      setCurrentUser(profile);
      setTickets(Array.isArray(ticketsRes) ? ticketsRes : ticketsRes?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleOpenTicket = async (t: any) => {
    try {
      const full = await apiRequest(`/admin-support/tickets/${t.id}`);
      setSelectedTicket(full);
    } catch {
      setSelectedTicket(t);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !selectedTicket) return;
    setSubmittingReply(true);
    setErrorMsg("");
    try {
      await apiRequest(`/admin-support/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: replyText }),
      });
      setReplyText("");
      setSuccessMsg("پاسخ شما با موفقیت ارسال شد");
      const full = await apiRequest(`/admin-support/tickets/${selectedTicket.id}`);
      setSelectedTicket(full);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ارسال پاسخ");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          تیکت‌ها و درخواست‌های پشتیبانی
        </h1>
        <p className="text-xs text-slate-400 mt-1">مشاهده و پاسخ‌گویی آنلاین به مشکلات مشترکین</p>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): شما می‌توانید گفتگوها را مشاهده کنید اما ارسال پاسخ مجاز نیست.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-[#0c1017] p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 mb-2">لیست تیکت‌ها</h3>
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">در حال بارگذاری...</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">هیچ تیکتی وجود ندارد.</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => handleOpenTicket(t)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedTicket?.id === t.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white truncate max-w-[150px]">{t.subject}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    t.status === "open" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{t.user_name || `کاربر #${t.user_id}`}</span>
                  <span className="font-mono text-[10px]">
                    {t.created_at ? new Date(t.created_at).toLocaleDateString("fa-IR") : ""}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Conversation Box */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0c1017] flex flex-col justify-between overflow-hidden min-h-[450px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedTicket.subject}</h4>
                  <span className="text-xs text-slate-400">
                    ارسال شده توسط {selectedTicket.user_name || `کاربر #${selectedTicket.user_id}`} • دپارتمان: {selectedTicket.department}
                  </span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  تیکت #{selectedTicket.id}
                </span>
              </div>

              {/* Messages list */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m: any) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl max-w-[80%] text-xs leading-relaxed ${
                        m.sender_type === "admin"
                          ? "mr-auto bg-blue-600/20 border border-blue-500/30 text-blue-100"
                          : "ml-auto bg-slate-900 border border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="font-semibold text-[10px] text-slate-400 mb-1">
                        {m.sender_name || (m.sender_type === "admin" ? "پشتیبان" : "کاربر")}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 text-xs py-12">
                    پیامی در این تیکت ثبت نشده است.
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-800 bg-slate-900/40 flex gap-2">
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isReadOnly ? "دسترسی شما فقط خواندنی است" : "متن پاسخ خود را بنویسید..."}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isReadOnly || submittingReply}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isReadOnly
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                  ارسال
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              یک تیکت را از لیست سمت راست جهت مشاهده گفتگو انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
