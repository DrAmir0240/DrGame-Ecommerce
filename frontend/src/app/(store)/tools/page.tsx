'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Cpu, ArrowLeft, Sparkles } from 'lucide-react';

export default function ToolsHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cosmic-purple/10 border border-cosmic-purple/30 text-cosmic-purple text-xs font-bold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>جعبه ابزار تخصصی کنسول دکتر گیم</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
          ابزارهای اختصاصی گیمرها و نصاب‌های کنسول
        </h1>
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
          مجموعه ابزارهای هوشمند تحت وب برای تست سلامت و دریفت کنترلر، و سامانه پی‌لودهای جیلبریک فریمور کنسول.
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
                نسخه آنلاین
              </span>
              <span className="text-[10px] text-text-muted font-roboto font-semibold">DualSense / DualShock</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-cosmic-purple transition-colors mb-3">
              تست سلامت دسته (Gamepad Tester)
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              تست بلادرنگ تمامی دکمه‌های دسته، درصد حساسیت تریگرهای L2/R2، عیب‌یابی دقیق دریفت شوکرهای آنالوگ (Drift Error) و تست موتورهای ویبره دوگانه هپتیک.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold text-white group-hover:text-cosmic-purple transition-colors">
            <span>شروع تست کنترلر</span>
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
                هاست اختصاصی DNS
              </span>
              <span className="text-[10px] text-text-muted font-roboto font-semibold">PS4 & PS5 Jailbreak</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-3">
              سامانه جیلبریک و پی‌لود کنسول
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              هاست پایدار پی‌لودهای GoldHEN و وب‌کیت برای فریمورهای مختلف پلی‌استیشن ۴ و ۵ بدون قطعی، با قابلیت کش آفلاین و راهنمای تصویری گام‌به‌گام.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
            <span>ورود به سامانه جیلبریک</span>
            <ArrowLeft className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

