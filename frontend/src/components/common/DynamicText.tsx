'use client';

import React from 'react';
import { useDynamicTranslation } from '@/hooks/useDynamicTranslation';

interface DynamicTextProps {
  text: string | null | undefined;
  fallback?: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Renders dynamic backend text translated into the active UI language.
 * Zero layout shifts: immediately renders cached or original text while resolving.
 */
export default function DynamicText({
  text,
  fallback = '',
  className,
  as: Component = 'span',
}: DynamicTextProps) {
  const translated = useDynamicTranslation(text);

  if (!text && fallback) {
    return <Component className={className}>{fallback}</Component>;
  }

  return <Component className={className}>{translated || text || ''}</Component>;
}

