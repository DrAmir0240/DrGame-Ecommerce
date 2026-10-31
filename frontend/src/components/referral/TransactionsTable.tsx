'use client';

import React from 'react';
import { CommissionTransaction } from '@/types/referral';
import { useTranslation } from '@/i18n';
import { Receipt, ArrowUpRight, Clock, ShieldAlert } from 'lucide-react';

interface TransactionsTableProps {
  transactions: CommissionTransaction[];
  isLoading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
}

export default function TransactionsTable({
  transactions,
  isLoading,
  page,
  total,
  pageSize,
  onPageChange,
}: TransactionsTableProps) {
  const { t, tp, price, d } = useTranslation();
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl border border-white/10 p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-white/10 rounded-xl" />
        <div className="h-32 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-cosmic-purple" />
          <span>{t('referralUI.transactions.title')}</span>
        </h3>
        <span className="text-xs text-text-muted font-mono">
          {tp('referralUI.transactions.totalRecords', total)}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-xs space-y-2">
          <Clock className="w-8 h-8 mx-auto text-white/20" />
          <p>{t('referralUI.transactions.emptyTitle')}</p>
          <p className="text-[11px] text-text-muted/60">
            {t('referralUI.transactions.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-white/10 text-text-muted">
                <th className="py-3 px-3">{t('referralUI.transactions.colId')}</th>
                <th className="py-3 px-3">{t('referralUI.transactions.colTier')}</th>
                <th className="py-3 px-3">{t('referralUI.transactions.colAmount')}</th>
                <th className="py-3 px-3">{t('referralUI.transactions.colDescription')}</th>
                <th className="py-3 px-3">{t('referralUI.transactions.colDate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3 font-mono text-text-muted">#{tx.id}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-cosmic-purple/20 text-cosmic-purple font-bold text-[11px]">
                      {t('referralUI.transactions.tierBadge', { level: tx.tier_level })}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                    + {price(tx.amount_toman)}
                  </td>
                  <td className="py-3.5 px-3 text-white text-[11px]">{tx.description}</td>
                  <td className="py-3.5 px-3 text-text-muted font-mono text-[11px]">
                    {d(tx.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 text-xs">
              <span className="text-text-muted">
                {t('referralUI.transactions.page', { page, total: totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t('referralUI.transactions.prev')}
                </button>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t('referralUI.transactions.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
