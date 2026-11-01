'use client';

import GamepadTester from '@/components/tools/GamepadTester';
import { ArrowRight, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n';

export default function GamepadPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      {/* Minimal top bar */}
      <div className="shrink-0 px-4 sm:px-6 py-2 flex items-center justify-between border-b border-white/10 bg-surface-card/60 backdrop-blur-sm">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>{t('tools.backToTools')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-cosmic-purple" />
          <span className="text-xs font-bold text-white">
            {t('tools.gamepad.pageTitle')}
          </span>
        </div>
      </div>

      {/* Fullscreen tester */}
      <div className="flex-1 min-h-0">
        <GamepadTester active theme="dark" fullscreen />
      </div>
    </div>
  );
}
