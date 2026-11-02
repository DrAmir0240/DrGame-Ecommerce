"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  DollarSign,
  Headphones,
  BarChart3,
  Share2,
  Database,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface DepartmentCard {
  title: string;
  enTitle: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent: {
    border: string;
    bg: string;
    text: string;
    badge: string;
    hover: string;
  };
  isExternal?: boolean;
}

export default function AdminHubPage() {
  const [djangoHost, setDjangoHost] = useState("http://localhost:8007/admin/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname || "localhost";
      setDjangoHost(`http://${hostname}:8007/admin/`);
    }
  }, []);

  const departments: DepartmentCard[] = [
    {
      title: "دپارتمان محتوا و وبلاگ",
      enTitle: "Content Department",
      description: "مدیریت مقالات، کاتالوگ بازی‌ها، ژانرها و بنرهای تبلیغاتی صفحه اصلی با تفکیک دسترسی رید-اونلی و کراد.",
      href: "/admin/content/login",
      icon: <FileText className="w-8 h-8 text-emerald-400" />,
      accent: {
        border: "border-emerald-500/30 hover:border-emerald-500/60",
        bg: "from-emerald-500/10 via-emerald-500/5 to-transparent",
        text: "text-emerald-400",
        badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        hover: "hover:shadow-emerald-950/40",
      },
    },
    {
      title: "دپارتمان امور مالی و اشتراک",
      enTitle: "Finance Department",
      description: "نظارت بر تراکنش‌های بانکی، پلن‌های اشتراک، کدهای تخفیف، تمدید دستی و گردش مالی پلتفرم.",
      href: "/admin/finance/login",
      icon: <DollarSign className="w-8 h-8 text-amber-400" />,
      accent: {
        border: "border-amber-500/30 hover:border-amber-500/60",
        bg: "from-amber-500/10 via-amber-500/5 to-transparent",
        text: "text-amber-400",
        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        hover: "hover:shadow-amber-950/40",
      },
    },
    {
      title: "دپارتمان پشتیبانی و کاربران",
      enTitle: "Support Department",
      description: "پاسخگویی به تیکت‌های پشتیبانی کاربران، بازبینی پرونده کاربر، مسدودسازی و تنظیم حجم دانلود اختصاصی.",
      href: "/admin/support/login",
      icon: <Headphones className="w-8 h-8 text-blue-400" />,
      accent: {
        border: "border-blue-500/30 hover:border-blue-500/60",
        bg: "from-blue-500/10 via-blue-500/5 to-transparent",
        text: "text-blue-400",
        badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        hover: "hover:shadow-blue-950/40",
      },
    },
    {
      title: "دپارتمان گزارش‌گیری و نظارت",
      enTitle: "Reports & Analytics",
      description: "چارت‌های آماری سبک و فوق‌سریع، لاگ‌های امنیتی ادمین‌ها (Audit Logs) و بررسی عملکرد کلی سامانه.",
      href: "/admin/report/login",
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      accent: {
        border: "border-purple-500/30 hover:border-purple-500/60",
        bg: "from-purple-500/10 via-purple-500/5 to-transparent",
        text: "text-purple-400",
        badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        hover: "hover:shadow-purple-950/40",
      },
    },
    {
      title: "دپارتمان بازاریابی و رفرال",
      enTitle: "Referral & Treasury",
      description: "ردیابی زنجیره‌های دعوت، استخر خزانه‌داری پورسانت، تایید شماره شبا/کارت و صدور دستور تسویه‌حساب بانکی.",
      href: "/admin/referral/login",
      icon: <Share2 className="w-8 h-8 text-rose-400" />,
      accent: {
        border: "border-rose-500/30 hover:border-rose-500/60",
        bg: "from-rose-500/10 via-rose-500/5 to-transparent",
        text: "text-rose-400",
        badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        hover: "hover:shadow-rose-950/40",
      },
    },
    {
      title: "سوپرادمین جنگو (مدیریت دیتابیس)",
      enTitle: "Django SuperAdmin (Port 8007)",
      description: "پنل مستقل ساختاریافته جنگو با پوسته مدرن فارسی راست‌چین (Unfold) جهت مدیریت مستقیم رکوردهای دیتابیس.",
      href: djangoHost,
      isExternal: true,
      icon: <Database className="w-8 h-8 text-indigo-400" />,
      accent: {
        border: "border-indigo-500/40 hover:border-indigo-400",
        bg: "from-indigo-600/15 via-purple-600/10 to-transparent",
        text: "text-indigo-400",
        badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        hover: "hover:shadow-indigo-950/50",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between p-6 md:p-12 selection:bg-purple-500 selection:text-white" dir="rtl">
      {/* Header Banner */}
      <header className="sticky top-0 z-30 bg-[#07090e]/95 backdrop-blur-md max-w-6xl mx-auto w-full pt-4 pb-6 border-b border-slate-800/80 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Step 15 • Zero-Trust Architecture
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                صفحه هاب موقت تست
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              درگاه ورودی دپارتمان‌های مدیریت دکتر گیم
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
              جهت ارتقای امنیت و ایزولاسیون کامل، پنل‌های ادمین در پایگاه‌داده و توکن‌ها کاملاً تفکیک شده‌اند. از میان ۵ دپارتمان مستقل پلتفرم یا پنل سوپرادمین دیتابیس جنگو انتخاب کنید.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs max-w-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <span>هیچ لینک مستقیمی در سایت عمومی به این صفحات وجود ندارد. دسترسی تنها از طریق آدرس اختصاصی امکان‌پذیر است.</span>
          </div>
        </div>
      </header>

      {/* 6 Department Cards Grid */}
      <main className="max-w-6xl mx-auto w-full my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const content = (
            <div
              className={`group relative h-full rounded-2xl border ${dept.accent.border} bg-[#0c1017] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dept.accent.hover}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    {dept.icon}
                  </div>
                  <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${dept.accent.badge}`}>
                    {dept.enTitle}
                  </span>
                </div>

                <div>
                  <h3 className={`text-lg font-bold text-white group-hover:${dept.accent.text} transition-colors flex items-center gap-2`}>
                    {dept.title}
                    {dept.isExternal && <ExternalLink className="w-4 h-4 text-slate-400" />}
                  </h3>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                    {dept.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium">
                <span className="text-slate-400 group-hover:text-white transition-colors">
                  ورود به پورتال دپارتمان
                </span>
                <span className={`flex items-center gap-1 ${dept.accent.text} font-bold group-hover:translate-x-[-4px] transition-transform`}>
                  ادامه
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </span>
              </div>
            </div>
          );

          return dept.isExternal ? (
            <a
              key={dept.title}
              href={dept.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
            >
              {content}
            </a>
          ) : (
            <Link key={dept.title} href={dept.href} className="block h-full">
              {content}
            </Link>
          );
        })}
      </main>

      {/* Footer info */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 py-4 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-2">
        <span>سامانه مدیریت متمرکز و مجزای دکتر گیم • نگارش 2.0 (Zero-Trust)</span>
        <span className="font-mono text-slate-600">Django Admin: Port 8007 • FastAPI: Port 8000</span>
      </footer>
    </div>
  );
}
