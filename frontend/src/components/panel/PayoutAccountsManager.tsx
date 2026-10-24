"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, CreditCard, Coins, Check, AlertCircle, Building2, Wallet } from "lucide-react";
import { useApp } from "@/lib/app";

export type PayoutAccount =
  | {
      id: string;
      type: "bank";
      bankName: string;
      ownerName: string;
      cardNumber: string;
      iban: string;
      isDefault: boolean;
    }
  | {
      id: string;
      type: "crypto";
      network: "USDT-TRC20" | "USDT-TON" | "USDT-BEP20" | "BTC" | "ETH";
      address: string;
      memo?: string;
      isDefault: boolean;
    };

const INITIAL_ACCOUNTS: PayoutAccount[] = [
  {
    id: "acc-1",
    type: "bank",
    bankName: "بانک سامان",
    ownerName: "آرمان رحیمی",
    cardNumber: "۶۲۱۹۸۶۱۰۱۲۳۴۵۶۷۸",
    iban: "IR820560000000001234567890",
    isDefault: true,
  },
  {
    id: "acc-2",
    type: "crypto",
    network: "USDT-TRC20",
    address: "TLA1x9kZ2pQ8wR4s7Vn6m3Kj5H9b1C4d8F",
    isDefault: false,
  },
];

export const PayoutAccountsManager: React.FC = () => {
  const { t, n } = useApp();
  const [accounts, setAccounts] = useState<PayoutAccount[]>(INITIAL_ACCOUNTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [accountType, setAccountType] = useState<"bank" | "crypto">("bank");

  // Bank Form State
  const [bankName, setBankName] = useState("بانک ملت");
  const [ownerName, setOwnerName] = useState("آرمان رحیمی");
  const [cardNumber, setCardNumber] = useState("");
  const [iban, setIban] = useState("");

  // Crypto Form State
  const [network, setNetwork] = useState<"USDT-TRC20" | "USDT-TON" | "USDT-BEP20" | "BTC" | "ETH">("USDT-TRC20");
  const [address, setAddress] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("drgame_payout_accounts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const saveAccountsToStorage = (list: PayoutAccount[]) => {
    setAccounts(list);
    try {
      localStorage.setItem("drgame_payout_accounts", JSON.stringify(list));
    } catch (e) {}
  };

  const handleDelete = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    saveAccountsToStorage(updated);
  };

  const handleSetDefault = (id: string) => {
    const updated = accounts.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveAccountsToStorage(updated as PayoutAccount[]);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountType === "bank") {
      if (!cardNumber || !iban) {
        alert("لطفاً شماره کارت و شماره شبا را به دقت وارد کنید.");
        return;
      }
      const newAcc: PayoutAccount = {
        id: `acc-${Date.now()}`,
        type: "bank",
        bankName,
        ownerName,
        cardNumber,
        iban: iban.startsWith("IR") ? iban : `IR${iban}`,
        isDefault: accounts.length === 0,
      };
      saveAccountsToStorage([...accounts, newAcc]);
    } else {
      if (!address) {
        alert("لطفاً آدرس کیف پول رمزارز را وارد کنید.");
        return;
      }
      const newAcc: PayoutAccount = {
        id: `acc-${Date.now()}`,
        type: "crypto",
        network,
        address,
        memo: memo.trim() || undefined,
        isDefault: accounts.length === 0,
      };
      saveAccountsToStorage([...accounts, newAcc]);
    }

    // Reset and close
    setCardNumber("");
    setIban("");
    setAddress("");
    setMemo("");
    setShowAddModal(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#151722] p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-extrabold text-white">
              {t("حساب‌های تسویه درآمد و پاداش رفرال", "Payout & Settlement Accounts")}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            {t(
              "امکان ثبت حساب‌های بانکی ایرانی (شبا/کارت) و کیف‌پول‌های کریپتو (تتر TRC20/TON/BEP20)",
              "Add Iranian bank accounts or crypto USDT wallets for instant earnings settlement"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t("افزودن حساب تسویه جدید", "Add Payout Account")}</span>
        </button>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={`p-4 rounded-2xl border transition-all space-y-3 relative ${
              acc.isDefault
                ? "bg-purple-600/10 border-purple-500/50 shadow-md shadow-purple-600/10"
                : "bg-white/[0.03] border-white/5 hover:border-white/15"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {acc.type === "bank" ? (
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-xs text-white block">
                    {acc.type === "bank" ? acc.bankName : `کیف پول کریپتو (${acc.network})`}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {acc.type === "bank" ? acc.ownerName : "ارز دیجیتال USDT"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {acc.isDefault ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    پیش‌فرض
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(acc.id)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    انتخاب پیش‌فرض
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(acc.id)}
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="حذف حساب"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Account Details */}
            {acc.type === "bank" ? (
              <div className="space-y-1.5 pt-1 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px] font-sans">شماره کارت:</span>
                  <span className="font-bold tracking-wider">{acc.cardNumber}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px] font-sans">شماره شبا:</span>
                  <span className="text-[11px] text-purple-300 truncate max-w-[200px]">{acc.iban}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400 text-[11px] font-sans">شبکه:</span>
                  <span className="font-bold text-emerald-400">{acc.network}</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate bg-black/40 p-1.5 rounded-lg border border-white/5">
                  {acc.address}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151722] p-6 shadow-2xl space-y-5">
            <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10">
              {t("ثبت حساب جدید تسویه حساب درآمد", "Add Settlement Account")}
            </h3>

            {/* Tab Type Selector: Bank vs Crypto */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0f1016] border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAccountType("bank")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  accountType === "bank"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>حساب بانکی (ایرانی)</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("crypto")}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  accountType === "crypto"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>کیف پول رمزارز (کریپتو)</span>
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4 text-xs">
              {accountType === "bank" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-400">نام بانک</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="مثال: بانک ملت، پاسارگاد، سامان..."
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">نام صاحب حساب</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">شماره کارت (۱۶ رقم)</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="۶۰۳۷۹۹۱۸..."
                      maxLength={19}
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">شماره شبا (IBAN)</label>
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      placeholder="IR120120000000000000000000"
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-slate-400">شبکه انتقال ارز دیجیتال</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value as any)}
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white cursor-pointer"
                    >
                      <option value="USDT-TRC20">Tether (USDT) — TRC-20 (Tron)</option>
                      <option value="USDT-TON">Tether (USDT) — TON Network</option>
                      <option value="USDT-BEP20">Tether (USDT) — BEP-20 (BNB Smart Chain)</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">آدرس کیف پول (Wallet Address)</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="T... or 0x..."
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">تگ یا ممو (اختیاری)</label>
                    <input
                      type="text"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="در صورت لزوم وارد کنید"
                      className="w-full bg-[#101116] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  ذخیره حساب
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold hover:bg-white/15"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutAccountsManager;
