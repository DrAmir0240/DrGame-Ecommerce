'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Maximize2,
  Minimize2,
  Gamepad2,
  Vibrate,
  Activity,
  Gauge,
  Wifi,
  Cable,
  Info,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useGamepad, type DriftSample } from '@/components/gamepad/useGamepad';
import ControllerViewer from '@/components/gamepad/ControllerViewer';
import StickPad from '@/components/gamepad/StickPad';
import MicTestPanel, { type LogLevel } from '@/components/gamepad/MicTestPanel';
import SystemLog, { type LogEntry } from '@/components/gamepad/SystemLog';

export default function GamepadPage() {
  const { t } = useTranslation();
  const { pad, controller, rumble, measureDrift } = useGamepad();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [drift, setDrift] = useState<DriftSample | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [rumbleState, setRumbleState] = useState<'idle' | 'sending' | 'unsupported'>('idle');

  const startedAt = useRef(Date.now());
  const logId = useRef(0);
  const wasConnected = useRef(false);

  const pushLog = useCallback((level: LogLevel, text: string) => {
    logId.current += 1;
    setLogs((prev) => [
      ...prev.slice(-120),
      { id: logId.current, at: Date.now(), level, text },
    ]);
  }, []);

  // connection / disconnection events
  useEffect(() => {
    const onConnect = (e: Event) => {
      const gp = (e as GamepadEvent).gamepad;
      pushLog('ok', t('gamepad.events.connected', { id: gp.id }));
    };
    const onDisconnect = (e: Event) => {
      const gp = (e as GamepadEvent).gamepad;
      pushLog('warn', t('gamepad.events.disconnected', { id: gp.id }));
    };
    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, [pushLog, t]);

  // log transitions once, not on every poll
  useEffect(() => {
    if (pad.connected && !wasConnected.current) {
      wasConnected.current = true;
      pushLog('info', t('gamepad.events.deviceId', { id: pad.id || t('gamepad.events.unknown') }));
    } else if (!pad.connected && wasConnected.current) {
      wasConnected.current = false;
    }
  }, [pad.connected, pad.id, pushLog, t]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* ignored */
    }
  }, []);

  const handleRumble = useCallback(async () => {
    if (!pad.connected) return;
    setRumbleState('sending');
    const ok = await rumble(700, 1, 0.7);
    if (!ok) {
      setRumbleState('unsupported');
      pushLog('error', t('gamepad.events.rumbleUnsupported'));
    } else {
      setRumbleState('idle');
      pushLog('ok', t('gamepad.events.rumbleSent'));
    }
    window.setTimeout(() => setRumbleState('idle'), 900);
  }, [pad.connected, rumble, pushLog, t]);

  const handleMeasureDrift = useCallback(async () => {
    if (!pad.connected || measuring) return;
    setMeasuring(true);
    pushLog('info', t('gamepad.events.driftStart'));
    const sample = await measureDrift(2500);
    setDrift(sample);
    setMeasuring(false);
    const worst = Math.max(sample.leftMax, sample.rightMax) * 100;
    const percent = worst.toFixed(0);
    if (worst > 12) pushLog('error', t('gamepad.events.driftHigh', { percent }));
    else if (worst > 6) pushLog('warn', t('gamepad.events.driftSlight', { percent }));
    else pushLog('ok', t('gamepad.events.driftHealthy', { percent }));
  }, [pad.connected, measuring, measureDrift, pushLog, t]);

  const lx = pad.axes[0] ?? 0;
  const ly = pad.axes[1] ?? 0;
  const rx = pad.axes[2] ?? 0;
  const ry = pad.axes[3] ?? 0;

  const liveDriftL = drift ? drift.leftMax : Math.hypot(lx, ly);
  const liveDriftR = drift ? drift.rightMax : Math.hypot(rx, ry);

  const btn = (i: number) => pad.buttons[i] ?? { pressed: false, value: 0 };
  const connectionType = /bluetooth|wireless|bt/i.test(pad.id)
    ? { label: t('gamepad.connection.wireless'), Icon: Wifi }
    : { label: t('gamepad.connection.wired'), Icon: Cable };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-oled">
      {/* floating chrome */}
      <div className="pointer-events-none sticky top-0 z-30 flex justify-center p-3">
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-black/60 px-1.5 py-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <Link
            href="/tools"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('tools.backToTools')}</span>
          </Link>

          <span className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-1.5 px-1.5">
            <Gamepad2 className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[11px] font-bold text-white">{t('gamepad.page.title')}</span>
          </div>

          <span className="h-4 w-px bg-white/10" />

          <span
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${
              pad.connected
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                pad.connected ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            {pad.connected ? t('gamepad.page.connected') : t('gamepad.page.waiting')}
          </span>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? t('gamepad.page.exitFullscreen')
                : t('gamepad.page.enterFullscreen')
            }
            className="grid h-7 w-7 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 pb-8 pt-1 sm:px-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ---------------- left ---------------- */}
        <div className="space-y-4">
          {/* connection */}
          <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl border ${
                    pad.connected
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  <Gamepad2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    {pad.connected
                      ? t('gamepad.connection.titleConnected')
                      : t('gamepad.connection.titleDisconnected')}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate-500" dir="auto">
                    {pad.connected ? pad.id : t('gamepad.connection.hintPressButton')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pad.connected && (
                  <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400">
                    <connectionType.Icon className="h-3 w-3" />
                    {connectionType.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRumble}
                  disabled={!pad.connected || rumbleState === 'sending'}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                >
                  <Vibrate className={`h-3.5 w-3.5 ${rumbleState === 'sending' ? 'animate-spin' : ''}`} />
                  {rumbleState === 'sending'
                    ? t('gamepad.connection.rumbleBusy')
                    : t('gamepad.connection.rumbleTest')}
                </button>
                <button
                  type="button"
                  onClick={handleMeasureDrift}
                  disabled={!pad.connected || measuring}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  <Gauge className="h-3.5 w-3.5" />
                  {measuring
                    ? t('gamepad.connection.driftBusy')
                    : t('gamepad.connection.driftMeasure')}
                </button>
              </div>
            </div>

            {!pad.connected && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                {t('gamepad.connection.help')}
              </p>
            )}
          </section>

          {/* controller display: 3D shell + live 2D map */}
          <ControllerViewer pad={pad} controller={controller} />

          {/* triggers */}
          <section className="grid grid-cols-2 gap-4">
            {[
              { key: 'L2', idx: 6, bump: 4, color: 'bg-violet-500' },
              { key: 'R2', idx: 7, bump: 5, color: 'bg-cyan-400' },
            ].map((tr) => {
              const v = btn(tr.idx).value;
              return (
                <div key={tr.key} className="rounded-2xl border border-white/10 bg-[#0d121f] p-4">
                  <div className="mb-2 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white">{tr.key}</span>
                    <span className="font-mono text-slate-400" dir="ltr">
                      {Math.round(v * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full ${tr.color}`}
                      style={{ width: `${v * 100}%`, transition: 'width 60ms linear' }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{tr.key === 'L2' ? 'L1' : 'R1'}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono ${
                        btn(tr.bump).pressed
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {btn(tr.bump).pressed
                        ? t('gamepad.triggers.pressed')
                        : t('gamepad.triggers.released')}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        {/* ---------------- right ---------------- */}
        <div className="space-y-4">
          {/* sticks */}
          <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">{t('gamepad.sticks.title')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StickPad
                label={t('gamepad.sticks.left')}
                x={lx}
                y={ly}
                pressed={btn(10).pressed}
                drift={liveDriftL}
                measuring={measuring}
                color="violet"
              />
              <StickPad
                label={t('gamepad.sticks.right')}
                x={rx}
                y={ry}
                pressed={btn(11).pressed}
                drift={liveDriftR}
                measuring={measuring}
                color="cyan"
              />
            </div>

            <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[10px] leading-relaxed text-slate-400">
              {!drift
                ? t('gamepad.sticks.hintIdle')
                : Math.max(drift.leftMax, drift.rightMax) * 100 > 12
                  ? t('gamepad.sticks.hintHigh')
                  : t('gamepad.sticks.hintHealthy')}
            </p>
          </section>

          <MicTestPanel onLog={pushLog} />

          <SystemLog
            logs={logs}
            startedAt={startedAt.current}
            onClear={() => setLogs([])}
          />
        </div>
      </div>
    </div>
  );
}
