import { describe, it, expect } from 'vitest';
import { RING_TEMPLATES, generateRing } from '../rings.js';

describe('Ring templates', () => {
  it('has 8 ring templates', () => {
    expect(RING_TEMPLATES).toHaveLength(8);
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
