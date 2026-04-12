import { describe, it, expect } from 'vitest';
import { parseSmiles } from '../smiles-parser.js';

describe('SMILES parser — stereo and complex', () => {
  it('parses C1[C@@H]2C=CC(=O)[C@H](O1)O2', () => {
    const r = parseSmiles('C1[C@@H]2C=CC(=O)[C@H](O1)O2');
    expect(r.atoms.length).toBeGreaterThan(5);
    expect(r.bonds.length).toBeGreaterThan(5);
    // Should have oxygen atoms
    const oxygens = r.atoms.filter((a) => a.element === 8);
    expect(oxygens.length).toBeGreaterThanOrEqual(2);
  });

  it('parses simple ring with stereo [C@@H]', () => {
    const r = parseSmiles('[C@@H]1CCCCC1');
    expect(r.atoms.length).toBeGreaterThanOrEqual(6);
  });

  it('parses ring closure after bracket atom ]2', () => {
    const r = parseSmiles('[C@H]12CCCC1CCC2');
    expect(r.atoms.length).toBeGreaterThanOrEqual(8);
    // Should have ring closure bonds
    expect(r.bonds.length).toBeGreaterThanOrEqual(8);
  });
});
