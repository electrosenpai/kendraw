import { describe, it, expect } from 'vitest';
import { parseSmiles } from '../smiles-parser.js';

describe('SMILES parser', () => {
  it('parses ethanol (CCO)', () => {
    const r = parseSmiles('CCO');
    expect(r.atoms).toHaveLength(3);
    expect(r.bonds).toHaveLength(2);
    expect(r.atoms[0]?.element).toBe(6); // C
    expect(r.atoms[1]?.element).toBe(6); // C
    expect(r.atoms[2]?.element).toBe(8); // O
  });

  it('parses benzene (c1ccccc1)', () => {
    const r = parseSmiles('c1ccccc1');
    expect(r.atoms).toHaveLength(6);
    expect(r.bonds).toHaveLength(6); // 5 chain + 1 ring closure
    // All aromatic bonds
    for (const b of r.bonds) {
      expect(b.order).toBe(1.5);
      expect(b.style).toBe('aromatic');
    }
  });

  it('parses water (O)', () => {
    const r = parseSmiles('O');
    expect(r.atoms).toHaveLength(1);
    expect(r.atoms[0]?.element).toBe(8);
    expect(r.bonds).toHaveLength(0);
  });

  it('parses double bond (C=C)', () => {
    const r = parseSmiles('C=C');
    expect(r.atoms).toHaveLength(2);
    expect(r.bonds).toHaveLength(1);
    expect(r.bonds[0]?.order).toBe(2);
    expect(r.bonds[0]?.style).toBe('double');
  });

  it('parses triple bond (C#N)', () => {
    const r = parseSmiles('C#N');
    expect(r.atoms).toHaveLength(2);
    expect(r.bonds).toHaveLength(1);
    expect(r.bonds[0]?.order).toBe(3);
  });

  it('parses branches (CC(=O)O)', () => {
    // Acetic acid: C-C(=O)-O
    const r = parseSmiles('CC(=O)O');
    expect(r.atoms).toHaveLength(4);
    expect(r.bonds).toHaveLength(3);
    // One double bond (C=O)
    const dblBonds = r.bonds.filter((b) => b.order === 2);
    expect(dblBonds).toHaveLength(1);
  });

  it('parses aspirin SMILES', () => {
    const r = parseSmiles('CC(=O)Oc1ccccc1C(=O)O');
    expect(r.atoms.length).toBeGreaterThan(10);
    expect(r.bonds.length).toBeGreaterThan(10);
    // Has both aromatic and double bonds
    const aromatic = r.bonds.filter((b) => b.order === 1.5);
    const double = r.bonds.filter((b) => b.order === 2);
    expect(aromatic.length).toBeGreaterThan(0);
    expect(double.length).toBeGreaterThan(0);
  });

  it('parses caffeine SMILES', () => {
    const r = parseSmiles('Cn1c(=O)c2c(ncn2C)n(C)c1=O');
    expect(r.atoms.length).toBeGreaterThan(10);
    expect(r.bonds.length).toBeGreaterThan(10);
  });

  it('parses glucose SMILES', () => {
    const r = parseSmiles('OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O');
    expect(r.atoms.length).toBeGreaterThan(8);
    // Should have oxygen atoms
    const oxygens = r.atoms.filter((a) => a.element === 8);
    expect(oxygens.length).toBeGreaterThanOrEqual(5);
  });

  it('parses chlorine (Cl)', () => {
    const r = parseSmiles('CCl');
    expect(r.atoms).toHaveLength(2);
    expect(r.atoms[1]?.element).toBe(17);
  });

  it('parses bromine (Br)', () => {
    const r = parseSmiles('CBr');
    expect(r.atoms).toHaveLength(2);
    expect(r.atoms[1]?.element).toBe(35);
  });

  it('parses bracket atoms with charge [N+]', () => {
    const r = parseSmiles('[NH4+]');
    expect(r.atoms).toHaveLength(1);
    expect(r.atoms[0]?.element).toBe(7);
    expect(r.atoms[0]?.charge).toBe(1);
  });

  it('generates 2D coordinates for all atoms', () => {
    const r = parseSmiles('c1ccccc1');
    for (const a of r.atoms) {
      expect(typeof a.x).toBe('number');
      expect(typeof a.y).toBe('number');
      expect(isNaN(a.x)).toBe(false);
      expect(isNaN(a.y)).toBe(false);
    }
  });

  it('atoms are not all at the same position', () => {
    const r = parseSmiles('CCCCCC');
    const xs = new Set(r.atoms.map((a) => Math.round(a.x)));
    expect(xs.size).toBeGreaterThan(1);
  });

  it('parses empty string', () => {
    const r = parseSmiles('');
    expect(r.atoms).toHaveLength(0);
    expect(r.bonds).toHaveLength(0);
  });

  it('parses disconnected fragments (salt)', () => {
    const r = parseSmiles('[Na+].[Cl-]');
    expect(r.atoms).toHaveLength(2);
    expect(r.bonds).toHaveLength(0); // dot = no bond
  });
});
