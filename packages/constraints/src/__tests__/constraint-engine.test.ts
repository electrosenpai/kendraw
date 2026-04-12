import { describe, it, expect } from 'vitest';
import { validateGeometry, cleanup, getIdealBondLengthPx } from '../engine/constraint-engine.js';
import { createAtom, createBond } from '@kendraw/scene';
import type { Page, ArrowId, AnnotationId, GroupId } from '@kendraw/scene';

function makePage(
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

describe('getIdealBondLengthPx', () => {
  it('C-C single = 1.535 * 40 = 61.4px', () => {
    expect(getIdealBondLengthPx(6, 6, 1)).toBeCloseTo(61.4, 0);
  });

  it('C=C double = 1.337 * 40 = 53.48px', () => {
    expect(getIdealBondLengthPx(6, 6, 2)).toBeCloseTo(53.48, 0);
  });

  it('C-O single = 1.430 * 40 = 57.2px', () => {
    expect(getIdealBondLengthPx(6, 8, 1)).toBeCloseTo(57.2, 0);
  });
});

describe('validateGeometry', () => {
  it('returns no violations for empty page', () => {
    const page = makePage([]);
    expect(validateGeometry(page)).toHaveLength(0);
  });

  it('detects bond length violation', () => {
    // Bond of 10px = 0.25Å, expected ~1.535Å for C-C
    const a1 = createAtom(100, 100, 6);
    const a2 = createAtom(110, 100, 6);
    const bond = createBond(a1.id, a2.id, 1, 'single');
    const page = makePage([a1, a2], [bond]);

    const v = validateGeometry(page);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0]?.type).toBe('bond-length');
  });

  it('no violation for correct C-C length (~61.4px)', () => {
    const a1 = createAtom(100, 100, 6);
    const a2 = createAtom(161.4, 100, 6);
    const bond = createBond(a1.id, a2.id, 1, 'single');
    const page = makePage([a1, a2], [bond]);

    const v = validateGeometry(page);
    const bondV = v.filter((x) => x.type === 'bond-length');
    expect(bondV).toHaveLength(0);
  });

  it('detects steric clash', () => {
    // Two non-bonded atoms very close (5px = 0.125Å)
    const a1 = createAtom(100, 100, 6);
    const a2 = createAtom(105, 100, 6);
    const page = makePage([a1, a2]); // no bond between them

    const v = validateGeometry(page);
    const clashes = v.filter((x) => x.type === 'steric-clash');
    expect(clashes.length).toBeGreaterThan(0);
  });
});

describe('cleanup', () => {
  it('corrects bond that is too short', () => {
    const a1 = createAtom(100, 100, 6);
    const a2 = createAtom(110, 100, 6); // 10px, way too short
    const bond = createBond(a1.id, a2.id, 1, 'single');
    const page = makePage([a1, a2], [bond]);

    const result = cleanup(page);
    const c1 = result.corrections.get(a1.id);
    const c2 = result.corrections.get(a2.id);

    // Atoms should be pushed apart
    expect(c1).toBeDefined();
    expect(c2).toBeDefined();
    if (c1 && c2) {
      // c1 should move left (negative dx), c2 should move right (positive dx)
      expect(c1.dx).toBeLessThan(0);
      expect(c2.dx).toBeGreaterThan(0);
    }
  });

  it('returns no significant corrections for ideal bond', () => {
    const a1 = createAtom(100, 100, 6);
    const a2 = createAtom(161.4, 100, 6);
    const bond = createBond(a1.id, a2.id, 1, 'single');
    const page = makePage([a1, a2], [bond]);

    const result = cleanup(page);
    const c1 = result.corrections.get(a1.id);
    const c2 = result.corrections.get(a2.id);
    // Corrections should be tiny
    expect(Math.abs(c1?.dx ?? 0)).toBeLessThan(1);
    expect(Math.abs(c2?.dx ?? 0)).toBeLessThan(1);
  });
});
