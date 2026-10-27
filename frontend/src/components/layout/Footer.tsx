'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  Send,
  Instagram,
  Twitter,
  Coins,
  CreditCard,
  Gamepad2,
  Sparkles,
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  // 'domestic' (Iran) or 'international'
  const [footerMode, setFooterMode] = useState<'domestic' | 'international'>('domestic');

  // Do not render storefront footer inside the admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="w-full border-t border-white/5 bg-surface-base/90 backdrop-blur-2xl relative z-20 mt-20">
      {/* Mode Switcher Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between border-b border-white/5 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-cosmic-purple" />
          <span>پیکربندی منطقه جغرافیایی فروشگاه:</span>
          <span className="font-bold text-white">
            {footerMode === 'domestic' ? 'ایران (پرداخت ریالی و نمادها)' : 'بین‌الملل (کریپتو و ارزی)'}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setFooterMode('domestic')}
            className={`px-3 py-1 rounded-lg transition-all font-medium ${
              footerMode === 'domestic'
                ? 'bg-cosmic-purple text-white shadow-neon-purple'
                : 'text-text-muted hover:text-white'
            }`}
          >
            ایران (شاپرک)
          </button>
          <button
            onClick={() => setFooterMode('international')}
            className={`px-3 py-1 rounded-lg transition-all font-medium ${
              footerMode === 'international'
                ? 'bg-cosmic-purple text-white shadow-neon-purple'
                : 'text-text-muted hover:text-white'
            }`}
          >
            Global (Crypto/USDT)
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & About */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cosmic-purple/20 border border-cosmic-purple/30 p-1 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="DrGame Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block">دکتر گیم</span>
              <span className="text-[10px] text-text-muted font-mono tracking-wider">DRGAME.IR</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            بزرگترین آرشیو فوق‌سریع بازی‌های کنسولی پلی‌استیشن، سوییچ و وی‌آر همراه با محاسبه دقیق ترافیک، تست سلامت فایل‌ها و به‌روزرسانی لحظه‌ای RAWG.
          </p>
          <div className="flex items-center gap-3 text-text-muted">
            <a
              href="https://t.me/drgame"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl glass-card hover:text-cyan-400 hover:border-cyan-400/40 transition-all"
            >
              <Send className="w-4 h-4" />
            </a>
            {footerMode === 'domestic' ? (
              <a
                href="https://instagram.com/drgame"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl glass-card hover:text-pink-400 hover:border-pink-400/40 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
            ) : (
              <a
                href="https://x.com/drgame"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl glass-card hover:text-white hover:border-white/40 transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4">دسترسی سریع</h4>
          <ul className="space-y-2.5 text-xs text-text-secondary">
            <li>
              <Link href="/games" className="hover:text-white transition-colors">
                کاتالوگ دیتابیس بازی‌ها
              </Link>
            </li>
            <li>
              <Link href="/subscriptions" className="hover:text-white transition-colors">
                پلن‌های اشتراک حجمی
              </Link>
            </li>
            <li>
              <Link href="/tools" className="hover:text-white transition-colors">
                ابزارهای اختصاصی کنسول
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors">
                آموزش نصب دیتا و اخبار
              </Link>
            </li>
          </ul>
        </div>

        {/* Dynamic Mode Content: Contact & Support */}
        {footerMode === 'domestic' ? (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">پشتیبانی و تماس (ایران)</h4>
            <ul className="space-y-3 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono dir-ltr">۰۲۱ - ۹۱۰۰XXXX</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cosmic-purple shrink-0" />
                <span className="font-mono">support@drgame.ir</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>تهران، خیابان ولیعصر، برج فناوری اطلاعات دکترگیم</span>
              </li>
            </ul>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">International Support</h4>
            <ul className="space-y-3 text-xs text-text-secondary">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono">global@drgame.ir</span>
              </li>
              <li className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>USDT (TRC20 / ERC20), BTC, ETH Accepted</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="w-4 h-4 text-cosmic-purple shrink-0 mt-0.5" />
                <span>Global High-Speed CDN nodes across EU & Asia</span>
              </li>
            </ul>
          </div>
        )}

        {/* Dynamic Mode Badges & Payment Trust */}
        {footerMode === 'domestic' ? (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">مجوزها و درگاه‌ها</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Enamad Placeholder */}
              <div className="p-3 rounded-2xl glass-card border border-white/10 text-center flex flex-col items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-cyan-400 mb-1" />
                <span className="text-[11px] font-bold text-white">اینماد الکترونیکی</span>
                <span className="text-[9px] text-emerald-400">تایید هویت دو ستاره</span>
              </div>
              {/* Samandehi Placeholder */}
              <div className="p-3 rounded-2xl glass-card border border-white/10 text-center flex flex-col items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-amber-400 mb-1" />
                <span className="text-[11px] font-bold text-white">نشان ملی ساماندهی</span>
                <span className="text-[9px] text-text-muted">ثبت در وزارت ارشاد</span>
              </div>
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px] text-text-muted">
              <span>درگاه پرداخت امن شاپرک:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> زیبال / سداد
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Crypto & Global Gateways</h4>
            <div className="p-4 rounded-2xl glass-card border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Automated Tether:</span>
                <span className="font-mono font-bold text-emerald-400">USDT / USDC</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Supported Chains:</span>
                <span className="text-white font-mono text-[11px]">Tron, BNB, Polygon</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Instant Quota Charge:</span>
                <span className="text-cyan-400 font-bold">0-Confirmation</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Copyright */}
      <div className="border-t border-white/5 py-4 text-center text-[11px] text-text-muted">
        <p>© 2026 دکتر گیم (DrGame). تمامی حقوق محفوظ است. توسعه یافته برای تجربه کنسولی ۱۰ فوتی.</p>
      </div>
    </footer>
  );
}
