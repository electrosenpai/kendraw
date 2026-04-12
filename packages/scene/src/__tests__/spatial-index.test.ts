import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialIndex } from '../spatial-index.js';
import { createAtom } from '../helpers.js';
import type { Page } from '../types.js';
import type { AtomId, BondId, ArrowId, AnnotationId, GroupId } from '../types.js';

function createPage(atoms: ReturnType<typeof createAtom>[]): Page {
  const atomMap: Record<AtomId, (typeof atoms)[0]> = {} as Page['atoms'];
  for (const a of atoms) {
    atomMap[a.id] = a;
  }
  return {
    id: 'test-page',
    atoms: atomMap,
    bonds: {} as Record<BondId, never>,
    arrows: {} as Record<ArrowId, never>,
    annotations: {} as Record<AnnotationId, never>,
    groups: {} as Record<GroupId, never>,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

describe('SpatialIndex', () => {
  let index: SpatialIndex;

  beforeEach(() => {
    index = new SpatialIndex();
  });

  describe('rebuild', () => {
    it('builds index from page atoms', () => {
      const page = createPage([createAtom(10, 20), createAtom(30, 40)]);
      expect(() => index.rebuild(page)).not.toThrow();
    });

    it('handles empty page', () => {
      const page = createPage([]);
      expect(() => index.rebuild(page)).not.toThrow();
    });
  });

  describe('hitTest', () => {
    it('returns atom id when clicking on an atom', () => {
      const atom = createAtom(100, 100);
      const page = createPage([atom]);
      index.rebuild(page);

      const result = index.hitTest(100, 100, 14);
      expect(result).toBe(atom.id);
    });

    it('returns null when clicking empty space', () => {
      const atom = createAtom(100, 100);
      const page = createPage([atom]);
      index.rebuild(page);

      const result = index.hitTest(500, 500, 14);
      expect(result).toBeNull();
    });

    it('returns closest atom when multiple in range', () => {
      const a1 = createAtom(100, 100);
      const a2 = createAtom(110, 100);
      const page = createPage([a1, a2]);
      index.rebuild(page);

      // Click closer to a1
      const result = index.hitTest(102, 100, 14);
      expect(result).toBe(a1.id);
    });

    it('returns null on empty index', () => {
      const page = createPage([]);
      index.rebuild(page);
      expect(index.hitTest(0, 0, 14)).toBeNull();
    });
  });

  describe('searchRect', () => {
    it('returns atoms within rectangle', () => {
      const a1 = createAtom(10, 10);
      const a2 = createAtom(20, 20);
      const a3 = createAtom(100, 100);
      const page = createPage([a1, a2, a3]);
      index.rebuild(page);

      const results = index.searchRect(0, 0, 50, 50);
      expect(results).toContain(a1.id);
      expect(results).toContain(a2.id);
      expect(results).not.toContain(a3.id);
    });

    it('returns empty array when no atoms in rect', () => {
      const a1 = createAtom(100, 100);
      const page = createPage([a1]);
      index.rebuild(page);

      const results = index.searchRect(0, 0, 10, 10);
      expect(results).toHaveLength(0);
    });

    it('handles inverted rect coordinates', () => {
      const a1 = createAtom(10, 10);
      const page = createPage([a1]);
      index.rebuild(page);

      // Bottom-right to top-left
      const results = index.searchRect(50, 50, 0, 0);
      expect(results).toContain(a1.id);
    });
  });
});
