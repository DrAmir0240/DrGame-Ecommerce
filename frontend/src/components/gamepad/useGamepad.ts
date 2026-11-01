'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

/* ------------------------------------------------------------------ */
/* Controller identification                                          */
/* ------------------------------------------------------------------ */

export type ControllerKey = 'dualsense' | 'dualsense-edge' | 'dualshock4' | 'xbox-series';

export interface ControllerInfo {
  key: ControllerKey;
  name: string;
  vendor: number;
  products: number[];
  /** Whether a 3D model ships for this controller (only DualSense does). */
  has3d: boolean;
}

export const CONTROLLERS: readonly ControllerInfo[] = [
  { key: 'dualsense', name: 'DualSense', vendor: 0x054c, products: [0x0ce6], has3d: true },
  { key: 'dualsense-edge', name: 'DualSense Edge', vendor: 0x054c, products: [0x0df2], has3d: false },
  { key: 'dualshock4', name: 'DualShock 4', vendor: 0x054c, products: [0x05c4, 0x09cc], has3d: false },
  { key: 'xbox-series', name: 'Xbox Wireless', vendor: 0x045e, products: [0x0b12, 0x0b13], has3d: false },
];

/**
 * Chrome embeds the USB ids in `gamepad.id`:
 *   "DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)"
 * Exact product match wins, then any controller from the same vendor.
 */
export function identifyController(id: string | null | undefined): ControllerInfo | null {
  if (!id) return null;
  const vendorMatch = /vendor:\s*([0-9a-f]{4})/i.exec(id);
  const productMatch = /product:\s*([0-9a-f]{4})/i.exec(id);
  const vendor = vendorMatch ? parseInt(vendorMatch[1], 16) : null;
  const product = productMatch ? parseInt(productMatch[1], 16) : null;
  if (vendor === null) return null;

  return (
    CONTROLLERS.find((c) => c.vendor === vendor && product !== null && c.products.includes(product)) ??
    CONTROLLERS.find((c) => c.vendor === vendor) ??
    null
  );
}

/** Labels for the W3C "standard" button indices (PlayStation glyphs). */
export const BUTTON_LABELS: readonly string[] = [
  '✕', '◯', '□', '△', // 0..3
  'L1', 'R1', 'L2', 'R2', // 4..7
  'Create', 'Options', // 8..9
  'L3', 'R3', // 10..11
  '↑', '↓', '←', '→', // 12..15
  'PS', 'Touchpad', // 16..17
];

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

  const controller = useMemo(() => identifyController(pad.id), [pad.id]);

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

  return { pad, controller, rumble, measureDrift };
}
