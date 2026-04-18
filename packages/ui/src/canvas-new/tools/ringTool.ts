// Wave-7 HF-2 — ring placement tool. One click drops a prebuilt ring
// (benzene, cyclohexane, etc.) centered at the click point via the
// shared generateRing() helper.
//
// Wave-7 HF-D — when the cursor falls on an existing bond at click time
// the new ring is *fused* onto that bond (edge sharing, like adding a
// benzene to one face of an existing cycle to draw naphthalene). When
// the cursor lands on an existing atom the ring is fused at that vertex
// (spiro / terminal substituent). Empty-space click keeps the original
// isolated-ring placement behavior.

import {
  RING_TEMPLATES,
  generateRing,
  generateRingFusedOnAtom,
  generateRingFusedOnBond,
} from '@kendraw/scene';
import type { Atom, AtomId, Bond, Page } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

const DRAG_THRESHOLD_PX = 3;
const DEFAULT_RING_RADIUS = 40;
const DEFAULT_RING_EDGE = 50;

export interface RingToolOptions {
  /** Template id in scene's RING_TEMPLATES registry, e.g. 'benzene'. */
  templateId: string;
  /** Tool id registered in the ToolRegistry (e.g. 'ring-benzene'). */
  id: string;
  /** World-space radius of the generated ring. */
  radius?: number;
}

interface DownState {
  readonly sx: number;
  readonly sy: number;
}

/** Build a click-to-drop ring tool backed by a scene RING_TEMPLATE. */
export function createRingTool(opts: RingToolOptions): Tool {
  let down: DownState | null = null;
  const template = RING_TEMPLATES.find((t) => t.id === opts.templateId);

  return {
    id: opts.id,
    label: `Ring (${opts.templateId})`,
    pointerdown(_ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      down = { sx: evt.screen.x, sy: evt.screen.y };
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const start = down;
      down = null;
      if (!start) return;
      if (!template) return;
      const moved = Math.abs(evt.screen.x - start.sx) + Math.abs(evt.screen.y - start.sy);
      if (moved > DRAG_THRESHOLD_PX) return;
      const page = ctx.getActivePage?.();

      // Atom-fusion path: cursor is on an existing atom → vertex sharing.
      // Hit-tested first because the atom hit radius is tighter than the
      // bond one, so an atom-on-bond click resolves to the atom.
      if (page) {
        const atomHit = ctx.hitTestAtom(evt.world);
        if (atomHit) {
          const a = page.atoms[atomHit];
          if (a) {
            const growDir = computeGrowDirection(page, atomHit, a.x, a.y);
            const ring = generateRingFusedOnAtom(
              template,
              { id: a.id, x: a.x, y: a.y },
              growDir,
              DEFAULT_RING_EDGE,
            );
            dispatchRing(ctx, ring);
            return;
          }
        }

        // Bond-fusion path: cursor is on an existing bond → edge sharing.
        const bondHit = ctx.hitTestBond?.(evt.world) ?? null;
        if (bondHit) {
          const bond = page.bonds[bondHit];
          const aA = bond ? page.atoms[bond.fromAtomId] : null;
          const aB = bond ? page.atoms[bond.toAtomId] : null;
          if (aA && aB) {
            const side = sideOfBond(aA, aB, evt.world);
            const ring = generateRingFusedOnBond(
              template,
              { id: aA.id, x: aA.x, y: aA.y },
              { id: aB.id, x: aB.x, y: aB.y },
              side,
            );
            dispatchRing(ctx, ring);
            return;
          }
        }
      }

      // Empty-space click → isolated ring at the cursor.
      const ring = generateRing(
        template,
        evt.world.x,
        evt.world.y,
        opts.radius ?? DEFAULT_RING_RADIUS,
      );
      dispatchRing(ctx, ring);
    },
    cancel(): void {
      down = null;
    },
  };
}

function dispatchRing(
  ctx: ToolContext,
  ring: { atoms: readonly Atom[]; bonds: readonly Bond[] },
): void {
  for (const a of ring.atoms) ctx.dispatch?.({ type: 'add-atom', atom: a });
  for (const b of ring.bonds) ctx.dispatch?.({ type: 'add-bond', bond: b });
}

/** Cross product sign: which side of the directed bond aA→aB does the
 *  cursor world point fall on? +1 ↔ left, -1 ↔ right. */
function sideOfBond(
  aA: { x: number; y: number },
  aB: { x: number; y: number },
  cursor: { x: number; y: number },
): 1 | -1 {
  const cross =
    (aB.x - aA.x) * (cursor.y - aA.y) - (aB.y - aA.y) * (cursor.x - aA.x);
  return cross >= 0 ? 1 : -1;
}

/** Pick a "grow away" direction for atom-fusion: average the unit
 *  vectors along the bonds incident to `atomId` and return the opposite
 *  angle. With no incident bonds we default to east (0 rad). */
function computeGrowDirection(
  page: Page,
  atomId: AtomId,
  ax: number,
  ay: number,
): number {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const id in page.bonds) {
    const b = page.bonds[id as keyof typeof page.bonds];
    if (!b) continue;
    let other: Atom | undefined;
    if (b.fromAtomId === atomId) other = page.atoms[b.toAtomId];
    else if (b.toAtomId === atomId) other = page.atoms[b.fromAtomId];
    if (!other) continue;
    const dx = other.x - ax;
    const dy = other.y - ay;
    const len = Math.hypot(dx, dy);
    if (len < 1e-3) continue;
    sumX += dx / len;
    sumY += dy / len;
    count += 1;
  }
  if (count === 0) return 0;
  return Math.atan2(-sumY, -sumX);
}
