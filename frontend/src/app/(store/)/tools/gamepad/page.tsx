'use client';

import React from 'react';
import Link from 'next/link';
import GamepadVisualizer from '@/components/tools/GamepadVisualizer';
import {
  ArrowRight,
  Sparkles,
  HelpCircle,
  LayoutGrid,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function GamepadTesterPage() {
  const { t } = useTranslation();
  const [view, setView] = React.useState<'3d' | 'classic'>('3d');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{t('tools.backToTools')}</span>
        </Link>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setView('3d')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${view === '3d' ? 'bg-cosmic-purple text-white shadow-neon-purple' : 'text-text-muted hover:text-white'}`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{t('tools.gamepad.view3d')}</span>
          </button>
          <button
            onClick={() => setView('classic')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${view === 'classic' ? 'bg-cyan-500 text-black shadow-neon-cyan' : 'text-text-muted hover:text-white'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{t('tools.gamepad.viewClassic')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-cosmic-purple" />
          <span>
            {view === '3d' ? 'WebHID Advanced Mode' : 'Gamepad API Standard v2'}
          </span>
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

      {/* 3D View → Fullscreen link card */}
      <div className={view === '3d' ? 'block' : 'hidden'}>
        <div className="glass-card rounded-3xl border border-white/10 p-8 sm:p-12 text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cosmic-purple/20 flex items-center justify-center">
            <Monitor className="w-8 h-8 text-cosmic-purple" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">
              {t('tools.gamepad.view3d')}
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              تستر سه‌بعدی و پیشرفته دسته با WebHID. مدل سه‌بعدی، تست میکروفون،
              کالیبراسیون ژیروسکوپ، تریگرهای تطبیقی و اطلاعات سخت‌افزاری کامل
              دسته.
            </p>
          </div>
          <Link
            href="/gamepad"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cosmic-purple hover:bg-cosmic-purple/90 text-white rounded-xl font-bold text-sm transition-all shadow-neon-purple"
          >
            <span>{t('tools.gamepad.launchFull')}</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Classic View → Embedded visualizer */}
      <div className={view === 'classic' ? 'block' : 'hidden'}>
        <GamepadVisualizer />
      </div>

      {/* Guide & Calibration FAQs */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 max-w-4xl mx-auto mt-12 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>{t('tools.gamepad.faqTitle')}</span>
        </h3>
        <ul className="space-y-2 text-xs text-text-secondary leading-relaxed list-disc list-inside">
          <li>
            <strong>{t('tools.gamepad.tip1Title')}</strong>{' '}
            {t('tools.gamepad.tip1Body')}
          </li>
          <li>
            <strong>{t('tools.gamepad.tip2Title')}</strong>{' '}
            {t('tools.gamepad.tip2Body')}
          </li>
          <li>
            <strong>{t('tools.gamepad.tip3Title')}</strong>{' '}
            {t('tools.gamepad.tip3Body')}
          </li>
        </ul>
      </div>
    </div>
  );
}
