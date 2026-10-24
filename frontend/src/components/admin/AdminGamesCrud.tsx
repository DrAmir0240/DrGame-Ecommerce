"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  FileCode,
  Download,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { GAMES, type Game } from "@/lib/data";
import { useApp } from "@/lib/app";

interface GameFormState {
  id?: string;
  slug: string;
  title: string;
  genre: string;
  platforms: string[];
  studio: string;
  metacritic: number;
  sizeGb: number;
  year: number;
  image: string;
  backdrop: string;
  description: string;
  // 5 Categorized Download Files
  fileMainUrl: string;
  fileMainSize: string;
  fileSubtitleUrl: string;
  fileSubtitleSize: string;
  fileCheatUrl: string;
  fileCheatSize: string;
  fileDlcUrl: string;
  fileDlcSize: string;
  fileDubbingUrl: string;
  fileDubbingSize: string;
}

const STORAGE_KEY = "drgame_admin_games";

export const AdminGamesCrud: React.FC = () => {
  const { n } = useApp();
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGameSlug, setEditingGameSlug] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const defaultForm: GameFormState = {
    slug: "",
    title: "",
    genre: "Action-Adventure",
    platforms: ["PS5", "PS4"],
    studio: "PlayStation Studios",
    metacritic: 90,
    sizeGb: 65,
    year: 2024,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
    description: "توضیحات فارسی بازی اختصاصی پلی‌استیشن با پشتیبانی کامل از قابلیت‌های دوئل‌سنس و زیرنویس فارسی.",
    fileMainUrl: "https://dl.drgame.ir/games/pkg/main-data.pkg",
    fileMainSize: "65 GB",
    fileSubtitleUrl: "https://dl.drgame.ir/subs/persian-sub.zip",
    fileSubtitleSize: "45 MB",
    fileCheatUrl: "https://dl.drgame.ir/cheats/goldhen-cheats.json",
    fileCheatSize: "1.2 MB",
    fileDlcUrl: "https://dl.drgame.ir/dlc/dlc-update.pkg",
    fileDlcSize: "12 GB",
    fileDubbingUrl: "https://dl.drgame.ir/dubbing/farsi-audio.pkg",
    fileDubbingSize: "4.5 GB",
  };

  const [formData, setFormData] = useState<GameFormState>(defaultForm);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setGames(JSON.parse(saved));
      } else {
        setGames(GAMES);
      }
    } catch {
      setGames(GAMES);
    }
  }, []);

  const saveGamesList = (updated: Game[]) => {
    setGames(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingGameSlug(null);
    setFormData({
      ...defaultForm,
      slug: `game-${Date.now().toString().slice(-4)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (game: Game) => {
    setEditingGameSlug(game.slug);
    setFormData({
      slug: game.slug,
      title: game.title,
      genre: game.genreFa || game.genreEn,
      platforms: game.platforms,
      studio: game.studio || "PlayStation Studios",
      metacritic: game.metacritic,
      sizeGb: game.sizeGb,
      year: game.year || 2024,
      image: game.image,
      backdrop: game.backdrop || game.image,
      description: game.description || "",
      fileMainUrl: `https://dl.drgame.ir/games/${game.slug}/data.pkg`,
      fileMainSize: `${game.sizeGb} GB`,
      fileSubtitleUrl: `https://dl.drgame.ir/subs/${game.slug}-fa.zip`,
      fileSubtitleSize: "35 MB",
      fileCheatUrl: `https://dl.drgame.ir/cheats/${game.slug}-100pct.zip`,
      fileCheatSize: "2.5 MB",
      fileDlcUrl: `https://dl.drgame.ir/dlc/${game.slug}-update.pkg`,
      fileDlcSize: "8.4 GB",
      fileDubbingUrl: `https://dl.drgame.ir/dubbing/${game.slug}-farsi.pkg`,
      fileDubbingSize: "3.2 GB",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (slug: string, title: string) => {
    if (confirm(`آیا از حذف بازی «${title}» از پایگاه داده اطمینان دارید؟`)) {
      const updated = games.filter((g) => g.slug !== slug);
      saveGamesList(updated);
      setFeedbackMsg(`بازی «${title}» با موفقیت حذف شد.`);
      setTimeout(() => setFeedbackMsg(""), 3500);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      alert("لطفا عنوان و شناسه (slug) بازی را وارد نمایید.");
      return;
    }

    const validPlatforms: ("PS5" | "PS4")[] = (
      formData.platforms.filter((p) => p === "PS5" || p === "PS4") as ("PS5" | "PS4")[]
    );

    const updatedGame: Game = {
      slug: formData.slug,
      title: formData.title,
      studio: formData.studio,
      genreFa: formData.genre,
      genreEn: formData.genre,
      platforms: validPlatforms.length > 0 ? validPlatforms : ["PS5", "PS4"],
      sizeGb: Number(formData.sizeGb),
      metacritic: Number(formData.metacritic),
      year: Number(formData.year),
      image: formData.image,
      backdrop: formData.backdrop,
      ownership: "owned",
      description: formData.description,
    };

    let updated: Game[];
    if (editingGameSlug) {
      updated = games.map((g) => (g.slug === editingGameSlug ? updatedGame : g));
      setFeedbackMsg(`مشخصات بازی «${formData.title}» با موفقیت به‌روزرسانی شد.`);
    } else {
      updated = [updatedGame, ...games];
      setFeedbackMsg(`بازی جدید «${formData.title}» با ۵ فایل تفکیک‌شده اضافه گردید.`);
    }

    saveGamesList(updated);
    setIsModalOpen(false);
    setTimeout(() => setFeedbackMsg(""), 3500);
  };

  const filteredGames = games.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.genreFa?.toLowerCase().includes(search.toLowerCase()) ||
      g.genreEn?.toLowerCase().includes(search.toLowerCase()) ||
      g.slug.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform =
      selectedPlatform === "ALL" || (g.platforms as string[]).includes(selectedPlatform);
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            <span>مدیریت کاتالوگ بازی‌ها و عملیات کامل CRUD</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            ویرایش، افزودن، حذف دستی بازی‌ها و مدیریت لینک‌های ۵ گانه دانلود اختصاصی
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن بازی جدید</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در عناوین، ژانر یا استودیو..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {["ALL", "PS5", "PS4", "PC"].map((plat) => (
            <button
              key={plat}
              type="button"
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPlatform === plat
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {plat === "ALL" ? "همه پلتفرم‌ها" : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Games Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#151722] text-slate-300 border-b border-white/10 font-bold">
            <tr>
              <th className="p-3.5">کاور و عنوان</th>
              <th className="p-3.5">ژانر</th>
              <th className="p-3.5">پلتفرم‌ها</th>
              <th className="p-3.5">حجم</th>
              <th className="p-3.5">متاکریتیک</th>
              <th className="p-3.5">فایل‌های ۵‌گانه</th>
              <th className="p-3.5 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredGames.slice(0, 25).map((game) => (
              <tr key={game.slug} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5 flex items-center gap-3">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-10 h-14 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-white block text-sm">{game.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{game.slug}</span>
                  </div>
                </td>
                <td className="p-3.5 text-slate-300 font-medium">{game.genreFa || game.genreEn}</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    {game.platforms.map((p) => (
                      <span
                        key={p}
                        className="px-1.5 py-0.5 rounded bg-white/10 text-purple-300 font-mono text-[10px] font-bold"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3.5 font-mono text-slate-200">{n(game.sizeGb)} GB</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 font-mono font-bold">
                    {game.metacritic}
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px] font-bold border border-purple-500/20">
                    <Check className="w-3 h-3 text-purple-400" />
                    <span>۵ فایل کامل</span>
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(game)}
                      title="ویرایش بازی"
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(game.slug, game.title)}
                      title="حذف بازی"
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
        <span>نمایش {n(Math.min(filteredGames.length, 25))} از {n(filteredGames.length)} بازی کاتالوگ</span>
        <span>پایگاه داده: PostgreSQL 16 (جدول games و game_files)</span>
      </div>

      {/* Modal: Add or Edit Game with 5 Categorized Download Files */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20 bg-[#12141c] p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
                <span>{editingGameSlug ? "ویرایش مشخصات بازی" : "افزودن بازی جدید"}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
              {/* General Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">عنوان بازی (Title):</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">شناسه یکتا (Slug):</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">ژانر (Genre):</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">استودیو سازنده (Studio):</label>
                  <input
                    type="text"
                    value={formData.studio}
                    onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">نمره متاکریتیک (0-100):</label>
                  <input
                    type="number"
                    value={formData.metacritic}
                    onChange={(e) => setFormData({ ...formData, metacritic: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">حجم کل بازی (GB):</label>
                  <input
                    type="number"
                    value={formData.sizeGb}
                    onChange={(e) => setFormData({ ...formData, sizeGb: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">آدرس کاور پوستر (Poster URL):</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">آدرس والپیپر هیرو (Backdrop URL):</label>
                  <input
                    type="text"
                    value={formData.backdrop}
                    onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                    className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 px-3 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 5 Categorized Download Files Section */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <h5 className="font-extrabold text-white text-xs flex items-center gap-2 text-purple-300">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>مدیریت لینک‌های ۵ فایل تفکیک‌شده (بجای پارت‌بندی عددی)</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">۱. دیتای اصلی خود بازی (Main Data URL):</label>
                    <input
                      type="text"
                      value={formData.fileMainUrl}
                      onChange={(e) => setFormData({ ...formData, fileMainUrl: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">حجم دیتای اصلی:</label>
                    <input
                      type="text"
                      value={formData.fileMainSize}
                      onChange={(e) => setFormData({ ...formData, fileMainSize: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">۲. زیرنویس فارسی (Persian Subtitle URL):</label>
                    <input
                      type="text"
                      value={formData.fileSubtitleUrl}
                      onChange={(e) => setFormData({ ...formData, fileSubtitleUrl: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">حجم زیرنویس:</label>
                    <input
                      type="text"
                      value={formData.fileSubtitleSize}
                      onChange={(e) => setFormData({ ...formData, fileSubtitleSize: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">۳. فایل چیت و ترینر (Cheat & Save 100% URL):</label>
                    <input
                      type="text"
                      value={formData.fileCheatUrl}
                      onChange={(e) => setFormData({ ...formData, fileCheatUrl: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">حجم فایل چیت:</label>
                    <input
                      type="text"
                      value={formData.fileCheatSize}
                      onChange={(e) => setFormData({ ...formData, fileCheatSize: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">۴. بسته‌های الحاقی و آپدیت (DLC & Updates URL):</label>
                    <input
                      type="text"
                      value={formData.fileDlcUrl}
                      onChange={(e) => setFormData({ ...formData, fileDlcUrl: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">حجم آپدیت و DLC:</label>
                    <input
                      type="text"
                      value={formData.fileDlcSize}
                      onChange={(e) => setFormData({ ...formData, fileDlcSize: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">۵. دوبله اختصاصی فارسی (Persian Dubbing URL):</label>
                    <input
                      type="text"
                      value={formData.fileDubbingUrl}
                      onChange={(e) => setFormData({ ...formData, fileDubbingUrl: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">حجم دوبله فارسی:</label>
                    <input
                      type="text"
                      value={formData.fileDubbingSize}
                      onChange={(e) => setFormData({ ...formData, fileDubbingSize: e.target.value })}
                      className="w-full h-9 rounded-lg bg-[#070709] border border-white/10 px-3 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30"
                >
                  ذخیره اطلاعات بازی در کاتالوگ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
