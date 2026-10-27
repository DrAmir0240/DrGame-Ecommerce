'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import InvoiceModal from '@/components/payments/InvoiceModal';

interface PaymentItem {
  id: number;
  order_id?: number | null;
  tracking_code: string;
  amount_toman: number;
  gateway: string;
  status: 'success' | 'failed' | 'pending';
  plan_name?: string | null;
  jalali_date: string;
  created_at: string;
}

export default function MyPaymentsPage() {
  const { isAuthenticated, user, setAuthModalOpen } = useAuthStore();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentItem | null>(null);

  const fetchPayments = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await apiRequest<PaymentItem[]>('/users/me/payments');
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to load payments history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const toFarsi = (num: number) => (num || 0).toLocaleString('fa-IR');

  const filteredPayments = payments.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (p.tracking_code || '').toLowerCase().includes(term) ||
      (p.plan_name || '').toLowerCase().includes(term) ||
      (p.gateway || '').toLowerCase().includes(term);

    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return matchesSearch;
  });

  const getStatusBadge = (status: PaymentItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>موفق</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            <span>ناموفق</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>در انتظار تایید</span>
          </span>
        );
    }
  };

  const totalSpentToman = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount_toman || 0), 0);

  const successfulCount = payments.filter((p) => p.status === 'success').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-vazir text-right">
      {!isAuthenticated && (
        <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>جهت مشاهده سوابق پرداخت و فاکتورهای رسمی حساب خود، وارد شوید.</span>
          </div>
          <button
            onClick={() => setAuthModalOpen(true, 'otp')}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shrink-0"
          >
            ورود به حساب
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>سوابق تراکنش‌ها و فاکتورهای دیجیتال</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            سوابق پرداخت‌ها
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            آرشیو کامل پرداخت‌های انجام‌شده برای خرید اشتراک، شارژ کیف پول و خدمات ویژه
          </p>
        </div>

        <Link
          href="/subscriptions"
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>خرید یا تمدید اشتراک</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>مجموع پرداخت‌های موفق</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-roboto pt-2">
            {toFarsi(totalSpentToman)}{' '}
            <span className="text-xs font-vazir text-slate-400">تومان</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>تعداد سفارش‌های موفق</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-roboto pt-2">
            {toFarsi(successfulCount)}{' '}
            <span className="text-xs font-vazir text-slate-400">سفارش</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d121f] border border-white/10 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>امنیت پرداخت و تضمین درگاه</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white pt-2 leading-relaxed">
            شبکه پرداخت شاپرک با پروتکل رمزنگاری امن SSL
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0d121f] border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی کد رهگیری، نام پلن یا درگاه..."
            className="w-full bg-[#141b2d] border border-white/10 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="all">همه تراکنش‌ها</option>
            <option value="success">فقط پرداخت‌های موفق</option>
            <option value="pending">در انتظار تایید</option>
            <option value="failed">پرداخت‌های ناموفق</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-3xl bg-[#0d121f] border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400">در حال دریافت سوابق پرداخت‌ها...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#141b2d] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-bold">کد رهگیری</th>
                  <th className="py-3.5 px-4 font-bold">پلن / خدمت</th>
                  <th className="py-3.5 px-4 font-bold">مبلغ (تومان)</th>
                  <th className="py-3.5 px-4 font-bold">درگاه</th>
                  <th className="py-3.5 px-4 font-bold">تاریخ و ساعت</th>
                  <th className="py-3.5 px-4 font-bold">وضعیت</th>
                  <th className="py-3.5 px-4 font-bold text-center">فاکتور رسمی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-500">
                      هیچ تراکنشی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400" dir="ltr">
                        {p.tracking_code || `#${p.id}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {p.plan_name || 'اشتراک ویژه سرویس بازی'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {toFarsi(p.amount_toman)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.gateway || 'درگاه بانکی'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.jalali_date}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.status === 'success' ? (
                          <button
                            onClick={() => setSelectedInvoice(p)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center gap-1 mx-auto transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>مشاهده فاکتور</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        invoice={
          selectedInvoice
            ? {
                ...selectedInvoice,
                user_name: (user as any)?.full_name || user?.username,
                user_phone: (user as any)?.phone,
              }
            : null
        }
      />
    </div>
  );
}
