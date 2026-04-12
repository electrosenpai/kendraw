import { describe, it, expect } from 'vitest';
import {
  ALL_ANGLES,
  SP3_ANGLES,
  SP2_ANGLES,
  SP_ANGLES,
  HETERO_RING_ANGLES,
  getDefaultAngle,
} from '../data/valence-angles.js';

describe('Valence angle data', () => {
  it('has 16 sp3 entries', () => {
    expect(SP3_ANGLES).toHaveLength(16);
  });
  it('has 16 sp2 entries', () => {
    expect(SP2_ANGLES).toHaveLength(16);
  });
  it('has 5 sp entries', () => {
    expect(SP_ANGLES).toHaveLength(5);
  });
  it('has 11 heterocycle entries', () => {
    expect(HETERO_RING_ANGLES).toHaveLength(11);
  });
  it('has 48 total entries', () => {
    expect(ALL_ANGLES).toHaveLength(48);
  });

  it('tetrahedral angle = 109.47', () => {
    const e = SP3_ANGLES.find((a) => a.context === 'ideal tetrahedral');
    expect(e?.angle).toBe(109.47);
  });

  it('cyclohexane ring = 111.4', () => {
    const e = SP3_ANGLES.find((a) => a.context === 'cyclohexane ring');
    expect(e?.angle).toBe(111.4);
  });

  it('cyclopropane = 60.0 exact', () => {
    const e = SP3_ANGLES.find((a) => a.context === 'cyclopropane ring');
    expect(e?.angle).toBe(60.0);
    expect(e?.tolerance).toBe(0);
  });

  it('benzene C-C-C = 120.0', () => {
    const e = SP2_ANGLES.find((a) => a.context === 'benzene C-C-C');
    expect(e?.angle).toBe(120.0);
  });

  it('water H-O-H = 104.5', () => {
    const e = SP3_ANGLES.find((a) => a.context === 'water H-O-H');
    expect(e?.angle).toBe(104.5);
  });
});

describe('getDefaultAngle', () => {
  it('sp3 = 109.47', () => {
    expect(getDefaultAngle('sp3')).toBe(109.47);
  });
  it('sp2 = 120.0', () => {
    expect(getDefaultAngle('sp2')).toBe(120.0);
  });
  it('sp = 180.0', () => {
    expect(getDefaultAngle('sp')).toBe(180.0);
  });
});
