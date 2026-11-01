"use client";

import React, { useEffect, useState } from "react";
import { Tags, Plus, Trash2, Edit } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function ContentGenresPage() {
  const [genres, setGenres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [nameFa, setNameFa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, genresList] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-content/auth/me"),
        apiRequest<any[]>("/admin-content/genres"),
      ]);
      setCurrentUser(profile);
      setGenres(genresList || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در بارگذاری ژانرها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await apiRequest("/admin-content/genres", {
        method: "POST",
        body: JSON.stringify({ name_fa: nameFa, name_en: nameEn, slug }),
      });
      setModalOpen(false);
      setNameFa("");
      setNameEn("");
      setSlug("");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ثبت ژانر");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Tags className="w-6 h-6 text-emerald-400" />
            دسته‌بندی‌ها و ژانرهای بازی‌ها
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت ژانرهای اصلی و تگ‌های نمایش داده شده در پلتفرم</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
            isReadOnly
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          <Plus className="w-4 h-4" />
          افزودن ژانر جدید
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): شما مجاز به تغییر ژانرها نیستید.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">در حال دریافت ژانرها...</div>
        ) : genres.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">هیچ ژانری ثبت نشده است.</div>
        ) : (
          genres.map((g) => (
            <div key={g.id} className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-white">{g.name_fa}</div>
                <div className="text-[11px] text-slate-400 font-mono">{g.name_en || g.slug}</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                #{g.id}
              </span>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">افزودن ژانر جدید</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام فارسی</label>
                <input
                  type="text"
                  required
                  value={nameFa}
                  onChange={(e) => setNameFa(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  placeholder="اکشن"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام انگلیسی</label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="Action"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسلاگ یکتا</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="action"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {submitting ? "ثبت..." : "افزودن"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
