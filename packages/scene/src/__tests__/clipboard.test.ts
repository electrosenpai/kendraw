import { describe, it, expect } from 'vitest';
import { copySelection, prepareForPaste } from '../clipboard.js';
import { createAtom, createBond } from '../helpers.js';
import type { Page, ArrowId, AnnotationId, GroupId } from '../types.js';

function createPage(
  atoms: ReturnType<typeof createAtom>[],
  bonds: ReturnType<typeof createBond>[] = [],
): Page {
  const atomMap = {} as Page['atoms'];
  for (const a of atoms) atomMap[a.id] = a;
  const bondMap = {} as Page['bonds'];
  for (const b of bonds) bondMap[b.id] = b;
  return {
    id: 'test',
    atoms: atomMap,
    bonds: bondMap,
    arrows: {} as Record<ArrowId, never>,
    annotations: {} as Record<AnnotationId, never>,
    groups: {} as Record<GroupId, never>,
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

describe('Clipboard', () => {
  describe('copySelection', () => {
    it('copies selected atoms', () => {
      const a1 = createAtom(10, 20);
      const a2 = createAtom(30, 40);
      const a3 = createAtom(50, 60);
      const page = createPage([a1, a2, a3]);

      const data = copySelection(page, [a1.id, a2.id]);
      expect(data.atoms).toHaveLength(2);
    });

    it('copies bonds between selected atoms', () => {
      const a1 = createAtom(0, 0);
      const a2 = createAtom(100, 0);
      const bond = createBond(a1.id, a2.id);
      const page = createPage([a1, a2], [bond]);

      const data = copySelection(page, [a1.id, a2.id]);
      expect(data.bonds).toHaveLength(1);
    });

    it('excludes bonds where one endpoint is not selected', () => {
      const a1 = createAtom(0, 0);
      const a2 = createAtom(100, 0);
      const bond = createBond(a1.id, a2.id);
      const page = createPage([a1, a2], [bond]);

      const data = copySelection(page, [a1.id]);
      expect(data.bonds).toHaveLength(0);
    });
  });

  describe('prepareForPaste', () => {
    it('generates new IDs', () => {
      const a1 = createAtom(10, 20);
      const data = { atoms: [a1], bonds: [] };

      const result = prepareForPaste(data, 50, 50);
      expect(result.atoms).toHaveLength(1);
      expect(result.atoms[0]?.id).not.toBe(a1.id);
    });

    it('applies offset to positions', () => {
      const a1 = createAtom(10, 20);
      const data = { atoms: [a1], bonds: [] };

      const result = prepareForPaste(data, 50, 50);
      expect(result.atoms[0]?.x).toBe(60);
      expect(result.atoms[0]?.y).toBe(70);
    });

    it('remaps bond IDs', () => {
      const a1 = createAtom(0, 0);
      const a2 = createAtom(100, 0);
      const bond = createBond(a1.id, a2.id);
      const data = { atoms: [a1, a2], bonds: [bond] };

      const result = prepareForPaste(data, 0, 0);
      expect(result.bonds).toHaveLength(1);
      expect(result.bonds[0]?.fromAtomId).toBe(result.atoms[0]?.id);
      expect(result.bonds[0]?.toAtomId).toBe(result.atoms[1]?.id);
    });
  });
});
