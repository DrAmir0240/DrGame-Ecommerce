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
import { useTranslation, DynamicText } from '@/i18n';
import DownloadConfirmModal from './DownloadConfirmModal';

interface DownloadBoxProps {
  links: GameDownloadLink[];
  gameTitle: string;
  gameId?: number;
}

type TabType = 'data' | 'cheat' | 'dlc' | 'subtitle' | 'dubbing';

const TABS: { id: TabType; labelKey: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'data', labelKey: 'downloadBox.tabs.data', icon: HardDrive },
  { id: 'cheat', labelKey: 'downloadBox.tabs.cheat', icon: Zap },
  { id: 'dlc', labelKey: 'downloadBox.tabs.dlc', icon: Sparkles },
  { id: 'subtitle', labelKey: 'downloadBox.tabs.subtitle', icon: FileText },
  { id: 'dubbing', labelKey: 'downloadBox.tabs.dubbing', icon: Headphones },
];

const FEATURE_LABEL_KEYS: Record<string, string> = {
  data: 'downloadBox.features.data',
  cheat: 'downloadBox.features.cheat',
  dlc: 'downloadBox.features.dlc',
  subtitle: 'downloadBox.features.subtitle',
  dubbing: 'downloadBox.features.dubbing',
};

export default function DownloadBox({ links, gameTitle, gameId }: DownloadBoxProps) {
  const router = useRouter();
  const { t, n, size } = useTranslation();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [selectedLinkForDownload, setSelectedLinkForDownload] = useState<GameDownloadLink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mySubStatus, setMySubStatus] = useState<MySubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [dynamicFiles, setDynamicFiles] = useState<GameDownloadLink[]>([]);

  // Fetch real 5-part download files from backend if gameId is present
  useEffect(() => {
    if (gameId) {
      apiRequest<any[]>(`/games/${gameId}/downloads`)
        .then((files) => {
          if (files && Array.isArray(files) && files.length > 0) {
            const mapped: GameDownloadLink[] = files.map((f, idx) => ({
              id: f.id,
              part_number: idx + 1,
              part_name: f.title || f.part_name || `Part ${idx + 1}`,
              file_size_gb: f.file_size_gb || 0,
              download_url: f.download_url,
              is_active: f.is_active ?? true,
              file_type: f.file_type || 'data',
              required_tier: (f.allowed_tiers && f.allowed_tiers[0]) || 'gold',
            }));
            setDynamicFiles(mapped);
          }
        })
        .catch(() => {
          // Graceful fallback to links prop
        });
    }
  }, [gameId]);

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

  // Combine dynamic 5-part files with initial links
  const effectiveLinks = dynamicFiles.length > 0
    ? [...dynamicFiles, ...links.filter((l) => !dynamicFiles.some((df) => df.id === l.id))]
    : links;

  // Categorize links into 5 types
  const getCategorizedLinks = (tab: TabType) => {
    return effectiveLinks.filter((l) => {
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
        badgeText: t('downloadBox.eligibility.loginBadge'),
        buttonText: t('downloadBox.eligibility.loginButton'),
        action: () => setAuthModalOpen(true, 'otp'),
        icon: LogIn,
      };
    }

    // Rule 2: Active Subscription Check
    if (!mySubStatus?.has_active_subscription || !mySubStatus.tier) {
      return {
        allowed: false,
        reason: 'SUBSCRIPTION_REQUIRED',
        badgeText: t('downloadBox.eligibility.subscriptionBadge'),
        buttonText: t('downloadBox.eligibility.subscriptionButton'),
        action: () => router.push('/subscriptions'),
        icon: CreditCard,
      };
    }

    // Rule 3: Tier Feature Permission Check
    const tier = mySubStatus.tier;
    const fileType = (link.file_type || activeTab).toLowerCase() as TabType;
    let supportsFeature = true;
    let featureLabel = t(FEATURE_LABEL_KEYS[fileType] ?? 'downloadBox.features.other');

    if (fileType === 'data') {
      supportsFeature = tier.allow_data !== false;
      featureLabel = t('downloadBox.features.data');
    } else if (fileType === 'cheat') {
      supportsFeature = tier.allow_cheat === true;
      featureLabel = t('downloadBox.features.cheat');
    } else if (fileType === 'dlc') {
      supportsFeature = tier.allow_dlc === true;
      featureLabel = t('downloadBox.features.dlc');
    } else if (fileType === 'subtitle') {
      supportsFeature = tier.allow_subtitles === true;
      featureLabel = t('downloadBox.features.subtitle');
    } else if (fileType === 'dubbing') {
      supportsFeature = tier.allow_dubbing === true;
      featureLabel = t('downloadBox.features.dubbing');
    }

    if (!supportsFeature) {
      return {
        allowed: false,
        reason: 'TIER_RESTRICTED',
        badgeText: t('downloadBox.eligibility.tierRestrictedBadge', { tier: mySubStatus.tier.name_fa || mySubStatus.tier.name || '' }),
        buttonText: t('downloadBox.eligibility.tierRestrictedButton', { feature: featureLabel }),
        action: () => router.push('/subscriptions'),
        icon: Lock,
      };
    }

    // Rule 4: Quota Adequacy Check
    const remainingQuota = mySubStatus.quota?.remaining_quota_gb ?? 0;
    const requiredSize = link.file_size_gb || 0;
    if (remainingQuota < requiredSize) {
      return {
        allowed: false,
        reason: 'QUOTA_EXCEEDED',
        badgeText: t('downloadBox.eligibility.quotaExceededBadge'),
        buttonText: t('downloadBox.eligibility.quotaExceededButton'),
        action: () => router.push('/subscriptions'),
        icon: AlertTriangle,
      };
    }

    // All clear!
    return {
      allowed: true,
      reason: 'READY',
      badgeText: null,
      buttonText: t('downloadBox.eligibility.downloadButton'),
      action: () => handleOpenDownloadModal(link, true),
      icon: Download,
    };
  };

  const getTierBadge = (tier?: string) => {
    const tStr = (tier || 'gold').toLowerCase();
    const tierKey = tStr === 'bronze' ? 'bronze' : tStr === 'silver' ? 'silver' : 'gold';
    if (tierKey.includes('bronze')) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#cd7f32]/15 text-[#e59b5f] border border-[#cd7f32]/30">
          {t('downloadBox.tiers.bronze')}
        </span>
      );
    }
    if (tierKey.includes('silver')) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-300/15 text-slate-300 border border-slate-300/30">
          {t('downloadBox.tiers.silver')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        {t('downloadBox.tiers.gold')}
      </span>
    );
  };

  return (
    <div id="download-section" className="rounded-3xl bg-[#0d121f] border border-white/10 p-5 sm:p-7 space-y-6 shadow-2xl text-start font-vazir">
      {/* Box Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <Download className="w-5 h-5 text-cyan-400" />
            <span>{t('downloadBox.title')}</span>
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            {t('downloadBox.subtitle')}
          </p>
        </div>

        {/* User Quota & Subscription Status Pill */}
        {isAuthenticated && mySubStatus?.has_active_subscription && mySubStatus.tier && (
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs">
            <span className="text-text-muted">{t('downloadBox.plan')}</span>
            <span className="font-bold text-cyan-400"><DynamicText text={mySubStatus.tier.name_fa || mySubStatus.tier.name || ''} /></span>
            <span className="text-slate-600">|</span>
            <span className="text-text-muted">{t('downloadBox.remainingQuota')}</span>
            <span className="font-bold text-emerald-400 font-roboto" dir="ltr">
              {size(mySubStatus.quota?.remaining_quota_gb ?? 0)}
            </span>
          </div>
        )}

        {!isAuthenticated && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0">
            <ShieldAlert className="w-4 h-4" />
            <span>{t('downloadBox.loginBanner')}</span>
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
              <span>{t(tab.labelKey)}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-roboto ${
                    isActive ? 'bg-cyan-400 text-slate-950 font-black' : 'bg-white/10 text-text-muted'
                  }`}
                >
                  {n(count)}
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
          <h4 className="text-xs font-bold text-white">{t('downloadBox.emptyTitle')}</h4>
          <p className="text-[11px] text-text-muted max-w-xs mx-auto">
            {t('downloadBox.emptyBody')}
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
                className="group p-4 rounded-2xl bg-[#141b2d] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left File Information */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Part Number Badge */}
                    <span className="px-2 py-0.5 rounded-lg bg-white/5 text-cyan-400 font-bold font-roboto text-xs border border-white/5">
                      #{n(link.part_number)}
                    </span>

                    {/* Part Name */}
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                      <DynamicText text={link.part_name || t('downloadBox.partFallback', { number: n(link.part_number) })} />
                    </h4>

                    {/* Required Tier Badge */}
                    {getTierBadge(link.required_tier)}
                  </div>

                  {/* File Metadata Badges */}
                  <div className="flex items-center gap-4 text-xs text-text-muted pt-0.5">
                    <span className="flex items-center gap-1 font-roboto text-amber-400/90 font-medium">
                      <HardDrive className="w-3.5 h-3.5" />
                      {size(link.file_size_gb)}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {t('downloadBox.verifiedClean')}
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(link.download_url, link.part_number, eligibility.allowed)}
                    disabled={!eligibility.allowed}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      eligibility.allowed
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-text-secondary hover:text-white cursor-pointer'
                        : 'bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      eligibility.allowed
                        ? t('downloadBox.copyLink')
                        : eligibility.badgeText || t('downloadBox.permissionRequired')
                    }
                  >
                    {copiedPart === link.part_number ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {copiedPart === link.part_number ? t('common.copied') : t('downloadBox.copyLink')}
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
                      <span>{t('downloadBox.eligibility.downloadButton')}</span>
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
        gameId={gameId}
      />
    </div>
  );
}
