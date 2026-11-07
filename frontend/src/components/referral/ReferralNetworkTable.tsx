'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { apiRequest } from '@/lib/apiClient';
import { ReferralMemberItem, ReferralMemberListResponse } from '@/types/referral';
import { Users, ShieldCheck, ShieldAlert, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface ReferralNetworkTableProps {
  currentLevelFilter?: number | null;
  availableLevels?: number[];
  onSelectLevelFilter?: (level: number | null) => void;
}

export default function ReferralNetworkTable({
  currentLevelFilter = null,
  availableLevels = [],
  onSelectLevelFilter,
}: ReferralNetworkTableProps) {
  const { t, n, price, d } = useTranslation();
  const [members, setMembers] = useState<ReferralMemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(currentLevelFilter || null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedLevel(currentLevelFilter);
  }, [currentLevelFilter]);

  const pageSize = 15;

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const levelQuery = selectedLevel ? `&level=${selectedLevel}` : '';
      const res = await apiRequest<ReferralMemberListResponse>(
        `/referral/members?page=${page}&page_size=${pageSize}${levelQuery}`
      );
      setMembers(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load network members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, selectedLevel]);

  const handleLevelChange = (lvl: number | null) => {
    setSelectedLevel(lvl);
    setPage(1);
    if (onSelectLevelFilter) {
      onSelectLevelFilter(lvl);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl text-start font-vazir">
      {/* Header and Level Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>اعضای شبکه زیرمجموعه شما</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              {n(total)} عضو
            </span>
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            مشاهده وضعیت اشتراک، سطح شبکه و میزان درآمدزایی هر عضو (با اسامی ماسک‌شده جهت حفظ حریم خصوصی)
          </p>
        </div>

        {/* Level Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!availableLevels || availableLevels.length === 0 ? (
            <span className="text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 font-bold">
              بدون لایه فعال
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleLevelChange(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === null
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-[#141b2d] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                همه لایه‌ها
              </button>
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelChange(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedLevel === lvl
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-[#141b2d] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  لایه {n(lvl)}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-start">
          <thead>
            <tr className="border-b border-white/5 text-slate-400 font-bold">
              <th className="py-3 px-3 text-start">کاربر</th>
              <th className="py-3 px-3 text-center">لایه شبکه</th>
              <th className="py-3 px-3 text-center">وضعیت اشتراک</th>
              <th className="py-3 px-3 text-start">تاریخ عضویت</th>
              <th className="py-3 px-3 text-end">سود تولیدی برای شما</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  در حال بارگذاری لیست اعضا...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  هیچ کاربری در این سطح یافت نشد. با اشتراک‌گذاری لینک معرف خود، اولین زیرمجموعه را جذب کنید!
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={`${m.user_id}-${m.level}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 text-start">
                    <div className="font-mono font-bold text-white text-xs">{m.masked_username}</div>
                    {m.masked_phone && (
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">{m.masked_phone}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.level === 1
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          : m.level === 2
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : m.level === 3
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      }`}
                    >
                      لایه {n(m.level)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {m.has_active_subscription ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>مشترک فعال</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        <span>بدون اشتراک</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-start text-slate-400 text-[11px]">
                    {d(m.joined_at)}
                  </td>
                  <td className="py-3 px-3 text-end font-mono font-bold text-emerald-400 text-xs" dir="ltr">
                    {price(m.total_contributed_commission_toman)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
          <div>
            صفحه {n(page)} از {n(totalPages)} (مجموع {n(total)} عضو)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-[#141b2d] border border-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-[#141b2d] border border-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
