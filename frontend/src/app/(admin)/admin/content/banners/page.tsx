"use client";

import React, { useEffect, useState } from "react";
import { Sliders, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function ContentBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    title_fa: "",
    title_en: "",
    badge: "ویژه",
    backdrop_url: "",
    link_href: "/games",
    cta_text: "مشاهده بازی",
    position: 1,
    display_order: 1,
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, bannerList] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-content/auth/me"),
        apiRequest<any[]>("/admin-content/banners"),
      ]);
      setCurrentUser(profile);
      setBanners(bannerList || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در بارگذاری بنرها");
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
      await apiRequest("/admin-content/banners", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ثبت بنر");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if (!confirm("آیا از حذف این بنر اطمینان دارید؟")) return;
    try {
      await apiRequest(`/admin-content/banners/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف بنر");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-400" />
            بنرهای هیرو اسلایدر صفحه اصلی
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت بنرهای برجسته بالای صفحه اصلی و لینک‌های هدایت</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
            isReadOnly ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          <Plus className="w-4 h-4" />
          افزودن بنر جدید
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): مجاز به تغییر بنرها نیستید.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500">در حال دریافت...</div>
        ) : banners.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500">هیچ بنری ثبت نشده است.</div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden group">
              <div className="h-36 bg-slate-900 relative">
                {b.backdrop_url ? (
                  <img src={b.backdrop_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">🎨</div>
                )}
                {b.badge && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-900">
                    {b.badge}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-sm text-white">{b.title_fa}</h4>
                <p className="text-[11px] text-slate-400 font-mono truncate">{b.link_href}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500">ترتیب: {b.display_order}</span>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={isReadOnly}
                    className={`p-1.5 rounded-lg ${isReadOnly ? "text-slate-600" : "text-rose-400 hover:bg-rose-500/10"}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">افزودن بنر جدید</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">عنوان بنر</label>
                <input
                  type="text"
                  required
                  value={form.title_fa}
                  onChange={(e) => setForm({ ...form, title_fa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">برچسب / بج (اختیاری)</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">آدرس تصویر پس‌زمینه (URL)</label>
                <input
                  type="url"
                  required
                  value={form.backdrop_url}
                  onChange={(e) => setForm({ ...form, backdrop_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">لینک هدایت</label>
                <input
                  type="text"
                  required
                  value={form.link_href}
                  onChange={(e) => setForm({ ...form, link_href: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
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
                  {submitting ? "ثبت..." : "افزودن بنر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
