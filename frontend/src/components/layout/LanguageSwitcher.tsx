'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES, SupportedLang } from '@/lib/translationEngine';

export default function LanguageSwitcher() {
  const { lang, setLang, initGeoIP } = useLanguage();
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

  const currentMeta = SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.fa;

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
        <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 rounded-2xl glass-card border border-white/15 bg-background-card/95 backdrop-blur-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-2 text-xs font-semibold text-text-secondary">
            <Globe className="w-3.5 h-3.5 text-cosmic-purple" />
            <span>انتخاب زبان / Select Language</span>
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {Object.values(SUPPORTED_LANGUAGES).map((item) => {
              const isActive = item.code === lang;
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    setLang(item.code as SupportedLang);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-cosmic-purple/20 text-white font-medium border border-cosmic-purple/40'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.flag}</span>
                    <div className="flex flex-col text-left">
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
