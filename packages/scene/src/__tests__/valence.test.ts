import { describe, it, expect } from 'vitest';
import { validateValence } from '../valence.js';
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

describe('Valence validation', () => {
  it('reports no issues for valid methane (C with 4 single bonds)', () => {
    const c = createAtom(0, 0, 6);
    const h1 = createAtom(1, 0, 1);
    const h2 = createAtom(-1, 0, 1);
    const h3 = createAtom(0, 1, 1);
    const h4 = createAtom(0, -1, 1);
    const bonds = [
      createBond(c.id, h1.id),
      createBond(c.id, h2.id),
      createBond(c.id, h3.id),
      createBond(c.id, h4.id),
    ];
    const page = createPage([c, h1, h2, h3, h4], bonds);
    expect(validateValence(page)).toHaveLength(0);
  });

  it('reports issue for carbon with 5 single bonds', () => {
    const c = createAtom(0, 0, 6);
    const hs = Array.from({ length: 5 }, (_, i) => createAtom(i, 0, 1));
    const bonds = hs.map((h) => createBond(c.id, h.id));
    const page = createPage([c, ...hs], bonds);
    const issues = validateValence(page);
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0]?.atomId).toBe(c.id);
  });

  it('accepts nitrogen with triple bond', () => {
    const n1 = createAtom(0, 0, 7);
    const n2 = createAtom(1, 0, 7);
    const bond = createBond(n1.id, n2.id, 3, 'triple');
    const page = createPage([n1, n2], [bond]);
    expect(validateValence(page)).toHaveLength(0);
  });

  it('reports no issue for atom with no bonds', () => {
    const c = createAtom(0, 0, 6);
    const page = createPage([c]);
    expect(validateValence(page)).toHaveLength(0);
  });

  it('considers charge in valence calculation', () => {
    const n = createAtom(0, 0, 7); // nitrogen, valence 3
    n.charge = 1; // NH4+ has 4 bonds but +1 charge
    const hs = Array.from({ length: 4 }, (_, i) => createAtom(i, 0, 1));
    const bonds = hs.map((h) => createBond(n.id, h.id));
    const page = createPage([n, ...hs], bonds);
    const issues = validateValence(page);
    // 4 bonds + 1 charge = 5 effective, max for N is 3 -> should flag
    expect(issues.length).toBeGreaterThanOrEqual(1);
  });
});
