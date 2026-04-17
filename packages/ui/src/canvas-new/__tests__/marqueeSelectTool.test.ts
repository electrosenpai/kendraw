// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect, vi } from 'vitest';
import { createMarqueeSelectTool } from '../tools/marqueeSelectTool';
import type { ToolContext, ToolEventPayload } from '../types';
import { createSceneStore } from '@kendraw/scene';
import type { AtomId, Point } from '@kendraw/scene';

function payload(x: number, y: number): ToolEventPayload<PointerEvent> {
  const e = new PointerEvent('pointerdown', { clientX: x, clientY: y });
  return {
    screen: { x, y },
    world: { x, y },
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
    event: e,
  };
}

function makeCtx(
  overrides: Partial<Pick<ToolContext, 'hitTestAtom' | 'searchAtomsInRect'>> = {},
): ToolContext & {
  _selected: AtomId[][];
  _rects: (Point[] | null)[];
  _repaints: number;
} {
  const selected: AtomId[][] = [];
  const rects: (Point[] | null)[] = [];
  let repaints = 0;
  return {
    store: createSceneStore(),
    worldFromScreen: (x, y) => ({ x, y }),
    hitTestAtom: overrides.hitTestAtom ?? (() => null),
    hitTestBond: () => null,
    searchAtomsInRect: overrides.searchAtomsInRect ?? (() => []),
    setSelectedAtoms: (ids) => {
      selected.push([...ids]);
    },
    setSelectionRect: (rect) => {
      rects.push(rect ? [{ x: rect.x1, y: rect.y1 }, { x: rect.x2, y: rect.y2 }] : null);
    },
    requestRepaint: () => {
      repaints += 1;
    },
    _selected: selected,
    _rects: rects,
    get _repaints() {
      return repaints;
    },
  } as ToolContext & {
    _selected: AtomId[][];
    _rects: (Point[] | null)[];
    _repaints: number;
  };
}

describe('createMarqueeSelectTool (W4-R-06)', () => {
  it('clicking an atom selects just that atom, no rubber-band', () => {
    const target = 'a-42' as AtomId;
    const tool = createMarqueeSelectTool();
    const ctx = makeCtx({ hitTestAtom: () => target });
    tool.pointerdown?.(ctx, payload(10, 10));
    expect(ctx._selected.at(-1)).toEqual([target]);
    expect(ctx._rects.at(-1)).toBeNull();
  });

  it('drags a rubber-band rectangle and selects contained atoms on pointerup', () => {
    const inside = ['a-1', 'a-2'] as AtomId[];
    const searchSpy = vi.fn(() => inside);
    const tool = createMarqueeSelectTool();
    const ctx = makeCtx({ searchAtomsInRect: searchSpy });
    tool.pointerdown?.(ctx, payload(5, 5));
    tool.pointermove?.(ctx, payload(60, 80));
    tool.pointermove?.(ctx, payload(100, 120));
    tool.pointerup?.(ctx, payload(100, 120));
    expect(searchSpy).toHaveBeenCalledWith({ x: 5, y: 5 }, { x: 100, y: 120 });
    expect(ctx._selected.at(-1)).toEqual(inside);
    expect(ctx._rects.at(-1)).toBeNull();
  });

  it('cancel clears rect and selection', () => {
    const tool = createMarqueeSelectTool();
    const ctx = makeCtx();
    tool.pointerdown?.(ctx, payload(0, 0));
    tool.pointermove?.(ctx, payload(20, 20));
    tool.cancel?.(ctx);
    expect(ctx._selected.at(-1)).toEqual([]);
    expect(ctx._rects.at(-1)).toBeNull();
  });

  it('pointerup before pointerdown is a no-op', () => {
    const tool = createMarqueeSelectTool();
    const ctx = makeCtx();
    tool.pointerup?.(ctx, payload(10, 10));
    expect(ctx._selected).toEqual([]);
    expect(ctx._rects).toEqual([]);
  });

  it('pointermove without an active drag is a no-op', () => {
    const tool = createMarqueeSelectTool();
    const ctx = makeCtx();
    tool.pointermove?.(ctx, payload(10, 10));
    expect(ctx._rects).toEqual([]);
  });
});
