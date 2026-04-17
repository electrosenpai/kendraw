import { describe, it, expect } from 'vitest';
import { layoutAcyclicChain } from '../acyclic-chain.js';
import { STANDARD_BOND_LENGTH_PX } from '../bond-geometry.js';

const BL = STANDARD_BOND_LENGTH_PX;

describe('layoutAcyclicChain', () => {
  it('returns a minimal two-atom chain when the drag is too short', () => {
    const layout = layoutAcyclicChain({ x: 0, y: 0 }, { x: 5, y: 5 });
    expect(layout.atoms).toHaveLength(2);
    expect(layout.bonds).toEqual([{ from: 0, to: 1 }]);
  });

  it('places atom[0] at the start point', () => {
    const layout = layoutAcyclicChain({ x: 100, y: 50 }, { x: 400, y: 50 });
    expect(layout.atoms[0]).toEqual({ x: 100, y: 50 });
  });

  it('produces a chain whose bond count scales with drag distance', () => {
    const shortDrag = layoutAcyclicChain(
      { x: 0, y: 0 },
      { x: BL * Math.cos(Math.PI / 6) * 3, y: 0 },
    );
    const longDrag = layoutAcyclicChain(
      { x: 0, y: 0 },
      { x: BL * Math.cos(Math.PI / 6) * 10, y: 0 },
    );
    expect(shortDrag.atoms).toHaveLength(4);
    expect(longDrag.atoms).toHaveLength(11);
  });

  it('alternates perpendicular offset (zigzag ±30°)', () => {
    const layout = layoutAcyclicChain(
      { x: 0, y: 0 },
      { x: BL * Math.cos(Math.PI / 6) * 4, y: 0 },
    );
    const [a0, a1, a2, a3] = layout.atoms;
    if (!a0 || !a1 || !a2 || !a3) throw new Error('expected ≥4 atoms');
    // Baseline is along +X. Odd-indexed atoms should sit at +sin(30°)*BL
    // since the perpendicular chosen is [-uy, ux] = [0, 1] when u = [1, 0].
    expect(a0.y).toBeCloseTo(0);
    expect(a1.y).toBeCloseTo(BL * Math.sin(Math.PI / 6));
    expect(a2.y).toBeCloseTo(0);
    expect(a3.y).toBeCloseTo(BL * Math.sin(Math.PI / 6));
  });

  it('every consecutive pair of atoms is exactly one bond length apart', () => {
    const layout = layoutAcyclicChain({ x: 0, y: 0 }, { x: 500, y: 200 });
    for (const b of layout.bonds) {
      const a = layout.atoms[b.from];
      const c = layout.atoms[b.to];
      if (!a || !c) throw new Error('missing atom');
      const d = Math.sqrt((a.x - c.x) ** 2 + (a.y - c.y) ** 2);
      expect(d).toBeCloseTo(BL, 1);
    }
  });

  it('produces bondCount = atomCount - 1', () => {
    const layout = layoutAcyclicChain({ x: 0, y: 0 }, { x: 500, y: 0 });
    expect(layout.bonds).toHaveLength(layout.atoms.length - 1);
  });
});
