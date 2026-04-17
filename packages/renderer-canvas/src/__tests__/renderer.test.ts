import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasRenderer } from '../renderer.js';
import { createEmptyDocument, createAtom, createBond } from '@kendraw/scene';
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

    it('renders atoms (labels or vertex dots)', () => {
      renderer.attach(container);
      const doc = createDocWithAtoms(3);
      renderer.render(doc);

      // Atoms render as either labels (fillText) or dots (arc) or fillRect (label bg)
      const totalCalls =
        mock.ctx.fillText.mock.calls.length +
        mock.ctx.arc.mock.calls.length +
        mock.ctx.fillRect.mock.calls.length;
      expect(totalCalls).toBeGreaterThan(0);
    });

    it('is safe to call without attach', () => {
      const doc = createEmptyDocument();
      expect(() => renderer.render(doc)).not.toThrow();
    });

    it('renders wedge bond as filled triangle (not a line)', () => {
      renderer.attach(container);
      const doc = createDocWithBond('wedge');
      mock.ctx.fill.mockClear();
      mock.ctx.closePath.mockClear();
      mock.ctx.moveTo.mockClear();
      mock.ctx.lineTo.mockClear();

      renderer.render(doc);

      // Wedge bond must call fill() (solid triangle), not just stroke
      expect(mock.ctx.fill).toHaveBeenCalled();
      // Should form a triangle: moveTo (tip) + 2x lineTo (base) + closePath
      expect(mock.ctx.closePath).toHaveBeenCalled();
    });

    it('renders hashed-wedge bond with multiple hash strokes', () => {
      renderer.attach(container);
      const doc = createDocWithBond('hashed-wedge');
      mock.ctx.stroke.mockClear();

      renderer.render(doc);

      // Hashed wedge draws multiple parallel lines (at least 3)
      expect(mock.ctx.stroke.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('renders hollow-wedge bond as stroked triangle outline', () => {
      renderer.attach(container);
      const doc = createDocWithBond('hollow-wedge');
      mock.ctx.stroke.mockClear();
      mock.ctx.closePath.mockClear();

      renderer.render(doc);

      // Hollow wedge: closePath + stroke (outline, not fill)
      expect(mock.ctx.closePath).toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('lasso path (wave-1 P1-7)', () => {
    it('draws no polygon when path is null', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      renderer.setLassoPath(null);
      mock.ctx.closePath.mockClear();
      renderer.render(doc);
      // No lasso means selection closePath isn't called for lasso
      // (selection rect is also absent here)
      expect(mock.ctx.closePath).not.toHaveBeenCalled();
    });

    it('draws a closed polygon outline when path has >=3 points', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      renderer.setLassoPath([
        { x: 10, y: 10 },
        { x: 100, y: 10 },
        { x: 55, y: 80 },
      ]);
      mock.ctx.stroke.mockClear();
      mock.ctx.fill.mockClear();
      mock.ctx.closePath.mockClear();
      renderer.render(doc);
      expect(mock.ctx.closePath).toHaveBeenCalled();
      expect(mock.ctx.stroke).toHaveBeenCalled();
      expect(mock.ctx.fill).toHaveBeenCalled();
    });

    it('treats empty array as null (no polygon)', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      renderer.setLassoPath([]);
      mock.ctx.closePath.mockClear();
      renderer.render(doc);
      expect(mock.ctx.closePath).not.toHaveBeenCalled();
    });
  });

  describe('theme (wave-1 P1-8)', () => {
    it('defaults to dark theme', () => {
      expect(renderer.getTheme()).toBe('dark');
    });

    it('switches to light theme and back', () => {
      renderer.setTheme('light');
      expect(renderer.getTheme()).toBe('light');
      renderer.setTheme('dark');
      expect(renderer.getTheme()).toBe('dark');
    });

    it('paints a light-theme label background over atom label (visible contrast)', () => {
      renderer.attach(container);
      renderer.setTheme('light');
      const doc = createDocWithAtoms(1);
      // Force an O atom so shouldShowLabel returns true.
      const firstPage = doc.pages[0];
      if (!firstPage) throw new Error('expected page');
      const firstAtomId = Object.keys(firstPage.atoms)[0];
      if (!firstAtomId) throw new Error('expected atom');
      const firstAtom = firstPage.atoms[firstAtomId as keyof typeof firstPage.atoms];
      if (!firstAtom) throw new Error('expected atom value');
      firstAtom.element = 8;
      mock.ctx.fillRect.mockClear();

      renderer.render(doc);

      expect(mock.ctx.fillRect).toHaveBeenCalled();
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

function createDocWithBond(style: Parameters<typeof createBond>[3]): Document {
  const doc = createEmptyDocument();
  const page = doc.pages[0];
  if (!page) throw new Error('Expected at least one page');
  const a1 = createAtom(100, 100, 6);
  const a2 = createAtom(140, 100, 6);
  page.atoms[a1.id] = a1;
  page.atoms[a2.id] = a2;
  const bond = createBond(a1.id, a2.id, 1, style);
  page.bonds[bond.id] = bond;
  return doc;
}
