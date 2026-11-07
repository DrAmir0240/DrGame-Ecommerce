'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Download,
  HardDrive,
  CheckCircle2,
  Gamepad2,
  Send,
  X,
  ShieldAlert,
  Zap,
  Check,
  Copy,
  Info,
  Tv,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useQuotaStore } from '@/stores/useQuotaStore';
import {
  GameDownloadLink,
  StorageFormatItem,
  GameDownloadOptions,
  HandoffExecuteResult,
} from '@/types/game';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation, DynamicText } from '@/i18n';
import { usePs5Handoff } from '@/hooks/usePs5Handoff';
import ConsoleStorageWidget from '@/components/console/ConsoleStorageWidget';

interface DownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  link?: GameDownloadLink | null;
  selectedFormat?: StorageFormatItem | null;
  downloadOptions?: GameDownloadOptions | null;
  gameTitle: string;
  gameId?: number;
  onSuccess?: () => void;
}

export default function DownloadConfirmModal({
  isOpen,
  onClose,
  link,
  selectedFormat,
  downloadOptions,
  gameTitle,
  gameId,
  onSuccess,
}: DownloadConfirmModalProps) {
  const { t, n, size } = useTranslation();
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { quota, fetchQuota } = useQuotaStore();
  const { handoffSecret, isPs5Device, clearHandoff, setManualHandoff } = usePs5Handoff();

  // Active package format
  const [activeFormat, setActiveFormat] = useState<StorageFormatItem | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'ps5' | 'ps4'>('ps5');
  const [customSecret, setCustomSecret] = useState('');
  const [showManualHandoffInput, setShowManualHandoffInput] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [ps5DirectSuccess, setPs5DirectSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  // Sync initial format selection
  useEffect(() => {
    if (selectedFormat) {
      setActiveFormat(selectedFormat);
      setSelectedPlatform(selectedFormat.platform === 'ps4' ? 'ps4' : 'ps5');
    } else if (downloadOptions?.available_formats && downloadOptions.available_formats.length > 0) {
      const rec = downloadOptions.available_formats.find(
        (f) => f.job_id === downloadOptions.recommended_job_id
      ) || downloadOptions.available_formats[0];
      setActiveFormat(rec);
      setSelectedPlatform(rec.platform === 'ps4' ? 'ps4' : 'ps5');
    }
  }, [selectedFormat, downloadOptions, isOpen]);

  if (!isOpen) return null;

  // Determine effective file size
  const fileSize = activeFormat?.size_gb ?? link?.file_size_gb ?? 0;
  const currentQuota = quota?.remaining_quota_gb || 0;
  const remainingAfter = Math.max(0, currentQuota - fileSize);
  const hasEnoughQuota = currentQuota >= fileSize;

  // Detect console status
  const clientDevice = downloadOptions?.client_device;
  const isConsole = Boolean(clientDevice?.is_console || isPs5Device);
  const detectedFirmware = clientDevice?.firmware;
  const recommendedFormat = downloadOptions?.recommended_format;

  // Formats filtered by selected platform
  const availableFormatsForPlatform = (downloadOptions?.available_formats || []).filter(
    (f) => f.platform === selectedPlatform || !f.platform
  );

  const effectiveSecret = handoffSecret || (customSecret.trim().length === 43 ? customSecret.trim() : null);

  const handleCopyChecksum = (sha: string) => {
    if (!sha) return;
    navigator.clipboard.writeText(sha);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2500);
  };

  const handleSelectFormatCategory = (cat: 'fpkg' | 'fat32') => {
    const matched = availableFormatsForPlatform.find((f) => f.format_category === cat) ||
      (downloadOptions?.available_formats || []).find((f) => f.format_category === cat);
    if (matched) {
      setActiveFormat(matched);
    }
  };

  /**
   * Action: Execute DPoP Handoff directly to Download32 on PS5
   */
  const handleSendToPs5 = async () => {
    if (!effectiveSecret) {
      setDownloadError('نشست اتصال به کنسول PS5 یافت نشد. لطفاً کد ۴۳ حرفی نشست کنسول خود را وارد نمایید یا سایت را از مرورگر کنسول باز کنید.');
      setShowManualHandoffInput(true);
      return;
    }
    if (!gameId) {
      setDownloadError('شناسه بازی معتبر نمی‌باشد.');
      return;
    }

    setIsProcessing(true);
    setDownloadError(null);

    const jobId = activeFormat?.job_id || (link ? `job_${link.id}` : `job_game_${gameId}_fpkg`);
    const chosenFormat = activeFormat?.format_category || (detectedFirmware && detectedFirmware <= 11.40 ? 'fpkg' : 'fat32');

    try {
      const res = await apiRequest<HandoffExecuteResult>(`/games/${gameId}/handoff`, {
        method: 'POST',
        body: JSON.stringify({
          job_id: jobId,
          handoff_secret: effectiveSecret,
          selected_format: chosenFormat,
        }),
      });

      if (res?.success) {
        clearHandoff();
        setPs5DirectSuccess(true);
        fetchQuota();
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setPs5DirectSuccess(false);
          onClose();
        }, 4000);
      } else {
        throw new Error(res?.message || 'ارسال به کنسول با خطا مواجه شد.');
      }
    } catch (err: any) {
      console.error('PS5 handoff error:', err);
      setDownloadError(err.message || 'خطا در برقراری ارتباط با اپلیکیشن Download32 در کنسول PS5');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Action: Trigger Direct File Download for PC/Desktop or Flash Drive
   */
  const handleConfirmDesktopDownload = async () => {
    setIsProcessing(true);
    setDownloadError(null);
    try {
      let finalDownloadUrl = link?.download_url || '';

      // Step 14/19 stream endpoint for atomic quota deduction + 302 redirect
      if (gameId && link?.id) {
        try {
          const streamRes = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'https://api.gamedr.ir/api'}/games/${gameId}/downloads/${link.id}/stream`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('drgame_access_token') || ''}`,
                'Accept-Language': (typeof window !== 'undefined' && localStorage.getItem('drgame_lang')) || 'fa',
              },
              redirect: 'manual',
            }
          );

          if (streamRes.status === 302 || streamRes.status === 307) {
            const location = streamRes.headers.get('Location');
            if (location) {
              finalDownloadUrl = location;
            }
          } else if (!streamRes.ok) {
            const errData = await streamRes.json().catch(() => ({}));
            throw new Error(errData.detail || 'خطا در صدور لینک دانلود');
          }
        } catch (err: any) {
          console.error('Failed to stream download via API:', err);
          setDownloadError(err.message || 'خطا در صدور لینک دانلود امن و کسر سهمیه');
          setIsProcessing(false);
          return;
        }
      }

      if (finalDownloadUrl) {
        const a = document.createElement('a');
        a.href = finalDownloadUrl;
        a.download = `${gameTitle}-${activeFormat?.format_category || link?.part_name || 'game'}`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setDownloadStarted(true);
      fetchQuota();
      setTimeout(() => fetchQuota(), 1500);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setDownloadStarted(false);
        onClose();
      }, 2500);
    } catch (e: any) {
      console.error('Download trigger error:', e);
      setDownloadError(e.message || 'خطا در دریافت فایل');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-start font-vazir">
      {/* Modal Container */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl bg-[#0b0f19] border border-white/15 p-5 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {isConsole ? <Gamepad2 className="w-5 h-5 text-purple-400" /> : <Download className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{isConsole ? t('downloadModal.sendDirectToPs5') : t('downloadModal.title')}</span>
                {activeFormat?.tag && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {activeFormat.tag}
                  </span>
                )}
              </h3>
              <p className="text-xs text-text-muted mt-0.5 truncate max-w-sm">{gameTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!isAuthenticated ? (
          /* Not Logged In */
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">{t('downloadModal.loginTitle')}</h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
                {t('downloadModal.loginBody')}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                setAuthModalOpen(true, 'otp');
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg transition-all"
            >
              {t('downloadModal.loginButton')}
            </button>
          </div>
        ) : !hasEnoughQuota ? (
          /* Quota Insufficient */
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('downloadModal.quotaTitle')}</span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                {t('downloadModal.quotaBody', {
                  size: size(fileSize),
                  remaining: size(currentQuota),
                })}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
              >
                {t('common.close')}
              </button>
              <Link
                href="/subscriptions"
                onClick={onClose}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{t('downloadModal.upgradeButton')}</span>
              </Link>
            </div>
          </div>
        ) : ps5DirectSuccess ? (
          /* PS5 Direct Success State */
          <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto shadow-neon-purple">
              <Gamepad2 className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-black text-white">دستور دانلود ۳۲ کاناله به کنسول PS5 ارسال شد!</h4>
              <p className="text-xs text-purple-200/85 max-w-md mx-auto leading-relaxed">
                بسته <strong>{activeFormat?.format_category?.toUpperCase() || 'FPKG'}</strong> با شناسه <strong>{activeFormat?.tag || 'PPSA'}</strong> به اپلیکیشن <strong>Download32</strong> متصل گردید. لطفاً به تلویزیون / کنسول خود بازگردید.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>مجوز امن DPoP فعال و سهمیه کسر شد</span>
            </div>
          </div>
        ) : downloadStarted ? (
          /* Desktop Download Started State */
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-white">{t('downloadModal.successTitle')}</h4>
            <p className="text-xs text-text-muted">
              {t('downloadModal.successBody')}
            </p>
          </div>
        ) : (
          /* Main Confirmation and Selection Body */
          <div className="space-y-4">
            {/* Live PS5 Storage Widget if active */}
            <ConsoleStorageWidget requiredGameSizeGb={fileSize} className="mb-2" />

            {/* Error banner if any */}
            {downloadError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{downloadError}</span>
              </div>
            )}

            {/* Console Device Banner vs Desktop Selection Step */}
            {isConsole ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 flex items-start gap-3">
                <Gamepad2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{t('downloadModal.consoleDetectedTitle')}</span>
                    {detectedFirmware && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                        FW {detectedFirmware}
                      </span>
                    )}
                  </div>
                  <p className="text-purple-200/80 leading-relaxed">
                    {clientDevice?.display_notice ||
                      `کنسول شما شناسایی شد. پکیج سازگار (${activeFormat?.format_category?.toUpperCase() || 'FPKG'}) به صورت هوشمند انتخاب گردید.`}
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop / Mobile: Interactive Format & Firmware Selector */
              <div className="space-y-3 p-4 rounded-2xl bg-[#141b2d] border border-white/5">
                {/* Step 1: Platform Selection if both PS5 and PS4 exist */}
                {(downloadOptions?.ps5_title_id && downloadOptions?.ps4_title_id) && (
                  <div className="space-y-1.5 pb-3 border-b border-white/5">
                    <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t('downloadModal.selectPlatformStep')}</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlatform('ps5')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedPlatform === 'ps5'
                            ? 'bg-blue-600/20 border-blue-400 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Gamepad2 className="w-4 h-4" />
                        <span>پلی‌استیشن ۵ (PS5)</span>
                        <span className="text-[10px] font-mono text-blue-300/80">
                          {downloadOptions.ps5_title_id}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPlatform('ps4')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          selectedPlatform === 'ps4'
                            ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Gamepad2 className="w-4 h-4" />
                        <span>پلی‌استیشن ۴ (PS4)</span>
                        <span className="text-[10px] font-mono text-indigo-300/80">
                          {downloadOptions.ps4_title_id}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Firmware Format Options (FPKG vs FAT32) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('downloadModal.selectFirmwareStep')}</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option A: FPKG */}
                    <div
                      onClick={() => handleSelectFormatCategory('fpkg')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        activeFormat?.format_category === 'fpkg'
                          ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                          : 'bg-white/5 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">
                          {t('downloadModal.fpkgOptionTitle')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                          FPKG
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        {t('downloadModal.fpkgOptionDesc')}
                      </p>
                    </div>

                    {/* Option B: FAT32 */}
                    <div
                      onClick={() => handleSelectFormatCategory('fat32')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        activeFormat?.format_category === 'fat32'
                          ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                          : 'bg-white/5 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">
                          {t('downloadModal.fat32OptionTitle')}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          FAT32
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        {t('downloadModal.fat32OptionDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected File Details */}
            <div className="p-3.5 rounded-2xl bg-[#141b2d] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">{t('downloadModal.fileName')}</span>
                <span className="font-bold text-white truncate max-w-[280px]">
                  {activeFormat?.title || link?.part_name || t('downloadModal.partFallback', { number: n(link?.part_number || 1) })}
                </span>
              </div>

              {(activeFormat?.tag || downloadOptions?.ps5_title_id || downloadOptions?.ps4_title_id) && (
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">{t('downloadModal.titleIdLabel')}</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {activeFormat?.tag || downloadOptions?.ps5_title_id || downloadOptions?.ps4_title_id}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-text-muted">{t('downloadModal.fileSize')}</span>
                <span className="font-bold text-amber-400 font-roboto">{size(fileSize)}</span>
              </div>

              {activeFormat?.sha256 && (
                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                  <span className="text-text-muted">{t('downloadModal.sha256Label')}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <span className="truncate max-w-[170px]" title={activeFormat.sha256}>
                      {activeFormat.sha256.slice(0, 16)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyChecksum(activeFormat.sha256!)}
                      className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-text-muted hover:text-white"
                      title={copiedChecksum ? t('downloadBox.checksumCopied') : t('downloadBox.copyChecksum')}
                    >
                      {copiedChecksum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quota Deduction Preview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[11px] text-text-muted block">{t('downloadModal.currentQuota')}</span>
                <span className="text-sm font-bold text-white font-roboto">
                  {size(currentQuota)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                <span className="text-[11px] text-cyan-300 block">{t('downloadModal.quotaAfter')}</span>
                <span className="text-sm font-bold text-cyan-400 font-roboto">
                  {size(remainingAfter)}
                </span>
              </div>
            </div>

            {/* Warning Note */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-amber-300">{t('downloadModal.warningTitle')}</strong>{' '}
                {t('downloadModal.warningBody', { size: size(fileSize) })}
              </p>
            </div>

            {/* Manual PS5 Handoff Secret Collapsible (For PC users wanting to push to console) */}
            {!isConsole && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualHandoffInput(!showManualHandoffInput)}
                  className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>ارسال مستقیم به کنسول PS5 از روی این سیستم (کد نشست)</span>
                </button>

                {showManualHandoffInput && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                    <p className="text-[11px] text-purple-200/80 leading-relaxed">
                      اگر اپلیکیشن Download32 در کنسول PS5 شما باز است، کد ۴۳ حرفی نمایش‌داده‌شده را اینجا وارد کنید:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSecret}
                        onChange={(e) => setCustomSecret(e.target.value)}
                        placeholder="کد ۴۳ حرفی نشست PS5..."
                        className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={handleSendToPs5}
                        disabled={isProcessing || customSecret.trim().length !== 43}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50"
                      >
                        ارسال
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all"
              >
                {t('common.cancel')}
              </button>

              {/* If on PS5 console or handoff secret present */}
              {(isConsole || effectiveSecret) ? (
                <button
                  type="button"
                  onClick={handleSendToPs5}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs shadow-neon-purple transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{isProcessing ? t('downloadModal.processing') : 'ارسال مستقیم به Download32 در PS5'}</span>
                </button>
              ) : (
                /* Desktop/Mobile download button */
                <button
                  type="button"
                  onClick={handleConfirmDesktopDownload}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>{isProcessing ? t('downloadModal.processing') : t('downloadModal.confirm')}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
