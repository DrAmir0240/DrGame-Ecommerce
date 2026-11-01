'use client';

/**
 * ControllerMap — 2D top-down map of the connected controller with live
 * highlighting of every button.
 *
 * Why it exists next to the 3D model: `dualsense.glb` is a single merged mesh,
 * so individual buttons cannot be highlighted from the model itself.
 *
 * Geometry comes from `controller-art.json`; the part index `i` is the button
 * index of the W3C "standard" gamepad mapping.
 */

import type { CSSProperties } from 'react';
import { useTranslation } from '@/i18n';
import { layoutForModel, VIEW_BOX, type ControllerShape } from './controllerArt';

/** Button indices that need special rendering. */
const STICK_LEFT = 10;
const STICK_RIGHT = 11;
const TRIGGER_LEFT = 6;
const TRIGGER_RIGHT = 7;

/** How far the stick nub travels inside its well, in viewBox units. */
const STICK_TRAVEL = 5;

export interface ControllerMapProps {
  /** Controller key from `identifyController` — decides the layout. */
  model?: string | null;
  /** 18-entry pressed flags, straight from the Gamepad API. */
  pressed?: readonly boolean[];
  /** Analog L2/R2 values (0..1). */
  triggerValues?: readonly [number, number];
  /** Stick axes: [LX, LY, RX, RY], each -1..1. */
  axes?: readonly number[];
  className?: string;
  style?: CSSProperties;
}

const THEME = {
  '--cm-body': '#101725',
  '--cm-body-edge': '#2a3346',
  '--cm-well': '#0a0e17',
  '--cm-btn': '#1b2438',
  '--cm-glyph': '#8b95ad',
  '--cm-accent': '#8b5cf6',
  '--cm-accent-soft': '#a78bfa',
} as CSSProperties;

export default function ControllerMap({
  model,
  pressed = [],
  triggerValues,
  axes,
  className,
  style,
}: ControllerMapProps) {
  const { t } = useTranslation();
  const layout = layoutForModel(model);

  const lx = axes?.[0] ?? 0;
  const ly = axes?.[1] ?? 0;
  const rx = axes?.[2] ?? 0;
  const ry = axes?.[3] ?? 0;
  const l2 = clamp01(triggerValues?.[0] ?? 0);
  const r2 = clamp01(triggerValues?.[1] ?? 0);

  return (
    <div
      className={className}
      style={{ width: '100%', display: 'grid', placeItems: 'center', ...THEME, ...style }}
    >
      <svg
        viewBox={VIEW_BOX}
        role="img"
        aria-label={t('gamepad.map.ariaLabel')}
        style={{ width: '100%', height: 'auto', maxWidth: 620 }}
      >
        <style>{`
          .cm-body  { stroke: var(--cm-body-edge); stroke-width: 1.5; }
          .cm-shape { fill: var(--cm-btn); stroke: var(--cm-body-edge); stroke-width: 1.2;
                      transition: fill 90ms linear, stroke 90ms linear; }
          .cm-well  { fill: var(--cm-well); stroke: var(--cm-body-edge); stroke-width: 1.2; }
          .cm-nub   { fill: #3b4560; stroke: var(--cm-body-edge); stroke-width: 1;
                      transition: transform 70ms linear, fill 90ms linear; }
          .cm-decor { fill: var(--cm-well); opacity: .9; }
          .cm-decor.accent { fill: var(--cm-accent); opacity: .55; }
          .cm-glyph { fill: var(--cm-glyph); font-size: 11px; font-weight: 600;
                      text-anchor: middle; dominant-baseline: central; pointer-events: none;
                      transition: fill 90ms linear; }
          .cm-part.on .cm-shape,
          .cm-part.on .cm-nub   { fill: var(--cm-accent); stroke: var(--cm-accent-soft); }
          .cm-part.on .cm-glyph { fill: #ffffff; }
          .cm-part.on           { filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.55)); }
        `}</style>

        <defs>
          <linearGradient id="cm-body-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#141c2d" />
            <stop offset="100%" stopColor="#0b101b" />
          </linearGradient>
          <linearGradient id="cm-trigger-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        <path className="cm-body" d={layout.body} fill="url(#cm-body-fill)" />

        {layout.decor?.map((shape, index) => (
          <g key={`decor-${index}`}>
            {renderShape(shape, `cm-decor${shape.accent ? ' accent' : ''}`)}
          </g>
        ))}

        {[...layout.parts].sort(byDepth).map((part) => {
          const on = pressed[part.i] === true;

          if (part.i === STICK_LEFT || part.i === STICK_RIGHT) {
            const x = part.i === STICK_LEFT ? lx : rx;
            const y = part.i === STICK_LEFT ? ly : ry;
            return (
              <g key={part.i} className={`cm-part${on ? ' on' : ''}`}>
                <circle className="cm-well" cx={part.cx} cy={part.cy} r={part.r} />
                <circle
                  className="cm-nub"
                  cx={(part.cx ?? 0) + x * STICK_TRAVEL}
                  cy={(part.cy ?? 0) + y * STICK_TRAVEL}
                  r={part.ring ?? 9}
                />
              </g>
            );
          }

          if (part.i === TRIGGER_LEFT || part.i === TRIGGER_RIGHT) {
            const value = part.i === TRIGGER_LEFT ? l2 : r2;
            return (
              <g key={part.i} className={`cm-part${on ? ' on' : ''}`}>
                <rect
                  className="cm-shape"
                  x={part.x}
                  y={part.y}
                  width={part.w}
                  height={part.h}
                  rx={part.rx}
                />
                {value > 0.02 && (
                  <rect
                    x={part.x}
                    y={part.y}
                    width={(part.w ?? 0) * value}
                    height={part.h}
                    rx={part.rx}
                    fill="url(#cm-trigger-fill)"
                    opacity={0.9}
                  />
                )}
                {part.glyph && (
                  <text
                    className="cm-glyph"
                    x={(part.x ?? 0) + (part.w ?? 0) / 2}
                    y={(part.y ?? 0) + (part.h ?? 0) / 2}
                    style={{ fontSize: part.fs ?? 8 }}
                  >
                    {part.glyph}
                  </text>
                )}
              </g>
            );
          }

          return (
            <g key={part.i} className={`cm-part${on ? ' on' : ''}`}>
              {renderShape(part)}
              {part.glyph && (
                <text
                  className="cm-glyph"
                  x={part.kind === 'circle' ? part.cx : (part.x ?? 0) + (part.w ?? 0) / 2}
                  y={part.kind === 'circle' ? part.cy : (part.y ?? 0) + (part.h ?? 0) / 2}
                  style={part.fs ? { fontSize: part.fs } : undefined}
                >
                  {part.glyph}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function renderShape(shape: ControllerShape, className = 'cm-shape') {
  if (shape.kind === 'circle') {
    return <circle className={className} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  }
  return (
    <rect
      className={className}
      x={shape.x}
      y={shape.y}
      width={shape.w}
      height={shape.h}
      rx={shape.rx}
    />
  );
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Large surfaces (touchpad, stick wells) sit underneath the small buttons, so
 * they must be painted first — otherwise the touchpad would clip the shoulders.
 */
const DEPTH: Record<number, number> = { 17: 0, 10: 1, 11: 1 };

function byDepth(a: { i: number }, b: { i: number }): number {
  return (DEPTH[a.i] ?? 2) - (DEPTH[b.i] ?? 2);
}
