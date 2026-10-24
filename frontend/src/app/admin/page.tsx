"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Gamepad2,
  Users,
  CreditCard,
  HardDrive,
  LifeBuoy,
  FileText,
  Crown,
  Building,
  Check,
  ShieldAlert,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { AdminGamesCrud } from "@/components/admin/AdminGamesCrud";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { AdminSubscriptionsList } from "@/components/admin/AdminSubscriptionsList";
import { AdminPaymentsList } from "@/components/admin/AdminPaymentsList";
import { AdminTicketsManager } from "@/components/admin/AdminTicketsManager";
import { AdminContentManager } from "@/components/admin/AdminContentManager";
import { AdminPlansManager } from "@/components/admin/AdminPlansManager";
import { useApp } from "@/lib/app";

export default function AdminDashboardPage() {
  const { n } = useApp();
  const [activeModule, setActiveModule] = useState<string>("games");

  // Referral payouts pending state
  const [payouts, setPayouts] = useState([
    {
      id: "STL-9901",
      user: "آرمان رحیمی",
      type: "IRANIAN_BANK",
      account: "IR820120000000001234567890",
      bank: "بانک ملی ایران",
      amount: 2000000,
      status: "PENDING",
    },
    {
      id: "STL-9902",
      user: "رضا محمدی",
      type: "CRYPTO_USDT",
      account: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      network: "Tether USDT (TRC-20)",
      amount: 850000,
      status: "PENDING",
    },
  ]);

  const handleApprovePayout = (id: string) => {
    setPayouts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p))
    );
  };

  const modules = [
    { id: "games", label: "مدیریت کاتالوگ و فایل‌های ۵‌گانه بازی‌ها", icon: Gamepad2, badge: "CRUD" },
    { id: "users", label: "لیست کاربران و سطوح دسترسی", icon: Users },
    { id: "subscriptions", label: "اشتراک‌های خریداری شده کاربران", icon: HardDrive },
    { id: "payments", label: "لیست پرداخت‌ها و تراکنش‌های مالی", icon: CreditCard },
    { id: "tickets", label: "تیکت‌های پشتیبانی و گفتگو با کاربر", icon: LifeBuoy, badge: "فعال" },
    { id: "content", label: "مدیریت محتوا و اطلاعات تماس هدرها", icon: FileText },
    { id: "plans", label: "مدیریت داینامیک پلن‌ها و خدمات", icon: Crown },
    { id: "payouts", label: "تسویه‌حساب‌های رفرال (بانکی و کریپتو)", icon: Building, badge: "۲ در انتظار" },
  ];

  return (
    <Page>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold text-xs border border-purple-500/30">
                Admin Panel (Secure Zone)
              </span>
              <span className="text-xs text-slate-400">سیستم راهبری جامع دکتر گیم</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              داشبورد مدیریت و کنترل سامانه دکتر گیم
            </h1>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Admin: sysadmin@drgame.ir · Role: SuperAdmin
          </div>
        </div>

        {/* Modules Nav & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <aside className="lg:col-span-1 space-y-1 rounded-2xl bg-[#101116] border border-white/10 p-2 shadow-xl h-fit">
            {modules.map((m) => {
              const Icon = m.icon;
              const active = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModule(m.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </div>
                  {m.badge && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono shrink-0 ${
                        active
                          ? "bg-white/20 text-white"
                          : m.badge === "CRUD"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {m.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Module Content */}
          <main className="lg:col-span-3 min-w-0">
            {/* 1. Games CRUD */}
            {activeModule === "games" && <AdminGamesCrud />}

            {/* 2. Users Management */}
            {activeModule === "users" && <AdminUsersList />}

            {/* 3. Subscriptions List */}
            {activeModule === "subscriptions" && <AdminSubscriptionsList />}

            {/* 4. Payments List */}
            {activeModule === "payments" && <AdminPaymentsList />}

            {/* 5. Support Tickets */}
            {activeModule === "tickets" && <AdminTicketsManager />}

            {/* 6. Content & Contact Info Editor */}
            {activeModule === "content" && <AdminContentManager />}

            {/* 7. Plans & Services Editor */}
            {activeModule === "plans" && <AdminPlansManager />}

            {/* 8. Payouts Module */}
            {activeModule === "payouts" && (
              <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-5">
                <h3 className="text-base font-extrabold text-white pb-3 border-b border-white/10 flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>بررسی و تایید درخواست‌های تسویه حساب (بانکی و کریپتو)</span>
                </h3>

                <div className="space-y-3">
                  {payouts.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{p.user}</span>
                          <span className="font-mono text-purple-400">({p.id})</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === "APPROVED"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {p.status === "APPROVED" ? "تسویه شده" : "در انتظار واریز"}
                          </span>
                        </div>
                        <div className="font-mono text-slate-400 flex items-center gap-2">
                          <span>{p.type === "CRYPTO_USDT" ? p.network : p.bank}:</span>
                          <span className="text-slate-300">{p.account}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="font-mono font-bold text-white text-sm">
                          {n(p.amount.toLocaleString())} تومان
                        </div>
                        {p.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleApprovePayout(p.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تایید و تسویه</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Page>
  );
}
