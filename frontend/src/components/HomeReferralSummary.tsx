"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Copy, Check, ArrowRight, Wallet, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app";

interface ReferralData {
  inviteCode: string;
  withdrawableBalance: number;
  pendingBalance: number;
  totalInvited: number;
}

export const HomeReferralSummary: React.FC = () => {
  const { t, n } = useApp();
  const [copied, setCopied] = useState(false);

  // Parity with logged-in user state & Branch Ledger v1.4.1
  const isLoggedIn = true;
  const referralData: ReferralData = {
    inviteCode: "DG-ARMAN24",
    withdrawableBalance: 2450000, // 2,450,000 Tomans
    pendingBalance: 780000,
    totalInvited: 18,
  };

  const copyInvite = () => {
    const link = `https://drgame.ir/auth?ref=${referralData.inviteCode}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full mb-8 rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-500/10 via-[#181a27] to-purple-500/10 p-4 md:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {t(
                "با معرفی دوستان خود تا ۲۱٪ از هر خرید پورسانت دائم دریافت کنید!",
                "Earn up to 21% lifetime commission by referring friends!"
              )}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                "سیستم رفرال شاخه‌ای دکتر گیم (Branch Ledger v1.4.1) با تسویه مستقیم شبا",
                "DrGame multi-tier affiliate system with direct IBAN settlement"
              )}
            </p>
          </div>
        </div>
        <Link
          href="/auth"
          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shrink-0"
        >
          {t("دریافت کد معرف و ورود", "Get Invite Code & Join")}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full mb-8 rounded-2xl border border-orange-500/40 bg-[#181a27]/90 backdrop-blur-md p-4 md:p-6 shadow-xl relative overflow-hidden group">
      {/* Background neon wash */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: User Invite Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-orange-400">
                {t("سیستم ارجاع و درآمدزایی (Branch Ledger)", "Branch Ledger Referral Network")}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                ۲۱٪ سهم شبکه
              </span>
            </div>
            <h3 className="text-base md:text-lg font-extrabold text-white mt-0.5">
              {t("خلاصه وضعیت معرف و پاداش‌های شما", "Your Referral & Earnings Overview")}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">{t("کد دعوت اختصاصی:", "Your Invite Code:")}</span>
              <code className="px-2 py-0.5 rounded bg-white/10 text-orange-300 font-mono font-bold text-xs">
                {referralData.inviteCode}
              </code>
              <button
                type="button"
                onClick={copyInvite}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                title="کپی لینک اختصاصی"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t("کپی شد", "Copied") : t("کپی لینک", "Copy Link")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Metrics & Actions */}
        <div className="w-full lg:w-auto flex flex-wrap items-center gap-4 md:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
          {/* Metric 1 */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t("موجودی قابل برداشت", "Withdrawable Balance")}</span>
            <span className="text-lg md:text-xl font-extrabold text-green-400 font-mono">
              {n(referralData.withdrawableBalance.toLocaleString())}{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">{t("تومان", "IRT")}</span>
            </span>
          </div>

          {/* Metric 2 */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t("در حال تعلیق", "Pending Balance")}</span>
            <span className="text-base md:text-lg font-bold text-amber-300 font-mono">
              {n(referralData.pendingBalance.toLocaleString())}{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">{t("تومان", "IRT")}</span>
            </span>
          </div>

          {/* Metric 3 */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t("کل دعوت‌شدگان", "Total Invited")}</span>
            <span className="text-base md:text-lg font-bold text-white font-mono">
              {n(referralData.totalInvited)}{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">{t("نفر", "gamers")}</span>
            </span>
          </div>

          {/* CTA Button */}
          <Link
            href="/panel?tab=referral"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-orange-500/30"
          >
            <Wallet className="w-4 h-4" />
            <span>{t("تسویه درآمد و لجر", "Withdraw & Ledger")}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeReferralSummary;
