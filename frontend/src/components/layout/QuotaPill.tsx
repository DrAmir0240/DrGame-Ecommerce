"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { HardDrive, Sparkles } from "lucide-react";
import { useQuotaStore } from "@/stores/quotaStore";

export const QuotaPill: React.FC = () => {
  const { quota, fetchQuota, isLoading } = useQuotaStore();

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return (
    <Link
      href="/subscriptions"
      data-nav-item="true"
      title="مشاهده و ارتقای سهمیه دانلود"
      className="group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cosmic-light/40 hover:border-cosmic-light transition-all duration-300 bg-gradient-to-r from-cosmic-dark/40 via-oled-card to-cosmic-dark/20 hover:shadow-cosmic cursor-pointer overflow-hidden"
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-cosmic-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Storage Icon */}
      <div className="relative p-1 rounded-full bg-cosmic-primary/20 text-cosmic-light group-hover:scale-110 transition-transform duration-300">
        <HardDrive className="w-3.5 h-3.5" />
      </div>

      {/* Quota Text */}
      <div className="flex flex-col text-start">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-white tracking-wide">
            {isLoading ? "..." : quota.formatted_pill_text}
          </span>
          {quota.has_active_subscription && (
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-cosmic-light/20 text-cosmic-light border border-cosmic-light/30">
              {quota.tier_name}
            </span>
          )}
        </div>
      </div>

      {/* Sparkle icon */}
      <Sparkles className="w-3 h-3 text-amber-300 opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
    </Link>
  );
};
