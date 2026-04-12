/**
 * Detect atom hybridization from bond orders.
 */
import type { AtomId, Page } from '@kendraw/scene';

export type Hybridization = 'sp' | 'sp2' | 'sp3';

/**
 * Determine hybridization of an atom based on its bonds.
 * - Triple bond present → sp
 * - Double bond or aromatic → sp2
 * - All single bonds → sp3
 */
export function detectHybridization(page: Page, atomId: AtomId): Hybridization {
  let maxOrder = 0;
  let hasAromatic = false;

  for (const bond of Object.values(page.bonds)) {
    if (bond.fromAtomId === atomId || bond.toAtomId === atomId) {
      if (bond.order > maxOrder) maxOrder = bond.order;
      if (bond.order === 1.5) hasAromatic = true;
    }
  }

  if (maxOrder === 3) return 'sp';
  if (maxOrder === 2 || hasAromatic) return 'sp2';
  return 'sp3';
}

/**
 * Count bonds for an atom (total bond order sum).
 */
export function bondOrderSum(page: Page, atomId: AtomId): number {
  let sum = 0;
  for (const bond of Object.values(page.bonds)) {
    if (bond.fromAtomId === atomId || bond.toAtomId === atomId) {
      sum += bond.order;
    }
  }
  return sum;
}
