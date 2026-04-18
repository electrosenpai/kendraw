// Wave-7 HF-2 — unit tests for createRingTool.
// Wave-7 HF-D — fusion paths exercised via mocked hit-tests + active page.

import { describe, it, expect } from 'vitest';
import { createAtom, createBond, type AtomId, type Command, type Page } from '@kendraw/scene';
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

  it('uses Kekulé alternation (3 single + 3 double) for benzene ring bonds', () => {
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    const bonds = dispatched.flatMap((c) => (c.type === 'add-bond' ? [c.bond] : []));
    expect(bonds).toHaveLength(6);
    const singles = bonds.filter((b) => b.order === 1 && b.style === 'single').length;
    const doubles = bonds.filter((b) => b.order === 2 && b.style === 'double').length;
    expect(singles).toBe(3);
    expect(doubles).toBe(3);
    const aromatic = bonds.filter((b) => b.order === 1.5);
    expect(aromatic).toHaveLength(0);
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

describe('createRingTool — HF-D fusion', () => {
  function pageWithBond(): { page: Page; aId: AtomId; bId: AtomId } {
    const a = createAtom(0, 0);
    const b = createAtom(50, 0);
    const bond = createBond(a.id, b.id, 1, 'single');
    const page: Page = {
      id: 'p',
      atoms: { [a.id]: a, [b.id]: b },
      bonds: { [bond.id]: bond },
      arrows: {},
      annotations: {},
      groups: {},
      shapes: {},
      viewport: { x: 0, y: 0, zoom: 1 },
    } as Page;
    return { page, aId: a.id, bId: b.id };
  }

  it('clicking on an existing bond fuses the new ring (4 new atoms + 5 new bonds for benzene)', () => {
    const { page } = pageWithBond();
    const bondId = Object.keys(page.bonds)[0];
    if (!bondId) throw new Error('expected one bond in fixture');
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
    const dispatched: Command[] = [];
    const ctx = {
      store: {} as ToolContext['store'],
      worldFromScreen: (x: number, y: number) => ({ x, y }),
      hitTestAtom: () => null,
      hitTestBond: () => bondId,
      searchAtomsInRect: () => [],
      setSelectedAtoms: () => {},
      setSelectionRect: () => {},
      requestRepaint: () => {},
      dispatch: (c: Command) => dispatched.push(c),
      getActivePage: () => page,
    } as unknown as ToolContext;
    tool.pointerdown?.(ctx, evt(25, 5));
    tool.pointerup?.(ctx, evt(25, 5));
    const atoms = dispatched.filter((c) => c.type === 'add-atom');
    const bonds = dispatched.filter((c) => c.type === 'add-bond');
    expect(atoms).toHaveLength(4);
    expect(bonds).toHaveLength(5);
  });

  it('clicking on an existing atom fuses spiro-style (5 new atoms + 6 bonds for benzene)', () => {
    const { page, aId } = pageWithBond();
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
    const dispatched: Command[] = [];
    const ctx = {
      store: {} as ToolContext['store'],
      worldFromScreen: (x: number, y: number) => ({ x, y }),
      hitTestAtom: () => aId,
      hitTestBond: () => null,
      searchAtomsInRect: () => [],
      setSelectedAtoms: () => {},
      setSelectionRect: () => {},
      requestRepaint: () => {},
      dispatch: (c: Command) => dispatched.push(c),
      getActivePage: () => page,
    } as unknown as ToolContext;
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    const atoms = dispatched.filter((c) => c.type === 'add-atom');
    const bonds = dispatched.filter((c) => c.type === 'add-bond');
    expect(atoms).toHaveLength(5);
    expect(bonds).toHaveLength(6);
  });

  it('empty-space click still drops an isolated ring (6 + 6 for benzene)', () => {
    const { page } = pageWithBond();
    const tool = createRingTool({ id: 'ring-benzene', templateId: 'benzene' });
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
      getActivePage: () => page,
    } as unknown as ToolContext;
    tool.pointerdown?.(ctx, evt(500, 500));
    tool.pointerup?.(ctx, evt(500, 500));
    const atoms = dispatched.filter((c) => c.type === 'add-atom');
    const bonds = dispatched.filter((c) => c.type === 'add-bond');
    expect(atoms).toHaveLength(6);
    expect(bonds).toHaveLength(6);
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
