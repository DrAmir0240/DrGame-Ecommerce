'use client';

import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Gamepad2, FileText } from 'lucide-react';

interface InvoiceData {
  id: number;
  order_id?: number | null;
  tracking_code: string;
  amount_toman: number;
  gateway: string;
  status: string;
  plan_name?: string | null;
  jalali_date: string;
  user_name?: string;
  user_phone?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

export default function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  const toFarsi = (num: number) => (num || 0).toLocaleString('fa-IR');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-vazir text-right">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0d111a] border border-white/10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200 print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>چاپ فاکتور</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-5 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 font-black">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-white print:text-black">دکتر گیم (DrGame)</h2>
            </div>
            <p className="text-[11px] text-slate-400 print:text-gray-600">
              سامانه جامع خدمات کنسول، دانلود دیتا و بازی‌های اورجینال
            </p>
          </div>

          <div className="text-left space-y-1 font-mono text-xs">
            <div className="font-bold text-white print:text-black">فاکتور رسمی الکترونیکی</div>
            <div className="text-slate-400 text-[11px] print:text-gray-600" dir="ltr">
              NO: INV-{invoice.tracking_code || invoice.id}
            </div>
            <div className="text-slate-400 text-[11px] font-vazir">
              {invoice.jalali_date}
            </div>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-6 text-xs print:bg-gray-100 print:border-gray-300">
          <div>
            <span className="text-slate-400 text-[11px] block mb-0.5 print:text-gray-600">خریدار:</span>
            <span className="font-bold text-white print:text-black">
              {invoice.user_name || 'کاربر گرامی دکتر گیم'}
            </span>
            {invoice.user_phone && (
              <span className="block text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                {invoice.user_phone}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block mb-0.5 print:text-gray-600">کد رهگیری بانکی / شاپرک:</span>
            <span className="font-mono font-bold text-cyan-400 print:text-black" dir="ltr">
              {invoice.tracking_code}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              درگاه پرداخت: {invoice.gateway}
            </span>
          </div>
        </div>

        {/* Item Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden mb-6 print:border-gray-400">
          <table className="w-full text-xs text-right">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 print:bg-gray-200 print:text-black print:border-gray-400">
              <tr>
                <th className="p-3">شرح خدمت / اشتراک</th>
                <th className="p-3 text-center">تعداد</th>
                <th className="p-3 text-left">مبلغ کل (تومان)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-gray-300">
              <tr>
                <td className="p-3">
                  <div className="font-bold text-white print:text-black">
                    {invoice.plan_name || 'اشتراک ویژه سرویس بازی‌های کنسولی'}
                  </div>
                  <div className="text-[11px] text-slate-400 print:text-gray-600">
                    دسترسی پرسرعت به مخزن دیتای اختصاصی
                  </div>
                </td>
                <td className="p-3 text-center font-mono font-bold">۱</td>
                <td className="p-3 text-left font-mono font-bold text-white print:text-black">
                  {toFarsi(invoice.amount_toman)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="space-y-2 border-t border-white/10 pt-4 text-xs font-medium">
          <div className="flex justify-between text-slate-400 print:text-gray-600">
            <span>مبلغ ناخالص:</span>
            <span className="font-mono">{toFarsi(invoice.amount_toman)} تومان</span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-gray-600">
            <span>تخفیف:</span>
            <span className="font-mono">۰ تومان</span>
          </div>
          <div className="flex justify-between text-slate-400 print:text-gray-600">
            <span>مالیات بر ارزش افزوده:</span>
            <span className="font-mono">۰ تومان</span>
          </div>
          <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10 print:text-black print:border-gray-400">
            <span>مبلغ نهایی پرداخت شده:</span>
            <span className="font-mono text-emerald-400 print:text-black">
              {toFarsi(invoice.amount_toman)} تومان
            </span>
          </div>
        </div>

        {/* Digital Verification Seal */}
        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400 print:border-gray-400 print:bg-gray-100 print:text-black">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">تراکنش موفق - دارای اعتبار الکترونیکی رسمی</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 print:text-black">
            STATUS: 200 OK
          </span>
        </div>
      </div>
    </div>
  );
}
