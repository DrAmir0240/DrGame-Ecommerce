'use client';

/**
 * ControllerViewer — the "which controller is plugged in + what am I pressing"
 * panel of the tester.
 *
 * The shell is only rendered once a controller is actually connected: the 3D
 * view for the DualSense (the only controller with a glb model) and the 2D map
 * for everything else — DualSense Edge, DualShock 4 and Xbox.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Box, Gamepad2, Map as MapIcon, Unplug } from 'lucide-react';
import { useTranslation } from '@/i18n';
import ControllerMap from './ControllerMap';
import ControllerModel3D from './ControllerModel3D';
import { BUTTON_LABELS, type ControllerInfo, type PadSnapshot } from './useGamepad';

type ViewMode = '3d' | 'map';

export interface ControllerViewerProps {
  pad: PadSnapshot;
  controller: ControllerInfo | null;
}

export default function ControllerViewer({ pad, controller }: ControllerViewerProps) {
  const { t } = useTranslation();
  const supports3d = controller?.has3d === true;
  const [view, setView] = useState<ViewMode>('3d');

  // A freshly connected controller always opens on the best view it supports.
  useEffect(() => {
    setView(supports3d ? '3d' : 'map');
  }, [supports3d, controller?.key]);

  const pressed = useMemo(() => pad.buttons.map((button) => button.pressed), [pad.buttons]);
  const activeButtons = useMemo(
    () => BUTTON_LABELS.filter((_, index) => pressed[index] === true),
    [pressed],
  );
  const triggerValues = useMemo<[number, number]>(
    () => [pad.buttons[6]?.value ?? 0, pad.buttons[7]?.value ?? 0],
    [pad.buttons],
  );

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

      <div className="relative overflow-hidden rounded-xl border border-white/5 bg-[#0b0f16]">
        {!pad.connected ? (
          <EmptyState />
        ) : (
          <div className="aspect-[4/3] w-full">
            {view === '3d' ? (
              <ControllerModel3D className="h-full w-full" />
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

      <div className="mt-3 flex min-h-[26px] flex-wrap items-center gap-1.5">
        {!pad.connected ? (
          <span className="text-[10px] text-slate-500">{t('gamepad.viewer.waiting')}</span>
        ) : activeButtons.length > 0 ? (
          activeButtons.map((label) => (
            <span
              key={label}
              className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-200 ring-1 ring-inset ring-violet-500/30"
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-500">{t('gamepad.viewer.noButtons')}</span>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="grid h-[230px] w-full place-items-center p-6">
      <div className="flex max-w-[280px] flex-col items-center gap-3 text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-slate-500">
          <Unplug className="h-6 w-6" />
          <span className="absolute inset-0 animate-ping rounded-2xl border border-violet-500/20" />
        </span>
        <p className="text-xs font-bold text-slate-300">{t('gamepad.viewer.emptyTitle')}</p>
        <p className="text-[10px] leading-relaxed text-slate-500">{t('gamepad.viewer.emptyHint')}</p>
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
          ? 'bg-violet-600 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
