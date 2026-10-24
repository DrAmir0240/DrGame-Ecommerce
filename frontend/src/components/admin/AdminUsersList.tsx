"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Shield, ShieldAlert, UserCheck, Check, Ban, Crown } from "lucide-react";
import { useApp } from "@/lib/app";

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  psnId: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  status: "ACTIVE" | "SUSPENDED";
  subscriptionsCount: number;
  joinedAt: string;
}

const DEFAULT_USERS: AdminUserItem[] = [
  {
    id: "USR-101",
    name: "آرمان رحیمی",
    email: "arman@example.com",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    psnId: "Arman_ProGamer",
    role: "USER",
    status: "ACTIVE",
    subscriptionsCount: 3,
    joinedAt: "۱۵ فروردین ۱۴۰۳",
  },
  {
    id: "USR-102",
    name: "رضا محمدی",
    email: "reza.m@gmail.com",
    phone: "۰۹۱۹۸۷۶۵۴۳۲",
    psnId: "GhostOfTehran",
    role: "USER",
    status: "ACTIVE",
    subscriptionsCount: 1,
    joinedAt: "۲ اردیبهشت ۱۴۰۳",
  },
  {
    id: "USR-103",
    name: "سارا کیانی",
    email: "sara.kiani@yahoo.com",
    phone: "۰۹۳۵۱۱۲۲۳۳۴",
    psnId: "ValkyrieQueen",
    role: "ADMIN",
    status: "ACTIVE",
    subscriptionsCount: 5,
    joinedAt: "۱۰ دی ۱۴۰۲",
  },
  {
    id: "USR-104",
    name: "فرزاد حسینی",
    email: "farzad_h@hotmail.com",
    phone: "۰۹۱۲۹۹۸۸۷۷۶",
    psnId: "DarkKnight_99",
    role: "USER",
    status: "SUSPENDED",
    subscriptionsCount: 0,
    joinedAt: "۲۸ خرداد ۱۴۰۳",
  },
  {
    id: "USR-105",
    name: "مدیر ارشد فنی",
    email: "sysadmin@drgame.ir",
    phone: "۰۲۱۸۸۸۸۹۹۹۹",
    psnId: "DrGame_Root",
    role: "SUPERADMIN",
    status: "ACTIVE",
    subscriptionsCount: 99,
    joinedAt: "۱ اسفند ۱۴۰۱",
  },
];

const STORAGE_KEY = "drgame_admin_users";

export const AdminUsersList: React.FC = () => {
  const { n } = useApp();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setUsers(JSON.parse(saved));
      } else {
        setUsers(DEFAULT_USERS);
      }
    } catch {
      setUsers(DEFAULT_USERS);
    }
  }, []);

  const saveUsers = (updated: AdminUserItem[]) => {
    setUsers(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: "ACTIVE" | "SUSPENDED", name: string) => {
    const nextStatus: "ACTIVE" | "SUSPENDED" = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const updated: AdminUserItem[] = users.map((u) => (u.id === id ? { ...u, status: nextStatus } : u));
    saveUsers(updated);
    setFeedback(`وضعیت کاربر «${name}» به ${nextStatus === "ACTIVE" ? "فعال" : "مسدود"} تغییر یافت.`);
    setTimeout(() => setFeedback(""), 3500);
  };

  const handleChangeRole = (id: string, nextRole: "USER" | "ADMIN" | "SUPERADMIN", name: string) => {
    const updated = users.map((u) => (u.id === id ? { ...u, role: nextRole } : u));
    saveUsers(updated);
    setFeedback(`نقش دسترسی کاربر «${name}» به ${nextRole} ارتقا/تغییر یافت.`);
    setTimeout(() => setFeedback(""), 3500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.psnId.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#101116] p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>مدیریت کاربران و سطوح دسترسی (Users Management)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده، فعال‌سازی، مسدودسازی حساب و تنظیم نقش‌های دسترسی کاربران سامانه
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 font-mono text-xs font-bold border border-purple-500/20">
          کل کاربران: {n(users.length)}
        </span>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو بر اساس نام، ایمیل، شماره یا PSN ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#070709] border border-white/10 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {["ALL", "USER", "ADMIN", "SUPERADMIN"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === r
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {r === "ALL" ? "همه نقش‌ها" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#151722] text-slate-300 border-b border-white/10 font-bold">
            <tr>
              <th className="p-3.5">کاربر</th>
              <th className="p-3.5">اطلاعات تماس</th>
              <th className="p-3.5">PSN ID</th>
              <th className="p-3.5">نقش</th>
              <th className="p-3.5">وضعیت</th>
              <th className="p-3.5">تاریخ عضویت</th>
              <th className="p-3.5 text-center">عملیات مدیریت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                      {u.name.slice(0, 1)}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <span className="block text-slate-200 font-mono">{u.email}</span>
                  <span className="block text-[11px] text-slate-400 font-mono">{u.phone}</span>
                </td>
                <td className="p-3.5 font-mono text-purple-300 font-bold">{u.psnId}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      u.role === "SUPERADMIN"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : u.role === "ADMIN"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-green-400" : "bg-red-400"}`} />
                    <span>{u.status === "ACTIVE" ? "فعال" : "مسدود"}</span>
                  </span>
                </td>
                <td className="p-3.5 text-slate-400">{u.joinedAt}</td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id, u.status, u.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                        u.status === "ACTIVE"
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {u.status === "ACTIVE" ? "مسدودسازی" : "فعال‌سازی"}
                    </button>
                    {u.role !== "SUPERADMIN" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleChangeRole(
                            u.id,
                            u.role === "ADMIN" ? "USER" : "ADMIN",
                            u.name
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-[11px] font-bold"
                      >
                        {u.role === "ADMIN" ? "تنزیل به کاربر" : "ارتقا به مدیر"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
