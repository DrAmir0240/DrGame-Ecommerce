'use client';

import React from 'react';
import { CommissionTransaction } from '@/types/referral';
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
          <span>تاریخچه تراکنش‌ها و پورسانت‌های دریافتی</span>
        </h3>
        <span className="text-xs text-text-muted font-mono">
          مجموع: {total.toLocaleString('fa-IR')} رکورد
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-xs space-y-2">
          <Clock className="w-8 h-8 mx-auto text-white/20" />
          <p>هنوز تراکنش یا پورسانتی برای حساب شما ثبت نشده است.</p>
          <p className="text-[11px] text-text-muted/60">
            به محض اولین خرید اشتراک توسط زیرمجموعه‌های شما، پورسانت به صورت آنی در این جدول نمایش داده می‌شود.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-text-muted">
                <th className="py-3 px-3">شناسه</th>
                <th className="py-3 px-3">سطح ارجاع</th>
                <th className="py-3 px-3">مبلغ دریافتی</th>
                <th className="py-3 px-3">شرح تراکنش</th>
                <th className="py-3 px-3">تاریخ ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-3 font-mono text-text-muted">#{tx.id}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-cosmic-purple/20 text-cosmic-purple font-bold text-[11px]">
                      سطح {tx.tier_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                    + {tx.amount_toman.toLocaleString('fa-IR')} تومان
                  </td>
                  <td className="py-3.5 px-3 text-white text-[11px]">{tx.description}</td>
                  <td className="py-3.5 px-3 text-text-muted font-mono text-[11px]">
                    {new Date(tx.created_at).toLocaleDateString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4 text-xs">
              <span className="text-text-muted">
                صفحه {page} از {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  قبلی
                </button>
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
