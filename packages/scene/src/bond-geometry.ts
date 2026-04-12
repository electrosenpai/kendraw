/**
 * ChemDraw-style bond geometry: fixed bond length + angle snapping.
 *
 * Rules:
 * - Bond length is always STANDARD_BOND_LENGTH_PX (configurable, default 40px)
 * - New bonds snap to multiples of 30° by default
 * - When extending from an existing atom, the angle is chosen intelligently:
 *   - 0 existing bonds → default angle (0° = horizontal right)
 *   - 1 existing bond → 120° from that bond (zigzag convention)
 *   - 2+ bonds → bisect the largest available gap
 * - User can override with free angle (shift key)
 */

import type { AtomId, Page, Point } from './types.js';

export const STANDARD_BOND_LENGTH_PX = 40;
const SNAP_INCREMENT_DEG = 30;
const SNAP_INCREMENT_RAD = (SNAP_INCREMENT_DEG * Math.PI) / 180;

/**
 * Get the angles (in radians) of all existing bonds from an atom.
 */
export function getExistingBondAngles(page: Page, atomId: AtomId): number[] {
  const atom = page.atoms[atomId];
  if (!atom) return [];

  const angles: number[] = [];
  for (const bond of Object.values(page.bonds)) {
    let other: Point | undefined;
    if (bond.fromAtomId === atomId) other = page.atoms[bond.toAtomId];
    else if (bond.toAtomId === atomId) other = page.atoms[bond.fromAtomId];
    if (other) {
      angles.push(Math.atan2(other.y - atom.y, other.x - atom.x));
    }
  }
  return angles;
}

/**
 * Calculate the ideal angle for a new bond from an atom.
 * Returns angle in radians.
 */
export function getIdealBondAngle(page: Page, atomId: AtomId): number {
  const existing = getExistingBondAngles(page, atomId);

  if (existing.length === 0) {
    // No bonds → horizontal right (0°)
    return 0;
  }

  if (existing.length === 1) {
    // One bond → 120° offset (zigzag convention for 2D chemistry drawing)
    // Alternate direction based on the existing bond angle
    const prevAngle = existing[0] ?? 0;
    // If previous bond goes up-right, new bond goes down-right, and vice versa
    return prevAngle + (2 * Math.PI) / 3; // +120°
  }

  // 2+ bonds → find the largest angular gap and bisect it
  const sorted = [...existing].sort((a, b) => a - b);
  let bestGap = 0;
  let bestMidAngle = 0;

  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i] ?? 0;
    const b = sorted[(i + 1) % sorted.length] ?? 0;
    let gap = b - a;
    if (i === sorted.length - 1) gap += 2 * Math.PI; // wrap around
    if (gap > bestGap) {
      bestGap = gap;
      bestMidAngle = a + gap / 2;
    }
  }

  return bestMidAngle;
}

/**
 * Snap an angle to the nearest multiple of SNAP_INCREMENT.
 */
export function snapAngleToGrid(angleRad: number): number {
  return Math.round(angleRad / SNAP_INCREMENT_RAD) * SNAP_INCREMENT_RAD;
}

/**
 * Calculate the target position for a new bond.
 * - fromAtom: the atom we're drawing from
 * - mouseX, mouseY: cursor position (for drag direction)
 * - freeAngle: if true, use exact mouse direction (no snap)
 * - freeLength: if true, use mouse distance (no fixed length)
 *
 * Returns the target point for the new atom.
 */
export function calculateBondTarget(
  page: Page,
  fromAtomId: AtomId,
  mouseX: number,
  mouseY: number,
  options?: { freeAngle?: boolean; freeLength?: boolean },
): Point {
  const atom = page.atoms[fromAtomId];
  if (!atom) return { x: mouseX, y: mouseY };

  const dx = mouseX - atom.x;
  const dy = mouseY - atom.y;
  const mouseDist = Math.sqrt(dx * dx + dy * dy);

  // Determine angle
  let angle: number;
  if (mouseDist < 5) {
    // Mouse very close to atom → use ideal angle
    angle = getIdealBondAngle(page, fromAtomId);
  } else {
    // Use mouse direction
    const mouseAngle = Math.atan2(dy, dx);
    angle = options?.freeAngle ? mouseAngle : snapAngleToGrid(mouseAngle);
  }

  // Determine length
  const length = options?.freeLength ? Math.max(20, mouseDist) : STANDARD_BOND_LENGTH_PX;

  return {
    x: atom.x + length * Math.cos(angle),
    y: atom.y + length * Math.sin(angle),
  };
}

/**
 * Quick-click chain drawing: automatically determine the next atom position
 * for a zigzag chain. Each call alternates the angle.
 */
export function getNextChainPosition(page: Page, fromAtomId: AtomId): Point {
  const atom = page.atoms[fromAtomId];
  if (!atom) return { x: 0, y: 0 };

  const angle = getIdealBondAngle(page, fromAtomId);

  return {
    x: atom.x + STANDARD_BOND_LENGTH_PX * Math.cos(angle),
    y: atom.y + STANDARD_BOND_LENGTH_PX * Math.sin(angle),
  };
}
