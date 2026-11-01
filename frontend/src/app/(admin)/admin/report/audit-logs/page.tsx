"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, Search, Filter, Eye, Clock, Terminal } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

interface AuditLogItem {
  id: number;
  department: string;
  admin_id: number;
  admin_username: string;
  action: string;
  target_entity?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
  created_at: string;
}

export default function ReportAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      let endpoint = `/admin-report/audit-logs?page=1&limit=50`;
      if (departmentFilter !== "all") {
        endpoint += `&department=${departmentFilter}`;
      }
      if (search) {
        endpoint += `&admin_username=${encodeURIComponent(search)}`;
      }
      const res = await apiRequest<any>(endpoint);
      setLogs(Array.isArray(res) ? res : res?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت لاگ‌های امنیتی");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [departmentFilter, search]);

  const departmentBadges: Record<string, string> = {
    content: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    finance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    support: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    report: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    referral: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-400" />
          لاگ‌های امنیتی و نظارتی ادمین‌ها (Admin Audit Logs)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          ردیابی تغییرات، لاگین‌ها و عملیات ایجاد/ویرایش/حذف پرسنل در کلیه دپارتمان‌ها
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام کاربری ادمین..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">همه دپارتمان‌ها</option>
            <option value="content">دپارتمان محتوا (Content)</option>
            <option value="finance">دپارتمان مالی (Finance)</option>
            <option value="support">دپارتمان پشتیبانی (Support)</option>
            <option value="report">دپارتمان گزارش‌گیری (Report)</option>
            <option value="referral">دپارتمان رفرال (Referral)</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">شناسه</th>
              <th className="py-3.5 px-4">دپارتمان</th>
              <th className="py-3.5 px-4">ادمین</th>
              <th className="py-3.5 px-4">عملیات (Action)</th>
              <th className="py-3.5 px-4">موجودیت هدف</th>
              <th className="py-3.5 px-4">آی‌پی</th>
              <th className="py-3.5 px-4">زمان ثبت</th>
              <th className="py-3.5 px-4 text-center">جزییات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">در حال دریافت لاگ‌ها...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">هیچ لاگی یافت نشد.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{log.id}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                      departmentBadges[log.department] || "bg-slate-800 text-slate-300"
                    }`}>
                      {log.department}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-purple-300">
                    @{log.admin_username}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-white">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.target_entity || "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {log.ip_address || "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {log.created_at ? new Date(log.created_at).toLocaleString("fa-IR") : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors"
                      title="مشاهده پی‌لود کامل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                جزییات لاگ امنیتی #{selectedLog.id}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${departmentBadges[selectedLog.department]}`}>
                {selectedLog.department}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>ادمین مجری:</span>
                <span className="font-mono text-white font-bold">@{selectedLog.admin_username} (ID: {selectedLog.admin_id})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>عنوان عملیات:</span>
                <span className="font-mono text-white">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>موجودیت هدف:</span>
                <span className="text-white">{selectedLog.target_entity || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>آی‌پی درخواست:</span>
                <span className="font-mono text-white">{selectedLog.ip_address || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>User Agent:</span>
                <span className="font-mono text-slate-300 text-[10px] truncate max-w-[280px]">
                  {selectedLog.user_agent || "—"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                پی‌لود و داده‌های تغییر یافته (JSON):
              </label>
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-white"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
