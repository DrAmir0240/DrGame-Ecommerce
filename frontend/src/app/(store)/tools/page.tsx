'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Cpu, ArrowLeft, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ToolsHubPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cosmic-purple/10 border border-cosmic-purple/30 text-cosmic-purple text-xs font-bold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>{t('tools.hubBadge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
          {t('tools.hubTitle')}
        </h1>
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
          {t('tools.hubDescription')}
        </p>

      </div>

      {/* Tools Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
        {/* Tool 1: Gamepad Tester */}
        <Link
          href="/tools/gamepad"
          className="group relative rounded-3xl glass-card border border-white/10 hover:border-cosmic-purple/50 p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 shadow-xl bg-surface-card/60"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-cosmic-purple/20 border border-cosmic-purple/40 text-cosmic-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-8 h-8" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                {t('tools.onlineBadge')}
              </span>
              <span className="text-[10px] text-text-muted font-roboto font-semibold">DualSense / DualShock</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-cosmic-purple transition-colors mb-3">
              {t('tools.gamepadCardTitle')}
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              {t('tools.gamepadCardDescription')}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold text-white group-hover:text-cosmic-purple transition-colors">
            <span>{t('tools.startTest')}</span>
            <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </Link>

        {/* Tool 2: Jailbreak Hub */}
        <Link
          href="/tools/jailbreak"
          className="group relative rounded-3xl glass-card border border-white/10 hover:border-cyan-400/50 p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 shadow-xl bg-surface-card/60"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Cpu className="w-8 h-8" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold">
                {t('tools.dnsHostBadge')}
              </span>
              <span className="text-[10px] text-text-muted font-roboto font-semibold">PS4 & PS5 Jailbreak</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-3">
              {t('tools.jailbreakCardTitle')}
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              {t('tools.jailbreakCardDescription')}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
            <span>{t('tools.enterJailbreak')}</span>
            <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

