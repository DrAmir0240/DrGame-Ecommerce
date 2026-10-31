'use client';

import React from 'react';
import Link from 'next/link';
import GamepadVisualizer from '@/components/tools/GamepadVisualizer';
import { ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function GamepadTesterPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{t('tools.backToTools')}</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-cosmic-purple" />
          <span>Gamepad API Standard v2</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          {t('tools.gamepad.pageTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          {t('tools.gamepad.pageDescription')}
        </p>
      </div>

      {/* Gamepad Visualizer Component */}
      <GamepadVisualizer />

      {/* Guide & Calibration FAQs */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 max-w-4xl mx-auto mt-12 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>{t('tools.gamepad.faqTitle')}</span>
        </h3>
        <ul className="space-y-2 text-xs text-text-secondary leading-relaxed list-disc list-inside">
          <li>
            <strong>{t('tools.gamepad.tip1Title')}</strong> {t('tools.gamepad.tip1Body')}
          </li>
          <li>
            <strong>{t('tools.gamepad.tip2Title')}</strong> {t('tools.gamepad.tip2Body')}
          </li>
          <li>
            <strong>{t('tools.gamepad.tip3Title')}</strong> {t('tools.gamepad.tip3Body')}
          </li>
        </ul>
      </div>
    </div>
  );
}
