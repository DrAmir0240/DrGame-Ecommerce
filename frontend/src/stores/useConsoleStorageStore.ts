'use client';

import { create } from 'zustand';
import { apiRequest } from '@/lib/apiClient';

export interface DeviceStorageItem {
  device_name: string;
  volume: string;
  total_bytes: number;
  free_bytes: number;
  reported_at: number;
  age_seconds: number;
  stale: boolean;
}

interface ConsoleStorageState {
  isConsole: boolean;
  consolePlatform: 'ps5' | 'ps4' | 'desktop';
  detectedFirmware: string | null;
  devices: DeviceStorageItem[];
  freeStorageGb: number | null;
  totalStorageGb: number | null;
  usedPercent: number | null;
  deviceName: string | null;
  volume: string | null;
  isStale: boolean;
  isLoading: boolean;
  lastFetchedAt: number | null;
  initConsoleDetection: () => void;
  fetchStorage: (force?: boolean) => Promise<void>;
}

export function detectConsoleEnvironment(): {
  isConsole: boolean;
  platform: 'ps5' | 'ps4' | 'desktop';
  firmware: string | null;
} {
  if (typeof window === 'undefined') {
    return { isConsole: false, platform: 'desktop', firmware: null };
  }

  // 1. Check existing sessionStorage handoff secret
  const savedHandoff = sessionStorage.getItem('drgame_download32_handoff');
  if (savedHandoff && /^[A-Za-z0-9_-]{43}$/.test(savedHandoff)) {
    return { isConsole: true, platform: 'ps5', firmware: null };
  }

  // 2. Check Browser User-Agent on actual PS5 or PS4
  const ua = navigator.userAgent || '';
  const lower = ua.toLowerCase();

  if (lower.includes('playstation 5') || lower.includes('ps5')) {
    const match = ua.match(/(?:PlayStation\s*5|PS5)[\s/]([0-9]+(?:\.[0-9]+)*)/i);
    const fw = match ? `FW ${match[1]}` : null;
    return { isConsole: true, platform: 'ps5', firmware: fw };
  }

  if (lower.includes('playstation 4') || lower.includes('ps4')) {
    const match = ua.match(/(?:PlayStation\s*4|PS4)[\s/]([0-9]+(?:\.[0-9]+)*)/i);
    const fw = match ? `FW ${match[1]}` : null;
    return { isConsole: true, platform: 'ps4', firmware: fw };
  }

  // 3. Check connected Web Gamepad API (DualSense or DualShock)
  if (navigator.getGamepads) {
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      if (!pad || !pad.connected) continue;
      const id = (pad.id || '').toLowerCase();
      if (id.includes('dualsense') || id.includes('0ce6') || id.includes('0df2')) {
        return { isConsole: true, platform: 'ps5', firmware: 'DualSense Connected' };
      }
      if (id.includes('dualshock') || id.includes('05c4') || id.includes('09cc')) {
        return { isConsole: true, platform: 'ps4', firmware: 'DualShock Connected' };
      }
    }
  }

  return { isConsole: false, platform: 'desktop', firmware: null };
}

export const useConsoleStorageStore = create<ConsoleStorageState>((set, get) => ({
  isConsole: false,
  consolePlatform: 'desktop',
  detectedFirmware: null,
  devices: [],
  freeStorageGb: null,
  totalStorageGb: null,
  usedPercent: null,
  deviceName: null,
  volume: null,
  isStale: false,
  isLoading: false,
  lastFetchedAt: null,

  initConsoleDetection: () => {
    const detected = detectConsoleEnvironment();
    set({
      isConsole: detected.isConsole,
      consolePlatform: detected.platform,
      detectedFirmware: detected.firmware,
    });
  },

  fetchStorage: async (force: boolean = false) => {
    const state = get();
    const now = Date.now();

    // Debounce to at most once every 6 seconds unless forced
    if (!force && state.lastFetchedAt && now - state.lastFetchedAt < 6000) {
      return;
    }

    const detected = detectConsoleEnvironment();
    let handoffSecret: string | null = null;
    if (typeof window !== 'undefined') {
      handoffSecret = sessionStorage.getItem('drgame_download32_handoff');
    }

    // If neither console user-agent nor handoff code is present, no telemetry query needed
    if (!detected.isConsole && !handoffSecret) {
      set({
        isConsole: false,
        consolePlatform: 'desktop',
        devices: [],
        isLoading: false,
      });
      return;
    }

    set({ isLoading: true });

    try {
      const res = await apiRequest<{ devices: DeviceStorageItem[] }>('/account/storage', {
        method: 'POST',
        body: JSON.stringify({ handoff: handoffSecret || undefined }),
      });

      if (res?.devices && res.devices.length > 0) {
        const primary = res.devices[0];
        const total = primary.total_bytes;
        const free = primary.free_bytes;
        const used = Math.max(0, total - free);
        const usedPercent = Math.min(100, Math.max(0, Math.round((used / total) * 100)));
        const freeGb = Math.round((free / (1024 * 1024 * 1024)) * 10) / 10;
        const totalGb = Math.round((total / (1024 * 1024 * 1024)) * 10) / 10;

        set({
          isConsole: true,
          consolePlatform: detected.platform,
          detectedFirmware: detected.firmware,
          devices: res.devices,
          freeStorageGb: freeGb,
          totalStorageGb: totalGb,
          usedPercent,
          deviceName: primary.device_name || (detected.platform === 'ps4' ? 'کنسول پلی‌استیشن ۴' : 'کنسول پلی‌استیشن ۵'),
          volume: primary.volume,
          isStale: primary.stale,
          isLoading: false,
          lastFetchedAt: now,
        });
      } else {
        set({
          isConsole: detected.isConsole,
          consolePlatform: detected.platform,
          detectedFirmware: detected.firmware,
          devices: [],
          isLoading: false,
          lastFetchedAt: now,
        });
      }
    } catch {
      set({
        isConsole: detected.isConsole,
        consolePlatform: detected.platform,
        detectedFirmware: detected.firmware,
        isLoading: false,
        lastFetchedAt: now,
      });
    }
  },
}));
