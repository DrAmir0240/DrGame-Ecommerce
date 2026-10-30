import { create } from 'zustand';

interface TvModeState {
  isTvMode: boolean;
  openTvMode: () => void;
  closeTvMode: () => void;
  toggleTvMode: () => void;
  initTvDetection: () => void;
}

export const useTvModeStore = create<TvModeState>((set) => ({
  isTvMode: false,
  openTvMode: () => set({ isTvMode: true }),
  closeTvMode: () => set({ isTvMode: false }),
  toggleTvMode: () => set((state) => ({ isTvMode: !state.isTvMode })),
  initTvDetection: () => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    const isPlayStation = ua.includes('playstation') || ua.includes('ps4') || ua.includes('ps5');
    const isTvUrl = window.location.search.includes('tv=1') || window.location.search.includes('mode=tv');
    if (isPlayStation || isTvUrl) {
      set({ isTvMode: true });
    }
  },
}));

