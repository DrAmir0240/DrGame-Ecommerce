'use client';

import React from 'react';

interface StickPadProps {
  label: string;
  /** -1 .. 1 */
  x: number;
  /** -1 .. 1 */
  y: number;
  pressed?: boolean;
  /** 0 .. 1 — max stick radius while untouched */
  drift?: number;
  measuring?: boolean;
  color?: 'violet' | 'cyan';
}

const PALETTE = {
  violet: {
    ring: 'border-violet-500/30',
    glow: 'shadow-[0_0_28px_-6px_rgba(139,92,246,0.65)]',
    thumb: 'bg-violet-500',
    text: 'text-violet-300',
  },
  cyan: {
    ring: 'border-cyan-500/30',
    glow: 'shadow-[0_0_28px_-6px_rgba(34,211,238,0.65)]',
    thumb: 'bg-cyan-400',
    text: 'text-cyan-300',
  },
} as const;

function driftTone(drift: number): { label: string; className: string } {
  const pct = drift * 100;
  if (pct > 12) return { label: 'دریفت بالا', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
  if (pct > 6) return { label: 'دریفت جزئی', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  return { label: 'سالم', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
}

export default function StickPad({
  label,
  x,
  y,
  pressed = false,
  drift = 0,
  measuring = false,
  color = 'violet',
}: StickPadProps) {
  const palette = PALETTE[color];
  const tone = driftTone(drift);
  const pct = Math.round(drift * 100);

  // 34px of travel keeps the thumb inside the 112px well
  const tx = Math.max(-1, Math.min(1, x)) * 34;
  const ty = Math.max(-1, Math.min(1, y)) * 34;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-200">{label}</span>
        {pressed && (
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${palette.text} bg-white/5`}>
            L3/R3
          </span>
        )}
      </div>

      <div className="relative mx-auto grid h-[112px] w-[112px] place-items-center">
        {/* outer well */}
        <div className={`absolute inset-0 rounded-full border-2 bg-[#080b12] ${palette.ring}`} />

        {/* crosshair */}
        <div className="absolute inset-0">
          <span className="absolute left-1/2 top-2 h-[calc(100%-16px)] w-px -translate-x-1/2 bg-white/[0.06]" />
          <span className="absolute top-1/2 left-2 h-px w-[calc(100%-16px)] -translate-y-1/2 bg-white/[0.06]" />
        </div>

        {/* deadzone ring */}
        <div className="absolute inset-[18%] rounded-full border border-dashed border-white/10" />

        {/* thumb */}
        <div
          className={`absolute h-11 w-11 rounded-full ${palette.thumb} ${
            pressed ? palette.glow : ''
          }`}
          style={{
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${pressed ? 0.92 : 1})`,
            transition: measuring ? 'transform 90ms linear' : 'transform 40ms linear',
          }}
        >
          <span className="absolute inset-[30%] rounded-full bg-white/25" />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="font-mono text-slate-500" dir="ltr">
          {x.toFixed(2)} , {y.toFixed(2)}
        </span>
        <span className={`rounded border px-1.5 py-0.5 font-bold ${tone.className}`}>
          {measuring ? 'سنجش…' : `${pct}%`}
        </span>
      </div>
    </div>
  );
}
