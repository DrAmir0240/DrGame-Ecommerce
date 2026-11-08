"use client";

import React, { useEffect, useState, useRef } from "react";
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
  Image as ImageIcon,
  Film,
  Award,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  Gamepad2,
  Eye,
  Calendar,
} from "lucide-react";
import { apiRequest } from "@/lib/apiClient";
import { getDepartmentAdminToken } from "@/lib/authTokens";
import { getMediaUrl } from "@/lib/media";
import { DepartmentAdminProfile } from "@/components/admin/DepartmentLayout";

const AVAILABLE_PLATFORMS = ["PS5", "PS4", "Xbox", "Switch"];

const POPULAR_GENRES = [
  "Action",
  "Adventure",
  "RPG",
  "Shooter",
  "Strategy",
  "Puzzle",
  "Simulation",
  "Sports",
  "Racing",
  "Fighting",
  "Horror",
  "Indie",
  "Platformer",
  "Arcade",
  "Casual",
];

interface GameFormState {
  title_fa: string;
  title_en: string;
  source_id: string;
  rawg_id: number | null;
  slug: string;
  description_fa: string;
  description_en: string;
  storyline_fa: string;
  developer: string;
  publisher: string;
  released: string;
  download_size_gb: number;
  rating: number;
  metacritic: number | null;
  is_two_player: boolean;
  has_vr: boolean;
  is_active: boolean;
  platforms: string[];
  genres: string[];
  awards: string[];
  cover_image_url: string;
  banner_image_url: string;
  screenshots: string[];
}

const INITIAL_FORM: GameFormState = {
  title_fa: "",
  title_en: "",
  source_id: "",
  rawg_id: null,
  slug: "",
  description_fa: "",
  description_en: "",
  storyline_fa: "",
  developer: "",
  publisher: "",
  released: "",
  download_size_gb: 0,
  rating: 0,
  metacritic: null,
  is_two_player: false,
  has_vr: false,
  is_active: true,
  platforms: ["PS5", "PS4"],
  genres: ["Action"],
  awards: [],
  cover_image_url: "",
  banner_image_url: "",
  screenshots: [],
};

export default function ContentGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<DepartmentAdminProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingGame, setEditingGame] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "content" | "media">("general");

  // Form State
  const [form, setForm] = useState<GameFormState>(INITIAL_FORM);

  // Upload States
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);

  // New inputs for tag additions
  const [newGenreInput, setNewGenreInput] = useState("");
  const [newAwardInput, setNewAwardInput] = useState("");
  const [newScreenshotUrlInput, setNewScreenshotUrlInput] = useState("");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);

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
      const res = await apiRequest<any>(
        `/admin-content/games?page=${page}&limit=20&search=${encodeURIComponent(search)}`
      );
      if (Array.isArray(res)) {
        setGames(res);
        setTotalCount(res.length);
      } else if (res && Array.isArray(res.items)) {
        setGames(res.items);
        setTotalCount(res.total || res.items.length);
      } else {
        setGames([]);
        setTotalCount(0);
      }
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
    setForm(INITIAL_FORM);
    setActiveTab("general");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (g: any) => {
    setEditingGame(g);
    setForm({
      title_fa: g.title_fa || "",
      title_en: g.title_en || "",
      source_id: g.source_id || "",
      rawg_id: g.rawg_id ?? null,
      slug: g.slug || "",
      description_fa: g.description_fa || "",
      description_en: g.description_en || "",
      storyline_fa: g.storyline_fa || "",
      developer: g.developer || "",
      publisher: g.publisher || "",
      released: g.released || "",
      download_size_gb: g.download_size_gb || 0,
      rating: g.rating || 0,
      metacritic: g.metacritic ?? null,
      is_two_player: !!g.is_two_player,
      has_vr: !!g.has_vr,
      is_active: g.is_active !== false,
      platforms: Array.isArray(g.platforms) ? g.platforms : ["PS5", "PS4"],
      genres: Array.isArray(g.genres) ? g.genres : [],
      awards: Array.isArray(g.awards) ? g.awards : [],
      cover_image_url: g.cover_image_url || "",
      banner_image_url: g.banner_image_url || "",
      screenshots: Array.isArray(g.screenshots) ? g.screenshots : [],
    });
    setActiveTab("general");
    setErrorMsg("");
    setSuccessMsg("");
    setModalOpen(true);
  };

  // Upload helper using multipart/form-data
  const uploadFileToServer = async (file: File, folder: string, prefix: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const token = getDepartmentAdminToken("content");
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://62.60.191.67:8000/api").replace(/\/api\/?$/, "");

    const res = await fetch(
      `${apiBase}/api/admin-content/upload?folder=${encodeURIComponent(folder)}&prefix=${encodeURIComponent(prefix)}`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "خطا در بارگذاری تصویر در سرور");
    }

    const data = await res.json();
    return data.url;
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadFileToServer(file, "games", "cover");
      setForm((prev) => ({ ...prev, cover_image_url: url }));
    } catch (err: any) {
      alert(err.message || "خطا در آپلود کاور");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadFileToServer(file, "banners", "banner");
      setForm((prev) => ({ ...prev, banner_image_url: url }));
    } catch (err: any) {
      alert(err.message || "خطا در آپلود بنر");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleUploadScreenshots = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingScreenshots(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFileToServer(files[i], "screenshots", `shot_${i + 1}`);
        uploadedUrls.push(url);
      }
      setForm((prev) => ({
        ...prev,
        screenshots: [...prev.screenshots, ...uploadedUrls],
      }));
    } catch (err: any) {
      alert(err.message || "خطا در آپلود اسکرین‌شات‌ها");
    } finally {
      setUploadingScreenshots(false);
      if (screenshotsInputRef.current) screenshotsInputRef.current.value = "";
    }
  };

  const handleAddScreenshotUrl = () => {
    const clean = newScreenshotUrlInput.trim();
    if (!clean) return;
    setForm((prev) => ({
      ...prev,
      screenshots: [...prev.screenshots, clean],
    }));
    setNewScreenshotUrlInput("");
  };

  const handleRemoveScreenshot = (index: number) => {
    setForm((prev) => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index),
    }));
  };

  const handleGenerateSlug = () => {
    if (!form.title_en) return;
    const autoSlug = form.title_en
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((prev) => ({ ...prev, slug: autoSlug }));
  };

  const togglePlatform = (p: string) => {
    setForm((prev) => {
      const exists = prev.platforms.includes(p);
      return {
        ...prev,
        platforms: exists ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
      };
    });
  };

  const toggleGenre = (g: string) => {
    setForm((prev) => {
      const exists = prev.genres.includes(g);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((x) => x !== g) : [...prev.genres, g],
      };
    });
  };

  const handleAddCustomGenre = () => {
    const clean = newGenreInput.trim();
    if (!clean) return;
    if (!form.genres.includes(clean)) {
      setForm((prev) => ({ ...prev, genres: [...prev.genres, clean] }));
    }
    setNewGenreInput("");
  };

  const handleAddAward = () => {
    const clean = newAwardInput.trim();
    if (!clean) return;
    setForm((prev) => ({ ...prev, awards: [...prev.awards, clean] }));
    setNewAwardInput("");
  };

  const handleRemoveAward = (index: number) => {
    setForm((prev) => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      ...form,
      slug: form.slug.trim() || form.title_en.toLowerCase().replace(/\s+/g, "-"),
      source_id: form.source_id.trim() || undefined,
      metacritic: form.metacritic === null || form.metacritic === 0 ? undefined : Number(form.metacritic),
      rating: Number(form.rating) || 0,
      download_size_gb: Number(form.download_size_gb) || 0,
    };

    try {
      if (editingGame) {
        await apiRequest(`/admin-content/games/${editingGame.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccessMsg("بازی با موفقیت بروزرسانی شد.");
      } else {
        await apiRequest(`/admin-content/games`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccessMsg("بازی جدید با موفقیت اضافه شد.");
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
    if (!confirm("آیا از حذف این بازی اطمینان دارید؟ تمامی اطلاعات آن حذف خواهد شد.")) return;

    try {
      await apiRequest(`/admin-content/games/${id}`, { method: "DELETE" });
      setSuccessMsg("بازی با موفقیت حذف شد.");
      await loadGames();
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف بازی");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-emerald-400" />
            مدیریت کاتالوگ بازی‌ها
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده، ثبت دستی، ویرایش مشخصات جامع و آپلود مستقیم رسانه‌های بازی‌ها
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          disabled={isReadOnly}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-lg ${
            isReadOnly
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
          }`}
          title={isReadOnly ? "سطح دسترسی شما فقط مشاهده است" : "افزودن بازی"}
        >
          <Plus className="w-4 h-4" />
          افزودن بازی جدید (دستی)
        </button>
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          شما در حالت <strong>فقط خواندنی (Read-Only)</strong> قرار دارید. امکان درج، ویرایش یا حذف بازی وجود ندارد.
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="p-3.5 rounded-2xl bg-[#0c1017] border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="جستجوی نام بازی به فارسی یا انگلیسی یا اسلاگ..."
          className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs text-slate-500 hover:text-slate-300 p-1"
          >
            پاکسازی
          </button>
        )}
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
                <th className="py-3 px-4">پلتفرم‌ها</th>
                <th className="py-3 px-4">ژانرها</th>
                <th className="py-3 px-4">حجم (GB)</th>
                <th className="py-3 px-4">امتیاز / متا</th>
                <th className="py-3 px-4">وضعیت</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    در حال بارگذاری لیست بازی‌ها...
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
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
                          src={getMediaUrl(g.cover_image_url)}
                          alt={g.title_fa}
                          className="w-11 h-14 object-cover rounded-lg border border-slate-700 bg-black/40"
                        />
                      ) : (
                        <div className="w-11 h-14 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-600">
                          🎮
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-[240px]">
                      <div className="font-bold truncate">{g.title_fa}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{g.title_en}</div>
                      <div className="text-[10px] text-slate-500 font-mono">slug: {g.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {Array.isArray(g.platforms) && g.platforms.length > 0 ? (
                          g.platforms.map((p: string) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {Array.isArray(g.genres) && g.genres.length > 0 ? (
                          g.genres.slice(0, 3).map((genre: string) => (
                            <span
                              key={genre}
                              className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            >
                              {genre}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{g.download_size_gb || 0} GB</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{g.rating || 0}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Meta: {g.metacritic ? `${g.metacritic}` : "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          g.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {g.is_active ? "فعال" : "مخفی"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          disabled={isReadOnly}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-amber-400 hover:bg-amber-500/10"
                          }`}
                          title="ویرایش کامل بازی"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          disabled={isReadOnly}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isReadOnly
                              ? "text-slate-600 cursor-not-allowed"
                              : "text-rose-400 hover:bg-rose-500/10"
                          }`}
                          title="حذف بازی"
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

        {/* Pagination bar */}
        <div className="p-3 bg-[#0f1422] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            نمایش {games.length} بازی از کل {totalCount} بازی
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-white">صفحه {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={games.length < 20}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Comprehensive CRUD Modal for Game Catalog                                */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl bg-[#0c1017] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#101622]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingGame ? `ویرایش بازی: ${editingGame.title_fa || editingGame.title_en}` : "افزودن بازی جدید به کاتالوگ"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    فرم یکپارچه مدیریت تمام فیلدهای بازی و آپلود مستقیم رسانه‌ها
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-[#0c1017]">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "general"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                مشخصات فنی و پلتفرم‌ها
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("content")}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "content"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                توضیحات، داستان و جوایز
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === "media"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                رسانه‌ها و تصاویر (آپلود زنده)
                {(form.cover_image_url || form.banner_image_url || form.screenshots.length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                )}
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* ============================================================== */}
              {/* TAB 1: GENERAL & PLATFORMS                                    */}
              {/* ============================================================== */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  {/* Title FA & EN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        عنوان فارسی بازی <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.title_fa}
                        onChange={(e) => setForm({ ...form, title_fa: e.target.value })}
                        placeholder="مثال: خدای جنگ رگناروک"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        عنوان انگلیسی بازی <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.title_en}
                        onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                        placeholder="God of War Ragnarök"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white text-left font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Slug & Source ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          اسلاگ یکتا (URL Slug) <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSlug}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          تولید خودکار از عنوان انگلیسی
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        placeholder="god-of-war-ragnarok"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white text-left font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        شناسه سورس مرجع
                      </label>
                      <input
                        type="text"
                        value={form.source_id}
                        onChange={(e) => setForm({ ...form, source_id: e.target.value })}
                        placeholder="مثال: 19560"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white text-left font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Developer, Publisher, Released */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        سازنده (Developer)
                      </label>
                      <input
                        type="text"
                        value={form.developer}
                        onChange={(e) => setForm({ ...form, developer: e.target.value })}
                        placeholder="Santa Monica Studio"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        ناشر (Publisher)
                      </label>
                      <input
                        type="text"
                        value={form.publisher}
                        onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                        placeholder="Sony Interactive Entertainment"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        تاریخ انتشار (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={form.released}
                        onChange={(e) => setForm({ ...form, released: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Platforms Selector */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-200">
                      پلتفرم‌های پشتیبانی‌شده (Platforms)
                    </label>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {AVAILABLE_PLATFORMS.map((plat) => {
                        const active = form.platforms.includes(plat);
                        return (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => togglePlatform(plat)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
                              active
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500"
                                : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                            }`}
                          >
                            <span>{plat}</span>
                            {active ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 opacity-40" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Genres Multi-Select */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200">ژانرها و دسته‌بندی‌ها (Genres)</label>
                      <span className="text-[11px] text-slate-400">
                        {form.genres.length} ژانر انتخاب شده
                      </span>
                    </div>

                    {/* Predefined Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_GENRES.map((g) => {
                        const isSelected = form.genres.includes(g);
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenre(g)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Genre Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newGenreInput}
                        onChange={(e) => setNewGenreInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomGenre();
                          }
                        }}
                        placeholder="افزودن ژانر جدید..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomGenre}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700"
                      >
                        افزودن ژانر
                      </button>
                    </div>

                    {/* Active Selected Tags */}
                    {form.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                        {form.genres.map((g) => (
                          <span
                            key={g}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-emerald-600/30 text-emerald-200 border border-emerald-500/30"
                          >
                            <span>{g}</span>
                            <button
                              type="button"
                              onClick={() => toggleGenre(g)}
                              className="text-emerald-400 hover:text-rose-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metrics: Download Size, Rating, Metacritic */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        حجم کل دانلود (GB)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={form.download_size_gb}
                        onChange={(e) => setForm({ ...form, download_size_gb: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        امتیاز بازی (از ۵.۰)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={form.rating}
                        onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        نمره متاکریتیک (از ۱۰۰)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.metacritic ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            metacritic: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        placeholder="مثال: 94"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Boolean Switches */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>نمایش و فعال بودن در سایت</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_two_player}
                        onChange={(e) => setForm({ ...form, is_two_player: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>پشتیبانی از دونفره / چندنفره</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.has_vr}
                        onChange={(e) => setForm({ ...form, has_vr: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <span>پشتیبانی از واقعیت مجازی (VR)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: DESCRIPTIONS, STORYLINE, AWARDS                         */}
              {/* ============================================================== */}
              {activeTab === "content" && (
                <div className="space-y-4">
                  {/* Persian Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      توضیحات فارسی بازی
                    </label>
                    <textarea
                      rows={4}
                      value={form.description_fa}
                      onChange={(e) => setForm({ ...form, description_fa: e.target.value })}
                      placeholder="توضیحات جامع درباره گیم‌پلی، ویژگی‌ها و داستان برای کاربران فارسی‌زبان..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Persian Storyline */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      خلاصه داستان بازی (Storyline)
                    </label>
                    <textarea
                      rows={3}
                      value={form.storyline_fa}
                      onChange={(e) => setForm({ ...form, storyline_fa: e.target.value })}
                      placeholder="روایت خط داستانی و زمینه داستانی شخصیت‌ها..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* English Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      توضیحات انگلیسی اصلی (Description EN)
                    </label>
                    <textarea
                      rows={4}
                      value={form.description_en}
                      onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                      placeholder="Official English overview and feature summary..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono text-left focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Awards & Achievements */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-200">
                      جوایز و افتخارات بازی (Awards)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAwardInput}
                        onChange={(e) => setNewAwardInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddAward();
                          }
                        }}
                        placeholder="مثال: Game of the Year - The Game Awards 2024"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddAward}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        افزودن جایزه
                      </button>
                    </div>

                    {form.awards.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {form.awards.map((award, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{award}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAward(idx)}
                              className="text-amber-400 hover:text-rose-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: MEDIA, COVERS & SCREENSHOTS                            */}
              {/* ============================================================== */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  {/* Cover and Hero Banner Dual Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vertical Cover Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-emerald-400" />
                          کاور پوستر عمودی (Cover Image 3:4)
                        </label>
                      </div>

                      {/* Preview Box */}
                      <div className="relative aspect-[3/4] w-36 mx-auto rounded-xl overflow-hidden border border-slate-700 bg-black/60 shadow-lg flex items-center justify-center">
                        {form.cover_image_url ? (
                          <img
                            src={getMediaUrl(form.cover_image_url)}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-500 text-[11px]">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                            بدون کاور
                          </div>
                        )}
                        {uploadingCover && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs text-emerald-400 gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            در حال آپلود...
                          </div>
                        )}
                      </div>

                      {/* Upload and URL input */}
                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={coverInputRef}
                          onChange={handleUploadCover}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          آپلود مستقیم کاور از سیستم (S3)
                        </button>

                        <input
                          type="text"
                          value={form.cover_image_url}
                          onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                          placeholder="یا درج آدرس مستقیم: /media/... یا https://..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono placeholder-slate-600"
                        />
                      </div>
                    </div>

                    {/* Horizontal Banner Card */}
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-emerald-400" />
                          بنر هیرو عریض (Hero Banner 16:9)
                        </label>
                      </div>

                      {/* Preview Box */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700 bg-black/60 shadow-lg flex items-center justify-center">
                        {form.banner_image_url ? (
                          <img
                            src={getMediaUrl(form.banner_image_url)}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-3 text-slate-500 text-[11px]">
                            <Film className="w-8 h-8 mx-auto mb-1 opacity-40" />
                            بدون بنر هیرو
                          </div>
                        )}
                        {uploadingBanner && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs text-emerald-400 gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            در حال آپلود...
                          </div>
                        )}
                      </div>

                      {/* Upload and URL input */}
                      <div className="space-y-2">
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={handleUploadBanner}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          disabled={uploadingBanner}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          آپلود مستقیم بنر هیرو از سیستم (S3)
                        </button>

                        <input
                          type="text"
                          value={form.banner_image_url}
                          onChange={(e) => setForm({ ...form, banner_image_url: e.target.value })}
                          placeholder="یا درج آدرس مستقیم: /media/... یا https://..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-left font-mono placeholder-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Screenshots Gallery Section */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-emerald-400" />
                          گالری اسکرین‌شات‌ها و تصاویر گیم‌پلی ({form.screenshots.length} تصویر)
                        </label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          امکان انتخاب و آپلود همزمان چند فایل از دیسک، یا اضافه کردن لینک تکی
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          ref={screenshotsInputRef}
                          onChange={handleUploadScreenshots}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => screenshotsInputRef.current?.click()}
                          disabled={uploadingScreenshots}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingScreenshots ? "در حال آپلود چندتایی..." : "آپلود چندتایی اسکرین‌شات"}
                        </button>
                      </div>
                    </div>

                    {/* Manual URL input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newScreenshotUrlInput}
                        onChange={(e) => setNewScreenshotUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddScreenshotUrl();
                          }
                        }}
                        placeholder="افزودن دستی آدرس اسکرین‌شات: /media/... یا https://..."
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white text-left font-mono flex-1 placeholder-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddScreenshotUrl}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                      >
                        افزودن لینک
                      </button>
                    </div>

                    {/* Thumbnails Grid */}
                    {form.screenshots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                        {form.screenshots.map((shot, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black/60 group shadow-md"
                          >
                            <img
                              src={getMediaUrl(shot)}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="text-[10px] text-white font-mono bg-black/70 px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveScreenshot(idx)}
                                className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white transition-colors"
                                title="حذف اسکرین‌شات"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                        هنوز هیچ اسکرین‌شاتی افزوده نشده است.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Footer Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        در حال ذخیره‌سازی...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingGame ? "ذخیره تغییرات بازی" : "ثبت نهایی بازی در کاتالوگ"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
