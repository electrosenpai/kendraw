// Wave-7 HF-2 — ring placement tool. One click drops a prebuilt ring
// (benzene, cyclohexane, etc.) centered at the click point via the
// shared generateRing() helper. Uses add-batch so the ring atoms and
// bonds land in a single undo step.

import { RING_TEMPLATES, generateRing } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

const DRAG_THRESHOLD_PX = 3;
const DEFAULT_RING_RADIUS = 40;

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
      const ring = generateRing(
        template,
        evt.world.x,
        evt.world.y,
        opts.radius ?? DEFAULT_RING_RADIUS,
      );
      for (const a of ring.atoms) ctx.dispatch?.({ type: 'add-atom', atom: a });
      for (const b of ring.bonds) ctx.dispatch?.({ type: 'add-bond', bond: b });
    },
    cancel(): void {
      down = null;
    },
  };
}
