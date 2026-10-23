"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Gamepad2,
  Cpu,
  Battery,
  Sliders,
  Sparkles,
  Volume2,
  RefreshCw,
  Layers,
  Check,
  AlertCircle,
} from "lucide-react";
import { PlayStationGlyph } from "./PlayStationGlyph";
import { useApp } from "@/lib/app";

export const AdvancedDualSenseTester: React.FC = () => {
  const { t, n } = useApp();

  const [connected, setConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isCharging, setIsCharging] = useState(false);
  const [gyro, setGyro] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const [triggerResistance, setTriggerResistance] = useState(60);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<"standard" | "bow" | "shotgun" | "machinegun">("bow");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulated gyro / motion movement when active or simulated
  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.05;
      setGyro({
        pitch: Math.sin(angle) * 12,
        roll: Math.cos(angle) * 15,
        yaw: Math.sin(angle * 0.5) * 8,
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleTouchpadMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setTouchPos({ x, y });
  };

  const handleTouchpadMouseLeave = () => {
    setTouchPos(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Controller Identity & Hardware Telemetry Bar */}
      <div className="rounded-2xl border border-cyan-500/30 bg-[#121624] p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm md:text-base text-white">
                Sony DualSense Wireless Controller (CFI-ZCT1W)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                WebHID Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Vendor ID: 0x054C (Sony Interactive) · Product ID: 0x0CE6 · Firmware: 0x0224
            </p>
          </div>
        </div>

        {/* Battery & Audio Jack Telemetry */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200">
            <Battery className="w-4 h-4 text-green-400" />
            <span className="font-mono font-bold">{n(batteryLevel)}%</span>
            <span className="text-[10px] text-slate-400">({isCharging ? "Charging" : "Discharging"})</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span className="text-[11px]">3.5mm Headset: Connected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. 3D Controller Orientation & Gyroscope Visualizer */}
        <div className="rounded-2xl border border-white/10 bg-[#151722] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{t("نمایشگر زاویه سه‌بعدی و ژیروسکوپ (IMU)", "3D Gyroscope & Accelerometer")}</span>
            </h4>
            <span className="text-[10px] font-mono text-cyan-400">6-Axis Motion Sensor</span>
          </div>

          {/* Simulated 3D DualSense Body Perspective */}
          <div className="h-64 rounded-2xl bg-[#0b0d14] border border-white/5 flex items-center justify-center relative overflow-hidden perspective-1000">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            <div
              className="relative w-48 h-32 rounded-3xl border-2 border-cyan-500/50 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl flex items-center justify-center transition-transform duration-100 ease-out"
              style={{
                transform: `rotateX(${gyro.pitch}deg) rotateY(${gyro.roll}deg) rotateZ(${gyro.yaw}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="w-16 h-8 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center text-[10px] text-cyan-300 font-mono">
                Touchpad
              </div>

              {/* PS Button */}
              <div className="absolute bottom-3 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center">
                <PlayStationGlyph type="triangle" size={8} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Pitch (X)</span>
              <span className="font-bold text-white">{gyro.pitch.toFixed(1)}°</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Roll (Y)</span>
              <span className="font-bold text-white">{gyro.roll.toFixed(1)}°</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Yaw (Z)</span>
              <span className="font-bold text-white">{gyro.yaw.toFixed(1)}°</span>
            </div>
          </div>
        </div>

        {/* 3. Adaptive Triggers Force Calibration */}
        <div className="rounded-2xl border border-white/10 bg-[#151722] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-400" />
              <span>{t("شبیه‌سازی مقاومت تریگرهای تطبیق‌پذیر (Adaptive Triggers)", "Adaptive Triggers Force Simulation")}</span>
            </h4>
            <span className="text-[10px] font-mono text-orange-400 font-bold">R2 / L2 Actuator</span>
          </div>

          {/* Trigger Profile Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "standard", label: "استاندارد", val: 0 },
              { id: "bow", label: "کمان (کشسانی)", val: 65 },
              { id: "shotgun", label: "شات‌گان (شلیک)", val: 95 },
              { id: "machinegun", label: "تیربار (ضربه پالسی)", val: 80 },
            ].map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => {
                  setSelectedProfile(prof.id as any);
                  setTriggerResistance(prof.val);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  selectedProfile === prof.id
                    ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-500/25"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {prof.label}
              </button>
            ))}
          </div>

          {/* Resistance Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">{t("درصد فشار موتور مقاومتی:", "Motor Force Resistance:")}</span>
              <span className="font-mono font-bold text-orange-400">{triggerResistance}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={triggerResistance}
              onChange={(e) => setTriggerResistance(parseInt(e.target.value))}
              className="w-full h-2 bg-[#0f1016] rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* 4. Multi-Touch Touchpad Canvas Visualizer */}
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              {t("پد لمسی خازنی DualSense (Multi-Touch Touchpad):", "Capacitive Multi-Touch Touchpad:")}
            </span>
            <div
              onMouseMove={handleTouchpadMouseMove}
              onMouseLeave={handleTouchpadMouseLeave}
              className="relative w-full h-28 rounded-xl border border-white/20 bg-[#0f1016] p-2 cursor-crosshair flex items-center justify-center overflow-hidden"
            >
              <span className="text-[10px] text-slate-600 pointer-events-none font-mono">
                {touchPos
                  ? `Touch: X:${(touchPos.x * 1920).toFixed(0)} Y:${(touchPos.y * 1080).toFixed(0)}`
                  : "ماوس را روی تاچ‌پد حرکت دهید تا موقعیت لمس شبیه‌سازی شود"}
              </span>

              {touchPos && (
                <div
                  className="absolute w-6 h-6 rounded-full bg-cyan-400/40 border border-cyan-400 shadow-md shadow-cyan-400/50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${touchPos.x * 100}%`,
                    top: `${touchPos.y * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDualSenseTester;
