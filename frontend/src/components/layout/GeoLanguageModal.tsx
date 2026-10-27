'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Globe2, Check, Sparkles, X, ShieldCheck } from 'lucide-react';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  currency: string;
  region: string;
  dir: 'rtl' | 'ltr';
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    flag: '🇮🇷',
    currency: 'تومان (درگاه شتاب و شبکه بانکی)',
    region: 'ایران',
    dir: 'rtl',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🌐',
    currency: 'USDT / Crypto & International Cards',
    region: 'Global / International',
    dir: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇦🇪',
    currency: 'USDT / بطاقات دولية',
    region: 'الشرق الأوسط',
    dir: 'rtl',
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    currency: 'USDT / Kripto Para',
    region: 'Türkiye',
    dir: 'ltr',
  },
];

export default function GeoLanguageModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>('fa');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem('drgame_geo_modal_seen');
      // If not seen and not on admin routes, open modal
      if (!seen && !window.location.pathname.startsWith('/admin')) {
        // Detect browser language or default to fa
        const browserLang = navigator.language.slice(0, 2).toLowerCase();
        if (browserLang === 'fa') {
          setSelectedLang('fa');
        } else if (browserLang === 'ar') {
          setSelectedLang('ar');
        } else if (browserLang === 'tr') {
          setSelectedLang('tr');
        } else {
          setSelectedLang('en');
        }
        setIsOpen(true);
      }
    }
  }, []);

  const handleConfirm = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_lang', selectedLang);
      localStorage.setItem('drgame_geo_modal_seen', 'true');
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_geo_modal_seen', 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || pathname.startsWith('/admin')) {
    return null;
  }

  const activeOption = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-vazir animate-fade-in">
      <div className="w-full max-w-lg bg-[#0d121f] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 space-y-6 relative text-right">
        
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 left-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
          title="بستن"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Globe2 className="w-4 h-4" />
            <span>Select Region & Language / انتخاب منطقه و زبان</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            به دکتر گیم خوش آمدید
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            لطفاً زبان رابط کاربری و شیوه پرداخت مناسب خود را انتخاب نمایید:
          </p>
        </div>

        {/* Language Options List */}
        <div className="space-y-2.5">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`w-full p-3.5 rounded-2xl border transition-all text-right flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-[#141b2d] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{lang.nativeName}</span>
                      <span className="text-xs text-text-muted">({lang.name})</span>
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5">
                      {lang.region} • {lang.currency}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-cyan-400 border-cyan-400 text-black'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary Info */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>پیکربندی برگزیده:</span>
          </div>
          <span className="font-bold text-white">
            {activeOption.nativeName} ({activeOption.region})
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white text-xs font-bold transition-colors"
          >
            بعداً یادآوری کن
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
          >
            <span>تایید و ادامه</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
