// Wave-7 HF-2 — unit tests for createAtomTool.

import { describe, it, expect, vi } from 'vitest';
import type { AtomId, Command } from '@kendraw/scene';
import { createAtomTool } from '../tools/atomTool';
import type { ToolContext, ToolEventPayload } from '../types';

function evt(x: number, y: number): ToolEventPayload<PointerEvent> {
  return {
    screen: { x, y },
    world: { x, y },
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    event: new PointerEvent('pointerdown'),
  };
}

function makeCtx(hit: AtomId | null = null): { ctx: ToolContext; dispatched: Command[] } {
  const dispatched: Command[] = [];
  const ctx = {
    store: {} as ToolContext['store'],
    worldFromScreen: (x: number, y: number) => ({ x, y }),
    hitTestAtom: () => hit,
    hitTestBond: () => null,
    searchAtomsInRect: () => [],
    setSelectedAtoms: () => {},
    setSelectionRect: () => {},
    requestRepaint: () => {},
    dispatch: (c: Command) => dispatched.push(c),
  } as unknown as ToolContext;
  return { ctx, dispatched };
}

describe('createAtomTool', () => {
  it('places a new atom of the configured element on a click in empty space', () => {
    const tool = createAtomTool({ id: 'atom-n', element: 7 });
    const { ctx, dispatched } = makeCtx(null);
    tool.pointerdown?.(ctx, evt(100, 100));
    tool.pointerup?.(ctx, evt(100, 100));
    expect(dispatched).toHaveLength(1);
    const cmd = dispatched[0];
    expect(cmd?.type).toBe('add-atom');
    if (cmd?.type === 'add-atom') {
      expect(cmd.atom.element).toBe(7);
      expect(cmd.atom.x).toBe(100);
    }
  });

  it('updates the element of the hovered atom when clicking on one', () => {
    const id = 'a1' as AtomId;
    const tool = createAtomTool({ id: 'atom-o', element: 8 });
    const { ctx, dispatched } = makeCtx(id);
    tool.pointerdown?.(ctx, evt(10, 10));
    tool.pointerup?.(ctx, evt(10, 10));
    expect(dispatched).toHaveLength(1);
    const cmd = dispatched[0];
    expect(cmd?.type).toBe('update-atom');
    if (cmd?.type === 'update-atom') {
      expect(cmd.id).toBe(id);
      expect(cmd.changes.element).toBe(8);
    }
  });

  it('skips when the pointer moves beyond the drag threshold (caller probably meant to drag)', () => {
    const tool = createAtomTool({ id: 'atom-c', element: 6 });
    const { ctx, dispatched } = makeCtx(null);
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(50, 50));
    expect(dispatched).toEqual([]);
  });

  it('cancel() clears the down state so later clicks are not wrongly committed', () => {
    const tool = createAtomTool({ id: 'atom-c', element: 6 });
    const { ctx, dispatched } = makeCtx(null);
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.cancel?.(ctx);
    tool.pointerup?.(ctx, evt(0, 0));
    expect(dispatched).toEqual([]);
  });
});

describe('createAtomTool id + label', () => {
  it('uses the id provided in options', () => {
    expect(createAtomTool({ id: 'atom-h', element: 1 }).id).toBe('atom-h');
  });
  it('has a label that encodes the atomic number', () => {
    expect(createAtomTool({ id: 'atom-c', element: 6 }).label).toMatch(/Z=6/);
  });
});

// vi imported so test harness stays consistent across the folder.
void vi;
