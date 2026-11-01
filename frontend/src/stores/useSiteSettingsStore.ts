'use client';

import { create } from 'zustand';
import { apiRequest } from '@/lib/apiClient';
import { SiteSettings } from '@/types/settings';

interface SiteSettingsState {
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<SiteSettings | null>;
  setSettings: (settings: SiteSettings) => void;
}

export const useSiteSettingsStore = create<SiteSettingsState>((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    // Return cached if already loaded
    const current = get().settings;
    if (current) return current;

    set({ loading: true, error: null });
    try {
      // Try /settings, fallback to /site-settings
      let data: SiteSettings;
      try {
        data = await apiRequest<SiteSettings>('/settings');
      } catch {
        data = await apiRequest<SiteSettings>('/site-settings');
      }
      set({ settings: data, loading: false });
      return data;
    } catch (err: any) {
      console.warn('Failed to load site settings, using defaults:', err.message);
      set({ error: err.message, loading: false });
      return null;
    }
  },

  setSettings: (settings: SiteSettings) => set({ settings }),
}));

