"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Edit3,
  FileText,
  X,
  Check,
  HardDrive,
  DollarSign,
  Clock,
} from "lucide-react";
import { AdminUserListItem, AdminUserDossier } from "@/types/admin";
import { apiRequest } from "@/lib/apiClient";
import { useTranslation } from "@/i18n";

export default function AdminUsersPage() {
  const { t, n, price, size } = useTranslation();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [dossier, setDossier] = useState<AdminUserDossier | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);

  // Quota modal state
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [addedGb, setAddedGb] = useState<number>(10);
  const [quotaReason, setQuotaReason] = useState(t("admin.users.quotaModal.defaultReason"));
  const [quotaSubmitting, setQuotaSubmitting] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : "";
      const endpoint = `/admin/users?page=${page}&page_size=15${searchParam}`;

      const data = await apiRequest<{ items: AdminUserListItem[]; total: number }>(endpoint);
      setUsers(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  const openDossier = async (u: AdminUserListItem) => {
    setSelectedUser(u);
    setShowDossierModal(true);
    setDossierLoading(true);
    try {
      const data = await apiRequest<AdminUserDossier>(`/admin/users/${u.id}`);
      setDossier(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDossierLoading(false);
    }
  };

  const openQuotaModal = (u: AdminUserListItem) => {
    setSelectedUser(u);
    setAddedGb(10);
    setQuotaReason(t("admin.users.quotaModal.defaultReason"));
    setQuotaMessage(null);
    setShowQuotaModal(true);
  };

  const handleAdjustQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setQuotaSubmitting(true);
      setQuotaMessage(null);

      const data = await apiRequest(`/admin/users/${selectedUser.id}/adjust-quota`, {
        method: "POST",
        body: JSON.stringify({
          added_gb: Number(addedGb),
          reason: quotaReason.trim(),
        }),
      });

      setQuotaMessage(
        t("admin.users.quotaModal.success", {
          quota: size(data.total_quota_gb, t("admin.users.units.gigabyte")),
        })
      );
      // Refresh list
      fetchUsers();
      setTimeout(() => setShowQuotaModal(false), 1200);
    } catch (err: any) {
      setQuotaMessage(err.message || t("admin.users.quotaModal.error"));
    } finally {
      setQuotaSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">{t("admin.users.title")}</h1>
          <p className="text-xs text-slate-400">
            {t("admin.users.subtitle")}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={t("admin.users.searchPlaceholder")}
            className="w-full bg-[#121721] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-9 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0c1017] border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#121721] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">{t("admin.users.table.user")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.users.table.contact")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.users.table.referralCode")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.users.table.totalQuota")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.users.table.usedQuota")}</th>
                <th className="py-3.5 px-4 font-semibold">{t("admin.users.table.status")}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t("admin.users.table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t("admin.users.loading")}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {t("admin.users.empty")}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        {u.full_name || u.username}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                        @{u.username}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-mono" dir="ltr">{u.phone || "—"}</div>
                      <div className="text-[11px] text-slate-500">{u.email || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {u.referral_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {size(u.total_quota_gb, t("admin.users.units.gigabyte"))}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {size(u.used_quota_gb, t("admin.users.units.gigabyte"))}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          {t("admin.users.status.active")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                          {t("admin.users.status.blocked")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openQuotaModal(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          title={t("admin.users.actions.quotaTitle")}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{t("admin.users.actions.quota")}</span>
                        </button>
                        <button
                          onClick={() => openDossier(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center gap-1 transition-colors"
                          title={t("admin.users.actions.dossierTitle")}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t("admin.users.actions.dossier")}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d13] flex items-center justify-between text-xs text-slate-400">
          <span>
            {t("admin.users.pagination.showing", { shown: n(users.length), total: n(total) })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              {t("admin.users.pagination.prev")}
            </button>
            <span className="font-mono text-slate-300">{t("admin.users.pagination.page", { page: n(page) })}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < 15}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              {t("admin.users.pagination.next")}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Quota Adjustment Modal */}
      {showQuotaModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>{t("admin.users.quotaModal.title", { name: selectedUser.full_name || selectedUser.username })}</span>
              </div>
              <button
                onClick={() => setShowQuotaModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex justify-between">
              <span className="text-slate-400">{t("admin.users.quotaModal.current")}</span>
              <span className="text-emerald-400 font-bold">{size(selectedUser.total_quota_gb)}</span>
            </div>

            <form onSubmit={handleAdjustQuota} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">
                  {t("admin.users.quotaModal.amountLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={addedGb}
                    onChange={(e) => setAddedGb(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder={t("admin.users.quotaModal.amountPlaceholder")}
                    dir="ltr"
                  />
                  <span className="text-slate-400">GB</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {t("admin.users.quotaModal.hint")}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">{t("admin.users.quotaModal.reasonLabel")}</label>
                <input
                  type="text"
                  value={quotaReason}
                  onChange={(e) => setQuotaReason(e.target.value)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {quotaMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{quotaMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  {t("admin.users.quotaModal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={quotaSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-1.5"
                >
                  {quotaSubmitting ? t("admin.users.quotaModal.submitting") : t("admin.users.quotaModal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Dossier Modal */}
      {showDossierModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>{t("admin.users.dossier.title", { name: selectedUser.full_name || selectedUser.username })}</span>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dossierLoading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {t("admin.users.dossier.loading")}
              </div>
            ) : dossier ? (
              <div className="space-y-6 text-xs">
                {/* User Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-slate-500 block mb-1">{t("admin.users.dossier.userId")}</span>
                    <span className="font-mono text-slate-200">#{dossier.user.id}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-slate-500 block mb-1">{t("admin.users.dossier.referralCode")}</span>
                    <span className="font-mono text-emerald-400">{dossier.user.referral_code}</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-slate-500 block mb-1">{t("admin.users.dossier.referralBalance")}</span>
                    <span className="text-cyan-400 font-semibold">
                      {price(dossier.wallet.withdrawable_balance_toman)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                    <span className="text-slate-500 block mb-1">{t("admin.users.dossier.totalCommission")}</span>
                    <span className="text-slate-200 font-semibold">
                      {price(dossier.wallet.total_earned_toman)}
                    </span>
                  </div>
                </div>

                {/* Quota Breakdown */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                    <span>{t("admin.users.dossier.quotaStatus")}</span>
                    <span className="text-emerald-400 font-mono">
                      {size(dossier.quota.used_gb)} / {size(dossier.quota.total_gb)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          dossier.quota.total_gb > 0
                            ? (dossier.quota.used_gb / dossier.quota.total_gb) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Recent Purchases */}
                <div>
                  <h3 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {t("admin.users.dossier.recentPurchases")}
                  </h3>
                  {dossier.recent_payments.length === 0 ? (
                    <div className="p-4 bg-slate-900/40 rounded-xl text-slate-500 text-center">
                      {t("admin.users.dossier.noPurchases")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dossier.recent_payments.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-200">{t("admin.users.dossier.plan", { plan: p.tier_code })}</span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {t("admin.users.dossier.amount", { amount: price(p.final_price) })}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
