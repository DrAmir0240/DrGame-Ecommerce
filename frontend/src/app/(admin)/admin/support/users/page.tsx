"use client";

import React, { useEffect, useState } from "react";
import { Users, Search, Ban, CheckCircle, Database } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function SupportUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [search, setSearch] = useState("");
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newQuotaGb, setNewQuotaGb] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, usersRes] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-support/auth/me"),
        apiRequest<any>(`/admin-support/users?page=1&limit=50&search=${encodeURIComponent(search)}`),
      ]);
      setCurrentUser(profile);
      setUsers(Array.isArray(usersRes) ? usersRes : usersRes?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleToggleStatus = async (user: any) => {
    if (isReadOnly) return;
    const nextStatus = !user.is_active;
    try {
      await apiRequest(`/admin-support/users/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setSuccessMsg(`وضعیت کاربر #${user.id} به ${nextStatus ? "فعال" : "مسدود"} تغییر یافت`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در تغییر وضعیت کاربر");
    }
  };

  const handleAdjustQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !selectedUserId) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await apiRequest(`/admin-support/users/${selectedUserId}/adjust-quota`, {
        method: "PUT",
        body: JSON.stringify({ additional_gb: Number(newQuotaGb) }),
      });
      setSuccessMsg(`سهمیه حجم با موفقیت اعمال گردید`);
      setQuotaModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در تنظیم حجم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            مدیریت کاربران و سهمیه‌های دانلود
          </h1>
          <p className="text-xs text-slate-400 mt-1">مشاهده مشخصات کاربران، وضعیت فعال/مسدود و شارژ حجم اضافه</p>
        </div>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): شما صرفاً اجازه مشاهده مشخصات کاربران را دارید.
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

      {/* Search */}
      <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی نام، نام کاربری یا شماره موبایل کاربر..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه</th>
              <th className="py-3 px-4">نام کامل</th>
              <th className="py-3 px-4">نام کاربری</th>
              <th className="py-3 px-4">شماره موبایل</th>
              <th className="py-3 px-4">وضعیت</th>
              <th className="py-3 px-4">تاریخ عضویت</th>
              <th className="py-3 px-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">در حال دریافت کاربران...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">کاربری یافت نشد.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{u.id}</td>
                  <td className="py-3 px-4 font-medium text-white">{u.full_name || "—"}</td>
                  <td className="py-3 px-4 font-mono text-blue-300">@{u.username || "—"}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{u.phone || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      u.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}>
                      {u.is_active ? "فعال" : "مسدود"}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("fa-IR") : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setQuotaModalOpen(true);
                        }}
                        disabled={isReadOnly}
                        className={`p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 ${
                          isReadOnly ? "text-slate-600 cursor-not-allowed" : ""
                        }`}
                        title="شارژ حجم دانلود"
                      >
                        <Database className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isReadOnly}
                        className={`p-1.5 rounded-lg ${
                          isReadOnly
                            ? "text-slate-600 cursor-not-allowed"
                            : u.is_active
                            ? "text-rose-400 hover:bg-rose-500/10"
                            : "text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                        title={u.is_active ? "مسدودسازی" : "فعال‌سازی"}
                      >
                        {u.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {quotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">شارژ سهمیه حجم کاربر #{selectedUserId}</h3>
            <form onSubmit={handleAdjustQuota} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">حجم اضافه (گیگابایت)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={newQuotaGb}
                  onChange={(e) => setNewQuotaGb(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  placeholder="50"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuotaModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {submitting ? "در حال ثبت..." : "افزودن حجم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
