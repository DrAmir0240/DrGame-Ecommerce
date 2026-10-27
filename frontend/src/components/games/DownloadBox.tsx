'use client';

import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  HardDrive,
  ShieldCheck,
  Zap,
  Sparkles,
  FileText,
  Headphones,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { GameDownloadLink } from '@/types/game';
import DownloadConfirmModal from './DownloadConfirmModal';

interface DownloadBoxProps {
  links: GameDownloadLink[];
  gameTitle: string;
}

type TabType = 'data' | 'cheat' | 'dlc' | 'subtitle' | 'dubbing';

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'data', label: 'دیتای رسمی بازی', icon: HardDrive },
  { id: 'cheat', label: 'چیت و ترینر', icon: Zap },
  { id: 'dlc', label: 'بسته‌های الحاقی (DLC)', icon: Sparkles },
  { id: 'subtitle', label: 'زیرنویس فارسی', icon: FileText },
  { id: 'dubbing', label: 'دوبله اختصاصی', icon: Headphones },
];

export default function DownloadBox({ links, gameTitle }: DownloadBoxProps) {
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [selectedLinkForDownload, setSelectedLinkForDownload] = useState<GameDownloadLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = (url: string, partNum: number) => {
    navigator.clipboard.writeText(url);
    setCopiedPart(partNum);
    setTimeout(() => setCopiedPart(null), 2500);
  };

  const handleOpenDownloadModal = (link: GameDownloadLink) => {
    setSelectedLinkForDownload(link);
    setIsModalOpen(true);
  };

  // Categorize links into 5 types
  const getCategorizedLinks = (tab: TabType) => {
    return links.filter((l) => {
      if (l.file_type) {
        return l.file_type.toLowerCase() === tab;
      }
      // Heuristic categorization based on part_name
      const name = (l.part_name || '').toLowerCase();
      if (tab === 'cheat') return name.includes('cheat') || name.includes('trainer') || name.includes('چیت');
      if (tab === 'dlc') return name.includes('dlc') || name.includes('اضافه') || name.includes('الحاقی');
      if (tab === 'subtitle') return name.includes('sub') || name.includes('زیرنویس');
      if (tab === 'dubbing') return name.includes('dub') || name.includes('دوبله') || name.includes('صوت');
      // Default to data
      return !name.includes('cheat') && !name.includes('dlc') && !name.includes('زیرنویس') && !name.includes('دوبله');
    });
  };

  const currentTabLinks = getCategorizedLinks(activeTab);

  // Fallback: If no links exist specifically in other tabs, show sample or empty
  const getTierBadge = (tier?: string) => {
    const t = (tier || 'gold').toLowerCase();
    if (t.includes('free') || t.includes('رایگان')) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          رایگان
        </span>
      );
    }
    if (t.includes('bronze') || t.includes('برنز')) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
          برنزی+
        </span>
      );
    }
    if (t.includes('silver') || t.includes('نقره')) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-300/15 text-slate-300 border border-slate-300/30">
          نقره‌ای+
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        طلایی
      </span>
    );
  };

  return (
    <div id="download-section" className="rounded-3xl bg-[#0d121f] border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl text-right font-vazir">
      {/* Box Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <Download className="w-5 h-5 text-cyan-400" />
            <span>باکس دانلود چندمنظوره نیم‌بهاء</span>
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            سرورهای پرسرعت ابری داخلی با محاسبه ترافیک ۵۰٪ نیم‌بهاء مخابراتی
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>ترافیک داخلی و تضمین سلامت فایل</span>
        </div>
      </div>

      {/* 5 Distinct Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 custom-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = getCategorizedLinks(tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                  : 'bg-[#141b2d] border border-white/5 text-text-secondary hover:text-white hover:border-white/15'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-roboto ${
                    isActive ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-white/10 text-text-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content: List of Parts / Files */}
      {currentTabLinks.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-[#141b2d]/50 border border-white/5 space-y-2">
          <Download className="w-8 h-8 text-text-muted mx-auto opacity-50" />
          <h4 className="text-xs font-bold text-white">هنوز فایلی در این دسته‌بندی بارگذاری نشده است</h4>
          <p className="text-[11px] text-text-muted max-w-xs mx-auto">
            تیم فنی دکتر گیم به زودی فایل‌های این بخش را پس از تست کامل سلامت بر روی سرور بارگذاری خواهند کرد.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentTabLinks.map((link) => (
            <div
              key={link.id}
              className="p-4 rounded-2xl bg-[#141b2d] border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-roboto font-black text-sm flex items-center justify-center shrink-0">
                  #{link.part_number}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-white">{link.part_name}</h4>
                    {getTierBadge(link.required_tier)}
                  </div>
                  <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-roboto">
                    <HardDrive className="w-3.5 h-3.5 text-text-secondary" />
                    <span>حجم: {link.file_size_gb} GB</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={() => handleCopy(link.download_url, link.part_number)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-all text-xs flex items-center gap-1.5"
                  title="کپی لینک مستقیم فایل"
                >
                  {copiedPart === link.part_number ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {copiedPart === link.part_number ? 'کپی شد' : 'کپی لینک'}
                  </span>
                </button>

                {/* Direct Download Button with Quota Deduction Warning Modal */}
                <button
                  type="button"
                  onClick={() => handleOpenDownloadModal(link)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>دانلود مستقیم</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quota Deduction Confirmation Modal */}
      <DownloadConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        link={selectedLinkForDownload}
        gameTitle={gameTitle}
      />
    </div>
  );
}
