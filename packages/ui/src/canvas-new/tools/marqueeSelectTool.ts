// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher (editor/tool/select.ts — lasso/rectangle mode)
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-06 — rubber-band rectangle selection. Clicks on empty space
// begin a marquee; atoms whose center falls inside the rectangle at pointerup
// become the new selection. Single-atom clicks fall through to hitTestAtom
// and select just that atom.

import type { Point } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

interface MarqueeState {
  active: boolean;
  start: Point;
}

export function createMarqueeSelectTool(): Tool {
  const state: MarqueeState = { active: false, start: { x: 0, y: 0 } };

  return {
    id: 'select',
    label: 'Select (marquee)',
    pointerdown(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const hit = ctx.hitTestAtom(evt.world);
      if (hit !== null) {
        ctx.setSelectedAtoms(new Set([hit]));
        ctx.setSelectionRect(null);
        state.active = false;
        ctx.requestRepaint();
        return;
      }
      state.active = true;
      state.start = evt.world;
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
      if (!state.active) return;
      ctx.setSelectionRect({
        x1: state.start.x,
        y1: state.start.y,
        x2: evt.world.x,
        y2: evt.world.y,
      });
      ctx.requestRepaint();
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      if (!state.active) return;
      state.active = false;
      const ids = ctx.searchAtomsInRect(state.start, evt.world);
      ctx.setSelectedAtoms(new Set(ids));
      ctx.setSelectionRect(null);
      ctx.requestRepaint();
    },
    cancel(ctx: ToolContext): void {
      state.active = false;
      ctx.setSelectionRect(null);
      ctx.setSelectedAtoms(new Set());
      ctx.requestRepaint();
    },
  };
}
