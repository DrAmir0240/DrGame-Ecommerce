"use client";

import React from "react";

export interface PlatformBadgeProps {
  platform: "PS4" | "PS5" | "PSVR2" | "Switch" | "Xbox" | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const PLATFORM_MAP: Record<string, { icon: string; label: string; color: string }> = {
  PS5: { icon: "/assets/platforms/ps5.svg", label: "PlayStation 5", color: "from-blue-600 to-indigo-600" },
  PS4: { icon: "/assets/platforms/ps4.svg", label: "PlayStation 4", color: "from-blue-700 to-cyan-600" },
  PSVR2: { icon: "/assets/platforms/psvr2.svg", label: "PS VR2", color: "from-purple-600 to-pink-600" },
  Switch: { icon: "/assets/platforms/switch.svg", label: "Switch", color: "from-red-600 to-rose-600" },
  Xbox: { icon: "/assets/platforms/xbox360.svg", label: "Xbox", color: "from-emerald-600 to-teal-600" },
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  size = "md",
  showLabel = true,
  className = "",
}) => {
  const normKey = Object.keys(PLATFORM_MAP).find(
    (k) => k.toLowerCase() === platform.toLowerCase()
  ) || platform;

  const info = PLATFORM_MAP[normKey] || {
    icon: "/assets/platforms/ps5.svg",
    label: platform,
    color: "from-purple-600 to-indigo-600",
  };

  const sizeClasses = {
    sm: "h-5 text-[10px] px-2 gap-1.5",
    md: "h-6 text-xs px-2.5 gap-2",
    lg: "h-8 text-sm px-3.5 gap-2.5",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg bg-[#151722]/80 border border-white/10 text-white font-bold backdrop-blur-md shadow-sm transition-all hover:border-purple-500/40 ${sizeClasses} ${className}`}
    >
      <img
        src={info.icon}
        alt={info.label}
        className={`${iconSizes} object-contain filter brightness-110 shrink-0`}
      />
      {showLabel && <span className="font-mono tracking-tight">{info.label}</span>}
    </span>
  );
};

export default PlatformBadge;
