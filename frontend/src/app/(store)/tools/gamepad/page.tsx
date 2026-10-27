'use client';

import React from 'react';
import Link from 'next/link';
import GamepadVisualizer from '@/components/tools/GamepadVisualizer';
import { ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

export default function GamepadTesterPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به جعبه ابزارها</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-cosmic-purple" />
          <span>Gamepad API Standard v2</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          ابزار آنلاین تست سلامت دسته و دریفت شوکر
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          کنترلر DualSense یا DualShock خود را به سیستم متصل کرده و عملکرد تمامی کلیدها، میزان حساسیت تریگرها و لرزش را بسنجید.
        </p>
      </div>

      {/* Gamepad Visualizer Component */}
      <GamepadVisualizer />

      {/* Guide & Calibration FAQs */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 max-w-4xl mx-auto mt-12 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <span>نکات مهم در تست سلامت کنترلر و حل مشکل دریفت:</span>
        </h3>
        <ul className="space-y-2 text-xs text-text-secondary leading-relaxed list-disc list-inside">
          <li>
            <strong>درصد دریفت (Drift Error):</strong> اگر بدون لمس کردن شوکرها، درصد دریفت بیش از ۱۵٪ باشد، کنترلر دارای نقص پتانسیومتر یا گردوغبار داخلی است.
          </li>
          <li>
            <strong>تست ویبره (Haptic / Dual Rumble):</strong> تست ویبره نیازمند دسترسی مرورگر (HTTPS) و اتصال با کابل در ویندوز/مک می‌باشد.
          </li>
          <li>
            <strong>تریگرهای آنالوگ L2 و R2:</strong> در صورت سلامت سنسور اثر هال یا فنر تریگر، با فشردن آرام کلید، درصد باید از ۰ تا ۱۰۰ به صورت یکنواخت افزایش یابد.
          </li>
        </ul>
      </div>
    </div>
  );
}
