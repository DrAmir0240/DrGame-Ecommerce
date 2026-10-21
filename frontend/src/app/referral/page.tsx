"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Award,
  Wallet,
  Gift,
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  ChevronDown,
  Layers,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";
import { REFERRAL_DATA, REFERRAL_TIERS, InvitedUser } from "@/lib/data";

export default function ReferralPage() {
  const { t, n } = useApp();
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  const formatPrice = (amount: number) => {
    return n(amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(REFERRAL_DATA.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Page>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pb-12 pt-6">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
          <div className="absolute -end-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-2">
                  <Users size={18} />
                </span>
                <span className="font-latin text-xs font-bold uppercase tracking-wider text-accent-2">
                  DrGame Multi-Tier Partner Program
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-fg md:text-3xl">
                {t(
                  "سیستم رفرال و درآمدزایی شاخه‌ای ۳ سطحی",
                  "3-Tier Multi-Level Affiliate & Referral Hub"
                )}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-fg-2">
                {t(
                  "دوستان گیمر خود را دعوت کنید؛ آن‌ها ۲۰٪ تخفیف روی اولین اشتراک می‌گیرند و شما تا ۱۴٪ از تمام خریدهای آن‌ها و زیرمجموعه‌هایشان پورسانت نقدی دریافت می‌کنید.",
                  "Invite fellow gamers: they receive 20% off their first plan, and you earn up to 14% multi-tier commissions credited directly to your wallet."
                )}
              </p>
            </div>

            {/* Invite Link & Code Card */}
            <div className="flex flex-col gap-3 rounded-2xl border border-line-strong bg-surface-2 p-5 lg:w-96">
              <span className="text-xs font-bold text-fg-2">
                {t("لینک و کد اختصاصی دعوت شما:", "Your Exclusive Invite Link:")}
              </span>
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2">
                <span dir="ltr" className="font-mono text-xs font-bold text-accent-2 truncate">
                  {REFERRAL_DATA.referralLink}
                </span>
                <button
                  onClick={copyReferralLink}
                  className="flex items-center gap-1 rounded-md bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-2 hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copied ? t("کپی شد", "Copied") : t("کپی", "Copy")}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  {t("کد معرف:", "Referral Code:")}{" "}
                  <strong className="font-mono text-fg">{REFERRAL_DATA.referralCode}</strong>
                </span>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-1 text-accent-2 hover:underline cursor-pointer"
                >
                  <QrCode size={14} />
                  <span>{t("نمایش QR Code", "Show QR")}</span>
                </button>
              </div>

              {showQr && (
                <div className="mt-2 flex flex-col items-center justify-center rounded-xl bg-white p-4 text-black">
                  <div className="size-36 bg-gray-200 border-2 border-dashed border-gray-400 grid place-items-center font-mono text-[10px] text-center p-2">
                    [QR Code: {REFERRAL_DATA.referralLink}]
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-gray-700">
                    {t("اسکن با دوربین گوشی جهت ثبت سریع کد", "Scan to automatically bind referral")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4 Stats Cards */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-muted">
              {t("کل دعوت‌شدگان", "Total Invites")}
            </span>
            <p className="mt-2 font-latin text-2xl font-black text-fg">
              {n(REFERRAL_DATA.totalInvites)} <span className="text-xs font-normal text-muted">{t("گیمر", "users")}</span>
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-muted">
              {t("دعوت‌های فعال و خریدار", "Active Customers")}
            </span>
            <p className="mt-2 font-latin text-2xl font-black text-success">
              {n(REFERRAL_DATA.activePurchasers)} <span className="text-xs font-normal text-muted">{t("نفر", "active")}</span>
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-muted">
              {t("مجموع درآمد تا امروز", "Total Commission")}
            </span>
            <p className="mt-2 font-latin text-2xl font-black text-accent-2">
              {formatPrice(REFERRAL_DATA.totalCommissionToman)}{" "}
              <span className="text-xs font-normal text-muted">{t("تومان", "Toman")}</span>
            </p>
          </Card>

          <Card className="flex flex-col justify-between p-5 border-accent/40 bg-accent/5">
            <div>
              <span className="text-xs font-semibold text-muted">
                {t("پورسانت آماده برداشت", "Available in Wallet")}
              </span>
              <p className="mt-2 font-latin text-2xl font-black text-fg">
                {formatPrice(REFERRAL_DATA.availableBalanceToman)}{" "}
                <span className="text-xs font-normal text-muted">{t("تومان", "Toman")}</span>
              </p>
            </div>
            <Link
              href="/wallet"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-2 hover:underline"
            >
              <span>{t("انتقال به کیف پول", "Manage in Wallet")}</span>
              <ArrowRight size={14} className="rtl:rotate-180" />
            </Link>
          </Card>
        </section>

        {/* 3-Tier Commission Structure Cards */}
        <section>
          <SectionTitle>
            {t("سطوح پورسانت‌دهی و لول‌بندی معرفان", "Affiliate Tiers & Commission Rates")}
          </SectionTitle>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {REFERRAL_TIERS.map((tier) => {
              const isCurrent = REFERRAL_DATA.userCurrentTier === tier.level;
              return (
                <Card
                  key={tier.level}
                  className={`relative overflow-hidden p-6 ${
                    isCurrent ? "border-gold shadow-glow" : ""
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute end-4 top-4 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                      {t("سطح فعلی شما", "Your Current Tier")}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-surface-2 font-latin text-base font-black text-accent-2">
                      L{tier.level}
                    </span>
                    <div>
                      <h4 className="font-bold text-fg text-sm">{t(tier.nameFa, tier.nameEn)}</h4>
                      <p className="text-xs text-muted">
                        {t(
                          `حداقل ${n(tier.minMembers)} دعوت موفق`,
                          `Min ${n(tier.minMembers)} active invites`
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 rounded-xl bg-surface-2 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-fg-2">{t("پورسانت شارژ کیف پول", "Wallet Commission")}:</span>
                      <span className="font-latin text-base font-black text-success">
                        {n(tier.commissionPercent)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold border-t border-line pt-2">
                      <span className="text-fg-2">{t("تخفیف کاربر دعوت‌شده", "Invitee Discount")}:</span>
                      <span className="font-latin text-sm font-bold text-accent-2">
                        {n(tier.discountPercent)}%
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Invited Users Network Table */}
        <section>
          <SectionTitle
            action={
              <span className="text-xs text-muted">
                {t(`لیست ${n(REFERRAL_DATA.invites.length)} کاربر عضو`, `List of ${n(REFERRAL_DATA.invites.length)} members`)}
              </span>
            }
          >
            {t("شبکه کاربران دعوت‌شده و سودهای واریزی", "Invited Gamers Network & Earnings")}
          </SectionTitle>

          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-fg-2">
                  <th className="p-3.5 text-start font-bold">{t("کاربر و آیدی PSN", "User & PSN ID")}</th>
                  <th className="p-3.5 text-start font-bold">{t("سطح ارجاع", "Referral Layer")}</th>
                  <th className="p-3.5 text-start font-bold">{t("تاریخ عضویت", "Join Date")}</th>
                  <th className="p-3.5 text-start font-bold">{t("وضعیت خرید", "Purchase Status")}</th>
                  <th className="p-3.5 text-start font-bold">{t("زیرمجموعه‌های فعال او", "Sub-Referrals")}</th>
                  <th className="p-3.5 text-start font-bold">{t("سود واریزی به شما", "Commission Paid")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {REFERRAL_DATA.invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3.5">
                      <div>
                        <span className="font-bold text-fg block">{inv.name}</span>
                        <span dir="ltr" className="font-mono text-[11px] text-muted">
                          {inv.psnId}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Pill tone={inv.tierLevel === 1 ? "psn" : inv.tierLevel === 2 ? "accent" : "warning"}>
                        {t(`لایه ${n(inv.tierLevel)}`, `Tier ${n(inv.tierLevel)}`)}
                      </Pill>
                    </td>
                    <td className="p-3.5 text-fg-2">{t(inv.joinedFa, inv.joinedEn)}</td>
                    <td className="p-3.5">
                      {inv.hasPurchased ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-success">
                          <Check size={13} />
                          {t("خرید موفق پلن", "Active Subscription")}
                        </span>
                      ) : (
                        <span className="text-muted">{t("بدون خرید", "No Purchases")}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className="font-latin font-bold text-fg">
                        {n(inv.subReferralsCount)} {t("نفر", "users")}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span dir="ltr" className="font-latin font-bold text-success text-sm">
                        +{formatPrice(inv.commissionEarnedToman)} {t("تومان", "Toman")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Page>
  );
}
