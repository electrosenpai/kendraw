import { describe, it, expect } from 'vitest';
import {
  ALL_BOND_LENGTHS,
  CC_BONDS,
  CH_BONDS,
  CO_BONDS,
  CN_BONDS,
  HETERO_BONDS,
  getDefaultBondLength,
} from '../data/bond-lengths.js';

describe('Bond length data', () => {
  it('has 16 C-C entries', () => {
    expect(CC_BONDS).toHaveLength(16);
  });
  it('has 5 C-H entries', () => {
    expect(CH_BONDS).toHaveLength(5);
  });
  it('has 10 C-O entries', () => {
    expect(CO_BONDS).toHaveLength(10);
  });
  it('has 8 C-N entries', () => {
    expect(CN_BONDS).toHaveLength(8);
  });
  it('has 17 heteroatom entries', () => {
    expect(HETERO_BONDS).toHaveLength(17);
  });
  it('has 56 total entries', () => {
    expect(ALL_BOND_LENGTHS).toHaveLength(56);
  });

  it('all entries have positive length', () => {
    for (const e of ALL_BOND_LENGTHS) {
      expect(e.length).toBeGreaterThan(0);
      expect(e.tolerance).toBeGreaterThanOrEqual(0);
    }
  });

  it('benzene C-C aromatic = 1.397', () => {
    const e = CC_BONDS.find((b) => b.context.includes('benzene'));
    expect(e?.length).toBe(1.397);
  });

  it('ethylene C=C = 1.337', () => {
    const e = CC_BONDS.find((b) => b.context.includes('ethylene'));
    expect(e?.length).toBe(1.337);
  });

  it('amide C=O = 1.235', () => {
    const e = CO_BONDS.find((b) => b.context.includes('amide'));
    expect(e?.length).toBe(1.235);
  });
});

describe('getDefaultBondLength', () => {
  it('C-C single = 1.535', () => {
    expect(getDefaultBondLength(6, 6, 1)).toBe(1.535);
  });
  it('C=C double = 1.337', () => {
    expect(getDefaultBondLength(6, 6, 2)).toBe(1.337);
  });
  it('C≡C triple = 1.203', () => {
    expect(getDefaultBondLength(6, 6, 3)).toBe(1.203);
  });
  it('C-C aromatic = 1.397', () => {
    expect(getDefaultBondLength(6, 6, 1.5)).toBe(1.397);
  });
  it('C-O single = 1.430', () => {
    expect(getDefaultBondLength(6, 8, 1)).toBe(1.43);
  });
  it('C=O double = 1.210', () => {
    expect(getDefaultBondLength(6, 8, 2)).toBe(1.21);
  });
  it('C-N single = 1.474', () => {
    expect(getDefaultBondLength(6, 7, 1)).toBe(1.474);
  });
  it('C-Cl = 1.781', () => {
    expect(getDefaultBondLength(6, 17, 1)).toBe(1.781);
  });
  it('C-Br = 1.945', () => {
    expect(getDefaultBondLength(6, 35, 1)).toBe(1.945);
  });
  it('O-H = 0.960', () => {
    expect(getDefaultBondLength(1, 8, 1)).toBe(0.96);
  });
  it('N-H = 1.010', () => {
    expect(getDefaultBondLength(1, 7, 1)).toBe(1.01);
  });
  it('S-S disulfide = 2.050', () => {
    expect(getDefaultBondLength(16, 16, 1)).toBe(2.05);
  });
  it('symmetric: (6,8) == (8,6)', () => {
    expect(getDefaultBondLength(6, 8, 1)).toBe(getDefaultBondLength(8, 6, 1));
  });
});
