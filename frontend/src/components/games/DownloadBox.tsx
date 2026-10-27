'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock,
  AlertTriangle,
  LogIn,
  CreditCard,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { GameDownloadLink } from '@/types/game';
import { MySubscriptionStatus } from '@/types/subscription';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
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
  const router = useRouter();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [selectedLinkForDownload, setSelectedLinkForDownload] = useState<GameDownloadLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mySubStatus, setMySubStatus] = useState<MySubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      setLoadingSub(true);
      apiRequest<MySubscriptionStatus>('/subscriptions/my-status')
        .then((res) => {
          if (isMounted) setMySubStatus(res);
        })
        .catch((err) => console.error('Failed to fetch subscription status:', err))
        .finally(() => {
          if (isMounted) setLoadingSub(false);
        });
    } else {
      setMySubStatus(null);
      setLoadingSub(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleCopy = (url: string, partNum: number, isAllowed: boolean) => {
    if (!isAllowed) return;
    navigator.clipboard.writeText(url);
    setCopiedPart(partNum);
    setTimeout(() => setCopiedPart(null), 2500);
  };

  const handleOpenDownloadModal = (link: GameDownloadLink, isAllowed: boolean) => {
    if (!isAllowed) return;
    setSelectedLinkForDownload(link);
    setIsModalOpen(true);
  };

  // Categorize links into 5 types
  const getCategorizedLinks = (tab: TabType) => {
    return links.filter((l) => {
      if (l.file_type) {
        return l.file_type.toLowerCase() === tab;
      }
      const name = (l.part_name || '').toLowerCase();
      if (tab === 'cheat') return name.includes('cheat') || name.includes('trainer') || name.includes('چیت');
      if (tab === 'dlc') return name.includes('dlc') || name.includes('اضافه') || name.includes('الحاقی');
      if (tab === 'subtitle') return name.includes('sub') || name.includes('زیرنویس');
      if (tab === 'dubbing') return name.includes('dub') || name.includes('دوبله') || name.includes('صوت');
      return !name.includes('cheat') && !name.includes('dlc') && !name.includes('زیرنویس') && !name.includes('دوبله');
    });
  };

  const currentTabLinks = getCategorizedLinks(activeTab);

  /**
   * 4-Rule Download Eligibility Checker:
   * 1. Is user logged in?
   * 2. Does user have an active subscription?
   * 3. Does user's subscription tier support this section/type?
   * 4. Does user's remaining quota cover the file size?
   */
  const checkEligibility = (link: GameDownloadLink) => {
    // Rule 1: Login Check
    if (!isAuthenticated) {
      return {
        allowed: false,
        reason: 'LOGIN_REQUIRED',
        badgeText: 'ورود به حساب الزامی است',
        buttonText: 'ورود جهت دانلود',
        action: () => setAuthModalOpen(true, 'otp'),
        icon: LogIn,
      };
    }

    // Rule 2: Active Subscription Check
    if (!mySubStatus?.has_active_subscription || !mySubStatus.tier) {
      return {
        allowed: false,
        reason: 'SUBSCRIPTION_REQUIRED',
        badgeText: 'نیازمند اشتراک فعال',
        buttonText: 'خرید اشتراک',
        action: () => router.push('/subscriptions'),
        icon: CreditCard,
      };
    }

    // Rule 3: Tier Feature Permission Check
    const tier = mySubStatus.tier;
    const fileType = (link.file_type || activeTab).toLowerCase() as TabType;
    let supportsFeature = true;
    let featureLabel = 'این بخش';

    if (fileType === 'data') {
      supportsFeature = tier.allow_data !== false;
      featureLabel = 'دیتای رسمی بازی';
    } else if (fileType === 'cheat') {
      supportsFeature = Boolean(tier.allow_cheat);
      featureLabel = 'چیت و ترینر';
    } else if (fileType === 'dlc') {
      supportsFeature = Boolean(tier.allow_dlc);
      featureLabel = 'بسته‌های الحاقی (DLC)';
    } else if (fileType === 'subtitle') {
      supportsFeature = Boolean(tier.allow_subtitles);
      featureLabel = 'زیرنویس فارسی';
    } else if (fileType === 'dubbing') {
      supportsFeature = Boolean(tier.allow_dubbing);
      featureLabel = 'دوبله فارسی';
    }

    if (!supportsFeature) {
      return {
        allowed: false,
        reason: 'FEATURE_UNSUPPORTED',
        badgeText: `غیرفعال در پلن ${tier.name_fa || tier.code}`,
        buttonText: 'ارتقا به پلن بالاتر',
        action: () => router.push('/subscriptions'),
        icon: ArrowUpRight,
      };
    }

    // Rule 4: Remaining Quota Check
    const remainingQuota = mySubStatus.quota?.remaining_quota_gb ?? 0;
    const fileSize = link.file_size_gb || 0;

    if (remainingQuota < fileSize) {
      return {
        allowed: false,
        reason: 'QUOTA_EXHAUSTED',
        badgeText: `سهمیه ناکافی (${remainingQuota.toFixed(1)} GB مانده)`,
        buttonText: 'افزایش سهمیه دانلود',
        action: () => router.push('/subscriptions'),
        icon: AlertTriangle,
      };
    }

    // All 4 Checks Passed!
    return {
      allowed: true,
      reason: 'READY',
      badgeText: 'مجاز برای دانلود',
      buttonText: 'دانلود مستقیم',
      action: () => handleOpenDownloadModal(link, true),
      icon: Download,
    };
  };

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
    <div id="download-section" className="rounded-3xl bg-[#0d121f] border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl text-right font-vazir" dir="rtl">
      {/* Box Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <Download className="w-5 h-5 text-cyan-400" />
            <span>باکس دانلود چندمنظوره نیم‌بهاء دکتر گیم</span>
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            سرورهای پرسرعت ابری داخلی با محاسبه ترافیک ۵۰٪ نیم‌بهاء مخابراتی
          </p>
        </div>

        {/* User Quota & Subscription Status Pill */}
        {isAuthenticated && mySubStatus?.has_active_subscription && mySubStatus.tier && (
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
            <span className="text-text-muted">پلن:</span>
            <span className="font-bold text-cyan-400">{mySubStatus.tier.name_fa}</span>
            <span className="text-slate-600">|</span>
            <span className="text-text-muted">باقیمانده سهمیه:</span>
            <span className="font-bold text-emerald-400 font-roboto" dir="ltr">
              {(mySubStatus.quota?.remaining_quota_gb ?? 0).toFixed(1)} GB
            </span>
          </div>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0">
            <ShieldAlert className="w-4 h-4" />
            <span>ورود به حساب جهت دانلود الزامی است</span>
          </div>
        )}
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
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
          {currentTabLinks.map((link) => {
            const eligibility = checkEligibility(link);
            const ActionIcon = eligibility.icon;

            return (
              <div
                key={link.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  eligibility.allowed
                    ? 'bg-[#141b2d] border-white/5 hover:border-cyan-500/30'
                    : 'bg-[#0f1422]/70 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl font-roboto font-black text-sm flex items-center justify-center shrink-0 border ${
                      eligibility.allowed
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-500'
                    }`}
                  >
                    #{link.part_number}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs sm:text-sm font-bold ${eligibility.allowed ? 'text-white' : 'text-slate-400'}`}>
                        {link.part_name}
                      </h4>
                      {getTierBadge(link.required_tier)}

                      {/* Eligibility Status Tag */}
                      {!eligibility.allowed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{eligibility.badgeText}</span>
                        </span>
                      )}
                      {eligibility.allowed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          مجاز برای دانلود
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-roboto">
                      <HardDrive className="w-3.5 h-3.5 text-text-secondary" />
                      <span>حجم: {link.file_size_gb} GB</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  {/* Copy Link Button (Only active if eligible) */}
                  <button
                    type="button"
                    disabled={!eligibility.allowed}
                    onClick={() => handleCopy(link.download_url, link.part_number, eligibility.allowed)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                      eligibility.allowed
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-text-secondary hover:text-white cursor-pointer'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    title={eligibility.allowed ? 'کپی لینک مستقیم فایل' : 'دانلود برای شما مجاز نیست'}
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

                  {/* Download Action Button (Dynamic Gray/Disabled vs Glowing Amber) */}
                  {eligibility.allowed ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDownloadModal(link, true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>دانلود مستقیم</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={eligibility.action}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold text-xs transition-all cursor-pointer shadow-md hover:border-slate-600"
                    >
                      <ActionIcon className="w-4 h-4 text-amber-400" />
                      <span>{eligibility.buttonText}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
