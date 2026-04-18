// Wave-7 HF-2 — reaction arrow tool. Click-drag draws a straight forward
// arrow between two free points: the bezier control points are linearly
// interpolated so the arrow renders as a straight line. Curvature and
// atom/bond anchoring are deferred to a later wave.

import type { ArrowId, BezierGeometry, Point } from '@kendraw/scene';
import type { Tool, ToolContext, ToolEventPayload } from '../types';

const MIN_ARROW_LEN_PX = 8;

interface DownState {
  readonly world: Point;
  readonly sx: number;
  readonly sy: number;
}

export function createArrowTool(): Tool {
  let down: DownState | null = null;

  return {
    id: 'arrow',
    label: 'Reaction arrow',
    pointerdown(_ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      down = {
        world: { x: evt.world.x, y: evt.world.y },
        sx: evt.screen.x,
        sy: evt.screen.y,
      };
    },
    pointerup(ctx: ToolContext, evt: ToolEventPayload<PointerEvent>): void {
      const start = down;
      down = null;
      if (!start) return;
      const screenLen = Math.hypot(evt.screen.x - start.sx, evt.screen.y - start.sy);
      if (screenLen < MIN_ARROW_LEN_PX) return;
      const end: Point = { x: evt.world.x, y: evt.world.y };
      const geometry: BezierGeometry = {
        start: start.world,
        c1: lerp(start.world, end, 1 / 3),
        c2: lerp(start.world, end, 2 / 3),
        end,
      };
      ctx.dispatch?.({
        type: 'add-arrow',
        arrow: {
          id: crypto.randomUUID() as ArrowId,
          type: 'forward',
          geometry,
          startAnchor: { kind: 'free' },
          endAnchor: { kind: 'free' },
        },
      });
    },
    cancel(): void {
      down = null;
    },
  };
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
