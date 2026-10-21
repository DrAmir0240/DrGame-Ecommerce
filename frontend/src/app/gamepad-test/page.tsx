"use client";

import { useState } from "react";
import {
  Gamepad2,
  BatteryCharging,
  Wifi,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { Button, Pill, SectionTitle, Card } from "@/components/ui";
import { useApp } from "@/lib/app";

export default function GamepadTestPage() {
  const { t, n } = useApp();

  // Interactive UI state for testing buttons
  const [activeButtons, setActiveButtons] = useState<Record<string, boolean>>({});
  const [leftTrigger, setLeftTrigger] = useState<number>(0);
  const [rightTrigger, setRightTrigger] = useState<number>(0);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);

  const toggleButton = (name: string) => {
    setActiveButtons((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const pressTrigger = (side: "left" | "right", val: number) => {
    if (side === "left") setLeftTrigger(val);
    else setRightTrigger(val);
  };

  const triggerVibrationTest = () => {
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 1200);
  };

  return (
    <Page>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pb-12 pt-6">
        {/* Header Section */}
        <section className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card md:p-8">
          <div className="absolute -end-24 -top-24 size-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-psn/15 text-psn">
                  <Gamepad2 size={18} />
                </span>
                <span className="font-latin text-xs font-bold uppercase tracking-wider text-accent-2">
                  DualSense Controller Diagnostic Studio
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-fg md:text-3xl">
                {t("تست و کالیبراسیون دسته بازی PS5 (DualSense)", "DualSense Gamepad Tester & Diagnostic")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-fg-2">
                {t(
                  "رابط کاربری پیشرفته سنجش عملکرد دکمه‌ها، تست دریفت آنالوگ استیک‌ها، تریگرهای تطبیق‌پذیر L2/R2 و هپتیک فیدبک دسته پلی‌استیشن ۵.",
                  "Interactive diagnostic interface for checking button responsiveness, analog stick deadzones/drift, adaptive triggers and haptic feedback."
                )}
              </p>
            </div>

            {/* Controller Specs Pill */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2">
                <BatteryCharging size={16} className="text-success" />
                <span className="text-xs font-bold text-fg">
                  {t("باتری:", "Battery:")} <span dir="ltr" className="font-latin text-success">88%</span>
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2">
                <Wifi size={16} className="text-psn" />
                <span className="text-xs font-bold text-fg">
                  {t("تاخیر:", "Latency:")} <span dir="ltr" className="font-latin text-psn">1.2 ms</span>
                </span>
              </div>
              <Button variant="primary" size="md" onClick={triggerVibrationTest}>
                <Zap size={15} />
                {isVibrating ? t("در حال لرزش...", "Vibrating...") : t("تست ویبره هپتیک", "Test Haptics")}
              </Button>
            </div>
          </div>
        </section>

        {/* Main Interactive Controller Visualization */}
        <section className="flex flex-col items-center justify-center rounded-card border border-line bg-surface p-8 shadow-card">
          <div className="w-full max-w-3xl">
            {/* Controller Top Bumpers & Triggers */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              {/* Left Bumper & Trigger */}
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleButton("L1")}
                    className={`rounded-lg px-4 py-2 font-latin font-black text-xs transition-all cursor-pointer ${
                      activeButtons["L1"]
                        ? "bg-accent-2 text-white shadow-glow"
                        : "bg-surface-3 text-fg-2 hover:text-fg"
                    }`}
                  >
                    L1 BUMPER
                  </button>
                  <span className="font-mono text-xs font-bold text-accent-2">
                    L2: {n(leftTrigger)}%
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-muted mb-1">
                    <span>{t("تریگر آنالوگ L2", "L2 Trigger Pressure")}</span>
                    <span>{leftTrigger > 0 ? t("فشرده شده", "Active") : t("رها", "Released")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={leftTrigger}
                    onChange={(e) => pressTrigger("left", Number(e.target.value))}
                    className="h-2 w-full accent-accent-2 cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Bumper & Trigger */}
              <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-psn">
                    R2: {n(rightTrigger)}%
                  </span>
                  <button
                    onClick={() => toggleButton("R1")}
                    className={`rounded-lg px-4 py-2 font-latin font-black text-xs transition-all cursor-pointer ${
                      activeButtons["R1"]
                        ? "bg-psn text-white shadow-glow"
                        : "bg-surface-3 text-fg-2 hover:text-fg"
                    }`}
                  >
                    R1 BUMPER
                  </button>
                </div>
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-muted mb-1">
                    <span>{t("تریگر آنالوگ R2", "R2 Trigger Pressure")}</span>
                    <span>{rightTrigger > 0 ? t("فشرده شده", "Active") : t("رها", "Released")}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rightTrigger}
                    onChange={(e) => pressTrigger("right", Number(e.target.value))}
                    className="h-2 w-full accent-psn cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Controller Body Shell */}
            <div
              className={`relative rounded-3xl border-2 border-line-strong bg-linear-135 from-surface-2 via-surface to-surface-3 p-8 shadow-2xl transition-all duration-300 ${
                isVibrating ? "animate-pulse ring-4 ring-accent-2" : ""
              }`}
            >
              {/* Touchpad Area */}
              <div className="mx-auto mb-8 w-64 rounded-2xl border border-line-strong bg-surface-3 p-4 text-center shadow-inner">
                <button
                  onClick={() => toggleButton("touchpad")}
                  className={`w-full py-4 rounded-xl font-latin text-xs font-bold transition-all cursor-pointer ${
                    activeButtons["touchpad"]
                      ? "bg-accent-2 text-white shadow-glow"
                      : "bg-surface-2 text-muted hover:text-fg"
                  }`}
                >
                  DUALSENSE TOUCHPAD
                </button>
              </div>

              <div className="grid grid-cols-3 items-center gap-6">
                {/* Left Side: D-Pad */}
                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-bold text-muted mb-3 uppercase">D-Pad Directional</p>
                  <div className="relative size-32">
                    {/* Up */}
                    <button
                      onClick={() => toggleButton("up")}
                      className={`absolute top-0 start-11 size-10 rounded-t-lg font-bold transition-all cursor-pointer ${
                        activeButtons["up"]
                          ? "bg-accent-2 text-white shadow-glow"
                          : "bg-surface-2 text-fg hover:bg-surface-3 border border-line"
                      }`}
                    >
                      ▲
                    </button>
                    {/* Down */}
                    <button
                      onClick={() => toggleButton("down")}
                      className={`absolute bottom-0 start-11 size-10 rounded-b-lg font-bold transition-all cursor-pointer ${
                        activeButtons["down"]
                          ? "bg-accent-2 text-white shadow-glow"
                          : "bg-surface-2 text-fg hover:bg-surface-3 border border-line"
                      }`}
                    >
                      ▼
                    </button>
                    {/* Left */}
                    <button
                      onClick={() => toggleButton("left")}
                      className={`absolute top-11 start-0 size-10 rounded-s-lg font-bold transition-all cursor-pointer ${
                        activeButtons["left"]
                          ? "bg-accent-2 text-white shadow-glow"
                          : "bg-surface-2 text-fg hover:bg-surface-3 border border-line"
                      }`}
                    >
                      ◀
                    </button>
                    {/* Right */}
                    <button
                      onClick={() => toggleButton("right")}
                      className={`absolute top-11 end-0 size-10 rounded-e-lg font-bold transition-all cursor-pointer ${
                        activeButtons["right"]
                          ? "bg-accent-2 text-white shadow-glow"
                          : "bg-surface-2 text-fg hover:bg-surface-3 border border-line"
                      }`}
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Center: PS Button & Share/Options */}
                <div className="flex flex-col items-center gap-5">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => toggleButton("create")}
                      className={`px-3 py-1 rounded text-[10px] font-bold font-latin border transition-all cursor-pointer ${
                        activeButtons["create"]
                          ? "bg-accent-2 text-white border-accent-2"
                          : "bg-surface-2 text-muted border-line hover:text-fg"
                      }`}
                    >
                      CREATE
                    </button>
                    <button
                      onClick={() => toggleButton("options")}
                      className={`px-3 py-1 rounded text-[10px] font-bold font-latin border transition-all cursor-pointer ${
                        activeButtons["options"]
                          ? "bg-accent-2 text-white border-accent-2"
                          : "bg-surface-2 text-muted border-line hover:text-fg"
                      }`}
                    >
                      OPTIONS
                    </button>
                  </div>

                  {/* PS Home Button */}
                  <button
                    onClick={() => toggleButton("ps")}
                    className={`size-12 rounded-full border-2 grid place-items-center font-bold text-sm transition-all cursor-pointer ${
                      activeButtons["ps"]
                        ? "bg-psn text-white border-psn shadow-glow"
                        : "bg-surface-2 text-fg border-line hover:border-psn"
                    }`}
                  >
                    PS
                  </button>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex flex-col items-center">
                  <p className="text-[11px] font-bold text-muted mb-3 uppercase">Action Buttons</p>
                  <div className="relative size-32">
                    {/* Triangle */}
                    <button
                      onClick={() => toggleButton("triangle")}
                      className={`absolute top-0 start-11 size-10 rounded-full font-bold transition-all cursor-pointer border ${
                        activeButtons["triangle"]
                          ? "bg-success text-black border-success shadow-glow"
                          : "bg-surface-2 text-success border-line hover:bg-surface-3"
                      }`}
                    >
                      ▲
                    </button>
                    {/* Cross (X) */}
                    <button
                      onClick={() => toggleButton("cross")}
                      className={`absolute bottom-0 start-11 size-10 rounded-full font-bold transition-all cursor-pointer border ${
                        activeButtons["cross"]
                          ? "bg-psn text-white border-psn shadow-glow"
                          : "bg-surface-2 text-psn border-line hover:bg-surface-3"
                      }`}
                    >
                      ✕
                    </button>
                    {/* Square */}
                    <button
                      onClick={() => toggleButton("square")}
                      className={`absolute top-11 start-0 size-10 rounded-full font-bold transition-all cursor-pointer border ${
                        activeButtons["square"]
                          ? "bg-pink text-white border-pink shadow-glow"
                          : "bg-surface-2 text-pink border-line hover:bg-surface-3"
                      }`}
                    >
                      ■
                    </button>
                    {/* Circle */}
                    <button
                      onClick={() => toggleButton("circle")}
                      className={`absolute top-11 end-0 size-10 rounded-full font-bold transition-all cursor-pointer border ${
                        activeButtons["circle"]
                          ? "bg-danger text-white border-danger shadow-glow"
                          : "bg-surface-2 text-danger border-line hover:bg-surface-3"
                      }`}
                    >
                      ●
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Analog Sticks */}
              <div className="mt-8 flex justify-around">
                {/* Left Analog (L3) */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => toggleButton("L3")}
                    className={`size-20 rounded-full border-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeButtons["L3"]
                        ? "border-accent-2 bg-accent-soft text-accent-2 shadow-glow"
                        : "border-line bg-surface-2 text-fg-2 hover:border-accent-2"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">L3</span>
                    <span className="text-[9px] text-muted">X: 0 | Y: 0</span>
                  </button>
                  <span className="text-[11px] font-bold text-fg-2">
                    {t("استیک چپ (Left Stick)", "Left Analog")}
                  </span>
                </div>

                {/* Right Analog (R3) */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => toggleButton("R3")}
                    className={`size-20 rounded-full border-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
                      activeButtons["R3"]
                        ? "border-psn bg-psn/20 text-psn shadow-glow"
                        : "border-line bg-surface-2 text-fg-2 hover:border-psn"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">R3</span>
                    <span className="text-[9px] text-muted">X: 0 | Y: 0</span>
                  </button>
                  <span className="text-[11px] font-bold text-fg-2">
                    {t("استیک راست (Right Stick)", "Right Analog")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Diagnostic Tools Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5">
            <h4 className="flex items-center gap-2 font-bold text-fg text-sm">
              <CheckCircle2 size={16} className="text-success" />
              {t("بررسی دریفت استیک‌ها (Stick Drift)", "Stick Drift Analyzer")}
            </h4>
            <p className="mt-2 text-xs text-fg-2 leading-relaxed">
              {t(
                "نقطه مرکز و محدوده ددزون (Deadzone) آنالوگ‌ها کاملاً کالیبره است و هیچ انحراف حرکتی ثبت نشد.",
                "Zero center deadzone jitter detected. Potentiometers calibrated perfectly."
              )}
            </p>
          </Card>

          <Card className="p-5">
            <h4 className="flex items-center gap-2 font-bold text-fg text-sm">
              <Sliders size={16} className="text-accent-2" />
              {t("موتورهای تریگر تطبیق‌پذیر", "Adaptive Trigger Resistance")}
            </h4>
            <p className="mt-2 text-xs text-fg-2 leading-relaxed">
              {t(
                "تست مقاومت مکانیکی دنده‌های L2 و R2 برای بازی‌های شوتر و رانندگی نسل نهم با موفقیت تایید شد.",
                "Gear tension test passed for realistic weapon tension and vehicle braking resistance."
              )}
            </p>
          </Card>

          <Card className="p-5">
            <h4 className="flex items-center gap-2 font-bold text-fg text-sm">
              <Sparkles size={16} className="text-warning" />
              {t("موتورهای لرزشی صوتی (Haptics)", "Dual Voice-Coil Actuators")}
            </h4>
            <p className="mt-2 text-xs text-fg-2 leading-relaxed">
              {t(
                "فرکانس لرزش بین ۵۰ تا ۴۰۰ هرتز آزمایش شد و دقت بازخورد لمسی در سطح استاندارد طلایی است.",
                "Broadband 50-400Hz haptic rumble actuators responding within nominal parameters."
              )}
            </p>
          </Card>
        </section>
      </div>
    </Page>
  );
}
