import { describe, it, expect } from 'vitest';
import { computeProperties } from '../formula.js';
import { createAtom, createBond } from '@kendraw/scene';
import type { Page, ArrowId, AnnotationId, GroupId } from '@kendraw/scene';

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

describe('computeProperties', () => {
  it('returns empty formula for empty page', () => {
    const page = createPage([]);
    const props = computeProperties(page);
    expect(props.formula).toBe('');
    expect(props.molecularWeight).toBe(0);
    expect(props.atomCount).toBe(0);
  });

  it('computes formula for single carbon', () => {
    const page = createPage([createAtom(0, 0, 6)]);
    const props = computeProperties(page);
    expect(props.formula).toBe('C');
    expect(props.atomCount).toBe(1);
  });

  it('computes formula for water (H2O)', () => {
    const h1 = createAtom(0, 0, 1);
    const h2 = createAtom(10, 0, 1);
    const o = createAtom(5, 5, 8);
    const page = createPage([h1, h2, o]);
    const props = computeProperties(page);
    expect(props.formula).toBe('H2O');
    expect(props.molecularWeight).toBeCloseTo(18.015, 2);
  });

  it('uses Hill system ordering (C first, H second, rest alpha)', () => {
    // CO2: C=6, O=8
    const c = createAtom(0, 0, 6);
    const o1 = createAtom(10, 0, 8);
    const o2 = createAtom(-10, 0, 8);
    const page = createPage([c, o1, o2]);
    const props = computeProperties(page);
    expect(props.formula).toBe('CO2');
  });

  it('counts bonds', () => {
    const a1 = createAtom(0, 0, 6);
    const a2 = createAtom(10, 0, 6);
    const bond = createBond(a1.id, a2.id);
    const page = createPage([a1, a2], [bond]);
    const props = computeProperties(page);
    expect(props.bondCount).toBe(1);
  });

  it('computes molecular weight for ethanol (C2H6O)', () => {
    const atoms = [
      createAtom(0, 0, 6),
      createAtom(10, 0, 6),
      createAtom(0, 10, 1),
      createAtom(0, -10, 1),
      createAtom(-10, 0, 1),
      createAtom(10, 10, 1),
      createAtom(10, -10, 1),
      createAtom(20, 0, 1),
      createAtom(20, 10, 8),
    ];
    const page = createPage(atoms);
    const props = computeProperties(page);
    expect(props.formula).toBe('C2H6O');
    // C2H6O: 2*12.011 + 6*1.008 + 15.999 = 46.069
    expect(props.molecularWeight).toBeCloseTo(46.069, 2);
  });
});
