'use client';

import { useState, useEffect } from 'react';

export interface ConsoleDeviceInfo {
  device: string; // 'PlayStation 4' | 'PlayStation 5'
  platform: 'PS4' | 'PS5';
  firmware: string; // e.g. 'FW 11.00'
  rawUa: string;
}

export function parseConsoleUa(ua: string): ConsoleDeviceInfo {
  const lower = ua.toLowerCase();

  // 1. PlayStation 5
  if (lower.includes('playstation 5') || lower.includes('ps5')) {
    const match = ua.match(/(?:PlayStation\s*5|PS5)[\s/]([0-9]+(?:\.[0-9]+)*)/i);
    const fw = match ? match[1] : '';
    return {
      device: 'PlayStation 5',
      platform: 'PS5',
      firmware: fw ? `FW ${fw}` : 'FW 8.00+',
      rawUa: ua,
    };
  }

  // 2. PlayStation 4
  if (lower.includes('playstation 4') || lower.includes('ps4')) {
    const match = ua.match(/(?:PlayStation\s*4|PS4)[\s/]([0-9]+(?:\.[0-9]+)*)/i);
    const fw = match ? match[1] : '';
    return {
      device: 'PlayStation 4',
      platform: 'PS4',
      firmware: fw ? `FW ${fw}` : 'FW 11.00',
      rawUa: ua,
    };
  }

  // Fallback for TV mode when user activates TV mode in browser
  return {
    device: 'PlayStation 4',
    platform: 'PS4',
    firmware: 'FW 11.00',
    rawUa: ua,
  };
}

export function useConsoleDevice(): ConsoleDeviceInfo {
  const [info, setInfo] = useState<ConsoleDeviceInfo>({
    device: 'PlayStation 4',
    platform: 'PS4',
    firmware: 'FW 11.00',
    rawUa: '',
  });

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setInfo(parseConsoleUa(navigator.userAgent));
    }
  }, []);

  return info;
}
