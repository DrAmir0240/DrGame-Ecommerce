"use client";

import { useState } from "react";
import {
  Video,
  Play,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Sparkles,
  Wifi,
  HardDrive,
  Cpu,
  ShieldCheck,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";
import { TUTORIALS, TUTORIAL_CATEGORIES, TutorialVideo, DNS_CONFIG } from "@/lib/data";

export default function TutorialsPage() {
  const { t, n } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeVideo, setActiveVideo] = useState<TutorialVideo | null>(null);

  const filteredTutorials =
    selectedCategory === "all"
      ? TUTORIALS
      : TUTORIALS.filter((item) => item.category === selectedCategory);

  return (
    <Page>
      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <span className="font-latin text-xs font-bold uppercase text-accent-2">
                  {t("پخش ویدیو آموزشی", "Video Tutorial Player")}
                </span>
                <h3 className="text-base font-bold text-fg">
                  {t(activeVideo.titleFa, activeVideo.titleEn)}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src={activeVideo.videoUrl}
                controls
                autoPlay
                className="h-full w-full object-contain"
              />
            </div>

            {/* Steps & Instructions */}
            <div className="max-h-60 overflow-y-auto p-5">
              <h4 className="text-xs font-bold uppercase text-fg-2">
                {t("مراحل گام‌به‌گام پیاده‌سازی", "Step-by-Step Instructions")}
              </h4>
              <ul className="mt-3 flex flex-col gap-2.5">
                {(t("fa", "en") === "fa" ? activeVideo.stepsFa : activeVideo.stepsEn).map(
                  (step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-3 text-xs leading-relaxed"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft font-latin text-[11px] font-bold text-accent-2">
                        {n(idx + 1)}
                      </span>
                      <span className="text-fg">{step}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pb-12 pt-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
          <div className="absolute -end-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-2">
                  <Video size={18} />
                </span>
                <span className="font-latin text-xs font-bold uppercase tracking-wider text-accent-2">
                  DrGame Video Academy
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-fg md:text-3xl">
                {t("آموزش‌های ویدیویی و راهنمای کنسول", "Console Video Tutorials & Guides")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-fg-2">
                {t(
                  "راهنمای تصویری گام‌به‌گام تنظیم DNS، نصب دیتای پرسرعت PKG، مدیریت حافظه داخلی و هارد اکسترنال، و فعال‌سازی کپی‌خور برای کنسول‌های PS5 و PS4.",
                  "Step-by-step visual guides for DNS setup, rapid PKG data ingestion, storage management, and jailbreak workflows on PlayStation 5 and PS4."
                )}
              </p>
            </div>

            {/* DNS Quick Box */}
            <div className="flex flex-col gap-2 rounded-xl border border-line-strong bg-surface-2 p-4 md:w-80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-fg">
                  <Wifi size={14} className="text-accent-2" />
                  {t("دی‌ان‌اس اختصاصی CDN", "DrGame Edge DNS")}
                </span>
                <span className="text-success text-[11px] font-semibold">
                  {n(DNS_CONFIG.pingMs)} ms
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-xs">
                <span className="text-muted">Primary:</span>
                <span dir="ltr" className="font-mono font-bold text-accent-2">
                  {DNS_CONFIG.primary}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-xs">
                <span className="text-muted">Secondary:</span>
                <span dir="ltr" className="font-mono font-bold text-accent-2">
                  {DNS_CONFIG.secondary}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {TUTORIAL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-accent-2 text-white shadow-glow-sm"
                    : "border border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg"
                }`}
              >
                {t(cat.nameFa, cat.nameEn)}
              </button>
            );
          })}
        </div>

        {/* Video Grid */}
        <section>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutorials.map((tut) => (
              <Card
                key={tut.id}
                className="group overflow-hidden transition-all duration-300 hover:border-accent-2 hover:shadow-glow-sm"
              >
                {/* Thumbnail & Play Overlay */}
                <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                  <img
                    src={tut.thumbnail}
                    alt={tut.titleFa}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Play Button */}
                  <button
                    onClick={() => setActiveVideo(tut)}
                    aria-label="Play video"
                    className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-accent-2/90 text-white shadow-glow transition-transform duration-200 group-hover:scale-110 cursor-pointer"
                  >
                    <Play size={22} className="fill-white ms-1" />
                  </button>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 end-3 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 font-latin text-[11px] font-bold text-white">
                    <Clock size={12} />
                    <span>{tut.duration}</span>
                  </div>

                  {/* Level Pill */}
                  <div className="absolute top-3 start-3">
                    <span className="rounded-full bg-surface-2/90 px-2.5 py-0.5 text-[10px] font-bold text-fg backdrop-blur-md">
                      {t(tut.levelFa, tut.levelEn)}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Eye size={13} />
                      <span dir="ltr" className="font-latin">
                        {n(tut.views.toLocaleString())}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="text-accent-2 font-semibold">
                      {t(tut.category.toUpperCase(), tut.category.toUpperCase())}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-sm font-bold text-fg group-hover:text-accent-2 transition-colors">
                    {t(tut.titleFa, tut.titleEn)}
                  </h3>

                  <p className="line-clamp-2 text-xs text-fg-2 leading-relaxed">
                    {t(tut.descriptionFa, tut.descriptionEn)}
                  </p>

                  <div className="mt-2 pt-3 border-t border-line flex items-center justify-between">
                    <button
                      onClick={() => setActiveVideo(tut)}
                      className="flex items-center gap-1.5 text-xs font-bold text-accent-2 hover:underline cursor-pointer"
                    >
                      <span>{t("مشاهده ویدیو و مراحل", "Watch Video & Steps")}</span>
                      <ChevronRight size={14} className="rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
