import type { Page } from '@kendraw/scene';
import { getSymbol } from '@kendraw/scene';

// Standard atomic weights for common elements
const ATOMIC_WEIGHTS: Record<number, number> = {
  1: 1.008,
  2: 4.003,
  3: 6.941,
  5: 10.81,
  6: 12.011,
  7: 14.007,
  8: 15.999,
  9: 18.998,
  11: 22.99,
  12: 24.305,
  14: 28.086,
  15: 30.974,
  16: 32.065,
  17: 35.453,
  19: 39.098,
  20: 40.078,
  26: 55.845,
  29: 63.546,
  30: 65.38,
  35: 79.904,
  53: 126.904,
};

export interface MolecularProperties {
  formula: string;
  molecularWeight: number;
  atomCount: number;
  bondCount: number;
}

export function computeProperties(page: Page): MolecularProperties {
  const atoms = Object.values(page.atoms);
  const bonds = Object.values(page.bonds);

  // Count elements
  const elementCounts = new Map<number, number>();
  for (const atom of atoms) {
    const count = elementCounts.get(atom.element) ?? 0;
    elementCounts.set(atom.element, count + 1);
  }

  // Hill system ordering: C first, H second, then alphabetical
  const formula = formatFormula(elementCounts);
  const molecularWeight = computeMW(elementCounts);

  return {
    formula,
    molecularWeight,
    atomCount: atoms.length,
    bondCount: bonds.length,
  };
}

function formatFormula(counts: Map<number, number>): string {
  if (counts.size === 0) return '';

  const parts: string[] = [];

  // Hill system: C first, H second, then alphabetical
  const carbonCount = counts.get(6);
  if (carbonCount) {
    parts.push(`C${carbonCount > 1 ? carbonCount : ''}`);
    const hCount = counts.get(1);
    if (hCount) {
      parts.push(`H${hCount > 1 ? hCount : ''}`);
    }
  }

  // Remaining elements sorted alphabetically by symbol
  const remaining = [...counts.entries()]
    .filter(([z]) => z !== 6 && z !== 1)
    .map(([z, count]) => ({ symbol: getSymbol(z), count }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  // If no carbon, add H with the rest
  if (!carbonCount) {
    const hCount = counts.get(1);
    if (hCount) {
      remaining.unshift({ symbol: 'H', count: hCount });
    }
    remaining.sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  for (const { symbol, count } of remaining) {
    parts.push(`${symbol}${count > 1 ? count : ''}`);
  }

  return parts.join('');
}

function computeMW(counts: Map<number, number>): number {
  let mw = 0;
  for (const [z, count] of counts) {
    const weight = ATOMIC_WEIGHTS[z] ?? 0;
    mw += weight * count;
  }
  return Math.round(mw * 1000) / 1000;
}
