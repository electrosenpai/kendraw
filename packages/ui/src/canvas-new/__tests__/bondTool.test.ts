// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect, vi } from 'vitest';
import { createBondTool } from '../tools/bondTool';
import type { ToolContext, ToolEventPayload } from '../types';
import {
  createSceneStore,
  createAtom,
  type AtomId,
  type BondId,
  type Command,
  type Page,
  type SceneStore,
} from '@kendraw/scene';

function payload(
  x: number,
  y: number,
  modifiers: Partial<ToolEventPayload<PointerEvent>['modifiers']> = {},
): ToolEventPayload<PointerEvent> {
  return {
    screen: { x, y },
    world: { x, y },
    modifiers: { shift: false, ctrl: false, alt: false, meta: false, ...modifiers },
    event: new PointerEvent('pointerdown', { clientX: x, clientY: y }),
  };
}

interface CtxHandle {
  ctx: ToolContext;
  store: SceneStore;
  page(): Page;
  dispatched: Command[];
  hover: ReturnType<typeof vi.fn>;
}

function makeCtx(seedAtoms: Array<{ x: number; y: number }> = []): CtxHandle {
  const store = createSceneStore();
  const ids: AtomId[] = [];
  for (const a of seedAtoms) {
    const atom = createAtom(a.x, a.y);
    store.dispatch({ type: 'add-atom', atom });
    ids.push(atom.id);
  }
  const dispatched: Command[] = [];
  const hover = vi.fn();
  const ctx: ToolContext = {
    store,
    worldFromScreen: (x: number, y: number) => ({ x, y }),
    hitTestAtom: (world) => {
      const page = store.getState().pages[store.getState().activePageIndex];
      if (!page) return null;
      for (const id in page.atoms) {
        const a = page.atoms[id as AtomId];
        if (!a) continue;
        if (Math.hypot(world.x - a.x, world.y - a.y) <= 14) return a.id;
      }
      return null;
    },
    hitTestBond: () => null,
    searchAtomsInRect: () => [],
    setSelectedAtoms: () => {},
    setSelectionRect: () => {},
    requestRepaint: () => {},
    setHoverPreview: hover,
    getActivePage: () => {
      const doc = store.getState();
      return doc.pages[doc.activePageIndex] ?? null;
    },
    dispatch: (cmd) => {
      dispatched.push(cmd);
      store.dispatch(cmd);
    },
  };
  return {
    ctx,
    store,
    page: () => {
      const doc = store.getState();
      const p = doc.pages[doc.activePageIndex];
      if (!p) throw new Error('expected active page');
      return p;
    },
    dispatched,
    hover,
  };
}

describe('createBondTool — hover (W4-R-04)', () => {
  it('publishes an atom-extension preview when hovering an atom', () => {
    const handle = makeCtx([{ x: 100, y: 100 }]);
    const tool = createBondTool();
    tool.activate?.(handle.ctx);
    tool.pointermove?.(handle.ctx, payload(100, 100));
    expect(handle.hover).toHaveBeenCalled();
    const last = handle.hover.mock.calls.at(-1)?.[0];
    expect(last).not.toBeNull();
    expect(last?.kind).toBe('atom-extension');
  });

  it('skips repeated repaints while hovering the same atom (anti-flicker)', () => {
    const handle = makeCtx([{ x: 100, y: 100 }]);
    const tool = createBondTool();
    tool.activate?.(handle.ctx);
    tool.pointermove?.(handle.ctx, payload(100, 100));
    tool.pointermove?.(handle.ctx, payload(101, 101));
    tool.pointermove?.(handle.ctx, payload(99, 99));
    // 1 activate (clear) + 1 entry (atom hovered). Repeat moves on the same
    // atom must not produce additional setHoverPreview invocations.
    expect(handle.hover).toHaveBeenCalledTimes(2);
  });

  it('clears the preview when leaving the hotspot', () => {
    const handle = makeCtx([{ x: 100, y: 100 }]);
    const tool = createBondTool();
    tool.activate?.(handle.ctx);
    tool.pointermove?.(handle.ctx, payload(100, 100));
    tool.pointermove?.(handle.ctx, payload(500, 500));
    const last = handle.hover.mock.calls.at(-1)?.[0];
    expect(last).toBeNull();
  });
});

describe('createBondTool — click & drag (W4-R-04 / W4-R-10)', () => {
  it('click on atom commits a bond at the default angle', () => {
    const handle = makeCtx([{ x: 100, y: 100 }]);
    const tool = createBondTool();
    tool.activate?.(handle.ctx);
    tool.pointerdown?.(handle.ctx, payload(100, 100));
    tool.pointerup?.(handle.ctx, payload(100, 100));
    const types = handle.dispatched.map((c) => c.type);
    expect(types).toContain('add-atom');
    expect(types).toContain('add-bond');
  });

  it('click on empty space adds a fresh carbon', () => {
    const handle = makeCtx();
    const tool = createBondTool();
    tool.activate?.(handle.ctx);
    tool.pointerdown?.(handle.ctx, payload(60, 60));
    expect(handle.dispatched.map((c) => c.type)).toEqual(['add-atom']);
  });

  it('drag from atom to existing atom creates a connecting bond, no new atom', () => {
    const handle = makeCtx([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
    ]);
    const tool = createBondTool();
    tool.activate?.(handle.ctx);
    tool.pointerdown?.(handle.ctx, payload(0, 0));
    tool.pointermove?.(handle.ctx, payload(80, 0));
    tool.pointerup?.(handle.ctx, payload(80, 0));
    const types = handle.dispatched.map((c) => c.type);
    expect(types.filter((t) => t === 'add-atom')).toHaveLength(0);
    expect(types).toContain('add-bond');
  });

  it('click on an existing bond cycles its order', () => {
    const handle = makeCtx([
      { x: 0, y: 0 },
      { x: 40, y: 0 },
    ]);
    // Add a bond between the two atoms.
    const page = handle.page();
    const ids = Object.keys(page.atoms) as AtomId[];
    const [fromId, toId] = ids;
    if (!fromId || !toId) throw new Error('expected two atoms');
    handle.store.dispatch({
      type: 'add-bond',
      bond: {
        id: 'b-test' as BondId,
        fromAtomId: fromId,
        toAtomId: toId,
        order: 1,
        style: 'single',
      },
    });
    const ctxWithBondHit: ToolContext = {
      ...handle.ctx,
      hitTestBond: () => 'b-test' as BondId,
    };
    const tool = createBondTool();
    tool.activate?.(ctxWithBondHit);
    tool.pointerdown?.(ctxWithBondHit, payload(20, 5));
    expect(handle.dispatched.find((c) => c.type === 'cycle-bond')).toBeTruthy();
  });
});
