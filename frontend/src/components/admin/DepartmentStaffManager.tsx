"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Pencil,
  Eye,
  KeyRound,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentType } from "@/lib/authTokens";
import { DepartmentAccentColor, DepartmentAdminProfile } from "./DepartmentLayout";

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

const STAFF_ACCENTS: Record<
  DepartmentAccentColor,
  { iconText: string; primaryBtn: string; usernameText: string; focusBorder: string }
> = {
  purple: {
    iconText: "text-purple-400",
    primaryBtn: "bg-purple-600 hover:bg-purple-500 shadow-purple-950/40",
    usernameText: "text-purple-300",
    focusBorder: "focus:border-purple-500",
  },
  rose: {
    iconText: "text-rose-400",
    primaryBtn: "bg-rose-600 hover:bg-rose-500 shadow-rose-950/40",
    usernameText: "text-rose-300",
    focusBorder: "focus:border-rose-500",
  },
  emerald: {
    iconText: "text-emerald-400",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/40",
    usernameText: "text-emerald-300",
    focusBorder: "focus:border-emerald-500",
  },
  blue: {
    iconText: "text-blue-400",
    primaryBtn: "bg-blue-600 hover:bg-blue-500 shadow-blue-950/40",
    usernameText: "text-blue-300",
    focusBorder: "focus:border-blue-500",
  },
  amber: {
    iconText: "text-amber-400",
    primaryBtn: "bg-amber-600 hover:bg-amber-500 shadow-amber-950/40",
    usernameText: "text-amber-300",
    focusBorder: "focus:border-amber-500",
  },
  cyan: {
    iconText: "text-cyan-400",
    primaryBtn: "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/40",
    usernameText: "text-cyan-300",
    focusBorder: "focus:border-cyan-500",
  },
};

interface DepartmentStaffManagerProps {
  department: DepartmentType;
  departmentNameFa: string;
  accentColor?: DepartmentAccentColor;
}

export default function DepartmentStaffManager({
  department,
  departmentNameFa,
  accentColor = "purple",
}: DepartmentStaffManagerProps) {
  const theme = STAFF_ACCENTS[accentColor] || STAFF_ACCENTS.purple;
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
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

  const [editForm, setEditForm] = useState({
    full_name: "",
    mobile: "",
    password: "",
    access_level: "read_only" as "read_only" | "full_crud",
    is_active: true,
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

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditForm({
      full_name: staff.full_name || "",
      mobile: staff.mobile || "",
      password: "",
      access_level: staff.access_level,
      is_active: staff.is_active,
    });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        full_name: editForm.full_name,
        mobile: editForm.mobile || null,
        access_level: editForm.access_level,
        is_active: editForm.is_active,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }
      await apiRequest(`/admin-${department}/staff/${editingStaff.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setSuccessMsg("مشخصات و سطح دسترسی پرسنل به‌روزرسانی شد");
      setEditingStaff(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ویرایش پرسنل");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!deleteTarget) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      await apiRequest(`/admin-${department}/staff/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setSuccessMsg("پرسنل با موفقیت حذف شد");
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف پرسنل");
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = currentUser?.access_level === "read_only";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className={`w-6 h-6 ${theme.iconText}`} />
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
              : `${theme.primaryBtn} text-white shadow-lg`
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
                    <td className={`py-3.5 px-4 font-mono ${theme.usernameText}`} dir="ltr">@{staff.username}</td>
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
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          disabled={isReadOnly}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
                          }`}
                          title="ویرایش پرسنل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(staff)}
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
                      </div>
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
              <UserPlus className={`w-5 h-5 ${theme.iconText}`} />
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
                  className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder}`}
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
                  className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder} font-mono text-left`}
                  placeholder="ali_staff"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">رمز عبور اولیه</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder} font-mono text-left`}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ایمیل (اختیاری)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder} text-left font-mono`}
                    placeholder="user@example.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">شماره تماس (اختیاری)</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder} text-left font-mono`}
                    placeholder="0912..."
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">سطح دسترسی</label>
                <select
                  value={form.access_level}
                  onChange={(e) => setForm({ ...form, access_level: e.target.value as any })}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder}`}
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${theme.primaryBtn} text-white shadow-lg transition-all`}
                >
                  {submitting ? "در حال ثبت..." : "ثبت پرسنل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Pencil className={`w-4 h-4 ${theme.iconText}`} />
              ویرایش اطلاعات و دسترسی همکار
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono" dir="ltr">@{editingStaff.username}</p>

            <form onSubmit={handleUpdateStaff} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">شماره تماس</label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder} text-left font-mono`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">رمز عبور جدید (اختیاری)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="بدون تغییر خالی بگذارید"
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">سطح دسترسی</label>
                  <select
                    value={editForm.access_level}
                    onChange={(e) => setEditForm({ ...editForm, access_level: e.target.value as any })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder}`}
                  >
                    <option value="read_only">فقط مشاهده (Read-Only)</option>
                    <option value="full_crud">دسترسی کامل (Full-CRUD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">وضعیت حساب</label>
                  <select
                    value={editForm.is_active ? "active" : "inactive"}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
                    className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${theme.focusBorder}`}
                  >
                    <option value="active">فعال</option>
                    <option value="inactive">غیرفعال (مسدود)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold ${theme.primaryBtn} text-white shadow-lg transition-all`}
                >
                  {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              تایید حذف پرسنل
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              آیا از حذف حساب کاربری <strong className="text-white">{deleteTarget.full_name || deleteTarget.username}</strong> (<span className="font-mono" dir="ltr">@{deleteTarget.username}</span>) از این دپارتمان اطمینان دارید؟
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmDeleteStaff}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                {submitting ? "در حال حذف..." : "بله، حذف شود"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
