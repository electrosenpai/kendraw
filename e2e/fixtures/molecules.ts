/**
 * Reference molecules for E2E testing.
 * Each entry includes SMILES, expected property values, and NMR data
 * for regression detection on chemistry calculations.
 */

export const MOLECULES = {
  ethanol: {
    smiles: 'CCO',
    heavyAtoms: 3,
    bonds: 2,
    mw: 46.07,
    formula: 'C2H6O',
    nmr1H: {
      peakCount: 3,
      shifts: [
        { label: 'CH3', range: [0.9, 1.4], multiplicity: 't' },
        { label: 'CH2', range: [3.4, 3.9], multiplicity: 'q' },
      ],
    },
  },

  caffeine: {
    smiles: 'Cn1c(=O)c2c(ncn2C)n(C)c1=O',
    heavyAtoms: 14,
    bonds: 16,
    mw: 194.19,
    formula: 'C8H10N4O2',
    nmr1H: {
      // Bug #4 regression: C8-H was overcorrected to >12 ppm
      shifts: [{ label: 'C8-H', range: [7.0, 8.5], multiplicity: 's' }],
    },
  },

  aspirin: {
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    heavyAtoms: 13,
    bonds: 13,
    mw: 180.16,
    tpsa: 63.6,
    logp: 1.2,
    lipinski: true,
  },

  benzene: {
    smiles: 'c1ccccc1',
    heavyAtoms: 6,
    bonds: 6,
    mw: 78.11,
    formula: 'C6H6',
  },

  ibuprofen: {
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
    heavyAtoms: 15,
    bonds: 15,
    mw: 206.28,
    lipinski: true,
  },

  // Large molecule for stress tests
  cholesterol: {
    smiles: 'CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C',
    heavyAtoms: 27,
    mw: 386.65,
  },

  // Invalid inputs for error handling tests
  invalid: { smiles: 'C(C)(C)(C)(C)C' }, // pentavalent carbon — invalid chemistry
  empty: { smiles: '' },
} as const;

export type MoleculeKey = keyof typeof MOLECULES;

/** Backend API base URL */
export const BACKEND_URL = 'http://localhost:8081';
