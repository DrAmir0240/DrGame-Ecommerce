'use client';

import React from 'react';

interface PlatformIconProps {
  platform: string;
  className?: string;
  size?: number;
}

export function PlatformIcon({ platform, className = '', size = 16 }: PlatformIconProps) {
  const p = (platform || '').toLowerCase().trim();

  // Remove Microsoft / Windows / PC logo completely
  if (p === 'pc' || p.includes('windows') || p.includes('microsoft')) {
    return null;
  }

  // PlayStation VR
  if (p.includes('vr') || p.includes('psvr')) {
    return (
      <img
        src="/platforms/psvr-white.png"
        alt="PlayStation VR"
        title="PlayStation VR"
        style={{ maxHeight: size, width: 'auto' }}
        className={`object-contain inline-block shrink-0 ${className}`}
      />
    );
  }

  // PlayStation 5
  if (p.includes('ps5') || p.includes('playstation 5')) {
    const psSize = Math.max(size, 26);
    return (
      <img
        src="/platforms/ps5-white.png"
        alt="PlayStation 5"
        title="PlayStation 5"
        style={{ maxHeight: psSize, width: 'auto' }}
        className={`object-contain inline-block shrink-0 ${className}`}
      />
    );
  }

  // PlayStation 4
  if (p.includes('ps4') || p.includes('playstation 4')) {
    const psSize = Math.max(size, 26);
    return (
      <img
        src="/platforms/ps4-white.png"
        alt="PlayStation 4"
        title="PlayStation 4"
        style={{ maxHeight: psSize, width: 'auto' }}
        className={`object-contain inline-block shrink-0 ${className}`}
      />
    );
  }

  // General PlayStation (fallback to PS5)
  if (p.includes('ps') || p.includes('playstation')) {
    const psSize = Math.max(size, 26);
    return (
      <img
        src="/platforms/ps5-white.png"
        alt="PlayStation"
        title="PlayStation"
        style={{ maxHeight: psSize, width: 'auto' }}
        className={`object-contain inline-block shrink-0 ${className}`}
      />
    );
  }

  // Xbox (Series X/S, One, 360)
  if (p.includes('xbox')) {
    return (
      <img
        src="/platforms/xbox.png"
        alt="Xbox"
        title="Xbox"
        style={{ maxHeight: size, width: 'auto' }}
        className={`object-contain inline-block shrink-0 ${className}`}
      />
    );
  }

  // Nintendo Switch
  if (p.includes('switch') || p.includes('nintendo')) {
    return (
      <img
        src="/platforms/nintendo.png"
        alt="Nintendo Switch"
        title="Nintendo Switch"
        style={{ maxHeight: size, width: 'auto' }}
        className={`object-contain inline-block shrink-0 ${className}`}
      />
    );
  }

  // Fallback: no Microsoft logo or unknown logo
  return null;
}

export default PlatformIcon;
