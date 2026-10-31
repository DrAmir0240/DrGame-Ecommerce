import { create } from 'zustand';

interface TvModeState {
  isTvMode: boolean;
  openTvMode: () => void;
  closeTvMode: () => void;
  toggleTvMode: () => void;
  initTvDetection: () => void;
}

const applyTvClass = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('tv-mode');
  } else {
    document.documentElement.classList.remove('tv-mode');
  }
};

export const useTvModeStore = create<TvModeState>((set, get) => ({
  isTvMode: false,

  openTvMode: () => {
    applyTvClass(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_tv_mode', 'true');
    }
    set({ isTvMode: true });
  },

  closeTvMode: () => {
    applyTvClass(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_tv_mode', 'false');
    }
    set({ isTvMode: false });
  },

  toggleTvMode: () => {
    const nextState = !get().isTvMode;
    applyTvClass(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_tv_mode', nextState ? 'true' : 'false');
    }
    set({ isTvMode: nextState });
  },

  initTvDetection: () => {
    if (typeof window === 'undefined') return;

    const checkShouldEnable = () => {
      // 1. Explicit user choice in localStorage
      const stored = localStorage.getItem('drgame_tv_mode');
      if (stored === 'true') return true;
      if (stored === 'false') return false;

      // 2. Query param ?tv=1 or ?mode=tv
      if (window.location.search.includes('tv=1') || window.location.search.includes('mode=tv')) {
        return true;
      }

      // 3. User agent detection for consoles & smart TVs
      const ua = navigator.userAgent.toLowerCase();
      const isConsoleOrTv =
        ua.includes('playstation') ||
        ua.includes('ps4') ||
        ua.includes('ps5') ||
        ua.includes('xbox') ||
        ua.includes('smart-tv') ||
        ua.includes('tizen') ||
        ua.includes('webos') ||
        ua.includes('appletv') ||
        ua.includes('android tv') ||
        ua.includes('crkey');

      if (isConsoleOrTv) return true;

      // 4. Typical 10-foot TV resolution check (Full HD / 4K with 16:9 ratio in standalone or gamepad)
      const hasGamepad =
        typeof navigator.getGamepads === 'function' &&
        Array.from(navigator.getGamepads()).some((gp) => gp !== null);

      if (hasGamepad && window.innerWidth >= 1920 && window.innerHeight >= 1080) {
        return true;
      }

      return false;
    };

    const isEnabled = checkShouldEnable();
    if (isEnabled) {
      applyTvClass(true);
      set({ isTvMode: true });
    }

    // Auto-detect gamepad plug-in event
    window.addEventListener('gamepadconnected', () => {
      const stored = localStorage.getItem('drgame_tv_mode');
      if (stored !== 'false') {
        applyTvClass(true);
        set({ isTvMode: true });
      }
    });

    // Auto-detect resolution changes (e.g. going fullscreen on a 1080p/4K TV)
    window.addEventListener('resize', () => {
      const stored = localStorage.getItem('drgame_tv_mode');
      if (!stored) {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('playstation') || ua.includes('ps5') || ua.includes('ps4')) {
          applyTvClass(true);
          set({ isTvMode: true });
        }
      }
    });
  },
}));
