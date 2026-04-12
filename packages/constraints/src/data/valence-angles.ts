/**
 * Valence angle data — Section 2 of molecular constraints reference.
 */

export interface AngleEntry {
  center: string;
  context: string;
  angle: number; // degrees
  tolerance: number;
}

// Section 2.1: sp3 tetrahedral
export const SP3_ANGLES: AngleEntry[] = [
  { center: 'C(sp3)', context: 'ideal tetrahedral', angle: 109.47, tolerance: 0.5 },
  { center: 'C(sp3)', context: 'ethane H-C-H', angle: 107.5, tolerance: 1.0 },
  { center: 'C(sp3)', context: 'ethane H-C-C', angle: 111.0, tolerance: 1.0 },
  { center: 'C(sp3)', context: 'isopropyl C-C-C', angle: 112.0, tolerance: 1.5 },
  { center: 'C(sp3)', context: 'cyclopropane ring', angle: 60.0, tolerance: 0 },
  { center: 'C(sp3)', context: 'cyclobutane ring', angle: 88.0, tolerance: 2.0 },
  { center: 'C(sp3)', context: 'cyclopentane ring', angle: 104.0, tolerance: 3.0 },
  { center: 'C(sp3)', context: 'cyclohexane ring', angle: 111.4, tolerance: 0.5 },
  { center: 'N(sp3)', context: 'amine H-N-H', angle: 107.0, tolerance: 1.0 },
  { center: 'N(sp3)', context: 'amine C-N-C', angle: 110.9, tolerance: 1.0 },
  { center: 'O(sp3)', context: 'water H-O-H', angle: 104.5, tolerance: 0.5 },
  { center: 'O(sp3)', context: 'ether C-O-C', angle: 111.7, tolerance: 1.0 },
  { center: 'O(sp3)', context: 'alcohol C-O-H', angle: 108.5, tolerance: 1.0 },
  { center: 'S(sp3)', context: 'thioether C-S-C', angle: 99.0, tolerance: 2.0 },
  { center: 'S(sp3)', context: 'H-S-H', angle: 92.1, tolerance: 0.5 },
  { center: 'P(sp3)', context: 'phosphine H-P-H', angle: 93.3, tolerance: 1.0 },
];

// Section 2.2: sp2 trigonal planar
export const SP2_ANGLES: AngleEntry[] = [
  { center: 'C(sp2)', context: 'ideal trigonal planar', angle: 120.0, tolerance: 0.5 },
  { center: 'C(sp2)', context: 'ethylene H-C=C', angle: 121.3, tolerance: 0.5 },
  { center: 'C(sp2)', context: 'ethylene H-C-H', angle: 117.4, tolerance: 0.5 },
  { center: 'C(sp2)', context: 'aldehyde H-C=O', angle: 121.8, tolerance: 1.0 },
  { center: 'C(sp2)', context: 'aldehyde R-C=O', angle: 124.0, tolerance: 1.0 },
  { center: 'C(sp2)', context: 'ketone C-C=O', angle: 121.5, tolerance: 1.0 },
  { center: 'C(sp2)', context: 'ketone C-C-C across carbonyl', angle: 117.0, tolerance: 1.5 },
  { center: 'C(sp2)', context: 'amide O=C-N', angle: 122.5, tolerance: 1.0 },
  { center: 'C(sp2)', context: 'amide R-C-N', angle: 115.0, tolerance: 1.0 },
  { center: 'C(sp2)', context: 'carboxylic acid O=C-O', angle: 123.0, tolerance: 1.0 },
  { center: 'C(sp2)', context: 'benzene C-C-C', angle: 120.0, tolerance: 0.3 },
  { center: 'C(sp2)', context: 'pyridine C-N-C', angle: 117.0, tolerance: 0.5 },
  { center: 'C(sp2)', context: 'pyridine N-C-C', angle: 123.5, tolerance: 0.5 },
  { center: 'N(sp2)', context: 'amide C-N-H', angle: 119.0, tolerance: 1.0 },
  { center: 'N(sp2)', context: 'amide H-N-H primary', angle: 118.0, tolerance: 1.5 },
  { center: 'N(sp2)', context: 'pyrrole C-N-C', angle: 109.8, tolerance: 0.5 },
];

// Section 2.3: sp linear
export const SP_ANGLES: AngleEntry[] = [
  { center: 'C(sp)', context: 'alkyne', angle: 180.0, tolerance: 0.5 },
  { center: 'C(sp)', context: 'nitrile', angle: 180.0, tolerance: 0.5 },
  { center: 'C(sp)', context: 'allene central', angle: 180.0, tolerance: 0.5 },
  { center: 'C(sp)', context: 'isocyanate', angle: 180.0, tolerance: 1.0 },
  { center: 'N(sp)', context: 'azide central', angle: 180.0, tolerance: 1.0 },
];

// Section 2.4: Five-membered heterocycles
export const HETERO_RING_ANGLES: AngleEntry[] = [
  { center: 'furan', context: 'O-C2-C3', angle: 110.7, tolerance: 0.5 },
  { center: 'furan', context: 'C2-C3-C4', angle: 106.1, tolerance: 0.5 },
  { center: 'furan', context: 'C5-O-C2', angle: 106.5, tolerance: 0.5 },
  { center: 'thiophene', context: 'S-C2-C3', angle: 111.5, tolerance: 0.5 },
  { center: 'thiophene', context: 'C2-C3-C4', angle: 112.5, tolerance: 0.5 },
  { center: 'thiophene', context: 'C5-S-C2', angle: 92.2, tolerance: 0.5 },
  { center: 'pyrrole', context: 'N-C2-C3', angle: 107.7, tolerance: 0.5 },
  { center: 'pyrrole', context: 'C2-C3-C4', angle: 107.4, tolerance: 0.5 },
  { center: 'pyrrole', context: 'C5-N-C2', angle: 109.8, tolerance: 0.5 },
  { center: 'imidazole', context: 'N1-C2-N3', angle: 112.0, tolerance: 0.5 },
  { center: 'imidazole', context: 'C4-C5-N1', angle: 105.3, tolerance: 0.5 },
];

export const ALL_ANGLES = [...SP3_ANGLES, ...SP2_ANGLES, ...SP_ANGLES, ...HETERO_RING_ANGLES];

/** Get default angle for a center atom given hybridization. */
export function getDefaultAngle(hybridization: 'sp3' | 'sp2' | 'sp'): number {
  switch (hybridization) {
    case 'sp3':
      return 109.47;
    case 'sp2':
      return 120.0;
    case 'sp':
      return 180.0;
  }
}
