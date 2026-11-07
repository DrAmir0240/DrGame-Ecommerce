'use client';

/**
 * ControllerViewer — the "which controller is plugged in + what am I pressing"
 * panel of the tester, matching the padview.js logic from Desktop/rep.
 *
 * Renders 3D interactive model (for DualSense) or 2D vector map (for all controllers),
 * plus the full 18-button real-time chips grid and analog axes meters.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Gamepad2, Map as MapIcon, Unplug } from 'lucide-react';
import { useTranslation } from '@/i18n';
import ControllerMap from './ControllerMap';
import ControllerModel3D from './ControllerModel3D';
import {
  BUTTON_LABELS,
  BUTTON_LABELS_XBOX,
  type ControllerInfo,
  type PadSnapshot,
} from './useGamepad';

type ViewMode = '3d' | 'map';

export interface ControllerViewerProps {
  pad: PadSnapshot;
  controller: ControllerInfo | null;
  orientation?: { x: number; y: number; z: number; w: number } | null;
}

export default function ControllerViewer({ pad, controller, orientation }: ControllerViewerProps) {
  const { t, locale } = useTranslation();
  const supports3d = controller?.has3d === true;
  const [view, setView] = useState<ViewMode>('3d');

  // A freshly connected controller opens on 3D if supported, otherwise 2D map
  useEffect(() => {
    setView(supports3d ? '3d' : 'map');
  }, [supports3d, controller?.key]);

  const isXbox = controller?.key === 'xbox-series';
  const labels = isXbox ? BUTTON_LABELS_XBOX : BUTTON_LABELS;

  const pressed = useMemo(
    () => pad.buttons.map((button) => button.pressed || button.value > 0.1),
    [pad.buttons],
  );

  const triggerValues = useMemo<[number, number]>(
    () => [pad.buttons[6]?.value ?? 0, pad.buttons[7]?.value ?? 0],
    [pad.buttons],
  );

  const lx = pad.axes[0] ?? 0;
  const ly = pad.axes[1] ?? 0;
  const rx = pad.axes[2] ?? 0;
  const ry = pad.axes[3] ?? 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-bold text-white">{t('gamepad.viewer.title')}</h2>
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
              controller
                ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                : 'border-white/10 bg-white/5 text-slate-500'
            }`}
          >
            {controller
              ? controller.name
              : pad.connected
                ? t('gamepad.viewer.badgeUnknown')
                : t('gamepad.viewer.badgeNone')}
          </span>
        </div>

        {pad.connected && (
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <ViewButton
              active={view === '3d'}
              disabled={!supports3d}
              onClick={() => setView('3d')}
              icon={<Box className="h-3.5 w-3.5" />}
              label={t('gamepad.viewer.view3d')}
              hint={supports3d ? undefined : t('gamepad.viewer.view3dHint')}
            />
            <ViewButton
              active={view === 'map'}
              onClick={() => setView('map')}
              icon={<MapIcon className="h-3.5 w-3.5" />}
              label={t('gamepad.viewer.viewMap')}
            />
          </div>
        )}
      </header>

      {/* Main 3D / 2D Canvas Stage */}
      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0b0f16]">
        {!pad.connected ? (
          <EmptyState />
        ) : (
          <div className="aspect-[4/3] w-full">
            {view === '3d' ? (
              <ControllerModel3D className="h-full w-full" orientation={orientation} />
            ) : (
              <div className="grid h-full w-full place-items-center p-3">
                <ControllerMap
                  model={controller?.key}
                  pressed={pressed}
                  triggerValues={triggerValues}
                  axes={pad.axes}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          ALL 18 BUTTONS CHIPS (From padview.js pv-btns)
         ────────────────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>{locale === 'fa' ? 'دکمه‌ها' : 'Buttons'}</span>
          <span className="font-mono text-[10px] text-slate-500">
            {pad.connected
              ? `${pressed.filter(Boolean).length} / 18`
              : t('gamepad.viewer.waiting')}
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5" dir="ltr">
          {labels.map((label, idx) => {
            const isPressed = !!pressed[idx];
            return (
              <div
                key={idx}
                className={`flex items-center justify-center py-1.5 px-1 rounded-lg text-xs font-bold font-mono transition-all duration-75 select-none border ${
                  isPressed
                    ? 'bg-violet-600 text-white border-violet-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] scale-105 z-10'
                    : 'bg-[#101422] text-slate-400 border-white/5'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          ANALOG AXES METERS (From padview.js pv-axes: LX, LY, RX, RY)
         ────────────────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-2 border-t border-white/5 pt-3">
        <div className="text-[11px] font-bold text-slate-400">
          <span>{locale === 'fa' ? 'استیک‌ها (آنالوگ)' : 'Analog Axes'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" dir="ltr">
          {[
            { name: 'LX', val: lx },
            { name: 'LY', val: ly },
            { name: 'RX', val: rx },
            { name: 'RY', val: ry },
          ].map((ax) => {
            const percent = Math.round(Math.abs(ax.val) * 100);
            return (
              <div key={ax.name} className="p-2 rounded-xl bg-[#0a0d17] border border-white/10 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold text-slate-300">{ax.name}</span>
                  <span className="text-cyan-400 font-bold">{ax.val.toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex items-center">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-75"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function EmptyState() {
  const { locale } = useTranslation();
  return (
    <div className="grid h-[230px] w-full place-items-center p-6">
      <div className="flex max-w-[320px] flex-col items-center gap-3 text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-slate-500">
          <Unplug className="h-6 w-6" />
          <span className="absolute inset-0 animate-ping rounded-2xl border border-violet-500/20" />
        </span>
        <p className="text-sm font-bold text-white">
          {locale === 'fa' ? 'دسته‌ای وصل نیست' : 'No controller connected'}
        </p>
        <p className="text-xs leading-relaxed text-slate-400">
          {locale === 'fa'
            ? 'دسته را با کابل یا بلوتوث وصل کن و یکی از دکمه‌هایش را فشار بده.'
            : 'Connect a controller via USB or Bluetooth and press any button to start.'}
        </p>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  disabled,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={hint ?? label}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
        active
          ? 'bg-violet-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
          : 'text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}