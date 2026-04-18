// Wave-7 HF-2 — unit tests for createTextTool.

import { describe, it, expect } from 'vitest';
import type { Command } from '@kendraw/scene';
import { createTextTool } from '../tools/textTool';
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

describe('createTextTool', () => {
  it('prompts for text and dispatches add-annotation with the entered text', () => {
    const tool = createTextTool({ promptForText: () => 'Product A' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(200, 100));
    tool.pointerup?.(ctx, evt(200, 100));
    expect(dispatched).toHaveLength(1);
    const cmd = dispatched[0];
    expect(cmd?.type).toBe('add-annotation');
    if (cmd?.type === 'add-annotation') {
      expect(cmd.annotation.richText).toEqual([{ text: 'Product A' }]);
      expect(cmd.annotation.x).toBe(200);
      expect(cmd.annotation.y).toBe(100);
    }
  });

  it('does nothing when the user cancels the prompt (returns null)', () => {
    const tool = createTextTool({ promptForText: () => null });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    expect(dispatched).toEqual([]);
  });

  it('does nothing when the user enters empty/whitespace-only text', () => {
    const tool = createTextTool({ promptForText: () => '   ' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(0, 0));
    expect(dispatched).toEqual([]);
  });

  it('ignores drags past the click threshold', () => {
    const tool = createTextTool({ promptForText: () => 'x' });
    const { ctx, dispatched } = makeCtx();
    tool.pointerdown?.(ctx, evt(0, 0));
    tool.pointerup?.(ctx, evt(100, 100));
    expect(dispatched).toEqual([]);
  });
});
