"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Coins,
  ShieldCheck,
  QrCode,
  Clock,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/app";

export interface GatewayOption {
  id: string;
  nameFa: string;
  nameEn: string;
  type: "shetab" | "crypto" | "mock";
  badge?: string;
}

export const GATEWAY_OPTIONS: GatewayOption[] = [
  { id: "zarinpal", nameFa: "زرین‌پال (شاپرک)", nameEn: "ZarinPal", type: "shetab", badge: "پیشنهادی" },
  { id: "zibal", nameFa: "زیبال (کارت‌های عضو شتاب)", nameEn: "Zibal", type: "shetab" },
  { id: "idpay", nameFa: "آی‌دی‌پی", nameEn: "IDPay", type: "shetab" },
  { id: "crypto", nameFa: "پرداخت رمزارز (تتر / بیت‌کوین)", nameEn: "Crypto (USDT / BTC)", type: "crypto", badge: "بین‌المللی" },
];

/** 1. Shetab Gateway Selection Container */
export const ShetabGatewaySelector: React.FC<{
  selectedGateway: string;
  onSelect: (id: string) => void;
}> = ({ selectedGateway, onSelect }) => {
  const { t } = useApp();

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-orange-400" />
        <span>{t("انتخاب درگاه پرداخت الکترونیک:", "Choose Payment Method:")}</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GATEWAY_OPTIONS.map((gw) => {
          const isSelected = selectedGateway === gw.id;
          return (
            <button
              key={gw.id}
              type="button"
              onClick={() => onSelect(gw.id)}
              className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-orange-500/15 border-orange-500 shadow-md shadow-orange-500/20 text-white"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected ? "bg-orange-600 text-white" : "bg-white/10 text-slate-400"
                  }`}
                >
                  {gw.type === "crypto" ? <Coins className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold block">{t(gw.nameFa, gw.nameEn)}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {gw.type === "shetab" ? t("تمامی کارت‌های بانکی عضو شتاب", "All Iranian Bank Cards") : t("تتر، بیت‌کوین و اتریوم", "USDT, BTC & ETH")}
                  </span>
                </div>
              </div>

              {gw.badge && (
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-extrabold border border-orange-500/30">
                  {gw.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** 2. Crypto Payment Box Placeholder with 15-min countdown */
export const CryptoPaymentBox: React.FC<{
  amountUsdt?: number;
}> = ({ amountUsdt = 45.0 }) => {
  const { t, n } = useApp();
  const [secondsLeft, setSecondsLeft] = useState(900); // 15 mins
  const [copied, setCopied] = useState(false);

  const mockAddress = "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE";

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const copyAddress = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(mockAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#121624] p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-extrabold text-white">
            {t("درگاه امن پرداخت کریپتو (Tether USDT)", "Secure Crypto Gateway")}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(secondsLeft)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Mock QR Code */}
        <div className="w-[140px] h-[140px] rounded-xl bg-white p-2.5 flex items-center justify-center shrink-0 shadow-md">
          <div className="w-full h-full border-4 border-slate-900 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-800">
            <QrCode className="w-12 h-12" />
            <span className="text-[9px] font-mono font-bold mt-1">TRC-20 QR</span>
          </div>
        </div>

        {/* Address & Network Details */}
        <div className="space-y-3 flex-1 min-w-0 w-full">
          <div>
            <span className="text-[11px] text-slate-400 block">{t("مبلغ قابل پرداخت:", "Amount to Pay:")}</span>
            <span className="text-lg font-mono font-extrabold text-cyan-400">
              {amountUsdt.toFixed(2)} USDT <span className="text-xs text-slate-400 font-sans">(TRC20)</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">
              {t("آدرس کیف پول گیرنده (TRC-20):", "Deposit Address (TRC-20):")}
            </span>
            <div className="flex items-center gap-2 bg-[#0a0c14] border border-white/10 rounded-xl p-2 font-mono text-xs text-slate-300">
              <span className="truncate">{mockAddress}</span>
              <button
                type="button"
                onClick={copyAddress}
                className="p-1 hover:bg-white/10 rounded shrink-0 transition-colors"
                title="کپی آدرس"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          {t(
            "لطفاً فقط ارز تتر روی شبکه TRC20 انتقال دهید. تراکنش پس از ۱ تایید بلاکچین به صورت اتوماتیک فعال خواهد شد.",
            "Transfer only USDT on TRC20. Your subscription activates automatically after 1 confirmation."
          )}
        </span>
      </div>
    </div>
  );
};

/** 3. Enamad & Samandehi Slot Placeholder */
export const EnamadPlaceholderSlot: React.FC = () => {
  return (
    <div
      id="enamad-verification-slot"
      className="w-[120px] h-[120px] rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center p-2 text-center hover:border-orange-500/40 transition-colors"
    >
      <ShieldCheck className="w-8 h-8 text-blue-400 mb-1" />
      <span className="text-[11px] font-bold text-white">ای‌نماد ۵ ستاره</span>
      <span className="text-[9px] text-slate-400">مرکز توسعه تجارت</span>
    </div>
  );
};
