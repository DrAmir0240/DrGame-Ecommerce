"use client";

import { useState } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  CreditCard,
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";
import { WALLET_DATA, WalletTransaction } from "@/lib/data";

export default function WalletPage() {
  const { t, n } = useApp();
  const [balance, setBalance] = useState<number>(WALLET_DATA.balanceToman);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(
    WALLET_DATA.transactions
  );
  const [customAmount, setCustomAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    const formatted = Math.abs(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return n(formatted);
  };

  const handleDeposit = (amountToAdd: number) => {
    if (amountToAdd <= 0) return;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: "deposit",
      amountToman: amountToAdd,
      dateFa: "هم‌اکنون",
      dateEn: "Just now",
      descriptionFa: "شارژ موفق آنلاین از درگاه پرداخت شتاب",
      descriptionEn: "Successful online deposit via Shetab gateway",
      status: "completed",
    };
    setBalance((prev) => prev + amountToAdd);
    setTransactions((prev) => [newTx, ...prev]);
    setCustomAmount("");
    setFeedback(
      t(
        `مبلغ ${formatPrice(amountToAdd)} تومان با موفقیت به کیف پول افزوده شد.`,
        `${formatPrice(amountToAdd)} Toman was successfully deposited to your wallet.`
      )
    );
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleWithdrawal = () => {
    if (balance < 100000) {
      setFeedback(
        t(
          "حداقل مبلغ قابل برداشت ۱۰۰,۰۰۰ تومان است.",
          "Minimum withdrawal amount is 100,000 Toman."
        )
      );
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const withdrawAmount = balance;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: "withdrawal",
      amountToman: -withdrawAmount,
      dateFa: "هم‌اکنون (در صف بررسی پایا)",
      dateEn: "Just now (Pending Paya batch)",
      descriptionFa: `درخواست تسویه به شبا ${WALLET_DATA.shabaNumber}`,
      descriptionEn: `Settlement request to IBAN ${WALLET_DATA.shabaNumber}`,
      status: "pending",
    };
    setBalance(0);
    setTransactions((prev) => [newTx, ...prev]);
    setFeedback(
      t(
        `درخواست تسویه مبلغ ${formatPrice(withdrawAmount)} تومان ثبت شد و در چرخه پایا واریز خواهد شد.`,
        `Withdrawal of ${formatPrice(withdrawAmount)} Toman registered for Paya processing.`
      )
    );
    setTimeout(() => setFeedback(null), 4500);
  };

  return (
    <Page>
      {/* Toast Notification */}
      {feedback && (
        <div className="fixed bottom-6 end-6 z-50 flex items-center gap-3 rounded-xl border border-accent/40 bg-surface-2/95 px-5 py-3.5 text-sm font-semibold text-fg shadow-glow backdrop-blur-md">
          <CheckCircle2 size={18} className="text-success" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pb-12 pt-6">
        {/* Header Section */}
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
          <div className="absolute -end-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-2">
                  <Wallet size={18} />
                </span>
                <span className="font-latin text-xs font-bold uppercase tracking-wider text-accent-2">
                  DrGame Gamer Wallet
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-fg md:text-3xl">
                {t("کیف پول و مدیریت مالی", "User Wallet & Finances")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-fg-2">
                {t(
                  "مشاهده موجودی لحظه‌ای، شارژ آنلاین سریع، تسویه پورسانت‌های سیستم رفرال و تاریخچه کامل تراکنش‌ها.",
                  "Real-time wallet balance, instant top-ups, referral affiliate payouts, and transparent transaction logs."
                )}
              </p>
            </div>

            {/* Current Balance Card */}
            <div className="flex flex-col gap-1 rounded-2xl border border-accent/40 bg-linear-135 from-surface-2 via-surface to-accent/15 p-5 shadow-glow-sm md:w-80">
              <span className="text-xs font-bold text-fg-2">
                {t("موجودی قابل استفاده", "Available Balance")}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-latin text-3xl font-black text-fg">
                  {formatPrice(balance)}
                </span>
                <span className="text-sm font-bold text-accent-2">
                  {t("تومان", "Toman")}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {t("شماره شبا تأیید شده:", "Verified IBAN:")}{" "}
                <span dir="ltr" className="font-mono text-fg">
                  {WALLET_DATA.shabaNumber.slice(0, 8)}...
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Action Grid: Deposit & Withdrawal */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Quick Deposit */}
          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-base font-bold text-fg">
              <PlusCircle size={18} className="text-accent-2" />
              {t("افزایش موجودی آنلاین", "Quick Online Deposit")}
            </h3>
            <p className="mt-1 text-xs text-fg-2">
              {t(
                "یکی از مبالغ پیشنهادی را انتخاب کنید یا مبلغ دلخواه را وارد نمایید:",
                "Select a preset amount or enter a custom sum:"
              )}
            </p>

            {/* Presets */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[200000, 500000, 1000000, 2000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleDeposit(amt)}
                  className="rounded-xl border border-line bg-surface-2 p-3 text-center transition-all hover:border-accent-2 hover:bg-surface cursor-pointer"
                >
                  <span className="block font-latin text-sm font-bold text-fg">
                    {formatPrice(amt)}
                  </span>
                  <span className="text-[10px] text-muted">{t("تومان", "Toman")}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <div className="mt-4 flex gap-2">
              <input
                type="number"
                placeholder={t("مبلغ دلخواه به تومان...", "Custom amount in Toman...")}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-line bg-surface-2 px-4 text-xs font-semibold text-fg placeholder:text-muted focus:border-accent-2 focus:outline-none"
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => handleDeposit(Number(customAmount))}
                disabled={!customAmount || Number(customAmount) <= 0}
              >
                <CreditCard size={16} />
                {t("پرداخت و شارژ", "Deposit")}
              </Button>
            </div>
          </Card>

          {/* Withdrawal Card */}
          <Card className="flex flex-col justify-between p-6">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-fg">
                <ArrowDownLeft size={18} className="text-warning" />
                {t("تسویه حساب و برداشت وجه", "Withdrawal & Payout")}
              </h3>
              <p className="mt-1 text-xs text-fg-2">
                {t(
                  "درآمدها و پورسانت‌های واریزشده از رفرال را مستقیماً به حساب بانکی خود منتقل کنید.",
                  "Transfer referral earnings and cashback directly to your bank account via Shetab."
                )}
              </p>

              <div className="mt-4 rounded-xl border border-line bg-surface-2 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-fg-2">{t("مقصد تسویه (شبا)", "Payout Destination")}:</span>
                  <span dir="ltr" className="font-mono font-bold text-fg">
                    {WALLET_DATA.shabaNumber}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-fg-2">{t("کارمزد انتقال پایا", "Paya Transfer Fee")}:</span>
                  <span className="font-bold text-success">{t("رایگان", "Free (0 Toman)")}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleWithdrawal}
                disabled={balance <= 0}
              >
                <ArrowDownLeft size={16} />
                {t(
                  `درخواست برداشت کل موجودی (${formatPrice(balance)} تومان)`,
                  `Withdraw Full Balance (${formatPrice(balance)} Toman)`
                )}
              </Button>
            </div>
          </Card>
        </section>

        {/* Transactions Table */}
        <section>
          <SectionTitle
            action={
              <span className="text-xs text-muted">
                {t(`مجموع ${n(transactions.length)} تراکنش`, `Total ${n(transactions.length)} entries`)}
              </span>
            }
          >
            {t("تاریخچه گردش حساب و تراکنش‌ها", "Transaction Ledger")}
          </SectionTitle>

          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-fg-2">
                  <th className="p-3.5 text-start font-bold">{t("شناسه", "ID")}</th>
                  <th className="p-3.5 text-start font-bold">{t("نوع تراکنش", "Type")}</th>
                  <th className="p-3.5 text-start font-bold">{t("شرح تراکنش", "Description")}</th>
                  <th className="p-3.5 text-start font-bold">{t("زمان", "Date")}</th>
                  <th className="p-3.5 text-start font-bold">{t("مبلغ", "Amount")}</th>
                  <th className="p-3.5 text-center font-bold">{t("وضعیت", "Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {transactions.map((tx) => {
                  const isPositive = tx.amountToman > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-muted">{tx.id}</td>
                      <td className="p-3.5">
                        {tx.type === "deposit" ? (
                          <Pill tone="success">{t("شارژ آنلاین", "Deposit")}</Pill>
                        ) : tx.type === "referral_payout" ? (
                          <Pill tone="accent">{t("پورسانت رفرال", "Affiliate Payout")}</Pill>
                        ) : tx.type === "purchase" ? (
                          <Pill tone="psn">{t("خرید اشتراک", "Purchase")}</Pill>
                        ) : (
                          <Pill tone="warning">{t("برداشت وجه", "Withdrawal")}</Pill>
                        )}
                      </td>
                      <td className="p-3.5 font-medium text-fg">
                        {t(tx.descriptionFa, tx.descriptionEn)}
                      </td>
                      <td className="p-3.5 text-fg-2">{t(tx.dateFa, tx.dateEn)}</td>
                      <td className="p-3.5">
                        <span
                          dir="ltr"
                          className={`font-latin font-bold text-sm ${
                            isPositive ? "text-success" : "text-danger"
                          }`}
                        >
                          {isPositive ? "+" : "-"}
                          {formatPrice(tx.amountToman)} {t("تومان", "Toman")}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {tx.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-success text-[11px]">
                            <CheckCircle2 size={13} />
                            {t("موفق", "Completed")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-warning text-[11px]">
                            <Clock size={13} />
                            {t("در انتظار", "Pending")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Page>
  );
}
