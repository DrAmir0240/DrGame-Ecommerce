'use client';

import React from 'react';

interface DiagramButton {
  pressed: boolean;
  value: number;
}

interface ControllerDiagramProps {
  buttons: ReadonlyArray<DiagramButton>;
  axes: readonly number[];
  connected: boolean;
}

/** W3C "standard" gamepad mapping. */
const BTN = {
  cross: 0,
  circle: 1,
  square: 2,
  triangle: 3,
  l1: 4,
  r1: 5,
  l2: 6,
  r2: 7,
  create: 8,
  options: 9,
  l3: 10,
  r3: 11,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
  ps: 16,
} as const;

const ON = '#34d399';
const OFF = '#1b2230';
const EDGE = '#2c3648';
const GLYPH_ON = '#04140d';
const GLYPH_OFF = '#8494ad';

export default function ControllerDiagram({ buttons, axes, connected }: ControllerDiagramProps) {
  const b = (i: number) => buttons[i] ?? { pressed: false, value: 0 };
  const fill = (i: number) => (b(i).pressed ? ON : OFF);
  const glyph = (i: number) => (b(i).pressed ? GLYPH_ON : GLYPH_OFF);

  const lx = axes[0] ?? 0;
  const ly = axes[1] ?? 0;
  const rx = axes[2] ?? 0;
  const ry = axes[3] ?? 0;

  const l2 = Math.max(0, Math.min(1, b(BTN.l2).value));
  const r2 = Math.max(0, Math.min(1, b(BTN.r2).value));

  return (
    <svg
      viewBox="0 0 400 250"
      className="mx-auto h-auto w-full max-w-[440px]"
      role="img"
      aria-label="نقشه دکمه‌های دسته"
      style={{ opacity: connected ? 1 : 0.45, transition: 'opacity 200ms ease' }}
    >
      <defs>
        <linearGradient id="gp-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2331" />
          <stop offset="100%" stopColor="#0e1320" />
        </linearGradient>
        <linearGradient id="gp-trigger" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      {/* ---------- shoulders ---------- */}
      {/* L2 analog track */}
      <rect x="78" y="32" width="74" height="9" rx="4.5" fill="#0b0f18" stroke={EDGE} strokeWidth="1" />
      <rect x="78" y="32" width={74 * l2} height="9" rx="4.5" fill="url(#gp-trigger)" />
      {/* R2 analog track */}
      <rect x="248" y="32" width="74" height="9" rx="4.5" fill="#0b0f18" stroke={EDGE} strokeWidth="1" />
      <rect x="248" y="32" width={74 * r2} height="9" rx="4.5" fill="url(#gp-trigger)" />

      {/* L1 / R1 */}
      <rect x="78" y="47" width="74" height="15" rx="7.5" fill={fill(BTN.l1)} stroke={EDGE} strokeWidth="1" />
      <rect x="248" y="47" width="74" height="15" rx="7.5" fill={fill(BTN.r1)} stroke={EDGE} strokeWidth="1" />
      <text x="115" y="58" textAnchor="middle" fontSize="8" fontWeight="700" fill={glyph(BTN.l1)}>
        L1
      </text>
      <text x="285" y="58" textAnchor="middle" fontSize="8" fontWeight="700" fill={glyph(BTN.r1)}>
        R1
      </text>

      {/* ---------- body ---------- */}
      <circle cx="90" cy="170" r="46" fill="url(#gp-body)" stroke={EDGE} strokeWidth="1.5" />
      <circle cx="310" cy="170" r="46" fill="url(#gp-body)" stroke={EDGE} strokeWidth="1.5" />
      <rect x="60" y="64" width="280" height="122" rx="58" fill="url(#gp-body)" stroke={EDGE} strokeWidth="1.5" />

      {/* touchpad */}
      <rect x="164" y="74" width="72" height="34" rx="8" fill="#0b0f18" stroke={EDGE} strokeWidth="1" />
      <line x1="172" y1="84" x2="228" y2="84" stroke="#232c3d" strokeWidth="1" />
      <line x1="172" y1="98" x2="228" y2="98" stroke="#232c3d" strokeWidth="1" />

      {/* create / options */}
      <circle cx="143" cy="90" r="5" fill={fill(BTN.create)} stroke={EDGE} strokeWidth="1" />
      <circle cx="257" cy="90" r="5" fill={fill(BTN.options)} stroke={EDGE} strokeWidth="1" />

      {/* ---------- D-pad ---------- */}
      <rect x="110" y="116" width="13" height="13" rx="3" fill={fill(BTN.up)} stroke={EDGE} strokeWidth="1" />
      <rect x="110" y="151" width="13" height="13" rx="3" fill={fill(BTN.down)} stroke={EDGE} strokeWidth="1" />
      <rect x="92" y="133.5" width="13" height="13" rx="3" fill={fill(BTN.left)} stroke={EDGE} strokeWidth="1" />
      <rect x="131" y="133.5" width="13" height="13" rx="3" fill={fill(BTN.right)} stroke={EDGE} strokeWidth="1" />

      {/* ---------- face buttons ---------- */}
      <circle cx="284" cy="126" r="7.5" fill={fill(BTN.triangle)} stroke={EDGE} strokeWidth="1" />
      <path d="M284 121.5 L288 128.5 L280 128.5 Z" fill={glyph(BTN.triangle)} />

      <circle cx="298" cy="140" r="7.5" fill={fill(BTN.circle)} stroke={EDGE} strokeWidth="1" />
      <circle cx="298" cy="140" r="3" fill="none" stroke={glyph(BTN.circle)} strokeWidth="1.4" />

      <circle cx="284" cy="154" r="7.5" fill={fill(BTN.cross)} stroke={EDGE} strokeWidth="1" />
      <path
        d="M281.2 151.2 L286.8 156.8 M286.8 151.2 L281.2 156.8"
        stroke={glyph(BTN.cross)}
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      <circle cx="270" cy="140" r="7.5" fill={fill(BTN.square)} stroke={EDGE} strokeWidth="1" />
      <rect x="267" y="137" width="6" height="6" rx="1" fill="none" stroke={glyph(BTN.square)} strokeWidth="1.4" />

      {/* ---------- PS button ---------- */}
      <circle cx="200" cy="142" r="7" fill={fill(BTN.ps)} stroke={EDGE} strokeWidth="1" />
      <text x="200" y="145" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={glyph(BTN.ps)}>
        PS
      </text>

      {/* ---------- sticks ---------- */}
      <circle cx="154" cy="170" r="15" fill="#0b0f18" stroke={EDGE} strokeWidth="1.2" />
      <circle
        cx={154 + lx * 6}
        cy={170 + ly * 6}
        r="10.5"
        fill={b(BTN.l3).pressed ? ON : '#39435a'}
        stroke={EDGE}
        strokeWidth="1"
      />

      <circle cx="246" cy="170" r="15" fill="#0b0f18" stroke={EDGE} strokeWidth="1.2" />
      <circle
        cx={246 + rx * 6}
        cy={170 + ry * 6}
        r="10.5"
        fill={b(BTN.r3).pressed ? ON : '#39435a'}
        stroke={EDGE}
        strokeWidth="1"
      />

      {/* labels */}
      <text x="115" y="26" textAnchor="middle" fontSize="7.5" fill="#64748b">L2</text>
      <text x="285" y="26" textAnchor="middle" fontSize="7.5" fill="#64748b">R2</text>
      <text x="154" y="199" textAnchor="middle" fontSize="7.5" fill="#64748b">L3</text>
      <text x="246" y="199" textAnchor="middle" fontSize="7.5" fill="#64748b">R3</text>
    </svg>
  );
}
