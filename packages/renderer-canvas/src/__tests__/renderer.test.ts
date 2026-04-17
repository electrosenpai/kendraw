import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasRenderer } from '../renderer.js';
import { createEmptyDocument, createAtom, createBond } from '@kendraw/scene';
import type { Document, Arrow, ArrowId, ShapeId } from '@kendraw/scene';

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

  describe('reaction arrow conditions (wave-1 P1-1)', () => {
    it('renders above and below conditions text near midpoint', () => {
      renderer.attach(container);
      const doc = createDocWithArrow({
        conditions: { above: 'Pd/C', below: 'EtOH, rt' },
      });
      mock.ctx.fillText.mockClear();
      renderer.render(doc);
      const texts = mock.ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts).toContain('Pd/C');
      expect(texts).toContain('EtOH, rt');
    });

    it('renders no conditions when field is absent', () => {
      renderer.attach(container);
      const doc = createDocWithArrow();
      mock.ctx.fillText.mockClear();
      renderer.render(doc);
      const texts = mock.ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts).not.toContain('Pd/C');
    });

    it('does not render conditions on curly arrows', () => {
      renderer.attach(container);
      const doc = createDocWithArrow({
        type: 'curly-pair',
        conditions: { above: 'SHOULD_NOT_APPEAR' },
      });
      mock.ctx.fillText.mockClear();
      renderer.render(doc);
      const texts = mock.ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts).not.toContain('SHOULD_NOT_APPEAR');
    });
  });

  describe('compound numbering (wave-1 P1-2)', () => {
    it('renders no number labels when numbering is disabled or absent', () => {
      renderer.attach(container);
      const doc = createDocWithAtoms(1);
      mock.ctx.fillText.mockClear();
      renderer.render(doc);
      const texts = mock.ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts).not.toContain('1');
    });

    it('renders "1" under a single connected molecule when enabled', () => {
      renderer.attach(container);
      const doc = createDocWithAtoms(3);
      const page = doc.pages[0];
      if (!page) throw new Error('expected page');
      page.compoundNumbering = { enabled: true, assignments: {}, nextNumber: 1 };
      const [first] = Object.keys(page.atoms) as Array<keyof typeof page.atoms>;
      if (!first) throw new Error('expected atom');
      page.compoundNumbering.assignments[first] = 1;
      mock.ctx.fillText.mockClear();
      renderer.render(doc);
      const texts = mock.ctx.fillText.mock.calls.map((c) => c[0]);
      expect(texts).toContain('1');
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

  describe('shapes (wave-3 B1)', () => {
    it('draws a rect shape with strokeRect', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      const page = doc.pages[0];
      if (!page) throw new Error('expected page');
      page.shapes = {
        s1: {
          kind: 'rect',
          id: 's1' as unknown as ShapeId,
          x: 10,
          y: 20,
          w: 40,
          h: 30,
          strokeColor: '#f00',
          strokeWidth: 2,
        },
      } as unknown as NonNullable<typeof page.shapes>;
      mock.ctx.strokeRect.mockClear();
      renderer.render(doc);
      expect(mock.ctx.strokeRect).toHaveBeenCalledWith(10, 20, 40, 30);
    });

    it('draws an ellipse shape with ctx.ellipse', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      const page = doc.pages[0];
      if (!page) throw new Error('expected page');
      page.shapes = {
        e1: {
          kind: 'ellipse',
          id: 'e1' as unknown as ShapeId,
          x: 0,
          y: 0,
          w: 80,
          h: 40,
          strokeColor: '#333',
          strokeWidth: 1,
        },
      } as unknown as NonNullable<typeof page.shapes>;
      mock.ctx.ellipse.mockClear();
      mock.ctx.stroke.mockClear();
      renderer.render(doc);
      expect(mock.ctx.ellipse).toHaveBeenCalledWith(40, 20, 40, 20, 0, 0, Math.PI * 2);
      expect(mock.ctx.stroke).toHaveBeenCalled();
    });

    it('fills a rect when fillColor is set', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      const page = doc.pages[0];
      if (!page) throw new Error('expected page');
      page.shapes = {
        s2: {
          kind: 'rect',
          id: 's2' as unknown as ShapeId,
          x: 5,
          y: 5,
          w: 10,
          h: 10,
          strokeColor: '#000',
          strokeWidth: 1,
          fillColor: '#ff0',
        },
      } as unknown as NonNullable<typeof page.shapes>;
      mock.ctx.fillRect.mockClear();
      renderer.render(doc);
      expect(mock.ctx.fillRect).toHaveBeenCalledWith(5, 5, 10, 10);
    });

    it('is a no-op when page.shapes is undefined', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      mock.ctx.strokeRect.mockClear();
      renderer.render(doc);
      expect(mock.ctx.strokeRect).not.toHaveBeenCalled();
    });
  });

  describe('grid overlay (wave-3 B2)', () => {
    it('does not draw dots when grid is hidden (default)', () => {
      renderer.attach(container);
      const doc = createEmptyDocument();
      mock.ctx.arc.mockClear();
      renderer.render(doc);
      // arc() may be called for atom dots, but with grid off it must not be
      // called for grid tiling; a cheap proxy is to compare the call count
      // before and after enabling the grid.
      const withoutGrid = mock.ctx.arc.mock.calls.length;
      renderer.setGridVisible(true);
      mock.ctx.arc.mockClear();
      renderer.render(doc);
      const withGrid = mock.ctx.arc.mock.calls.length;
      expect(withGrid).toBeGreaterThan(withoutGrid);
    });

    it('setGridVisible toggles state without throwing', () => {
      renderer.attach(container);
      renderer.setGridVisible(true);
      renderer.setGridVisible(false);
      expect(true).toBe(true);
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

function createDocWithArrow(overrides?: Partial<Arrow>): Document {
  const doc = createEmptyDocument();
  const page = doc.pages[0];
  if (!page) throw new Error('Expected at least one page');
  const arrow: Arrow = {
    id: crypto.randomUUID() as ArrowId,
    type: overrides?.type ?? 'forward',
    geometry: overrides?.geometry ?? {
      start: { x: 100, y: 100 },
      c1: { x: 130, y: 80 },
      c2: { x: 170, y: 80 },
      end: { x: 200, y: 100 },
    },
    startAnchor: { kind: 'free' },
    endAnchor: { kind: 'free' },
    ...(overrides?.conditions ? { conditions: overrides.conditions } : {}),
  };
  page.arrows[arrow.id] = arrow;
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
