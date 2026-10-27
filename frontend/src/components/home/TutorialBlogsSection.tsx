'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';

interface TutorialArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  imageUrl: string;
  summary: string;
}

const TOP_TUTORIALS: TutorialArticle[] = [
  {
    id: '1',
    slug: 'ps5-data-transfer-direct-lan',
    title: 'آموزش جامع انتقال دیتای بازی به PS5 با کابل LAN و رایانه بدون مصرف اینترنت',
    category: 'آموزش دیتابیس',
    readingTime: '۶ دقیقه',
    publishedAt: '۲ روز پیش',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    summary: 'راهنمای گام‌به‌گام اتصال مستقیم کامپیوتر به پلی‌استیشن ۵ با ابزار PSX Download Helper و کابل شبکه گیگابیت برای انتقال پرسرعت بدون قطعی.',
  },
  {
    id: '2',
    slug: 'ps4-goldhen-offline-installer',
    title: 'راهنمای راه‌اندازی هاست آفلاین و گلد‌هن (GoldHEN) روی فریمور‌های کپی‌خور',
    category: 'کپی‌خور و هک',
    readingTime: '۸ دقیقه',
    publishedAt: '۴ روز پیش',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    summary: 'معرفی بهترین پی‌لودهای پایدار برای جیلبریک PS4، فعال‌سازی حالت Debug Settings و نصب آسان پکیج‌های FPKG دیتابیس.',
  },
  {
    id: '3',
    slug: 'nintendo-switch-dbi-installer',
    title: 'نصب بازی‌های حجیم Nintendo Switch با پروتکل پرسرعت MTP توسط نرم‌افزار DBI',
    category: 'نینتندو سوییچ',
    readingTime: '۵ دقیقه',
    publishedAt: '۱ هفته پیش',
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=80',
    summary: 'حل مشکل خطای محدودیت حجم فایل FAT32 و انتقال مستقیم فایل‌های NSP و XCI از ویندوز و مک به مموری سوییچ در چند ثانیه.',
  },
  {
    id: '4',
    slug: 'dns-low-ping-gaming-iran',
    title: 'لیست برترین DNSهای مخصوص گیم با پینگ پایین و رفع تحریم‌های PSN در ایران',
    category: 'شبکه و کاهش پینگ',
    readingTime: '۴ دقیقه',
    publishedAt: '۲ هفته پیش',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    summary: 'معرفی پایدارترین آی‌پی‌های ضدتحریم تست شده روی اینترنت‌های همراه اول، ایرانسل و مخابرات برای دانلود بدون افت سرعت.',
  },
  {
    id: '5',
    slug: 'psvr2-pc-setup-adapter',
    title: 'نحوه اتصال هدست PSVR2 به کامپیوتر با آداپتور رسمی سونی و تجربه بازی‌های SteamVR',
    category: 'واقعیت مجازی',
    readingTime: '۷ دقیقه',
    publishedAt: '۳ هفته پیش',
    imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&auto=format&fit=crop&q=80',
    summary: 'راهنمای راه‌اندازی درایورهای پلی‌استیشن وی‌آر ۲ روی ویندوز ۱۱ و اجرای بازی‌های Half-Life: Alyx با پنل OLED و رزولوشن 4K.',
  },
];

export default function TutorialBlogsSection() {
  const featured = TOP_TUTORIALS[0];
  const others = TOP_TUTORIALS.slice(1);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 my-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              مقالات و آموزش‌های تخصصی نصب دیتا
            </h2>
            <span className="text-xs text-text-muted hidden sm:inline">
              راهنماهای گام‌به‌گام انتقال بدون دردسر دیتا به کنسول‌های نسل هشتم و نهم
            </span>
          </div>
        </div>

        <Link
          href="/blog"
          className="flex items-center gap-1 text-xs text-text-muted hover:text-white transition-colors"
        >
          <span>مشاهده همه آموزش‌ها</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid: 1 Featured Big Card + 4 Compact Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Large Card */}
        <Link
          href={`/blog/${featured.slug}`}
          className="lg:col-span-6 group relative rounded-3xl overflow-hidden glass-card border border-white/10 hover:border-amber-500/50 transition-all flex flex-col justify-end min-h-[340px] p-6 shadow-xl"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${featured.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-oled via-oled/80 to-transparent" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                {featured.category}
              </span>
              <span className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {featured.readingTime}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-300 transition-colors leading-snug">
              {featured.title}
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
              {featured.summary}
            </p>
          </div>
        </Link>

        {/* 4 Compact Cards */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {others.map((item) => (
            <Link
              key={item.id}
              href={`/blog/${item.slug}`}
              className="group p-4 rounded-2xl glass-card border border-white/10 hover:border-cosmic-purple/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-cosmic-purple font-bold">{item.category}</span>
                  <span className="text-text-muted font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.readingTime}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cosmic-purple transition-colors line-clamp-2 leading-relaxed">
                  {item.title}
                </h4>
              </div>

              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-text-muted">
                <span>{item.publishedAt}</span>
                <span className="group-hover:translate-x-[-2px] transition-transform text-white">
                  مطالعه ←
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
