'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'drgame_download32_handoff';
const HANDOFF_REGEX = /^[A-Za-z0-9_-]{43}$/;

export interface Ps5HandoffState {
  handoffSecret: string | null;
  isPs5Device: boolean;
  clearHandoff: () => void;
  setManualHandoff: (secret: string) => void;
}

export function usePs5Handoff(): Ps5HandoffState {
  const [handoffSecret, setHandoffSecret] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  return {
    handoffSecret,
    isPs5Device: Boolean(handoffSecret),
    clearHandoff,
    setManualHandoff,
  };
}
