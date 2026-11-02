import { create } from 'zustand';

interface TvModeState {
  isTvMode: boolean;
  zoomLevel: number;
  showZoomHud: boolean;
  openTvMode: () => void;
  closeTvMode: () => void;
  toggleTvMode: () => void;
  initTvDetection: () => void;
  adjustZoom: (delta: number) => void;
  resetZoom: () => void;
}

let hudTimeout: NodeJS.Timeout | null = null;

const applyTvClass = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('tv-mode');
  } else {
    document.documentElement.classList.remove('tv-mode');
    (document.documentElement.style as any).zoom = '';
  }
};

export const useTvModeStore = create<TvModeState>((set, get) => ({
  isTvMode: false,
  zoomLevel: 1.0,
  showZoomHud: false,

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
    set({ isTvMode: false, zoomLevel: 1.0, showZoomHud: false });
  },

  toggleTvMode: () => {
    const nextState = !get().isTvMode;
    applyTvClass(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_tv_mode', nextState ? 'true' : 'false');
    }
    set({ isTvMode: nextState });
  },

  adjustZoom: (delta: number) => {
    const current = get().zoomLevel;
    // Clamp zoom between 0.65 (65%) and 1.30 (130%)
    const nextZoom = Math.min(1.30, Math.max(0.65, Math.round((current + delta) * 100) / 100));
    
    if (typeof document !== 'undefined') {
      (document.documentElement.style as any).zoom = nextZoom.toFixed(2);
    }

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      set({ showZoomHud: false });
    }, 1200);

    set({ zoomLevel: nextZoom, showZoomHud: true });
  },

  resetZoom: () => {
    if (typeof document !== 'undefined') {
      (document.documentElement.style as any).zoom = '';
    }
    set({ zoomLevel: 1.0, showZoomHud: false });
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

    // Auto-detect resolution changes
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