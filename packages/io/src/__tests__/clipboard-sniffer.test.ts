import { describe, it, expect } from 'vitest';
import { parseTextClipboard } from '../clipboard-sniffer.js';

const ETHANOL_MOL = `
  Mrv2014 01012024

  3  2  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
M  END
`;

describe('parseTextClipboard', () => {
  it('returns unknown for empty text', () => {
    expect(parseTextClipboard('').kind).toBe('unknown');
    expect(parseTextClipboard('   \n  ').kind).toBe('unknown');
  });

  it('recognizes V2000 MOL blocks', () => {
    const result = parseTextClipboard(ETHANOL_MOL);
    expect(result.kind).toBe('mol');
    expect(result.atoms).toHaveLength(3);
    expect(result.bonds).toHaveLength(2);
  });

  it('recognizes SMILES strings (ethanol CCO)', () => {
    const result = parseTextClipboard('CCO');
    expect(result.kind).toBe('smiles');
    expect(result.atoms).toHaveLength(3);
    expect(result.bonds).toHaveLength(2);
  });

  it('recognizes SMILES strings (benzene c1ccccc1)', () => {
    const result = parseTextClipboard('c1ccccc1');
    expect(result.kind).toBe('smiles');
    expect(result.atoms).toHaveLength(6);
  });

  it('recognizes KDX JSON envelopes', () => {
    const kdx = JSON.stringify({
      formatVersion: 1,
      appVersion: '0.1.0',
      document: {
        metadata: { appVersion: '0.1.0', createdAt: 0, updatedAt: 0 },
        pages: [
          {
            id: 'p1',
            atoms: {},
            bonds: {},
            arrows: {},
            annotations: {},
            graphics: {},
          },
        ],
        activePageIndex: 0,
      },
    });
    const result = parseTextClipboard(kdx);
    expect(result.kind).toBe('kdx');
  });

  it('returns unknown for prose or unrelated text', () => {
    expect(parseTextClipboard('hello world this is not a molecule').kind).toBe('unknown');
    expect(parseTextClipboard('The quick brown fox').kind).toBe('unknown');
  });

  it('returns unknown for lone numbers', () => {
    expect(parseTextClipboard('42').kind).toBe('unknown');
    expect(parseTextClipboard('3.14159').kind).toBe('unknown');
  });

  it('does not throw on malformed MOL or SMILES input', () => {
    expect(() => parseTextClipboard('M  END\nnotmol')).not.toThrow();
    expect(() => parseTextClipboard('(((((')).not.toThrow();
  });
});
