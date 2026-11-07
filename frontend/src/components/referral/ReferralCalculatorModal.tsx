'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/i18n';
import { X, Calculator, Sparkles, TrendingUp, Users, ArrowLeft, Check, Copy } from 'lucide-react';

interface ReferralCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

const PLANS = [
  { code: 'bronze', name: 'اشتراک برنز', priceToman: 700000 },
  { code: 'silver', name: 'اشتراک نقره‌ای', priceToman: 1500000 },
  { code: 'gold', name: 'اشتراک طلایی (VIP)', priceToman: 3000000 },
];

export default function ReferralCalculatorModal({
  isOpen,
  onClose,
  referralCode,
}: ReferralCalculatorModalProps) {
  const { t, n, price } = useTranslation();
  const [selectedPlanCode, setSelectedPlanCode] = useState('gold');
  const [directCount, setDirectCount] = useState(10);
  const [avgViralRate, setAvgViralRate] = useState(2); // each friend brings 2 friends
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentPlan = PLANS.find((p) => p.code === selectedPlanCode) || PLANS[2];
  const orderPrice = currentPlan.priceToman;
  const totalBudget = orderPrice * 0.21;

  // Level 1: directCount * 50% of budget
  const l1Share = Math.round(totalBudget * 0.5);
  const l1Total = directCount * l1Share;

  // Level 2: (directCount * avgViralRate) * 25% of budget
  const l2Count = directCount * avgViralRate;
  const l2Share = Math.round(totalBudget * 0.25);
  const l2Total = l2Count * l2Share;

  // Level 3: (l2Count * avgViralRate) * 12.5% of budget
  const l3Count = l2Count * avgViralRate;
  const l3Share = Math.round(totalBudget * 0.125);
  const l3Total = l3Count * l3Share;

  // Total Estimated Monthly
  const grandTotalMonthly = l1Total + l2Total + l3Total;

  const handleCopyLink = () => {
    const link = typeof window !== 'undefined'
      ? `${window.location.origin}?ref=${referralCode}`
      : `https://drgame.ir?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-vazir animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e121c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-start max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>شبیه‌ساز هوشمند درآمد رفرال</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                محاسبه پتانسیل درآمد غیرفعال شما از شبکه چندلایه‌ای اشتراک‌ها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">پلن اشتراک هدف خریداران:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PLANS.map((p) => {
              const active = p.code === selectedPlanCode;
              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => setSelectedPlanCode(p.code)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'bg-[#151a27] border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-xs font-bold">{p.name}</div>
                  <div className="text-[11px] font-mono mt-1 text-purple-300" dir="ltr">
                    {price(p.priceToman)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Referrals Slider */}
        <div className="space-y-3 p-4 rounded-2xl bg-[#141926] border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>تعداد خریداران مستقیم شما (سطح ۱):</span>
            </span>
            <span className="font-mono font-black text-cyan-300 text-base">{n(directCount)} نفر</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={directCount}
            onChange={(e) => setDirectCount(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>۱ نفر</span>
            <span>۲۵ نفر</span>
            <span>۵۰ نفر</span>
            <span>۱۰۰ نفر</span>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-300">سهم درصدی و سود حاصل از هر لایه:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-[#131b2c] border border-cyan-500/20 space-y-1">
              <div className="flex items-center justify-between text-cyan-300 font-bold">
                <span>سطح ۱ (۱۰.۵٪)</span>
                <span>{n(directCount)} نفر</span>
              </div>
              <div className="text-slate-400 text-[11px]">سود هر خرید: {price(l1Share)}</div>
              <div className="text-white font-mono font-bold text-sm pt-1" dir="ltr">
                {price(l1Total)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#131b2c] border border-purple-500/20 space-y-1">
              <div className="flex items-center justify-between text-purple-300 font-bold">
                <span>سطح ۲ (۵.۲۵٪)</span>
                <span>{n(l2Count)} نفر</span>
              </div>
              <div className="text-slate-400 text-[11px]">سود هر خرید: {price(l2Share)}</div>
              <div className="text-white font-mono font-bold text-sm pt-1" dir="ltr">
                {price(l2Total)}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#131b2c] border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span>سطح ۳ (۲.۶۲٪)</span>
                <span>{n(l3Count)} نفر</span>
              </div>
              <div className="text-slate-400 text-[11px]">سود هر خرید: {price(l3Share)}</div>
              <div className="text-white font-mono font-bold text-sm pt-1" dir="ltr">
                {price(l3Total)}
              </div>
            </div>
          </div>
        </div>

        {/* Grand Total Estimated Result Box */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-teal-950/60 to-purple-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="text-xs text-emerald-400 font-bold block">مجموع درآمد ماهانه تخمینی شما:</span>
            <span className="text-[11px] text-slate-400">با تسویه خودکار هر جمعه شب</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono" dir="ltr">
            {price(grandTotalMonthly)}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'لینک کپی شد!' : 'کپی لینک معرف و شروع کسب درآمد'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            بستن شبیه‌ساز
          </button>
        </div>
      </div>
    </div>
  );
}
