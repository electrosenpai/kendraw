// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useToolDispatcher } from '../useToolDispatcher';
import { ToolRegistry } from '../toolRegistry';
import type { Tool, ToolContext } from '../types';
import { createSceneStore } from '@kendraw/scene';

function Harness({
  target,
  registry,
  context,
}: {
  target: HTMLElement | null;
  registry: ToolRegistry;
  context: ToolContext;
}): null {
  useToolDispatcher({ target, registry, context });
  return null;
}

let container: HTMLDivElement;
let root: Root;
let target: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  target = document.createElement('div');
  document.body.appendChild(target);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  target.remove();
});

function makeContext(): ToolContext {
  return {
    store: createSceneStore(),
    worldFromScreen: (x, y) => ({ x: x * 2, y: y * 2 }),
    hitTestAtom: () => null,
    hitTestBond: () => null,
    requestRepaint: () => {},
  };
}

describe('useToolDispatcher (W4-R-02)', () => {
  it('forwards pointerdown/move/up to the active tool', () => {
    const down = vi.fn();
    const move = vi.fn();
    const up = vi.fn();
    const tool: Tool = { id: 't', pointerdown: down, pointermove: move, pointerup: up };
    const registry = new ToolRegistry();
    registry.register(tool);
    registry.activate('t');
    const context = makeContext();

    act(() => {
      root.render(<Harness target={target} registry={registry} context={context} />);
    });

    act(() => {
      target.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 20 }));
      target.dispatchEvent(new PointerEvent('pointermove', { clientX: 11, clientY: 21 }));
      target.dispatchEvent(new PointerEvent('pointerup', { clientX: 12, clientY: 22 }));
    });

    expect(down).toHaveBeenCalledOnce();
    expect(move).toHaveBeenCalledOnce();
    expect(up).toHaveBeenCalledOnce();
    const payload = down.mock.calls[0]?.[1];
    expect(payload?.world).toEqual({ x: 20, y: 40 });
    expect(payload?.modifiers).toEqual({ shift: false, ctrl: false, alt: false, meta: false });
  });

  it('routes keydown to the active tool and Escape calls cancel() without keydown', () => {
    const key = vi.fn();
    const cancel = vi.fn();
    const tool: Tool = { id: 't', keydown: key, cancel };
    const registry = new ToolRegistry();
    registry.register(tool);
    registry.activate('t');
    const context = makeContext();

    act(() => {
      root.render(<Harness target={target} registry={registry} context={context} />);
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(key).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('does nothing when no target is supplied', () => {
    const down = vi.fn();
    const registry = new ToolRegistry();
    registry.register({ id: 't', pointerdown: down });
    registry.activate('t');
    const context = makeContext();

    act(() => {
      root.render(<Harness target={null} registry={registry} context={context} />);
    });

    act(() => {
      target.dispatchEvent(new PointerEvent('pointerdown', { clientX: 1, clientY: 1 }));
    });

    expect(down).not.toHaveBeenCalled();
  });

  it('removes listeners on unmount', () => {
    const down = vi.fn();
    const registry = new ToolRegistry();
    registry.register({ id: 't', pointerdown: down });
    registry.activate('t');
    const context = makeContext();

    act(() => {
      root.render(<Harness target={target} registry={registry} context={context} />);
    });
    act(() => {
      root.unmount();
    });

    target.dispatchEvent(new PointerEvent('pointerdown', { clientX: 1, clientY: 1 }));
    expect(down).not.toHaveBeenCalled();
  });
});
