'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Activity, Vibrate, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface GamepadState {
  connected: boolean;
  id: string;
  buttons: { pressed: boolean; value: number }[];
  axes: number[];
}

export default function GamepadVisualizer() {
  const [gamepad, setGamepad] = useState<GamepadState>({
    connected: false,
    id: '',
    buttons: [],
    axes: [0, 0, 0, 0],
  });

  const [vibrating, setVibrating] = useState(false);
  const animRef = useRef<number>();

  useEffect(() => {
    const updateGamepad = () => {
      const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads ? gamepads[0] : null;

      if (gp) {
        setGamepad({
          connected: true,
          id: gp.id,
          buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value })),
          axes: Array.from(gp.axes),
        });
      } else {
        setGamepad((prev) => (prev.connected ? { connected: false, id: '', buttons: [], axes: [0, 0, 0, 0] } : prev));
      }

      animRef.current = requestAnimationFrame(updateGamepad);
    };

    animRef.current = requestAnimationFrame(updateGamepad);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const triggerVibration = async () => {
    const gamepads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads ? gamepads[0] : null;

    if (gp && (gp as any).vibrationActuator) {
      setVibrating(true);
      try {
        await (gp as any).vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: 1000,
          weakMagnitude: 0.8,
          strongMagnitude: 1.0,
        });
      } catch (e) {
        console.warn('Vibration effect not permitted or failed:', e);
      } finally {
        setTimeout(() => setVibrating(false), 1000);
      }
    } else {
      alert('ویبره توسط مرورگر یا این کنترلر پشتیبانی نمی‌شود.');
    }
  };

  const b = gamepad.buttons;
  const isPressed = (idx: number) => b[idx]?.pressed || false;
  const btnValue = (idx: number) => b[idx]?.value || 0;

  // Axes calculation
  const lx = gamepad.axes[0] || 0;
  const ly = gamepad.axes[1] || 0;
  const rx = gamepad.axes[2] || 0;
  const ry = gamepad.axes[3] || 0;

  // Drift error percentage calculation (distance from exact (0,0) center when unheld)
  const leftDrift = Math.min(100, Math.round(Math.hypot(lx, ly) * 100));
  const rightDrift = Math.min(100, Math.round(Math.hypot(rx, ry) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Connection Header Banner */}
      <div className="rounded-3xl glass-card border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              gamepad.connected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                : 'bg-white/5 text-text-muted border border-white/10'
            }`}
          >
            <Gamepad2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              {gamepad.connected ? 'کنترلر متصل و آماده تست' : 'در انتظار اتصال دسته بازی...'}
            </h2>
            <p className="text-xs text-text-muted font-mono mt-0.5">
              {gamepad.connected ? gamepad.id : 'دسته PS4 / PS5 یا Xbox را با کابل USB یا بلوتوث وصل کرده و یکی از کلیدها را فشار دهید.'}
            </p>
          </div>
        </div>

        {gamepad.connected && (
          <button
            onClick={triggerVibration}
            disabled={vibrating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cosmic-purple hover:bg-cosmic-purple/90 text-white text-xs font-bold transition-all shadow-neon-purple disabled:opacity-50"
          >
            <Vibrate className={`w-4 h-4 ${vibrating ? 'animate-spin' : ''}`} />
            <span>{vibrating ? 'در حال لرزش...' : 'تست ویبره دسته'}</span>
          </button>
        )}
      </div>

      {/* Main Visualizer Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: D-Pad & Triggers L1/L2 */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cosmic-purple" />
            <span>بخش سمت چپ (D-Pad و L1 / L2)</span>
          </h3>

          {/* L1 & L2 Triggers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">کلید L1 (Bumper):</span>
              <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold ${isPressed(4) ? 'bg-emerald-500 text-black' : 'bg-white/5 text-text-muted'}`}>
                {isPressed(4) ? 'PRESSED' : 'RELEASED'}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">تریگر L2 (آنالوگ):</span>
                <span className="font-mono text-white font-bold">{Math.round(btnValue(6) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-cosmic-purple transition-all"
                  style={{ width: `${btnValue(6) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* D-Pad Matrix */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-xs text-text-muted block mb-3 font-medium">کلیدهای ۴ جهته (D-Pad):</span>
            <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto text-center">
              <div />
              <div className={`p-3 rounded-xl border text-xs font-bold transition-all ${isPressed(12) ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white'}`}>
                ▲
              </div>
              <div />

              <div className={`p-3 rounded-xl border text-xs font-bold transition-all ${isPressed(14) ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white'}`}>
                ◀
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-text-muted flex items-center justify-center">
                D-Pad
              </div>
              <div className={`p-3 rounded-xl border text-xs font-bold transition-all ${isPressed(15) ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white'}`}>
                ▶
              </div>

              <div />
              <div className={`p-3 rounded-xl border text-xs font-bold transition-all ${isPressed(13) ? 'bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-white'}`}>
                ▼
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* Center Panel: Analog Sticks & Drift Error */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>شوکرها و تست سلامت دریفت (Stick Drift)</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Left Stick Circle */}
            <div className="space-y-2 text-center">
              <span className="text-xs text-text-muted font-bold block">استیک چپ (L3)</span>
              <div className="relative w-28 h-28 mx-auto rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10" />
                {/* Stick thumb pointer */}
                <div
                  className={`w-8 h-8 rounded-full border-2 transition-transform duration-75 flex items-center justify-center text-[10px] font-bold ${
                    isPressed(10)
                      ? 'bg-amber-400 border-amber-300 text-black scale-95 shadow-md shadow-amber-400/30'
                      : 'bg-cosmic-purple border-nebula-violet text-white shadow-neon-purple'
                  }`}
                  style={{
                    transform: `translate(${lx * 36}px, ${ly * 36}px)`,
                  }}
                >
                  L3
                </div>
              </div>
              <div className="text-[11px] font-mono text-text-muted">
                X: {lx.toFixed(2)} | Y: {ly.toFixed(2)}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold ${leftDrift > 15 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                دریفت: {leftDrift}%
              </span>
            </div>

            {/* Right Stick Circle */}
            <div className="space-y-2 text-center">
              <span className="text-xs text-text-muted font-bold block">استیک راست (R3)</span>
              <div className="relative w-28 h-28 mx-auto rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10" />
                {/* Stick thumb pointer */}
                <div
                  className={`w-8 h-8 rounded-full border-2 transition-transform duration-75 flex items-center justify-center text-[10px] font-bold ${
                    isPressed(11)
                      ? 'bg-amber-400 border-amber-300 text-black scale-95 shadow-md shadow-amber-400/30'
                      : 'bg-cyan-500 border-cyan-300 text-black shadow-lg shadow-cyan-500/20'
                  }`}
                  style={{
                    transform: `translate(${rx * 36}px, ${ry * 36}px)`,
                  }}
                >
                  R3
                </div>
              </div>
              <div className="text-[11px] font-mono text-text-muted">
                X: {rx.toFixed(2)} | Y: {ry.toFixed(2)}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold ${rightDrift > 15 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                دریفت: {rightDrift}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-text-muted text-center">
            {leftDrift < 10 && rightDrift < 10
              ? '✅ سلامت شوکرها عالی است (بدون دریفت).'
              : '⚠️ دریفت جزئی مشاهده شد؛ تمیزکاری سنسور توصیه می‌شود.'}
          </div>
        </div>

        {/* Right Panel: Action Buttons (Cross, Circle, Square, Triangle, R1/R2) */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>بخش سمت راست (کلیدهای اصلی و R1 / R2)</span>
          </h3>

          {/* R1 & R2 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">کلید R1 (Bumper):</span>
              <span className={`px-2.5 py-0.5 rounded-md font-mono font-bold ${isPressed(5) ? 'bg-emerald-500 text-black' : 'bg-white/5 text-text-muted'}`}>
                {isPressed(5) ? 'PRESSED' : 'RELEASED'}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted">تریگر R2 (آنالوگ):</span>
                <span className="font-mono text-white font-bold">{Math.round(btnValue(7) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${btnValue(7) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* PlayStation Action Buttons */}
          <div className="pt-4 border-t border-white/5">
            <span className="text-xs text-text-muted block mb-3 font-medium">کلیدهای عملیاتی (Action Buttons):</span>
            <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto text-center font-mono">
              <div />
              {/* Triangle (Button 3) */}
              <div className={`p-3 rounded-xl border text-sm font-black transition-all ${isPressed(3) ? 'bg-emerald-500 border-emerald-400 text-black scale-105 shadow-lg' : 'bg-white/5 border-white/10 text-emerald-400'}`}>
                ▲
              </div>
              <div />

              {/* Square (Button 2) */}
              <div className={`p-3 rounded-xl border text-sm font-black transition-all ${isPressed(2) ? 'bg-pink-500 border-pink-400 text-white scale-105 shadow-lg' : 'bg-white/5 border-white/10 text-pink-400'}`}>
                ■
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-text-muted flex items-center justify-center">
                Sony
              </div>
              {/* Circle (Button 1) */}
              <div className={`p-3 rounded-xl border text-sm font-black transition-all ${isPressed(1) ? 'bg-red-500 border-red-400 text-white scale-105 shadow-lg' : 'bg-white/5 border-white/10 text-red-400'}`}>
                ●
              </div>

              <div />
              {/* Cross (Button 0) */}
              <div className={`p-3 rounded-xl border text-sm font-black transition-all ${isPressed(0) ? 'bg-cyan-400 border-cyan-300 text-black scale-105 shadow-lg' : 'bg-white/5 border-white/10 text-cyan-400'}`}>
                ✖
              </div>
              <div />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
