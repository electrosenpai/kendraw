/**
 * Van der Waals radii and minimum non-bonded distances.
 * Source: Bondi (1964), Section 5 of constraints reference.
 */

/** Van der Waals radius in angstroms, keyed by atomic number. */
export const VDW_RADII: Record<number, number> = {
  1: 1.2, // H
  6: 1.7, // C
  7: 1.55, // N
  8: 1.52, // O
  9: 1.47, // F
  15: 1.8, // P
  16: 1.8, // S
  17: 1.75, // Cl
  35: 1.85, // Br
  53: 1.98, // I
};

export function getVdwRadius(z: number): number {
  return VDW_RADII[z] ?? 1.7;
}

/** Minimum non-bonded distances (Å). */
export const MIN_NONBONDED: { a: string; b: string; dist: number; context: string }[] = [
  { a: 'H', b: 'H', dist: 2.0, context: 'non-bonded' },
  { a: 'C', b: 'H', dist: 2.4, context: 'non-bonded' },
  { a: 'C', b: 'C', dist: 3.0, context: 'non-bonded' },
  { a: 'C', b: 'N', dist: 2.9, context: 'non-bonded' },
  { a: 'C', b: 'O', dist: 2.8, context: 'non-bonded' },
  { a: 'N', b: 'N', dist: 2.7, context: 'non-bonded' },
  { a: 'O', b: 'O', dist: 2.6, context: 'non-bonded' },
  { a: 'H', b: 'H', dist: 1.8, context: '1,4-separated' },
  { a: 'H', b: 'H', dist: 2.0, context: 'aromatic ortho' },
];

/** Get minimum non-bonded distance for two atoms. */
export function getMinNonbondedDist(z1: number, z2: number): number {
  const r1 = getVdwRadius(z1);
  const r2 = getVdwRadius(z2);
  return (r1 + r2) * 0.83; // ~83% of sum as default
}

/** Check if a 1,4-interaction (reduced threshold). */
export function getMin14Dist(z1: number, z2: number): number {
  const r1 = getVdwRadius(z1);
  const r2 = getVdwRadius(z2);
  return (r1 + r2) * 0.7;
}
