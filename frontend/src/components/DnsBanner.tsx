"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wifi, Copy, Check, X, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { useApp } from "@/lib/app";
import { DNS_CONFIG } from "@/lib/data";

export function DnsBanner() {
  const { t, n } = useApp();
  const [copiedType, setCopiedType] = useState<"primary" | "secondary" | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("drgame_dns_dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const copyToClipboard = (text: string, type: "primary" | "secondary") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("drgame_dns_dismissed", "true");
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="DNS Configuration Notice"
      className="relative z-50 border-b border-accent/40 bg-linear-to-r from-accent/25 via-surface-2/95 to-accent-2/25 px-4 py-2.5 text-xs backdrop-blur-md transition-all duration-300"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3">
        {/* Notice Text */}
        <div className="flex items-center gap-2.5 font-medium text-fg">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-2 shadow-glow-sm">
            <Wifi size={13} className="animate-pulse" />
          </span>
          <p className="leading-snug">
            <strong className="font-bold text-accent-2">
              {t("تنظیم دی‌ان‌اس کنسول:", "Console DNS Required:")}
            </strong>{" "}
            {t(
              "برای استفاده از نهایت سرعت دانلود نود تهران ۱ و ثبت پکیج‌ها در کنسول PS5/PS4، دی‌ان‌اس اختصاصی زیر را در تنظیمات شبکه وارد کنید.",
              "To route high-speed Tehran-1 edge traffic to your PS5/PS4 console, configure these DNS servers in Network Settings."
            )}
          </p>
        </div>

        {/* DNS Pills & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary DNS */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 py-1 shadow-xs">
            <span className="text-[10px] font-bold text-fg-2 uppercase">
              {t("اصلی", "Primary")}
            </span>
            <span dir="ltr" className="font-mono text-xs font-bold text-accent-2">
              {DNS_CONFIG.primary}
            </span>
            <button
              onClick={() => copyToClipboard(DNS_CONFIG.primary, "primary")}
              title={t("کپی دی‌ان‌اس اصلی", "Copy Primary DNS")}
              className="flex size-5 items-center justify-center rounded text-muted hover:text-fg transition-colors cursor-pointer"
            >
              {copiedType === "primary" ? (
                <Check size={12} className="text-success" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          {/* Secondary DNS */}
          <div className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 py-1 shadow-xs">
            <span className="text-[10px] font-bold text-fg-2 uppercase">
              {t("ثانویه", "Secondary")}
            </span>
            <span dir="ltr" className="font-mono text-xs font-bold text-accent-2">
              {DNS_CONFIG.secondary}
            </span>
            <button
              onClick={() => copyToClipboard(DNS_CONFIG.secondary, "secondary")}
              title={t("کپی دی‌ان‌اس ثانویه", "Copy Secondary DNS")}
              className="flex size-5 items-center justify-center rounded text-muted hover:text-fg transition-colors cursor-pointer"
            >
              {copiedType === "secondary" ? (
                <Check size={12} className="text-success" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>

          {/* Link to Video Tutorial */}
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-1 rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent-2 hover:bg-accent/30 transition-colors"
          >
            <span>{t("آموزش تصویری", "Video Guide")}</span>
            <ExternalLink size={12} />
          </Link>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="flex size-6 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-fg transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
