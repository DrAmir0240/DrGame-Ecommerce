'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation, SUPPORTED_LOCALES, SupportedLocale } from '@/i18n';
import { useLanguage } from '@/hooks/useLanguage';

export default function LanguageSwitcher() {
  const { locale, changeLanguage, dir } = useTranslation();
  const { setLang, initGeoIP } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGeoIP();
  }, [initGeoIP]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentMeta = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.fa;

  const handleSelectLanguage = (code: SupportedLocale) => {
    changeLanguage(code);
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-white/10 hover:border-cosmic-purple/50 text-text-secondary hover:text-white transition-all text-xs font-roboto shrink-0 shadow-lg backdrop-blur-md"
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentMeta.flag}</span>
        <span className="font-bold uppercase tracking-wider">{currentMeta.code}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="fixed sm:absolute top-16 sm:top-full mt-2 left-3 right-3 sm:left-auto sm:right-auto sm:w-56 rounded-2xl glass-card border border-white/15 bg-background-card/95 backdrop-blur-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 ltr:sm:right-0 ltr:sm:left-auto rtl:sm:left-0 rtl:sm:right-auto"
          dir={dir}
        >
          <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <Globe className="w-3.5 h-3.5 text-cosmic-purple" />
            <span>انتخاب زبان / Language / اللغة</span>
          </div>

          <div className="p-1 space-y-1">
            {Object.values(SUPPORTED_LOCALES).map((item) => {
              const isActive = item.code === locale;
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelectLanguage(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-cosmic-purple/20 text-white font-medium border border-cosmic-purple/40'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{item.flag}</span>
                    <div className="flex flex-col text-start">
                      <span className="font-medium text-white">{item.nativeName}</span>
                      <span className="text-[10px] text-text-secondary">{item.name}</span>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-neon-cyan shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
