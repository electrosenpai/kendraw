// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (editor/tool/select.ts — lasso/rectangle mode)
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-06 — rubber-band rectangle selection. Clicks on empty space
// begin a marquee; atoms whose center falls inside the rectangle at pointerup
// become the new selection. Single-atom clicks fall through to hitTestAtom
// and select just that atom.
// Wave-5 W4-R-07 — atom drag-move with atomic undo. Pointer-down on an atom
// arms a drag candidate; if the cursor moves > DRAG_THRESHOLD_PX the tool
// switches to drag mode and publishes a transient overlay offset (no store
// dispatch). On pointer-up a single `move-batch` is dispatched so undo
// restores the start position in one Ctrl+Z.

import type { AtomId, BondId, Point } from '@kendraw/scene';
import { createAtom, createBond } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

const DRAG_THRESHOLD_PX = 3;

interface MarqueeState {
  active: boolean;
  start: Point;
}

interface DragState {
  active: boolean;
  /** Atoms participating in the drag (the current selection at pointerdown). */
  atomIds: Set<AtomId>;
  /** Cursor world-space position when the drag began. */
  startWorld: Point;
  /** Cursor screen-space position at pointerdown — used for the threshold. */
  startScreen: Point;
  /** Whether the user is duplicating (ctrl/meta pressed at pointerdown). */
  duplicate: boolean;
  /** Whether the threshold has been crossed; below it we still treat the
   *  gesture as a click. */
  past: boolean;
}

export function createMarqueeSelectTool(): Tool {
  const marquee: MarqueeState = { active: false, start: { x: 0, y: 0 } };
  let drag: DragState | null = null;

  function startDrag(
    ctx: ToolContext,
    atomId: AtomId,
    evt: ToolEventPayload<PointerEvent>,
  ): void {
    // If the clicked atom is part of the current selection, drag the whole
    // group; otherwise replace selection with that single atom and drag it.
    const currentSelection = readCurrentSelection(ctx);
    let participants: Set<AtomId>;
    if (currentSelection.has(atomId)) {
      participants = new Set(currentSelection);
    } else {
      participants = new Set([atomId]);
      ctx.setSelectedAtoms(participants);
    }
    drag = {
      active: true,
      atomIds: participants,
      startWorld: { x: evt.world.x, y: evt.world.y },
      startScreen: { x: evt.screen.x, y: evt.screen.y },
      duplicate: evt.modifiers.ctrl || evt.modifiers.meta,
      past: false,
    };
  }

  function readCurrentSelection(ctx: ToolContext): ReadonlySet<AtomId> {
    return ctx.getSelectedAtoms?.() ?? new Set();
  }

  function applyAxisConstraint(dx: number, dy: number, shift: boolean): Point {
    if (!shift) return { x: dx, y: dy };
    return Math.abs(dx) >= Math.abs(dy)
      ? { x: dx, y: 0 }
      : { x: 0, y: dy };
  }

  return {
    id: 'select',
    label: 'Select (marquee + drag-move)',
    activate(ctx: ToolContext): void {
      drag = null;
      marquee.active = false;
      ctx.setSelectionRect(null);
      ctx.setDragOffset?.(null);
    },
    deactivate(ctx: ToolContext): void {
      drag = null;
      marquee.active = false;
      ctx.setSelectionRect(null);
      ctx.setDragOffset?.(null);
    },
    pointerdown(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const hit = ctx.hitTestAtom(evt.world);
      if (hit !== null) {
        // Click on an atom → arm a drag candidate. Selection is finalised
        // either on pointerup (click) or via startDrag (already done).
        startDrag(ctx, hit, evt);
        ctx.setSelectionRect(null);
        marquee.active = false;
        return;
      }
      marquee.active = true;
      marquee.start = evt.world;
      ctx.setSelectedAtoms(new Set());
      ctx.setSelectionRect({
        x1: evt.world.x,
        y1: evt.world.y,
        x2: evt.world.x,
        y2: evt.world.y,
      });
      ctx.requestRepaint();
    },
    pointermove(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      if (drag) {
        const sdx = evt.screen.x - drag.startScreen.x;
        const sdy = evt.screen.y - drag.startScreen.y;
        if (!drag.past && Math.hypot(sdx, sdy) <= DRAG_THRESHOLD_PX) return;
        drag.past = true;
        const dx0 = evt.world.x - drag.startWorld.x;
        const dy0 = evt.world.y - drag.startWorld.y;
        const constrained = applyAxisConstraint(dx0, dy0, evt.modifiers.shift);
        ctx.setDragOffset?.({
          atomIds: drag.atomIds,
          dx: constrained.x,
          dy: constrained.y,
        });
        return;
      }
      if (!marquee.active) return;
      ctx.setSelectionRect({
        x1: marquee.start.x,
        y1: marquee.start.y,
        x2: evt.world.x,
        y2: evt.world.y,
      });
      ctx.requestRepaint();
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      if (drag) {
        const completed = drag;
        drag = null;
        ctx.setDragOffset?.(null);
        if (!completed.past) {
          // It was a click; selection has already been set (single atom).
          return;
        }
        const dx0 = evt.world.x - completed.startWorld.x;
        const dy0 = evt.world.y - completed.startWorld.y;
        const { x: dx, y: dy } = applyAxisConstraint(dx0, dy0, evt.modifiers.shift);
        if (dx === 0 && dy === 0) return;
        const ids = [...completed.atomIds];
        if (completed.duplicate) {
          duplicateAndOffset(ctx, completed.atomIds, dx, dy);
        } else {
          ctx.dispatch?.({ type: 'move-batch', ids, dx, dy });
        }
        return;
      }
      if (!marquee.active) return;
      marquee.active = false;
      const ids = ctx.searchAtomsInRect(marquee.start, evt.world);
      ctx.setSelectedAtoms(new Set(ids));
      ctx.setSelectionRect(null);
      ctx.requestRepaint();
    },
    cancel(ctx: ToolContext): void {
      marquee.active = false;
      drag = null;
      ctx.setSelectionRect(null);
      ctx.setDragOffset?.(null);
      ctx.setSelectedAtoms(new Set());
      ctx.requestRepaint();
    },
  };
}

/** Wave-5 R-07 ctrl+drag: clone every atom in the dragged set (with fresh
 *  ids) plus every bond fully internal to the set. New atoms are placed at
 *  the offset position. Issued as N dispatches; atomic-undo for duplicate is
 *  a wave-6 follow-up. */
function duplicateAndOffset(
  ctx: ToolContext,
  atomIds: ReadonlySet<AtomId>,
  dx: number,
  dy: number,
): void {
  const page = ctx.getActivePage?.();
  if (!page) return;
  const idMap = new Map<AtomId, AtomId>();
  const newIds = new Set<AtomId>();
  for (const oldId of atomIds) {
    const old = page.atoms[oldId];
    if (!old) continue;
    const fresh = createAtom(old.x + dx, old.y + dy, old.element);
    idMap.set(oldId, fresh.id);
    newIds.add(fresh.id);
    ctx.dispatch?.({ type: 'add-atom', atom: fresh });
  }
  for (const bid in page.bonds) {
    const bond = page.bonds[bid as BondId];
    if (!bond) continue;
    const a = idMap.get(bond.fromAtomId);
    const b = idMap.get(bond.toAtomId);
    if (!a || !b) continue;
    ctx.dispatch?.({
      type: 'add-bond',
      bond: createBond(a, b, bond.order, bond.style),
    });
  }
  ctx.setSelectedAtoms(newIds);
}

export const __testing__ = { DRAG_THRESHOLD_PX };
