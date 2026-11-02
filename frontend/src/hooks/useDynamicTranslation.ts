'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { translateDynamicText, getInstantDynamicTranslation } from '@/lib/dynamicTranslator';

/**
 * React hook to translate dynamic texts from the backend across all 15 languages.
 * - 0ms instant translation via multi-lingual gaming lexicon and memory cache.
 * - Smooth fallback without layout shifts.
 */
export function useDynamicTranslation(text: string | null | undefined): string {
  const { locale } = useTranslation();
  
  // Instant synchronous lookup (Memory / LocalStorage / Lexicon)
  const instantValue = getInstantDynamicTranslation(text, locale);
  const [asyncValue, setAsyncValue] = useState<string | null>(null);

  useEffect(() => {
    if (!text || locale === 'fa') {
      setAsyncValue(null);
      return;
    }

    const instant = getInstantDynamicTranslation(text, locale);
    if (instant !== null) {
      setAsyncValue(instant);
      return;
    }

    let isMounted = true;
    translateDynamicText(text, locale).then((res) => {
      if (isMounted && res) {
        setAsyncValue(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, locale]);

  if (!text) return '';
  if (locale === 'fa') return text;
  return instantValue ?? asyncValue ?? text;
}
