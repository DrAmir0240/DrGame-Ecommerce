'use client';

import { useState, useEffect } from 'react';

export interface ConsoleDeviceInfo {
  device: string; // 'PlayStation 5' | 'PlayStation 4' | 'PlayStation'
  platform: 'PS4' | 'PS5';
  firmware: string; // e.g. 'DualSense Wireless' | 'DualShock 4' | 'FW 11.00'
  rawUa: string;
  connected: boolean;
}

/**
 * Checks currently connected physical Gamepads via Web Gamepad API.
 * Identifies PS5 (DualSense / DualSense Edge) vs PS4 (DualShock 4).
 */
export function detectConnectedGamepad(): { device: string; platform: 'PS4' | 'PS5'; firmware: string } | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
  const pads = navigator.getGamepads();
  if (!pads) return null;

  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad || !pad.connected) continue;
    const id = (pad.id || '').toLowerCase();

    // 1. PlayStation 5 (DualSense / DualSense Edge)
    if (
      id.includes('dualsense') ||
      id.includes('ps5') ||
      id.includes('0ce6') ||
      id.includes('0df2')
    ) {
      return {
        device: 'PlayStation 5',
        platform: 'PS5',
        firmware: id.includes('edge') ? 'DualSense Edge' : 'DualSense Wireless',
      };
    }

    // 2. PlayStation 4 (DualShock 4)
    if (
      id.includes('dualshock') ||
      id.includes('ps4') ||
      id.includes('05c4') ||
      id.includes('09cc')
    ) {
      return {
        device: 'PlayStation 4',
        platform: 'PS4',
        firmware: 'DualShock 4 Wireless',
      };
    }

    // 3. Sony vendor ID (054c)
    if (id.includes('054c') || id.includes('wireless controller')) {
      return {
        device: 'PlayStation 5',
        platform: 'PS5',
        firmware: 'DualSense Controller',
      };
    }
  }

  return null;
}

/**
 * Checks console browser user agent
 */
export function parseConsoleUa(ua: string): { device: string; platform: 'PS4' | 'PS5'; firmware: string } | null {
  const lower = ua.toLowerCase();

  if (lower.includes('playstation 5') || lower.includes('ps5')) {
    const match = ua.match(/(?:PlayStation\s*5|PS5)[\s/]([0-9]+(?:\.[0-9]+)*)/i);
    const fw = match ? match[1] : '';
    return {
      device: 'PlayStation 5',
      platform: 'PS5',
      firmware: fw ? `FW ${fw}` : 'FW 8.00+',
    };
  }

  if (lower.includes('playstation 4') || lower.includes('ps4')) {
    const match = ua.match(/(?:PlayStation\s*4|PS4)[\s/]([0-9]+(?:\.[0-9]+)*)/i);
    const fw = match ? match[1] : '';
    return {
      device: 'PlayStation 4',
      platform: 'PS4',
      firmware: fw ? `FW ${fw}` : 'FW 11.00',
    };
  }

  return null;
}

export function useConsoleDevice(): ConsoleDeviceInfo {
  const [info, setInfo] = useState<ConsoleDeviceInfo>({
    device: 'PlayStation 5',
    platform: 'PS5',
    firmware: 'در انتظار اتصال دسته',
    rawUa: '',
    connected: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const evaluateDevice = () => {
      // 1. First priority: Check physically connected Gamepad (DualSense vs DualShock 4)
      const padInfo = detectConnectedGamepad();
      if (padInfo) {
        setInfo({
          device: padInfo.device,
          platform: padInfo.platform,
          firmware: padInfo.firmware,
          rawUa: navigator.userAgent,
          connected: true,
        });
        try {
          localStorage.setItem('drgame_detected_console', padInfo.platform);
        } catch {}
        return;
      }

      // 2. Second priority: Check Browser User-Agent on actual PS4/PS5 consoles
      const uaInfo = parseConsoleUa(navigator.userAgent);
      if (uaInfo) {
        setInfo({
          device: uaInfo.device,
          platform: uaInfo.platform,
          firmware: uaInfo.firmware,
          rawUa: navigator.userAgent,
          connected: true,
        });
        try {
          localStorage.setItem('drgame_detected_console', uaInfo.platform);
        } catch {}
        return;
      }

      // 3. Fallback: Remembered console or default PlayStation 5
      let saved = null;
      try {
        saved = localStorage.getItem('drgame_detected_console');
      } catch {}

      if (saved === 'PS4') {
        setInfo({
          device: 'PlayStation 4',
          platform: 'PS4',
          firmware: 'DualShock 4',
          rawUa: navigator.userAgent,
          connected: false,
        });
      } else {
        setInfo({
          device: 'PlayStation 5',
          platform: 'PS5',
          firmware: 'DualSense',
          rawUa: navigator.userAgent,
          connected: false,
        });
      }
    };

    evaluateDevice();

    const onGamepadConnected = () => {
      evaluateDevice();
    };

    const onGamepadDisconnected = () => {
      setTimeout(evaluateDevice, 200);
    };

    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    // Poll every 1 second to detect when gamepad button is activated
    const pollTimer = setInterval(evaluateDevice, 1000);

    return () => {
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
      clearInterval(pollTimer);
    };
  }, []);

  return info;
}
