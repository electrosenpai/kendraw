/**
 * Bond length data from gas-phase experimental / ab initio.
 * Source: docs/molecular-constraints-reference.md Section 1
 */

export interface BondLengthEntry {
  type: string;
  context: string;
  length: number; // angstroms
  tolerance: number;
}

// Section 1.1: Carbon-Carbon Bonds
export const CC_BONDS: BondLengthEntry[] = [
  { type: 'C-C', context: 'sp3-sp3 alkane', length: 1.535, tolerance: 0.005 },
  { type: 'C-C', context: 'sp3-sp3 cyclopropane', length: 1.51, tolerance: 0.005 },
  { type: 'C-C', context: 'sp3-sp3 cyclobutane', length: 1.548, tolerance: 0.005 },
  { type: 'C-C', context: 'sp3-sp3 neopentane', length: 1.537, tolerance: 0.005 },
  { type: 'C-C', context: 'sp3-sp2 alkyl-vinyl', length: 1.51, tolerance: 0.008 },
  { type: 'C-C', context: 'sp2-sp2 conjugated', length: 1.467, tolerance: 0.005 },
  { type: 'C=C', context: 'sp2-sp2 ethylene', length: 1.337, tolerance: 0.005 },
  { type: 'C=C', context: 'sp2-sp2 conjugated diene', length: 1.349, tolerance: 0.005 },
  { type: 'C≡C', context: 'sp-sp terminal alkyne', length: 1.203, tolerance: 0.003 },
  { type: 'C≡C', context: 'sp-sp internal alkyne', length: 1.21, tolerance: 0.003 },
  { type: 'C-C', context: 'aromatic benzene', length: 1.397, tolerance: 0.002 },
  { type: 'C-C', context: 'aromatic naphthalene C1-C2', length: 1.381, tolerance: 0.003 },
  { type: 'C-C', context: 'aromatic naphthalene C2-C3', length: 1.417, tolerance: 0.003 },
  { type: 'C-C', context: 'aromatic pyridine', length: 1.395, tolerance: 0.003 },
  { type: 'C-C', context: 'aromatic furan C2-C3', length: 1.361, tolerance: 0.003 },
  { type: 'C-C', context: 'aromatic furan C3-C4', length: 1.431, tolerance: 0.003 },
];

// Section 1.2: Carbon-Hydrogen Bonds
export const CH_BONDS: BondLengthEntry[] = [
  { type: 'C-H', context: 'sp3 alkane', length: 1.094, tolerance: 0.003 },
  { type: 'C-H', context: 'sp2 alkene', length: 1.087, tolerance: 0.003 },
  { type: 'C-H', context: 'sp2 aromatic', length: 1.084, tolerance: 0.003 },
  { type: 'C-H', context: 'sp terminal alkyne', length: 1.063, tolerance: 0.003 },
  { type: 'C-H', context: 'sp2 aldehyde', length: 1.114, tolerance: 0.005 },
];

// Section 1.3: Carbon-Oxygen Bonds
export const CO_BONDS: BondLengthEntry[] = [
  { type: 'C-O', context: 'sp3 alcohol/ether', length: 1.43, tolerance: 0.005 },
  { type: 'C-O', context: 'sp3 epoxide', length: 1.436, tolerance: 0.005 },
  { type: 'C-O', context: 'sp2 ester C-O-C', length: 1.344, tolerance: 0.005 },
  { type: 'C-O', context: 'sp2 carboxylic acid C-OH', length: 1.355, tolerance: 0.005 },
  { type: 'C-O', context: 'phenol Ar-OH', length: 1.362, tolerance: 0.005 },
  { type: 'C=O', context: 'aldehyde/ketone', length: 1.21, tolerance: 0.005 },
  { type: 'C=O', context: 'carboxylic acid', length: 1.214, tolerance: 0.005 },
  { type: 'C=O', context: 'ester carbonyl', length: 1.206, tolerance: 0.005 },
  { type: 'C=O', context: 'amide carbonyl', length: 1.235, tolerance: 0.005 },
  { type: 'C=O', context: 'carboxylate anion', length: 1.25, tolerance: 0.003 },
];

// Section 1.4: Carbon-Nitrogen Bonds
export const CN_BONDS: BondLengthEntry[] = [
  { type: 'C-N', context: 'sp3 amine', length: 1.474, tolerance: 0.005 },
  { type: 'C-N', context: 'sp2 amide', length: 1.335, tolerance: 0.005 },
  { type: 'C-N', context: 'aromatic pyridine', length: 1.338, tolerance: 0.003 },
  { type: 'C-N', context: 'aromatic pyrrole', length: 1.37, tolerance: 0.003 },
  { type: 'C-N', context: 'aromatic imidazole C2-N', length: 1.325, tolerance: 0.005 },
  { type: 'C=N', context: 'imine/Schiff base', length: 1.279, tolerance: 0.005 },
  { type: 'C≡N', context: 'nitrile', length: 1.158, tolerance: 0.003 },
  { type: 'C-N', context: 'guanidinium', length: 1.33, tolerance: 0.005 },
];

// Section 1.5: Heteroatom Bonds
export const HETERO_BONDS: BondLengthEntry[] = [
  { type: 'O-H', context: 'water/alcohol', length: 0.96, tolerance: 0.003 },
  { type: 'N-H', context: 'amine/amide', length: 1.01, tolerance: 0.005 },
  { type: 'S-H', context: 'thiol', length: 1.34, tolerance: 0.005 },
  { type: 'C-S', context: 'sp3 thioether', length: 1.82, tolerance: 0.005 },
  { type: 'C=S', context: 'thioketone/thioamide', length: 1.68, tolerance: 0.005 },
  { type: 'C-S', context: 'aromatic thiophene', length: 1.714, tolerance: 0.005 },
  { type: 'S-S', context: 'disulfide', length: 2.05, tolerance: 0.01 },
  { type: 'P-O', context: 'phosphate ester', length: 1.593, tolerance: 0.005 },
  { type: 'P=O', context: 'phosphoryl', length: 1.485, tolerance: 0.005 },
  { type: 'P-O', context: 'phosphate anion', length: 1.52, tolerance: 0.005 },
  { type: 'C-F', context: 'fluoroalkane', length: 1.39, tolerance: 0.005 },
  { type: 'C-Cl', context: 'chloroalkane', length: 1.781, tolerance: 0.005 },
  { type: 'C-Br', context: 'bromoalkane', length: 1.945, tolerance: 0.005 },
  { type: 'C-I', context: 'iodoalkane', length: 2.162, tolerance: 0.005 },
  { type: 'N=O', context: 'nitro group', length: 1.226, tolerance: 0.005 },
  { type: 'S=O', context: 'sulfoxide', length: 1.485, tolerance: 0.005 },
  { type: 'S=O', context: 'sulfone', length: 1.431, tolerance: 0.005 },
];

export const ALL_BOND_LENGTHS = [
  ...CC_BONDS,
  ...CH_BONDS,
  ...CO_BONDS,
  ...CN_BONDS,
  ...HETERO_BONDS,
];

/**
 * Quick lookup: given two element numbers and bond order, return the default length in Å.
 * Falls back to sum of covalent radii if not in the table.
 */
const COVALENT_RADII: Record<number, number> = {
  1: 0.31,
  5: 0.84,
  6: 0.76,
  7: 0.71,
  8: 0.66,
  9: 0.57,
  14: 1.11,
  15: 1.07,
  16: 1.05,
  17: 1.02,
  35: 1.2,
  53: 1.39,
};

export function getDefaultBondLength(z1: number, z2: number, order: number): number {
  const [a, b] = z1 <= z2 ? [z1, z2] : [z2, z1];
  // C-C
  if (a === 6 && b === 6) {
    if (order === 3) return 1.203;
    if (order === 2) return 1.337;
    if (order === 1.5) return 1.397;
    return 1.535;
  }
  // C-O
  if (a === 6 && b === 8) {
    if (order === 2) return 1.21;
    return 1.43;
  }
  // C-N
  if (a === 6 && b === 7) {
    if (order === 3) return 1.158;
    if (order === 2) return 1.279;
    if (order === 1.5) return 1.338;
    return 1.474;
  }
  // C-S
  if (a === 6 && b === 16) {
    if (order === 2) return 1.68;
    return 1.82;
  }
  // C-Halogens
  if (a === 6 && b === 9) return 1.39;
  if (a === 6 && b === 17) return 1.781;
  if (a === 6 && b === 35) return 1.945;
  if (a === 6 && b === 53) return 2.162;
  // C-H
  if (a === 1 && b === 6) return 1.094;
  // O-H
  if (a === 1 && b === 8) return 0.96;
  // N-H
  if (a === 1 && b === 7) return 1.01;
  // S-H
  if (a === 1 && b === 16) return 1.34;
  // S-S
  if (a === 16 && b === 16) return 2.05;
  // Fallback: sum of covalent radii
  return (COVALENT_RADII[a] ?? 0.76) + (COVALENT_RADII[b] ?? 0.76);
}
