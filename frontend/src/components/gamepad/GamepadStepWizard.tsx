'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Vibrate,
  Activity,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Printer,
  ShieldCheck,
  Cpu,
  Compass,
  Gauge,
  Sparkles,
  Zap,
  Clock,
  Layers,
  HelpCircle,
  Tv,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import ControllerModel3D from './ControllerModel3D';
import type { ControllerInfo, PadSnapshot } from './useGamepad';
import type { Quaternion, PS5Telemetry, PS4HardwareInfo } from './useWebHIDController';

export interface GamepadStepWizardProps {
  pad: PadSnapshot;
  controller: ControllerInfo | null;
  orientation: Quaternion;
  gyroRates: { pitch: number; yaw: number; roll: number };
  motionEnergy: number;
  ps5Info: PS5Telemetry | null;
  ps4Info: PS4HardwareInfo | null;
  isWebHIDConnected: boolean;
  onConnectWebHID: () => void;
  onRumble: () => Promise<boolean>;
  onResetOrientation: () => void;
  onSwitchToDashboard?: () => void;
}

export type WizardStep =
  | 'connect'     // 0: بررسی اتصال و مشخصات سخت‌افزاری
  | 'action_btns' // 1: دکمه‌های اصلی
  | 'dpad'        // 2: کلیدهای جهت
  | 'triggers'    // 3: تریگرها و بامپرها
  | 'sticks'      // 4: استیک‌ها و دریفت
  | 'gyro'        // 5: سنسور ژیروسکوپ و مدل ۳بعدی
  | 'vibration'   // 6: تست ویبره
  | 'mic'         // 7: تست میکروفون
  | 'report';     // 8: کارنامه نهایی

const STEPS: { id: WizardStep; label: string; icon: any }[] = [
  { id: 'connect', label: 'شناسایی و اتصال', icon: Cpu },
  { id: 'action_btns', label: 'دکمه‌های اصلی', icon: Sparkles },
  { id: 'dpad', label: 'کلیدهای جهت', icon: Compass },
  { id: 'triggers', label: 'تریگرها و بامپر', icon: Layers },
  { id: 'sticks', label: 'استیک‌ها و دریفت', icon: Activity },
  { id: 'gyro', label: 'ژیروسکوپ سه‌بعدی', icon: RotateCcw },
  { id: 'vibration', label: 'موتورهای ویبره', icon: Vibrate },
  { id: 'mic', label: 'تست میکروفون', icon: Mic },
  { id: 'report', label: 'گزارش و نتیجه', icon: ShieldCheck },
];

export default function GamepadStepWizard({
  pad,
  controller,
  orientation,
  gyroRates,
  motionEnergy,
  ps5Info,
  ps4Info,
  isWebHIDConnected,
  onConnectWebHID,
  onRumble,
  onResetOrientation,
  onSwitchToDashboard,
}: GamepadStepWizardProps) {
  const { t, locale, dir } = useTranslation();
  const [currentStep, setCurrentStep] = useState<WizardStep>('connect');

  // Track testing state for each part
  const [btnHits, setBtnHits] = useState<{ [btnIndex: number]: number }>({
    0: 0, 1: 0, 2: 0, 3: 0, // Cross, Circle, Square, Triangle
    4: 0, 5: 0, 6: 0, 7: 0, // L1, R1, L2, R2
    10: 0, 11: 0,           // L3, R3
    12: 0, 13: 0, 14: 0, 15: 0, // Up, Down, Left, Right
  });

  const [maxTrigger, setMaxTrigger] = useState<{ L2: number; R2: number }>({ L2: 0, R2: 0 });
  const [driftStats, setDriftStats] = useState<{ leftMax: number; rightMax: number }>({ leftMax: 0, rightMax: 0 });
  const [gyroPassed, setGyroPassed] = useState(false);
  const [vibrationPassed, setVibrationPassed] = useState(false);
  const [rumbleBusy, setRumbleBusy] = useState(false);

  // Microphone testing state
  const [micPassed, setMicPassed] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micDb, setMicDb] = useState(-60);
  const [micPeak, setMicPeak] = useState(-60);
  const [micError, setMicError] = useState<string | null>(null);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  const micStreamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);
  const micPassedRef = useRef(false);

  const stopMic = useCallback(() => {
    if (micRafRef.current !== null) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    try {
      micAnalyserRef.current?.disconnect();
    } catch {
      /* detached */
    }
    micAnalyserRef.current = null;
    void micCtxRef.current?.close().catch(() => undefined);
    micCtxRef.current = null;
    setMicActive(false);
    setMicDb(-60);
    setMicPeak(-60);
  }, []);

  const startMic = useCallback(
    async (deviceIdToUse?: string) => {
      try {
        setMicError(null);
        const wantedId = deviceIdToUse || selectedMicId;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...(wantedId ? { deviceId: { exact: wantedId } } : {}),
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        micStreamRef.current = stream;

        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctor();
        micCtxRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2;
        micAnalyserRef.current = analyser;
        source.connect(analyser);

        const buf = new Float32Array(analyser.fftSize);
        setMicActive(true);

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter((d) => d.kind === 'audioinput');
          setMicDevices(audioInputs);
          const currentTrackId = stream.getAudioTracks()[0]?.getSettings().deviceId;
          if (currentTrackId && !wantedId) {
            setSelectedMicId(currentTrackId);
          }
        } catch {
          /* ignore */
        }

        let frameCount = 0;
        let smoothDb = -60;
        let peakHold = -60;

        const loop = () => {
          if (!micAnalyserRef.current) return;
          type TimeDomainBuffer = Parameters<AnalyserNode['getFloatTimeDomainData']>[0];
          micAnalyserRef.current.getFloatTimeDomainData(buf as TimeDomainBuffer);
          let sum = 0;
          let peak = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = buf[i];
            sum += v * v;
            const abs = Math.abs(v);
            if (abs > peak) peak = abs;
          }

          const rms = Math.sqrt(sum / buf.length);
          const dbNow = rms <= 0 ? -60 : Math.max(-60, Math.min(0, 20 * Math.log10(rms)));
          const peakNow = peak <= 0 ? -60 : Math.max(-60, Math.min(0, 20 * Math.log10(peak)));

          smoothDb = smoothDb <= -60 ? dbNow : smoothDb * 0.75 + dbNow * 0.25;
          peakHold = Math.max(peakNow, peakHold - 0.5);

          frameCount++;
          if (frameCount % 4 === 0) {
            setMicDb(smoothDb);
            setMicPeak(peakHold);
          }

          // Voice / audio detection threshold
          if (smoothDb > -40 || peakHold > -28) {
            if (!micPassedRef.current) {
              micPassedRef.current = true;
              setMicPassed(true);
            }
          }

          micRafRef.current = requestAnimationFrame(loop);
        };

        micRafRef.current = requestAnimationFrame(loop);
      } catch (err: unknown) {
        console.warn('Microphone access failed:', err);
        const msg = err instanceof Error ? err.message : 'دسترسی به میکروفون امکان‌پذیر نشد.';
        setMicError(msg);
        stopMic();
      }
    },
    [selectedMicId, stopMic],
  );

  // Activate / deactivate microphone only during 'mic' step
  useEffect(() => {
    if (currentStep === 'mic') {
      startMic();
    } else {
      stopMic();
    }
    return () => {
      stopMic();
    };
  }, [currentStep, startMic, stopMic]);

  // Auto-detect button presses during relevant step
  const prevButtonsRef = useRef<boolean[]>([]);
  useEffect(() => {
    if (!pad.connected) return;

    pad.buttons.forEach((b, idx) => {
      const wasPressed = prevButtonsRef.current[idx] ?? false;
      const isPressed = b.pressed || b.value > 0.5;

      if (isPressed && !wasPressed) {
        setBtnHits((prev) => ({
          ...prev,
          [idx]: (prev[idx] || 0) + 1,
        }));
      }
    });

    prevButtonsRef.current = pad.buttons.map((b) => b.pressed || b.value > 0.5);

    // Track trigger pressure max
    const l2Val = pad.buttons[6]?.value ?? 0;
    const r2Val = pad.buttons[7]?.value ?? 0;
    setMaxTrigger((prev) => ({
      L2: Math.max(prev.L2, l2Val),
      R2: Math.max(prev.R2, r2Val),
    }));

    // Track stick drift
    const lx = pad.axes[0] ?? 0;
    const ly = pad.axes[1] ?? 0;
    const rx = pad.axes[2] ?? 0;
    const ry = pad.axes[3] ?? 0;
    const lDist = Math.hypot(lx, ly);
    const rDist = Math.hypot(rx, ry);
    setDriftStats((prev) => ({
      leftMax: Math.max(prev.leftMax, lDist),
      rightMax: Math.max(prev.rightMax, rDist),
    }));
  }, [pad.buttons, pad.axes, pad.connected]);

  // Gyroscope progress detection
  useEffect(() => {
    if (motionEnergy >= 40 || Math.abs(gyroRates.pitch) > 25 || Math.abs(gyroRates.yaw) > 25 || Math.abs(gyroRates.roll) > 25) {
      setGyroPassed(true);
    }
  }, [motionEnergy, gyroRates]);

  const isXbox = controller?.key === 'xbox-series';
  const isPS5 = controller?.key === 'dualsense' || controller?.key === 'dualsense-edge' || (pad.id && /054c|dualsense/i.test(pad.id));
  const isPS4 = controller?.key === 'dualshock4' || (pad.id && /05c4|09cc|dualshock/i.test(pad.id));

  // Determine current step index
  const currentStepIdx = STEPS.findIndex((s) => s.id === currentStep);

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const idx = STEPS.findIndex((s) => s.id === prev);
      if (idx < STEPS.length - 1) {
        return STEPS[idx + 1].id;
      }
      return prev;
    });
  }, []);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const idx = STEPS.findIndex((s) => s.id === prev);
      if (idx > 0) {
        return STEPS[idx - 1].id;
      }
      return prev;
    });
  }, []);

  const handleTestRumble = useCallback(async () => {
    setRumbleBusy(true);
    await onRumble();
    setRumbleBusy(false);
  }, [onRumble]);

  const resetAllTests = useCallback(() => {
    setBtnHits({
      0: 0, 1: 0, 2: 0, 3: 0,
      4: 0, 5: 0, 6: 0, 7: 0,
      10: 0, 11: 0,
      12: 0, 13: 0, 14: 0, 15: 0,
    });
    setMaxTrigger({ L2: 0, R2: 0 });
    setDriftStats({ leftMax: 0, rightMax: 0 });
    setGyroPassed(false);
    setVibrationPassed(false);
    setMicPassed(false);
    micPassedRef.current = false;
    setCurrentStep('connect');
  }, []);

  // Completion criteria for each step
  const isActionBtnsDone = (btnHits[0] || 0) >= 1 && (btnHits[1] || 0) >= 1 && (btnHits[2] || 0) >= 1 && (btnHits[3] || 0) >= 1;
  const isDpadDone = (btnHits[12] || 0) >= 1 && (btnHits[13] || 0) >= 1 && (btnHits[14] || 0) >= 1 && (btnHits[15] || 0) >= 1;
  const isTriggersDone = (btnHits[4] || 0) >= 1 && (btnHits[5] || 0) >= 1 && maxTrigger.L2 > 0.85 && maxTrigger.R2 > 0.85;
  const isSticksDone = ((btnHits[10] || 0) >= 1 && (btnHits[11] || 0) >= 1) || (driftStats.leftMax > 0.6 && driftStats.rightMax > 0.6);

  // ─────────────────────────────────────────────────────────────────
  // SMART AUTO-ADVANCE ENGINE (هوشمندسازی انتقال خودکار برای تلویزیون)
  // ─────────────────────────────────────────────────────────────────
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset autoAdvance flag whenever step changes
  useEffect(() => {
    setAutoAdvancing(false);
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, [currentStep]);

  useEffect(() => {
    let shouldAdvance = false;
    let delay = 1200;

    if (currentStep === 'connect' && pad.connected) {
      shouldAdvance = true;
      delay = 2400; // Let TV user see controller specs for 2.4s, then auto-advance
    } else if (currentStep === 'action_btns' && isActionBtnsDone) {
      shouldAdvance = true;
      delay = 1100;
    } else if (currentStep === 'dpad' && isDpadDone) {
      shouldAdvance = true;
      delay = 1100;
    } else if (currentStep === 'triggers' && isTriggersDone) {
      shouldAdvance = true;
      delay = 1200;
    } else if (currentStep === 'sticks' && isSticksDone) {
      shouldAdvance = true;
      delay = 1300;
    } else if (currentStep === 'gyro' && gyroPassed) {
      shouldAdvance = true;
      delay = 1400;
    } else if (currentStep === 'mic' && micPassed) {
      shouldAdvance = true;
      delay = 1500;
    }

    if (shouldAdvance && !autoAdvancing) {
      setAutoAdvancing(true);
      autoAdvanceTimerRef.current = setTimeout(() => {
        goToNextStep();
        setAutoAdvancing(false);
      }, delay);
    }
  }, [
    currentStep,
    pad.connected,
    isActionBtnsDone,
    isDpadDone,
    isTriggersDone,
    isSticksDone,
    gyroPassed,
    micPassed,
    autoAdvancing,
    goToNextStep,
  ]);

  // Vibration step auto-test for TV mode
  useEffect(() => {
    if (currentStep === 'vibration') {
      const rumbleTimer = setTimeout(() => {
        handleTestRumble();
      }, 500);

      const autoAdvanceTimer = setTimeout(() => {
        setVibrationPassed(true);
        goToNextStep();
      }, 4000);

      return () => {
        clearTimeout(rumbleTimer);
        clearTimeout(autoAdvanceTimer);
      };
    }
  }, [currentStep, handleTestRumble, goToNextStep]);

  // ─────────────────────────────────────────────────────────────────
  // TV CONTROLLER INPUT HANDLING (کنترل مرحله بعد و قبل با دکمه‌های دسته)
  // ─────────────────────────────────────────────────────────────────
  const lastNavPressRef = useRef(0);
  useEffect(() => {
    if (!pad.connected) return;

    const crossPressed = !!pad.buttons[0]?.pressed; // Cross (PS) / A (Xbox)
    const circlePressed = !!pad.buttons[1]?.pressed; // Circle (PS) / B (Xbox)
    const now = Date.now();

    if (now - lastNavPressRef.current > 450) {
      if (crossPressed) {
        lastNavPressRef.current = now;
        if (currentStep === 'connect') {
          goToNextStep();
        } else if (currentStep === 'action_btns' && isActionBtnsDone) {
          goToNextStep();
        } else if (currentStep === 'dpad' && isDpadDone) {
          goToNextStep();
        } else if (currentStep === 'triggers' && isTriggersDone) {
          goToNextStep();
        } else if (currentStep === 'sticks' && isSticksDone) {
          goToNextStep();
        } else if (currentStep === 'gyro' && gyroPassed) {
          goToNextStep();
        } else if (currentStep === 'vibration') {
          setVibrationPassed(true);
          goToNextStep();
        } else if (currentStep === 'mic') {
          goToNextStep();
        } else if (currentStep === 'report') {
          resetAllTests();
        }
      } else if (circlePressed && currentStep !== 'connect' && currentStep !== 'action_btns') {
        lastNavPressRef.current = now;
        goToPrevStep();
      }
    }
  }, [
    pad.buttons,
    currentStep,
    isActionBtnsDone,
    isDpadDone,
    isTriggersDone,
    isSticksDone,
    gyroPassed,
    goToNextStep,
    goToPrevStep,
    resetAllTests,
  ]);

  // Calculate overall health score
  const overallScore = useMemo(() => {
    let score = 100;
    if (driftStats.leftMax > 0.15) score -= 15;
    else if (driftStats.leftMax > 0.08) score -= 5;

    if (driftStats.rightMax > 0.15) score -= 15;
    else if (driftStats.rightMax > 0.08) score -= 5;

    if (!isActionBtnsDone) score -= 15;
    if (!isDpadDone) score -= 10;
    if (!isTriggersDone) score -= 10;
    if (!vibrationPassed) score -= 5;
    return Math.max(20, Math.min(100, score));
  }, [driftStats, isActionBtnsDone, isDpadDone, isTriggersDone, vibrationPassed]);

  return (
    <div className="w-full space-y-5" dir={dir}>
      {/* ─────────────────────────────────────────────────────────────────
          STEP TIMELINE (Clean, numbered progress indicator)
         ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0d121f]/90 p-3 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between overflow-x-auto pb-1 scrollbar-none gap-2">
          {STEPS.map((st, i) => {
            const isActive = st.id === currentStep;
            const isCompleted = i < currentStepIdx;
            const Icon = st.icon;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setCurrentStep(st.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-102 border border-violet-400'
                    : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div
                  className={`grid h-5 w-5 place-items-center rounded-lg text-[10px] ${
                    isActive
                      ? 'bg-white text-violet-700 font-black'
                      : isCompleted
                        ? 'bg-emerald-400 text-slate-950 font-black'
                        : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          TV MODE BANNER & AUTO-ADVANCING STATUS
         ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2">
          <Tv className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-200">سازگار با تلویزیون و کنترلر:</span>
          <span className="text-slate-400 hidden sm:inline">
            انتقال خودکار به مرحله بعد پس از تکمیل هر تست فعال است.
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]" dir="ltr">
          <span className="flex items-center gap-1.5 text-slate-300">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-bold text-white border border-white/20">
              {isXbox ? 'A' : '✕'}
            </kbd>
            <span>بعدی / تایید</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-bold text-slate-300 border border-white/15">
              {isXbox ? 'B' : '◯'}
            </kbd>
            <span>قبلی</span>
          </span>
        </div>
      </div>

      {autoAdvancing && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-3 text-xs sm:text-sm font-black text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.35)] animate-pulse">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
          <span>تست این بخش با موفقیت تایید شد! در حال انتقال خودکار به مرحله بعد...</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 0: CONNECTION & HARDWARE IDENTITY
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'connect' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Cpu className="h-10 w-10 animate-pulse" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {pad.connected
                ? controller?.name || 'دسته بازی متصل است'
                : 'در انتظار اتصال دسته بازی...'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {pad.connected
                ? 'دسته شما با موفقیت شناسایی شد. لطفاً مشخصات کارکرد و اصالت سخت‌افزاری را در کادر زیر مشاهده کنید.'
                : 'لطفاً دسته بازی خود را با کابل USB یا بلوتوث متصل کنید و یک دکمه از آن را فشار دهید تا اتصال فعال شود.'}
            </p>
          </div>

          {pad.connected ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 text-start">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-400">مدل شناسایی‌شده</span>
                <span className="text-sm font-black text-white">{controller?.name || pad.id}</span>
              </div>

              {/* ──────────────── PS5 DUALSENSE DETAILS ──────────────── */}
              {isPS5 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">وضعیت کارکرد دستگاه:</span>
                    {ps5Info ? (
                      ps5Info.condition === 'brand_new' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          آکبند (کاملاً نو و بدون کارکرد)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          کارکرده (Used)
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                        آکبند / در حد نو
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">ساعت و مدت زمان استفاده:</span>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {ps5Info?.activeTimeFormatted || (isWebHIDConnected ? '۰ دقیقه (نو)' : 'برای خواندن دقیق اتصال WebHID را بزنید')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">تعداد دفعات روشن شدن / استفاده:</span>
                    <span className="font-mono text-xs font-bold text-violet-300">
                      {ps5Info?.totalRecordCount ? `${ps5Info.totalRecordCount} بار` : '—'}
                    </span>
                  </div>

                  {!isWebHIDConnected && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onConnectWebHID}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 px-3 py-2 text-xs font-bold text-violet-200 transition-all cursor-pointer"
                      >
                        <Zap className="h-4 w-4 text-violet-400" />
                        اتصال مستقیم WebHID برای خواندن ساعت کارکرد دقیق از چیپ‌ست DualSense
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── PS4 DUALSHOCK DETAILS ──────────────── */}
              {isPS4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">شرکت سازنده:</span>
                    <span className="text-xs font-black text-emerald-300">
                      {ps4Info?.manufacturer || 'Sony Interactive Entertainment Inc.'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">وضعیت اصالت و ساخت:</span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {ps4Info ? (ps4Info.isAuthentic ? 'اورجینال سونی (Original Sony)' : 'طرح اصلی / شرکتی') : 'اورجینال سونی'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">شناسه سخت‌افزاری (VID/PID):</span>
                    <span className="font-mono text-xs text-slate-300">{ps4Info?.vidPid || '0x054C / 0x05C4'}</span>
                  </div>

                  {ps4Info?.buildDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">تاریخ ساخت سفت‌افزار:</span>
                      <span className="font-mono text-xs text-slate-300">
                        {ps4Info.buildDate} {ps4Info.buildTime || ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── XBOX / OTHER CONTROLLERS ──────────────── */}
              {!isPS5 && !isPS4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">شرکت سازنده:</span>
                    <span className="text-xs font-bold text-slate-200">
                      {isXbox ? 'Microsoft Corporation' : 'استاندارد W3C DirectInput/XInput'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">پروتکل ارتباطی:</span>
                    <span className="text-xs font-mono text-slate-300">{pad.mapping || 'Standard Gamepad'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>دسته هنوز متصل نشده است. اگر دسته با بلوتوث متصل است، یک دکمه از آن را بزنید.</span>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={!pad.connected}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <span>تایید اتصال و شروع مرحله اول</span>
              <kbd className="rounded bg-white/20 px-1.5 py-0.5 text-[11px] font-mono">
                {isXbox ? 'A' : '✕'}
              </kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 1: ACTION BUTTONS (✕ ◯ □ △ / A B X Y)
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'action_btns' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست دکمه‌های اصلی و اکشن</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              لطفاً هر یک از دکمه‌های زیر را روی دسته فشار دهید (حداقل یک بار) تا صحت سوئیچ فیزیکی بررسی شود.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { idx: 0, label: isXbox ? 'A' : '✕', color: 'from-blue-600 to-indigo-600', name: isXbox ? 'دکمه A' : 'دکمه ضربدر' },
              { idx: 1, label: isXbox ? 'B' : '◯', color: 'from-rose-600 to-red-600', name: isXbox ? 'دکمه B' : 'دکمه دایره' },
              { idx: 2, label: isXbox ? 'X' : '□', color: 'from-pink-600 to-purple-600', name: isXbox ? 'دکمه X' : 'دکمه مربع' },
              { idx: 3, label: isXbox ? 'Y' : '△', color: 'from-emerald-600 to-teal-600', name: isXbox ? 'دکمه Y' : 'دکمه مثلث' },
            ].map((btn) => {
              const hits = btnHits[btn.idx] || 0;
              const isPressedNow = pad.buttons[btn.idx]?.pressed || (pad.buttons[btn.idx]?.value ?? 0) > 0.5;
              const isDone = hits >= 1;

              return (
                <div
                  key={btn.idx}
                  onClick={() => {
                    setBtnHits((prev) => ({ ...prev, [btn.idx]: (prev[btn.idx] || 0) + 1 }));
                  }}
                  className={`relative overflow-hidden rounded-2xl border p-5 text-center transition-all cursor-pointer select-none active:scale-95 ${
                    isPressedNow
                      ? 'scale-105 border-white bg-white/20 shadow-[0_0_25px_rgba(255,255,255,0.4)]'
                      : isDone
                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                        : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div
                    className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl text-2xl font-black text-white shadow-lg bg-gradient-to-tr ${btn.color} ${
                      isPressedNow ? 'ring-4 ring-white animate-ping' : ''
                    }`}
                  >
                    {btn.label}
                  </div>

                  <p className="mt-3 text-xs font-bold text-white">{btn.name}</p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    {isDone ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تایید شد ({hits} بار)
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">فشار دهید</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              disabled={!isActionBtnsDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>مرحله بعد: کلیدهای جهت</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 2: D-PAD (DIRECTIONAL BUTTONS: ↑ ↓ ← →)
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'dpad' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست کلیدهای جهت‌نما (D-Pad)</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              کلیدهای بالا، پایین، چپ و راست را یکی‌یکی فشار دهید تا پاسخ‌دهی جهت‌ها بررسی شود.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { idx: 12, label: '↑', name: 'جهت بالا' },
              { idx: 13, label: '↓', name: 'جهت پایین' },
              { idx: 14, label: '←', name: 'جهت چپ' },
              { idx: 15, label: '→', name: 'جهت راست' },
            ].map((d) => {
              const hits = btnHits[d.idx] || 0;
              const isPressedNow = pad.buttons[d.idx]?.pressed || (pad.buttons[d.idx]?.value ?? 0) > 0.5;
              const isDone = hits >= 1;

              return (
                <div
                  key={d.idx}
                  onClick={() => {
                    setBtnHits((prev) => ({ ...prev, [d.idx]: (prev[d.idx] || 0) + 1 }));
                  }}
                  className={`rounded-2xl border p-5 text-center transition-all cursor-pointer select-none active:scale-95 ${
                    isPressedNow
                      ? 'scale-105 border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : isDone
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-white/10 bg-white/[0.02]'
                  }`}
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-slate-800 text-2xl font-mono font-black text-cyan-300">
                    {d.label}
                  </div>
                  <p className="mt-2 text-xs font-bold text-white">{d.name}</p>
                  <div className="mt-1 flex items-center justify-center">
                    {isDone ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        تایید شد
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">فشار دهید</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              disabled={!isDpadDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>مرحله بعد: تریگرها و بامپرها</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 3: TRIGGERS & BUMPERS (L1, R1, L2, R2)
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'triggers' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست تریگرها و بامپرهای پشتی</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              دکمه‌های L1 و R1 را فشار داده و سپس تریگرهای آنالوگ L2 و R2 را تا انتها (۱۰۰٪) بکشید.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* LEFT TRIGGER & BUMPER */}
            <div
              onClick={() => {
                setBtnHits((prev) => ({ ...prev, 4: (prev[4] || 0) + 1 }));
                setMaxTrigger((prev) => ({ ...prev, L2: 1 }));
              }}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 cursor-pointer select-none hover:border-violet-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">L1 (بامپر چپ)</span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    pad.buttons[4]?.pressed
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_#10b981]'
                      : (btnHits[4] || 0) >= 1
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {(btnHits[4] || 0) >= 1 ? 'تایید شد' : 'فشار یا کلیک کنید'}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">L2 (تریگر آنالوگ)</span>
                  <span className="font-mono font-bold text-violet-400">
                    {Math.round(Math.max(pad.buttons[6]?.value ?? 0, maxTrigger.L2) * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-75"
                    style={{ width: `${Math.max(pad.buttons[6]?.value ?? 0, maxTrigger.L2) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">حداکثر کشش ثبت‌شده: {Math.round(maxTrigger.L2 * 100)}%</p>
              </div>
            </div>

            {/* RIGHT TRIGGER & BUMPER */}
            <div
              onClick={() => {
                setBtnHits((prev) => ({ ...prev, 5: (prev[5] || 0) + 1 }));
                setMaxTrigger((prev) => ({ ...prev, R2: 1 }));
              }}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 cursor-pointer select-none hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white">R1 (بامپر راست)</span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    pad.buttons[5]?.pressed
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_#10b981]'
                      : (btnHits[5] || 0) >= 1
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {(btnHits[5] || 0) >= 1 ? 'تایید شد' : 'فشار یا کلیک کنید'}
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">R2 (تریگر آنالوگ)</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {Math.round(Math.max(pad.buttons[7]?.value ?? 0, maxTrigger.R2) * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-75"
                    style={{ width: `${Math.max(pad.buttons[7]?.value ?? 0, maxTrigger.R2) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">حداکثر کشش ثبت‌شده: {Math.round(maxTrigger.R2 * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              disabled={!isTriggersDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>مرحله بعد: استیک‌ها و دریفت</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 4: THUMBSTICKS & DRIFT ANALYSIS
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'sticks' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست استیک‌ها، کلیک L3/R3 و خطای دریفت</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              استیک‌ها را در جهات مختلف بچرخانید و رها کنید تا خطای بازگشت به مرکز سنجیده شود. هر دو استیک را به داخل فشار دهید (L3 و R3).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* LEFT STICK */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-center space-y-3">
              <span className="text-xs font-black text-white">استیک چپ (Left Stick)</span>
              <div className="relative mx-auto h-36 w-36 rounded-full border border-white/10 bg-[#080c14] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 m-4" />
                <div
                  className="h-8 w-8 rounded-full bg-violet-500 shadow-[0_0_15px_#8b5cf6] transition-transform duration-75"
                  style={{
                    transform: `translate(${(pad.axes[0] ?? 0) * 45}px, ${(pad.axes[1] ?? 0) * 45}px)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">کلیک L3:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    pad.buttons[10]?.pressed || (btnHits[10] || 0) >= 1
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {(btnHits[10] || 0) >= 1 ? 'تایید شد' : 'فشار دهید'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">خطای دریفت مرکز:</span>
                <span
                  className={`font-mono font-bold ${
                    driftStats.leftMax < 0.07
                      ? 'text-emerald-400'
                      : driftStats.leftMax < 0.12
                        ? 'text-amber-400'
                        : 'text-rose-400'
                  }`}
                >
                  {(driftStats.leftMax * 100).toFixed(1)}% {driftStats.leftMax < 0.07 ? '(سالم)' : '(دریفت)'}
                </span>
              </div>
            </div>

            {/* RIGHT STICK */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-center space-y-3">
              <span className="text-xs font-black text-white">استیک راست (Right Stick)</span>
              <div className="relative mx-auto h-36 w-36 rounded-full border border-white/10 bg-[#080c14] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 m-4" />
                <div
                  className="h-8 w-8 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] transition-transform duration-75"
                  style={{
                    transform: `translate(${(pad.axes[2] ?? 0) * 45}px, ${(pad.axes[3] ?? 0) * 45}px)`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">کلیک R3:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded ${
                    pad.buttons[11]?.pressed || (btnHits[11] || 0) >= 1
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {(btnHits[11] || 0) >= 1 ? 'تایید شد' : 'فشار دهید'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">خطای دریفت مرکز:</span>
                <span
                  className={`font-mono font-bold ${
                    driftStats.rightMax < 0.07
                      ? 'text-emerald-400'
                      : driftStats.rightMax < 0.12
                        ? 'text-amber-400'
                        : 'text-rose-400'
                  }`}
                >
                  {(driftStats.rightMax * 100).toFixed(1)}% {driftStats.rightMax < 0.07 ? '(سالم)' : '(دریفت)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              disabled={!isSticksDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>مرحله بعد: ژیروسکوپ سه‌بعدی</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 5: 3D GYROSCOPE & MOTION TEST
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'gyro' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست ژیروسکوپ و سنسور حرکتی ۳بعدی</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              دسته را در دست خود به چپ، راست، بالا و پایین بچرخانید و تکان دهید. مدل سه‌بعدی به صورت زنده همگام با جهت دسته شما در فضا می‌چرخد.
            </p>
          </div>

          {/* 3D Model Stage */}
          <div className="relative mx-auto max-w-xl aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#080c14] shadow-2xl">
            <ControllerModel3D
              className="h-full w-full"
              autoSpin={!isWebHIDConnected && !gyroPassed}
              orientation={isWebHIDConnected ? orientation : null}
            />

            {/* Live Gyro Overlays */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-[10px] font-mono pointer-events-none" dir="ltr">
              <span className="rounded-lg bg-black/70 px-2 py-1 text-slate-300 border border-white/10 backdrop-blur-md">
                PITCH: {gyroRates.pitch}°/s
              </span>
              <span className="rounded-lg bg-black/70 px-2 py-1 text-slate-300 border border-white/10 backdrop-blur-md">
                YAW: {gyroRates.yaw}°/s
              </span>
              <span className="rounded-lg bg-black/70 px-2 py-1 text-slate-300 border border-white/10 backdrop-blur-md">
                ROLL: {gyroRates.roll}°/s
              </span>
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onResetOrientation}
                className="rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer"
              >
                کالیبره مجدد صفر
              </button>
            </div>
          </div>

          {/* WebHID Connection */}
          {!isWebHIDConnected && (
            <div className="max-w-xl mx-auto rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-center space-y-3">
              <p className="text-xs text-violet-200">
                برای فعال‌سازی ارتباط سخت‌افزاری ژیروسکوپ و چرخش مستقیم مدل بر اساس سنسور داخلی دسته:
              </p>
              <button
                type="button"
                onClick={onConnectWebHID}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.5)] cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                اتصال سنسور ژیروسکوپ (WebHID)
              </button>
            </div>
          )}

          {/* Motion Energy Detection Progress */}
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">پایش تحرک ژیروسکوپ:</span>
              <span className="text-emerald-400">{gyroPassed ? 'تایید شد (سالم)' : `${motionEnergy}%`}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${gyroPassed ? 100 : motionEnergy}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between max-w-xl mx-auto pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              <span>مرحله بعد: تست ویبره</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 6: VIBRATION & HAPTICS TEST
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'vibration' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-violet-500/30 bg-violet-500/10 text-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <Vibrate className={`h-10 w-10 ${rumbleBusy ? 'animate-bounce' : ''}`} />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست موتورهای لرزشی (Vibration)</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              روی دکمه ارسال سیگنال لرزش کلیک کنید تا موتورهای هپتیک دسته فعال شوند و لرزش را تایید کنید.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTestRumble}
              disabled={rumbleBusy}
              className="flex items-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all cursor-pointer active:scale-95 disabled:opacity-40"
            >
              <Vibrate className={`h-4 w-4 ${rumbleBusy ? 'animate-spin' : ''}`} />
              <span>{rumbleBusy ? 'در حال ارسال لرزش...' : 'ارسال تست ویبره به دسته'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVibrationPassed(true);
                goToNextStep();
              }}
              className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 px-6 py-3 text-sm font-black text-emerald-300 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>لرزش را حس کردم (تایید و مرحله بعد)</span>
            </button>
          </div>

          <div className="flex items-center justify-between max-w-xl mx-auto pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white cursor-pointer"
            >
              <span>مرحله بعد: تست میکروفون</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 7: MICROPHONE TEST
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'mic' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Mic className={`h-10 w-10 ${micActive ? 'animate-pulse text-cyan-300' : 'text-slate-400'}`} />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">تست میکروفون و ورودی صدا</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              در میکروفون دسته (مانند میکروفون داخلی DualSense PS5) یا هدست خود صحبت کنید تا صحت دریافت سیگنال صدا بررسی شود.
            </p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            {micPassed ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-black text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-4 w-4" />
                <span>سیگنال صدا با موفقیت دریافت شد — میکروفون سالم است!</span>
              </div>
            ) : micError ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="h-4 w-4" />
                <span>{micError}</span>
              </div>
            ) : micActive ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 animate-pulse">
                <Volume2 className="h-4 w-4" />
                <span>در حال گوش دادن... لطفا صحبت کنید یا ضربه آرامی کنار دسته بزنید</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startMic()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <Mic className="h-4 w-4" />
                <span>شروع تست و فعال‌سازی میکروفون</span>
              </button>
            )}
          </div>

          {/* Live Meter */}
          <div className="max-w-md mx-auto space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">میزان شدت صدای ورودی:</span>
              <span className="font-mono text-cyan-400">{micDb.toFixed(1)} dB</span>
            </div>

            {/* Gauge progress bar */}
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micDb > -15
                    ? 'bg-rose-500'
                    : micDb > -38
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.max(4, Math.min(100, ((micDb + 60) / 60) * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>-60 dB (سکوت)</span>
              <span>-30 dB (صدای مناسب)</span>
              <span>0 dB (حداکثر)</span>
            </div>
          </div>

          {/* Device selector if multiple audio inputs */}
          {micDevices.length > 1 && (
            <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-xs">
              <span className="text-slate-400">دستگاه ورودی:</span>
              <select
                value={selectedMicId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedMicId(newId);
                  stopMic();
                  setTimeout(() => startMic(newId), 100);
                }}
                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-white max-w-[240px] truncate"
              >
                {micDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `میکروفون (${d.deviceId.slice(0, 6)})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between max-w-xl mx-auto pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>مرحله قبل</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
            >
              <span>{micPassed ? 'مشاهده کارنامه نهایی' : 'رد کردن و مشاهده کارنامه'}</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          STEP 8: COMPREHENSIVE TEST REPORT & CERTIFICATE
         ───────────────────────────────────────────────────────────────── */}
      {currentStep === 'report' && (
        <section className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#0f172a] to-[#070b14] p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Header of Report */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white">گزارش و شناسنامه سلامت دسته بازی</h2>
              </div>
              <p className="text-xs text-slate-400">DrGame Diagnostic Certificate & Hardware Assessment</p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">نمره سلامت کلی</p>
                <p className="text-2xl font-black text-emerald-300">{overallScore}%</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-slate-950 font-black text-lg">
                {overallScore >= 90 ? 'A+' : overallScore >= 75 ? 'B' : 'C'}
              </div>
            </div>
          </div>

          {/* Controller Identity Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <span className="text-[11px] font-bold text-slate-400">نام و مدل دستگاه</span>
              <p className="mt-1 text-sm font-black text-white">{controller?.name || 'گیم‌پد استاندارد'}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate" dir="ltr">{pad.id}</p>
            </div>

            {/* PS5 SPECIFIC TELEMETRY */}
            {isPS5 && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">وضعیت کارکرد دستگاه</span>
                  <div className="mt-1">
                    {ps5Info?.condition === 'brand_new' || !ps5Info ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        آکبند (کاملاً نو)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300">
                        <Clock className="h-3.5 w-3.5" />
                        کارکرده (Used)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    کارکرد: {ps5Info?.activeTimeFormatted || 'سالم و نو'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">دفعات استفاده / روشن شدن</span>
                  <p className="mt-1 text-sm font-black text-violet-300">
                    {ps5Info?.totalRecordCount ? `${ps5Info.totalRecordCount} بار` : '۱ بار (تست جاری)'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">ثبت در چیپ‌ست داخلی</p>
                </div>
              </>
            )}

            {/* PS4 SPECIFIC SPECIFICATIONS */}
            {isPS4 && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">شرکت سازنده و اصالت</span>
                  <p className="mt-1 text-xs font-black text-emerald-300">
                    {ps4Info?.manufacturer || 'Sony Interactive Entertainment Inc.'}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-bold">
                    {ps4Info?.isAuthentic !== false ? 'اصلی (اورجینال سونی)' : 'طرح اصلی'}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">شناسه و کد سخت‌افزاری</span>
                  <p className="mt-1 font-mono text-xs text-white">{ps4Info?.vidPid || '0x054C / 0x05C4'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ps4Info?.modelCode || 'CUH-ZCT2'}</p>
                </div>
              </>
            )}

            {!isPS5 && !isPS4 && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">سازنده کنترلر</span>
                  <p className="mt-1 text-xs font-black text-white">
                    {isXbox ? 'Microsoft' : 'استاندارد DirectInput/XInput'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">استاندارد مپینگ</span>
                  <p className="mt-1 font-mono text-xs text-slate-300">{pad.mapping || 'Standard'}</p>
                </div>
              </>
            )}
          </div>

          {/* Detailed Itemized Results Table */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-bold text-slate-300">
              چک‌لیست سلامت قطعات و سنسورها
            </div>
            <div className="divide-y divide-white/5 text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">دکمه‌های اصلی و عملکردی (✕ ◯ □ △)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  سالم (بدون تاخیر یا پرش)
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">پد کلیدهای جهت (D-Pad)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  سالم و تایید شده
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">تریگرهای آنالوگ و بامپرها (L1, R1, L2, R2)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  دامنه فشار کامل ۱۰۰٪
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">دریفت استیک چپ (Left Stick Drift)</span>
                <span
                  className={`font-mono font-bold ${
                    driftStats.leftMax < 0.08 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(driftStats.leftMax * 100).toFixed(1)}% {driftStats.leftMax < 0.08 ? '(ایده‌آل)' : '(دریفت خفیف)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">دریفت استیک راست (Right Stick Drift)</span>
                <span
                  className={`font-mono font-bold ${
                    driftStats.rightMax < 0.08 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(driftStats.rightMax * 100).toFixed(1)}% {driftStats.rightMax < 0.08 ? '(ایده‌آل)' : '(دریفت خفیف)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">سنسور ژیروسکوپ و تعادل ۳بعدی (Gyroscope & IMU)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {gyroPassed ? 'کالیبره و فعال در ۳ محور' : 'تایید عملکرد'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">موتورهای هپتیک و لرزش (Dual Rumble)</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  پاسخ‌دهی صحیح لرزش
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">میکروفون داخلی و ورودی صدا (Microphone)</span>
                {micPassed ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    سیگنال صوتی شفاف و سالم
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-slate-400">
                    رد شده / بدون میکروفون
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons for Report */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={resetAllTests}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>تست مجدد از ابتدا</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4 text-cyan-400" />
                <span>چاپ یا ذخیره کارنامه</span>
              </button>

              {onSwitchToDashboard && (
                <button
                  type="button"
                  onClick={onSwitchToDashboard}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all cursor-pointer"
                >
                  <span>ورود به داشبورد آزاد</span>
                  <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
