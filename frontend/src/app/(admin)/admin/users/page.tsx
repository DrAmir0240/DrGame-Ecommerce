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
  UserCheck,
  Ban,
  Gift,
  Loader2,
  Tag,
  Sparkles,
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

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Grant subscription modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTier, setGrantTier] = useState('gold');
  const [grantDays, setGrantDays] = useState(30);
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantMessage, setGrantMessage] = useState<string | null>(null);

  // Bulk Discount modal state (Step 20)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState(20);
  const [bulkDurationDays, setBulkDurationDays] = useState(7);
  const [bulkTitle, setBulkTitle] = useState('تخفیف ویژه اشتراک');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  const handleApplyBulkDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;
    setBulkSubmitting(true);
    setBulkMsg(null);
    try {
      const res = await apiRequest<any>('/admin-finance/user-discounts/bulk', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: selectedUserIds,
          discount_percent: Number(bulkDiscountPercent),
          duration_days: Number(bulkDurationDays),
          title: bulkTitle.trim() || 'تخفیف ویژه اشتراک',
        }),
      });
      setBulkMsg({ type: 'success', text: res.message || 'تخفیف با موفقیت به کاربران اعمال شد.' });
      setTimeout(() => {
        setShowBulkDiscountModal(false);
        setSelectedUserIds([]);
        setBulkMsg(null);
      }, 1500);
    } catch (err: any) {
      setBulkMsg({ type: 'error', text: err.message || 'خطا در اعطای تخفیف گروهی' });
    } finally {
      setBulkSubmitting(false);
    }
  };

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

  const openEditModal = (u: AdminUserListItem) => {
    setSelectedUser(u);
    setEditFullName(u.full_name || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditSubmitting(true);
    try {
      await apiRequest(`/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editFullName.trim(),
          email: editEmail.trim() || undefined,
          phone_number: editPhone.trim() || undefined,
        }),
      });
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'خطا در ویرایش کاربر');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (u: AdminUserListItem) => {
    const action = u.is_active ? 'مسدود' : 'فعال';
    if (!confirm(`آیا از ${action} کردن کاربر ${u.full_name || u.username} اطمینان دارید؟`)) return;
    try {
      await apiRequest(`/admin/users/${u.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت کاربر');
    }
  };

  const openGrantModal = (u: AdminUserListItem) => {
    setSelectedUser(u);
    setGrantTier('gold');
    setGrantDays(30);
    setGrantMessage(null);
    setShowGrantModal(true);
  };

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setGrantSubmitting(true);
    setGrantMessage(null);
    try {
      await apiRequest(`/admin/users/${selectedUser.id}/subscriptions`, {
        method: 'POST',
        body: JSON.stringify({
          tier_code: grantTier,
          days: Number(grantDays),
        }),
      });
      setGrantMessage('اشتراک با موفقیت اعطا شد.');
      setTimeout(() => {
        setShowGrantModal(false);
        fetchUsers();
      }, 1200);
    } catch (err: any) {
      setGrantMessage(err.message || 'خطا در اعطای اشتراک');
    } finally {
      setGrantSubmitting(false);
    }
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
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 font-vazir">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-4 bg-[#07090e]/95 backdrop-blur-md border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
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
                <th className="py-3.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                </th>
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
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t("admin.users.loading")}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    {t("admin.users.empty")}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      selectedUserIds.includes(u.id) ? 'bg-amber-950/20' : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
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
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => openQuotaModal(u)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-[10px] flex items-center gap-1 transition-colors"
                          title={t("admin.users.actions.quotaTitle")}
                        >
                          <HardDrive className="w-3 h-3" />
                          <span>سهمیه</span>
                        </button>
                        <button
                          onClick={() => openGrantModal(u)}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium text-[10px] flex items-center gap-1 transition-colors"
                          title="اعطای اشتراک"
                        >
                          <Gift className="w-3 h-3" />
                          <span>اشتراک</span>
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-2 py-1 rounded-lg bg-cosmic-purple/10 hover:bg-cosmic-purple/20 border border-cosmic-purple/30 text-cosmic-purple font-medium text-[10px] flex items-center gap-1 transition-colors"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-1 rounded-lg font-medium text-[10px] flex items-center gap-1 transition-colors ${
                            u.is_active
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                          }`}
                          title={u.is_active ? 'مسدود کردن' : 'فعال کردن'}
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openDossier(u)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] flex items-center gap-1 transition-colors"
                          title={t("admin.users.actions.dossierTitle")}
                        >
                          <FileText className="w-3 h-3" />
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <UserCheck className="w-4 h-4 text-cosmic-purple" />
                <span>ویرایش کاربر: {selectedUser.full_name || selectedUser.username}</span>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1.5 text-xs">نام کامل</label>
                <input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cosmic-purple"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-xs">ایمیل</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cosmic-purple"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-xs">شماره موبایل</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cosmic-purple"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-cosmic-purple hover:bg-cosmic-purple/90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                >
                  {editSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Subscription Modal */}
      {showGrantModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>اعطای اشتراک به: {selectedUser.full_name || selectedUser.username}</span>
              </div>
              <button onClick={() => setShowGrantModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGrantSubscription} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1.5 text-xs">پلن اشتراک</label>
                <select
                  value={grantTier}
                  onChange={(e) => setGrantTier(e.target.value)}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="bronze">برنز</option>
                  <option value="silver">نقره‌ای</option>
                  <option value="gold">طلایی</option>
                  <option value="diamond">الماس</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1.5 text-xs">مدت (روز)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={grantDays}
                  onChange={(e) => setGrantDays(Number(e.target.value))}
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              {grantMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  grantMessage.includes('موفق') ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}>
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{grantMessage}</span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={grantSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5"
                >
                  {grantSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gift className="w-3.5 h-3.5" />}
                  اعطای اشتراک
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar (Step 20) */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121824] border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-center gap-4 text-xs animate-in slide-in-from-bottom duration-200">
          <div className="text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{n(selectedUserIds.length)} کاربر انتخاب شده</span>
          </div>

          <button
            type="button"
            onClick={() => setShowBulkDiscountModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-black font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <Tag className="w-4 h-4" />
            <span>اعطای تخفیف گروهی</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedUserIds([])}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            لغو انتخاب
          </button>
        </div>
      )}

      {/* Bulk Discount Modal (Step 20) */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0c1017] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4 text-start font-vazir">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>اعطای تخفیف اشتراک به {n(selectedUserIds.length)} کاربر انتخاب‌شده</span>
              </div>
              <button
                onClick={() => setShowBulkDiscountModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkDiscount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">عنوان کمپین / پروموشن:</label>
                <input
                  type="text"
                  required
                  value={bulkTitle}
                  onChange={(e) => setBulkTitle(e.target.value)}
                  placeholder="مثال: تخفیف ویژه وفاداری"
                  className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">درصد تخفیف (٪):</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={bulkDiscountPercent}
                    onChange={(e) => setBulkDiscountPercent(Number(e.target.value))}
                    className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">مدت اعتبار (روز):</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    required
                    value={bulkDurationDays}
                    onChange={(e) => setBulkDurationDays(Number(e.target.value))}
                    className="w-full bg-[#121721] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {bulkMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    bulkMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{bulkMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBulkDiscountModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
                >
                  {bulkSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  اعمال تخفیف روی کاربران
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
