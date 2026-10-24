"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Copy, Check, X, PhoneCall } from "lucide-react";
import { api } from "@/lib/api";
import { useContactInfo } from "@/lib/contact";

export const TopBanner: React.FC = () => {
  const [contact] = useContactInfo();
  const [copied, setCopied] = useState<"primary" | "secondary" | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [primaryDns, setPrimaryDns] = useState("178.22.122.100");
  const [secondaryDns, setSecondaryDns] = useState("185.51.200.2");
  const [message, setMessage] = useState(
    "جهت دور زدن تحریم و افزایش سرعت دانلود کنسول، DNS اختصاصی دکتر گیم را تنظیم کنید:"
  );

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem("drgame_dns_dismissed");
      if (isDismissed !== "true") {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }

    // Fetch dynamic DNS settings from backend API
    api.get("/api/v1/settings/public")
      .then((res) => {
        if (res.data?.dns_banner) {
          const cfg = res.data.dns_banner;
          if (cfg.is_active === false) {
            setDismissed(true);
          } else {
            if (cfg.primary_dns) setPrimaryDns(cfg.primary_dns);
            if (cfg.secondary_dns) setSecondaryDns(cfg.secondary_dns);
            if (cfg.message_fa) setMessage(cfg.message_fa);
          }
        }
      })
      .catch(() => {
        // Fallback to default safe IPs
      });
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
      className="sticky top-0 z-50 w-full bg-[#eab308] text-[#070709] px-4 py-2 text-xs md:text-sm font-bold shadow-md transition-all duration-300"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center flex-wrap gap-2">
          <ShieldAlert className="w-4 h-4 text-[#070709] shrink-0" />
          <span className="leading-tight">{message}</span>
          <div className="inline-flex items-center gap-1 bg-[#070709]/10 px-2 py-0.5 rounded font-mono text-xs">
            <span>اصلی:</span>
            <span>{primaryDns}</span>
            <button
              type="button"
              onClick={() => copyDNS(primaryDns, "primary")}
              title="کپی DNS اصلی"
              className="p-0.5 hover:bg-black/10 rounded transition-colors"
            >
              {copied === "primary" ? (
                <Check className="w-3.5 h-3.5 text-green-900" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#070709]" />
              )}
            </button>
          </div>
          <div className="inline-flex items-center gap-1 bg-[#070709]/10 px-2 py-0.5 rounded font-mono text-xs">
            <span>ثانویه:</span>
            <span>{secondaryDns}</span>
            <button
              type="button"
              onClick={() => copyDNS(secondaryDns, "secondary")}
              title="کپی DNS ثانویه"
              className="p-0.5 hover:bg-black/10 rounded transition-colors"
            >
              {copied === "secondary" ? (
                <Check className="w-3.5 h-3.5 text-green-900" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#070709]" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold bg-[#070709]/10 px-2.5 py-1 rounded-lg">
            <PhoneCall className="w-3.5 h-3.5 text-[#070709]" />
            <span>پشتیبانی: {contact.phone1}</span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            title="بستن هشدار"
            className="p-1 hover:bg-black/10 rounded-md transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-[#070709]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
