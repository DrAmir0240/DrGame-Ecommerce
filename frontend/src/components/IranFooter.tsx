"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, PhoneCall, Mail, MapPin, ExternalLink, HelpCircle } from "lucide-react";
import { useContactInfo } from "@/lib/contact";

export const IranFooter: React.FC = () => {
  const [contact] = useContactInfo();

  return (
    <footer className="w-full bg-[#151722] border-t border-white/10 text-slate-300 pt-12 pb-8 mt-20">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/5">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="DrGame"
                className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.4)]"
              />
              <div>
                <h3 className="text-white font-extrabold text-lg">دکتر گیم (DrGame)</h3>
                <p className="text-xs text-slate-400">مرکز تخصصی دانلود دیتای بازی و سرویس‌های پلی‌استیشن</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              پلتفرم دکتر گیم با سرورهای قدرتمند لبه در تهران و پهنای باند اختصاصی، امکان دانلود پرسرعت و نیم‌بهای دیتای کنسول‌های بازی، لایسنس‌های قانونی و خدمات نرم‌افزاری کنسول را با بالاترین کیفیت فراهم می‌سازد.
            </p>
            <div className="flex flex-col gap-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-purple-400 shrink-0" />
                <span>پشتیبانی تلفنی: {contact.phone1} ({contact.workingHours})</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>پست الکترونیکی: {contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>نشانی: {contact.address}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-s-2 border-purple-500 ps-2.5">دسترسی سریع</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/shop" className="hover:text-purple-400 transition-colors">فروشگاه دیتای بازی‌ها</Link>
              </li>
              <li>
                <Link href="/subscriptions" className="hover:text-purple-400 transition-colors">طرح‌ها و پلن‌های اشتراک</Link>
              </li>
              <li>
                <Link href="/jailbreak" className="hover:text-purple-400 transition-colors">مرجع جیلبریک و ابزارها</Link>
              </li>
              <li>
                <Link href="/tools/gamepad" className="hover:text-purple-400 transition-colors">تستر پیشرفته دسته بازی</Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-purple-400 transition-colors">اخبار و مقالات تخصصی</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Rules */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-s-2 border-purple-500 ps-2.5">راهنما و پشتیبانی</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/panel?tab=tickets" className="hover:text-purple-400 transition-colors">ارسال تیکت پشتیبانی</Link>
              </li>
              <li>
                <Link href="/articles/dns-setup" className="hover:text-purple-400 transition-colors">راهنمای تصویری تنظیم DNS</Link>
              </li>
              <li>
                <Link href="/articles/terms" className="hover:text-purple-400 transition-colors">قوانین و شرایط استفاده</Link>
              </li>
              <li>
                <Link href="/articles/privacy" className="hover:text-purple-400 transition-colors">حریم خصوصی کاربران</Link>
              </li>
              <li>
                <Link href="/panel?tab=referral" className="hover:text-purple-400 transition-colors">کسب درآمد و رفرال لجر</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Payment Badges */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm border-s-2 border-purple-500 ps-2.5">نمادهای اعتماد و درگاه‌ها</h4>
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Enamad slot */}
              <div
                title="نماد اعتماد الکترونیکی (Enamad)"
                className="w-[120px] h-[120px] rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center p-2 text-center hover:border-purple-500/40 transition-colors"
              >
                <ShieldCheck className="w-8 h-8 text-blue-400 mb-1" />
                <span className="text-[11px] font-bold text-white">ای‌نماد ۵ ستاره</span>
                <span className="text-[9px] text-slate-400">مرکز توسعه تجارت</span>
              </div>

              {/* Samandehi slot */}
              <div
                title="نشان ملی ثبت رسانه‌های دیجیتال"
                className="w-[120px] h-[120px] rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center p-2 text-center hover:border-purple-500/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-1">
                  ساماندهی
                </div>
                <span className="text-[11px] font-bold text-white">ثبت رسانه‌های دیجیتال</span>
                <span className="text-[9px] text-slate-400">وزارت فرهنگ و ارشاد</span>
              </div>
            </div>

            {/* Bank Gateways */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1.5">درگاه‌های پرداخت تحت نظارت شاپرک:</span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-yellow-400">
                  زرین‌پال
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-blue-400">
                  زیبال
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-sky-400">
                  آی‌دی‌پی
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300">
                  به‌پرداخت
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            کلیه حقوق مادی و معنوی، محتوا و علائم تجاری متعلق به مجموعه فناوری دکتر گیم (DrGame) می‌باشد.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono">v1.4.1 Release Parity</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">سرور لبه تهران: آنلاین</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default IranFooter;
