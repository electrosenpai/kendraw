import type { AtomId, Page } from './types.js';

// Standard valence for common organic elements
const STANDARD_VALENCE: Record<number, number[]> = {
  1: [1], // H
  5: [3], // B
  6: [4], // C
  7: [3], // N
  8: [2], // O
  9: [1], // F
  14: [4], // Si
  15: [3, 5], // P
  16: [2, 4, 6], // S
  17: [1], // Cl
  35: [1], // Br
  53: [1], // I
};

export interface ValenceIssue {
  atomId: AtomId;
  expected: number[];
  actual: number;
  message: string;
}

export function validateValence(page: Page): ValenceIssue[] {
  const issues: ValenceIssue[] = [];

  // Count bond orders per atom
  const bondOrderSum = new Map<AtomId, number>();
  for (const bond of Object.values(page.bonds)) {
    const fromSum = bondOrderSum.get(bond.fromAtomId) ?? 0;
    bondOrderSum.set(bond.fromAtomId, fromSum + bond.order);
    const toSum = bondOrderSum.get(bond.toAtomId) ?? 0;
    bondOrderSum.set(bond.toAtomId, toSum + bond.order);
  }

  for (const atom of Object.values(page.atoms)) {
    const valences = STANDARD_VALENCE[atom.element];
    if (!valences) continue; // skip unknown elements

    const bondSum = bondOrderSum.get(atom.id) ?? 0;
    const effectiveValence = bondSum + Math.abs(atom.charge);

    const isValid = valences.some((v) => effectiveValence <= v);
    if (!isValid) {
      const maxValence = Math.max(...valences);
      issues.push({
        atomId: atom.id,
        expected: valences,
        actual: effectiveValence,
        message: `Atom has valence ${effectiveValence}, expected max ${maxValence}`,
      });
    }
  }

  return issues;
}
