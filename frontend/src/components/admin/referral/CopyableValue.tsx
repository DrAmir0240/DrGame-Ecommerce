'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyableValueProps {
  value: string | null | undefined;
  placeholder?: string;
  mono?: boolean;
  className?: string;
  maxWidthClass?: string;
}

export default function CopyableValue({
  value,
  placeholder = '—',
  mono = true,
  className = '',
  maxWidthClass = 'max-w-[220px]',
}: CopyableValueProps) {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="text-slate-600 text-xs">{placeholder}</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <span
        dir="ltr"
        title={value}
        className={`truncate tabular-nums select-all text-xs ${
          mono ? 'font-mono tracking-tight' : ''
        } ${maxWidthClass}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? 'کپی شد!' : 'کپی کردن'}
        aria-label={copied ? 'کپی شد' : 'کپی'}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border transition-colors shrink-0 ${
          copied
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            : 'bg-slate-800/80 border-slate-700/70 text-slate-400 hover:text-white hover:border-slate-500'
        }`}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied && <span>کپی شد</span>}
      </button>
    </span>
  );
}
