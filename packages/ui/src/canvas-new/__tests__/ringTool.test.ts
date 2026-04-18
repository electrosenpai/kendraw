// Wave-7 HF-2 — unit tests for createRingTool.

import { describe, it, expect } from 'vitest';
import type { Command } from '@kendraw/scene';
import { createRingTool } from '../tools/ringTool';
import type { ToolContext, ToolEventPayload } from '../types';

function evt(x: number, y: number): ToolEventPayload<PointerEvent> {
  return {
    screen: { x, y },
    world: { x, y },
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

describe('createRingTool — benzene', () => {
  it('places 6 atoms and 6 bonds on a click', () => {
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(200, 200));
    tool.pointerup?.(ctx, evt(200, 200));
    const atoms = dispatched.filter((c) => c.type === 'add-atom');
    const bonds = dispatched.filter((c) => c.type === 'add-bond');
    expect(atoms).toHaveLength(6);
    expect(bonds).toHaveLength(6);
  });

  it('uses aromatic style for benzene ring bonds', () => {
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    const bonds = dispatched.filter((c) => c.type === 'add-bond');
    for (const b of bonds) {
      if (b.type === 'add-bond') {
        expect(b.bond.order).toBe(1.5);
        expect(b.bond.style).toBe('aromatic');
      }
    }
  });
});

describe('createRingTool — cyclohexane', () => {
  it('places 6 single bonds', () => {
    const tool = createRingTool({ id: 'ring-cyclohexane', templateId: 'cyclohexane' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    const bonds = dispatched.filter((c) => c.type === 'add-bond');
    expect(bonds).toHaveLength(6);
    for (const b of bonds) {
      if (b.type === 'add-bond') {
        expect(b.bond.order).toBe(1);
      }
    }
  });
});

describe('createRingTool — robustness', () => {
  it('dispatches nothing when the pointer drags past the click threshold', () => {
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(100, 100));
    expect(dispatched).toEqual([]);
  });

  it('dispatches nothing for an unknown template id (no placeholder rings)', () => {
    const tool = createRingTool({ id: 'ring-bogus', templateId: 'not-a-real-template' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    expect(dispatched).toEqual([]);
  });
});
