'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

export type LogLevel = 'info' | 'ok' | 'warn' | 'error';

export interface LogEntry {
  id: number;
  at: number;
  level: LogLevel;
  text: string;
}

interface SystemLogProps {
  logs: LogEntry[];
  startedAt: number;
  onClear: () => void;
}

const DOT: Record<LogLevel, string> = {
  info: 'bg-cyan-400',
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
  error: 'bg-rose-400',
};

const TEXT: Record<LogLevel, string> = {
  info: 'text-slate-300',
  ok: 'text-emerald-300',
  warn: 'text-amber-300',
  error: 'text-rose-300',
};

const pad = (n: number) => String(n).padStart(2, '0');

function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export default function SystemLog({ logs, startedAt, onClear }: SystemLogProps) {
  const { t, dir } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // keep the newest line in view
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-bold text-white">{t('gamepad.log.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400" dir="ltr">
            {clock((now - startedAt) / 1000)}
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={logs.length === 0}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <Trash2 className="h-3 w-3" />
            {t('gamepad.log.clear')}
          </button>
        </div>
      </div>

      <div
        ref={listRef}
        className="max-h-52 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-2 font-mono text-[11px] leading-relaxed"
        dir="ltr"
      >
        {logs.length === 0 ? (
          <p className="py-4 text-center font-sans text-[11px] text-slate-600" dir={dir}>
            {t('gamepad.log.waiting')}
          </p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 py-0.5">
              <span className="shrink-0 text-slate-600">{clock((entry.at - startedAt) / 1000)}</span>
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[entry.level]}`} />
              <span className={`${TEXT[entry.level]} min-w-0 break-words`} dir="auto">
                {entry.text}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
