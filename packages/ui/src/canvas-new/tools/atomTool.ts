// Wave-7 HF-2 — atom placement tool. One click on empty space places a
// fresh atom of the configured element; click on an existing atom rewrites
// its element (element swap, no geometry change). No drag gesture here —
// drag is reserved for bondTool.

import { createAtom } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

const DRAG_THRESHOLD_PX = 3;

export interface AtomToolOptions {
  /** Atomic number Z (1..118). */
  element: number;
  /** Tool id registered in the ToolRegistry (e.g. 'atom-c'). */
  id: string;
}

interface DownState {
  readonly sx: number;
  readonly sy: number;
}

/** Build a click-to-place atom tool for a given element. Re-usable for the
 *  C/H/N/O/S atom buttons. */
export function createAtomTool(opts: AtomToolOptions): Tool {
  let down: DownState | null = null;

  return {
    id: opts.id,
    label: `Atom (Z=${opts.element})`,
    pointerdown(_ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      down = { sx: evt.screen.x, sy: evt.screen.y };
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const start = down;
      down = null;
      if (!start) return;
      const moved = Math.abs(evt.screen.x - start.sx) + Math.abs(evt.screen.y - start.sy);
      if (moved > DRAG_THRESHOLD_PX) return;
      const hit = ctx.hitTestAtom(evt.world);
      if (hit) {
        ctx.dispatch?.({
          type: 'update-atom',
          id: hit,
          changes: { element: opts.element },
        });
        return;
      }
      const atom = createAtom(evt.world.x, evt.world.y, opts.element);
      ctx.dispatch?.({ type: 'add-atom', atom });
    },
    cancel(): void {
      down = null;
    },
  };
}
