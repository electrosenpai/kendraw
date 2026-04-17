// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Reimplemented from scratch for Kendraw.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { CanvasNew } from '../CanvasNew';
import { createSceneStore, createAtom } from '@kendraw/scene';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof globalThis.ResizeObserver;
}

function installCanvasMock(): () => void {
  const ctx = {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    scale: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    ellipse: vi.fn(),
    arcTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    rect: vi.fn(),
    translate: vi.fn(),
    setTransform: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    save: vi.fn(),
    restore: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  };
  const original = HTMLCanvasElement.prototype.getContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = function (id: string): any {
    if (id === '2d') return ctx;
    return original.call(this, id);
  };
  return () => {
    HTMLCanvasElement.prototype.getContext = original;
  };
}

let container: HTMLDivElement;
let root: Root;
let restoreCanvas: () => void;

beforeEach(() => {
  restoreCanvas = installCanvasMock();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  restoreCanvas();
});

describe('CanvasNew shell (W4-R-01/R-03)', () => {
  it('renders the four grid-area mount points', () => {
    const store = createSceneStore();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    expect(container.querySelector('[data-testid="canvas-new-toolbar"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="canvas-new-root"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="canvas-new-properties"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="canvas-new-status"]')).not.toBeNull();
  });

  it('labels the canvas region as a new-wave-4 shell for a11y', () => {
    const store = createSceneStore();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    const region = container.querySelector('[role="region"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-label')).toMatch(/new canvas/i);
    expect(region?.getAttribute('data-testid')).toBe('canvas-new-root');
  });

  it('does not mutate the passed store on mount', () => {
    const store = createSceneStore();
    const before = store.getState();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    expect(store.getState()).toBe(before);
  });

  it('mounts a canvas element into the canvas host (W4-R-03)', () => {
    const store = createSceneStore();
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    const host = container.querySelector('[data-testid="canvas-new-root"]');
    expect(host?.querySelector('canvas')).not.toBeNull();
  });

  it('re-renders on store changes (W4-R-03)', () => {
    const store = createSceneStore();
    const renderSpy = vi.fn();
    const original = HTMLCanvasElement.prototype.getContext;
    // Watch render by spying on clearRect on any newly created context
    let installedCtx: { clearRect: () => void } | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HTMLCanvasElement.prototype.getContext = function (id: string): any {
      const got = original.call(this, id);
      if (id === '2d' && got && !installedCtx) {
        installedCtx = got as unknown as { clearRect: () => void };
        const realClear = installedCtx.clearRect.bind(installedCtx);
        installedCtx.clearRect = (...args: unknown[]) => {
          renderSpy();
          (realClear as (...a: unknown[]) => void)(...args);
        };
      }
      return got;
    };
    act(() => {
      root.render(<CanvasNew store={store} />);
    });
    const callsAfterMount = renderSpy.mock.calls.length;
    act(() => {
      store.dispatch({ type: 'add-atom', atom: createAtom(10, 20) });
    });
    expect(renderSpy.mock.calls.length).toBeGreaterThan(callsAfterMount);
    HTMLCanvasElement.prototype.getContext = original;
  });
});
