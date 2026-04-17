import { describe, it, expect } from 'vitest';
import { snapArrowAnchor } from '../anchor-snap.js';
import type { Page, Atom, Bond, AtomId, BondId } from '@kendraw/scene';

const aid = (s: string) => s as AtomId;
const bid = (s: string) => s as BondId;

function makePage(atoms: Atom[], bonds: Bond[]): Pick<Page, 'atoms' | 'bonds'> {
  const atomMap = Object.fromEntries(atoms.map((a) => [a.id, a])) as Record<AtomId, Atom>;
  const bondMap = Object.fromEntries(bonds.map((b) => [b.id, b])) as Record<BondId, Bond>;
  return { atoms: atomMap, bonds: bondMap };
}

function atom(id: string, x: number, y: number): Atom {
  return { id: aid(id), x, y, element: 6, charge: 0, radicalCount: 0, lonePairs: 0 };
}

function bond(id: string, from: string, to: string): Bond {
  return {
    id: bid(id),
    fromAtomId: aid(from),
    toAtomId: aid(to),
    order: 1,
    style: 'single',
  };
}

describe('snapArrowAnchor — wave-3 C1', () => {
  const page = makePage(
    [atom('a1', 0, 0), atom('a2', 100, 0)],
    [bond('b1', 'a1', 'a2')],
  );

  it('returns free anchor when pointer is nowhere near anything', () => {
    const snap = snapArrowAnchor({ x: 500, y: 500 }, page);
    expect(snap.kind).toBe('free');
  });

  it('snaps to the atom closest to the pointer when inside atom radius', () => {
    const snap = snapArrowAnchor({ x: 3, y: 4 }, page); // 5 px from a1
    expect(snap.kind).toBe('atom');
    if (snap.kind === 'atom') expect(snap.refId).toBe('a1');
  });

  it('prefers atom over bond when both are within radius', () => {
    // Pointer close to a1 (< atomRadius) AND on the bond segment
    const snap = snapArrowAnchor({ x: 2, y: 0 }, page);
    expect(snap.kind).toBe('atom');
  });

  it('snaps to a bond midpoint when pointer is near bond but far from atoms', () => {
    const snap = snapArrowAnchor({ x: 50, y: 2 }, page); // midpoint, 2px off
    expect(snap.kind).toBe('bond');
    if (snap.kind === 'bond') {
      expect(snap.refId).toBe('b1');
      expect(snap.t).toBeCloseTo(0.5, 2);
    }
  });

  it('bond t parameter reflects projection along the bond', () => {
    const snap = snapArrowAnchor({ x: 25, y: 1 }, page); // 25% along
    if (snap.kind === 'bond') {
      expect(snap.t).toBeCloseTo(0.25, 2);
    } else {
      throw new Error('expected bond anchor');
    }
  });

  it('returns free when pointer is outside both atom and bond radii', () => {
    const snap = snapArrowAnchor({ x: 50, y: 40 }, page);
    expect(snap.kind).toBe('free');
  });
});
