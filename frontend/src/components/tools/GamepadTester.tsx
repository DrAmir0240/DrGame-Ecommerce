'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './GamepadTester.module.css';

type Theme = 'light' | 'dark';

export interface GamepadTesterProps {
  /** Is the tab active? Iframe stays mounted once active to keep controller connection. */
  active: boolean;
  /** App theme; defaults to dark. */
  theme?: Theme;
  /** Additional CSS class for the wrapper. */
  className?: string;
  /** When true, the iframe fills its parent height (no fixed 600px). */
  fullscreen?: boolean;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const APP_PATH = `${BASE}/gamepad/index.html`;

export default function GamepadTester({
  active,
  theme = 'dark',
  className,
  fullscreen = false,
}: GamepadTesterProps) {
  const { lang } = useLanguage();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);

  // Map app locale to tester supported locales
  // Tester supports: fa-IR, en-US, ar-SA, etc.
  const getMappedLang = useCallback(() => {
    switch (lang) {
      case 'fa': return 'fa-IR';
      case 'ar': return 'ar-SA';
      default: return 'en-US';
    }
  }, [lang]);

  const buildUrl = useCallback(
    (t: Theme) => {
      const l = getMappedLang();
      return `${APP_PATH}?theme=${t}&lang=${encodeURIComponent(l)}`;
    },
    [getMappedLang],
  );

  // 1) Lazy Load: Only when tab becomes active for the first time
  useEffect(() => {
    if (!active) return;
    setSrc((cur) => cur ?? buildUrl(theme));
  }, [active, theme, buildUrl]);

  // 2) Theme Syncing: HTML class inside iframe + localStorage + postMessage bridge
  const applyTheme = useCallback((t: Theme) => {
    const frame = frameRef.current;
    if (!frame) return;

    // Direct access if same-origin
    try {
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (doc?.documentElement) {
        doc.documentElement.classList.toggle('dark', t === 'dark');
        doc.documentElement.classList.toggle('light', t === 'light');
      }
    } catch (e) {
      // Cross-origin fallback
    }

    // Vueuse color scheme used by the tester app
    try {
      localStorage.setItem('vueuse-color-scheme', t);
    } catch {
      /* ignore private mode */
    }

    // Bridge script postMessage
    frame.contentWindow?.postMessage(
      { type: 'gd:theme', theme: t },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    if (active) {
      applyTheme(theme);
    }
  }, [theme, active, applyTheme]);

  // 3) Full Reload: For fresh connection or if HID hangs
  const reload = useCallback(() => {
    setSrc(`${buildUrl(theme)}&t=${Date.now()}`);
  }, [buildUrl, theme]);

  return (
    <div className={`${styles.wrap} ${fullscreen ? styles.fullscreen : ''} ${className ?? ''} ${fullscreen ? '' : 'glass-card border border-white/10 shadow-2xl'}`}>
      {src && (
        <iframe
          ref={frameRef}
          src={src}
          title="تست سلامت دسته"
          className={styles.frame}
          // Critical permissions for WebHID/Gamepad/USB
          allow="hid; gamepad; usb; serial; bluetooth; microphone; fullscreen"
          onLoad={() => applyTheme(theme)}
        />
      )}

      <button
        type="button"
        className={styles.reload}
        onClick={reload}
        title="بارگذاری دوباره"
        aria-label="بارگذاری دوباره"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
        </svg>
      </button>
    </div>
  );
}
