'use client';

import React from 'react';

interface PlatformIconProps {
  platform: string;
  className?: string;
  size?: number;
}

export function PlatformIcon({ platform, className = '', size = 16 }: PlatformIconProps) {
  const p = platform.toLowerCase();

  // PlayStation (PS5, PS4, PlayStation)
  if (p.includes('ps') || p.includes('playstation')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#0070d1] ${className}`}
      >
        <title>PlayStation</title>
        <path d="M8.5 3.5C7.2 4.1 6.8 5.2 6.8 6.6v10.8c.8.3 1.8.4 2.8.2v-7.1c0-.9.2-1.7 1.1-1.5.8.2 1 .9 1 1.7v4.6c2.4-.9 4.3-2.6 4.3-5.2 0-3.3-2.1-4.8-5.3-5.7-.7-.2-1.4-.4-2.2-.6zm-5 13.9c-.8.3-1.3.8-1.5 1.3-.2.8.3 1.5 1.5 1.8 1.4.4 3.4.4 5.3 0l2.4-.6v-2.2l-3.3.8c-1.3.3-2.5.3-3.4 0-.6-.2-.9-.7-.5-1.1zm17.9 1.1c-1.3-.4-2.8-.4-4.5 0l-3.8.9v2.2l4.8-1.2c1.4-.4 2.5-.4 3.2 0 .5.3.4.8-.3 1.2-.8.5-2.2.9-3.8 1.1l-.3 1.9c2.3-.2 4.3-.9 5.3-1.8 1.1-1 .8-2.2-.6-2.6z" />
      </svg>
    );
  }

  // Xbox (Xbox Series, One, 360)
  if (p.includes('xbox')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#107c10] ${className}`}
      >
        <title>Xbox</title>
        <path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.42 3.12 7.24-.04-.54.1-1.07.41-1.55 1.55-2.39 4.28-5.31 6.47-7.22-2.19 1.91-4.92 4.83-6.47 7.22-.31.48-.45 1.01-.41 1.55C6.58 20.8 9.15 22 12 22s5.42-1.2 6.88-2.76c.04-.54-.1-1.07-.41-1.55-1.55-2.39-4.28-5.31-6.47-7.22 2.19 1.91 4.92 4.83 6.47 7.22.31.48.45 1.01.41 1.55C20.8 17.42 22 14.85 22 12c0-5.52-4.48-10-10-10zm-4.7 3.5c1.47 0 2.8.58 3.77 1.52-.77.89-1.84 2.4-2.6 3.71C7.6 9.4 6.74 8.04 6.07 6.94c.38-.85.83-1.44 1.23-1.44zm9.4 0c.4 0 .85.59 1.23 1.44-.67 1.1-1.53 2.46-2.4 3.79-.76-1.31-1.83-2.82-2.6-3.71.97-.94 2.3-1.52 3.77-1.52z" />
      </svg>
    );
  }

  // Nintendo Switch
  if (p.includes('switch') || p.includes('nintendo')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`text-[#e60012] ${className}`}
      >
        <title>Nintendo Switch</title>
        <path d="M7.7 2C3.5 2 2 3.5 2 7.7v8.6C2 20.5 3.5 22 7.7 22H9V2H7.7zm-.2 6.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5zM15 2v20h1.3c4.2 0 5.7-1.5 5.7-5.7V7.7C22 3.5 20.5 2 16.3 2H15zm2.5 13.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
      </svg>
    );
  }

  // Windows / PC
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`text-[#00a4ef] ${className}`}
    >
      <title>PC / Windows</title>
      <path d="M3 5.45l7.15-1 .01 6.8-7.16.05V5.45zm0 13.1l7.16.99v-6.83l-7.16.03v5.81zm8.05 1.12L21 21.3V12.7l-9.95.04v6.93zm0-15.34v6.93l9.95-.04V2.7l-9.95 2.03z" />
    </svg>
  );
}

export default PlatformIcon;
