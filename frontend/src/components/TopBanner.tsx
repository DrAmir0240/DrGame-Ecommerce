"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Copy, Check, X } from "lucide-react";

export const TopBanner: React.FC = () => {
  const [copied, setCopied] = useState<"primary" | "secondary" | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(true);

  const PRIMARY_DNS = "178.22.122.100";
  const SECONDARY_DNS = "185.51.200.2";

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("drgame_dns_dismissed");
      if (isDismissed !== "true") {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const copyDNS = (ip: string, type: "primary" | "secondary") => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(ip);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("drgame_dns_dismissed", "true");
    } catch {}
  };

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 w-full bg-[#eab308] text-[#0f1016] px-4 py-2 text-xs md:text-sm font-bold shadow-md transition-all duration-300"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center flex-wrap gap-2">
          <ShieldAlert className="w-4 h-4 text-[#0f1016] shrink-0" />
          <span className="leading-tight">
            جهت دور زدن تحریم و افزایش سرعت دانلود کنسول، DNS اختصاصی دکتر گیم را تنظیم کنید:
          </span>
          <div className="inline-flex items-center gap-1 bg-[#0f1016]/10 px-2 py-0.5 rounded font-mono text-xs">
            <span>اصلی:</span>
            <span>{PRIMARY_DNS}</span>
            <button
              type="button"
              onClick={() => copyDNS(PRIMARY_DNS, "primary")}
              title="کپی DNS اصلی"
              className="p-0.5 hover:bg-black/10 rounded transition-colors"
            >
              {copied === "primary" ? (
                <Check className="w-3.5 h-3.5 text-green-900" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#0f1016]" />
              )}
            </button>
          </div>
          <div className="inline-flex items-center gap-1 bg-[#0f1016]/10 px-2 py-0.5 rounded font-mono text-xs">
            <span>کمکی:</span>
            <span>{SECONDARY_DNS}</span>
            <button
              type="button"
              onClick={() => copyDNS(SECONDARY_DNS, "secondary")}
              title="کپی DNS کمکی"
              className="p-0.5 hover:bg-black/10 rounded transition-colors"
            >
              {copied === "secondary" ? (
                <Check className="w-3.5 h-3.5 text-green-900" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#0f1016]" />
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 hover:bg-black/10 rounded text-[#0f1016] transition-colors"
          aria-label="بستن هشدار دی‌ان‌اس"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TopBanner;
