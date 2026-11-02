/**
 * Typed access to the controller art geometry (`controller-art.json`).
 *
 * Every part carries an `i` that is exactly the button index of the W3C
 * "standard" gamepad mapping, so highlighting is a single array lookup.
 */

import rawArt from './controller-art.json';

/** Pure geometry: a circle or a rounded rect in viewBox units. */
export type ControllerShape = {
  kind: 'circle' | 'rect';
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rx?: number;
  glyph?: string;
  fs?: number;
  /** Inner radius — present on the stick wells (L3/R3). */
  ring?: number;
  /** Paint with the accent colour (e.g. the DS4 light bar). */
  accent?: boolean;
};

/** A shape bound to a Gamepad API button index. */
export type ControllerPart = ControllerShape & { i: number };

export type ControllerLayout = {
  body: string;
  /** Static, non-interactive geometry drawn above the body. */
  decor?: ControllerShape[];
  parts: ControllerPart[];
};

type ControllerArt = {
  viewBox: string;
  layouts: Record<string, ControllerLayout>;
  models: Record<string, { layout: string }>;
};

const art = rawArt as unknown as ControllerArt;

export const VIEW_BOX = art.viewBox;
export const LAYOUTS = art.layouts;
export const MODEL_LAYOUTS = art.models;

/** Layout key for a controller key (`dualsense`, `xbox-series`, …). */
export function layoutForModel(model?: string | null): ControllerLayout {
  const key = MODEL_LAYOUTS[model ?? 'unknown']?.layout ?? 'symmetric';
  return LAYOUTS[key] ?? LAYOUTS.symmetric;
}
