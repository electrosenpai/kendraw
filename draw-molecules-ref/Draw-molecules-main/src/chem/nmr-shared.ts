import type { NmrPredictionResult, NmrSolventId } from './types';

export const DEFAULT_NMR_SOLVENT: NmrSolventId = 'CDCl3';

export const NMR_SOLVENT_OPTIONS: Array<{ id: NmrSolventId; label: string }> = [
  { id: 'CDCl3', label: 'CDCl3' },
  { id: 'DMSO-d6', label: 'DMSO-d6' },
  { id: 'CD3OD', label: 'CD3OD' },
  { id: 'acetone-d6', label: 'acetone-d6' },
  { id: 'C6D6', label: 'C6D6' },
  { id: 'D2O', label: 'D2O' },
];

export function createEmptyNmrPrediction(): NmrPredictionResult {
  return {
    status: 'idle',
    proton: null,
    carbon: null,
    warnings: [],
    error: null,
    updatedAt: null,
  };
}
