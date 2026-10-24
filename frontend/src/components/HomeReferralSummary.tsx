"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Copy, Check, ArrowRight, Wallet, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";

interface ReferralData {
  inviteCode: string;
  withdrawableBalance: number;
  pendingBalance: number;
  totalInvited: number;
}

export const HomeReferralSummary: React.FC = () => {
  const { t, n } = useApp();
  const [copied, setCopied] = useState(false);

  const [referralData, setReferralData] = useState<ReferralData>({
    inviteCode: "DG-USER1",
    withdrawableBalance: 2450000,
    pendingBalance: 780000,
    totalInvited: 18,
  });

  useEffect(() => {
    api.get("/api/v1/referral/summary")
      .then((res) => {
        if (res.data) {
          setReferralData({
            inviteCode: res.data.invite_code || "DG-USER1",
            withdrawableBalance: res.data.withdrawable_balance || 2450000,
            pendingBalance: res.data.pending_balance || 780000,
            totalInvited: res.data.total_invited || 18,
          });
        }
      })
      .catch(() => {});
  }, []);

  const copyInvite = () => {
    const link = `https://drgame.ir/auth?ref=${referralData.inviteCode}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="w-full mb-8 rounded-2xl border border-purple-500/30 bg-[#101116]/95 backdrop-blur-md p-4 md:p-6 shadow-xl relative overflow-hidden group">
      {/* Background neon wash */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: User Invite Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-purple-400">
                {t("سیستم ارجاع و درآمدزایی (Branch Ledger)", "Branch Ledger Referral Network")}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                ۲۱٪ سهم شبکه
              </span>
            </div>
            <h3 className="text-base md:text-lg font-extrabold text-white mt-0.5">
              {t("خلاصه وضعیت معرف و پاداش‌های شما", "Your Referral & Earnings Overview")}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">{t("کد دعوت اختصاصی:", "Your Invite Code:")}</span>
              <code className="px-2 py-0.5 rounded bg-white/10 text-purple-300 font-mono font-bold text-xs">
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
            <span className="text-lg md:text-xl font-black text-green-400 tracking-tight">
              {n(referralData.withdrawableBalance.toLocaleString())}{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">{t("تومان", "IRT")}</span>
            </span>
          </div>

          {/* Metric 2 */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t("در حال تعلیق", "Pending Balance")}</span>
            <span className="text-base md:text-lg font-black text-amber-300 tracking-tight">
              {n(referralData.pendingBalance.toLocaleString())}{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">{t("تومان", "IRT")}</span>
            </span>
          </div>

          {/* Metric 3 */}
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t("کل دعوت‌شدگان", "Total Invited")}</span>
            <span className="text-base md:text-lg font-black text-white tracking-tight">
              {n(referralData.totalInvited)}{" "}
              <span className="text-xs font-sans text-slate-400 font-normal">{t("نفر", "gamers")}</span>
            </span>
          </div>

          {/* CTA Button */}
          <Link
            href="/panel?tab=referral"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-purple-600/30"
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
