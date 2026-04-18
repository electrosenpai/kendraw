// Wave-7 HF-2 — unit tests for createArrowTool.

import { describe, it, expect } from 'vitest';
import type { Command } from '@kendraw/scene';
import { createArrowTool } from '../tools/arrowTool';
import type { ToolContext, ToolEventPayload } from '../types';

function evt(sx: number, sy: number, wx: number = sx, wy: number = sy): ToolEventPayload<PointerEvent> {
  return {
    screen: { x: sx, y: sy },
    world: { x: wx, y: wy },
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    event: new PointerEvent('pointerdown'),
  };
}

function makeCtx(): { ctx: ToolContext; dispatched: Command[] } {
  const dispatched: Command[] = [];
  const ctx = {
    store: {} as ToolContext['store'],
    worldFromScreen: (x: number, y: number) => ({ x, y }),
    hitTestAtom: () => null,
    hitTestBond: () => null,
    searchAtomsInRect: () => [],
    setSelectedAtoms: () => {},
    setSelectionRect: () => {},
    requestRepaint: () => {},
    dispatch: (c: Command) => dispatched.push(c),
  } as unknown as ToolContext;
  return { ctx, dispatched };
}

describe('createArrowTool', () => {
  it('draws a straight forward arrow from pointerdown to pointerup', () => {
    const tool = createArrowTool();
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(100, 0));
    expect(dispatched).toHaveLength(1);
    const cmd = dispatched[0];
    expect(cmd?.type).toBe('add-arrow');
    if (cmd?.type === 'add-arrow') {
      const arrow = cmd.arrow;
      expect(arrow.type).toBe('forward');
      expect(arrow.geometry.start).toEqual({ x: 0, y: 0 });
      expect(arrow.geometry.end).toEqual({ x: 100, y: 0 });
      expect(arrow.startAnchor).toEqual({ kind: 'free' });
      expect(arrow.endAnchor).toEqual({ kind: 'free' });
    }
  });

  it('interpolates control points so the arrow renders as a straight line', () => {
    const tool = createArrowTool();
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(90, 0));
    const cmd = dispatched[0];
    if (cmd?.type === 'add-arrow') {
      expect(cmd.arrow.geometry.c1.x).toBeCloseTo(30);
      expect(cmd.arrow.geometry.c2.x).toBeCloseTo(60);
      expect(cmd.arrow.geometry.c1.y).toBe(0);
      expect(cmd.arrow.geometry.c2.y).toBe(0);
    }
  });

  it('does not dispatch when the drag is shorter than the minimum length', () => {
    const tool = createArrowTool();
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(2, 2));
    expect(dispatched).toEqual([]);
  });
});
