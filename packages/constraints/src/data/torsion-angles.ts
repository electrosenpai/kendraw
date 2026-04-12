/**
 * Torsion (dihedral) angle data — Section 3.
 */

export interface TorsionEntry {
  motif: string;
  preferred: number; // degrees
  alternatives: number[];
  barrier: number; // kcal/mol (0 = rigid)
}

// Section 3.1: Acyclic sp3-sp3
export const ACYCLIC_TORSIONS: TorsionEntry[] = [
  { motif: 'H-C-C-H ethane', preferred: 180, alternatives: [60, -60], barrier: 2.9 },
  { motif: 'CH3-C-C-CH3 butane', preferred: 180, alternatives: [65, -65], barrier: 3.8 },
  { motif: 'H-C-O-H methanol', preferred: 180, alternatives: [60, -60], barrier: 1.1 },
  { motif: 'C-C-O-H ethanol', preferred: 180, alternatives: [60, -60], barrier: 1.0 },
  { motif: 'H-C-C-OH ethanol', preferred: 180, alternatives: [60, -60], barrier: 1.0 },
  { motif: 'C-C-N-H ethylamine', preferred: 180, alternatives: [60, -60], barrier: 2.0 },
  { motif: 'C-C-C-C alkane chain', preferred: 180, alternatives: [65, -65], barrier: 3.5 },
  { motif: 'F-C-C-F difluoroethane', preferred: 60, alternatives: [180], barrier: 0 },
  { motif: 'C-C-S-H ethanethiol', preferred: 60, alternatives: [180], barrier: 1.3 },
  { motif: 'C-S-S-C disulfide', preferred: 90, alternatives: [-90], barrier: 10.0 },
];

// Section 3.2: sp2-involving
export const SP2_TORSIONS: TorsionEntry[] = [
  { motif: 'H-C=C-H ethylene', preferred: 0, alternatives: [180], barrier: 0 },
  { motif: 'C-C=C-C alkene', preferred: 0, alternatives: [180], barrier: 0 },
  { motif: 'C-C(=O)-C ketone', preferred: 0, alternatives: [180], barrier: 0 },
  { motif: 'O=C-N-H amide trans', preferred: 0, alternatives: [180], barrier: 5.0 },
  { motif: 'O=C-O-H carboxylic acid syn', preferred: 0, alternatives: [], barrier: 5.0 },
  { motif: 'O=C-O-C ester', preferred: 0, alternatives: [180], barrier: 0 },
  { motif: 'biphenyl', preferred: 44, alternatives: [-44], barrier: 0 },
  { motif: 'phenol C(ar)-O-H', preferred: 0, alternatives: [], barrier: 0 },
  { motif: 'aniline C(ar)-N-H', preferred: 35, alternatives: [-35], barrier: 0 },
];

// Section 3.3: Ring torsions
export const RING_TORSIONS: TorsionEntry[] = [
  { motif: 'cyclohexane chair', preferred: 55.7, alternatives: [-55.7], barrier: 0 },
  { motif: 'cyclohexane boat', preferred: 0, alternatives: [55], barrier: 0 },
  { motif: 'cyclopentane envelope', preferred: 30, alternatives: [-30], barrier: 0 },
  { motif: 'benzene', preferred: 0, alternatives: [], barrier: 0 },
  { motif: 'pyranose chair', preferred: 57, alternatives: [-57], barrier: 0 },
];

export const ALL_TORSIONS = [...ACYCLIC_TORSIONS, ...SP2_TORSIONS, ...RING_TORSIONS];
