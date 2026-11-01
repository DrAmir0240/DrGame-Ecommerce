"use client";

import React, { useEffect, useState } from "react";
import { Newspaper, Plus, Trash2, Edit } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function ContentBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title_fa: "",
    title_en: "",
    slug: "",
    content_fa: "",
    category_id: 1,
    cover_image_url: "",
    author_name: "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, blogsRes] = await Promise.all([
        apiRequest<DepartmentAdminProfile>("/admin-content/auth/me"),
        apiRequest<any[]>("/admin-content/blogs?page=1&limit=50"),
      ]);
      setCurrentUser(profile);
      setBlogs(Array.isArray(blogsRes) ? blogsRes : (blogsRes as any)?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در بارگذاری مقالات");
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
      await apiRequest("/admin-content/blogs", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      setForm({
        title_fa: "",
        title_en: "",
        slug: "",
        content_fa: "",
        category_id: 1,
        cover_image_url: "",
        author_name: "",
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در انتشار مقاله");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if (!confirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    try {
      await apiRequest(`/admin-content/blogs/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف مقاله");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-emerald-400" />
            مقالات و اخبار وبلاگ
          </h1>
          <p className="text-xs text-slate-400 mt-1">مدیریت مطالب، آموزش‌ها و اخبار دنیای بازی</p>
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
          ارسال مقاله جدید
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          حالت فقط خواندنی (Read-Only): اجازه ویرایش یا حذف مقالات را ندارید.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">شناسه</th>
              <th className="py-3 px-4">تصویر</th>
              <th className="py-3 px-4">عنوان مقاله</th>
              <th className="py-3 px-4">نویسنده</th>
              <th className="py-3 px-4">بازدیدها</th>
              <th className="py-3 px-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">در حال بارگذاری...</td>
              </tr>
            ) : blogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">هیچ مقاله‌ای ثبت نشده است.</td>
              </tr>
            ) : (
              blogs.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{b.id}</td>
                  <td className="py-3 px-4">
                    {b.cover_image_url ? (
                      <img src={b.cover_image_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-600">📄</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-white">{b.title_fa}</td>
                  <td className="py-3 px-4 text-slate-400">{b.author_name || "—"}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{b.views_count || 0}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={isReadOnly}
                      className={`p-1.5 rounded-lg ${isReadOnly ? "text-slate-600" : "text-rose-400 hover:bg-rose-500/10"}`}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">ارسال مقاله جدید</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">عنوان مقاله (فارسی)</label>
                <input
                  type="text"
                  required
                  value={form.title_fa}
                  onChange={(e) => setForm({ ...form, title_fa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسلاگ یکتا</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="post-slug-sample"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام نویسنده</label>
                <input
                  type="text"
                  value={form.author_name}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">آدرس تصویر شاخص</label>
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">متن مقاله</label>
                <textarea
                  rows={5}
                  value={form.content_fa}
                  onChange={(e) => setForm({ ...form, content_fa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                  {submitting ? "در حال ثبت..." : "انتشار"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
