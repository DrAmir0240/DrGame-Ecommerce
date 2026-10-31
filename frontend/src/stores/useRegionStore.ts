import { create } from 'zustand';

export type RegionMode = 'domestic' | 'international';

interface RegionState {
  mode: RegionMode;
  hydrated: boolean;
  setMode: (mode: RegionMode) => void;
  toggleMode: () => void;
  initRegion: () => void;
}

const STORAGE_KEY = 'drgame_region_mode';
const COOKIE_KEY = 'drgame_region_mode';

function writeCookie(value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * Single source of truth for the payment/region switch (Iran/Shaparak vs Global/Crypto).
 * Used by the footer banner, the floating quick-actions panel and checkout.
 */
export const useRegionStore = create<RegionState>((set, get) => ({
  mode: 'domestic',
  hydrated: false,

  setMode: (mode) => {
    set({ mode });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
      writeCookie(mode);
    }
  },

  toggleMode: () => {
    const next: RegionMode = get().mode === 'domestic' ? 'international' : 'domestic';
    get().setMode(next);
  },

  initRegion: () => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'domestic' || stored === 'international') {
      set({ mode: stored, hydrated: true });
      return;
    }

    const cookieMatch = document.cookie.match(/(?:^|;\s*)drgame_region_mode=(domestic|international)/);
    if (cookieMatch) {
      set({ mode: cookieMatch[1] as RegionMode, hydrated: true });
      return;
    }

    set({ hydrated: true });
  },
}));
