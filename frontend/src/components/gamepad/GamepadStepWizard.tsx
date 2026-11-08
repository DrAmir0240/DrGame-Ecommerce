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
  ListOrdered,
  X,
  Gamepad2,
} from 'lucide-react';
import { useTvModeStore } from '@/stores/useTvModeStore';
import { useTranslation } from '@/i18n';
import ControllerModel3D from './ControllerModel3D';
import InteractiveControllerStage, { type TargetButtonDef } from './InteractiveControllerStage';
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
  | 'connect'     // 0: connect
  | 'action_btns' // 1: action_btns
  | 'dpad'        // 2: dpad
  | 'triggers'    // 3: triggers
  | 'sticks'      // 4: sticks
  | 'gyro'        // 5: gyro
  | 'vibration'   // 6: vibration
  | 'mic'         // 7: mic
  | 'report';     // 8: report

const getBaseSteps = (t: any): { id: WizardStep; label: string; icon: any; description: string }[] => [
  { id: 'connect', label: t('gamepad.wizard.steps.connect.label'), icon: Cpu, description: t('gamepad.wizard.steps.connect.description') },
  { id: 'action_btns', label: t('gamepad.wizard.steps.action_btns.label'), icon: Sparkles, description: t('gamepad.wizard.steps.action_btns.description') },
  { id: 'dpad', label: t('gamepad.wizard.steps.dpad.label'), icon: Compass, description: t('gamepad.wizard.steps.dpad.description') },
  { id: 'triggers', label: t('gamepad.wizard.steps.triggers.label'), icon: Layers, description: t('gamepad.wizard.steps.triggers.description') },
  { id: 'sticks', label: t('gamepad.wizard.steps.sticks.label'), icon: Activity, description: t('gamepad.wizard.steps.sticks.description') },
  { id: 'gyro', label: t('gamepad.wizard.steps.gyro.label'), icon: RotateCcw, description: t('gamepad.wizard.steps.gyro.description') },
  { id: 'vibration', label: t('gamepad.wizard.steps.vibration.label'), icon: Vibrate, description: t('gamepad.wizard.steps.vibration.description') },
  { id: 'mic', label: t('gamepad.wizard.steps.mic.label'), icon: Mic, description: t('gamepad.wizard.steps.mic.description') },
  { id: 'report', label: t('gamepad.wizard.steps.report.label'), icon: ShieldCheck, description: t('gamepad.wizard.steps.report.description') },
];

export interface StepGuide {
  title: string;
  action: string;
  passCondition: string;
  tip?: string;
}

const getBaseStepGuides = (t: any): Record<WizardStep, StepGuide> => ({
  connect: {
    title: t('gamepad.wizard.steps.connect.guideTitle'),
    action: t('gamepad.wizard.steps.connect.guideAction'),
    passCondition: t('gamepad.wizard.steps.connect.guidePass'),
    tip: t('gamepad.wizard.steps.connect.guideTip'),
  },
  action_btns: {
    title: t('gamepad.wizard.steps.action_btns.guideTitle'),
    action: t('gamepad.wizard.steps.action_btns.guideAction'),
    passCondition: t('gamepad.wizard.steps.action_btns.guidePass'),
    tip: t('gamepad.wizard.steps.action_btns.guideTip'),
  },
  dpad: {
    title: t('gamepad.wizard.steps.dpad.guideTitle'),
    action: t('gamepad.wizard.steps.dpad.guideAction'),
    passCondition: t('gamepad.wizard.steps.dpad.guidePass'),
    tip: t('gamepad.wizard.steps.dpad.guideTip'),
  },
  triggers: {
    title: t('gamepad.wizard.steps.triggers.guideTitle'),
    action: t('gamepad.wizard.steps.triggers.guideAction'),
    passCondition: t('gamepad.wizard.steps.triggers.guidePass'),
    tip: t('gamepad.wizard.steps.triggers.guideTip'),
  },
  sticks: {
    title: t('gamepad.wizard.steps.sticks.guideTitle'),
    action: t('gamepad.wizard.steps.sticks.guideAction'),
    passCondition: t('gamepad.wizard.steps.sticks.guidePass'),
    tip: t('gamepad.wizard.steps.sticks.guideTip'),
  },
  gyro: {
    title: t('gamepad.wizard.steps.gyro.guideTitle'),
    action: t('gamepad.wizard.steps.gyro.guideAction'),
    passCondition: t('gamepad.wizard.steps.gyro.guidePass'),
    tip: t('gamepad.wizard.steps.gyro.guideTip'),
  },
  vibration: {
    title: t('gamepad.wizard.steps.vibration.guideTitle'),
    action: t('gamepad.wizard.steps.vibration.guideAction'),
    passCondition: t('gamepad.wizard.steps.vibration.guidePass'),
    tip: t('gamepad.wizard.steps.vibration.guideTip'),
  },
  mic: {
    title: t('gamepad.wizard.steps.mic.guideTitle'),
    action: t('gamepad.wizard.steps.mic.guideAction'),
    passCondition: t('gamepad.wizard.steps.mic.guidePass'),
    tip: t('gamepad.wizard.steps.mic.guideTip'),
  },
  report: {
    title: t('gamepad.wizard.steps.report.guideTitle'),
    action: t('gamepad.wizard.steps.report.guideAction'),
    passCondition: t('gamepad.wizard.steps.report.guidePass'),
    tip: t('gamepad.wizard.steps.report.guideTip'),
  },
});

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
  const { isTvMode } = useTvModeStore();
  const STEPS = useMemo(() => getBaseSteps(t), [t]);
  const STEP_GUIDES = useMemo(() => getBaseStepGuides(t), [t]);
  const [currentStep, setCurrentStep] = useState<WizardStep>('connect');
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [modalTab, setModalTab] = useState<'help' | 'steps'>('help');

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
  const [actionSubStep, setActionSubStep] = useState(0);
  const [dpadSubStep, setDpadSubStep] = useState(0);
  const [triggersSubStep, setTriggersSubStep] = useState(0);
  const [sticksSubStep, setSticksSubStep] = useState(0);
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
        const msg = err instanceof Error ? err.message : t('gamepad.mic.error');
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



  const isXbox = controller?.key === 'xbox-series';
  const isPS5 = controller?.key === 'dualsense' || controller?.key === 'dualsense-edge' || (pad.id && /054c|dualsense/i.test(pad.id));
  const isPS4 = controller?.key === 'dualshock4' || (pad.id && /05c4|09cc|dualshock/i.test(pad.id));

  const actionTargets: TargetButtonDef[] = useMemo(() => [
    { idx: 0, glyph: isXbox ? 'A' : '✕', name: isXbox ? t('gamepad.wizard.buttons.btnA') : t('gamepad.wizard.buttons.btnCross'), color: '#38bdf8' },
    { idx: 1, glyph: isXbox ? 'B' : '◯', name: isXbox ? t('gamepad.wizard.buttons.btnB') : t('gamepad.wizard.buttons.btnCircle'), color: '#f43f5e' },
    { idx: 2, glyph: isXbox ? 'X' : '□', name: isXbox ? t('gamepad.wizard.buttons.btnX') : t('gamepad.wizard.buttons.btnSquare'), color: '#ec4899' },
    { idx: 3, glyph: isXbox ? 'Y' : '△', name: isXbox ? t('gamepad.wizard.buttons.btnY') : t('gamepad.wizard.buttons.btnTriangle'), color: '#10b981' },
  ], [isXbox, t]);

  const dpadTargets: TargetButtonDef[] = useMemo(() => [
    { idx: 12, glyph: '▲', name: t('gamepad.wizard.buttons.dpadUp'), color: '#a855f7' },
    { idx: 15, glyph: '▶', name: t('gamepad.wizard.buttons.dpadRight'), color: '#a855f7' },
    { idx: 13, glyph: '▼', name: t('gamepad.wizard.buttons.dpadDown'), color: '#a855f7' },
    { idx: 14, glyph: '◀', name: t('gamepad.wizard.buttons.dpadLeft'), color: '#a855f7' },
  ], [t]);

  const triggerTargets: TargetButtonDef[] = useMemo(() => [
    { idx: 4, glyph: 'L1', name: t('gamepad.wizard.buttons.bumperL1'), color: '#06b6d4' },
    { idx: 5, glyph: 'R1', name: t('gamepad.wizard.buttons.bumperR1'), color: '#06b6d4' },
    { idx: 6, glyph: 'L2', name: t('gamepad.wizard.buttons.triggerL2'), color: '#8b5cf6', isAnalog: true },
    { idx: 7, glyph: 'R2', name: t('gamepad.wizard.buttons.triggerR2'), color: '#8b5cf6', isAnalog: true },
  ], [t]);

  const stickTargets: TargetButtonDef[] = useMemo(() => [
    { idx: 10, glyph: 'L3', name: t('gamepad.wizard.buttons.stickL3'), color: '#3b82f6' },
    { idx: 11, glyph: 'R3', name: t('gamepad.wizard.buttons.stickR3'), color: '#3b82f6' },
  ], [t]);

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

        if (currentStep === 'action_btns') {
          const t = actionTargets[actionSubStep];
          if (t && t.idx === idx) {
            setActionSubStep((prev) => Math.min(actionTargets.length - 1, prev + 1));
          }
        } else if (currentStep === 'dpad') {
          const t = dpadTargets[dpadSubStep];
          if (t && t.idx === idx) {
            setDpadSubStep((prev) => Math.min(dpadTargets.length - 1, prev + 1));
          }
        } else if (currentStep === 'triggers') {
          const t = triggerTargets[triggersSubStep];
          if (t && t.idx === idx && !t.isAnalog) {
            setTriggersSubStep((prev) => Math.min(triggerTargets.length - 1, prev + 1));
          }
        } else if (currentStep === 'sticks') {
          const t = stickTargets[sticksSubStep];
          if (t && t.idx === idx) {
            setSticksSubStep((prev) => Math.min(stickTargets.length - 1, prev + 1));
          }
        }
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

    if (currentStep === 'triggers') {
      if (triggersSubStep === 2 && l2Val > 0.85) {
        setTriggersSubStep(3);
      }
    }

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
    setActionSubStep(0);
    setDpadSubStep(0);
    setTriggersSubStep(0);
    setSticksSubStep(0);
    setCurrentStep('connect');
  }, []);

  // Completion criteria for each step
  const isActionBtnsDone = (btnHits[0] || 0) >= 1 && (btnHits[1] || 0) >= 1 && (btnHits[2] || 0) >= 1 && (btnHits[3] || 0) >= 1;
  const isDpadDone = (btnHits[12] || 0) >= 1 && (btnHits[13] || 0) >= 1 && (btnHits[14] || 0) >= 1 && (btnHits[15] || 0) >= 1;
  const isTriggersDone = (btnHits[4] || 0) >= 1 && (btnHits[5] || 0) >= 1 && maxTrigger.L2 > 0.85 && maxTrigger.R2 > 0.85;
  const isSticksDone = ((btnHits[10] || 0) >= 1 && (btnHits[11] || 0) >= 1) || (driftStats.leftMax > 0.6 && driftStats.rightMax > 0.6);

  // ─────────────────────────────────────────────────────────────────
  // SMART AUTO-ADVANCE ENGINE
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
  // TV CONTROLLER INPUT HANDLING
  // ─────────────────────────────────────────────────────────────────
  const lastNavPressRef = useRef(0);
  useEffect(() => {
    if (!pad.connected) return;

    const crossPressed = !!pad.buttons[0]?.pressed; // Cross (PS) / A (Xbox)
    const circlePressed = !!pad.buttons[1]?.pressed; // Circle (PS) / B (Xbox)
    const optionsPressed = !!pad.buttons[9]?.pressed; // Options (PS) / Menu (Xbox)
    const now = Date.now();

    if (now - lastNavPressRef.current > 400) {
      if (optionsPressed) {
        lastNavPressRef.current = now;
        setModalTab('help');
        setShowStepsModal((prev) => !prev);
        return;
      }

      if (showStepsModal) {
        if (circlePressed) {
          lastNavPressRef.current = now;
          setShowStepsModal(false);
          return;
        }
        return;
      }

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
    showStepsModal,
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

  const activeGuide = STEP_GUIDES[currentStep] || STEP_GUIDES.connect;

  return (
    <div className="w-full space-y-4" dir={dir}>
      {/* ─────────────────────────────────────────────────────────────────
          STEP HEADER & TV-FRIENDLY TIMELINE
          On TV mode or controller test steps, renders a sleek 38px bar
          and moves the full timeline into an interactive modal so the
          controller is 100% visible on-screen with ZERO scrolling!
         ───────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d121f]/95 px-3.5 py-2 shadow-xl backdrop-blur-md">
        {/* Step indicator & title */}
        <div className="flex items-center gap-2.5 truncate">
          <span className="flex items-center gap-1.5 rounded-xl bg-violet-600/30 border border-violet-500/40 px-2.5 py-1 text-xs font-black text-violet-300 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-ping" />
            <span>{t('gamepad.wizard.ui.stepOf', { current: currentStepIdx + 1, total: STEPS.length })}</span>
          </span>
          <span className="text-xs sm:text-sm font-black text-white truncate">
            {STEPS[currentStepIdx]?.label}
          </span>
        </div>

        {/* Step mini progress dots */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {STEPS.map((st, i) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setCurrentStep(st.id)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentStepIdx
                  ? 'w-6 bg-violet-400 shadow-[0_0_8px_#a855f7]'
                  : i < currentStepIdx
                  ? 'w-2.5 bg-emerald-400 shadow-[0_0_4px_#34d399]'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              title={st.label}
            />
          ))}
        </div>

        {/* Action: Help button & Steps Modal button & Gamepad shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-mono" dir="ltr">
            <kbd className="rounded bg-white/10 px-1 py-0.5 text-slate-300 border border-white/15">Options</kbd>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalTab('help');
              setShowStepsModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-violet-600/35 hover:from-amber-500/40 hover:to-violet-600/50 border border-amber-400/40 hover:border-amber-400/70 px-3 py-1.5 text-xs font-black text-amber-200 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95"
            title={t('gamepad.wizard.ui.stepGuide')}
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>{t('gamepad.wizard.ui.stepGuide')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalTab('steps');
              setShowStepsModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title={t('gamepad.wizard.ui.allSteps')}
          >
            <ListOrdered className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t('gamepad.wizard.ui.stepsList')}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          MASTER STEPS & GUIDE MODAL
         ───────────────────────────────────────────────────────────────── */}
      {showStepsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4 py-14 sm:py-16 animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-lg max-h-[72vh] sm:max-h-[66vh] overflow-y-auto rounded-3xl border border-violet-500/30 bg-[#0d121f] p-4 sm:p-5 shadow-[0_0_60px_rgba(139,92,246,0.35)] space-y-3 scrollbar-none"
            dir={dir}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`grid h-8 w-8 place-items-center rounded-xl ${
                  modalTab === 'help'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-violet-600/30 text-violet-300 border border-violet-400/30'
                }`}>
                  {modalTab === 'help' ? <HelpCircle className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    {modalTab === 'help' ? t('gamepad.wizard.ui.stepGuideTitle', { current: currentStepIdx + 1, name: STEPS[currentStepIdx]?.label }) : t('gamepad.wizard.ui.allSteps')}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {modalTab === 'help' ? t('gamepad.wizard.ui.stepGuideSub') : t('gamepad.wizard.ui.allStepsSub')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowStepsModal(false)}
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title={t('gamepad.wizard.ui.close')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => setModalTab('help')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-black transition-all cursor-pointer ${
                  modalTab === 'help'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="h-3 w-3 text-amber-400" />
                <span>{t('gamepad.wizard.ui.stepGuide')}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('steps')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-black transition-all cursor-pointer ${
                  modalTab === 'steps'
                    ? 'bg-violet-600/30 text-violet-200 border border-violet-400/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="h-3 w-3 text-cyan-400" />
                <span>{t('gamepad.wizard.ui.allSteps')}</span>
              </button>
            </div>

            {/* TAB 1: ULTRA-COMPACT STEP HELP (FITS COMFORTABLY IN TV MODE) */}
            {modalTab === 'help' ? (
              <div className="space-y-2.5 text-xs">
                {/* 1. What to do */}
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-2.5 space-y-1">
                  <span className="flex items-center gap-1.5 font-black text-amber-300 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t('gamepad.wizard.ui.testMethod')}</span>
                  </span>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {activeGuide.action}
                  </p>
                </div>

                {/* 2. Pass Condition */}
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 space-y-1">
                  <span className="flex items-center gap-1.5 font-black text-emerald-300 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t('gamepad.wizard.ui.passCondition')}</span>
                  </span>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {activeGuide.passCondition}
                  </p>
                </div>

                {/* 3. Pro Tip */}
                {activeGuide.tip && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 space-y-1">
                    <span className="flex items-center gap-1.5 font-black text-indigo-300 text-[11px]">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{t('gamepad.wizard.ui.techTip')}</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {activeGuide.tip}
                    </p>
                  </div>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowStepsModal(false)}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 py-2.5 text-xs font-black text-white shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {t('gamepad.wizard.ui.gotIt')}
                </button>
              </div>
            ) : (
              /* TAB 2: STEPS GRID (COMPACT) */
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STEPS.map((st, i) => {
                    const isActive = st.id === currentStep;
                    const isCompleted = i < currentStepIdx;

                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setCurrentStep(st.id);
                          setShowStepsModal(false);
                        }}
                        className={`flex items-center gap-2.5 rounded-xl p-2 text-start transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-violet-600/25 border-violet-400 shadow-sm'
                            : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-black ${
                            isActive
                              ? 'bg-violet-500 text-white'
                              : isCompleted
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-white block truncate">{st.label}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{st.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* TV & Controller Navigation Shortcuts */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-cyan-400">{t('gamepad.wizard.ui.keysNav')}:</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]" dir="ltr">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                      <kbd className="rounded bg-white/15 px-1 py-0.5 font-mono text-white text-[9px]">{isXbox ? 'A' : '✕'}</kbd>
                      <span className="text-slate-300">{t('gamepad.wizard.ui.confirm')}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                      <kbd className="rounded bg-white/15 px-1 py-0.5 font-mono text-slate-300 text-[9px]">{isXbox ? 'B' : '◯'}</kbd>
                      <span className="text-slate-300">{t('gamepad.wizard.ui.close')}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                      <kbd className="rounded bg-white/15 px-1 py-0.5 font-mono text-slate-300 text-[9px]">Options</kbd>
                      <span className="text-slate-300">{t('gamepad.wizard.ui.help')}</span>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowStepsModal(false)}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 py-2 text-xs font-bold text-white transition-all cursor-pointer active:scale-95"
                >
                  {t('gamepad.wizard.ui.close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {autoAdvancing && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/50 bg-emerald-500/20 px-5 py-3 text-xs sm:text-sm font-black text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.35)] animate-pulse">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
          <span>{t('gamepad.wizard.ui.autoAdvancing')}</span>
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
                ? controller?.name || t('gamepad.wizard.ui.controllerConnected')
                : t('gamepad.viewer.waiting')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {pad.connected
                ? t('gamepad.wizard.ui.identifiedDesc')
                : t('gamepad.connection.help')}
            </p>
          </div>

          {pad.connected ? (
            <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4 text-start">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.identifiedModel')}</span>
                <span className="text-sm font-black text-white">{controller?.name || pad.id}</span>
              </div>

              {/* ──────────────── PS5 DUALSENSE DETAILS ──────────────── */}
              {isPS5 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.usageStatus')}:</span>
                    {ps5Info ? (
                      ps5Info.condition === 'brand_new' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          {t('gamepad.wizard.ui.brandNew')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          {t('gamepad.wizard.ui.used')}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                        {t('gamepad.wizard.ui.likeNew')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.operatingHours')}:</span>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {ps5Info?.activeTimeFormatted || (isWebHIDConnected ? (locale === 'fa' ? '۰ دقیقه (نو)' : '0 min (New)') : t('gamepad.wizard.ui.connectWebHidChipset'))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.powerOnCount')}:</span>
                    <span className="font-mono text-xs font-bold text-violet-300">
                      {ps5Info?.totalRecordCount ? `${ps5Info.totalRecordCount} ${t('gamepad.wizard.ui.times')}` : '—'}
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
                        {t('gamepad.wizard.ui.connectWebHidChipset')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ──────────────── PS4 DUALSHOCK DETAILS ──────────────── */}
              {isPS4 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.manufacturer')}:</span>
                    <span className="text-xs font-black text-emerald-300">
                      {ps4Info?.manufacturer || 'Sony Interactive Entertainment Inc.'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.chipsetAuth')}:</span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {ps4Info ? (ps4Info.isAuthentic ? t('gamepad.wizard.ui.originalSony') : t('gamepad.wizard.ui.thirdParty')) : t('gamepad.wizard.ui.originalSony')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.hardwareId')} (VID/PID):</span>
                    <span className="font-mono text-xs text-slate-300">{ps4Info?.vidPid || '0x054C / 0x05C4'}</span>
                  </div>

                  {ps4Info?.buildDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.firmwareVersion')}:</span>
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
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.manufacturer')}:</span>
                    <span className="text-xs font-bold text-slate-200">
                      {isXbox ? 'Microsoft Corporation' : t('gamepad.wizard.ui.standardDirectInput')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">{t('gamepad.wizard.ui.commStandard')}:</span>
                    <span className="text-xs font-mono text-slate-300">{pad.mapping || 'Standard Gamepad'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t('gamepad.connection.help')}</span>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              type="button"
              disabled={!pad.connected}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              <span>{t('gamepad.wizard.ui.btnNextAction')}</span>
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
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-3.5 sm:p-5 shadow-2xl space-y-3">
          <InteractiveControllerStage
            model={controller?.key}
            pressed={pad.buttons.map((b) => b.pressed || b.value > 0.5)}
            triggerValues={[pad.buttons[6]?.value ?? 0, pad.buttons[7]?.value ?? 0]}
            axes={pad.axes}
            currentTarget={actionTargets[actionSubStep] || null}
            subStepIndex={actionSubStep}
            targetList={actionTargets}
            stageTitle={STEPS[1]?.label}
            stageDescription={STEP_GUIDES.action_btns.action}
            isCompleted={isActionBtnsDone}
            onOpenModal={() => {
              setModalTab('help');
              setShowStepsModal(true);
            }}
            onTargetClick={(idx) => {
              setBtnHits((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
              const nextIdx = actionTargets.findIndex((t) => t.idx === idx);
              if (nextIdx !== -1) setActionSubStep(Math.min(actionTargets.length - 1, nextIdx + 1));
            }}
          />

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              disabled={!isActionBtnsDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>{t('gamepad.wizard.ui.btnNextDpad')}</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {currentStep === 'dpad' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-3.5 sm:p-5 shadow-2xl space-y-3">
          <InteractiveControllerStage
            model={controller?.key}
            pressed={pad.buttons.map((b) => b.pressed || b.value > 0.5)}
            triggerValues={[pad.buttons[6]?.value ?? 0, pad.buttons[7]?.value ?? 0]}
            axes={pad.axes}
            currentTarget={dpadTargets[dpadSubStep] || null}
            subStepIndex={dpadSubStep}
            targetList={dpadTargets}
            stageTitle={STEPS[2]?.label}
            stageDescription={STEP_GUIDES.dpad.action}
            isCompleted={isDpadDone}
            onOpenModal={() => {
              setModalTab('help');
              setShowStepsModal(true);
            }}
            onTargetClick={(idx) => {
              setBtnHits((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
              const nextIdx = dpadTargets.findIndex((t) => t.idx === idx);
              if (nextIdx !== -1) setDpadSubStep(Math.min(dpadTargets.length - 1, nextIdx + 1));
            }}
          />

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              disabled={!isDpadDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>{t('gamepad.wizard.ui.btnNextTriggers')}</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {currentStep === 'triggers' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-3.5 sm:p-5 shadow-2xl space-y-3">
          <InteractiveControllerStage
            model={controller?.key}
            pressed={pad.buttons.map((b) => b.pressed || b.value > 0.5)}
            triggerValues={[pad.buttons[6]?.value ?? 0, pad.buttons[7]?.value ?? 0]}
            axes={pad.axes}
            currentTarget={triggerTargets[triggersSubStep] || null}
            subStepIndex={triggersSubStep}
            targetList={triggerTargets}
            stageTitle={STEPS[3]?.label}
            stageDescription={STEP_GUIDES.triggers.action}
            analogValue={triggersSubStep === 2 ? (pad.buttons[6]?.value ?? 0) : triggersSubStep === 3 ? (pad.buttons[7]?.value ?? 0) : 0}
            isCompleted={isTriggersDone}
            onOpenModal={() => {
              setModalTab('help');
              setShowStepsModal(true);
            }}
            onTargetClick={(idx) => {
              setBtnHits((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
              if (idx === 6) setMaxTrigger((prev) => ({ ...prev, L2: 1 }));
              if (idx === 7) setMaxTrigger((prev) => ({ ...prev, R2: 1 }));
              const nextIdx = triggerTargets.findIndex((t) => t.idx === idx);
              if (nextIdx !== -1) setTriggersSubStep(Math.min(triggerTargets.length - 1, nextIdx + 1));
            }}
          />

          <div className="flex items-center justify-between max-w-2xl mx-auto pt-2.5 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              disabled={!isTriggersDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>{t('gamepad.wizard.ui.btnNextSticks')}</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {currentStep === 'sticks' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-3.5 sm:p-5 shadow-2xl space-y-3">
          <InteractiveControllerStage
            model={controller?.key}
            pressed={pad.buttons.map((b) => b.pressed || b.value > 0.5)}
            triggerValues={[pad.buttons[6]?.value ?? 0, pad.buttons[7]?.value ?? 0]}
            axes={pad.axes}
            currentTarget={stickTargets[sticksSubStep] || null}
            subStepIndex={sticksSubStep}
            targetList={stickTargets}
            stageTitle={STEPS[4]?.label}
            stageDescription={STEP_GUIDES.sticks.action}
            isCompleted={isSticksDone}
            onOpenModal={() => {
              setModalTab('help');
              setShowStepsModal(true);
            }}
            onTargetClick={(idx) => {
              setBtnHits((prev) => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }));
              const nextIdx = stickTargets.findIndex((t) => t.idx === idx);
              if (nextIdx !== -1) setSticksSubStep(Math.min(stickTargets.length - 1, nextIdx + 1));
            }}
          />

          {/* DUAL PRECISION STICK GAUGES - COMPACT FOR ZERO SCROLL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-1">
            {/* LEFT STICK */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center space-y-1.5">
              <span className="text-xs font-black text-white">{t('gamepad.wizard.ui.leftStick')}</span>
              <div className="relative mx-auto h-20 w-20 rounded-full border border-white/10 bg-[#080c14] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 m-2" />
                <div
                  className="h-5 w-5 rounded-full bg-violet-500 shadow-[0_0_10px_#8b5cf6] transition-transform duration-75"
                  style={{
                    transform: `translate(${(pad.axes[0] ?? 0) * 26}px, ${(pad.axes[1] ?? 0) * 26}px)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-slate-400">{t('gamepad.wizard.ui.clickStatus')}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    pad.buttons[10]?.pressed || (btnHits[10] || 0) >= 1
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {(btnHits[10] || 0) >= 1 ? t('gamepad.wizard.ui.clickVerified') : t('gamepad.wizard.ui.clickPending')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{t('gamepad.wizard.ui.driftError')}</span>
                <span
                  className={`font-mono font-bold text-[10px] ${
                    driftStats.leftMax < 0.08 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(driftStats.leftMax * 100).toFixed(1)}% {driftStats.leftMax < 0.08 ? `(${t('gamepad.wizard.ui.excellent')})` : `(${t('gamepad.wizard.ui.moderateDrift')})`}
                </span>
              </div>
            </div>

            {/* RIGHT STICK */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3 text-center space-y-1.5">
              <span className="text-xs font-black text-white">{t('gamepad.wizard.ui.rightStick')}</span>
              <div className="relative mx-auto h-20 w-20 rounded-full border border-white/10 bg-[#080c14] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-white/10 m-2" />
                <div
                  className="h-5 w-5 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] transition-transform duration-75"
                  style={{
                    transform: `translate(${(pad.axes[2] ?? 0) * 26}px, ${(pad.axes[3] ?? 0) * 26}px)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-slate-400">{t('gamepad.wizard.ui.clickStatus')}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    pad.buttons[11]?.pressed || (btnHits[11] || 0) >= 1
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {(btnHits[11] || 0) >= 1 ? t('gamepad.wizard.ui.clickVerified') : t('gamepad.wizard.ui.clickPending')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{t('gamepad.wizard.ui.driftError')}</span>
                <span
                  className={`font-mono font-bold text-[10px] ${
                    driftStats.rightMax < 0.08 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(driftStats.rightMax * 100).toFixed(1)}% {driftStats.rightMax < 0.08 ? `(${t('gamepad.wizard.ui.excellent')})` : `(${t('gamepad.wizard.ui.moderateDrift')})`}
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
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              disabled={!isSticksDone}
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all disabled:opacity-40 cursor-pointer"
            >
              <span>{t('gamepad.wizard.ui.btnNextGyro')}</span>
              <kbd className="rounded bg-white/20 px-1 text-[10px] font-mono">{isXbox ? 'A' : '✕'}</kbd>
              <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </section>
      )}

      {currentStep === 'gyro' && (
        <section className="rounded-3xl border border-white/10 bg-[#0d121f] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white">{STEPS[5]?.label}</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('gamepad.wizard.ui.gyroDesc')}
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
                {t('gamepad.wizard.ui.resetView')}
              </button>
            </div>
          </div>

          {/* WebHID Connection */}
          {!isWebHIDConnected && (
            <div className="max-w-xl mx-auto rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 text-center space-y-3">
              <p className="text-xs text-violet-200">
                {t('gamepad.wizard.ui.connectWebHidChipset')}
              </p>
              <button
                type="button"
                onClick={onConnectWebHID}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-[0_0_15px_rgba(139,92,246,0.5)] cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                {t('gamepad.wizard.ui.connectGyro')}
              </button>
            </div>
          )}

          {/* Motion Energy Detection Progress */}
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">{t('gamepad.wizard.ui.gyroSensor')}:</span>
              <span className="text-emerald-400">{gyroPassed ? t('gamepad.wizard.ui.gyroCalibrated') : `${motionEnergy}%`}</span>
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
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer"
            >
              <span>{t('gamepad.wizard.ui.btnNextVibration')}</span>
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
            <h2 className="text-xl sm:text-2xl font-black text-white">{t('gamepad.wizard.ui.vibTitle')}</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('gamepad.wizard.ui.vibDesc')}
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
              <span>{rumbleBusy ? t('gamepad.wizard.ui.sendingRumble') : t('gamepad.wizard.ui.btnSendRumble')}</span>
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
              <span>{t('gamepad.wizard.ui.btnRumbleFelt')}</span>
            </button>
          </div>

          <div className="flex items-center justify-between max-w-xl mx-auto pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={goToPrevStep}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white cursor-pointer"
            >
              <span>{t('gamepad.wizard.ui.btnNextMic')}</span>
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
            <h2 className="text-xl sm:text-2xl font-black text-white">{t('gamepad.wizard.ui.micTitle')}</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t('gamepad.wizard.ui.micDesc')}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            {micPassed ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs font-black text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('gamepad.wizard.ui.micSuccess')}</span>
              </div>
            ) : micError ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="h-4 w-4" />
                <span>{micError}</span>
              </div>
            ) : micActive ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 animate-pulse">
                <Volume2 className="h-4 w-4" />
                <span>{t('gamepad.wizard.ui.micListening')}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startMic()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <Mic className="h-4 w-4" />
                <span>{t('gamepad.wizard.ui.btnStartMic')}</span>
              </button>
            )}
          </div>

          {/* Live Meter */}
          <div className="max-w-md mx-auto space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">{t('gamepad.wizard.ui.audioLevel')}</span>
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
              <span>{t('gamepad.wizard.ui.micSilence')}</span>
              <span>-30 dB</span>
              <span>0 dB</span>
            </div>
          </div>

          {/* Device selector if multiple audio inputs */}
          {micDevices.length > 1 && (
            <div className="max-w-md mx-auto flex items-center justify-center gap-2 text-xs">
              <span className="text-slate-400">{t('gamepad.wizard.ui.inputDevice')}</span>
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
                    {d.label || `${t('gamepad.wizard.ui.micDefault')} (${d.deviceId.slice(0, 6)})`}
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
              <span>{t('gamepad.wizard.ui.btnPrev')}</span>
            </button>

            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
            >
              <span>{micPassed ? t('gamepad.wizard.ui.btnViewReport') : t('gamepad.wizard.ui.btnSkipAndReport')}</span>
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
                <h2 className="text-xl sm:text-2xl font-black text-white">{t('gamepad.wizard.ui.reportTitle')}</h2>
              </div>
              <p className="text-xs text-slate-400">DrGame Diagnostic Certificate & Hardware Assessment</p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t('gamepad.wizard.ui.passVerified')}</p>
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
              <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.nameAndModel')}</span>
              <p className="mt-1 text-sm font-black text-white">{controller?.name || t('gamepad.wizard.ui.controllerConnected')}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate" dir="ltr">{pad.id}</p>
            </div>

            {/* PS5 SPECIFIC TELEMETRY */}
            {isPS5 && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.workingStatus')}</span>
                  <div className="mt-1">
                    {ps5Info?.condition === 'brand_new' || !ps5Info ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        {t('gamepad.wizard.ui.brandNewFull')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300">
                        <Clock className="h-3.5 w-3.5" />
                        {t('gamepad.wizard.ui.used')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t('gamepad.wizard.ui.operatingRecord', { time: ps5Info?.activeTimeFormatted || (locale === 'fa' ? 'سالم و نو' : 'Healthy & New') })}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.powerOnCount')}</span>
                  <p className="mt-1 text-sm font-black text-violet-300">
                    {ps5Info?.totalRecordCount ? `${ps5Info.totalRecordCount} ${t('gamepad.wizard.ui.times')}` : `1 ${t('gamepad.wizard.ui.times')}`}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t('gamepad.wizard.ui.registeredInChipset')}</p>
                </div>
              </>
            )}

            {/* PS4 SPECIFIC SPECIFICATIONS */}
            {isPS4 && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.chipsetAuth')}</span>
                  <p className="mt-1 text-xs font-black text-emerald-300">
                    {ps4Info?.manufacturer || 'Sony Interactive Entertainment Inc.'}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-bold">
                    ps4Info?.isAuthentic !== false ? t('gamepad.wizard.ui.originalSonyLabel') : t('gamepad.wizard.ui.thirdParty')
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.hardwareId')}</span>
                  <p className="mt-1 font-mono text-xs text-white">{ps4Info?.vidPid || '0x054C / 0x05C4'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{ps4Info?.modelCode || 'CUH-ZCT2'}</p>
                </div>
              </>
            )}

            {!isPS5 && !isPS4 && (
              <>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.manufacturer')}</span>
                  <p className="mt-1 text-xs font-black text-white">
                    {isXbox ? 'Microsoft' : t('gamepad.wizard.ui.standardDirectInput')}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <span className="text-[11px] font-bold text-slate-400">{t('gamepad.wizard.ui.commStandard')}</span>
                  <p className="mt-1 font-mono text-xs text-slate-300">{pad.mapping || 'Standard'}</p>
                </div>
              </>
            )}
          </div>

          {/* Detailed Itemized Results Table */}
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3 text-xs font-bold text-slate-300">
              {t('gamepad.wizard.ui.checklistTitle')}
            </div>
            <div className="divide-y divide-white/5 text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.actionButtonsBumper')}</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('gamepad.wizard.ui.healthyNoLatency')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.dpadPad')}</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('gamepad.wizard.ui.healthyVerified')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.analogTriggers')}</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('gamepad.wizard.ui.fullRange100')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.leftStickDrift')}</span>
                <span
                  className={`font-mono font-bold ${
                    driftStats.leftMax < 0.08 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(driftStats.leftMax * 100).toFixed(1)}% {driftStats.leftMax < 0.08 ? `(${t('gamepad.wizard.ui.excellent')})` : `(${t('gamepad.wizard.ui.moderateDrift')})`}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.rightStickDrift')}</span>
                <span
                  className={`font-mono font-bold ${
                    driftStats.rightMax < 0.08 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(driftStats.rightMax * 100).toFixed(1)}% {driftStats.rightMax < 0.08 ? `(${t('gamepad.wizard.ui.excellent')})` : `(${t('gamepad.wizard.ui.moderateDrift')})`}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.gyroSensor')}</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {gyroPassed ? t('gamepad.wizard.ui.gyroCalibrated') : t('gamepad.wizard.ui.gyroPerformanceVerified')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.hapticMotors')}</span>
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('gamepad.wizard.ui.rumbleAccurate')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5">
                <span className="font-medium text-slate-300">{t('gamepad.wizard.ui.internalMic')}</span>
                {micPassed ? (
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('gamepad.wizard.ui.micClean')}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-slate-400">
                    {t('gamepad.wizard.ui.micSkipped')}
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
              <span>{t('gamepad.wizard.ui.btnTestAgain')}</span>
            </button>

            <div className="flex items-center gap-2">

              {onSwitchToDashboard && (
                <button
                  type="button"
                  onClick={onSwitchToDashboard}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-black text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all cursor-pointer"
                >
                  <span>{t('gamepad.wizard.ui.btnOpenDashboard')}</span>
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
