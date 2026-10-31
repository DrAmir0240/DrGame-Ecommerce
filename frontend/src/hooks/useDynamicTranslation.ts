'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { translateDynamicText, getInstantDynamicTranslation } from '@/lib/dynamicTranslator';

/**
 * React hook to translate dynamic texts from the backend.
 * - 0ms when Persian or already cached.
 * - Safe fallback to original text (No layout shift, No crash).
 */
export function useDynamicTranslation(text: string | null | undefined): string {
  const { locale } = useTranslation();
  
  // Try synchronous instant lookup (Memory / LocalStorage / Lexicon)
  const initialValue = getInstantDynamicTranslation(text, locale) ?? (text || '');
  const [translated, setTranslated] = useState<string>(initialValue);

  useEffect(() => {
    if (!text) {
      setTranslated('');
      return;
    }

    if (locale === 'fa') {
      setTranslated(text);
      return;
    }

    // Check if immediately available
    const instant = getInstantDynamicTranslation(text, locale);
    if (instant !== null) {
      setTranslated(instant);
      return;
    }

    // Show initial text while waiting for translation response
    setTranslated(text);

    let isMounted = true;
    translateDynamicText(text, locale).then((res) => {
      if (isMounted && res) {
        setTranslated(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, locale]);

  return translated;
}

