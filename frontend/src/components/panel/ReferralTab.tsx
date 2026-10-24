"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Copy,
  Check,
  Wallet,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/app";
import { api } from "@/lib/api";

export const ReferralTab: React.FC = () => {
  const { t, n } = useApp();
  const [copied, setCopied] = useState(false);

  // Form state for IBAN withdrawal
  const [iban, setIban] = useState("IR820120000000001234567890");
  const [accountHolder, setAccountHolder] = useState("آرمان رحیمی");
  const [amount, setAmount] = useState("2000000");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [availableBalance, setAvailableBalance] = useState(2450000);
  const [pendingBalance, setPendingBalance] = useState(780000);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(5230000);

  const inviteCode = "DR-84920";
  const inviteLink = `https://drgame.ir/auth?ref=${inviteCode}`;

  useEffect(() => {
    let isMounted = true;
    api.get<any>("/api/v1/referral/summary")
      .then((res) => {
        if (isMounted && res.data) {
          if (res.data.available_balance_irr !== undefined) setAvailableBalance(res.data.available_balance_irr);
          if (res.data.pending_balance_irr !== undefined) setPendingBalance(res.data.pending_balance_irr);
          if (res.data.lifetime_earnings_irr !== undefined) setLifetimeEarnings(res.data.lifetime_earnings_irr);
        }
      })
      .catch(() => {
        // Retain initial fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const copyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [settlements, setSettlements] = useState([
    { id: "STL-9041", date: "۱۵ مهر ۱۴۰۵", amount: 1500000, iban: "IR82...7890", status: "واریز شده با پایا", tracking: "PAYA-892341", badge: "text-green-400 bg-green-500/10" },
    { id: "STL-8812", date: "۲ شهریور ۱۴۰۵", amount: 2000000, iban: "IR82...7890", status: "واریز شده با پایا", tracking: "PAYA-773120", badge: "text-green-400 bg-green-500/10" },
  ]);

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;
      const res = await api.post<any>("/api/v1/referral/payout-request", {
        amount_irr: parsedAmount,
        iban,
        account_holder: accountHolder,
      });

      const payload = res.data;
      if (payload && payload.tracking_code) {
        setSettlements((prev) => [
          {
            id: payload.tracking_code,
            date: "امروز (لحظاتی پیش)",
            amount: payload.amount_irr || parsedAmount,
            iban: iban.substring(0, 4) + "..." + iban.substring(iban.length - 4),
            status: "در حال بررسی پایا",
            tracking: payload.tracking_code,
            badge: "text-amber-400 bg-amber-500/10",
          },
          ...prev,
        ]);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ثبت درخواست تسویه");
    } finally {
      setSubmitting(false);
    }
  };

  const levels = [
    { level: 1, percent: "۱۰.۵٪", count: 18, earnings: 1890000 },
    { level: 2, percent: "۵.۲۵٪", count: 34, earnings: 945000 },
    { level: 3, percent: "۲.۶۲۵٪", count: 62, earnings: 472500 },
    { level: 4, percent: "۱.۳۱۲۵٪", count: 110, earnings: 236250 },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header Banner & Identity */}
      <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-500/10 via-[#181a27] to-pink-500/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-extrabold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Branch Ledger v1.4.1 (مدل پورسانت ارجاع تصاعدی)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {t("سیستم معرفی دوستان و کسب درآمد مادام‌العمر", "Lifetime Multi-Tier Affiliate Network")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {t(
                "با هر خرید اشتراک توسط کاربران زیرمجموعه شما، ۲۱٪ از مبلغ سفارش به صورت تصاعد هندسی بین معرفین دارای اشتراک فعال تقسیم و به موجودی شما افزوده می‌شود.",
                "21% network commission split dynamically across upline members with active subscriptions."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0f1016] border border-white/10 shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block">{t("کد معرف اختصاصی شما:", "Your Invite Code:")}</span>
              <code className="text-base font-extrabold text-purple-400 font-mono tracking-wider">{inviteCode}</code>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              title="کپی لینک دعوت"
            >
              {copied ? <Check className="w-4 h-4 text-green-200" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Three Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t("موجودی قابل برداشت", "Available Balance")}</span>
            <Wallet className="w-4 h-4 text-green-400" />
          </div>
          <span className="text-2xl font-black text-green-400 block tracking-tight">
            {n(availableBalance.toLocaleString())} <span className="text-xs text-slate-400 font-normal">تومان</span>
          </span>
          <span className="text-[11px] text-slate-500 block">آماده تسویه مستقیم به شماره شبا</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t("در حال تعلیق (دوره ۷ روزه)", "Pending Escrow (7 Days)")}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-black text-amber-400 block tracking-tight">
            {n(pendingBalance.toLocaleString())} <span className="text-xs text-slate-400 font-normal">تومان</span>
          </span>
          <span className="text-[11px] text-slate-500 block">تراکنش‌های اخیر شبکه در انتظار تایید</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>{t("مجموع درآمد کل (Lifetime)", "Lifetime Total Earnings")}</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-2xl font-black text-white block tracking-tight">
            {n(lifetimeEarnings.toLocaleString())} <span className="text-xs text-slate-400 font-normal">تومان</span>
          </span>
          <span className="text-[11px] text-slate-500 block">واریز شده از ابتدای عضویت</span>
        </div>
      </div>

      {/* 3. Multi-Level Downline Chain Table */}
      <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-extrabold text-white">
              {t("شبکه سطوح پورسانت ارجاع (Multi-Tier Chain)", "Referral Multi-Tier Chain")}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تسهیم پورسانت شبکه با فرمول تصاعدی ۲۱٪ و شرط اشتراک فعال (Active Subscription Rule)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold">
                <th className="py-3 px-4 text-start">سطح در شبکه</th>
                <th className="py-3 px-4 text-center">درصد سهم پورسانت</th>
                <th className="py-3 px-4 text-center">تعداد اعضای فعال</th>
                <th className="py-3 px-4 text-end">مجموع درآمد حاصله</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {levels.map((l) => (
                <tr key={l.level} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white text-start">سطح {n(l.level)}</td>
                  <td className="py-3.5 px-4 text-center text-purple-400 font-mono font-bold">{l.percent}</td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">{n(l.count)} نفر</td>
                  <td className="py-3.5 px-4 text-end font-mono font-bold text-white">
                    {n(l.earnings.toLocaleString())} تومان
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. IBAN Settlement Request Form */}
      <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <Building className="w-5 h-5 text-purple-500" />
          <div>
            <h3 className="text-base font-extrabold text-white">
              {t("درخواست تسویه حساب به شماره شبا", "IBAN Bank Settlement Request")}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              واریز مبالغ تایید شده از طریق چرخه پایا بانک مرکزی ظرف حداکثر ۲۴ ساعت کاری
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs text-center space-y-1">
            <p className="font-bold">درخواست تسویه با موفقیت در دیتابیس ثبت شد.</p>
            <p className="text-[11px] text-slate-400">کد پیگیری در جدول سوابق ثبت گردید و پس از بازبینی ادمین واریز می‌شود.</p>
          </div>
        ) : (
          <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block">شماره شبا (IBAN):</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 px-3.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  placeholder="IR..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold block">نام و نام خانوادگی صاحب حساب:</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 px-3.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-bold block">مبلغ درخواستی (تومان - حداقل ۱۰۰,۰۰۰):</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#0f1016] border border-white/10 px-3.5 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? "در حال ثبت درخواست..." : "ثبت درخواست تسویه پایا"}
            </button>
          </form>
        )}
      </div>

      {/* 5. Settlement History */}
      <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-extrabold text-white pb-2 border-b border-white/10">
          سوابق تسویه‌حساب‌های بانکی
        </h3>

        <div className="divide-y divide-white/5 text-xs">
          {settlements.map((s) => (
            <div key={s.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">{s.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.badge}`}>{s.status}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{s.date} · {s.iban}</span>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-white font-mono block">{n(s.amount.toLocaleString())} تومان</span>
                <span className="text-[10px] text-slate-500 font-mono">{s.tracking}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReferralTab;
