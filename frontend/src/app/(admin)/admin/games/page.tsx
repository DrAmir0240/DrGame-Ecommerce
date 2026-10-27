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
  DownloadCloud,
  Image as ImageIcon,
  Award,
  BookOpen,
  Layers,
  AlertCircle,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { AdminGameItem, AdminGameDownloadLink } from "@/types/admin";
import { getMediaUrl } from "@/lib/media";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/?$/, "");

const PLATFORM_OPTIONS = ["PS5", "PS4", "Xbox Series X/S", "Nintendo Switch"];

type TabType = "basic" | "media" | "studio" | "story" | "features" | "downloads";

export default function AdminGamesPage() {
  const [games, setGames] = useState<AdminGameItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("basic");

  // Form Fields - Tab 1: Basic
  const [titleFa, setTitleFa] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [released, setReleased] = useState("");
  const [downloadSizeGb, setDownloadSizeGb] = useState<number | "">(35);
  const [rating, setRating] = useState<number | "">(4.5);
  const [metacritic, setMetacritic] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  // Form Fields - Tab 2: Media
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [screenshotsText, setScreenshotsText] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [cachingCover, setCachingCover] = useState(false);
  const [cachingBanner, setCachingBanner] = useState(false);

  // Form Fields - Tab 3: Studio & Awards
  const [developer, setDeveloper] = useState("");
  const [publisher, setPublisher] = useState("");
  const [awardsText, setAwardsText] = useState("");

  // Form Fields - Tab 4: Story & Descriptions
  const [storylineFa, setStorylineFa] = useState("");
  const [descriptionFa, setDescriptionFa] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  // Form Fields - Tab 5: Platforms & Features
  const [platforms, setPlatforms] = useState<string[]>(["PS5", "PS4"]);
  const [genresText, setGenresText] = useState("");
  const [isTwoPlayer, setIsTwoPlayer] = useState(false);
  const [hasVr, setHasVr] = useState(false);

  // Form Fields - Tab 6: Downloads
  const [downloadLinks, setDownloadLinks] = useState<AdminGameDownloadLink[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("drgame_admin_token");
      const url = new URL(`${API_BASE}/api/admin/games`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("page_size", "15");
      if (searchTerm.trim()) url.searchParams.set("search", searchTerm.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("خطا در دریافت کاتالوگ");
      const data = await res.json();
      setGames(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [page, searchTerm]);

  // Upload file helper
  const handleUploadImage = async (file: File, type: "cover" | "banner") => {
    try {
      if (type === "cover") setUploadingCover(true);
      else setUploadingBanner(true);

      const token = localStorage.getItem("drgame_admin_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/admin/games/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("خطا در آپلود تصویر");
      const data = await res.json();

      if (type === "cover") {
        setCoverUrl(data.url);
        setModalMessage("کاور بازی در سرور دکتر گیم ذخیره شد.");
      } else {
        setBannerUrl(data.url);
        setModalMessage("بنر هیرو در سرور دکتر گیم ذخیره شد.");
      }
    } catch (err: any) {
      setModalError(err.message || "خطا در آپلود");
    } finally {
      setUploadingCover(false);
      setUploadingBanner(false);
    }
  };

  // Cache remote URL helper
  const handleCacheRemote = async (type: "cover" | "banner") => {
    const url = type === "cover" ? coverUrl : bannerUrl;
    if (!url || !url.startsWith("http")) return;

    try {
      if (type === "cover") setCachingCover(true);
      else setCachingBanner(true);

      const token = localStorage.getItem("drgame_admin_token");
      const res = await fetch(`${API_BASE}/api/admin/games/cache-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url: url.trim() }),
      });
      if (!res.ok) throw new Error("خطا در دانلود و ذخیره تصویر");
      const data = await res.json();

      if (type === "cover") {
        setCoverUrl(data.url);
        setModalMessage("کاور در هاست محلی ذخیره شد.");
      } else {
        setBannerUrl(data.url);
        setModalMessage("بنر در هاست محلی ذخیره شد.");
      }
    } catch (err: any) {
      setModalError(err.message || "خطا در کش تصویر");
    } finally {
      setCachingCover(false);
      setCachingBanner(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setIsEditing(false);
    setSelectedGameId(null);
    setActiveTab("basic");
    setTitleFa("");
    setTitleEn("");
    setSlug("");
    setReleased(new Date().getFullYear().toString());
    setDownloadSizeGb(30);
    setRating(4.5);
    setMetacritic(85);
    setIsActive(true);
    setCoverUrl("");
    setBannerUrl("");
    setScreenshotsText("");
    setDeveloper("");
    setPublisher("");
    setAwardsText("");
    setStorylineFa("");
    setDescriptionFa("");
    setDescriptionEn("");
    setPlatforms(["PS5", "PS4"]);
    setGenresText("اکشن, ماجراجویی");
    setIsTwoPlayer(false);
    setHasVr(false);
    setDownloadLinks([
      { part_number: 1, part_name: "پارت ۱", file_size_gb: 15, download_url: "", is_active: true },
      { part_number: 2, part_name: "پارت ۲", file_size_gb: 15, download_url: "", is_active: true },
    ]);
    setModalMessage(null);
    setModalError(null);
    setShowModal(true);
    setModalLoading(false);
  };

  // Open Edit Modal with full detail fetch
  const openEditModal = async (g: AdminGameItem) => {
    setIsEditing(true);
    setSelectedGameId(g.id);
    setActiveTab("basic");
    setModalMessage(null);
    setModalError(null);
    setShowModal(true);
    setModalLoading(true);

    // Initial fill from list item
    setTitleFa(g.title_fa || "");
    setTitleEn(g.title_en || "");
    setSlug(g.slug || "");
    setReleased(g.released || "");
    setDownloadSizeGb(g.download_size_gb ?? 0);
    setRating(g.rating ?? 4.5);
    setMetacritic(g.metacritic ?? "");
    setIsActive(g.is_active ?? true);
    setCoverUrl(g.cover_image_url || "");
    setBannerUrl(g.banner_image_url || "");
    setDeveloper(g.developer || "");
    setPublisher(g.publisher || "");
    setAwardsText((g.awards || []).join("\n"));
    setScreenshotsText((g.screenshots || []).join("\n"));
    setStorylineFa(g.storyline_fa || "");
    setDescriptionFa(g.description_fa || "");
    setDescriptionEn(g.description_en || "");
    setPlatforms(g.platforms || ["PS5", "PS4"]);
    setGenresText((g.genres || []).join(", "));
    setIsTwoPlayer(g.is_two_player || false);
    setHasVr(g.has_vr || false);
    setDownloadLinks(g.download_links || []);

    try {
      const token = localStorage.getItem("drgame_admin_token");
      const res = await fetch(`${API_BASE}/api/admin/games/${g.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const full = await res.json();
        setTitleFa(full.title_fa || "");
        setTitleEn(full.title_en || "");
        setSlug(full.slug || "");
        setReleased(full.released || "");
        setDownloadSizeGb(full.download_size_gb ?? 0);
        setRating(full.rating ?? 4.5);
        setMetacritic(full.metacritic ?? "");
        setIsActive(full.is_active ?? true);
        setCoverUrl(full.cover_image_url || "");
        setBannerUrl(full.banner_image_url || "");
        setDeveloper(full.developer || "");
        setPublisher(full.publisher || "");
        setAwardsText((full.awards || []).join("\n"));
        setScreenshotsText((full.screenshots || []).join("\n"));
        setStorylineFa(full.storyline_fa || "");
        setDescriptionFa(full.description_fa || "");
        setDescriptionEn(full.description_en || "");
        setPlatforms(full.platforms || ["PS5", "PS4"]);
        setGenresText((full.genres || []).join(", "));
        setIsTwoPlayer(full.is_two_player || false);
        setHasVr(full.has_vr || false);
        if (full.download_links && full.download_links.length > 0) {
          setDownloadLinks(full.download_links);
        } else {
          setDownloadLinks([
            { part_number: 1, part_name: "پارت ۱", file_size_gb: full.download_size_gb || 10, download_url: "", is_active: true }
          ]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle platform
  const togglePlatform = (p: string) => {
    if (platforms.includes(p)) {
      setPlatforms(platforms.filter((item) => item !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  // Download links handlers
  const handleAddDownloadLink = (type: 'data' | 'cheat' | 'dlc' | 'subtitle' | 'dubbing' = 'data') => {
    const nextPart = downloadLinks.length + 1;
    const defaultNames: Record<string, string> = {
      data: `دیتای رسمی (پارت ${nextPart})`,
      cheat: 'چیت و ترینر اختصاصی',
      dlc: 'بسته الحاقی (DLC)',
      subtitle: 'زیرنویس فارسی رسمی',
      dubbing: 'دوبله فارسی اختصاصی',
    };
    setDownloadLinks([
      ...downloadLinks,
      {
        part_number: nextPart,
        part_name: defaultNames[type] || `پارت ${nextPart}`,
        file_size_gb: type === 'data' ? 10 : type === 'subtitle' ? 0.2 : 1.5,
        download_url: "",
        is_active: true,
        file_type: type,
        required_tier: type === 'dubbing' ? 'gold' : type === 'cheat' ? 'silver' : 'bronze',
      },
    ]);
  };

  const handleUpdateDownloadLink = (index: number, field: keyof AdminGameDownloadLink, value: any) => {
    const updated = [...downloadLinks];
    updated[index] = { ...updated[index], [field]: value };
    setDownloadLinks(updated);
  };

  const handleRemoveDownloadLink = (index: number) => {
    const updated = downloadLinks.filter((_, idx) => idx !== index);
    setDownloadLinks(updated.map((link, idx) => ({ ...link, part_number: idx + 1 })));
  };

  // Save game
  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFa.trim() || !titleEn.trim()) {
      setModalError("لطفاً عنوان فارسی و انگلیسی بازی را وارد نمایید.");
      setActiveTab("basic");
      return;
    }

    try {
      setSubmitting(true);
      setModalMessage(null);
      setModalError(null);
      const token = localStorage.getItem("drgame_admin_token");

      const awards = awardsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const screenshots = screenshotsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const genres = genresText
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title_fa: titleFa.trim(),
        title_en: titleEn.trim(),
        slug: slug.trim() || undefined,
        released: released.trim() || undefined,
        download_size_gb: Number(downloadSizeGb) || 0,
        rating: Number(rating) || 0,
        metacritic: metacritic !== "" ? Number(metacritic) : null,
        is_active: isActive,
        cover_image_url: coverUrl.trim() || null,
        banner_image_url: bannerUrl.trim() || null,
        developer: developer.trim() || null,
        publisher: publisher.trim() || null,
        storyline_fa: storylineFa.trim() || null,
        description_fa: descriptionFa.trim() || null,
        description_en: descriptionEn.trim() || null,
        is_two_player: isTwoPlayer,
        has_vr: hasVr,
        platforms: platforms.length > 0 ? platforms : ["PS5", "PS4"],
        genres: genres.length > 0 ? genres : ["Action"],
        awards: awards,
        screenshots: screenshots,
        download_links: downloadLinks.map((l, idx) => ({
          id: l.id,
          part_number: idx + 1,
          part_name: l.part_name || `پارت ${idx + 1}`,
          file_size_gb: Number(l.file_size_gb) || 0,
          download_url: l.download_url || "",
          is_active: l.is_active ?? true,
        })),
      };

      if (isEditing && selectedGameId) {
        const res = await fetch(`${API_BASE}/api/admin/games/${selectedGameId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "خطا در ویرایش بازی");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/admin/games`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "خطا در ایجاد بازی");
        }
      }

      setModalMessage("اطلاعات بازی با موفقیت ذخیره و به‌روزرسانی شد.");
      fetchGames();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err: any) {
      setModalError(err.message || "خطا در پردازش درخواست");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این بازی از کاتالوگ اطمینان دارید؟")) return;
    try {
      const token = localStorage.getItem("drgame_admin_token");
      const res = await fetch(`${API_BASE}/api/admin/games/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchGames();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">مدیریت جامع کاتالوگ بازی‌ها</h1>
          <p className="text-xs text-slate-400">
            ویرایش تمامی بخش‌های بازی (کاور، بنر، داستان، جوایز، استودیو، متای منتقدین، پلتفرم‌ها و لینک‌های دانلود)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="جستجوی عنوان بازی..."
              className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 pr-9 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن بازی جدید</span>
          </button>
        </div>
      </div>

      {/* Games Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">عنوان بازی</th>
                <th className="py-3.5 px-4 font-semibold">استودیو و ناشر</th>
                <th className="py-3.5 px-4 font-semibold">حجم دیتا</th>
                <th className="py-3.5 px-4 font-semibold">امتیاز و متا</th>
                <th className="py-3.5 px-4 font-semibold">پلتفرم‌ها</th>
                <th className="py-3.5 px-4 font-semibold">وضعیت</th>
                <th className="py-3.5 px-4 font-semibold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    درحال دریافت کاتالوگ...
                  </td>
                </tr>
              ) : games.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    بازی یافت نشد.
                  </td>
                </tr>
              ) : (
                games.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                          {g.cover_image_url ? (
                            <img
                              src={getMediaUrl(g.cover_image_url)}
                              alt={g.title_fa}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                              بدون کاور
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{g.title_fa}</div>
                          <div className="text-[11px] text-slate-400 font-roboto" dir="ltr">
                            {g.title_en}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">{g.developer || "—"}</div>
                      <div className="text-[10px] text-slate-400">{g.publisher || ""}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300 font-roboto">
                      {g.download_size_gb} GB
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold font-roboto">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {g.rating || "—"}
                        </span>
                        {g.metacritic ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-roboto font-bold text-[10px]">
                            {g.metacritic}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {(g.platforms || ["PS5", "PS4"]).map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-roboto"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {g.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          منتشر شده
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 text-[10px]">
                          پیش‌نویس
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(g)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 text-[11px] transition-colors"
                          title="ویرایش کلیه جزئیات بازی"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>ویرایش کامل</span>
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                          title="حذف بازی"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d13] flex items-center justify-between text-xs text-slate-400">
          <span>
            نمایش {games.length} از {total} بازی در سامانه
          </span>
          {Math.ceil(total / 15) > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                صفحه قبل
              </button>
              <span className="font-roboto text-slate-300">
                صفحه {page} از {Math.ceil(total / 15)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(total / 15), p + 1))}
                disabled={page >= Math.ceil(total / 15)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              >
                صفحه بعد
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Add / Edit Game Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0c1017] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#10151f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{isEditing ? "ویرایش کلیه جزئیات بازی" : "ثبت عنوان بازی جدید"}</span>
                    {selectedGameId && (
                      <span className="text-[10px] font-roboto px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        ID: {selectedGameId}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    مدیریت یکپارچه بنرها، نقد، مشخصات استودیو، جوایز و فایل‌های دانلود بازی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-[#0e131c] overflow-x-auto text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-medium rounded-t-xl transition-colors border-b-2 ${
                  activeTab === "basic"
                    ? "text-purple-400 border-purple-500 bg-purple-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>مشخصات اصلی</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-medium rounded-t-xl transition-colors border-b-2 ${
                  activeTab === "media"
                    ? "text-purple-400 border-purple-500 bg-purple-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>تصاویر و بنر هیرو</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("studio")}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-medium rounded-t-xl transition-colors border-b-2 ${
                  activeTab === "studio"
                    ? "text-purple-400 border-purple-500 bg-purple-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>استودیو و جوایز</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("story")}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-medium rounded-t-xl transition-colors border-b-2 ${
                  activeTab === "story"
                    ? "text-purple-400 border-purple-500 bg-purple-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>قلب بازی و داستان</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("features")}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-medium rounded-t-xl transition-colors border-b-2 ${
                  activeTab === "features"
                    ? "text-purple-400 border-purple-500 bg-purple-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>پلتفرم و امکانات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("downloads")}
                className={`flex items-center gap-2 px-3.5 py-2.5 font-medium rounded-t-xl transition-colors border-b-2 ${
                  activeTab === "downloads"
                    ? "text-purple-400 border-purple-500 bg-purple-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <DownloadCloud className="w-4 h-4" />
                <span>فایل‌ها و پارت‌ها ({downloadLinks.length})</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveGame} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {modalLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  درحال دریافت جزئیات بازی از دیتابیس...
                </div>
              ) : (
                <>
                  {/* TAB 1: BASIC INFO */}
                  {activeTab === "basic" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            عنوان فارسی بازی <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={titleFa}
                            onChange={(e) => setTitleFa(e.target.value)}
                            placeholder="مثال: لست آو آس ریمسترد"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            عنوان انگلیسی بازی <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            placeholder="e.g. The Last of Us Remastered"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-roboto"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            نامک آدرس (Slug)
                          </label>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="the-last-of-us-remastered"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-roboto"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            تاریخ / سال انتشار
                          </label>
                          <input
                            type="text"
                            value={released}
                            onChange={(e) => setReleased(e.target.value)}
                            placeholder="مثال: 2022 یا 2014-07-29"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-roboto"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            حجم کلی دیتا (GB)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={downloadSizeGb}
                            onChange={(e) => setDownloadSizeGb(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-roboto"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            امتیاز کاربران (از ۵)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={rating}
                            onChange={(e) => setRating(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-roboto"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            نمره متاکریتیک (از ۱۰۰)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={metacritic}
                            onChange={(e) => setMetacritic(e.target.value === "" ? "" : parseInt(e.target.value))}
                            placeholder="مثال: 95"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-roboto"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            وضعیت انتشار بازی
                          </label>
                          <div className="flex items-center gap-3 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-200">
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0"
                              />
                              <span>فعال و منتشر شده در فروشگاه</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MEDIA & HERO BACKDROP */}
                  {activeTab === "media" && (
                    <div className="space-y-6">
                      {/* Cover Art Section */}
                      <div className="p-4 rounded-2xl bg-[#101520] border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-200 font-semibold text-xs flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-purple-400" />
                            <span>تصویر کاور باکس بازی (Cover Art)</span>
                          </label>
                          <span className="text-[11px] text-slate-400">نسبت استاندارد ۳:۴ یا ۴:۵</span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={coverUrl}
                            onChange={(e) => setCoverUrl(e.target.value)}
                            placeholder="https://... یا /media/games/cover_..."
                            className="flex-1 bg-[#141b29] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-roboto"
                            dir="ltr"
                          />
                          {coverUrl && coverUrl.startsWith("http") && (
                            <button
                              type="button"
                              disabled={cachingCover}
                              onClick={() => handleCacheRemote("cover")}
                              className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-xl flex items-center gap-1.5 shrink-0 text-xs transition-colors"
                              title="دانلود و ذخیره‌سازی تصویر در سرور دکتر گیم"
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                              <span>{cachingCover ? "در حال کش..." : "ذخیره در سرور"}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors">
                            <Upload className="w-3.5 h-3.5 text-purple-400" />
                            <span>{uploadingCover ? "درحال آپلود کاور..." : "آپلود کاور از سیستم"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadImage(f, "cover");
                              }}
                              className="hidden"
                              disabled={uploadingCover}
                            />
                          </label>

                          {coverUrl && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-10 rounded bg-slate-800 overflow-hidden border border-slate-700">
                                <img
                                  src={getMediaUrl(coverUrl)}
                                  alt="Cover preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-emerald-400">کاور بارگذاری شده</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Banner Backdrop Section */}
                      <div className="p-4 rounded-2xl bg-[#101520] border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-200 font-semibold text-xs flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span>بنر سینمایی هیرو (Backdrop Hero Banner)</span>
                          </label>
                          <span className="text-[11px] text-slate-400">تصویر عریض پس‌زمینه بالای صفحه (۱۶:۹)</span>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={bannerUrl}
                            onChange={(e) => setBannerUrl(e.target.value)}
                            placeholder="https://... یا /media/games/banner_..."
                            className="flex-1 bg-[#141b29] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-roboto"
                            dir="ltr"
                          />
                          {bannerUrl && bannerUrl.startsWith("http") && (
                            <button
                              type="button"
                              disabled={cachingBanner}
                              onClick={() => handleCacheRemote("banner")}
                              className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-xl flex items-center gap-1.5 shrink-0 text-xs transition-colors"
                              title="دانلود و ذخیره‌سازی بنر در سرور دکتر گیم"
                            >
                              <DownloadCloud className="w-3.5 h-3.5" />
                              <span>{cachingBanner ? "در حال کش..." : "ذخیره در سرور"}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-colors">
                            <Upload className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{uploadingBanner ? "درحال آپلود بنر..." : "آپلود بنر هیرو از سیستم"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadImage(f, "banner");
                              }}
                              className="hidden"
                              disabled={uploadingBanner}
                            />
                          </label>

                          {bannerUrl && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-8 rounded bg-slate-800 overflow-hidden border border-slate-700">
                                <img
                                  src={getMediaUrl(bannerUrl)}
                                  alt="Banner preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-[10px] text-emerald-400">بنر بارگذاری شده</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Screenshots Textarea */}
                      <div>
                        <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                          گالری اسکرین‌شات‌های بازی (هر لینک در یک خط)
                        </label>
                        <textarea
                          rows={3}
                          value={screenshotsText}
                          onChange={(e) => setScreenshotsText(e.target.value)}
                          placeholder="https://...&#10;https://..."
                          className="w-full bg-[#121721] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-roboto"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: STUDIO & AWARDS */}
                  {activeTab === "studio" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            استودیوی سازنده بازی (Developer)
                          </label>
                          <input
                            type="text"
                            value={developer}
                            onChange={(e) => setDeveloper(e.target.value)}
                            placeholder="مثال: Naughty Dog یا Santa Monica Studio"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                            ناشر بازی (Publisher)
                          </label>
                          <input
                            type="text"
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            placeholder="مثال: Sony Interactive Entertainment"
                            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span>جوایز و افتخارات بازی (هر جایزه در یک سطر)</span>
                          </label>
                          <span className="text-[10px] text-slate-500">
                            در کارت اول صفحه گیم دیتل نمایش داده می‌شود
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={awardsText}
                          onChange={(e) => setAwardsText(e.target.value)}
                          placeholder="برنده بیش از ۲۰۰ جایزه بهترین بازی سال (Game of the Year)&#10;بهترین داستان‌سرایی مراسم The Game Awards&#10;شاهکار بیادماندنی استودیوی ناتی‌داگ"
                          className="w-full bg-[#121721] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: STORY & DESCRIPTIONS */}
                  {activeTab === "story" && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-purple-400" />
                            <span>روایت و قلب بازی (Storyline FA)</span>
                          </label>
                          <span className="text-[10px] text-purple-400">
                            متن کارت سوم «قلب بازی» در صفحه گیم دیتل
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={storylineFa}
                          onChange={(e) => setStorylineFa(e.target.value)}
                          placeholder="خلاصه داستان جذاب، جهان اثر و اتمسفر داستانی که در باکس اختصاصی قلب بازی نمایش داده می‌شود..."
                          className="w-full bg-[#121721] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                          توضیحات و نقد فارسی کامل (Full Description FA)
                        </label>
                        <textarea
                          rows={4}
                          value={descriptionFa}
                          onChange={(e) => setDescriptionFa(e.target.value)}
                          placeholder="نقد و بررسی کامل گیم‌پلی، گرافیک و نکات فنی بازی به زبان فارسی..."
                          className="w-full bg-[#121721] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1.5 font-medium text-xs font-roboto" dir="ltr">
                          English Description
                        </label>
                        <textarea
                          rows={3}
                          value={descriptionEn}
                          onChange={(e) => setDescriptionEn(e.target.value)}
                          placeholder="Original English description of the game..."
                          className="w-full bg-[#121721] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-roboto"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 5: PLATFORMS & FEATURES */}
                  {activeTab === "features" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-slate-300 mb-2 font-medium text-xs">
                          پلتفرم‌های تحت پوشش
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                          {PLATFORM_OPTIONS.map((plat) => {
                            const isSelected = platforms.includes(plat);
                            return (
                              <button
                                key={plat}
                                type="button"
                                onClick={() => togglePlatform(plat)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-roboto font-semibold border flex items-center gap-2 transition-all ${
                                  isSelected
                                    ? "bg-purple-600/20 text-purple-300 border-purple-500 shadow-md shadow-purple-900/30"
                                    : "bg-[#121721] text-slate-400 border-slate-700/80 hover:border-slate-600"
                                }`}
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-500" />
                                )}
                                <span>{plat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1.5 font-medium text-xs">
                          ژانرهای بازی (با کاما یا ویرگول جدا کنید)
                        </label>
                        <input
                          type="text"
                          value={genresText}
                          onChange={(e) => setGenresText(e.target.value)}
                          placeholder="اکشن, ماجراجویی, نقش‌آفرینی, بقا"
                          className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>

                      <div className="p-4 rounded-2xl bg-[#101520] border border-slate-800 space-y-3">
                        <label className="text-slate-200 font-semibold text-xs block">
                          ویژگی‌ها و قابلیت‌های خاص بازی
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#141b29] border border-slate-700/60 cursor-pointer hover:border-purple-500/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={isTwoPlayer}
                              onChange={(e) => setIsTwoPlayer(e.target.checked)}
                              className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-0"
                            />
                            <div>
                              <span className="text-xs text-slate-200 font-medium block">
                                پشتیبانی از حالت دونفره / چندنفره (Co-op)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                امکان بازی چند نفره آفلاین یا آنلاین
                              </span>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 p-3 rounded-xl bg-[#141b29] border border-slate-700/60 cursor-pointer hover:border-purple-500/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={hasVr}
                              onChange={(e) => setHasVr(e.target.checked)}
                              className="w-4 h-4 rounded text-purple-600 bg-slate-800 border-slate-700 focus:ring-0"
                            />
                            <div>
                              <span className="text-xs text-slate-200 font-medium block">
                                پشتیبانی از واقعیت مجازی (PS VR / PS VR2)
                              </span>
                              <span className="text-[10px] text-slate-400">
                                به همراه برچسب ویژه VR در مشخصات بازی
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: DOWNLOAD LINKS (5 FILE TYPES & TIERS) */}
                  {activeTab === "downloads" && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-xs font-semibold text-white">
                            پارت‌ها، بسته‌ها و ۵ نوع فایل قابل دانلود بازی
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            تعریف دیتای بازی، چیت، DLC، زیرنویس و دوبله همراه با تعیین سطح اشتراک مجاز
                          </p>
                        </div>

                        {/* 5 Quick-Add Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleAddDownloadLink('data')}
                            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>دیتای رسمی</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDownloadLink('cheat')}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>چیت و ترینر</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDownloadLink('dlc')}
                            className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>بسته الحاقی (DLC)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDownloadLink('subtitle')}
                            className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>زیرنویس</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDownloadLink('dubbing')}
                            className="px-2.5 py-1 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>دوبله فارسی</span>
                          </button>
                        </div>
                      </div>

                      {downloadLinks.length === 0 ? (
                        <div className="p-8 text-center bg-[#101520] border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
                          هنوز فایلی برای این بازی ثبت نشده است. از دکمه‌های بالا نوع فایل مورد نظر را اضافه نمایید.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {downloadLinks.map((link, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl bg-[#101520] border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-3 transition-colors hover:border-slate-700"
                            >
                              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-[11px] flex items-center justify-center font-roboto shrink-0">
                                {idx + 1}
                              </span>

                              {/* File Type Select */}
                              <div className="w-full md:w-32">
                                <label className="block text-[10px] text-slate-500 mb-0.5">نوع فایل:</label>
                                <select
                                  value={link.file_type || 'data'}
                                  onChange={(e) => handleUpdateDownloadLink(idx, "file_type", e.target.value)}
                                  className="w-full bg-[#141b29] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-bold"
                                >
                                  <option value="data">دیتای رسمی</option>
                                  <option value="cheat">چیت و ترینر</option>
                                  <option value="dlc">الحاقی (DLC)</option>
                                  <option value="subtitle">زیرنویس فارسی</option>
                                  <option value="dubbing">دوبله اختصاصی</option>
                                </select>
                              </div>

                              {/* Part Name */}
                              <div className="w-full md:w-36">
                                <label className="block text-[10px] text-slate-500 mb-0.5">عنوان / نام پارت:</label>
                                <input
                                  type="text"
                                  value={link.part_name}
                                  onChange={(e) => handleUpdateDownloadLink(idx, "part_name", e.target.value)}
                                  placeholder="نام پارت"
                                  className="w-full bg-[#141b29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                                />
                              </div>

                              {/* Size GB */}
                              <div className="w-full md:w-20">
                                <label className="block text-[10px] text-slate-500 mb-0.5">حجم (GB):</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={link.file_size_gb}
                                  onChange={(e) =>
                                    handleUpdateDownloadLink(idx, "file_size_gb", parseFloat(e.target.value) || 0)
                                  }
                                  placeholder="حجم GB"
                                  className="w-full bg-[#141b29] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-roboto"
                                  dir="ltr"
                                />
                              </div>

                              {/* Required Tier */}
                              <div className="w-full md:w-28">
                                <label className="block text-[10px] text-slate-500 mb-0.5">اشتراک مجاز:</label>
                                <select
                                  value={link.required_tier || 'bronze'}
                                  onChange={(e) => handleUpdateDownloadLink(idx, "required_tier", e.target.value)}
                                  className="w-full bg-[#141b29] border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-purple-500 font-bold"
                                >
                                  <option value="free">رایگان (Free)</option>
                                  <option value="bronze">برنزی به بالا</option>
                                  <option value="silver">نقره‌ای به بالا</option>
                                  <option value="gold">طلایی (Gold)</option>
                                </select>
                              </div>

                              {/* Download URL */}
                              <div className="flex-1 w-full">
                                <label className="block text-[10px] text-slate-500 mb-0.5">آدرس لینک دانلود (URL):</label>
                                <input
                                  type="text"
                                  value={link.download_url}
                                  onChange={(e) => handleUpdateDownloadLink(idx, "download_url", e.target.value)}
                                  placeholder="https://cdn.drgame.ir/..."
                                  className="w-full bg-[#141b29] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-roboto"
                                  dir="ltr"
                                />
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-3 shrink-0 self-end md:self-center pt-2 md:pt-4">
                                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={link.is_active}
                                    onChange={(e) => handleUpdateDownloadLink(idx, "is_active", e.target.checked)}
                                    className="w-3.5 h-3.5 rounded text-purple-600 bg-slate-800 border-slate-700"
                                  />
                                  <span>فعال</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDownloadLink(idx)}
                                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="حذف این بخش"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Status Notifications */}
              {modalMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{modalMessage}</span>
                </div>
              )}

              {modalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">
                  همه تغییرات پس از ذخیره بلافاصله در فروشگاه اعمال خواهند شد.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950/40 transition-all"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>درحال ذخیره‌سازی...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>ذخیره کلیه اطلاعات بازی</span>
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
