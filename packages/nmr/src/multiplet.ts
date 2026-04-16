/**
 * Multiplet expansion engine.
 *
 * Takes a single NmrPeak with a multiplicity label (s, d, t, q, p, sext, sept,
 * dd, dt, ddd, …) and its J-coupling constants in Hz, plus the spectrometer
 * frequency in MHz, and returns the individual sub-lines that together make
 * up the observed multiplet on the spectrum.
 *
 * Conventions:
 * - `pascalRow(n)` returns row `n` of Pascal's triangle — `n+1` coefficients
 *   for `n` equivalent coupling protons (e.g. n=2 → [1,2,1]).
 * - `splitLines(lines, n, j_ppm)` convolutes every existing line with one more
 *   coupling pattern: each line splits into `n+1` new lines centered on the
 *   original, spaced by `j_ppm`, with Pascal-weighted intensities.
 * - For compound multiplicities (dd, dt, ddd, …) successive convolution gives
 *   the correct pattern — dd (J₁=10, J₂=5) ⇒ 4 lines at δ ± J₁/2 ± J₂/2 with
 *   equal intensities (each coupling contributes [1,1], so 1×1=1 each).
 * - `'m'` (unresolved multiplet) returns a single widened line — see
 *   {@link MULTIPLET_BROADENING_FACTOR}.
 * - Total intensity is conserved: sum(sub.intensity) === peak.intensity.
 *
 * The function is PURE and has NO side effects. It is the terminal stage in
 * the peak → rendering pipeline: DEPT inversion, confidence coloring, and any
 * other peak-level transformation must happen BEFORE expansion, not after.
 */

import type { NmrPeak } from '@kendraw/scene';

/**
 * A single spectral line that comes out of the expansion.
 *
 * `shiftPpm` is the exact chemical shift of this line; `intensity` is the
 * fraction of the parent peak's integral carried by this line (all sub-lines
 * for a given peak sum to exactly the parent intensity).
 */
export interface SubLine {
  shiftPpm: number;
  intensity: number;
}

/** Default J in Hz when the backend omits a coupling for a compound mult. */
const DEFAULT_J_HZ = 7;

/**
 * Linewidth multiplier applied to `'m'` (unresolved multiplet) lines so the
 * renderer draws a visibly broader Lorentzian envelope. The renderer is free
 * to honour this via the `broadening` field on the SubLine.
 */
export const MULTIPLET_BROADENING_FACTOR = 3;

/**
 * Pascal's triangle row `n` — the binomial coefficients `C(n, 0) … C(n, n)`.
 * Represents the line intensities for a signal split by `n` equivalent
 * coupling protons (e.g. `n=3` → `[1, 3, 3, 1]`, the classic quartet).
 *
 * @param n  non-negative integer
 * @returns  array of length `n + 1`
 */
export function pascalRow(n: number): number[] {
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
    throw new Error(`pascalRow: n must be a non-negative integer, got ${n}`);
  }
  const row: number[] = [1];
  for (let i = 1; i <= n; i++) {
    const prev = row[i - 1] ?? 0;
    row.push((prev * (n - i + 1)) / i);
  }
  return row;
}

/**
 * Resolve a multiplicity label to the list of "equivalent coupling counts"
 * that describe its convolution. Each count consumes one J-coupling constant.
 *
 * Examples:
 * - `'s'` → `[]` (no splitting)
 * - `'d'` → `[1]` (splits to 2 lines)
 * - `'t'` → `[2]` (splits to 3 lines)
 * - `'q'` → `[3]` (splits to 4 lines)
 * - `'dd'` → `[1, 1]` (2×2 = 4 lines)
 * - `'dt'` → `[1, 2]` (2×3 = 6 lines)
 * - `'ddd'` → `[1, 1, 1]` (2×2×2 = 8 lines)
 *
 * Unknown inputs are logged and collapsed to `'m'` (returns an empty array and
 * triggers the broadened-line path in {@link expandMultiplet}).
 */
export function resolveMultiplicity(mult: string): number[] {
  const key = mult.trim().toLowerCase();
  const map: Record<string, number[]> = {
    s: [],
    d: [1],
    t: [2],
    q: [3],
    p: [4],
    quint: [4],
    sext: [5],
    hex: [5],
    sept: [6],
    hept: [6],
    oct: [7],
    non: [8],
    nonet: [8],
    dd: [1, 1],
    dt: [1, 2],
    td: [2, 1],
    dq: [1, 3],
    qd: [3, 1],
    tt: [2, 2],
    ddd: [1, 1, 1],
    dddd: [1, 1, 1, 1],
    m: [],
    br: [],
    brs: [],
    'br s': [],
  };
  const resolved = map[key];
  if (resolved) return resolved;
  // Unknown multiplicity: warn once (tests silence console) then fall back
  // to the broadened-single-line behaviour of `'m'`.
  console.warn(`[nmr.multiplet] unknown multiplicity "${mult}", falling back to m`);
  return [];
}

/**
 * Split every line in `lines` by one more J-coupling, in-place-free style.
 *
 * Each input line produces `n + 1` output lines centered on the original
 * `shiftPpm`, spaced by `jPpm`, with Pascal-weighted intensities normalised
 * so that the sum of the new lines equals the intensity of the input line.
 *
 * @param lines  current multiplet state
 * @param n      number of equivalent coupling protons for this J
 * @param jPpm   coupling constant already converted to ppm units
 *               (i.e. `J_hz / frequency_mhz`)
 */
export function splitLines(lines: SubLine[], n: number, jPpm: number): SubLine[] {
  if (n <= 0) return lines;
  const coeffs = pascalRow(n);
  const total = coeffs.reduce((a, b) => a + b, 0);
  // `center` is the index of the arithmetic center of the new lines.
  // For odd n+1 this is an integer; for even it falls between two indices.
  // Using a float ensures perfect symmetry around the input shift.
  const center = (coeffs.length - 1) / 2;
  const out: SubLine[] = [];
  for (const line of lines) {
    for (let k = 0; k < coeffs.length; k++) {
      const offset = (k - center) * jPpm;
      const coeff = coeffs[k] ?? 0;
      out.push({
        shiftPpm: line.shiftPpm + offset,
        intensity: (line.intensity * coeff) / total,
      });
    }
  }
  return out;
}

/**
 * Expand a single {@link NmrPeak} into the list of individual spectral lines
 * that together form its multiplet at the given spectrometer frequency.
 *
 * The parent peak's `intensity` is `nH` in the current Kendraw data model
 * (number of equivalent protons contributing to the signal — proportional to
 * the integral). The sum of `subline.intensity` over the returned array is
 * equal to this value.
 *
 * @param peak            a NmrPeak from a NmrPrediction
 * @param frequencyMhz    spectrometer frequency in MHz (e.g. 400)
 * @returns               one or more {@link SubLine}s
 */
export function expandMultiplet(peak: NmrPeak, frequencyMhz: number): SubLine[] {
  if (!Number.isFinite(frequencyMhz) || frequencyMhz <= 0) {
    throw new Error(`expandMultiplet: frequencyMhz must be > 0, got ${frequencyMhz}`);
  }
  // Intensity contract: the parent peak's total "mass" on the spectrum is
  // proportional to the number of equivalent protons (nH). Single atom
  // fallback for non-1H spectra where the peak represents one nucleus.
  const nH = Math.max(peak.atom_indices.length, 1);
  const counts = resolveMultiplicity(peak.multiplicity ?? 's');
  const js = peak.coupling_hz ?? [];

  // Start from a single line at the reported shift carrying all the mass.
  let lines: SubLine[] = [{ shiftPpm: peak.shift_ppm, intensity: nH }];

  for (let i = 0; i < counts.length; i++) {
    const n = counts[i] ?? 0;
    // Fall back to a sensible default J (7 Hz is the typical ³JHH) when the
    // backend omits it — better than collapsing the multiplet to a singlet.
    const jHz = js[i] ?? DEFAULT_J_HZ;
    const jPpm = jHz / frequencyMhz;
    lines = splitLines(lines, n, jPpm);
  }

  return lines;
}

/**
 * Detect whether a NmrPeak should render as an unresolved / broadened
 * multiplet. Used by the renderer to widen the Lorentzian half-width by
 * {@link MULTIPLET_BROADENING_FACTOR} for these peaks.
 */
export function isUnresolvedMultiplet(peak: NmrPeak): boolean {
  const key = (peak.multiplicity ?? '').trim().toLowerCase();
  return key === 'm' || key === 'br' || key === 'brs' || key === 'br s';
}
