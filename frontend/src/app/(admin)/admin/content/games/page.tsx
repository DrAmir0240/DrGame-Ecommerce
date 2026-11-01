"use client";

import React, { useEffect, useState } from "react";
import {
  Grid,
  Search,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Star,
  Upload,
  Layers,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import { apiRequest, ApiError } from "@/lib/apiClient";
import { getDepartmentAdminToken } from "@/lib/authTokens";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

export default function ContentGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    title_fa: "",
    title_en: "",
    slug: "",
    description_fa: "",
    rating: 0,
    metacritic: 0,
    download_size_gb: 0,
    is_two_player: false,
    has_vr: false,
    publisher: "",
    developer: "",
    cover_image_url: "",
    banner_image_url: "",
    is_active: true,
  });

  const loadProfile = async () => {
    try {
      const p = await apiRequest<DepartmentAdminProfile>("/admin-content/auth/me");
      setCurrentUser(p);
    } catch {
      // ignore
    }
  };

  const loadGames = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiRequest<any[]>(`/admin-content/games?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      setGames(Array.isArray(res) ? res : (res as any)?.items || []);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در بارگذاری بازی‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadGames();
  }, [page, search]);

  const isReadOnly = currentUser?.access_level === "read_only";

  const handleOpenCreate = () => {
    setEditingGame(null);
    setForm({
      title_fa: "",
      title_en: "",
      slug: "",
      description_fa: "",
      rating: 0,
      metacritic: 0,
      download_size_gb: 0,
      is_two_player: false,
      has_vr: false,
      publisher: "",
      developer: "",
      cover_image_url: "",
      banner_image_url: "",
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (g: any) => {
    setEditingGame(g);
    setForm({
      title_fa: g.title_fa || "",
      title_en: g.title_en || "",
      slug: g.slug || "",
      description_fa: g.description_fa || "",
      rating: g.rating || 0,
      metacritic: g.metacritic || 0,
      download_size_gb: g.download_size_gb || 0,
      is_two_player: !!g.is_two_player,
      has_vr: !!g.has_vr,
      publisher: g.publisher || "",
      developer: g.developer || "",
      cover_image_url: g.cover_image_url || "",
      banner_image_url: g.banner_image_url || "",
      is_active: g.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (editingGame) {
        await apiRequest(`/admin-content/games/${editingGame.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setSuccessMsg("بازی با موفقیت بروزرسانی شد");
      } else {
        await apiRequest(`/admin-content/games`, {
          method: "POST",
          body: JSON.stringify(form),
        });
        setSuccessMsg("بازی جدید با موفقیت اضافه شد");
      }
      setModalOpen(false);
      await loadGames();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ذخیره‌سازی اطلاعات بازی");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (isReadOnly) return;
    if (!confirm("آیا از حذف این بازی اطمینان دارید؟")) return;

    try {
      await apiRequest(`/admin-content/games/${id}`, {
        method: "DELETE",
      });
      setSuccessMsg("بازی با موفقیت حذف گردید");
      await loadGames();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف بازی");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Grid className="w-6 h-6 text-emerald-400" />
            کاتالوگ بازی‌ها و پارت‌های دانلود
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده، افزودن، ویرایش و پیوند دادن لینک‌های دانلود به بازی‌ها
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            isReadOnly
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40"
          }`}
          title={isReadOnly ? "سطح دسترسی شما فقط مشاهده است" : "افزودن بازی"}
        >
          <Plus className="w-4 h-4" />
          افزودن بازی جدید
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          شما در حالت <strong>فقط خواندنی (Read-Only)</strong> قرار دارید. امکان درج، ویرایش یا حذف بازی وجود ندارد.
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

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c1017] border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی نام بازی به فارسی یا انگلیسی..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0c1017] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121824] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">شناسه</th>
                <th className="py-3 px-4">کاور</th>
                <th className="py-3 px-4">عنوان بازی</th>
                <th className="py-3 px-4">حجم (GB)</th>
                <th className="py-3 px-4">امتیاز / متا</th>
                <th className="py-3 px-4">وضعیت</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    در حال بارگذاری لیست بازی‌ها...
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    هیچ بازی‌ای یافت نشد.
                  </td>
                </tr>
              ) : (
                games.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">#{g.id}</td>
                    <td className="py-3 px-4">
                      {g.cover_image_url ? (
                        <img
                          src={g.cover_image_url}
                          alt={g.title_fa}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600">
                          🎮
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{g.title_fa}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{g.title_en || g.slug}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{g.download_size_gb || 0} GB</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      ★ {g.rating || 0} / Meta {g.metacritic || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        g.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {g.is_active ? "فعال" : "مخفی"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          disabled={isReadOnly}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly ? "text-slate-600 cursor-not-allowed" : "text-amber-400 hover:bg-amber-500/10"
                          }`}
                          title="ویرایش"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          disabled={isReadOnly}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly ? "text-slate-600 cursor-not-allowed" : "text-rose-400 hover:bg-rose-500/10"
                          }`}
                          title="حذف"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0c1017] border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-4">
              {editingGame ? "ویرایش بازی" : "افزودن بازی جدید"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">عنوان فارسی</label>
                  <input
                    type="text"
                    required
                    value={form.title_fa}
                    onChange={(e) => setForm({ ...form, title_fa: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">عنوان انگلیسی</label>
                  <input
                    type="text"
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">اسلاگ یکتا (URL Slug)</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="god-of-war-ragnarok"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">توضیحات فارسی</label>
                <textarea
                  rows={3}
                  value={form.description_fa}
                  onChange={(e) => setForm({ ...form, description_fa: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">حجم کل (GB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.download_size_gb}
                    onChange={(e) => setForm({ ...form, download_size_gb: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">امتیاز (۰ تا ۵)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">متاکریتیک</label>
                  <input
                    type="number"
                    value={form.metacritic}
                    onChange={(e) => setForm({ ...form, metacritic: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">آدرس کاور تصویر</label>
                <input
                  type="url"
                  value={form.cover_image_url}
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                  />
                  بازی فعال و قابل نمایش باشد
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_two_player}
                    onChange={(e) => setForm({ ...form, is_two_player: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                  />
                  دونفره
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_vr}
                    onChange={(e) => setForm({ ...form, has_vr: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                  />
                  پشتیبانی از VR
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {submitting ? "در حال ثبت..." : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
