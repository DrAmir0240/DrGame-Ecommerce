"use client";

import React, { useState, useEffect, useRef } from "react";
import { Gamepad2, Play, RefreshCw, Check, AlertCircle, Sparkles } from "lucide-react";
import { PlayStationGlyph } from "./PlayStationGlyph";
import { useApp } from "@/lib/app";

interface ButtonState {
  pressed: boolean;
  value: number;
}

export const QuickGamepadTester: React.FC = () => {
  const { t, n } = useApp();

  const [connected, setConnected] = useState(false);
  const [padName, setPadName] = useState("");
  const [isPS, setIsPS] = useState(true);
  const [testedParts, setTestedParts] = useState<Set<string>>(new Set());
  const [vibrating, setVibrating] = useState(false);
  const [vibrationSupported, setVibrationSupported] = useState(true);

  // Live values
  const [leftStick, setLeftStick] = useState({ x: 0, y: 0, distance: 0 });
  const [rightStick, setRightStick] = useState({ x: 0, y: 0, distance: 0 });
  const [buttons, setButtons] = useState<ButtonState[]>(new Array(17).fill({ pressed: false, value: 0 }));

  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleConnect = (e: GamepadEvent) => {
      setConnected(true);
      setPadName(e.gamepad.id);
      const isSony = /054c|sony|playstation|dualshock|dualsense/i.test(e.gamepad.id);
      setIsPS(isSony);
    };

    const handleDisconnect = () => {
      setConnected(false);
      setPadName("");
    };

    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);

    // Polling loop
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const gp = gamepads[0];

      if (gp) {
        if (!connected) {
          setConnected(true);
          setPadName(gp.id);
          setIsPS(/054c|sony|playstation|dualshock|dualsense/i.test(gp.id));
        }

        // 1. Process buttons
        const newButtons: ButtonState[] = gp.buttons.map((b) => ({
          pressed: b.pressed,
          value: b.value,
        }));
        setButtons(newButtons);

        // Mark tested buttons
        gp.buttons.forEach((b, idx) => {
          if (b.pressed || b.value > 0.15) {
            setTestedParts((prev) => new Set(prev).add(`btn-${idx}`));
          }
        });

        // 2. Process sticks
        const lx = gp.axes[0] || 0;
        const ly = gp.axes[1] || 0;
        const lDist = Math.sqrt(lx * lx + ly * ly);
        setLeftStick({ x: lx, y: ly, distance: lDist });
        if (lDist > 0.4) {
          setTestedParts((prev) => new Set(prev).add("stick-left"));
        }

        const rx = gp.axes[2] || 0;
        const ry = gp.axes[3] || 0;
        const rDist = Math.sqrt(rx * rx + ry * ry);
        setRightStick({ x: rx, y: ry, distance: rDist });
        if (rDist > 0.4) {
          setTestedParts((prev) => new Set(prev).add("stick-right"));
        }
      }

      animFrameRef.current = requestAnimationFrame(pollGamepad);
    };

    animFrameRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [connected]);

  const testVibration = async () => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp && (gp as any).vibrationActuator) {
      try {
        setVibrating(true);
        await (gp as any).vibrationActuator.playEffect("dual-rumble", {
          startDelay: 0,
          duration: 1000,
          weakMagnitude: 0.8,
          strongMagnitude: 1.0,
        });
        setTimeout(() => setVibrating(false), 1000);
      } catch {
        setVibrationSupported(false);
        setVibrating(false);
      }
    } else {
      setVibrationSupported(false);
    }
  };

  const resetTest = () => {
    setTestedParts(new Set());
  };

  const buttonDefinitions = [
    { id: "btn-0", ps: "cross", label: "✕ / A", btnIdx: 0 },
    { id: "btn-1", ps: "circle", label: "○ / B", btnIdx: 1 },
    { id: "btn-2", ps: "square", label: "□ / X", btnIdx: 2 },
    { id: "btn-3", ps: "triangle", label: "△ / Y", btnIdx: 3 },
    { id: "btn-4", label: "L1 / LB", btnIdx: 4 },
    { id: "btn-5", label: "R1 / RB", btnIdx: 5 },
    { id: "btn-6", label: "L2 / LT", btnIdx: 6, isTrigger: true },
    { id: "btn-7", label: "R2 / RT", btnIdx: 7, isTrigger: true },
    { id: "btn-8", label: "Share / Back", btnIdx: 8 },
    { id: "btn-9", label: "Options / Start", btnIdx: 9 },
    { id: "btn-10", label: "L3 (Click)", btnIdx: 10 },
    { id: "btn-11", label: "R3 (Click)", btnIdx: 11 },
    { id: "btn-12", label: "D-Pad Up", btnIdx: 12 },
    { id: "btn-13", label: "D-Pad Down", btnIdx: 13 },
    { id: "btn-14", label: "D-Pad Left", btnIdx: 14 },
    { id: "btn-15", label: "D-Pad Right", btnIdx: 15 },
    { id: "btn-16", label: "PS / Home", btnIdx: 16 },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Header & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#151722] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              connected ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-500"
            }`}
          >
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm md:text-base text-white">
                {connected ? t("دسته متصل است", "Controller Connected") : t("در انتظار اتصال دسته بازی...", "Waiting for Controller...")}
              </h3>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connected ? "bg-green-500 animate-pulse" : "bg-slate-600"
                }`}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md font-mono">
              {connected
                ? padName
                : t(
                    "دسته را با کابل USB یا بلوتوث وصل کنید و سپس یکی از کلیدها را فشار دهید.",
                    "Connect via USB/Bluetooth and press any button to initialize."
                  )}
            </p>
          </div>
        </div>

        {connected && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={testVibration}
              disabled={vibrating}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
            >
              {vibrating ? t("در حال ویبره...", "Vibrating...") : t("تست ویبره (Rumble)", "Test Vibration")}
            </button>
            <button
              type="button"
              onClick={resetTest}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
              title="ریست چک‌لیست"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Analog Sticks Circle Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Stick */}
        <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <PlayStationGlyph type="l1" size={14} />
              <span>{t("آنالوگ سمت چپ (Left Stick)", "Left Analog Stick")}</span>
            </h4>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                leftStick.distance < 0.08
                  ? "bg-green-500/10 text-green-400"
                  : leftStick.distance < 0.2
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}
            >
              دریفت: {(leftStick.distance * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-36 h-36 rounded-full border-2 border-white/20 bg-[#0f1016] flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-white/10" />
                <div className="h-full w-px bg-white/10 absolute" />
              </div>
              {/* Stick thumb */}
              <div
                className="w-8 h-8 rounded-full bg-orange-500 shadow-md shadow-orange-500/50 border border-white transition-transform duration-75"
                style={{
                  transform: `translate(${leftStick.x * 48}px, ${leftStick.y * 48}px)`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>X: {leftStick.x.toFixed(3)}</span>
            <span>Y: {leftStick.y.toFixed(3)}</span>
          </div>
        </div>

        {/* Right Stick */}
        <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <PlayStationGlyph type="r1" size={14} />
              <span>{t("آنالوگ سمت راست (Right Stick)", "Right Analog Stick")}</span>
            </h4>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                rightStick.distance < 0.08
                  ? "bg-green-500/10 text-green-400"
                  : rightStick.distance < 0.2
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}
            >
              دریفت: {(rightStick.distance * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="relative w-36 h-36 rounded-full border-2 border-white/20 bg-[#0f1016] flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-px bg-white/10" />
                <div className="h-full w-px bg-white/10 absolute" />
              </div>
              {/* Stick thumb */}
              <div
                className="w-8 h-8 rounded-full bg-blue-500 shadow-md shadow-blue-500/50 border border-white transition-transform duration-75"
                style={{
                  transform: `translate(${rightStick.x * 48}px, ${rightStick.y * 48}px)`,
                }}
              />
            </div>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>X: {rightStick.x.toFixed(3)}</span>
            <span>Y: {rightStick.y.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Button Checklist Matrix */}
      <div className="rounded-2xl border border-white/10 bg-[#151722] p-5 shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-white">
          {t("چک‌لیست سلامت کلیدها (Buttons Checklist):", "Button Status Grid:")}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {buttonDefinitions.map((b) => {
            const btnState = buttons[b.btnIdx] || { pressed: false, value: 0 };
            const isTested = testedParts.has(b.id);

            return (
              <div
                key={b.id}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  btnState.pressed
                    ? "bg-orange-600 border-orange-500 text-white shadow-lg scale-105"
                    : isTested
                    ? "bg-green-500/10 border-green-500/40 text-green-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-1">
                  {b.ps ? <PlayStationGlyph type={b.ps as any} size={16} /> : null}
                  <span className="font-extrabold text-xs font-mono">{b.label}</span>
                </div>

                {b.isTrigger && (
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${btnState.value * 100}%` }}
                    />
                  </div>
                )}

                <span className="text-[9px] font-bold">
                  {btnState.pressed ? "فشرده شده" : isTested ? "سالم ✓" : "تست‌نشده"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickGamepadTester;
