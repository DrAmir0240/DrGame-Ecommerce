'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, ArrowRight, CheckCircle2, Terminal, Play } from 'lucide-react';

export default function JailbreakHubPage() {
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectionSuccess, setInjectionSuccess] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleLaunchJailbreak = () => {
    setIsInjecting(true);
    setInjectionSuccess(false);
    setLogs(['[+] در حال بارگذاری پی‌لود اختصاصی دکتر گیم...', '[*] تشخیص خودکار کنسول و بررسی آسیب‌پذیری وب‌کیت...']);

    setTimeout(() => {
      setLogs((prev) => [...prev, '[+] آسیب‌پذیری هسته شناسایی شد. تزریق GoldHEN به حافظه...']);
    }, 1200);

    setTimeout(() => {
      setLogs((prev) => [...prev, '[+] پی‌لود با موفقیت اجرا گردید. منوی Debug Settings در کنسول فعال شد.']);
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
        <span>بازگشت به جعبه ابزارها</span>
      </Link>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
          <Cpu className="w-4 h-4" />
          <span>هاست آفلاین و کش دائم پی‌لودهای کپی‌خور</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          سامانه اختصاصی جیلبریک کنسول دکتر گیم
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          برای اجرای بازی‌های دانلودی دیتابیس بدون نیاز به دیسک یا اکانت رسمی، با وارد کردن DNSهای زیر در تنظیمات شبکه کنسول وارد این صفحه شوید.
        </p>
      </div>

      {/* DNS Configuration Banner */}
      <div className="rounded-3xl glass-card border border-white/10 p-6 sm:p-8">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cosmic-purple" />
          <span>آدرس‌های DNS سرور پایدار دکتر گیم (جهت وارد کردن در کنسول)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-xs text-text-muted block">Primary DNS (آی‌پی اصلی):</span>
            <span className="text-lg font-black text-emerald-400 font-mono tracking-wider">
              165.227.83.145
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-xs text-text-muted block">Secondary DNS (آی‌پی کمکی):</span>
            <span className="text-lg font-black text-cyan-400 font-mono tracking-wider">
              192.241.221.79
            </span>
          </div>
        </div>

        <p className="text-[11px] text-text-muted mt-4">
          * این DNSها به طور خودکار آپدیت‌های ناخواسته سونی را مسدود کرده و بخش User's Guide کنسول را به این هاست هدایت می‌کنند.
        </p>
      </div>

      {/* Interactive Payload Launcher */}
      <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white">تزریق آنلاین پی‌لود و فعال‌سازی کپی‌خور</h3>
          <p className="text-xs text-text-secondary">
            کنسول به طور خودکار شناسایی شده و پی‌لود GoldHEN به همراه Debug Settings به حافظه تزریق خواهد شد.
          </p>
        </div>

        {/* Action Button */}
        <div className="text-center pt-2">
          <button
            onClick={handleLaunchJailbreak}
            disabled={isInjecting}
            className="w-full sm:w-auto px-12 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-cosmic-purple to-pink-500 hover:opacity-95 text-white font-black text-sm shadow-neon-purple transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
          >
            <Play className={`w-5 h-5 fill-current ${isInjecting ? 'animate-spin' : ''}`} />
            <span>{isInjecting ? 'در حال تزریق پی‌لود جیلبریک...' : 'جیلبریک و فعال‌سازی GoldHEN (Jailbreak)'}</span>
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
              <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-sans text-right flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>تبریک! کنسول شما با موفقیت آنلاک شد. هم‌اکنون می‌توانید پکیج‌های دیتابیس را نصب کنید.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
