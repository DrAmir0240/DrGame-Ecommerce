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
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useGamepad, type DriftSample } from '@/components/gamepad/useGamepad';
import ControllerViewer from '@/components/gamepad/ControllerViewer';
import StickPad from '@/components/gamepad/StickPad';
import MicTestPanel, { type LogLevel } from '@/components/gamepad/MicTestPanel';
import SystemLog, { type LogEntry } from '@/components/gamepad/SystemLog';
import GamepadStepWizard from '@/components/gamepad/GamepadStepWizard';
import { useWebHIDController } from '@/components/gamepad/useWebHIDController';

export default function GamepadPage() {
  const { t, locale, dir } = useTranslation();
  const { pad, controller, rumble, measureDrift } = useGamepad();
  const {
    isSupported: isWebHIDSupported,
    isConnected: isWebHIDConnected,
    orientation,
    gyroRates,
    motionEnergy,
    ps5Info,
    ps4Info,
    connectWebHID,
    resetOrientation,
  } = useWebHIDController();

  const [mode, setMode] = useState<'wizard' | 'dashboard'>('wizard');
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

  // log transitions once
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
    if (!pad.connected) return false;
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
    return ok;
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
    <div className="min-h-screen w-full bg-oled font-vazir pb-12 select-none" dir={dir}>
      {/* ─────────────────────────────────────────────────────────────────
          TOP BAR (Navigation & Status)
         ───────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex justify-center p-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/75 px-3 py-2 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            <span>{locale === 'fa' ? 'بازگشت به سایت' : 'Back to Store'}</span>
          </Link>

          <span className="h-4 w-px bg-white/15" />

          {/* Mode Switcher Tabs */}
          <div className="flex items-center rounded-xl bg-white/5 p-0.5 border border-white/10">
            <button
              type="button"
              onClick={() => setMode('wizard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                mode === 'wizard'
                  ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{locale === 'fa' ? 'تست مرحله‌به‌مرحله' : 'Guided Test Wizard'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                mode === 'dashboard'
                  ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{locale === 'fa' ? 'داشبورد آزاد' : 'Free Dashboard'}</span>
            </button>
          </div>

          <span className="h-4 w-px bg-white/15" />

          {/* Connection Status Pill */}
          <span
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
              pad.connected
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                pad.connected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-slate-500'
              }`}
            />
            {pad.connected ? t('gamepad.page.connected') : t('gamepad.page.waiting')}
          </span>

          {/* WebHID Gyroscope Status Pill */}
          {isWebHIDSupported && (
            <button
              type="button"
              onClick={connectWebHID}
              className={`hidden sm:flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                isWebHIDConnected
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
              }`}
              title="اتصال سنسور ژیروسکوپ سخت‌افزاری WebHID"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isWebHIDConnected ? 'ژیروسکوپ فعال' : 'اتصال سنسور ژیرو'}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
              isFullscreen
                ? t('gamepad.page.exitFullscreen')
                : t('gamepad.page.enterFullscreen')
            }
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            title={isFullscreen ? t('gamepad.page.exitFullscreen') : t('gamepad.page.enterFullscreen')}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          CONTENT AREA: EITHER GUIDED STEP WIZARD OR FREE DASHBOARD
         ───────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-2">
        {mode === 'wizard' ? (
          <GamepadStepWizard
            pad={pad}
            controller={controller}
            orientation={orientation}
            gyroRates={gyroRates}
            motionEnergy={motionEnergy}
            ps5Info={ps5Info}
            ps4Info={ps4Info}
            isWebHIDConnected={isWebHIDConnected}
            onConnectWebHID={connectWebHID}
            onRumble={handleRumble}
            onResetOrientation={resetOrientation}
            onSwitchToDashboard={() => setMode('dashboard')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {/* ──────────────── LEFT COLUMN ──────────────── */}
            <div className="space-y-4">
              {/* Connection & Hardware Status Card */}
              <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                        pad.connected
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                          : 'border-white/10 bg-white/5 text-slate-500'
                      }`}
                    >
                      <Gamepad2 className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-black text-white">
                        {pad.connected
                          ? controller
                            ? controller.name
                            : t('gamepad.connection.titleConnected')
                          : t('gamepad.connection.titleDisconnected')}
                      </p>
                      <p className="truncate font-mono text-[11px] text-slate-400 mt-0.5" dir="ltr">
                        {pad.connected ? pad.id : t('gamepad.connection.hintPressButton')}
                      </p>
                    </div>
                  </div>

                  {/* Hardware Quick Actions */}
                  <div className="flex items-center gap-2">
                    {pad.connected && (
                      <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 font-medium">
                        <connectionType.Icon className="h-3.5 w-3.5 text-cyan-400" />
                        {connectionType.label}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleRumble}
                      disabled={!pad.connected || rumbleState === 'sending'}
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      <Vibrate className={`h-4 w-4 ${rumbleState === 'sending' ? 'animate-spin' : ''}`} />
                      {rumbleState === 'sending'
                        ? t('gamepad.connection.rumbleBusy')
                        : t('gamepad.connection.rumbleTest')}
                    </button>
                    <button
                      type="button"
                      onClick={handleMeasureDrift}
                      disabled={!pad.connected || measuring}
                      className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      <Gauge className="h-4 w-4 text-cyan-400" />
                      {measuring
                        ? t('gamepad.connection.driftBusy')
                        : t('gamepad.connection.driftMeasure')}
                    </button>
                  </div>
                </div>

                {!pad.connected && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-400">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    {t('gamepad.connection.help')}
                  </p>
                )}
              </section>

              {/* Controller Display: 3D DualSense Shell + 2D Vector Map + 18 Button Chips + Analog Axes */}
              <ControllerViewer
                pad={pad}
                controller={controller}
                orientation={isWebHIDConnected ? orientation : null}
              />

              {/* Trigger Pressure & Bumpers (L1, L2, R1, R2) */}
              <section className="grid grid-cols-2 gap-4">
                {[
                  { key: 'L2', idx: 6, bump: 4, bumpName: 'L1', color: 'bg-violet-500' },
                  { key: 'R2', idx: 7, bump: 5, bumpName: 'R1', color: 'bg-cyan-400' },
                ].map((tr) => {
                  const v = btn(tr.idx).value;
                  const isBumpPressed = btn(tr.bump).pressed;
                  return (
                    <div key={tr.key} className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 shadow-lg">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{tr.key}</span>
                        <span className="font-mono font-bold text-cyan-300" dir="ltr">
                          {Math.round(v * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full ${tr.color} transition-all duration-75`}
                          style={{ width: `${v * 100}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold">{tr.bumpName}</span>
                        <span
                          className={`rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold transition-all ${
                            isBumpPressed
                              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]'
                              : 'bg-white/5 text-slate-500 border border-white/5'
                          }`}
                        >
                          {isBumpPressed
                            ? t('gamepad.triggers.pressed')
                            : t('gamepad.triggers.released')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>

            {/* ──────────────── RIGHT COLUMN ──────────────── */}
            <div className="space-y-4">
              {/* Dual Stick 2D Visualizer & Drift Analysis */}
              <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5 shadow-xl">
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

                <p className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[11px] leading-relaxed text-slate-400">
                  {!drift
                    ? t('gamepad.sticks.hintIdle')
                    : Math.max(drift.leftMax, drift.rightMax) * 100 > 12
                      ? t('gamepad.sticks.hintHigh')
                      : t('gamepad.sticks.hintHealthy')}
                </p>
              </section>

              {/* Built-in Microphone & Speaker Audio Tester */}
              <MicTestPanel onLog={pushLog} />

              {/* System Hardware Event Log */}
              <SystemLog
                logs={logs}
                startedAt={startedAt.current}
                onClear={() => setLogs([])}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
