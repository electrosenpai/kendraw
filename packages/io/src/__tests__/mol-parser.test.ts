import { describe, it, expect } from 'vitest';
import { parseMolV2000, writeMolV2000 } from '../mol-v2000.js';

const WATER_MOL = `
  Kendraw

  3  2  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.9572    0.0000    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
   -0.2400    0.9266    0.0000 H   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  1  3  1  0  0  0  0
M  END
`;

const ETHYLENE_MOL = `
  Kendraw

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.3400    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0  0  0  0
M  END
`;

describe('parseMolV2000', () => {
  it('parses water molecule', () => {
    const result = parseMolV2000(WATER_MOL);
    expect(result.atoms).toHaveLength(3);
    expect(result.bonds).toHaveLength(2);
    expect(result.atoms[0]?.element).toBe(8); // O
    expect(result.atoms[1]?.element).toBe(1); // H
    expect(result.atoms[2]?.element).toBe(1); // H
  });

  it('parses bond orders', () => {
    const result = parseMolV2000(ETHYLENE_MOL);
    expect(result.atoms).toHaveLength(2);
    expect(result.bonds).toHaveLength(1);
    expect(result.bonds[0]?.order).toBe(2);
  });

  it('parses atom coordinates (scaled to pixels)', () => {
    const result = parseMolV2000(WATER_MOL);
    expect(result.atoms[0]?.x).toBeCloseTo(0);
    expect(result.atoms[0]?.y).toBeCloseTo(0);
    // 0.9572 angstrom * 40 scale = 38.288 px
    expect(result.atoms[1]?.x).toBeCloseTo(38.288, 0);
  });

  it('returns empty for empty string', () => {
    const result = parseMolV2000('');
    expect(result.atoms).toHaveLength(0);
    expect(result.bonds).toHaveLength(0);
  });
});

describe('writeMolV2000', () => {
  it('round-trips water molecule', () => {
    const parsed = parseMolV2000(WATER_MOL);
    const written = writeMolV2000(parsed.atoms, parsed.bonds);
    expect(written).toContain('V2000');
    expect(written).toContain('M  END');

    const reparsed = parseMolV2000(written);
    expect(reparsed.atoms).toHaveLength(3);
    expect(reparsed.bonds).toHaveLength(2);
  });

  it('preserves bond orders in round-trip', () => {
    const parsed = parseMolV2000(ETHYLENE_MOL);
    const written = writeMolV2000(parsed.atoms, parsed.bonds);
    const reparsed = parseMolV2000(written);
    expect(reparsed.bonds[0]?.order).toBe(2);
  });
});
