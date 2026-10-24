"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Vibrate, Cpu, CheckCircle2, AlertTriangle, Gamepad2 } from "lucide-react";
import { Page } from "@/components/Shell";
import { useApp } from "@/lib/app";

interface GamepadInfo {
  index: number;
  id: string;
  buttonsCount: number;
  axesCount: number;
}

const PARTS_LIST = [
  { id: "cross", label: "✕ ضربدر (Cross)" },
  { id: "circle", label: "○ دایره (Circle)" },
  { id: "square", label: "□ مربع (Square)" },
  { id: "triangle", label: "△ مثلث (Triangle)" },
  { id: "l1", label: "L1 بامپر چپ" },
  { id: "r1", label: "R1 بامپر راست" },
  { id: "l2", label: "L2 ماشه چپ" },
  { id: "r2", label: "R2 ماشه راست" },
  { id: "dpad_up", label: "جهت بالا (D-Pad Up)" },
  { id: "dpad_down", label: "جهت پایین (D-Pad Down)" },
  { id: "dpad_left", label: "جهت چپ (D-Pad Left)" },
  { id: "dpad_right", label: "جهت راست (D-Pad Right)" },
  { id: "share", label: "Share / Create" },
  { id: "options", label: "Options / Menu" },
  { id: "ps", label: "دکمه PS Home" },
  { id: "l3", label: "L3 کلیک شوک چپ" },
  { id: "r3", label: "R3 کلیک شوک راست" },
];

export default function GamepadTesterPage() {
  const { t } = useApp();
  const [activePad, setActivePad] = useState<Gamepad | null>(null);
  const [testedParts, setTestedParts] = useState<Set<string>>(new Set());
  const [vibrating, setVibrating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Live Controller Sensor States
  const [leftStick, setLeftStick] = useState({ x: 0, y: 0, drift: false });
  const [rightStick, setRightStick] = useState({ x: 0, y: 0, drift: false });
  const [l2Pressure, setL2Pressure] = useState(0);
  const [r2Pressure, setR2Pressure] = useState(0);

  const requestRef = useRef<number>();

  useEffect(() => {
    const scanGamepads = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let found: Gamepad | null = null;

      for (let i = 0; i < pads.length; i++) {
        if (pads[i]) {
          found = pads[i];
          break;
        }
      }

      setActivePad(found);

      if (found) {
        // Read analog triggers (indices 6 & 7)
        const l2 = found.buttons[6]?.value || (found.buttons[6]?.pressed ? 1 : 0);
        const r2 = found.buttons[7]?.value || (found.buttons[7]?.pressed ? 1 : 0);
        setL2Pressure(l2);
        setR2Pressure(r2);

        // Read sticks axes
        const lx = found.axes[0] || 0;
        const ly = found.axes[1] || 0;
        const rx = found.axes[2] || 0;
        const ry = found.axes[3] || 0;

        setLeftStick({
          x: parseFloat(lx.toFixed(2)),
          y: parseFloat(ly.toFixed(2)),
          drift: Math.abs(lx) > 0.15 || Math.abs(ly) > 0.15,
        });

        setRightStick({
          x: parseFloat(rx.toFixed(2)),
          y: parseFloat(ry.toFixed(2)),
          drift: Math.abs(rx) > 0.15 || Math.abs(ry) > 0.15,
        });

        // Track tested parts
        const mark = (partId: string) => {
          setTestedParts((prev) => {
            if (prev.has(partId)) return prev;
            const next = new Set(prev);
            next.add(partId);
            return next;
          });
        };

        if (found.buttons[0]?.pressed) mark("cross");
        if (found.buttons[1]?.pressed) mark("circle");
        if (found.buttons[2]?.pressed) mark("square");
        if (found.buttons[3]?.pressed) mark("triangle");
        if (found.buttons[4]?.pressed) mark("l1");
        if (found.buttons[5]?.pressed) mark("r1");
        if (l2 > 0.2) mark("l2");
        if (r2 > 0.2) mark("r2");
        if (found.buttons[8]?.pressed) mark("share");
        if (found.buttons[9]?.pressed) mark("options");
        if (found.buttons[10]?.pressed) mark("l3");
        if (found.buttons[11]?.pressed) mark("r3");
        if (found.buttons[12]?.pressed) mark("dpad_up");
        if (found.buttons[13]?.pressed) mark("dpad_down");
        if (found.buttons[14]?.pressed) mark("dpad_left");
        if (found.buttons[15]?.pressed) mark("dpad_right");
        if (found.buttons[16]?.pressed) mark("ps");
      }

      requestRef.current = requestAnimationFrame(scanGamepads);
    };

    requestRef.current = requestAnimationFrame(scanGamepads);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleVibrate = () => {
    if (activePad && (activePad as any).vibrationActuator) {
      setVibrating(true);
      (activePad as any).vibrationActuator.playEffect("dual-rumble", {
        startDelay: 0,
        duration: 1000,
        weakMagnitude: 1.0,
        strongMagnitude: 1.0,
      }).finally(() => setVibrating(false));
    }
  };

  const handleReset = () => {
    setTestedParts(new Set());
  };

  return (
    <Page>
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header matching source */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <Link href="/" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t("بازگشت به صفحه اصلی", "Back to Home")}</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              <span>{t("تست و عیب‌یابی دسته بازی", "Gamepad Tester")}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                PlayStation DualSense & DualShock
              </span>
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {t(
            "دسته را با کابل USB یا بلوتوث وصل کنید و دکمه‌های آن را فشار دهید. هر بخشی که تست شود به رنگ سبز درمی‌آید تا از سلامت کامل آن اطمینان حاصل کنید.",
            "Connect your controller via USB or Bluetooth, then press buttons and move analog sticks. Tested parts highlight in green."
          )}
        </p>

        {/* Empty State when no controller is detected */}
        {!activePad && (
          <div className="rounded-3xl border border-white/10 bg-[#101116] p-12 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🎮
            </div>
            <h2 className="text-lg font-bold text-white">
              {t("دسته‌ات را وصل کن", "Connect your controller")}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {t(
                "با کابل USB وصل کن یا با بلوتوث جفت کن و بعد یک دکمه‌اش را بزن. مرورگر فقط بعد از زدن یک دکمه دسته را نشان می‌دهد.",
                "Plug it in with a USB cable or pair with Bluetooth, then press any button on it. Browsers only show a controller after a button is pressed."
              )}
            </p>
          </div>
        )}

        {/* Connected Controller Interactive Visualizer */}
        {activePad && (
          <div className="space-y-6">
            {/* Top Info Bar */}
            <div className="p-4 rounded-2xl bg-[#101116] border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                  <span>{activePad.id}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {activePad.buttons.length} دکمه · {activePad.axes.length} محور آنالوگ · شاخص #{activePad.index}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVibrate}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 active:scale-95"
                >
                  <Vibrate className="w-4 h-4" />
                  <span>{vibrating ? "در حال لرزش..." : "تست لرزش"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>شروع دوباره</span>
                </button>
              </div>
            </div>

            {/* SVG Interactive Controller Container */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#101116] border border-white/10 shadow-2xl flex flex-col items-center">
              <svg viewBox="0 0 640 380" className="w-full max-w-[620px] filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                {/* Triggers (L2 / R2) with live proportional pressure fill */}
                <g id="p-lt">
                  <rect x="120" y="14" width="96" height="20" rx="8" fill="#181920" stroke="rgba(255,255,255,0.1)" />
                  <rect x="120" y="14" width={96 * l2Pressure} height="20" rx="8" fill="#7c3aed" />
                  <text x="168" y="28" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="bold">
                    L2 ({Math.round(l2Pressure * 100)}%)
                  </text>
                </g>
                <g id="p-rt">
                  <rect x="424" y="14" width="96" height="20" rx="8" fill="#181920" stroke="rgba(255,255,255,0.1)" />
                  <rect x="424" y="14" width={96 * r2Pressure} height="20" rx="8" fill="#7c3aed" />
                  <text x="472" y="28" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="bold">
                    R2 ({Math.round(r2Pressure * 100)}%)
                  </text>
                </g>

                {/* Bumpers L1 / R1 */}
                <rect
                  x="110"
                  y="44"
                  width="116"
                  height="22"
                  rx="10"
                  fill={activePad.buttons[4]?.pressed ? "#10b981" : "#20212a"}
                  stroke="rgba(255,255,255,0.1)"
                />
                <text x="168" y="59" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="bold">L1</text>
                <rect
                  x="414"
                  y="44"
                  width="116"
                  height="22"
                  rx="10"
                  fill={activePad.buttons[5]?.pressed ? "#10b981" : "#20212a"}
                  stroke="rgba(255,255,255,0.1)"
                />
                <text x="472" y="59" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="bold">R1</text>

                {/* Controller Body Contour */}
                <path
                  d="M150 84 C200 70 440 70 490 84 C548 102 596 222 566 300 C546 350 492 346 462 300 L432 262 H208 L178 300 C148 346 94 350 74 300 C44 222 92 102 150 84 Z"
                  fill="#151722"
                  stroke="rgba(124,58,237,0.4)"
                  strokeWidth="2"
                />

                {/* Left Analog Stick */}
                <circle cx="180" cy="140" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
                <circle
                  cx={180 + leftStick.x * 25}
                  cy={140 + leftStick.y * 25}
                  r="18"
                  fill={activePad.buttons[10]?.pressed ? "#10b981" : "#7c3aed"}
                  stroke="#fff"
                  strokeWidth="1.5"
                />

                {/* D-Pad Buttons */}
                <rect x="233" y="190" width="24" height="26" rx="5" fill={activePad.buttons[12]?.pressed ? "#10b981" : "#20212a"} />
                <rect x="233" y="240" width="24" height="26" rx="5" fill={activePad.buttons[13]?.pressed ? "#10b981" : "#20212a"} />
                <rect x="206" y="216" width="26" height="24" rx="5" fill={activePad.buttons[14]?.pressed ? "#10b981" : "#20212a"} />
                <rect x="258" y="216" width="26" height="24" rx="5" fill={activePad.buttons[15]?.pressed ? "#10b981" : "#20212a"} />

                {/* Center Buttons (Share, PS, Options) */}
                <circle cx="285" cy="130" r="11" fill={activePad.buttons[8]?.pressed ? "#10b981" : "#20212a"} />
                <circle cx="320" cy="106" r="14" fill={activePad.buttons[16]?.pressed ? "#10b981" : "#7c3aed"} />
                <circle cx="355" cy="130" r="11" fill={activePad.buttons[9]?.pressed ? "#10b981" : "#20212a"} />

                {/* PlayStation Face Buttons (Triangle, Square, Circle, Cross) */}
                <circle cx="460" cy="102" r="19" fill={activePad.buttons[3]?.pressed ? "#10b981" : "#20212a"} />
                <text x="460" y="107" fill="#10b981" fontSize="14" textAnchor="middle" fontWeight="bold">△</text>
                <circle cx="424" cy="138" r="19" fill={activePad.buttons[2]?.pressed ? "#10b981" : "#20212a"} />
                <text x="424" y="143" fill="#ec4899" fontSize="14" textAnchor="middle" fontWeight="bold">□</text>
                <circle cx="496" cy="138" r="19" fill={activePad.buttons[1]?.pressed ? "#10b981" : "#20212a"} />
                <text x="496" y="143" fill="#ef4444" fontSize="14" textAnchor="middle" fontWeight="bold">○</text>
                <circle cx="460" cy="174" r="19" fill={activePad.buttons[0]?.pressed ? "#10b981" : "#20212a"} />
                <text x="460" y="179" fill="#0070d1" fontSize="14" textAnchor="middle" fontWeight="bold">✕</text>

                {/* Right Analog Stick */}
                <circle cx="390" cy="236" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
                <circle
                  cx={390 + rightStick.x * 25}
                  cy={236 + rightStick.y * 25}
                  r="18"
                  fill={activePad.buttons[11]?.pressed ? "#10b981" : "#7c3aed"}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Sticks Drift Readout */}
              <div className="w-full flex flex-wrap items-center justify-around gap-4 pt-6 border-t border-white/10 text-xs font-mono">
                <div>
                  <span className="text-slate-400">آنالوگ چپ: </span>
                  <b className="text-white font-bold">{leftStick.x}, {leftStick.y}</b>
                  {leftStick.drift ? (
                    <span className="ms-2 text-rose-400 font-bold">⚠️ احتمال دریفت</span>
                  ) : (
                    <span className="ms-2 text-emerald-400 font-bold">✓ مرکز سالم</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400">آنالوگ راست: </span>
                  <b className="text-white font-bold">{rightStick.x}, {rightStick.y}</b>
                  {rightStick.drift ? (
                    <span className="ms-2 text-rose-400 font-bold">⚠️ احتمال دریفت</span>
                  ) : (
                    <span className="ms-2 text-emerald-400 font-bold">✓ مرکز سالم</span>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist of Tested Parts */}
            <div className="p-6 rounded-3xl bg-[#101116] border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">فهرست قطعات و دکمه‌های تست‌شده</h3>
                <span className="text-xs text-purple-300 font-mono">
                  {testedParts.size} از {PARTS_LIST.length} تست شد
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {PARTS_LIST.map((part) => {
                  const isDone = testedParts.has(part.id);
                  return (
                    <span
                      key={part.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                          : "bg-white/5 text-slate-500 border border-white/5"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isDone ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <span>{part.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Advanced Tester Drawer Toggle */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-5 py-2.5 rounded-2xl bg-white/5 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-xs font-bold inline-flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Cpu className="w-4 h-4" />
                <span>{showAdvanced ? "بستن تستر پیشرفته DualSense" : "نمایش تستر پیشرفته سه‌بعدی DualSense"}</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 rounded-3xl overflow-hidden border border-purple-500/30 bg-[#070709] h-[640px] shadow-2xl">
                  <iframe
                    src="/gamepad/index.html"
                    title="DualSense Advanced Tester"
                    className="w-full h-full border-0"
                    allow="hid; gamepad; usb; bluetooth"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
