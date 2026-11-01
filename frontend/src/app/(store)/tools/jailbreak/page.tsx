'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, ArrowRight, CheckCircle2, Terminal, Play, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

export default function JailbreakHubPage() {
  const { t } = useTranslation();
  const { settings, fetchSettings } = useSiteSettingsStore();
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionSuccess, setInjectionSuccess] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const primaryDns =
    settings?.jailbreak_dns ||
    settings?.header_dns_primary ||
    settings?.primary_dns ||
    '165.227.83.145';

  const secondaryDns =
    settings?.header_dns_secondary ||
    settings?.secondary_dns ||
    '192.241.221.79';

  const supportedFirmwares =
    settings?.jailbreak_supported_firmwares ||
    settings?.jailbreak_config?.supported_firmwares ||
    ['9.00', '9.60', '10.01', '11.00'];

  const handleLaunchJailbreak = () => {
    setIsInjecting(true);
    setInjectionSuccess(false);
    setLogs([t('tools.jailbreak.log1'), t('tools.jailbreak.log2')]);

    setTimeout(() => {
      setLogs((prev) => [...prev, t('tools.jailbreak.log3')]);
    }, 1200);

    setTimeout(() => {
      setLogs((prev) => [...prev, t('tools.jailbreak.log4')]);
      setIsInjecting(false);
      setInjectionSuccess(true);
    }, 2800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>{t('tools.backToTools')}</span>
      </Link>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
          <Cpu className="w-4 h-4" />
          <span>{t('tools.jailbreak.pageBadge')}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {t('tools.jailbreak.pageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {t('tools.jailbreak.pageDescription')}
        </p>

        {/* Dynamic Supported Firmwares Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="text-xs text-text-muted font-medium">فریمورهای پشتیبانی‌شده:</span>
          {supportedFirmwares.map((fw) => (
            <span
              key={fw}
              className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold"
            >
              FW {fw}
            </span>
          ))}
        </div>
      </div>

      {/* DNS Configuration Banner */}
      <div className="rounded-3xl glass-card border border-white/10 p-6 sm:p-8">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cosmic-purple" />
          <span>{t('tools.jailbreak.dnsTitle')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-xs text-text-muted block">{t('tools.jailbreak.primaryDns')}</span>
            <span className="text-lg font-black text-emerald-400 font-mono tracking-wider" dir="ltr">
              {primaryDns}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-xs text-text-muted block">{t('tools.jailbreak.secondaryDns')}</span>
            <span className="text-lg font-black text-cyan-400 font-mono tracking-wider" dir="ltr">
              {secondaryDns}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-text-muted mt-4">
          {t('tools.jailbreak.dnsNote')}
        </p>
      </div>

      {/* Interactive Payload Launcher */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">{t('tools.jailbreak.injectTitle')}</h3>
          <p className="text-xs text-text-secondary">
            {t('tools.jailbreak.injectDescription')}
          </p>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <button
            onClick={handleLaunchJailbreak}
            disabled={isInjecting}
            className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-cosmic-purple to-pink-500 hover:opacity-95 text-white font-black text-sm shadow-neon-purple transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-5 h-5 fill-current ${isInjecting ? 'animate-spin' : ''}`} />
            <span>{isInjecting ? t('tools.jailbreak.injecting') : t('tools.jailbreak.startButton')}</span>
          </button>
        </div>

        {/* Logs Terminal Output */}
        {logs.length > 0 && (
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-1.5 dir-ltr text-left">
            {logs.map((log, i) => (
              <div key={i} className="text-emerald-400">
                {log}
              </div>
            ))}
            {injectionSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-sans text-start flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{t('tools.jailbreak.success')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
