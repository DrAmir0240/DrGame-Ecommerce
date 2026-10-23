"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Tag,
  ArrowRight,
  Check,
  AlertCircle,
  Crown,
  Sparkles,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { ShetabGatewaySelector, CryptoPaymentBox } from "@/components/PaymentPlaceholders";
import { useApp } from "@/lib/app";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, n } = useApp();

  const planId = searchParams.get("plan") || "silver";

  const plansMap: Record<string, { nameFa: string; nameEn: string; price: number; quotaGb: number }> = {
    free: { nameFa: "پلن رایگان", nameEn: "Free Tier", price: 0, quotaGb: 0 },
    bronze: { nameFa: "پلن برنزی", nameEn: "Bronze Tier", price: 698000, quotaGb: 500 },
    silver: { nameFa: "پلن نقره‌ای", nameEn: "Silver Tier", price: 1198000, quotaGb: 1024 },
    gold: { nameFa: "پلن طلایی VIP", nameEn: "Gold VIP Tier", price: 2988000, quotaGb: 2252 },
  };

  const selectedPlan = plansMap[planId] || plansMap.silver;

  const [selectedGateway, setSelectedGateway] = useState<string>("zarinpal");
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Parity with R12: 5% welcome discount if user was referred
  const hasWelcomeDiscount = true;
  const welcomeDiscountPercent = 5;

  const totalDiscountPercent = couponDiscountPercent + (hasWelcomeDiscount ? welcomeDiscountPercent : 0);
  const discountAmount = Math.round((selectedPlan.price * totalDiscountPercent) / 100);
  const finalPrice = Math.max(0, selectedPlan.price - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === "DRGAME10") {
      setCouponDiscountPercent(10);
      setCouponApplied(true);
    } else if (couponCode.trim().toUpperCase() === "GOLD35") {
      setCouponDiscountPercent(35);
      setCouponApplied(true);
    } else {
      alert("کد تخفیف وارد شده معتبر نمی‌باشد.");
    }
  };

  const handlePay = async () => {
    setIsProcessing(true);
    // Simulate secure transaction / gateway handshake
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
    }, 1200);
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center border border-green-500/30 shadow-xl">
          <Check className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white">
            {t("اشتراک شما با موفقیت فعال شد!", "Subscription Activated Successfully!")}
          </h2>
          <p className="text-xs text-slate-400">
            {t(
              "سهمیه ترافیک به حساب کاربری شما منظور گردید و وب‌هویک پاداش رفرال با موفقیت ثبت شد.",
              "Traffic quota has been credited and referral reward registered."
            )}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[#151722] border border-white/10 text-xs text-slate-300 font-mono space-y-1 text-right">
          <div>شماره پیگیری: TRK-98341209</div>
          <div>پلن فعال: {selectedPlan.nameFa}</div>
          <div>مبلغ پرداختی: {n(finalPrice.toLocaleString())} تومان</div>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs"
        >
          <span>{t("ورود به کاتالوگ و شروع دانلود", "Go to Games Catalog")}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {t("تسویه‌حساب و فعال‌سازی اشتراک", "Checkout & Subscription Activation")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t(
            "تایید فاکتور، انتخاب درگاه بانکی یا رمزارز، و فعال‌سازی آنی پهنای باند",
            "Invoice verification, gateway selection, and instant quota activation"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Gateways & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 shadow-xl space-y-6">
            <ShetabGatewaySelector
              selectedGateway={selectedGateway}
              onSelect={(id) => setSelectedGateway(id)}
            />

            {selectedGateway === "crypto" && (
              <CryptoPaymentBox amountUsdt={Math.round(finalPrice / 65000)} />
            )}
          </div>

          {/* Security & Money Back Guarantee */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">ضمانت بازگشت وجه و امنیت تراکنش:</span>
              در صورت بروز هرگونه اختلال در اتصال به سرور لبه یا عدم سازگاری دیتای بازی با کنسول شما، تا ۷ روز امکان عودت کامل وجه از طریق ثبت تیکت وجود دارد.
            </div>
          </div>
        </div>

        {/* Right Column: Invoice & Discount Voucher */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 shadow-xl space-y-5">
            <h3 className="font-extrabold text-base text-white pb-3 border-b border-white/10 flex items-center justify-between">
              <span>{t("خلاصه فاکتور پرداخت", "Order Summary")}</span>
              <span className="text-xs text-orange-400 font-mono font-bold">
                {selectedPlan.quotaGb} GB
              </span>
            </h3>

            {/* Plan Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold">{t(selectedPlan.nameFa, selectedPlan.nameEn)}</span>
              <span className="font-mono font-bold text-white">
                {n(selectedPlan.price.toLocaleString())} {t("تومان", "IRT")}
              </span>
            </div>

            {/* Welcome Discount (Parity with R12) */}
            {hasWelcomeDiscount && (
              <div className="flex items-center justify-between text-xs text-green-400 bg-green-500/10 p-2 rounded-xl border border-green-500/20">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t("تخفیف ولکام رفرال (۵٪):", "Referral Welcome Discount (5%):")}</span>
                </span>
                <span className="font-mono font-bold">
                  -{n(Math.round((selectedPlan.price * 5) / 100).toLocaleString())} {t("تومان", "IRT")}
                </span>
              </div>
            )}

            {/* Coupon Code Form */}
            <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2">
              <label className="text-[11px] text-slate-400 block">{t("کد تخفیف جشنواره‌ای:", "Discount Code:")}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="مثال: GOLD35"
                  className="flex-1 h-9 rounded-xl bg-[#0f1016] border border-white/10 px-3 text-xs text-white uppercase placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors shrink-0"
                >
                  اعمال
                </button>
              </div>
            </form>

            {/* Final Price */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm font-bold text-white">{t("مبلغ قابل پرداخت:", "Total Due:")}</span>
              <span className="text-xl font-extrabold text-orange-400 font-mono">
                {n(finalPrice.toLocaleString())}{" "}
                <span className="text-xs text-slate-400 font-normal">{t("تومان", "IRT")}</span>
              </span>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePay}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-all disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isProcessing
                  ? t("در حال انتقال به درگاه...", "Connecting to Gateway...")
                  : t("پرداخت و فعال‌سازی فوری", "Pay & Activate Now")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Page>
      <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading checkout...</div>}>
        <CheckoutContent />
      </Suspense>
    </Page>
  );
}
