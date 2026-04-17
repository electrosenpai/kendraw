import type { Page, ArrowAnchor } from '@kendraw/scene';

/** Distance (px) within which a pointer should snap to an atom. */
export const ATOM_SNAP_RADIUS_PX = 12;
/** Distance (px) within which a pointer should snap to a bond segment. */
export const BOND_SNAP_RADIUS_PX = 8;

function pointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { dist: number; t: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return { dist: Math.hypot(px - cx, py - cy), t };
}

/** Wave-3 C1: pick the tightest anchor under the pointer.
 *  Preference order: atom (smallest atom distance) → bond (smallest bond distance)
 *  → free. Mirrors the semantics of ArrowAnchor so curly arrows track atoms and
 *  bonds through later edits instead of dangling in absolute space. */
export function snapArrowAnchor(
  point: { x: number; y: number },
  page: Pick<Page, 'atoms' | 'bonds'>,
  opts: { atomRadius?: number; bondRadius?: number } = {},
): ArrowAnchor {
  const atomRadius = opts.atomRadius ?? ATOM_SNAP_RADIUS_PX;
  const bondRadius = opts.bondRadius ?? BOND_SNAP_RADIUS_PX;

  let bestAtomId: string | null = null;
  let bestAtomDist = Infinity;
  for (const atom of Object.values(page.atoms)) {
    const d = Math.hypot(point.x - atom.x, point.y - atom.y);
    if (d < bestAtomDist && d <= atomRadius) {
      bestAtomDist = d;
      bestAtomId = atom.id as unknown as string;
    }
  }
  if (bestAtomId) {
    return { kind: 'atom', refId: bestAtomId as never };
  }

  let bestBondId: string | null = null;
  let bestBondDist = Infinity;
  let bestBondT = 0.5;
  for (const bond of Object.values(page.bonds)) {
    const fa = page.atoms[bond.fromAtomId];
    const ta = page.atoms[bond.toAtomId];
    if (!fa || !ta) continue;
    const { dist, t } = pointToSegment(point.x, point.y, fa.x, fa.y, ta.x, ta.y);
    if (dist < bestBondDist && dist <= bondRadius) {
      bestBondDist = dist;
      bestBondId = bond.id as unknown as string;
      bestBondT = t;
    }
  }
  if (bestBondId) {
    return { kind: 'bond', refId: bestBondId as never, t: bestBondT };
  }

  return { kind: 'free' };
}
