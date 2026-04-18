import { describe, it, expect } from 'vitest';
import {
  RING_TEMPLATES,
  FUSED_RING_TEMPLATES,
  generateRing,
  generateFusedRing,
  generateRingFusedOnBond,
  generateRingFusedOnAtom,
} from '../rings.js';
import type { AtomId } from '../types.js';

describe('Ring templates', () => {
  it('has 14 ring templates', () => {
    expect(RING_TEMPLATES).toHaveLength(14);
  });

  it('includes cyclononane, cyclodecane and cyclopentadiene', () => {
    const ids = RING_TEMPLATES.map((r) => r.id);
    expect(ids).toContain('cyclononane');
    expect(ids).toContain('cyclodecane');
    expect(ids).toContain('cyclopentadiene');
  });

  it('cyclononane is a 9-membered all-single-bond ring', () => {
    const c9 = RING_TEMPLATES.find((r) => r.id === 'cyclononane');
    expect(c9?.atomCount).toBe(9);
    expect(c9?.bondOrders.every((o) => o === 1)).toBe(true);
    expect(c9?.elements.every((e) => e === 6)).toBe(true);
  });

  it('cyclodecane is a 10-membered all-single-bond ring', () => {
    const c10 = RING_TEMPLATES.find((r) => r.id === 'cyclodecane');
    expect(c10?.atomCount).toBe(10);
    expect(c10?.bondOrders.every((o) => o === 1)).toBe(true);
  });

  it('cyclopentadiene has exactly two double bonds (1,3-diene)', () => {
    const cp = RING_TEMPLATES.find((r) => r.id === 'cyclopentadiene');
    expect(cp?.atomCount).toBe(5);
    const doubles = cp?.bondOrders.filter((o) => o === 2) ?? [];
    expect(doubles).toHaveLength(2);
  });

  it('benzene has 6 atoms and Kekulé alternating bonds (1,2,1,2,1,2)', () => {
    const benzene = RING_TEMPLATES.find((r) => r.id === 'benzene');
    expect(benzene).toBeDefined();
    expect(benzene?.atomCount).toBe(6);
    // Kekulé form: 3 single + 3 double, no aromatic shorthand.
    expect(benzene?.bondOrders).toEqual([1, 2, 1, 2, 1, 2]);
    const sum = (benzene?.bondOrders ?? []).reduce((a, b) => a + b, 0);
    expect(sum).toBe(9);
    const singles = (benzene?.bondOrders ?? []).filter((o) => o === 1).length;
    const doubles = (benzene?.bondOrders ?? []).filter((o) => o === 2).length;
    expect(singles).toBe(3);
    expect(doubles).toBe(3);
  });

  it('furan has oxygen as first element', () => {
    const furan = RING_TEMPLATES.find((r) => r.id === 'furan');
    expect(furan?.elements[0]).toBe(8);
  });
});

describe('generateRing', () => {
  it('generates correct number of atoms and bonds for cyclohexane', () => {
    const template = RING_TEMPLATES.find((r) => r.id === 'cyclohexane');
    expect(template).toBeDefined();
    if (!template) return;

    const ring = generateRing(template, 200, 200);
    expect(ring.atoms).toHaveLength(6);
    expect(ring.bonds).toHaveLength(6);
  });

  it('atoms are positioned around center', () => {
    const template = RING_TEMPLATES.find((r) => r.id === 'cyclohexane');
    if (!template) return;

    const ring = generateRing(template, 200, 200, 60);
    for (const atom of ring.atoms) {
      const dx = atom.x - 200;
      const dy = atom.y - 200;
      const dist = Math.sqrt(dx * dx + dy * dy);
      expect(dist).toBeCloseTo(60, 0);
    }
  });

  it('bonds connect adjacent atoms in ring', () => {
    const template = RING_TEMPLATES.find((r) => r.id === 'cyclopropane');
    if (!template) return;

    const ring = generateRing(template, 0, 0);
    expect(ring.bonds[0]?.fromAtomId).toBe(ring.atoms[0]?.id);
    expect(ring.bonds[0]?.toAtomId).toBe(ring.atoms[1]?.id);
    // Last bond wraps around
    const last = ring.bonds[ring.bonds.length - 1];
    expect(last?.toAtomId).toBe(ring.atoms[0]?.id);
  });

  it('benzene bonds alternate single/double (Kekulé)', () => {
    const template = RING_TEMPLATES.find((r) => r.id === 'benzene');
    if (!template) return;

    const ring = generateRing(template, 0, 0);
    expect(ring.bonds).toHaveLength(6);
    const orders = ring.bonds.map((b) => b.order);
    expect(orders).toEqual([1, 2, 1, 2, 1, 2]);
    const styles = ring.bonds.map((b) => b.style);
    expect(styles).toEqual(['single', 'double', 'single', 'double', 'single', 'double']);
  });
});

describe('Fused ring templates', () => {
  it('has at least 9 fused ring templates', () => {
    expect(FUSED_RING_TEMPLATES.length).toBeGreaterThanOrEqual(9);
  });

  it('naphthalene has 10 atoms and 11 bonds', () => {
    const naph = FUSED_RING_TEMPLATES.find((r) => r.id === 'naphthalene');
    expect(naph).toBeDefined();
    expect(naph?.atoms).toHaveLength(10);
    expect(naph?.bonds).toHaveLength(11);
  });

  it('anthracene has 14 atoms and 16 bonds', () => {
    const anth = FUSED_RING_TEMPLATES.find((r) => r.id === 'anthracene');
    expect(anth).toBeDefined();
    expect(anth?.atoms).toHaveLength(14);
    expect(anth?.bonds).toHaveLength(16);
  });

  it('indole has 9 atoms (6 benzene + 3 pyrrole) with N', () => {
    const indole = FUSED_RING_TEMPLATES.find((r) => r.id === 'indole');
    expect(indole).toBeDefined();
    expect(indole?.atoms).toHaveLength(9);
    const nitrogenCount = indole?.atoms.filter((a) => a.element === 7).length;
    expect(nitrogenCount).toBe(1);
  });

  it('quinoline has N at one position', () => {
    const quin = FUSED_RING_TEMPLATES.find((r) => r.id === 'quinoline');
    expect(quin).toBeDefined();
    const nitrogenCount = quin?.atoms.filter((a) => a.element === 7).length;
    expect(nitrogenCount).toBe(1);
  });

  it('purine has 4 nitrogen atoms', () => {
    const purine = FUSED_RING_TEMPLATES.find((r) => r.id === 'purine');
    expect(purine).toBeDefined();
    const nitrogenCount = purine?.atoms.filter((a) => a.element === 7).length;
    expect(nitrogenCount).toBe(4);
  });

  it('steroid has 17 atoms (4 fused rings: 6+6+6+5)', () => {
    const steroid = FUSED_RING_TEMPLATES.find((r) => r.id === 'steroid');
    expect(steroid).toBeDefined();
    expect(steroid?.atoms).toHaveLength(17);
  });

  it('all templates have correct categories', () => {
    for (const t of FUSED_RING_TEMPLATES) {
      expect(['aromatic', 'heterocyclic', 'biological']).toContain(t.category);
    }
  });
});

describe('generateFusedRing', () => {
  it('generates naphthalene at specified center', () => {
    const naph = FUSED_RING_TEMPLATES.find((r) => r.id === 'naphthalene');
    if (!naph) return;
    const ring = generateFusedRing(naph, 300, 300);
    expect(ring.atoms).toHaveLength(10);
    expect(ring.bonds).toHaveLength(11);
    for (const bond of ring.bonds) {
      expect(bond.style).toBe('aromatic');
      expect(bond.order).toBe(1.5);
    }
  });

  it('generates indole with correct element types', () => {
    const indole = FUSED_RING_TEMPLATES.find((r) => r.id === 'indole');
    if (!indole) return;
    const ring = generateFusedRing(indole, 200, 200);
    expect(ring.atoms).toHaveLength(9);
    const nAtoms = ring.atoms.filter((a) => a.element === 7);
    expect(nAtoms).toHaveLength(1);
  });

  it('generates steroid with all single bonds', () => {
    const steroid = FUSED_RING_TEMPLATES.find((r) => r.id === 'steroid');
    if (!steroid) return;
    const ring = generateFusedRing(steroid, 200, 200);
    expect(ring.atoms).toHaveLength(17);
    for (const bond of ring.bonds) {
      expect(bond.style).toBe('single');
      expect(bond.order).toBe(1);
    }
  });

  it('centers the generated ring at the specified position', () => {
    const naph = FUSED_RING_TEMPLATES.find((r) => r.id === 'naphthalene');
    if (!naph) return;
    const ring = generateFusedRing(naph, 500, 400);
    const cx = ring.atoms.reduce((s, a) => s + a.x, 0) / ring.atoms.length;
    const cy = ring.atoms.reduce((s, a) => s + a.y, 0) / ring.atoms.length;
    expect(cx).toBeCloseTo(500, 0);
    expect(cy).toBeCloseTo(400, 0);
  });
});

describe('generateRingFusedOnBond (HF-D)', () => {
  const benzene = RING_TEMPLATES.find((r) => r.id === 'benzene');
  if (!benzene) throw new Error('benzene template missing');
  const aA = { id: 'a' as AtomId, x: 0, y: 0 };
  const aB = { id: 'b' as AtomId, x: 50, y: 0 };

  it('benzene fused on a bond returns 4 new atoms + 5 new bonds', () => {
    const ring = generateRingFusedOnBond(benzene, aA, aB, 1);
    expect(ring.atoms).toHaveLength(4);
    expect(ring.bonds).toHaveLength(5);
  });

  it('does not duplicate the shared edge atoms aA / aB', () => {
    const ring = generateRingFusedOnBond(benzene, aA, aB, 1);
    for (const atom of ring.atoms) {
      expect(atom.id).not.toBe(aA.id);
      expect(atom.id).not.toBe(aB.id);
    }
  });

  it('all new ring atoms sit on the n-gon circumscribed circle', () => {
    const ring = generateRingFusedOnBond(benzene, aA, aB, 1);
    const edgeLen = 50;
    const ringRadius = edgeLen / (2 * Math.sin(Math.PI / 6));
    const apothem = edgeLen / (2 * Math.tan(Math.PI / 6));
    const cx = (aA.x + aB.x) / 2;
    const cy = (aA.y + aB.y) / 2 + apothem; // side = +1
    for (const atom of ring.atoms) {
      const d = Math.hypot(atom.x - cx, atom.y - cy);
      expect(d).toBeCloseTo(ringRadius, 1);
    }
  });

  it('side = -1 mirrors the ring across the bond axis', () => {
    const up = generateRingFusedOnBond(benzene, aA, aB, 1);
    const down = generateRingFusedOnBond(benzene, aA, aB, -1);
    expect(up.atoms).toHaveLength(down.atoms.length);
    const upY = up.atoms.map((a) => a.y).sort((a, b) => a - b);
    const downY = down.atoms.map((a) => a.y).sort((a, b) => a - b);
    for (let i = 0; i < upY.length; i++) {
      const mirrored = downY[downY.length - 1 - i];
      if (mirrored === undefined) continue;
      expect(upY[i]).toBeCloseTo(-mirrored, 1);
    }
  });

  it('returns empty for degenerate edge length (atomA == atomB)', () => {
    const ring = generateRingFusedOnBond(benzene, aA, aA, 1);
    expect(ring.atoms).toHaveLength(0);
    expect(ring.bonds).toHaveLength(0);
  });

  it('every new bond references either aA, aB, or one of the new atoms', () => {
    const ring = generateRingFusedOnBond(benzene, aA, aB, 1);
    const validIds = new Set<string>([aA.id, aB.id, ...ring.atoms.map((a) => a.id)]);
    for (const b of ring.bonds) {
      expect(validIds.has(b.fromAtomId)).toBe(true);
      expect(validIds.has(b.toAtomId)).toBe(true);
    }
  });
});

describe('generateRingFusedOnAtom (HF-D)', () => {
  const benzene = RING_TEMPLATES.find((r) => r.id === 'benzene');
  if (!benzene) throw new Error('benzene template missing');
  const shared = { id: 'shared' as AtomId, x: 100, y: 100 };

  it('benzene fused on an atom returns 5 new atoms + 6 bonds', () => {
    const ring = generateRingFusedOnAtom(benzene, shared, 0, 50);
    expect(ring.atoms).toHaveLength(5);
    expect(ring.bonds).toHaveLength(6);
  });

  it('does not duplicate the shared atom', () => {
    const ring = generateRingFusedOnAtom(benzene, shared, 0, 50);
    for (const a of ring.atoms) {
      expect(a.id).not.toBe(shared.id);
    }
  });

  it('every bond references the shared atom or one of the new atoms', () => {
    const ring = generateRingFusedOnAtom(benzene, shared, 0, 50);
    const validIds = new Set<string>([shared.id, ...ring.atoms.map((a) => a.id)]);
    for (const b of ring.bonds) {
      expect(validIds.has(b.fromAtomId)).toBe(true);
      expect(validIds.has(b.toAtomId)).toBe(true);
    }
  });

  it('exactly two new bonds are incident to the shared atom (entry + exit)', () => {
    const ring = generateRingFusedOnAtom(benzene, shared, 0, 50);
    const incident = ring.bonds.filter(
      (b) => b.fromAtomId === shared.id || b.toAtomId === shared.id,
    );
    expect(incident).toHaveLength(2);
  });
});
