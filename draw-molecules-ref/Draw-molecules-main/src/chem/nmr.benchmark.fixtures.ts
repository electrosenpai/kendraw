import type { NmrSolventId } from './types';

export type NmrBenchmarkSignal = {
  label: string;
  integral: number;
  multiplicity: string | string[];
  deltaRange: [number, number];
};

export type NmrBenchmarkFixture = {
  name: string;
  smiles: string;
  solvent: NmrSolventId;
  expectedSignals: NmrBenchmarkSignal[];
};

export const NMR_BENCHMARK_FIXTURES: NmrBenchmarkFixture[] = [
  {
    name: 'Ethanol',
    smiles: 'CCO',
    solvent: 'CDCl3',
    expectedSignals: [
      { label: 'methyl triplet', integral: 3, multiplicity: 't', deltaRange: [0.6, 1.5] },
      { label: 'methylene quartet', integral: 2, multiplicity: 'q', deltaRange: [2.8, 4.1] },
      {
        label: 'hydroxyl singlet',
        integral: 1,
        multiplicity: ['s', 'br s'],
        deltaRange: [1.5, 4.5],
      },
    ],
  },
  {
    name: 'Isopropanol',
    smiles: 'CC(C)O',
    solvent: 'CDCl3',
    expectedSignals: [
      {
        label: 'equivalent methyl doublet',
        integral: 6,
        multiplicity: 'd',
        deltaRange: [0.6, 1.5],
      },
      { label: 'methine septet', integral: 1, multiplicity: 'sept', deltaRange: [2.8, 4.2] },
      {
        label: 'hydroxyl singlet',
        integral: 1,
        multiplicity: ['s', 'br s'],
        deltaRange: [1.5, 4.5],
      },
    ],
  },
  {
    name: 'Acetaldehyde',
    smiles: 'CC=O',
    solvent: 'CDCl3',
    expectedSignals: [
      { label: 'methyl doublet', integral: 3, multiplicity: 'd', deltaRange: [1.6, 3.2] },
      { label: 'aldehyde quartet', integral: 1, multiplicity: 'q', deltaRange: [9.2, 10.2] },
    ],
  },
  {
    name: 'Ethyl acetate',
    smiles: 'CCOC(C)=O',
    solvent: 'CDCl3',
    expectedSignals: [
      { label: 'terminal methyl triplet', integral: 3, multiplicity: 't', deltaRange: [0.6, 1.5] },
      { label: 'oxygen methylene quartet', integral: 2, multiplicity: 'q', deltaRange: [3.0, 4.6] },
      { label: 'acetyl singlet', integral: 3, multiplicity: 's', deltaRange: [1.8, 3.1] },
    ],
  },
  {
    name: 'tert-Butanol',
    smiles: 'CC(C)(C)O',
    solvent: 'CDCl3',
    expectedSignals: [
      { label: 'tert-butyl singlet', integral: 9, multiplicity: 's', deltaRange: [0.7, 1.6] },
      {
        label: 'hydroxyl singlet',
        integral: 1,
        multiplicity: ['s', 'br s'],
        deltaRange: [1.5, 4.5],
      },
    ],
  },
];
