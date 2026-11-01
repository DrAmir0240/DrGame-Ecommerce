'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, Search, ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useSiteSettingsStore } from '@/stores/useSiteSettingsStore';

export default function FaqPage() {
  const { t } = useTranslation();
  const { settings, fetchSettings, loading } = useSiteSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const defaultFaqs = [
    {
      question: 'چگونه دیتای بازی‌ها را روی کنسول نصب کنم؟',
      answer: 'کافی است پس از دانلود پارت‌ها از سرورهای دکتر گیم، با استفاده از نرم‌افزار Package Sender (در حالت شبکه محلی) یا کپی بر روی هارد اکسترنال با فرمت exFAT، بازی را روی کنسول خود نصب نمایید.',
    },
    {
      question: 'آیا ترافیک مصرفی در دکتر گیم نیم‌بها محاسبه می‌شود؟',
      answer: 'بله، تمامی سرورهای دانلود و استریم دکتر گیم بر روی بستر زیرساخت و CDN اختصاصی داخلی ایران مستقر بوده و ترافیک کلیه اپراتورها به صورت نیم‌بهاء محاسبه می‌گردد.',
    },
    {
      question: 'آیا اشتراک‌های حجمی دکتر گیم دارای تاریخ انقضا هستند؟',
      answer: 'خیر! یکی از بزرگترین مزایای دکتر گیم، سهمیه بدون محدودیت زمانی است. حجم خریداری‌شده تا زمان مصرف کامل باقی می‌ماند و منقضی نمی‌شود.',
    },
    {
      question: 'آیا برای دانلود فایل‌های چیت، زیرنویس و پچ‌ها نیاز به هزینه جداگانه است؟',
      answer: 'خیر، کلیه پکیج‌های چیت، ترینر، زیرنویس فارسی و دوبله اختصاصی همراه با اشتراک‌های فعال به صورت رایگان قابل دانلود هستند.',
    },
    {
      question: 'سیستم کسب درآمد و رفرال چگونه کار می‌کند؟',
      answer: 'با معرفی دوستان خود از طریق کد معرف اختصاصی، ۱۵٪ از تمام خریدهای اول آنها به کیف پول شما واریز شده و می‌توانید درخواست تسویه حساب پایا یا کارت‌به‌کارت ثبت کنید.',
    },
  ];

  const rawFaqs = settings?.faq_items && settings.faq_items.length > 0 ? settings.faq_items : defaultFaqs;

  const filteredFaqs = rawFaqs.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-vazir">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs text-text-muted hover:text-white transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>بازگشت به صفحه اصلی</span>
      </Link>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-purple/10 border border-cosmic-purple/30 text-cosmic-purple text-xs font-bold">
          <HelpCircle className="w-4 h-4" />
          <span>مرکز راهنمایی و پاسخ به پرسش‌ها</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          سوالات متداول (FAQ)
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          پاسخ به پرتکرارترین پرسش‌های گیمرها پیرامون دانلود دیتا، جیلبریک، اشتراک و پشتیبانی
        </p>

        {/* Search Input */}
        <div className="pt-4 max-w-lg mx-auto relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در بین سوالات متداول..."
            className="w-full ps-11 pe-4 py-3 rounded-2xl bg-[#0d121f] border border-white/15 text-white placeholder:text-text-muted text-sm focus:outline-none focus:border-nebula-violet focus:ring-1 focus:ring-nebula-violet transition-all"
          />
          <Search className="w-4 h-4 text-text-muted absolute start-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3 pt-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl border border-white/10 text-text-muted text-sm">
            موردی مطابق با جستجوی شما یافت نشد.
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl glass-card border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 flex items-center justify-between text-start gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-white flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-cosmic-purple/20 text-cosmic-purple text-xs flex items-center justify-center shrink-0 font-mono font-black">
                      {index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-cosmic-purple' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-white/5 bg-white/[0.01]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Need more help CTA */}
      <div className="rounded-3xl glass-card border border-cosmic-purple/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div className="space-y-1 text-center sm:text-start">
          <h4 className="text-base font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="w-4 h-4 text-cosmic-purple" />
            <span>پاسخ سوال خود را پیدا نکردید؟</span>
          </h4>
          <p className="text-xs text-text-secondary">
            کارشناسان فنی دکتر گیم در بخش تیکت‌ها آماده پاسخگویی ۲۴ ساعته هستند.
          </p>
        </div>

        <Link
          href="/dashboard/tickets"
          className="px-6 py-2.5 rounded-xl bg-cosmic-gradient hover:opacity-95 text-white font-bold text-xs shadow-neon-purple transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>ارسال تیکت پشتیبانی</span>
        </Link>
      </div>
    </div>
  );
}

