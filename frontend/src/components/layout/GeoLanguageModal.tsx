'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Globe2, Check, Sparkles, X, ChevronDown, Languages } from 'lucide-react';
import { useTranslation, SupportedLocale, SUPPORTED_LOCALES } from '@/i18n';
import { useLanguage } from '@/hooks/useLanguage';
import { setCookie } from '@/lib/authTokens';

const IS_INTERNATIONAL = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'international';

export default function GeoLanguageModal() {
  const pathname = usePathname();
  const { changeLanguage, t, dir } = useTranslation();
  const { setLang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [detectedLang, setDetectedLang] = useState<SupportedLocale>('en');
  const [selectedLang, setSelectedLang] = useState<SupportedLocale>('en');
  const [countryName, setCountryName] = useState<string>('Global');
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  useEffect(() => {
    // 1. Strictly disable on domestic mode or admin routes
    if (!IS_INTERNATIONAL || typeof window === 'undefined') {
      return;
    }

    if (window.location.pathname.startsWith('/admin')) {
      return;
    }

    // 2. Check if user already saw or confirmed the modal
    const seen = localStorage.getItem('drgame_geo_modal_seen');
    const existingStoredLang = localStorage.getItem('drgame_lang');
    if (seen || existingStoredLang) {
      return;
    }

    // 3. Query GeoIP API to detect client country and suggested language
    let isMounted = true;
    fetch('/api/geoip')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;

        const lang = (data.suggested_lang as SupportedLocale) || 'en';
        const validLang = SUPPORTED_LOCALES[lang] ? lang : 'en';

        setDetectedLang(validLang);
        setSelectedLang(validLang);
        setCountryName(data.country_name || data.country_code || 'Global');
        setIsOpen(true);
      })
      .catch(() => {
        if (isMounted) {
          setDetectedLang('en');
          setSelectedLang('en');
          setIsOpen(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConfirm = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_lang', selectedLang);
      localStorage.setItem('drgame_geo_modal_seen', 'true');
      setCookie('drgame_lang', selectedLang, 365);
    }
    setLang(selectedLang);
    changeLanguage(selectedLang);
    setIsOpen(false);
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_geo_modal_seen', 'true');
    }
    setIsOpen(false);
  };

  // If domestic or modal closed or on admin, render nothing
  if (!IS_INTERNATIONAL || !isOpen || pathname.startsWith('/admin')) {
    return null;
  }

  const detectedMeta = SUPPORTED_LOCALES[detectedLang] || SUPPORTED_LOCALES.en;
  const englishMeta = SUPPORTED_LOCALES.en;
  const isLocalDifferentThanEn = detectedLang !== 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#0d121f] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/50 space-y-5 relative text-start"
        dir={dir}
      >
        {/* Dismiss Close Icon */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="Dismiss"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Geo Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wide">
            <Globe2 className="w-4 h-4" />
            <span>Welcome to DrGame International • {countryName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Choose Your Preferred Language
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            We detected your region. Select your preferred display language to continue.
          </p>
        </div>

        {/* Primary Options: Local Language vs English */}
        <div className="space-y-2.5">
          {isLocalDifferentThanEn && (
            <button
              type="button"
              onClick={() => setSelectedLang(detectedLang)}
              className={`w-full p-3.5 rounded-2xl border transition-all text-start flex items-center justify-between gap-3 ${
                selectedLang === detectedLang
                  ? 'bg-cyan-500/15 border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-[#141b2d] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{detectedMeta.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{detectedMeta.nativeName}</span>
                    <span className="text-xs text-slate-400">({detectedMeta.name})</span>
                  </div>
                  <span className="text-[11px] text-cyan-400 font-medium mt-0.5 block">
                    Recommended for your region ({countryName})
                  </span>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  selectedLang === detectedLang
                    ? 'bg-cyan-400 border-cyan-400 text-slate-950 font-bold'
                    : 'border-white/20 bg-transparent'
                }`}
              >
                {selectedLang === detectedLang && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          )}

          {/* English Option */}
          <button
            type="button"
            onClick={() => setSelectedLang('en')}
            className={`w-full p-3.5 rounded-2xl border transition-all text-start flex items-center justify-between gap-3 ${
              selectedLang === 'en'
                ? 'bg-cyan-500/15 border-cyan-400/70 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-[#141b2d] border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{englishMeta.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{englishMeta.nativeName}</span>
                  <span className="text-xs text-slate-400">({englishMeta.name})</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Global Standard • USDT / Crypto & Cards
                </span>
              </div>
            </div>

            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                selectedLang === 'en'
                  ? 'bg-cyan-400 border-cyan-400 text-slate-950 font-bold'
                  : 'border-white/20 bg-transparent'
              }`}
            >
              {selectedLang === 'en' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Expandable All Supported Languages Selector */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAllLanguages(!showAllLanguages)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            <span className="flex items-center gap-2">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>Browse all 15 supported languages</span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                showAllLanguages ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showAllLanguages && (
            <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/20">
              {Object.values(SUPPORTED_LOCALES).map((meta) => {
                const isSelected = selectedLang === meta.code;
                return (
                  <button
                    key={meta.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(meta.code);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-start ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'bg-white/[0.03] text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{meta.flag}</span>
                    <span className="truncate">{meta.nativeName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
          <span>Confirm & Continue</span>
        </button>
      </div>
    </div>
  );
}
