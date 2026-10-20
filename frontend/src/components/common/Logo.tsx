"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withGlow?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  withGlow = true,
}) => {
  const dimensions = {
    sm: { width: 110, height: 35 },
    md: { width: 145, height: 46 },
    lg: { width: 200, height: 64 },
  }[size];

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 group transition-all duration-300 ${className}`}
      data-nav-item="true"
    >
      <div
        className={`relative transition-transform duration-300 group-hover:scale-105 ${
          withGlow ? "drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]" : ""
        }`}
      >
        <Image
          src="/logo.png"
          alt="DrGame Logo"
          width={dimensions.width}
          height={dimensions.height}
          priority
          className="object-contain"
        />
      </div>
    </Link>
  );
};
