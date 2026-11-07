'use client';

import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
  HelpCircle,
  Tv,
} from 'lucide-react';

export interface TargetButtonDef {
  idx: number;
  glyph: string;
  name: string;
  color?: string;
  isAnalog?: boolean;
}

export interface InteractiveControllerStageProps {
  model?: string | null;
  pressed: readonly boolean[];
  triggerValues?: readonly [number, number];
  axes?: readonly number[];
  currentTarget: TargetButtonDef | null;
  subStepIndex: number;
  targetList: TargetButtonDef[];
  stageTitle: string;
  stageDescription: string;
  analogValue?: number;
  onTargetClick?: (btnIdx: number) => void;
  isCompleted?: boolean;
  onOpenModal?: () => void;
}

export default function InteractiveControllerStage({
  model,
  pressed = [],
  triggerValues,
  axes,
  currentTarget,
  subStepIndex,
  targetList,
  stageTitle,
  stageDescription,
  analogValue = 0,
  onTargetClick,
  isCompleted = false,
  onOpenModal,
}: InteractiveControllerStageProps) {
  const isXbox = model === 'xbox-series';
  const lx = axes?.[0] ?? 0;
  const ly = axes?.[1] ?? 0;
  const rx = axes?.[2] ?? 0;
  const ry = axes?.[3] ?? 0;
  const l2 = Math.max(0, Math.min(1, triggerValues?.[0] ?? 0));
  const r2 = Math.max(0, Math.min(1, triggerValues?.[1] ?? 0));

  // Determine button coordinates for DualSense PlayStation layout (viewBox 0 0 540 330)
  // Perfectly symmetrical around center X = 270
  const buttonCoords = useMemo(() => {
    return {
      // Action Buttons (Right cluster, center at X=395, Y=148)
      0: { cx: 395, cy: 185, r: 14, glyph: isXbox ? 'A' : '✕', color: '#38bdf8' },
      1: { cx: 432, cy: 148, r: 14, glyph: isXbox ? 'B' : '◯', color: '#f43f5e' },
      2: { cx: 358, cy: 148, r: 14, glyph: isXbox ? 'X' : '□', color: '#ec4899' },
      3: { cx: 395, cy: 111, r: 14, glyph: isXbox ? 'Y' : '△', color: '#10b981' },

      // D-Pad (Left cluster, center at X=145, Y=148)
      12: { cx: 145, cy: 111, r: 14, glyph: '▲', color: '#a855f7' },
      15: { cx: 182, cy: 148, r: 14, glyph: '▶', color: '#a855f7' },
      13: { cx: 145, cy: 185, r: 14, glyph: '▼', color: '#a855f7' },
      14: { cx: 108, cy: 148, r: 14, glyph: '◀', color: '#a855f7' },

      // Bumpers & Triggers
      4: { x: 115, y: 40, w: 58, h: 20, rx: 7, cx: 144, cy: 50, r: 16, glyph: 'L1', color: '#06b6d4' },
      5: { x: 367, y: 40, w: 58, h: 20, rx: 7, cx: 396, cy: 50, r: 16, glyph: 'R1', color: '#06b6d4' },
      6: { x: 122, y: 15, w: 44, h: 22, rx: 7, cx: 144, cy: 26, r: 16, glyph: 'L2', color: '#8b5cf6' },
      7: { x: 374, y: 15, w: 44, h: 22, rx: 7, cx: 396, cy: 26, r: 16, glyph: 'R2', color: '#8b5cf6' },

      // Sticks
      10: { cx: 208, cy: 222, r: 28, glyph: 'L3', color: '#3b82f6' },
      11: { cx: 332, cy: 222, r: 28, glyph: 'R3', color: '#3b82f6' },

      // System Buttons
      8: { cx: 190, cy: 88, r: 7, glyph: 'CREATE', color: '#64748b' },
      9: { cx: 350, cy: 88, r: 7, glyph: 'OPTIONS', color: '#64748b' },
      16: { cx: 270, cy: 198, r: 11, glyph: 'PS', color: '#ffffff' },
    };
  }, [isXbox]);

  const activeTargetCoords = currentTarget ? buttonCoords[currentTarget.idx as keyof typeof buttonCoords] : null;

  return (
    <div className="w-full relative flex flex-col items-center">
      {/* ─────────────────────────────────────────────────────────────────
          1. ULTRA-COMPACT SLIM FLOATING HUD BAR (ارتفاع بسیار فشرده برای تلویزیون)
          Takes minimal vertical room (~38px) so the controller is 100% visible
          without ANY scrolling required!
         ───────────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-xl mx-auto mb-1.5 flex items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-slate-900/90 px-3.5 py-1.5 shadow-xl backdrop-blur-md">
        {/* Active Target Prompt or Complete */}
        <div className="flex items-center gap-2 truncate">
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs sm:text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>تمام دکمه‌های این مرحله تایید شدند! ✓</span>
            </div>
          ) : currentTarget ? (
            <div className="flex items-center gap-2">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-black text-white shadow-md animate-pulse"
                style={{
                  backgroundColor: currentTarget.color || '#8b5cf6',
                  boxShadow: `0 0 10px ${currentTarget.color || '#8b5cf6'}`,
                }}
              >
                {currentTarget.glyph}
              </span>
              <div className="text-start leading-tight">
                <span className="text-xs font-black text-white">
                  {currentTarget.name} را فشار دهید
                </span>
                <span className="hidden sm:inline-block mr-2 text-[10px] text-slate-400">
                  {currentTarget.isAnalog ? '(بیش از ۸۵٪ بکشید)' : '(دکمه مشخص‌شده روی دسته)'}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right side: Substep dots + Trigger gauge + Modal toggle button */}
        <div className="flex items-center gap-2 shrink-0" dir="ltr">
          {/* Analog live gauge */}
          {currentTarget?.isAnalog && !isCompleted && (
            <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
              <div className="h-1.5 w-12 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75 shadow-[0_0_8px_#22d3ee]"
                  style={{ width: `${Math.max(4, Math.min(100, analogValue * 100))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-300">
                {(analogValue * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {/* Substep progress dots */}
          <div className="flex items-center gap-1">
            {targetList.map((t, idx) => {
              const isPast = idx < subStepIndex || isCompleted;
              const isCurrent = idx === subStepIndex && !isCompleted;
              return (
                <button
                  key={t.idx}
                  type="button"
                  onClick={() => onTargetClick?.(t.idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isPast
                      ? 'w-3.5 bg-emerald-400 shadow-[0_0_6px_#34d399]'
                      : isCurrent
                      ? 'w-5 bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]'
                      : 'w-1.5 bg-white/20'
                  }`}
                  title={t.name}
                />
              );
            })}
          </div>

          {/* Modal trigger button */}
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 text-[11px] font-black text-amber-300 hover:text-white transition-all cursor-pointer border border-amber-400/30 hover:border-amber-400/60 shadow-sm"
              title="مشاهده راهنمای این مرحله"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>راهنمای این مرحله</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          2. HYPER-REALISTIC DUALSENSE 2D CONTROLLER GRAPHIC
          - Signature two-tone DualSense body with metallic reflections & ambient occlusion
          - Iconic glowing DualSense LED Lightbar with radiant light spill
          - 3D acrylic crystal action buttons (✕ ◯ □ △) with specular gloss highlights
          - Textured concave rubber thumbsticks with knurled perimeter grip & real-time glide
          - Directional cross D-Pad with beveled arms
          - Dynamic holographic target HUD callout & reticle
         ───────────────────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-[550px] mx-auto flex items-center justify-center">
        <svg
          viewBox="0 0 540 330"
          className="w-full h-auto select-none"
          style={{ maxHeight: 'min(380px, calc(100vh - 280px))' }}
          role="img"
          aria-label="نمای گرافیکی واقع‌گرایانه دسته بازی"
        >
          <defs>
            {/* Ambient chassis drop shadow */}
            <filter id="ds-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#000000" floodOpacity="0.9" />
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#020617" floodOpacity="0.8" />
            </filter>

            {/* Intense Neon lightbar glow */}
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur3" />
              <feMerge>
                <feMergeNode in="blur3" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Button Glass Specular Highlight Gradient */}
            <radialGradient id="btn-glass-specular" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#0f172a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </radialGradient>

            {/* Pearl White / Space Silver outer shell gradient */}
            <linearGradient id="chassis-pearl-white" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="92%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Obsidian Core chassis gradient */}
            <linearGradient id="chassis-obsidian-core" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="30%" stopColor="#0f172a" />
              <stop offset="75%" stopColor="#050812" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>

            {/* DualSense Lightbar Gradient (Cyan -> Indigo -> Violet -> Magenta) */}
            <linearGradient id="lightbar-neon-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="30%" stopColor="#3b82f6" />
              <stop offset="70%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>

            {/* Ambient light spill reflection gradient on white plastic */}
            <radialGradient id="light-spill-left" cx="80%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="light-spill-right" cx="20%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            {/* Thumbstick textured concave dome */}
            <radialGradient id="stick-rubber-dome" cx="42%" cy="38%" r="62%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="85%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Metallic Stick Socket Well */}
            <radialGradient id="stick-socket-well" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#050811" />
              <stop offset="85%" stopColor="#0b101c" />
              <stop offset="100%" stopColor="#334155" />
            </radialGradient>

            {/* Trigger analog fill gradient */}
            <linearGradient id="trigger-fill-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Touchpad subtle matte texture */}
            <linearGradient id="touchpad-matte" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141c2c" />
              <stop offset="50%" stopColor="#0c121f" />
              <stop offset="100%" stopColor="#060911" />
            </linearGradient>

            {/* Radar ping & rotating reticle animations */}
            <style>{`
              @keyframes targetPing {
                0% { r: 14px; opacity: 0.95; }
                70% { r: 28px; opacity: 0; }
                100% { r: 30px; opacity: 0; }
              }
              @keyframes reticleRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .radar-pulse {
                animation: targetPing 1.25s cubic-bezier(0, 0, 0.2, 1) infinite;
              }
              .reticle-spin {
                transform-origin: center;
                animation: reticleRotate 4s linear infinite;
              }
            `}</style>
          </defs>

          {/* ═══════════════════════════════════════════════════════════
              1. BUMPERS (L1 / R1) & TRIGGERS (L2 / R2)
             ═══════════════════════════════════════════════════════════ */}
          {/* L2 Trigger Base & Fill */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(6)}>
            <rect x="122" y="15" width="44" height="22" rx="7" fill="#090e18" stroke="#334155" strokeWidth="1.5" />
            {l2 > 0.02 && (
              <rect x="122" y="15" width={44 * l2} height="22" rx="7" fill="url(#trigger-fill-grad)" opacity="0.9" />
            )}
            <text x="144" y="27" fill={l2 > 0.02 ? '#ffffff' : '#94a3b8'} fontSize="9" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              L2 {l2 > 0.05 ? `${(l2 * 100).toFixed(0)}%` : ''}
            </text>
          </g>

          {/* R2 Trigger Base & Fill */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(7)}>
            <rect x="374" y="15" width="44" height="22" rx="7" fill="#090e18" stroke="#334155" strokeWidth="1.5" />
            {r2 > 0.02 && (
              <rect x="374" y="15" width={44 * r2} height="22" rx="7" fill="url(#trigger-fill-grad)" opacity="0.9" />
            )}
            <text x="396" y="27" fill={r2 > 0.02 ? '#ffffff' : '#94a3b8'} fontSize="9" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              R2 {r2 > 0.05 ? `${(r2 * 100).toFixed(0)}%` : ''}
            </text>
          </g>

          {/* L1 Bumper */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(4)}>
            <rect
              x="115"
              y="40"
              width="58"
              height="20"
              rx="7"
              fill={pressed[4] ? '#10b981' : '#1e293b'}
              stroke={pressed[4] ? '#34d399' : '#475569'}
              strokeWidth="1.5"
            />
            <text x="144" y="50" fill={pressed[4] ? '#ffffff' : '#cbd5e1'} fontSize="10" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              L1
            </text>
          </g>

          {/* R1 Bumper */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(5)}>
            <rect
              x="367"
              y="40"
              width="58"
              height="20"
              rx="7"
              fill={pressed[5] ? '#10b981' : '#1e293b'}
              stroke={pressed[5] ? '#34d399' : '#475569'}
              strokeWidth="1.5"
            />
            <text x="396" y="50" fill={pressed[5] ? '#ffffff' : '#cbd5e1'} fontSize="10" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              R1
            </text>
          </g>

          {/* ═══════════════════════════════════════════════════════════
              2. DUALSENSE CHASSIS BODY (Sculpted Two-tone Shell)
             ═══════════════════════════════════════════════════════════ */}
          {/* Main Ergonomic Outer Wings (White Pearl Shell) */}
          <path
            d="M 270 54
               C 225 54, 180 52, 140 58
               C 105 64, 80 88, 70 135
               C 60 180, 56 230, 64 275
               C 70 315, 84 328, 112 328
               C 136 328, 156 305, 178 260
               C 196 222, 212 208, 270 208
               C 328 208, 344 222, 362 260
               C 384 305, 404 328, 428 328
               C 456 328, 470 315, 476 275
               C 484 230, 480 180, 470 135
               C 460 88, 435 64, 400 58
               C 360 52, 315 54, 270 54 Z"
            fill="url(#chassis-pearl-white)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            filter="url(#ds-shadow)"
          />

          {/* Grip Highlights & Ergonomic Chamfers */}
          <path
            d="M 72 150 C 66 200, 68 250, 78 290 C 84 308, 94 316, 108 314 C 98 300, 92 248, 94 186 Z"
            fill="#ffffff"
            opacity="0.35"
          />
          <path
            d="M 468 150 C 474 200, 472 250, 462 290 C 456 308, 446 316, 432 314 C 442 300, 448 248, 446 186 Z"
            fill="#ffffff"
            opacity="0.35"
          />

          {/* Inner Obsidian Black Core Section */}
          <path
            d="M 270 70
               C 230 70, 195 72, 168 84
               C 150 92, 142 105, 138 130
               C 132 170, 140 210, 168 252
               C 190 282, 218 290, 270 290
               C 322 290, 350 282, 372 252
               C 400 210, 408 170, 402 130
               C 398 105, 390 92, 372 84
               C 345 72, 310 70, 270 70 Z"
            fill="url(#chassis-obsidian-core)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Light spill from lightbar onto white plastic wings */}
          <path
            d="M 195 62 C 185 85, 180 115, 190 142 L 205 140 C 196 115, 198 88, 205 64 Z"
            fill="url(#light-spill-left)"
          />
          <path
            d="M 345 62 C 355 85, 360 115, 350 142 L 335 140 C 344 115, 342 88, 335 64 Z"
            fill="url(#light-spill-right)"
          />

          {/* Touchpad (Center Matte Beveled Rectangle) */}
          <rect
            x="205"
            y="60"
            width="130"
            height="78"
            rx="10"
            fill="url(#touchpad-matte)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* ═══════════════════════════════════════════════════════════
              3. ICONIC DUALSENSE NEON LIGHTBAR (Glowing LED Strip)
             ═══════════════════════════════════════════════════════════ */}
          {/* Left glowing neon strip */}
          <path
            d="M 204 62 C 202 88, 204 118, 214 138"
            fill="none"
            stroke="url(#lightbar-neon-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#neon-glow)"
          />
          <path
            d="M 204 62 C 202 88, 204 118, 214 138"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* Right glowing neon strip */}
          <path
            d="M 336 62 C 338 88, 336 118, 326 138"
            fill="none"
            stroke="url(#lightbar-neon-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#neon-glow)"
          />
          <path
            d="M 336 62 C 338 88, 336 118, 326 138"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* Player 1 Micro-LED indicator dots below touchpad */}
          <g>
            <circle cx="264" cy="144" r="1.5" fill="#1e293b" />
            <circle cx="270" cy="144" r="1.8" fill="#38bdf8" filter="url(#neon-glow)" />
            <circle cx="276" cy="144" r="1.5" fill="#1e293b" />
          </g>

          {/* ═══════════════════════════════════════════════════════════
              4. D-PAD (DIRECTIONAL CROSS BUTTONS: ▲ ▶ ▼ ◀)
             ═══════════════════════════════════════════════════════════ */}
          {/* D-Pad well */}
          <circle cx="145" cy="148" r="46" fill="#080c14" stroke="#1e293b" strokeWidth="1.5" />

          {/* Directional Arms */}
          {[
            { idx: 12, cx: 145, cy: 111, glyph: '▲', label: 'Up' },
            { idx: 15, cx: 182, cy: 148, glyph: '▶', label: 'Right' },
            { idx: 13, cx: 145, cy: 185, glyph: '▼', label: 'Down' },
            { idx: 14, cx: 108, cy: 148, glyph: '◀', label: 'Left' },
          ].map((d) => {
            const on = pressed[d.idx] === true;
            return (
              <g
                key={d.idx}
                className="cursor-pointer select-none transition-transform active:scale-95"
                onClick={() => onTargetClick?.(d.idx)}
              >
                <circle
                  cx={d.cx}
                  cy={d.cy}
                  r="14"
                  fill={on ? '#10b981' : '#1e293b'}
                  stroke={on ? '#34d399' : '#475569'}
                  strokeWidth="1.5"
                  filter={on ? 'drop-shadow(0 0 10px #10b981)' : undefined}
                />
                <circle cx={d.cx} cy={d.cy - 3} r="10" fill="url(#btn-glass-specular)" opacity="0.65" />
                <text
                  x={d.cx}
                  y={d.cy}
                  fill={on ? '#ffffff' : '#cbd5e1'}
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {d.glyph}
                </text>
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════
              5. ACTION BUTTONS (PLAYSTATION 3D GLASS ICONS: ✕ ◯ □ △)
             ═══════════════════════════════════════════════════════════ */}
          {/* Action button well */}
          <circle cx="395" cy="148" r="46" fill="#080c14" stroke="#1e293b" strokeWidth="1.5" />

          {[
            { idx: 0, cx: 395, cy: 185, glyph: isXbox ? 'A' : '✕', color: '#38bdf8' },
            { idx: 1, cx: 432, cy: 148, glyph: isXbox ? 'B' : '◯', color: '#f43f5e' },
            { idx: 2, cx: 358, cy: 148, glyph: isXbox ? 'X' : '□', color: '#ec4899' },
            { idx: 3, cx: 395, cy: 111, glyph: isXbox ? 'Y' : '△', color: '#10b981' },
          ].map((btn) => {
            const on = pressed[btn.idx] === true;
            return (
              <g
                key={btn.idx}
                className="cursor-pointer select-none transition-transform active:scale-95"
                onClick={() => onTargetClick?.(btn.idx)}
              >
                {/* 3D Acrylic Glass Cap Shell */}
                <circle
                  cx={btn.cx}
                  cy={btn.cy}
                  r="14"
                  fill={on ? '#10b981' : '#1a2436'}
                  stroke={on ? '#34d399' : '#475569'}
                  strokeWidth="1.5"
                  filter={on ? 'drop-shadow(0 0 14px #10b981)' : undefined}
                />
                {/* Specular gloss top curved highlight */}
                <circle cx={btn.cx} cy={btn.cy - 3.5} r="10" fill="url(#btn-glass-specular)" opacity="0.75" />

                {/* Iconic PlayStation Glyph with Color Glow */}
                <text
                  x={btn.cx}
                  y={btn.cy}
                  fill={on ? '#ffffff' : btn.color}
                  fontSize="13"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ textShadow: `0 0 8px ${btn.color}` }}
                >
                  {btn.glyph}
                </text>
              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════
              6. THUMBSTICKS (L3 & R3 WITH REAL-TIME CONCAVE MOTION)
             ═══════════════════════════════════════════════════════════ */}
          {/* LEFT THUMBSTICK (L3) */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(10)}>
            {/* Outer socket well with metallic collar */}
            <circle cx="208" cy="222" r="30" fill="url(#stick-socket-well)" stroke="#334155" strokeWidth="2" />
            <circle cx="208" cy="222" r="26" fill="#04060c" />

            {/* Traveling rubber stick nub */}
            <circle
              cx={208 + lx * 8}
              cy={222 + ly * 8}
              r="21"
              fill="url(#stick-rubber-dome)"
              stroke={pressed[10] ? '#10b981' : '#475569'}
              strokeWidth="2"
              filter={pressed[10] ? 'drop-shadow(0 0 12px #10b981)' : undefined}
            />
            {/* Knurled perimeter textured grip ring */}
            <circle
              cx={208 + lx * 8}
              cy={222 + ly * 8}
              r="17"
              fill="none"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="2, 2"
              opacity="0.8"
            />
            {/* Inner concave depression */}
            <circle
              cx={208 + lx * 8}
              cy={222 + ly * 8}
              r="12"
              fill="#090e18"
              stroke="#1e293b"
              strokeWidth="1"
            />
            <text
              x={208 + lx * 8}
              y={222 + ly * 8}
              fill={pressed[10] ? '#ffffff' : '#64748b'}
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="central"
            >
              L3
            </text>
          </g>

          {/* RIGHT THUMBSTICK (R3) */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(11)}>
            {/* Outer socket well with metallic collar */}
            <circle cx="332" cy="222" r="30" fill="url(#stick-socket-well)" stroke="#334155" strokeWidth="2" />
            <circle cx="332" cy="222" r="26" fill="#04060c" />

            {/* Traveling rubber stick nub */}
            <circle
              cx={332 + rx * 8}
              cy={222 + ry * 8}
              r="21"
              fill="url(#stick-rubber-dome)"
              stroke={pressed[11] ? '#10b981' : '#475569'}
              strokeWidth="2"
              filter={pressed[11] ? 'drop-shadow(0 0 12px #10b981)' : undefined}
            />
            {/* Knurled perimeter textured grip ring */}
            <circle
              cx={332 + rx * 8}
              cy={222 + ry * 8}
              r="17"
              fill="none"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="2, 2"
              opacity="0.8"
            />
            {/* Inner concave depression */}
            <circle
              cx={332 + rx * 8}
              cy={222 + ry * 8}
              r="12"
              fill="#090e18"
              stroke="#1e293b"
              strokeWidth="1"
            />
            <text
              x={332 + rx * 8}
              y={222 + ry * 8}
              fill={pressed[11] ? '#ffffff' : '#64748b'}
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
              dominantBaseline="central"
            >
              R3
            </text>
          </g>

          {/* ═══════════════════════════════════════════════════════════
              7. SYSTEM BUTTONS (Create, Options, PS Logo, Mic Mute LED)
             ═══════════════════════════════════════════════════════════ */}
          {/* Create Button (Left angled pill) */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(8)}>
            <rect x="186" y="82" width="8" height="13" rx="4" fill={pressed[8] ? '#10b981' : '#1e293b'} stroke="#475569" strokeWidth="1" />
          </g>

          {/* Options Button (Right angled pill) */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(9)}>
            <rect x="346" y="82" width="8" height="13" rx="4" fill={pressed[9] ? '#10b981' : '#1e293b'} stroke="#475569" strokeWidth="1" />
          </g>

          {/* PS Emblem Button (Center) */}
          <g className="cursor-pointer" onClick={() => onTargetClick?.(16)}>
            <circle cx="270" cy="198" r="11" fill="#090e18" stroke="#475569" strokeWidth="1.2" />
            <text x="270" y="198" fill="#cbd5e1" fontSize="9" fontWeight="900" textAnchor="middle" dominantBaseline="central">
              PS
            </text>
          </g>

          {/* Acoustic Speaker Grille Dot Matrix */}
          <g fill="#1e293b">
            <circle cx="264" cy="172" r="1" />
            <circle cx="268" cy="172" r="1" />
            <circle cx="272" cy="172" r="1" />
            <circle cx="276" cy="172" r="1" />
            <circle cx="266" cy="176" r="1" />
            <circle cx="270" cy="176" r="1" />
            <circle cx="274" cy="176" r="1" />
          </g>

          {/* Mic Mute Indicator LED */}
          <rect x="264" y="216" width="12" height="3" rx="1.5" fill="#f59e0b" opacity="0.85" filter="drop-shadow(0 0 4px #f59e0b)" />

          {/* ═══════════════════════════════════════════════════════════
              8. ANIMATED HOLOGRAPHIC TARGET BEACON & HUD CALLOUT
             ═══════════════════════════════════════════════════════════ */}
          {activeTargetCoords && !isCompleted && (
            <g pointerEvents="none">
              {/* Outer Pulsing Radar Rings */}
              <circle
                cx={activeTargetCoords.cx}
                cy={activeTargetCoords.cy}
                r={activeTargetCoords.r + 6}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2"
                className="radar-pulse"
              />
              <circle
                cx={activeTargetCoords.cx}
                cy={activeTargetCoords.cy}
                r={activeTargetCoords.r + 3}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                filter="url(#neon-glow)"
              />
              {/* Rotating Sci-Fi Reticle Brackets */}
              <g
                style={{
                  transformOrigin: `${activeTargetCoords.cx}px ${activeTargetCoords.cy}px`,
                }}
                className="reticle-spin"
              >
                <circle
                  cx={activeTargetCoords.cx}
                  cy={activeTargetCoords.cy}
                  r={activeTargetCoords.r + 8}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="6, 8"
                  opacity="0.85"
                />
              </g>

              {/* Central pinpoint */}
              <circle
                cx={activeTargetCoords.cx}
                cy={activeTargetCoords.cy}
                r="3"
                fill="#ffffff"
                className="animate-pulse"
              />

              {/* Floating Holographic Pointer Callout directly over the target */}
              <g>
                {/* Pointer line */}
                <line
                  x1={activeTargetCoords.cx}
                  y1={activeTargetCoords.cy - (activeTargetCoords.r + 8)}
                  x2={activeTargetCoords.cx}
                  y2={activeTargetCoords.cy - (activeTargetCoords.r + 20)}
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="2, 2"
                />
                {/* Floating HUD Badge */}
                <rect
                  x={Math.max(10, Math.min(430, activeTargetCoords.cx - 50))}
                  y={activeTargetCoords.cy - (activeTargetCoords.r + 38)}
                  width="100"
                  height="18"
                  rx="9"
                  fill="#0f172a"
                  stroke="#22d3ee"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 2px 8px rgba(34,211,238,0.5))"
                />
                <text
                  x={Math.max(10, Math.min(430, activeTargetCoords.cx - 50)) + 50}
                  y={activeTargetCoords.cy - (activeTargetCoords.r + 29)}
                  fill="#ffffff"
                  fontSize="8.5"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  فشار دهید: {currentTarget?.glyph}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
