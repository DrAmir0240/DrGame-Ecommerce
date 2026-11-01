'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Radius (0..1) of each stick measured while the user is not touching them. */
export interface DriftSample {
  leftMax: number;
  leftAvg: number;
  rightMax: number;
  rightAvg: number;
}

export interface PadButton {
  pressed: boolean;
  value: number;
  touched?: boolean;
}

export interface PadSnapshot {
  connected: boolean;
  id: string;
  mapping: string;
  buttons: PadButton[];
  axes: number[];
}

const IDLE: PadSnapshot = {
  connected: false,
  id: '',
  mapping: '',
  buttons: [],
  axes: [],
};

/** Polling rate. The Gamepad API is poll-only, so we sample at ~30fps. */
const FRAME_MS = 1000 / 30;
/** Below this delta we consider the pad "unchanged" and skip the re-render. */
const EPSILON = 0.004;

export function readGamepad(): Gamepad | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
    return null;
  }
  const list = navigator.getGamepads();
  for (let i = 0; i < list.length; i += 1) {
    const gp = list[i];
    if (gp && gp.connected) return gp;
  }
  return null;
}

function snapshotOf(gp: Gamepad | null): PadSnapshot {
  if (!gp || !gp.connected) return IDLE;
  return {
    connected: true,
    id: gp.id,
    mapping: gp.mapping,
    buttons: gp.buttons.map((b) => ({ pressed: b.pressed, value: b.value, touched: b.touched })),
    axes: Array.from(gp.axes),
  };
}

function isSame(a: PadSnapshot, b: PadSnapshot): boolean {
  if (a.connected !== b.connected || a.id !== b.id) return false;
  if (a.buttons.length !== b.buttons.length) return false;
  if (a.axes.length !== b.axes.length) return false;
  for (let i = 0; i < a.buttons.length; i += 1) {
    if (a.buttons[i].pressed !== b.buttons[i].pressed) return false;
    if (Math.abs(a.buttons[i].value - b.buttons[i].value) > EPSILON) return false;
  }
  for (let i = 0; i < a.axes.length; i += 1) {
    if (Math.abs(a.axes[i] - b.axes[i]) > EPSILON) return false;
  }
  return true;
}

export function useGamepad() {
  const [pad, setPad] = useState<PadSnapshot>(IDLE);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let last = 0;

    const tick = (now: number) => {
      if (now - last >= FRAME_MS) {
        last = now;
        const next = snapshotOf(readGamepad());
        // Keep the previous object when nothing moved: avoids a 30fps
        // re-render storm while the controller sits untouched.
        setPad((prev) => (isSame(prev, next) ? prev : next));
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const rumble = useCallback(
    async (duration = 800, strong = 1, weak = 0.6): Promise<boolean> => {
      const gp = readGamepad();
      const actuator = (gp as unknown as { vibrationActuator?: GamepadHapticActuator })?.vibrationActuator;
      if (!gp || !actuator) return false;

      try {
        if (typeof actuator.playEffect === 'function') {
          const result = await actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration,
            weakMagnitude: weak,
            strongMagnitude: strong,
          });
          return result === 'complete' || result === 'preempted';
        }
        const pulse = (actuator as unknown as { pulse?: (v: number, d: number) => Promise<boolean> }).pulse;
        if (typeof pulse === 'function') {
          await pulse.call(actuator, strong, duration);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [],
  );

  const measureDrift = useCallback((durationMs = 2500): Promise<DriftSample> => {
    return new Promise<DriftSample>((resolve) => {
      const startedAt = performance.now();
      let leftMax = 0;
      let leftSum = 0;
      let rightMax = 0;
      let rightSum = 0;
      let samples = 0;

      const step = () => {
        const gp = readGamepad();
        if (gp) {
          const lx = gp.axes[0] ?? 0;
          const ly = gp.axes[1] ?? 0;
          const rx = gp.axes[2] ?? 0;
          const ry = gp.axes[3] ?? 0;
          const left = Math.hypot(lx, ly);
          const right = Math.hypot(rx, ry);
          if (left > leftMax) leftMax = left;
          if (right > rightMax) rightMax = right;
          leftSum += left;
          rightSum += right;
          samples += 1;
        }

        if (performance.now() - startedAt >= durationMs) {
          resolve({
            leftMax,
            leftAvg: samples ? leftSum / samples : 0,
            rightMax,
            rightAvg: samples ? rightSum / samples : 0,
          });
          return;
        }
        window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);
    });
  }, []);

  return { pad, rumble, measureDrift };
}
