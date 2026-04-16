/**
 * Unit tests for NMR scope derivation.
 * @regression Bug 2 (Apr 16 2026): NMR predicted on full canvas even when
 *             selection existed. The fix threads selection to NmrPanel and
 *             uses `computeScope` to filter atoms/bonds before serialization.
 */
import { describe, it, expect } from 'vitest';
import type { AtomId, Page } from '@kendraw/scene';
import { createAtom, createBond } from '@kendraw/scene';
import { computeScope } from '../nmr-scope.js';

function makePage(): {
  page: Page;
  // Two disconnected fragments: ethanol (c1-c2-o3) and methanol (c4-o5)
  c1: AtomId;
  c2: AtomId;
  o3: AtomId;
  c4: AtomId;
  o5: AtomId;
} {
  const a1 = createAtom(0, 0);
  const a2 = createAtom(1, 0);
  const a3 = createAtom(2, 0, 8);
  const a4 = createAtom(5, 0);
  const a5 = createAtom(6, 0, 8);

  const b1 = createBond(a1.id, a2.id);
  const b2 = createBond(a2.id, a3.id);
  const b3 = createBond(a4.id, a5.id);

  const page: Page = {
    id: 'p1',
    atoms: { [a1.id]: a1, [a2.id]: a2, [a3.id]: a3, [a4.id]: a4, [a5.id]: a5 },
    bonds: { [b1.id]: b1, [b2.id]: b2, [b3.id]: b3 },
    arrows: {},
    annotations: {},
    groups: {},
    viewport: { x: 0, y: 0, zoom: 1 },
  };
  return { page, c1: a1.id, c2: a2.id, o3: a3.id, c4: a4.id, o5: a5.id };
}

describe('computeScope', () => {
  it('returns full canvas when selection is undefined', () => {
    const { page } = makePage();
    const scope = computeScope(page, undefined);
    expect(scope.kind).toBe('full');
    if (scope.kind !== 'full') throw new Error('unreachable');
    expect(scope.atoms).toHaveLength(5);
    expect(scope.bonds).toHaveLength(3);
  });

  it('returns full canvas when selection is empty array', () => {
    const { page } = makePage();
    const scope = computeScope(page, []);
    expect(scope.kind).toBe('full');
  });

  it('returns selection subset when selection is a connected fragment', () => {
    const { page, c1, c2, o3 } = makePage();
    const scope = computeScope(page, [c1, c2, o3]);
    expect(scope.kind).toBe('selection');
    if (scope.kind !== 'selection') throw new Error('unreachable');
    expect(scope.atoms).toHaveLength(3);
    expect(scope.bonds).toHaveLength(2);
    expect(new Set(scope.atomIds)).toEqual(new Set([c1, c2, o3]));
  });

  it('flags disconnected selection (atoms from two separate fragments)', () => {
    const { page, c1, c4 } = makePage();
    const scope = computeScope(page, [c1, c4]);
    expect(scope.kind).toBe('disconnected');
  });

  it('accepts a single-atom selection as connected', () => {
    const { page, c1 } = makePage();
    const scope = computeScope(page, [c1]);
    expect(scope.kind).toBe('selection');
    if (scope.kind !== 'selection') throw new Error('unreachable');
    expect(scope.atoms).toHaveLength(1);
    expect(scope.bonds).toHaveLength(0);
  });

  it('filters bonds: excludes bonds with an endpoint outside the selection', () => {
    const { page, c1, c2 } = makePage();
    // Selecting c1 and c2 keeps bond(c1-c2) but drops bond(c2-o3).
    const scope = computeScope(page, [c1, c2]);
    expect(scope.kind).toBe('selection');
    if (scope.kind !== 'selection') throw new Error('unreachable');
    expect(scope.bonds).toHaveLength(1);
    const bond = scope.bonds[0];
    if (!bond) throw new Error('unreachable');
    expect(new Set([bond.fromAtomId, bond.toAtomId])).toEqual(new Set([c1, c2]));
  });

  it('preserves atom ordering from the page (key-order) under selection', () => {
    const { page, c1, o3 } = makePage();
    // Selecting c1 and o3 only — c2 is omitted BUT they share bond chain.
    // Since there is no direct bond c1-o3 (they are only connected through c2),
    // this selection is actually disconnected within the filtered graph…
    // But our connectivity check flows via the *full* bond graph (floodSelect
    // from c1 reaches o3 through c2). So it counts as connected.
    const scope = computeScope(page, [c1, o3]);
    expect(scope.kind).toBe('selection');
    if (scope.kind !== 'selection') throw new Error('unreachable');
    // Ordering reflects `Object.entries(page.atoms)` filtered by selection
    expect(scope.atomIds[0]).toBe(c1);
    expect(scope.atomIds[1]).toBe(o3);
  });

  it('returns full canvas when selection references a nonexistent atom', () => {
    const { page } = makePage();
    const scope = computeScope(page, ['does-not-exist' as AtomId]);
    expect(scope.kind).toBe('full');
  });
});
