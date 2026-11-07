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
  ShieldAlert,
  Gamepad2,
  Tv,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  GameDownloadLink,
  StorageFormatItem,
  GameDownloadOptions,
  GameDetail,
} from '@/types/game';
import { MySubscriptionStatus } from '@/types/subscription';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation, DynamicText } from '@/i18n';
import { usePs5Handoff } from '@/hooks/usePs5Handoff';
import DownloadConfirmModal from './DownloadConfirmModal';
import ConsoleStorageWidget from '@/components/console/ConsoleStorageWidget';

interface DownloadBoxProps {
  links: GameDownloadLink[];
  gameTitle: string;
  gameId?: number;
  game?: GameDetail | null;
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

export default function DownloadBox({ links, gameTitle, gameId, game }: DownloadBoxProps) {
  const router = useRouter();
  const { t, n, size } = useTranslation();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { isPs5Device } = usePs5Handoff();

  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [copiedTitleId, setCopiedTitleId] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  const [selectedLinkForDownload, setSelectedLinkForDownload] = useState<GameDownloadLink | null>(null);
  const [selectedFormatForDownload, setSelectedFormatForDownload] = useState<StorageFormatItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mySubStatus, setMySubStatus] = useState<MySubscriptionStatus | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [dynamicFiles, setDynamicFiles] = useState<GameDownloadLink[]>([]);
  const [downloadOptions, setDownloadOptions] = useState<GameDownloadOptions | null>(null);

  // 1. Fetch dynamic download options (firmware detection + storage packages + Title IDs)
  useEffect(() => {
    if (gameId) {
      apiRequest<GameDownloadOptions>(`/games/${gameId}/download-options`)
        .then((options) => {
          if (options) {
            setDownloadOptions(options);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch game download options:', err);
        });

      // Also fetch auxiliary 5-part files (cheats, dlc, subtitles, dubbing)
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

  // 2. Fetch current user subscription & quota status
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

  const handleCopyLink = (url: string, partNum: number, isAllowed: boolean) => {
    if (!isAllowed) return;
    navigator.clipboard.writeText(url);
    setCopiedPart(partNum);
    setTimeout(() => setCopiedPart(null), 2500);
  };

  const handleCopyTitleId = (titleId: string) => {
    if (!titleId) return;
    navigator.clipboard.writeText(titleId);
    setCopiedTitleId(titleId);
    setTimeout(() => setCopiedTitleId(null), 2500);
  };

  const handleCopySha = (sha: string) => {
    if (!sha) return;
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2500);
  };

  const handleOpenLinkModal = (link: GameDownloadLink, isAllowed: boolean) => {
    if (!isAllowed) return;
    setSelectedLinkForDownload(link);
    setSelectedFormatForDownload(null);
    setIsModalOpen(true);
  };

  const handleOpenFormatModal = (format: StorageFormatItem, isAllowed: boolean) => {
    if (!isAllowed) return;
    setSelectedFormatForDownload(format);
    setSelectedLinkForDownload(null);
    setIsModalOpen(true);
  };

  // Combine dynamic files with initial links
  const effectiveLinks = dynamicFiles.length > 0
    ? [...dynamicFiles, ...links.filter((l) => !dynamicFiles.some((df) => df.id === l.id))]
    : links;

  // Categorize links for tabs other than data
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

  /**
   * 4-Rule Download Eligibility Checker
   */
  const checkEligibility = (fileSizeGb: number, fileType: TabType = 'data') => {
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
    if (remainingQuota < fileSizeGb) {
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
      action: () => {},
      icon: Download,
    };
  };

  const ps5TitleId = downloadOptions?.ps5_title_id || game?.ps5_title_id;
  const ps4TitleId = downloadOptions?.ps4_title_id || game?.ps4_title_id;
  const clientDevice = downloadOptions?.client_device;
  const isConsole = Boolean(clientDevice?.is_console || isPs5Device);
  const availableFormats = downloadOptions?.available_formats || [];
  const currentTabLinks = getCategorizedLinks(activeTab);

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

      {/* Official Sony Title IDs & Console Device Notification Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#141b2d] via-[#111827] to-[#141b2d] border border-white/10 space-y-3.5 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title ID Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>{t('downloadBox.titleId')}</span>
            </span>

            {ps5TitleId && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-text-muted font-normal">PS5:</span>
                <span className="font-mono tracking-wide">{ps5TitleId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyTitleId(ps5TitleId)}
                  className="hover:text-white p-0.5 transition-colors cursor-pointer"
                  title="کپی شناسه سونی PS5"
                >
                  {copiedTitleId === ps5TitleId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {ps4TitleId && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-bold shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-text-muted font-normal">PS4:</span>
                <span className="font-mono tracking-wide">{ps4TitleId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyTitleId(ps4TitleId)}
                  className="hover:text-white p-0.5 transition-colors cursor-pointer"
                  title="کپی شناسه سونی PS4"
                >
                  {copiedTitleId === ps4TitleId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {!ps5TitleId && !ps4TitleId && (
              <span className="text-xs text-text-muted font-mono">
                PPSA{String(gameId || '00000').padStart(5, '0')}
              </span>
            )}
          </div>

          {/* Device & Firmware Notice Badge */}
          {clientDevice && (
            <div className="text-xs">
              {isConsole ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-bold">
                  <Gamepad2 className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>{clientDevice.display_notice}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{t('downloadBox.desktopSelectNotice')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live PS5 Storage indicator when on console */}
        <ConsoleStorageWidget requiredGameSizeGb={availableFormats[0]?.size_gb || effectiveLinks[0]?.file_size_gb} />
      </div>

      {/* 5 Distinct Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 custom-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tab.id === 'data'
            ? Math.max(availableFormats.length, getCategorizedLinks('data').length)
            : getCategorizedLinks(tab.id).length;

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

      {/* Tab Content: Data Tab with Dynamic Storage Packages */}
      {activeTab === 'data' ? (
        <div className="space-y-4">
          {availableFormats.length > 0 ? (
            <div className="space-y-3">
              {availableFormats.map((fmt) => {
                const eligibility = checkEligibility(fmt.size_gb, 'data');
                const ActionIcon = eligibility.icon;
                const isRecommended = downloadOptions?.recommended_format === fmt.format_category ||
                  downloadOptions?.recommended_job_id === fmt.job_id;
                const isFpkg = fmt.format_category === 'fpkg';

                return (
                  <div
                    key={fmt.job_id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isRecommended
                        ? 'bg-gradient-to-r from-[#141b2d] via-[#101a30] to-[#141b2d] border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                        : 'bg-[#141b2d] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Left Package Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Format Category Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-black font-roboto border ${
                            isFpkg
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                              : 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          }`}
                        >
                          {isFpkg ? t('downloadBox.fpkgBadge') : t('downloadBox.fat32Badge')}
                        </span>

                        {/* Recommended Badge */}
                        {isRecommended && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{t('downloadBox.recommendedForYou')}</span>
                          </span>
                        )}

                        {/* Title ID Tag */}
                        {fmt.tag && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono">
                            {fmt.tag}
                          </span>
                        )}

                        {/* Release Version */}
                        {fmt.release_version && (
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
                            {fmt.release_version}
                          </span>
                        )}
                      </div>

                      {/* Package Title */}
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        {fmt.title}
                      </h4>

                      {/* Description / Instructions */}
                      <p className="text-xs text-text-muted leading-relaxed">
                        {isFpkg ? t('downloadBox.fpkgDesc') : t('downloadBox.fat32Desc')}
                      </p>

                      {/* Metadata row: Size & Clean Check & SHA-256 */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                        <span className="flex items-center gap-1 font-roboto text-amber-400 font-bold">
                          <HardDrive className="w-3.5 h-3.5" />
                          {size(fmt.size_gb)}
                        </span>

                        <span className="flex items-center gap-1 text-slate-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t('downloadBox.verifiedClean')}</span>
                        </span>

                        {fmt.sha256 && (
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                            <span>SHA: {fmt.sha256.slice(0, 12)}...</span>
                            <button
                              type="button"
                              onClick={() => handleCopySha(fmt.sha256!)}
                              className="hover:text-white p-0.5 cursor-pointer"
                              title="کپی هش SHA-256"
                            >
                              {copiedSha === fmt.sha256 ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Button */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                      {eligibility.allowed ? (
                        <button
                          type="button"
                          onClick={() => handleOpenFormatModal(fmt, true)}
                          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                            isConsole
                              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-neon-purple'
                              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                          }`}
                        >
                          {isConsole ? <Gamepad2 className="w-4 h-4" /> : <Download className="w-4 h-4 stroke-[2.5]" />}
                          <span>
                            {isConsole ? t('downloadBox.sendToPs5') : t('downloadBox.eligibility.downloadButton')}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={eligibility.action}
                          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-bold text-xs transition-all cursor-pointer shadow-md hover:border-slate-600"
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
          ) : currentTabLinks.length > 0 ? (
            /* Fallback to legacy parts if no dynamic packages yet */
            <div className="space-y-3">
              {currentTabLinks.map((link) => {
                const eligibility = checkEligibility(link.file_size_gb, 'data');
                const ActionIcon = eligibility.icon;

                return (
                  <div
                    key={link.id}
                    className="p-4 rounded-2xl bg-[#141b2d] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-white/5 text-cyan-400 font-bold font-roboto text-xs border border-white/5">
                          #{n(link.part_number)}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">
                          <DynamicText text={link.part_name || t('downloadBox.partFallback', { number: n(link.part_number) })} />
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-text-muted">
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

                    <div className="flex items-center gap-2 shrink-0">
                      {eligibility.allowed ? (
                        <button
                          type="button"
                          onClick={() => handleOpenLinkModal(link, true)}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
                        >
                          <Download className="w-4 h-4 stroke-[2.5]" />
                          <span>{t('downloadBox.eligibility.downloadButton')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={eligibility.action}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs"
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
          ) : (
            <div className="text-center py-12 rounded-2xl bg-[#141b2d]/50 border border-white/5 space-y-2">
              <Download className="w-8 h-8 text-text-muted mx-auto opacity-50" />
              <h4 className="text-xs font-bold text-white">{t('downloadBox.emptyTitle')}</h4>
              <p className="text-[11px] text-text-muted max-w-xs mx-auto">
                {t('downloadBox.emptyBody')}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Auxiliary Tabs: Cheats, DLC, Subtitles, Dubbing */
        currentTabLinks.length === 0 ? (
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
              const eligibility = checkEligibility(link.file_size_gb, activeTab);
              const ActionIcon = eligibility.icon;

              return (
                <div
                  key={link.id}
                  className="group p-4 rounded-2xl bg-[#141b2d] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 text-cyan-400 font-bold font-roboto text-xs border border-white/5">
                        #{n(link.part_number)}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                        <DynamicText text={link.part_name || t('downloadBox.partFallback', { number: n(link.part_number) })} />
                      </h4>
                    </div>
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

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(link.download_url, link.part_number, eligibility.allowed)}
                      disabled={!eligibility.allowed}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        eligibility.allowed
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-text-secondary hover:text-white cursor-pointer'
                          : 'bg-white/[0.02] border-white/5 text-slate-600 cursor-not-allowed opacity-60'
                      }`}
                      title={eligibility.allowed ? t('downloadBox.copyLink') : eligibility.badgeText || t('downloadBox.permissionRequired')}
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

                    {/* Download Action Button */}
                    {eligibility.allowed ? (
                      <button
                        type="button"
                        onClick={() => handleOpenLinkModal(link, true)}
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
        )
      )}

      {/* Dynamic Quota Deduction & Handoff Confirmation Modal */}
      <DownloadConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        link={selectedLinkForDownload}
        selectedFormat={selectedFormatForDownload}
        downloadOptions={downloadOptions}
        gameTitle={gameTitle}
        gameId={gameId}
      />
    </div>
  );
}
