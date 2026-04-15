import { describe, it, expect } from 'vitest';
import { RING_TEMPLATES, FUSED_RING_TEMPLATES, generateRing, generateFusedRing } from '../rings.js';

describe('Ring templates', () => {
  it('has 11 ring templates', () => {
    expect(RING_TEMPLATES).toHaveLength(11);
  });

  it('benzene has 6 atoms and aromatic bonds', () => {
    const benzene = RING_TEMPLATES.find((r) => r.id === 'benzene');
    expect(benzene).toBeDefined();
    expect(benzene?.atomCount).toBe(6);
    expect(benzene?.bondOrders.every((o) => o === 1.5)).toBe(true);
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

  it('benzene bonds have aromatic style', () => {
    const template = RING_TEMPLATES.find((r) => r.id === 'benzene');
    if (!template) return;

    const ring = generateRing(template, 0, 0);
    for (const bond of ring.bonds) {
      expect(bond.style).toBe('aromatic');
      expect(bond.order).toBe(1.5);
    }
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
