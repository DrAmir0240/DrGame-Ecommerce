'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectConsoleEnvironment } from '@/stores/useConsoleStorageStore';

const STORAGE_KEY = 'drgame_download32_handoff';
const HANDOFF_REGEX = /^[A-Za-z0-9_-]{43}$/;

export interface Ps5HandoffState {
  handoffSecret: string | null;
  isPs5Device: boolean;
  isPs4Device: boolean;
  isConsole: boolean;
  consolePlatform: 'ps5' | 'ps4' | 'desktop';
  detectedFirmware: string | null;
  clearHandoff: () => void;
  setManualHandoff: (secret: string) => void;
}

export function usePs5Handoff(): Ps5HandoffState {
  const [handoffSecret, setHandoffSecret] = useState<string | null>(null);
  const [consoleInfo, setConsoleInfo] = useState<{
    isConsole: boolean;
    platform: 'ps5' | 'ps4' | 'desktop';
    firmware: string | null;
  }>({
    isConsole: false,
    platform: 'desktop',
    firmware: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect hardware & browser user-agent
    const detected = detectConsoleEnvironment();
    setConsoleInfo(detected);

    // 1. Check existing session storage
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved && HANDOFF_REGEX.test(saved)) {
      setHandoffSecret(saved);
    }

    // 2. Read URL hash for #ps5=<secret>
    const hash = window.location.hash.slice(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const incoming = params.get('ps5');
      if (incoming && HANDOFF_REGEX.test(incoming)) {
        sessionStorage.setItem(STORAGE_KEY, incoming);
        setHandoffSecret(incoming);

        // Remove hash from address bar cleanly without page reload
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', cleanUrl);
      }
    }
  }, []);

  const clearHandoff = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setHandoffSecret(null);
  }, []);

  const setManualHandoff = useCallback((secret: string) => {
    if (HANDOFF_REGEX.test(secret)) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, secret);
      }
      setHandoffSecret(secret);
    }
  }, []);

  const isPs5 = Boolean(handoffSecret) || consoleInfo.platform === 'ps5';
  const isPs4 = consoleInfo.platform === 'ps4';
  const isConsole = isPs5 || isPs4;

  return {
    handoffSecret,
    isPs5Device: isPs5,
    isPs4Device: isPs4,
    isConsole,
    consolePlatform: isPs5 ? 'ps5' : isPs4 ? 'ps4' : 'desktop',
    detectedFirmware: consoleInfo.firmware,
    clearHandoff,
    setManualHandoff,
  };
}
