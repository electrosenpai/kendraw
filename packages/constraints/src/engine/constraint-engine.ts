/**
 * Main constraint engine — validates and cleans up molecular geometry.
 * Priority: bond lengths > valence angles > torsion angles > steric clashes.
 */
import type { AtomId, Page } from '@kendraw/scene';
import { getDefaultBondLength } from '../data/bond-lengths.js';
import { getMinNonbondedDist } from '../data/vdw-radii.js';

export interface Violation {
  type: 'bond-length' | 'angle' | 'steric-clash' | 'valence';
  severity: 'error' | 'warning';
  atomIds: AtomId[];
  message: string;
  expected: number;
  actual: number;
}

export interface CleanupResult {
  violations: Violation[];
  corrections: Map<AtomId, { dx: number; dy: number }>;
}

const SCALE = 40; // angstroms to pixels

/**
 * Validate a page and return all violations.
 */
export function validateGeometry(page: Page): Violation[] {
  const violations: Violation[] = [];

  // 1. Bond length validation
  for (const bond of Object.values(page.bonds)) {
    const fa = page.atoms[bond.fromAtomId];
    const ta = page.atoms[bond.toAtomId];
    if (!fa || !ta) continue;

    const dx = ta.x - fa.x;
    const dy = ta.y - fa.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const distA = distPx / SCALE;
    const expected = getDefaultBondLength(fa.element, ta.element, bond.order);
    const diff = Math.abs(distA - expected);

    if (diff > 0.1) {
      violations.push({
        type: 'bond-length',
        severity: diff > 0.3 ? 'error' : 'warning',
        atomIds: [bond.fromAtomId, bond.toAtomId],
        message: `Bond ${distA.toFixed(3)}Å, expected ${expected.toFixed(3)}Å`,
        expected,
        actual: distA,
      });
    }
  }

  // 2. Steric clash detection
  const atoms = Object.values(page.atoms);
  const bondPairs = new Set<string>();
  for (const bond of Object.values(page.bonds)) {
    const key = [bond.fromAtomId, bond.toAtomId].sort().join('-');
    bondPairs.add(key);
  }

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a = atoms[i];
      const b = atoms[j];
      if (!a || !b) continue;

      // Skip bonded pairs
      const key = [a.id, b.id].sort().join('-');
      if (bondPairs.has(key)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distA = distPx / SCALE;
      const minDist = getMinNonbondedDist(a.element, b.element);

      if (distA < minDist) {
        violations.push({
          type: 'steric-clash',
          severity: 'warning',
          atomIds: [a.id, b.id],
          message: `Steric clash: ${distA.toFixed(2)}Å < ${minDist.toFixed(2)}Å min`,
          expected: minDist,
          actual: distA,
        });
      }
    }
  }

  return violations;
}

/**
 * Apply structure cleanup: adjust bond lengths to ideal values.
 * Returns corrections as dx/dy deltas per atom.
 */
export function cleanup(page: Page): CleanupResult {
  const corrections = new Map<AtomId, { dx: number; dy: number }>();
  const violations = validateGeometry(page);

  // Initialize corrections
  for (const atom of Object.values(page.atoms)) {
    corrections.set(atom.id, { dx: 0, dy: 0 });
  }

  // Iterative relaxation for bond lengths (5 passes)
  for (let pass = 0; pass < 5; pass++) {
    for (const bond of Object.values(page.bonds)) {
      const fa = page.atoms[bond.fromAtomId];
      const ta = page.atoms[bond.toAtomId];
      if (!fa || !ta) continue;

      const cfa = corrections.get(bond.fromAtomId) ?? { dx: 0, dy: 0 };
      const cta = corrections.get(bond.toAtomId) ?? { dx: 0, dy: 0 };

      const ax = fa.x + cfa.dx;
      const ay = fa.y + cfa.dy;
      const bx = ta.x + cta.dx;
      const by = ta.y + cta.dy;

      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) continue;

      const expected = getDefaultBondLength(fa.element, ta.element, bond.order);
      const targetDist = expected * SCALE;
      const error = dist - targetDist;
      const correction = error * 0.25; // 25% per pass

      const ux = dx / dist;
      const uy = dy / dist;

      // Move each atom half the correction
      cfa.dx += ux * correction * 0.5;
      cfa.dy += uy * correction * 0.5;
      cta.dx -= ux * correction * 0.5;
      cta.dy -= uy * correction * 0.5;

      corrections.set(bond.fromAtomId, cfa);
      corrections.set(bond.toAtomId, cta);
    }
  }

  return { violations, corrections };
}

/**
 * Get ideal bond length in pixels for a bond between two elements.
 */
export function getIdealBondLengthPx(z1: number, z2: number, order: number): number {
  return getDefaultBondLength(z1, z2, order) * SCALE;
}
