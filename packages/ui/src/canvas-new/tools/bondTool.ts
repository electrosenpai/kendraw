// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (editor/tool/bond.ts)
// Reimplemented from scratch for Kendraw.
//
// Wave-5 W4-R-04 / W4-R-10 — bond tool with hover preview, click-to-create,
// and drag-to-stretch behavior. No code copied from Ketcher; only the design
// patterns (hover-id equality guard, click vs drag distance threshold, ideal
// angle on click, free angle with 15° snap on drag) are inspired.

import type { AtomId, BondId, Point } from '@kendraw/scene';
import { createAtom, createBond } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';
import {
  ATOM_HIT_RADIUS,
  computeAtomHoverPreview,
  computeBondHoverPreview,
  hitTestBond,
  type HoverPreview,
} from '../bondPreview';
import { snapEndpoint } from '../snap';

const DRAG_THRESHOLD_PX = 3;

interface BondDragState {
  readonly anchorAtomId: AtomId;
  readonly anchorWorld: Point;
  readonly downScreen: Point;
  isDragging: boolean;
}

export interface BondToolOptions {
  /** Tool id registered in the ToolRegistry. Defaults to 'bond' (single). */
  id?: string;
  /** Bond order applied when committing a freshly-created bond. Defaults to 1. */
  bondOrder?: 1 | 2 | 3;
}

const STYLE_FOR_ORDER: Record<1 | 2 | 3, 'single' | 'double' | 'triple'> = {
  1: 'single',
  2: 'double',
  3: 'triple',
};

export function createBondTool(opts: BondToolOptions = {}): Tool {
  const order: 1 | 2 | 3 = opts.bondOrder ?? 1;
  const style = STYLE_FOR_ORDER[order];
  const id = opts.id ?? 'bond';
  let lastSourceId: AtomId | BondId | null = null;
  let drag: BondDragState | null = null;

  function publishHover(ctx: ToolContext, preview: HoverPreview | null): void {
    const next = preview?.sourceId ?? null;
    // ID-equality guard: skip repaints when the hovered element hasn't changed.
    if (lastSourceId === next) return;
    lastSourceId = next;
    ctx.setHoverPreview?.(preview);
  }

  function commitBondToTarget(
    ctx: ToolContext,
    fromAtomId: AtomId,
    targetWorld: Point,
    shift: boolean,
  ): void {
    const page = ctx.getActivePage?.();
    if (!page) return;
    const anchor = page.atoms[fromAtomId];
    if (!anchor) return;
    const snapped = snapEndpoint(anchor, targetWorld, { shift });
    const existingTargetId = ctx.hitTestAtom(snapped);
    if (existingTargetId && existingTargetId !== fromAtomId) {
      ctx.dispatch?.({
        type: 'add-bond',
        bond: createBond(fromAtomId, existingTargetId, order, style),
      });
      return;
    }
    const newAtom = createAtom(snapped.x, snapped.y);
    ctx.dispatch?.({ type: 'add-atom', atom: newAtom });
    ctx.dispatch?.({
      type: 'add-bond',
      bond: createBond(fromAtomId, newAtom.id, order, style),
    });
  }

  return {
    id,
    label: `Bond (${style})`,
    activate(ctx: ToolContext): void {
      lastSourceId = null;
      drag = null;
      ctx.setHoverPreview?.(null);
    },
    deactivate(ctx: ToolContext): void {
      lastSourceId = null;
      drag = null;
      ctx.setHoverPreview?.(null);
    },
    pointermove(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      // While dragging, the preview tracks the cursor.
      if (drag) {
        const page = ctx.getActivePage?.();
        const anchor = page?.atoms[drag.anchorAtomId];
        if (!page || !anchor) return;
        const snapped = snapEndpoint(
          anchor,
          evt.world,
          { shift: evt.modifiers.shift },
        );
        const angle = Math.atan2(snapped.y - anchor.y, snapped.x - anchor.x);
        const preview: HoverPreview = {
          kind: 'atom-extension',
          anchor: { x: anchor.x, y: anchor.y },
          iconAt: snapped,
          endpoint: snapped,
          angle,
          sourceId: drag.anchorAtomId,
        };
        // Force-publish during drag (bypass the ID guard) so the preview
        // tracks the cursor even when sourceId is unchanged.
        lastSourceId = drag.anchorAtomId;
        ctx.setHoverPreview?.(preview);
        const moved =
          Math.abs(evt.screen.x - drag.downScreen.x) +
          Math.abs(evt.screen.y - drag.downScreen.y);
        if (moved > DRAG_THRESHOLD_PX) drag.isDragging = true;
        return;
      }
      const page = ctx.getActivePage?.();
      if (!page) return;
      const atomHit = ctx.hitTestAtom(evt.world);
      if (atomHit) {
        const preview = computeAtomHoverPreview(page, atomHit);
        publishHover(ctx, preview);
        return;
      }
      const bondHit = hitTestBond(page, evt.world);
      if (bondHit) {
        const preview = computeBondHoverPreview(page, bondHit, evt.world);
        publishHover(ctx, preview);
        return;
      }
      publishHover(ctx, null);
    },
    pointerdown(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const page = ctx.getActivePage?.();
      if (!page) return;
      const atomHit = ctx.hitTestAtom(evt.world);
      if (atomHit) {
        drag = {
          anchorAtomId: atomHit,
          anchorWorld: { x: evt.world.x, y: evt.world.y },
          downScreen: { x: evt.screen.x, y: evt.screen.y },
          isDragging: false,
        };
        return;
      }
      const bondHit = hitTestBond(page, evt.world);
      if (bondHit) {
        // Click on a bond: cycle order 1 → 2 → 3 → 1.
        ctx.dispatch?.({ type: 'cycle-bond', id: bondHit });
        publishHover(ctx, null);
        return;
      }
      // Click on empty space: create a fresh carbon at the click point.
      const newAtom = createAtom(evt.world.x, evt.world.y);
      ctx.dispatch?.({ type: 'add-atom', atom: newAtom });
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const active = drag;
      drag = null;
      if (!active) return;
      const page = ctx.getActivePage?.();
      if (!page) return;
      const anchor = page.atoms[active.anchorAtomId];
      if (!anchor) return;
      if (active.isDragging) {
        commitBondToTarget(ctx, active.anchorAtomId, evt.world, evt.modifiers.shift);
      } else {
        const preview = computeAtomHoverPreview(page, active.anchorAtomId);
        const target = preview?.endpoint ?? evt.world;
        commitBondToTarget(ctx, active.anchorAtomId, target, false);
      }
      // Clear the on-screen preview after committing.
      lastSourceId = null;
      ctx.setHoverPreview?.(null);
    },
    cancel(ctx: ToolContext): void {
      drag = null;
      lastSourceId = null;
      ctx.setHoverPreview?.(null);
    },
  };
}

export const __testing__ = { ATOM_HIT_RADIUS, DRAG_THRESHOLD_PX };
