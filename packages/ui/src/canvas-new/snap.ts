// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (editor/tool/bond — angle snap on drag)
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-05 — angle snap utility. Pure, no DOM, no store.
// The bond/chain tools call snapAngle() when Shift is NOT held; holding
// Shift lets users draw free-angle bonds.

import type { Point } from '@kendraw/scene';
import type { ToolModifiers } from './types';

export const SNAP_INCREMENT_DEG = 15;

/** Radius below which no rotation is applied (avoid NaN on zero-length vectors). */
const SNAP_MIN_RADIUS = 1e-6;

/**
 * Snap a world-space endpoint around an anchor to the nearest 15° ray.
 *
 * Returns the original endpoint unchanged when `shift` is true (free-angle mode)
 * or when the vector length is below SNAP_MIN_RADIUS.
 */
export function snapEndpoint(
  anchor: Point,
  endpoint: Point,
  modifiers: Pick<ToolModifiers, 'shift'>,
  increment = SNAP_INCREMENT_DEG,
): Point {
  if (modifiers.shift) return endpoint;
  const dx = endpoint.x - anchor.x;
  const dy = endpoint.y - anchor.y;
  const r = Math.hypot(dx, dy);
  if (r < SNAP_MIN_RADIUS) return endpoint;
  const theta = Math.atan2(dy, dx);
  const step = (increment * Math.PI) / 180;
  const snapped = Math.round(theta / step) * step;
  return {
    x: anchor.x + r * Math.cos(snapped),
    y: anchor.y + r * Math.sin(snapped),
  };
}

/** Convenience: the snapped angle in radians, ignoring radius. */
export function snapAngleRadians(
  theta: number,
  modifiers: Pick<ToolModifiers, 'shift'>,
  increment = SNAP_INCREMENT_DEG,
): number {
  if (modifiers.shift) return theta;
  const step = (increment * Math.PI) / 180;
  return Math.round(theta / step) * step;
}
