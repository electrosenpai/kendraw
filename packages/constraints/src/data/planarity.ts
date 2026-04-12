/**
 * Planarity constraints — Section 4.
 */

export interface PlanarityEntry {
  fragment: string;
  maxDeviation: number; // angstroms
}

export const PLANARITY_CONSTRAINTS: PlanarityEntry[] = [
  { fragment: 'aromatic ring', maxDeviation: 0.01 },
  { fragment: 'amide group', maxDeviation: 0.05 },
  { fragment: 'carboxylate', maxDeviation: 0.02 },
  { fragment: 'guanidinium', maxDeviation: 0.03 },
  { fragment: 'nitro group', maxDeviation: 0.02 },
  { fragment: 'ester', maxDeviation: 0.05 },
  { fragment: 'urea', maxDeviation: 0.05 },
  { fragment: 'enol', maxDeviation: 0.05 },
  { fragment: 'conjugated diene', maxDeviation: 0.1 },
  { fragment: 'peptide bond', maxDeviation: 0.05 },
  { fragment: 'sp2 trigonal', maxDeviation: 0.01 }, // sum of angles = 360 ± 1
];
