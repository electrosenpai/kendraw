// Wave-7 HF-2 — erase tool. One click on an atom removes that atom (and
// the store cascades its incident bonds via the remove-atom command). One
// click on a bond removes that bond only. Clicks on empty space do
// nothing. No drag gesture — the legacy multi-select erase lives on the
// select tool + Delete key.

import type { Tool, ToolContext, ToolEventPayload } from '../types';

const DRAG_THRESHOLD_PX = 3;

interface DownState {
  readonly sx: number;
  readonly sy: number;
}

export function createEraseTool(): Tool {
  let down: DownState | null = null;

  return {
    id: 'erase',
    label: 'Erase',
    pointerdown(_ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      down = { sx: evt.screen.x, sy: evt.screen.y };
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const start = down;
      down = null;
      if (!start) return;
      const moved = Math.abs(evt.screen.x - start.sx) + Math.abs(evt.screen.y - start.sy);
      if (moved > DRAG_THRESHOLD_PX) return;
      const atomHit = ctx.hitTestAtom(evt.world);
      if (atomHit) {
        ctx.dispatch?.({ type: 'remove-atom', id: atomHit });
        return;
      }
      const bondHit = ctx.hitTestBond(evt.world);
      if (bondHit) {
        ctx.dispatch?.({ type: 'remove-bond', id: bondHit });
      }
    },
    cancel(): void {
      down = null;
    },
  };
}
