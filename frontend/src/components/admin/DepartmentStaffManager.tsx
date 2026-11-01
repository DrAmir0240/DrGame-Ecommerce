"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Eye,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentType } from "@/lib/authTokens";
import { DepartmentAdminProfile } from "./DepartmentLayout";

interface StaffMember {
  id: number;
  username: string;
  email?: string;
  mobile?: string;
  full_name?: string;
  access_level: "read_only" | "full_crud";
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

interface DepartmentStaffManagerProps {
  department: DepartmentType;
  departmentNameFa: string;
}

export default function DepartmentStaffManager({
  department,
  departmentNameFa,
}: DepartmentStaffManagerProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    mobile: "",
    access_level: "read_only" as "read_only" | "full_crud",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, staffRes] = await Promise.all([
        apiRequest<DepartmentAdminProfile>(`/admin-${department}/auth/me`),
        apiRequest<StaffMember[]>(`/admin-${department}/staff`),
      ]);
      setCurrentUser(profileRes);
      setStaffList(staffRes);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در بارگذاری پرسنل دپارتمان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [department]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      await apiRequest(`/admin-${department}/staff`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSuccessMsg("پرسنل جدید با موفقیت ایجاد شد");
      setModalOpen(false);
      setForm({
        username: "",
        password: "",
        full_name: "",
        email: "",
        mobile: "",
        access_level: "read_only",
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ایجاد پرسنل");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("آیا از حذف این پرسنل اطمینان دارید؟")) return;
    setErrorMsg("");
    try {
      await apiRequest(`/admin-${department}/staff/${id}`, {
        method: "DELETE",
      });
      setSuccessMsg("پرسنل با موفقیت حذف شد");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف پرسنل");
    }
  };

  const isReadOnly = currentUser?.access_level === "read_only";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            مدیریت پرسنل {departmentNameFa}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            تعریف حساب‌های کاربری اختصاصی برای این دپارتمان با سطوح دسترسی تفکیک‌شده
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            isReadOnly
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40"
          }`}
          title={isReadOnly ? "دسترسی شما فقط خواندنی است" : "افزودن همکار جدید"}
        >
          <UserPlus className="w-4 h-4" />
          افزودن پرسنل جدید
        </button>
      </div>

      {isReadOnly && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>حساب شما دارای سطح دسترسی <strong>فقط خواندنی (Read-Only)</strong> است. دکمه‌های ایجاد یا حذف پرسنل غیرفعال هستند.</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">شناسه</th>
                <th className="py-3.5 px-4 font-semibold">نام و نام خانوادگی</th>
                <th className="py-3.5 px-4 font-semibold">نام کاربری</th>
                <th className="py-3.5 px-4 font-semibold">ایمیل / موبایل</th>
                <th className="py-3.5 px-4 font-semibold">سطح دسترسی</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                <th className="py-3.5 px-4 font-semibold">تاریخ ایجاد</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    در حال بارگذاری لیست پرسنل...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    هیچ عضوی در این دپارتمان ثبت نشده است.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">#{staff.id}</td>
                    <td className="py-3.5 px-4 font-medium text-white">{staff.full_name || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-purple-300">@{staff.username}</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{staff.email || "—"}</div>
                      <div className="text-[11px] text-slate-500">{staff.mobile || ""}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {staff.access_level === "full_crud" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <KeyRound className="w-3 h-3" />
                          دسترسی کامل (CRUD)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Eye className="w-3 h-3" />
                          فقط مشاهده
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        staff.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {staff.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {staff.created_at ? new Date(staff.created_at).toLocaleDateString("fa-IR") : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        disabled={isReadOnly || staff.id === currentUser?.id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isReadOnly || staff.id === currentUser?.id
                            ? "text-slate-600 cursor-not-allowed"
                            : "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        }`}
                        title="حذف پرسنل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              افزودن پرسنل دپارتمان {departmentNameFa}
            </h3>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="علی محمدی"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">نام کاربری (یکتا)</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-left"
                  placeholder="ali_content"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رمز عبور اولیه</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono text-left"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ایمیل (اختیاری)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 text-left font-mono"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">شماره تماس (اختیاری)</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 text-left font-mono"
                    placeholder="0912..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">سطح دسترسی</label>
                <select
                  value={form.access_level}
                  onChange={(e) => setForm({ ...form, access_level: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="read_only">فقط مشاهده (Read-Only) — بدون اجازه تغییر</option>
                  <option value="full_crud">دسترسی کامل (Full-CRUD) — ایجاد، ویرایش، حذف</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all"
                >
                  {submitting ? "در حال ثبت..." : "ثبت پرسنل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
