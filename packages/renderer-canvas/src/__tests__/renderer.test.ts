import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasRenderer } from '../renderer.js';
import { createEmptyDocument, createAtom } from '@kendraw/scene';
import type { Document } from '@kendraw/scene';

// Polyfill ResizeObserver for jsdom
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}

// jsdom doesn't fully implement canvas, so we need to mock getContext
function mockCanvasContext() {
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
    translate: vi.fn(),
    setTransform: vi.fn(),
    strokeStyle: '',
    lineWidth: 1,
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
  };

  // Patch HTMLCanvasElement.prototype.getContext for jsdom
  const original = HTMLCanvasElement.prototype.getContext;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLCanvasElement.prototype.getContext = function (contextId: string): any {
    if (contextId === '2d') return ctx;
    return original.call(this, contextId);
  };

  return {
    ctx,
    restore: () => {
      HTMLCanvasElement.prototype.getContext = original;
    },
  };
}

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;
  let container: HTMLElement;
  let mock: ReturnType<typeof mockCanvasContext>;

  beforeEach(() => {
    mock = mockCanvasContext();
    renderer = new CanvasRenderer();
    container = document.createElement('div');

    // Mock getBoundingClientRect for size
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      top: 0,
      right: 800,
      bottom: 600,
      left: 0,
      toJSON: () => ({}),
    });

    document.body.appendChild(container);
  });

  afterEach(() => {
    renderer.detach();
    document.body.removeChild(container);
    mock.restore();
  });

  describe('attach', () => {
    it('creates a canvas element in the container', () => {
      renderer.attach(container);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
    });

    it('canvas has correct display style', () => {
      renderer.attach(container);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas?.style.display).toBe('block');
      expect(canvas?.style.width).toBe('100%');
      expect(canvas?.style.height).toBe('100%');
    });
  });

  describe('detach', () => {
    it('removes canvas from container', () => {
      renderer.attach(container);
      expect(container.querySelector('canvas')).not.toBeNull();

      renderer.detach();
      expect(container.querySelector('canvas')).toBeNull();
    });

    it('is safe to call without prior attach', () => {
      expect(() => renderer.detach()).not.toThrow();
    });
  });

  describe('render', () => {
    it('does not throw for 0 atoms', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      expect(() => renderer.render(doc)).not.toThrow();
    });

    it('does not throw for 1 atom', () => {
      renderer.attach(container);
      const doc = createDocWithAtoms(1);
      expect(() => renderer.render(doc)).not.toThrow();
    });

    it('does not throw for 100 atoms', () => {
      renderer.attach(container);
      const doc = createDocWithAtoms(100);
      expect(() => renderer.render(doc)).not.toThrow();
    });

    it('clears canvas before rendering', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      renderer.render(doc);
      expect(mock.ctx.clearRect).toHaveBeenCalled();
    });

    it('draws circle and label for each atom', () => {
      renderer.attach(container);
      const doc = createDocWithAtoms(3);
      renderer.render(doc);

      // 3 atoms = 3 arc calls + 3 fillText calls
      expect(mock.ctx.arc).toHaveBeenCalledTimes(3);
      expect(mock.ctx.fillText).toHaveBeenCalledTimes(3);
    });

    it('is safe to call without attach', () => {
      const doc = createEmptyDocument();
      expect(() => renderer.render(doc)).not.toThrow();
    });
  });
});

function createDocWithAtoms(count: number): Document {
  const doc = createEmptyDocument();
  const page = doc.pages[0];
  if (!page) throw new Error('Expected at least one page');
  for (let i = 0; i < count; i++) {
    const atom = createAtom(i * 30, i * 30, 6);
    page.atoms[atom.id] = atom;
  }
  return doc;
}
