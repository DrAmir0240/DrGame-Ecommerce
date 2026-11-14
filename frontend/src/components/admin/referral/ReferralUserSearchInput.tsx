'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2, X, ShieldBan, EyeOff, Ban } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { ReferralUserSearchItem } from '@/types/referral';

interface ReferralUserSearchInputProps {
  placeholder?: string;
  selectedUser?: ReferralUserSearchItem | null;
  onSelect: (user: ReferralUserSearchItem) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export default function ReferralUserSearchInput({
  placeholder = 'جستجو با نام، نام کاربری، موبایل، کد رفرال، کد ملی یا شناسه...',
  selectedUser = null,
  onSelect,
  onClear,
  autoFocus = false,
  className = '',
}: ReferralUserSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReferralUserSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!open && !query.trim()) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiRequest<ReferralUserSearchItem[]>(
          `/admin-referral/users/search?q=${encodeURIComponent(query.trim())}&limit=12`
        );
        setResults(res || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleChoose = (u: ReferralUserSearchItem) => {
    setOpen(false);
    setQuery('');
    onSelect(u);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {selectedUser ? (
        <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-rose-500/40 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold flex items-center justify-center shrink-0">
              {(selectedUser.full_name || selectedUser.username || '?')[0]}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold truncate flex items-center gap-1.5">
                <span>{selectedUser.full_name || selectedUser.username}</span>
                <span className="text-[11px] font-mono text-rose-300" dir="ltr">
                  @{selectedUser.username}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                #{selectedUser.id}
                {selectedUser.phone ? ` · ${selectedUser.phone}` : ''}
                {selectedUser.referral_code ? ` · ${selectedUser.referral_code}` : ''}
              </div>
            </div>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="تغییر کاربر"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            autoFocus={autoFocus}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            placeholder={placeholder}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pr-9 pl-9 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-rose-400 animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
          ) : (
            query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      )}

      {open && !selectedUser && (
        <div className="absolute right-0 left-0 top-full mt-1.5 z-50 rounded-2xl bg-[#0c1017] border border-slate-700/80 shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/70">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              در حال جستجوی کاربران...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              کاربری مطابق این مشخصات یافت نشد.
            </div>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleChoose(u)}
                className="w-full text-right px-3.5 py-2.5 hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                    {(u.full_name || u.username || '?')[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{u.full_name || u.username}</span>
                      <span className="font-mono text-rose-300 text-[11px]" dir="ltr">
                        @{u.username}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2" dir="ltr">
                      <span>#{u.id}</span>
                      {u.phone && <span>{u.phone}</span>}
                      <span>{u.referral_code}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.is_referral_hidden && (
                    <span
                      title="مخفی در آبشار (Pass-Through)"
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    >
                      <EyeOff className="w-3 h-3" />
                      مخفی
                    </span>
                  )}
                  {u.is_referral_blocked && (
                    <span
                      title="روح‌شده / مسدودیت پورسانت"
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30"
                    >
                      <ShieldBan className="w-3 h-3" />
                      روح‌شده
                    </span>
                  )}
                  {u.is_subscription_banned && (
                    <span
                      title="تحریم خرید اشتراک"
                      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-200"
                    >
                      <Ban className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
