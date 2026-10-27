'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { translateInstant, translateTextClient, isRtlLang, SupportedLang } from '@/lib/translationEngine';

export function useAutoTranslate(text: string) {
  const { lang } = useLanguage();
  const targetLang = (lang as SupportedLang) || 'fa';
  const [translated, setTranslated] = useState<string>(() => translateInstant(text, targetLang));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const instant = translateInstant(text, targetLang);
    setTranslated(instant);

    if (targetLang !== 'fa' && instant === text) {
      setLoading(true);
      translateTextClient(text, targetLang).then((res) => {
        if (isMounted) {
          setTranslated(res);
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [text, targetLang]);

  return {
    t: translated,
    lang: targetLang,
    isRtl: isRtlLang(targetLang),
    loading,
  };
}
