// Wave-7 HF-2 — unit tests for createEraseTool.

import { describe, it, expect } from 'vitest';
import type { AtomId, BondId, Command } from '@kendraw/scene';
import { createEraseTool } from '../tools/eraseTool';
import type { ToolContext, ToolEventPayload } from '../types';

function evt(x: number, y: number): ToolEventPayload<PointerEvent> {
  return {
    screen: { x, y },
    world: { x, y },
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    event: new PointerEvent('pointerdown'),
  };
}

function makeCtx(opts: { atomHit?: AtomId | null; bondHit?: BondId | null }): {
  ctx: ToolContext;
  dispatched: Command[];
} {
  const dispatched: Command[] = [];
  const ctx = {
    store: {} as ToolContext['store'],
    worldFromScreen: (x: number, y: number) => ({ x, y }),
    hitTestAtom: () => opts.atomHit ?? null,
    hitTestBond: () => opts.bondHit ?? null,
    searchAtomsInRect: () => [],
    setSelectedAtoms: () => {},
    setSelectionRect: () => {},
    requestRepaint: () => {},
    dispatch: (c: Command) => dispatched.push(c),
  } as unknown as ToolContext;
  return { ctx, dispatched };
}

describe('createEraseTool', () => {
  it('removes the atom under the cursor on click', () => {
    const tool = createEraseTool();
    const { ctx, dispatched } = makeCtx({ atomHit: 'a1' as AtomId });
    tool.pointerdown?.(ctx, evt(10, 10));
    tool.pointerup?.(ctx, evt(10, 10));
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.type).toBe('remove-atom');
  });

  it('falls through to the bond when no atom is hit', () => {
    const tool = createEraseTool();
    const { ctx, dispatched } = makeCtx({ atomHit: null, bondHit: 'b1' as BondId });
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.type).toBe('remove-bond');
  });

  it('does nothing when clicking empty space', () => {
    const tool = createEraseTool();
    const { ctx, dispatched } = makeCtx({});
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    expect(dispatched).toEqual([]);
  });

  it('ignores drags (screen distance above threshold)', () => {
    const tool = createEraseTool();
    const { ctx, dispatched } = makeCtx({ atomHit: 'a1' as AtomId });
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(100, 100));
    expect(dispatched).toEqual([]);
  });
});
