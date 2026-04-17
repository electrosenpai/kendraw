// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (render/restruct/rebond.ts hover plate;
//   editor/shared/utils.ts fracAngle / calcNewAtomPos)
// Reimplemented from scratch for Kendraw.
//
// Wave-5 W4-R-04 — pure helpers for the bond hover preview.
// All functions are deterministic, side-effect free, DOM-free.

import type { AtomId, Bond, BondId, Page, Point } from '@kendraw/scene';
import {
  STANDARD_BOND_LENGTH_PX,
  getIdealBondAngle,
} from '@kendraw/scene';

/** Radius (px) within which a click on an atom counts as a hit. */
export const ATOM_HIT_RADIUS = 14;

/** Half-thickness (px) of a bond's hit corridor. */
export const BOND_HIT_HALFWIDTH = 8;

/** Distance the hover icon sits from the atom centre, measured along
 *  the default extension angle. Slightly less than a full bond so the
 *  icon visibly previews the destination without occluding the next atom. */
export const HOVER_ICON_OFFSET_PX = STANDARD_BOND_LENGTH_PX * 0.55;

/** Perpendicular offset used when previewing a bond fan-out. */
export const BOND_FANOUT_OFFSET_PX = 18;

/** Visual radius of the hover icon (used for hit-test on the icon itself). */
export const HOVER_ICON_RADIUS_PX = 9;

export type HoverPreviewKind = 'atom-extension' | 'bond-fanout';

export interface HoverPreview {
  readonly kind: HoverPreviewKind;
  /** Anchor point — the existing atom or the midpoint of the hovered bond. */
  readonly anchor: Point;
  /** Where the icon is rendered. */
  readonly iconAt: Point;
  /** Endpoint a click would create (in world space). */
  readonly endpoint: Point;
  /** Angle (radians) of the extension, for tooltips / debugging. */
  readonly angle: number;
  /** Source ID — used to dedupe hover updates and bypass repaints. */
  readonly sourceId: AtomId | BondId;
}

/** Compute the hover icon for a terminal-ish atom: anchor on the atom, icon at
 *  the default angle, endpoint at a full bond length. */
export function computeAtomHoverPreview(
  page: Page,
  atomId: AtomId,
): HoverPreview | null {
  const atom = page.atoms[atomId];
  if (!atom) return null;
  const angle = getIdealBondAngle(page, atomId);
  const anchor: Point = { x: atom.x, y: atom.y };
  const iconAt: Point = {
    x: atom.x + HOVER_ICON_OFFSET_PX * Math.cos(angle),
    y: atom.y + HOVER_ICON_OFFSET_PX * Math.sin(angle),
  };
  const endpoint: Point = {
    x: atom.x + STANDARD_BOND_LENGTH_PX * Math.cos(angle),
    y: atom.y + STANDARD_BOND_LENGTH_PX * Math.sin(angle),
  };
  return { kind: 'atom-extension', anchor, iconAt, endpoint, angle, sourceId: atomId };
}

/** Compute the hover icon for an existing bond: a perpendicular fan-out at the
 *  midpoint. Side is chosen so that the icon falls on the side of the cursor.
 */
export function computeBondHoverPreview(
  page: Page,
  bondId: BondId,
  cursor: Point,
): HoverPreview | null {
  const bond = page.bonds[bondId];
  if (!bond) return null;
  const a = page.atoms[bond.fromAtomId];
  const b = page.atoms[bond.toAtomId];
  if (!a || !b) return null;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return null;
  // Perpendicular unit vector, sign chosen to point toward the cursor.
  const nx = -dy / len;
  const ny = dx / len;
  const cursorSide = (cursor.x - mx) * nx + (cursor.y - my) * ny;
  const sign = cursorSide >= 0 ? 1 : -1;
  const ix = mx + sign * BOND_FANOUT_OFFSET_PX * nx;
  const iy = my + sign * BOND_FANOUT_OFFSET_PX * ny;
  const endpoint: Point = {
    x: mx + sign * STANDARD_BOND_LENGTH_PX * nx,
    y: my + sign * STANDARD_BOND_LENGTH_PX * ny,
  };
  const angle = Math.atan2(sign * ny, sign * nx);
  return {
    kind: 'bond-fanout',
    anchor: { x: mx, y: my },
    iconAt: { x: ix, y: iy },
    endpoint,
    angle,
    sourceId: bondId,
  };
}

/** Whether `cursor` lies within HOVER_ICON_RADIUS of the icon. */
export function isCursorOnHoverIcon(preview: HoverPreview | null, cursor: Point): boolean {
  if (!preview) return false;
  const dx = cursor.x - preview.iconAt.x;
  const dy = cursor.y - preview.iconAt.y;
  return Math.hypot(dx, dy) <= HOVER_ICON_RADIUS_PX;
}

/** Brute-force bond hit-test. Linear in bond count — fine for typical
 *  drawings (< 200 bonds). Returns the closest bond within BOND_HIT_HALFWIDTH. */
export function hitTestBond(page: Page, world: Point): BondId | null {
  let bestId: BondId | null = null;
  let bestDist = BOND_HIT_HALFWIDTH;
  for (const id in page.bonds) {
    const bond = page.bonds[id as BondId] as Bond;
    const a = page.atoms[bond.fromAtomId];
    const b = page.atoms[bond.toAtomId];
    if (!a || !b) continue;
    const d = pointSegmentDistance(world, a, b);
    if (d < bestDist) {
      bestDist = d;
      bestId = bond.id;
    }
  }
  return bestId;
}

function pointSegmentDistance(p: Point, a: Point, b: Point): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const wx = p.x - a.x;
  const wy = p.y - a.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return Math.hypot(wx, wy);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
  const t = c1 / c2;
  const px = a.x + t * vx;
  const py = a.y + t * vy;
  return Math.hypot(p.x - px, p.y - py);
}
