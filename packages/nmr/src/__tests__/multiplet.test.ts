/**
 * Tests for the multiplet expansion engine.
 *
 * The 5 MUST-COVER cases per Murat's risk calculus:
 * T1 — intensity conservation  (invariant: sum === parent intensity)
 * T2 — singlet degenerate case (s → 1 line centered on shift)
 * T3 — doublet Hz→ppm conversion & ratio 1:1
 * T4 — triplet ratio 1:2:1 from Pascal's row 2
 * T5 — frequency variability   (same peak at 300 vs 600 MHz → scaled spacing)
 *
 * Additional coverage: pascalRow integrity, dd/ddd convolution, 'm' fallback,
 * unknown-multiplicity fallback (silenced console.warn).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NmrPeak } from '@kendraw/scene';
import {
  pascalRow,
  resolveMultiplicity,
  splitLines,
  expandMultiplet,
  isUnresolvedMultiplet,
} from '../multiplet.js';

/** Helper to build a minimal NmrPeak with sane defaults. */
function mkPeak(overrides: Partial<NmrPeak> = {}): NmrPeak {
  return {
    atom_index: 0,
    atom_indices: [0],
    parent_indices: [0],
    shift_ppm: 1.25,
    integral: 1,
    multiplicity: 's',
    coupling_hz: [],
    environment: 'alkyl',
    confidence: 3,
    method: 'test',
    proton_group_id: 0,
    dept_class: 'CH3',
    ...overrides,
  };
}

const sumIntensity = (lines: { intensity: number }[]): number =>
  lines.reduce((s, l) => s + l.intensity, 0);

describe('pascalRow', () => {
  it('returns [1] for n=0 (singlet)', () => {
    expect(pascalRow(0)).toEqual([1]);
  });

  it('returns [1,1] for n=1 (doublet)', () => {
    expect(pascalRow(1)).toEqual([1, 1]);
  });

  it('returns [1,2,1] for n=2 (triplet)', () => {
    expect(pascalRow(2)).toEqual([1, 2, 1]);
  });

  it('returns [1,3,3,1] for n=3 (quartet)', () => {
    expect(pascalRow(3)).toEqual([1, 3, 3, 1]);
  });

  it('returns [1,4,6,4,1] for n=4 (quintet)', () => {
    expect(pascalRow(4)).toEqual([1, 4, 6, 4, 1]);
  });

  it('returns [1,6,15,20,15,6,1] for n=6 (septet)', () => {
    expect(pascalRow(6)).toEqual([1, 6, 15, 20, 15, 6, 1]);
  });

  it('row is symmetric for all n up to 10', () => {
    for (let n = 0; n <= 10; n++) {
      const row = pascalRow(n);
      const rev = [...row].reverse();
      expect(row).toEqual(rev);
    }
  });

  it('sum of row n equals 2^n', () => {
    for (let n = 0; n <= 10; n++) {
      const row = pascalRow(n);
      const sum = row.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(2 ** n, 6);
    }
  });

  it('throws on negative n', () => {
    expect(() => pascalRow(-1)).toThrow();
  });
});

describe('resolveMultiplicity', () => {
  it('maps standard labels to coupling counts', () => {
    expect(resolveMultiplicity('s')).toEqual([]);
    expect(resolveMultiplicity('d')).toEqual([1]);
    expect(resolveMultiplicity('t')).toEqual([2]);
    expect(resolveMultiplicity('q')).toEqual([3]);
    expect(resolveMultiplicity('p')).toEqual([4]);
    expect(resolveMultiplicity('sept')).toEqual([6]);
  });

  it('maps compound labels', () => {
    expect(resolveMultiplicity('dd')).toEqual([1, 1]);
    expect(resolveMultiplicity('dt')).toEqual([1, 2]);
    expect(resolveMultiplicity('td')).toEqual([2, 1]);
    expect(resolveMultiplicity('ddd')).toEqual([1, 1, 1]);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(resolveMultiplicity('  DD ')).toEqual([1, 1]);
    expect(resolveMultiplicity('Dd')).toEqual([1, 1]);
  });

  it('falls back to [] on unknown labels and warns', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(resolveMultiplicity('gobbledygook')).toEqual([]);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('treats broad variants as singlets (no splitting)', () => {
    expect(resolveMultiplicity('br')).toEqual([]);
    expect(resolveMultiplicity('brs')).toEqual([]);
  });
});

describe('splitLines', () => {
  it('is a no-op for n=0', () => {
    const initial = [{ shiftPpm: 1.0, intensity: 3 }];
    expect(splitLines(initial, 0, 0.02)).toEqual(initial);
  });

  it('splits a single line into a symmetric doublet (n=1)', () => {
    const out = splitLines([{ shiftPpm: 1.0, intensity: 2 }], 1, 0.02);
    expect(out).toHaveLength(2);
    // Centered on 1.0, spaced by 0.02, equal intensities summing to 2.
    expect(out[0]?.shiftPpm).toBeCloseTo(0.99, 10);
    expect(out[1]?.shiftPpm).toBeCloseTo(1.01, 10);
    expect(out[0]?.intensity).toBeCloseTo(1, 10);
    expect(out[1]?.intensity).toBeCloseTo(1, 10);
  });

  it('splits into a triplet 1:2:1 for n=2', () => {
    const out = splitLines([{ shiftPpm: 2.0, intensity: 4 }], 2, 0.017_5);
    expect(out).toHaveLength(3);
    expect(out.map((l) => l.shiftPpm)).toEqual([
      expect.closeTo(1.9825, 3),
      expect.closeTo(2.0, 3),
      expect.closeTo(2.0175, 3),
    ]);
    // Ratios 1:2:1 normalised to total 4 → [1, 2, 1]
    expect(out[0]?.intensity).toBeCloseTo(1, 10);
    expect(out[1]?.intensity).toBeCloseTo(2, 10);
    expect(out[2]?.intensity).toBeCloseTo(1, 10);
  });

  it('preserves total intensity (sum === input)', () => {
    const initial = [{ shiftPpm: 3.0, intensity: 5 }];
    for (let n = 1; n <= 6; n++) {
      const out = splitLines(initial, n, 0.01);
      expect(sumIntensity(out)).toBeCloseTo(5, 9);
    }
  });
});

// ---------------------------------------------------------------------------
// The 5 MUST-COVER cases — risk-based per Murat (TEA).
// ---------------------------------------------------------------------------

describe('expandMultiplet — T1 to T5 (obligatory coverage)', () => {
  it('T1 — conserves total intensity for every multiplicity', () => {
    const peaks: NmrPeak[] = [
      mkPeak({ multiplicity: 's' }),
      mkPeak({ multiplicity: 'd', coupling_hz: [7] }),
      mkPeak({ multiplicity: 't', coupling_hz: [7] }),
      mkPeak({ multiplicity: 'q', coupling_hz: [7] }),
      mkPeak({ multiplicity: 'sept', coupling_hz: [6.8] }),
      mkPeak({ multiplicity: 'dd', coupling_hz: [10.5, 3.2] }),
      mkPeak({ multiplicity: 'ddd', coupling_hz: [12, 8, 4] }),
    ];
    for (const p of peaks) {
      const lines = expandMultiplet(p, 400);
      const expected = p.atom_indices.length;
      expect(sumIntensity(lines)).toBeCloseTo(expected, 9);
    }
  });

  it('T2 — singlet returns exactly 1 line centered on shift', () => {
    const peak = mkPeak({ shift_ppm: 7.26, multiplicity: 's', atom_indices: [0] });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.shiftPpm).toBeCloseTo(7.26, 12);
    expect(lines[0]?.intensity).toBeCloseTo(1, 12);
  });

  it('T3 — doublet at 300 MHz with J=7 Hz: 2 lines spaced 7/300 ppm, 1:1', () => {
    const peak = mkPeak({
      shift_ppm: 4.0,
      multiplicity: 'd',
      coupling_hz: [7],
      atom_indices: [0, 1],
    });
    const lines = expandMultiplet(peak, 300);
    expect(lines).toHaveLength(2);
    const expectedSpacing = 7 / 300; // ≈ 0.0233 ppm
    const actualSpacing = Math.abs((lines[1]?.shiftPpm ?? 0) - (lines[0]?.shiftPpm ?? 0));
    expect(actualSpacing).toBeCloseTo(expectedSpacing, 10);
    expect(lines[0]?.intensity).toBeCloseTo(1, 10);
    expect(lines[1]?.intensity).toBeCloseTo(1, 10);
  });

  it('T4 — triplet produces 3 lines in 1:2:1 ratio', () => {
    const peak = mkPeak({
      shift_ppm: 1.25,
      multiplicity: 't',
      coupling_hz: [7],
      atom_indices: [0, 1, 2], // 3H, intensities should be 0.75, 1.5, 0.75
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(3);
    // Spacing J/ν₀ = 7/400 = 0.0175 ppm between adjacent lines
    const spacing =
      ((lines[2]?.shiftPpm ?? 0) - (lines[0]?.shiftPpm ?? 0)) / 2;
    expect(spacing).toBeCloseTo(0.0175, 10);
    // Pascal row 2 normalised to 3H total: 0.75, 1.5, 0.75
    expect(lines[0]?.intensity).toBeCloseTo(0.75, 10);
    expect(lines[1]?.intensity).toBeCloseTo(1.5, 10);
    expect(lines[2]?.intensity).toBeCloseTo(0.75, 10);
    // Ratios 1:2:1
    const ratio = (lines[1]?.intensity ?? 0) / (lines[0]?.intensity ?? 1);
    expect(ratio).toBeCloseTo(2, 9);
  });

  it('T5 — same peak at 300 vs 600 MHz: spacing halves, intensities identical', () => {
    const peak = mkPeak({
      shift_ppm: 2.0,
      multiplicity: 'q',
      coupling_hz: [7.1],
      atom_indices: [0, 1],
    });
    const at300 = expandMultiplet(peak, 300);
    const at600 = expandMultiplet(peak, 600);
    expect(at300).toHaveLength(4);
    expect(at600).toHaveLength(4);

    const spacing300 = Math.abs((at300[1]?.shiftPpm ?? 0) - (at300[0]?.shiftPpm ?? 0));
    const spacing600 = Math.abs((at600[1]?.shiftPpm ?? 0) - (at600[0]?.shiftPpm ?? 0));
    expect(spacing300 / spacing600).toBeCloseTo(2, 9);

    // Intensities are in ppm-agnostic units — identical between frequencies.
    for (let i = 0; i < at300.length; i++) {
      expect(at300[i]?.intensity).toBeCloseTo(at600[i]?.intensity ?? -1, 10);
    }
  });
});

// ---------------------------------------------------------------------------
// Compound multiplicities — the dd/ddd traps Winston and Amelia flagged.
// ---------------------------------------------------------------------------

describe('expandMultiplet — compound multiplicities', () => {
  it('dd (J₁=10, J₂=5) at 400 MHz → 4 lines at shift ± J₁/2·ν₀ ± J₂/2·ν₀', () => {
    const peak = mkPeak({
      shift_ppm: 3.0,
      multiplicity: 'dd',
      coupling_hz: [10, 5],
      atom_indices: [0], // 1H
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(4);
    const j1 = 10 / 400; // 0.025
    const j2 = 5 / 400;  // 0.0125
    // After first split (J1): two lines at 3 ± j1/2.
    // After second split of each (J2): each line spawns two at ± j2/2.
    // Positions (sorted):
    //   3 - j1/2 - j2/2
    //   3 - j1/2 + j2/2
    //   3 + j1/2 - j2/2
    //   3 + j1/2 + j2/2
    const expected = [
      3 - j1 / 2 - j2 / 2,
      3 - j1 / 2 + j2 / 2,
      3 + j1 / 2 - j2 / 2,
      3 + j1 / 2 + j2 / 2,
    ].sort((a, b) => a - b);
    const got = lines.map((l) => l.shiftPpm).sort((a, b) => a - b);
    for (let i = 0; i < 4; i++) {
      expect(got[i]).toBeCloseTo(expected[i] ?? NaN, 10);
    }
    // All 4 lines equal intensity (1:1:1:1 normalised to 1H → 0.25 each)
    for (const l of lines) {
      expect(l.intensity).toBeCloseTo(0.25, 10);
    }
  });

  it('ddd (J₁=12, J₂=8, J₃=4) produces 8 equal-intensity lines', () => {
    const peak = mkPeak({
      multiplicity: 'ddd',
      coupling_hz: [12, 8, 4],
      atom_indices: [0],
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(8);
    for (const l of lines) {
      expect(l.intensity).toBeCloseTo(1 / 8, 10);
    }
    // Sum = 1H
    expect(sumIntensity(lines)).toBeCloseTo(1, 9);
  });

  it('sept (J=7) produces 7 lines with 1:6:15:20:15:6:1 intensity pattern', () => {
    const peak = mkPeak({
      multiplicity: 'sept',
      coupling_hz: [7],
      atom_indices: [0], // 1H
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(7);
    const intensities = lines.map((l) => l.intensity);
    const coeffs = [1, 6, 15, 20, 15, 6, 1];
    const total = coeffs.reduce((a, b) => a + b, 0);
    for (let i = 0; i < 7; i++) {
      const expected = (coeffs[i] ?? 0) / total;
      expect(intensities[i] ?? NaN).toBeCloseTo(expected, 10);
    }
  });

  it('dt (J₁=15, J₂=7) produces 6 lines with 1:1 × 1:2:1 pattern', () => {
    const peak = mkPeak({
      multiplicity: 'dt',
      coupling_hz: [15, 7],
      atom_indices: [0],
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(6);
    // Pattern = doublet × triplet = [1,2,1,1,2,1] after sort, normalised by 8
    const intensities = lines.map((l) => l.intensity).sort((a, b) => a - b);
    // Four "1" lines and two "2" lines. Total = 8 coefficients → each "1"=1/8, "2"=2/8.
    expect(intensities[0] ?? NaN).toBeCloseTo(1 / 8, 10);
    expect(intensities[3] ?? NaN).toBeCloseTo(1 / 8, 10);
    expect(intensities[4] ?? NaN).toBeCloseTo(2 / 8, 10);
    expect(intensities[5] ?? NaN).toBeCloseTo(2 / 8, 10);
  });
});

// ---------------------------------------------------------------------------
// Edge cases and defaults.
// ---------------------------------------------------------------------------

describe('expandMultiplet — edge cases', () => {
  it('uses 7 Hz default when coupling_hz is missing on a compound mult', () => {
    const peak = mkPeak({ multiplicity: 't', coupling_hz: [] });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(3);
    // Default J = 7 → spacing 7/400 = 0.0175
    const spacing =
      ((lines[2]?.shiftPpm ?? 0) - (lines[0]?.shiftPpm ?? 0)) / 2;
    expect(spacing).toBeCloseTo(0.0175, 10);
  });

  it("'m' returns a single line (renderer widens via linewidth)", () => {
    const peak = mkPeak({ multiplicity: 'm' });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.shiftPpm).toBeCloseTo(peak.shift_ppm, 12);
  });

  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('unknown multiplicity → 1 line and a console warning', () => {
    const peak = mkPeak({ multiplicity: 'zzz' });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('throws on invalid frequency', () => {
    expect(() => expandMultiplet(mkPeak(), 0)).toThrow();
    expect(() => expandMultiplet(mkPeak(), -400)).toThrow();
    expect(() => expandMultiplet(mkPeak(), Number.NaN)).toThrow();
  });

  it('peaks with zero atoms still produce at least one line (nH floored at 1)', () => {
    const peak = mkPeak({ atom_indices: [], multiplicity: 's' });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.intensity).toBeCloseTo(1, 10);
  });
});

describe('isUnresolvedMultiplet', () => {
  it.each(['m', 'br', 'brs', 'br s', 'M', '  m  '])(
    'returns true for %s',
    (mult) => {
      const peak: NmrPeak = {
        atom_index: 0,
        atom_indices: [0],
        parent_indices: [0],
        shift_ppm: 1,
        integral: 1,
        multiplicity: mult,
        coupling_hz: [],
        environment: '',
        confidence: 1,
        method: '',
        proton_group_id: 0,
        dept_class: null,
      };
      expect(isUnresolvedMultiplet(peak)).toBe(true);
    },
  );

  it.each(['s', 'd', 't', 'dd'])('returns false for %s', (mult) => {
    const peak: NmrPeak = {
      atom_index: 0,
      atom_indices: [0],
      parent_indices: [0],
      shift_ppm: 1,
      integral: 1,
      multiplicity: mult,
      coupling_hz: [],
      environment: '',
      confidence: 1,
      method: '',
      proton_group_id: 0,
      dept_class: null,
    };
    expect(isUnresolvedMultiplet(peak)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Wave-4 P1-02 — multiplet line list + integration tooltip data shape.
// The tooltip in NmrPanel.tsx renders one row per sub-line with a relative-
// intensity percent; lock that math here so a future renderer change can't
// silently misreport peak weights to the chemist reading the tooltip.
// ---------------------------------------------------------------------------
describe('multiplet line list (Wave-4 P1-02 tooltip data)', () => {
  function relativePercents(lines: { intensity: number }[]): number[] {
    const total = sumIntensity(lines);
    return lines.map((l) => Math.round((l.intensity / total) * 100));
  }

  it('triplet 1:2:1 → 25/50/25 percent rows', () => {
    const peak = mkPeak({
      multiplicity: 't',
      coupling_hz: [7],
      atom_indices: [0, 1, 2], // 3H
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(3);
    expect(relativePercents(lines)).toEqual([25, 50, 25]);
  });

  it('quartet 1:3:3:1 → 13/38/38/13 (rounded)', () => {
    const peak = mkPeak({
      multiplicity: 'q',
      coupling_hz: [7],
      atom_indices: [0, 1],
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(4);
    const pct = relativePercents(lines);
    const [p0, p1, p2, p3] = pct as [number, number, number, number];
    expect(p0).toBeLessThan(p1);
    expect(p1).toBe(p2);
    expect(p3).toBeLessThan(p2);
    expect(pct.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(99);
  });

  it('singlet returns one line — tooltip suppresses the list', () => {
    const peak = mkPeak({ multiplicity: 's', coupling_hz: [] });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(1);
    // The tooltip JSX uses lines.length <= 1 to skip rendering the table.
    expect(lines.length <= 1).toBe(true);
  });

  it('dd compound multiplet shows 4 rows preserving total intensity', () => {
    const peak = mkPeak({
      multiplicity: 'dd',
      coupling_hz: [12, 6],
      atom_indices: [0],
    });
    const lines = expandMultiplet(peak, 400);
    expect(lines).toHaveLength(4);
    // Sum of relative percents stays within rounding tolerance of 100.
    const pct = relativePercents(lines);
    const total = pct.reduce((a, b) => a + b, 0);
    expect(Math.abs(total - 100)).toBeLessThanOrEqual(2);
  });
});
