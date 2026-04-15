import type {
  ChemicalDocument,
  NmrPredictionResult,
  NmrSignal,
  NmrSolventId,
  NmrSpectrum,
} from './types';
import { documentToMolecule } from './ocl';
import { getExtendedOcle } from './ocle';
import { DEFAULT_NMR_SOLVENT, createEmptyNmrPrediction } from './nmr-shared';
import {
  buildProtonDisplayModel,
  normalizeProtonAtomKey,
  type ProtonDisplayModel,
} from './proton-numbering';

const PROTON_RANGE = { min: 0, max: 12 };
const CARBON_RANGE = { min: 0, max: 220 };

type PredictorNamespace = typeof import('nmr-predictor');
type PredictorEntry = import('nmr-predictor').NmrPredictionEntry;
type PredictorModule = import('nmr-predictor').NmrPredictorModule;
type SimulationModule = typeof import('nmr-simulation');
type SparseMatrixModule = typeof import('ml-sparse-matrix');
type OclMolecule = ReturnType<typeof documentToMolecule>;
type PathAwareMolecule = OclMolecule & {
  getConnectivityMatrix(options?: { pathLength?: boolean }): number[][];
};
type SparseMatrixPrototype = {
  rows: number;
  columns: number;
  isEmpty?: () => boolean;
};
type SparseMatrixConstructor = {
  prototype: SparseMatrixPrototype;
};

type PredictionLibraries = {
  predictor: PredictorModule;
  simulation: SimulationModule;
};

type HydrogenDiastereotopicGroup = {
  counter: number;
  atoms: number[];
  oclID: string;
  atomLabel: string;
  _highlight: string[];
};

type EnhancedMolecule = PathAwareMolecule & {
  getGroupedDiastereotopicAtomIDs(options?: { atomLabel?: string }): HydrogenDiastereotopicGroup[];
  getDiastereotopicAtomIDs(): string[];
};

type DatabaseAvailability = {
  proton: boolean;
  carbon: boolean;
};

type ProtonEnvironment =
  | 'alkyl'
  | 'benzylic'
  | 'allylic'
  | 'alphaHetero'
  | 'alphaCarbonyl'
  | 'vinylic'
  | 'aromatic'
  | 'aldehyde'
  | 'hydroxyl'
  | 'amine'
  | 'thiol'
  | 'terminalAlkyne';

type CarbonEnvironment =
  | 'alkyl'
  | 'alphaHetero'
  | 'alphaCarbonyl'
  | 'alkene'
  | 'aromatic'
  | 'alkyne'
  | 'carbonyl';

type AromaticSubstituentClass =
  | 'aminoDonor'
  | 'strongDonor'
  | 'weakDonor'
  | 'weakWithdrawer'
  | 'strongWithdrawer';

type VinylicSubstituentClass =
  | 'none'
  | 'alkyl'
  | 'aryl'
  | 'heteroDonor'
  | 'halogen'
  | 'carbonyl'
  | 'vinyl';

type CouplingTarget = {
  targetAtomIds: string[];
  coupling: number;
  distance: number;
};

type ProtonGroup = {
  id: string;
  atomIndex: number;
  hostAtomIndices: number[];
  protonAtomIndices: number[];
  diaId: string;
  atomLabel: string;
  atomIds: string[];
  hydrogens: number;
  environment: ProtonEnvironment;
  delta: number;
  confidence: number | null;
  couplingTargets: CouplingTarget[];
};

type CarbonGroup = {
  atomIndex: number;
  hydrogens: number;
  environment: CarbonEnvironment;
  delta: number;
  confidence: number | null;
};

type SolventProfile = {
  id: NmrSolventId;
  label: string;
  protonFrequencyMHz: number;
  carbonFrequencyMHz: number;
  protonOffsets: Partial<Record<ProtonEnvironment, number>>;
  carbonOffsets: Partial<Record<CarbonEnvironment, number>>;
};

const SOLVENTS: Record<NmrSolventId, SolventProfile> = {
  CDCl3: {
    id: 'CDCl3',
    label: 'CDCl3',
    protonFrequencyMHz: 400.13,
    carbonFrequencyMHz: 100.61,
    protonOffsets: {},
    carbonOffsets: {},
  },
  'DMSO-d6': {
    id: 'DMSO-d6',
    label: 'DMSO-d6',
    protonFrequencyMHz: 400.13,
    carbonFrequencyMHz: 100.61,
    protonOffsets: {
      alkyl: 0.04,
      benzylic: 0.08,
      allylic: 0.06,
      alphaHetero: 0.16,
      alphaCarbonyl: 0.18,
      vinylic: 0.1,
      aromatic: 0.05,
      aldehyde: 0.14,
      hydroxyl: 1.1,
      amine: 0.7,
      thiol: 0.35,
      terminalAlkyne: 0.07,
    },
    carbonOffsets: {
      alkyl: 0.5,
      alphaHetero: 1.6,
      alphaCarbonyl: 1.2,
      alkene: 0.7,
      aromatic: 0.6,
      alkyne: 0.5,
      carbonyl: 1.4,
    },
  },
  CD3OD: {
    id: 'CD3OD',
    label: 'CD3OD',
    protonFrequencyMHz: 400.13,
    carbonFrequencyMHz: 100.61,
    protonOffsets: {
      alkyl: 0.02,
      benzylic: 0.04,
      allylic: 0.03,
      alphaHetero: 0.11,
      alphaCarbonyl: 0.09,
      vinylic: 0.05,
      aromatic: 0.01,
      aldehyde: 0.04,
      hydroxyl: 0.42,
      amine: 0.26,
      thiol: 0.14,
      terminalAlkyne: 0.02,
    },
    carbonOffsets: {
      alkyl: 0.3,
      alphaHetero: 0.9,
      alphaCarbonyl: 0.7,
      alkene: 0.4,
      aromatic: 0.2,
      alkyne: 0.3,
      carbonyl: 0.8,
    },
  },
  'acetone-d6': {
    id: 'acetone-d6',
    label: 'acetone-d6',
    protonFrequencyMHz: 400.13,
    carbonFrequencyMHz: 100.61,
    protonOffsets: {
      alkyl: 0.03,
      benzylic: 0.05,
      allylic: 0.04,
      alphaHetero: 0.12,
      alphaCarbonyl: 0.1,
      vinylic: 0.05,
      aromatic: 0.03,
      aldehyde: 0.09,
      hydroxyl: 0.55,
      amine: 0.24,
      thiol: 0.16,
      terminalAlkyne: 0.03,
    },
    carbonOffsets: {
      alkyl: 0.35,
      alphaHetero: 1,
      alphaCarbonyl: 0.8,
      alkene: 0.45,
      aromatic: 0.3,
      alkyne: 0.35,
      carbonyl: 0.95,
    },
  },
  C6D6: {
    id: 'C6D6',
    label: 'C6D6',
    protonFrequencyMHz: 400.13,
    carbonFrequencyMHz: 100.61,
    protonOffsets: {
      alkyl: -0.22,
      benzylic: -0.45,
      allylic: -0.18,
      alphaHetero: -0.15,
      alphaCarbonyl: -0.08,
      vinylic: -0.18,
      aromatic: -0.34,
      aldehyde: -0.17,
      hydroxyl: -0.28,
      amine: -0.22,
      thiol: -0.18,
      terminalAlkyne: -0.14,
    },
    carbonOffsets: {
      alkyl: -1.3,
      alphaHetero: -1.1,
      alphaCarbonyl: -0.7,
      alkene: -1,
      aromatic: -1.5,
      alkyne: -0.8,
      carbonyl: -0.6,
    },
  },
  D2O: {
    id: 'D2O',
    label: 'D2O',
    protonFrequencyMHz: 400.13,
    carbonFrequencyMHz: 100.61,
    protonOffsets: {
      alkyl: 0.01,
      benzylic: 0.02,
      allylic: 0.02,
      alphaHetero: 0.08,
      alphaCarbonyl: 0.06,
      vinylic: 0.03,
      aromatic: 0,
      aldehyde: 0.02,
      hydroxyl: 0.2,
      amine: 0.14,
      thiol: 0.08,
      terminalAlkyne: 0.02,
    },
    carbonOffsets: {
      alkyl: 0.2,
      alphaHetero: 0.7,
      alphaCarbonyl: 0.5,
      alkene: 0.25,
      aromatic: 0.15,
      alkyne: 0.2,
      carbonyl: 0.55,
    },
  },
};

let libraryPromise: Promise<PredictionLibraries> | null = null;
let databasePromise: Promise<DatabaseAvailability> | null = null;
let sparseMatrixCompatibilityPromise: Promise<void> | null = null;

export async function predictNmrSpectra(
  document: ChemicalDocument,
  options: { solvent?: NmrSolventId; mode?: 'auto' | 'local' } = {},
): Promise<NmrPredictionResult> {
  if (document.page.atoms.length === 0) {
    return createEmptyNmrPrediction();
  }

  const solventId = options.solvent ?? DEFAULT_NMR_SOLVENT;
  const mode = options.mode ?? 'auto';
  const solvent = SOLVENTS[solventId];
  const ocle = getExtendedOcle();
  const molecule = documentToMolecule(document);
  molecule.ensureHelperArrays(ocle.Molecule.cHelperCIP);
  const protonProbe = createProtonProbe(molecule, ocle);
  const protonDisplay = buildProtonDisplayModel(document, { molecule, protonProbe });

  const warnings: string[] = [];
  const protonGroups = buildProtonGroups(molecule, protonProbe, solventId);
  const carbonGroups = buildCarbonGroups(molecule, solventId);

  let predictor: PredictorModule | null = null;
  let simulation: SimulationModule | null = null;
  let databases: DatabaseAvailability = { proton: false, carbon: false };

  try {
    ensureBrowserNodeRuntimeShims();
    if (mode === 'local') {
      simulation = await loadSimulationLibrary();
    } else {
      const loaded = await loadPredictionLibraries();
      predictor = loaded.predictor;
      simulation = loaded.simulation;
      databases = await ensurePredictionDatabases(predictor);
    }
  } catch (error) {
    console.warn('NMR libraries could not be loaded for advanced simulation.', error);
  }

  if (predictor && databases.proton) {
    try {
      hydrateProtonGroupsFromDatabase(protonGroups, protonProbe, predictor, ocle, solventId);
    } catch (error) {
      console.warn(
        'Fragment-based proton shift prediction failed; keeping local structural estimate.',
        error,
      );
    }
  }

  if (predictor && databases.carbon) {
    try {
      hydrateCarbonGroupsFromDatabase(carbonGroups, molecule, predictor, ocle, solventId);
    } catch (error) {
      console.warn(
        'Fragment-based carbon shift prediction failed; keeping local structural estimate.',
        error,
      );
    }
  }

  const carbonSpectrum = buildEstimatedSpectrum(carbonGroupsToSignals(carbonGroups), {
    nucleus: '13C',
    source: databases.carbon ? 'fragment' : 'heuristic',
    methodLabel: databases.carbon
      ? 'Fragment-based 13C shift estimate'
      : 'Environment-based 13C estimate',
    frequencyMHz: solvent.carbonFrequencyMHz,
    solvent: solvent.label,
    range: CARBON_RANGE,
    points: 4096,
    lineWidth: 0.45,
  });

  const fallbackPredictions = buildEstimatedPredictionEntries(protonGroups);
  const fallbackSource: NmrSpectrum['source'] = databases.proton ? 'fragment' : 'heuristic';
  const fallbackMethodLabel = databases.proton
    ? 'Fragment-based 1H coupling simulation'
    : 'Environment-based 1H coupling simulation';

  let protonSpectrum: NmrSpectrum;
  if (predictor && simulation) {
    try {
      const spinusPrediction = await withTimeout(
        predictor.spinus(protonProbe as unknown as Record<string, unknown>, {
          OCLE: ocle,
          group: false,
        }),
        12000,
      );
      const adjustedPrediction = adjustSpinusPredictionForSolvent(
        spinusPrediction,
        molecule,
        protonProbe,
        solventId,
      );
      protonSpectrum = buildSimulatedProtonSpectrum(
        adjustedPrediction,
        simulation,
        'spinus',
        'Spinus-refined 1H coupling simulation',
        solvent,
        protonDisplay,
      );
    } catch (error) {
      console.warn('Spinus refinement failed; using local J-coupling model instead.', error);
      protonSpectrum = buildFallbackProtonSpectrum(
        fallbackPredictions,
        protonGroups,
        simulation,
        fallbackSource,
        fallbackMethodLabel,
        solvent,
        warnings,
        protonDisplay,
      );
    }
  } else if (simulation) {
    protonSpectrum = buildFallbackProtonSpectrum(
      fallbackPredictions,
      protonGroups,
      simulation,
      fallbackSource,
      fallbackMethodLabel,
      solvent,
      warnings,
      protonDisplay,
    );
  } else {
    warnings.push(
      'Advanced 1H line-shape simulation is unavailable in this session, so the proton trace is shown as a simplified envelope.',
    );
    protonSpectrum = buildEstimatedSpectrum(protonGroupsToSignals(protonGroups, protonDisplay), {
      nucleus: '1H',
      source: fallbackSource,
      methodLabel: fallbackMethodLabel,
      frequencyMHz: solvent.protonFrequencyMHz,
      solvent: solvent.label,
      range: PROTON_RANGE,
      points: 2048,
      lineWidth: 0.07,
    });
  }

  return {
    status: 'ready',
    proton: protonSpectrum,
    carbon: carbonSpectrum,
    warnings,
    error: null,
    updatedAt: new Date().toISOString(),
  };
}

async function loadPredictionLibraries() {
  if (!libraryPromise) {
    libraryPromise = Promise.all([
      import('nmr-predictor'),
      import('nmr-simulation'),
      ensureSparseMatrixCompatibility(),
    ]).then(([predictorModule, simulationModule]) => ({
      predictor: resolvePredictorModule(predictorModule),
      simulation: simulationModule,
    }));
  }

  return libraryPromise;
}

async function loadSimulationLibrary() {
  const [module] = await Promise.all([import('nmr-simulation'), ensureSparseMatrixCompatibility()]);
  return module;
}

async function ensureSparseMatrixCompatibility() {
  if (!sparseMatrixCompatibilityPromise) {
    sparseMatrixCompatibilityPromise = import('ml-sparse-matrix')
      .then((sparseMatrixModule) => {
        const sparseMatrix = resolveSparseMatrixConstructor(sparseMatrixModule);
        if (!sparseMatrix) {
          return;
        }

        const prototype = sparseMatrix.prototype;
        if (typeof prototype.isEmpty !== 'function') {
          prototype.isEmpty = function isEmpty() {
            return this.rows === 0 || this.columns === 0;
          };
        }
      })
      .catch((error) => {
        console.warn(
          'Sparse matrix compatibility patch for nmr-simulation could not be applied.',
          error,
        );
      });
  }

  return sparseMatrixCompatibilityPromise;
}

async function ensurePredictionDatabases(
  predictor: PredictorModule,
): Promise<DatabaseAvailability> {
  if (!databasePromise) {
    databasePromise = Promise.allSettled([
      typeof predictor.fetchProton === 'function'
        ? predictor.fetchProton()
        : Promise.reject(new Error('No proton DB loader')),
      typeof predictor.fetchCarbon === 'function'
        ? predictor.fetchCarbon()
        : Promise.reject(new Error('No carbon DB loader')),
    ]).then(([protonResult, carbonResult]) => ({
      proton: protonResult.status === 'fulfilled',
      carbon: carbonResult.status === 'fulfilled',
    }));
  }

  return databasePromise;
}

function resolvePredictorModule(module: PredictorNamespace): PredictorModule {
  const moduleAsPredictor = module as unknown as PredictorModule & { default?: PredictorModule };
  if (moduleAsPredictor.default && typeof moduleAsPredictor.default.spinus === 'function') {
    return moduleAsPredictor.default;
  }
  return moduleAsPredictor;
}

function resolveSparseMatrixConstructor(
  module: SparseMatrixModule,
): SparseMatrixConstructor | null {
  const moduleAsSparseMatrix = module as unknown as {
    default?: unknown;
  };

  if (typeof moduleAsSparseMatrix.default === 'function') {
    return moduleAsSparseMatrix.default as SparseMatrixConstructor;
  }

  if (typeof module === 'function') {
    return module as unknown as SparseMatrixConstructor;
  }

  return null;
}

function ensureBrowserNodeRuntimeShims() {
  const runtime = globalThis as typeof globalThis & {
    global?: typeof globalThis;
    process?: {
      env: Record<string, string>;
      pid: number;
      browser: boolean;
      version: string;
      versions: Record<string, string>;
      platform: string;
      noDeprecation: boolean;
      throwDeprecation: boolean;
      traceDeprecation: boolean;
      nextTick(callback: (...args: unknown[]) => void, ...args: unknown[]): void;
      emit(event: string, error?: unknown): boolean;
    };
  };

  if (!runtime.global) {
    runtime.global = runtime;
  }

  if (!runtime.process) {
    runtime.process = {
      env: {},
      pid: 1,
      browser: true,
      version: '',
      versions: {},
      platform: 'browser',
      noDeprecation: false,
      throwDeprecation: false,
      traceDeprecation: false,
      nextTick(callback, ...args) {
        queueMicrotask(() => callback(...args));
      },
      emit() {
        return false;
      },
    };
  }
}

function buildFallbackProtonSpectrum(
  predictions: PredictorEntry[],
  protonGroups: ProtonGroup[],
  simulation: SimulationModule,
  source: NmrSpectrum['source'],
  methodLabel: string,
  solvent: SolventProfile,
  warnings: string[],
  protonDisplay: ProtonDisplayModel,
) {
  try {
    return buildSimulatedProtonSpectrum(
      predictions,
      simulation,
      source,
      methodLabel,
      solvent,
      protonDisplay,
    );
  } catch (error) {
    console.warn('Estimated 1H spin simulation failed; falling back to a simple envelope.', error);
    warnings.push(
      'The 1H spin simulation could not be completed for this structure, so the proton trace is shown as a simplified envelope.',
    );
    return buildEstimatedSpectrum(protonGroupsToSignals(protonGroups, protonDisplay), {
      nucleus: '1H',
      source,
      methodLabel,
      frequencyMHz: solvent.protonFrequencyMHz,
      solvent: solvent.label,
      range: PROTON_RANGE,
      points: 2048,
      lineWidth: 0.07,
    });
  }
}

function buildSimulatedProtonSpectrum(
  predictions: PredictorEntry[],
  simulation: SimulationModule,
  source: NmrSpectrum['source'],
  methodLabel: string,
  solvent: SolventProfile,
  protonDisplay: ProtonDisplayModel,
): NmrSpectrum {
  const options = {
    frequency: solvent.protonFrequencyMHz,
    from: PROTON_RANGE.min,
    to: PROTON_RANGE.max,
    lineWidth: 0.6,
    nbPoints: 8192,
    maxClusterSize: 8,
    output: 'xy' as const,
  };
  const spinSystem = simulation.SpinSystem.fromPrediction(
    predictions as unknown as Array<Record<string, unknown>>,
  );
  spinSystem.ensureClusterSize(options);
  const spectrum = simulation.simulate1D(spinSystem, options);

  return {
    nucleus: '1H',
    source,
    methodLabel,
    frequencyMHz: solvent.protonFrequencyMHz,
    solvent: solvent.label,
    range: PROTON_RANGE,
    x: spectrum.x,
    y: normalizeSpectrum(spectrum.y),
    signals: buildDetailedSignalList(predictions, protonDisplay),
  };
}

function buildEstimatedSpectrum(
  signals: NmrSignal[],
  options: {
    nucleus: '1H' | '13C';
    source: NmrSpectrum['source'];
    methodLabel: string;
    frequencyMHz: number;
    solvent: string;
    range: { min: number; max: number };
    points: number;
    lineWidth: number;
  },
): NmrSpectrum {
  const x = createAxis(options.range.min, options.range.max, options.points);
  const y = x.map((ppm) =>
    signals.reduce(
      (sum, signal) => sum + signal.integral * lorentzian(ppm, signal.delta, options.lineWidth),
      0,
    ),
  );

  return {
    nucleus: options.nucleus,
    source: options.source,
    methodLabel: options.methodLabel,
    frequencyMHz: options.frequencyMHz,
    solvent: options.solvent,
    range: options.range,
    x,
    y: normalizeSpectrum(y),
    signals: [...signals].sort((left, right) => right.delta - left.delta),
  };
}

function hydrateProtonGroupsFromDatabase(
  groups: ProtonGroup[],
  protonProbe: EnhancedMolecule,
  predictor: PredictorModule,
  ocle: ReturnType<typeof getExtendedOcle>,
  solventId: NmrSolventId,
) {
  const prediction = predictor.proton(protonProbe as unknown as Record<string, unknown>, {
    OCLE: ocle,
    ignoreLabile: false,
    use: 'median',
    levels: [5, 4, 3, 2],
  });

  const protonDiaIds = protonProbe.getDiastereotopicAtomIDs().map((entry) => `${entry}`);
  const grouped = new Map<
    string,
    { deltaTotal: number; count: number; bestLevel: number; bestNcs: number }
  >();

  for (const entry of prediction) {
    const atomId = Number(entry.atomIDs[0]);
    if (!Number.isInteger(atomId) || atomId < 0 || atomId >= protonProbe.getAllAtoms()) {
      continue;
    }
    if (protonProbe.getAtomicNo(atomId) !== 1) {
      continue;
    }

    const diaId = entry.diaIDs?.[0] ?? protonDiaIds[atomId];
    if (!diaId || !Number.isFinite(entry.delta ?? NaN)) {
      continue;
    }

    const current = grouped.get(diaId);
    if (current) {
      current.deltaTotal += entry.delta ?? 0;
      current.count += 1;
      current.bestLevel = Math.max(current.bestLevel, entry.level ?? 0);
      current.bestNcs = Math.max(current.bestNcs, entry.ncs ?? 0);
    } else {
      grouped.set(diaId, {
        deltaTotal: entry.delta ?? 0,
        count: 1,
        bestLevel: entry.level ?? 0,
        bestNcs: entry.ncs ?? 0,
      });
    }
  }

  for (const group of groups) {
    const dbEntry = grouped.get(group.diaId);
    if (!dbEntry) {
      continue;
    }

    group.delta = applyProtonSolventCorrection(
      dbEntry.deltaTotal / Math.max(1, dbEntry.count),
      group.environment,
      solventId,
    );
    group.confidence = databaseConfidence(
      dbEntry.bestLevel,
      dbEntry.bestNcs,
      group.confidence ?? 0.44,
    );
  }
}

function hydrateCarbonGroupsFromDatabase(
  groups: CarbonGroup[],
  molecule: OclMolecule,
  predictor: PredictorModule,
  ocle: ReturnType<typeof getExtendedOcle>,
  solventId: NmrSolventId,
) {
  const prediction = predictor.carbon(molecule as unknown as Record<string, unknown>, {
    OCLE: ocle,
    use: 'median',
    levels: [5, 4, 3, 2],
  });

  const byAtom = new Map<number, PredictorEntry>();

  for (const entry of prediction) {
    const atomId = Number(entry.atomIDs[0]);
    if (!Number.isInteger(atomId) || !Number.isFinite(entry.delta ?? NaN)) {
      continue;
    }
    byAtom.set(atomId, entry);
  }

  for (const group of groups) {
    const dbEntry = byAtom.get(group.atomIndex);
    if (!dbEntry || !Number.isFinite(dbEntry.delta ?? NaN)) {
      continue;
    }

    group.delta = applyCarbonSolventCorrection(
      dbEntry.delta ?? group.delta,
      group.environment,
      solventId,
    );
    group.confidence = databaseConfidence(
      dbEntry.level ?? 0,
      dbEntry.ncs ?? 0,
      group.confidence ?? 0.42,
    );
  }
}

function adjustSpinusPredictionForSolvent(
  predictions: PredictorEntry[],
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  solventId: NmrSolventId,
) {
  const protonGroups = buildProtonGroups(molecule, protonProbe, solventId);
  const protonDiaIds = protonProbe.getDiastereotopicAtomIDs().map((entry) => `${entry}`);
  const environmentByDiaId = new Map<string, ProtonEnvironment>();

  for (const group of protonGroups) {
    environmentByDiaId.set(group.diaId, group.environment);
  }

  return predictions.map((prediction) => {
    const atomId = Number(prediction.atomIDs[0]);
    const diaId =
      prediction.diaIDs?.[0] ??
      (Number.isInteger(atomId) && atomId >= 0 && atomId < protonDiaIds.length
        ? protonDiaIds[atomId]
        : null);
    const environment = (diaId ? environmentByDiaId.get(diaId) : null) ?? 'alkyl';

    return {
      ...prediction,
      delta: Number.isFinite(prediction.delta ?? NaN)
        ? applyProtonSolventCorrection(prediction.delta ?? 0, environment, solventId)
        : prediction.delta,
    };
  });
}

function buildProtonGroups(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  solventId: NmrSolventId,
) {
  const groups: ProtonGroup[] = [];
  const protonDistanceMatrix = protonProbe.getConnectivityMatrix({ pathLength: true });

  for (const group of protonProbe.getGroupedDiastereotopicAtomIDs({ atomLabel: 'H' })) {
    const protonAtomIndices = group.atoms.filter(
      (atomIndex) => protonProbe.getAtomicNo(atomIndex) === 1,
    );
    if (protonAtomIndices.length === 0) {
      continue;
    }

    const hostAtomIndices = [
      ...new Set(
        protonAtomIndices
          .map((atomIndex) => protonProbe.getConnAtom(atomIndex, 0))
          .filter((atomIndex) => atomIndex >= 0),
      ),
    ];
    if (hostAtomIndices.length === 0) {
      continue;
    }

    const atomIndex = hostAtomIndices[0];
    const hydrogens = protonAtomIndices.length;
    const atomLabel = molecule.getAtomLabel(atomIndex);
    if (!['C', 'O', 'N', 'S'].includes(atomLabel)) {
      continue;
    }

    const environment = classifyProtonEnvironment(molecule, atomIndex);
    const baseDelta = estimateGroupProtonShift(molecule, protonProbe, {
      atomLabel,
      environment,
      hostAtomIndices,
      protonAtomIndices,
    });
    groups.push({
      id: `group_${group.oclID}`,
      atomIndex,
      hostAtomIndices,
      protonAtomIndices,
      diaId: group.oclID,
      atomLabel,
      atomIds: protonAtomIndices.map((protonAtomIndex) => `${protonAtomIndex}`),
      hydrogens,
      environment,
      delta: applyProtonSolventCorrection(baseDelta, environment, solventId),
      confidence: baseProtonConfidence(environment, atomLabel, solventId),
      couplingTargets: [],
    });
  }

  for (const group of groups) {
    group.couplingTargets = estimateCouplingTargets(
      molecule,
      protonProbe,
      group,
      groups,
      protonDistanceMatrix,
    );
  }

  return groups;
}

function buildCarbonGroups(molecule: OclMolecule, solventId: NmrSolventId) {
  const groups: CarbonGroup[] = [];

  for (let atomIndex = 0; atomIndex < molecule.getAllAtoms(); atomIndex += 1) {
    if (molecule.getAtomicNo(atomIndex) !== 6) {
      continue;
    }

    const environment = classifyCarbonEnvironment(molecule, atomIndex);
    groups.push({
      atomIndex,
      hydrogens: molecule.getAllHydrogens(atomIndex),
      environment,
      delta: applyCarbonSolventCorrection(
        estimateBaseCarbonShift(molecule, atomIndex, environment),
        environment,
        solventId,
      ),
      confidence: baseCarbonConfidence(environment),
    });
  }

  return groups;
}

function buildEstimatedPredictionEntries(groups: ProtonGroup[]): PredictorEntry[] {
  return groups.map((group) => ({
    atomIDs: [...group.atomIds],
    nbAtoms: group.hydrogens,
    delta: Number(group.delta.toFixed(3)),
    atomLabel: 'H',
    j: group.couplingTargets.flatMap((target) =>
      target.targetAtomIds.map((atomId) => ({
        assignment: [atomId],
        coupling: Number(target.coupling.toFixed(1)),
        multiplicity: 'd',
        distance: target.distance,
      })),
    ),
  }));
}

function buildDetailedSignalList(predictions: PredictorEntry[], protonDisplay: ProtonDisplayModel) {
  const grouped = new Map<
    string,
    {
      deltaTotal: number;
      count: number;
      integral: number;
      couplingConstants: number[];
      atomIds: string[];
    }
  >();

  for (const prediction of predictions) {
    if (!Number.isFinite(prediction.delta)) {
      continue;
    }

    const atomIds = prediction.atomIDs.map((atomId) => `${atomId}`);
    const key =
      prediction.diaIDs?.[0] ??
      atomIds
        .slice()
        .sort((left, right) => left.localeCompare(right))
        .join('_');
    const couplingConstants = (prediction.j ?? [])
      .map((coupling) => Number(coupling.coupling))
      .filter((value) => Number.isFinite(value) && value > 0)
      .map((value) => Number(value.toFixed(1)));
    const entry = grouped.get(key);

    if (entry) {
      entry.deltaTotal += prediction.delta ?? 0;
      entry.count += 1;
      entry.integral += Math.max(1, prediction.nbAtoms ?? atomIds.length);
      entry.couplingConstants.push(...couplingConstants);
      entry.atomIds.push(...atomIds);
    } else {
      grouped.set(key, {
        deltaTotal: prediction.delta ?? 0,
        count: 1,
        integral: Math.max(1, prediction.nbAtoms ?? atomIds.length),
        couplingConstants: [...couplingConstants],
        atomIds: [...atomIds],
      });
    }
  }

  return [...grouped.entries()]
    .map(([key, entry]): NmrSignal => {
      const normalizedCouplings = collapseCouplingConstants(entry.couplingConstants, entry.count);
      const atomKey = normalizeProtonAtomKey(entry.atomIds);
      const protonAssignment = protonDisplay.assignmentByKey.get(atomKey);
      return {
        id: `1H_${key}`,
        assignment: protonAssignment?.assignment ?? 'H',
        delta: Number((entry.deltaTotal / Math.max(1, entry.count)).toFixed(3)),
        integral: entry.integral,
        multiplicity: resolveMultiplicityFromGroups(normalizedCouplings),
        couplingConstants: normalizedCouplings.map((coupling) => coupling.value),
        atomIds: [...new Set(entry.atomIds)],
        confidence: normalizedCouplings.length > 0 ? 0.84 : 0.72,
      };
    })
    .sort((left, right) => right.delta - left.delta);
}

function protonGroupsToSignals(groups: ProtonGroup[], protonDisplay: ProtonDisplayModel) {
  return [...groups]
    .sort((left, right) => right.delta - left.delta)
    .map((group): NmrSignal => {
      const normalizedCouplings = collapseCouplingConstants(
        group.couplingTargets.flatMap((target) =>
          target.targetAtomIds.map(() => Number(target.coupling.toFixed(1))),
        ),
      );
      const protonAssignment = protonDisplay.assignmentByKey.get(
        normalizeProtonAtomKey(group.atomIds),
      );
      return {
        id: group.id,
        assignment: protonAssignment?.assignment ?? 'H',
        delta: Number(group.delta.toFixed(3)),
        integral: group.hydrogens,
        multiplicity:
          group.atomLabel === 'C' ? resolveMultiplicityFromGroups(normalizedCouplings) : 'br s',
        couplingConstants: normalizedCouplings.map((coupling) => coupling.value),
        atomIds: [...group.atomIds],
        confidence: group.confidence,
      };
    });
}

function carbonGroupsToSignals(groups: CarbonGroup[]) {
  return [...groups]
    .sort((left, right) => right.delta - left.delta)
    .map(
      (group, index): NmrSignal => ({
        id: `13C_${group.atomIndex}`,
        assignment: `C${index + 1}`,
        delta: Number(group.delta.toFixed(2)),
        integral: 1,
        multiplicity: carbonMultiplicityLabel(group.hydrogens),
        couplingConstants: [],
        atomIds: [`${group.atomIndex}`],
        confidence: group.confidence,
      }),
    );
}

function estimateCouplingTargets(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  source: ProtonGroup,
  groups: ProtonGroup[],
  protonDistanceMatrix: number[][],
) {
  if (source.atomLabel !== 'C') {
    return [];
  }

  const targets: CouplingTarget[] = [];

  for (const target of groups) {
    if (target.id === source.id || target.atomLabel !== 'C') {
      continue;
    }

    const protonDistance = getMinimumPathDistance(
      protonDistanceMatrix,
      source.protonAtomIndices,
      target.protonAtomIndices,
    );
    const coupling = estimateGroupCoupling(molecule, protonProbe, source, target, protonDistance);
    if (coupling === null) {
      continue;
    }

    targets.push({
      targetAtomIds: resolveCouplingTargetAtomIds(molecule, source, target),
      coupling,
      distance: protonDistance,
    });
  }

  return targets;
}

function estimateGroupCoupling(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  source: ProtonGroup,
  target: ProtonGroup,
  protonDistance: number,
) {
  if (protonDistance < 2 || protonDistance > 5) {
    return null;
  }

  const sourceAromatic = source.hostAtomIndices.some((atomIndex) =>
    molecule.isAromaticAtom(atomIndex),
  );
  const targetAromatic = target.hostAtomIndices.some((atomIndex) =>
    molecule.isAromaticAtom(atomIndex),
  );
  const sourceSp2 = source.hostAtomIndices.some((atomIndex) => hasPiCharacter(molecule, atomIndex));
  const targetSp2 = target.hostAtomIndices.some((atomIndex) => hasPiCharacter(molecule, atomIndex));
  const sameHost = source.hostAtomIndices.some((atomIndex) =>
    target.hostAtomIndices.includes(atomIndex),
  );

  if (sameHost) {
    return sourceSp2 || targetSp2 ? 2.1 : 13.4;
  }

  const explicitVinylicCoupling = estimateExplicitVinylicCoupling(
    molecule,
    protonProbe,
    source,
    target,
    protonDistance,
  );
  if (explicitVinylicCoupling !== null) {
    return explicitVinylicCoupling;
  }

  if (protonDistance >= 4 && sourceAromatic !== targetAromatic) {
    return null;
  }

  if (sourceAromatic && targetAromatic) {
    if (protonDistance === 3) {
      return 7.8;
    }
    if (protonDistance === 4) {
      return 1.8;
    }
    if (protonDistance === 5) {
      return 0.7;
    }
  }

  const directBondOrder = getMaximumBondOrderBetweenAtomSets(
    molecule,
    source.hostAtomIndices,
    target.hostAtomIndices,
  );

  if (protonDistance === 3) {
    if (directBondOrder === 2 || (sourceSp2 && targetSp2)) {
      return 10.6;
    }
    if (source.environment === 'aldehyde' || target.environment === 'aldehyde') {
      return 2.1;
    }
    if (source.environment === 'alphaHetero' || target.environment === 'alphaHetero') {
      return 6.1;
    }
    if (source.environment === 'benzylic' || target.environment === 'benzylic') {
      return 7;
    }
    return 7.2;
  }

  if (protonDistance === 4 && (sourceSp2 || targetSp2 || sourceAromatic || targetAromatic)) {
    return 1.6;
  }

  return null;
}

function classifyProtonEnvironment(molecule: OclMolecule, atomIndex: number): ProtonEnvironment {
  const atomLabel = molecule.getAtomLabel(atomIndex);
  const neighbours = getNeighbourAtoms(molecule, atomIndex);
  const heteroNeighbours = neighbours.filter((neighbour) => isHeteroAtom(molecule, neighbour.atom));
  const aromatic = molecule.isAromaticAtom(atomIndex);
  const hasDoubleBondToOxygen = neighbours.some(
    (neighbour) => molecule.getAtomicNo(neighbour.atom) === 8 && neighbour.order === 2,
  );
  const hasDoubleBond = neighbours.some((neighbour) => neighbour.order === 2);
  const hasTripleBond = neighbours.some((neighbour) => neighbour.order === 3);
  const alphaToCarbonyl = neighbours.some((neighbour) =>
    isCarbonylCarbon(molecule, neighbour.atom),
  );
  const benzylic = neighbours.some((neighbour) => molecule.isAromaticAtom(neighbour.atom));

  if (atomLabel === 'O') {
    return 'hydroxyl';
  }
  if (atomLabel === 'N') {
    return 'amine';
  }
  if (atomLabel === 'S') {
    return 'thiol';
  }
  if (hasDoubleBondToOxygen) {
    return 'aldehyde';
  }
  if (aromatic) {
    return 'aromatic';
  }
  if (hasTripleBond) {
    return 'terminalAlkyne';
  }
  if (hasDoubleBond) {
    return 'vinylic';
  }
  if (heteroNeighbours.length > 0) {
    return 'alphaHetero';
  }
  if (alphaToCarbonyl) {
    return 'alphaCarbonyl';
  }
  if (benzylic) {
    return 'benzylic';
  }
  if (neighbours.some((neighbour) => hasPiCharacter(molecule, neighbour.atom))) {
    return 'allylic';
  }
  return 'alkyl';
}

function classifyCarbonEnvironment(molecule: OclMolecule, atomIndex: number): CarbonEnvironment {
  const neighbours = getNeighbourAtoms(molecule, atomIndex);
  const heteroNeighbours = neighbours.filter((neighbour) => isHeteroAtom(molecule, neighbour.atom));
  const aromatic = molecule.isAromaticAtom(atomIndex);
  const hasDoubleBondToOxygen = neighbours.some(
    (neighbour) => molecule.getAtomicNo(neighbour.atom) === 8 && neighbour.order === 2,
  );
  const hasDoubleBond = neighbours.some((neighbour) => neighbour.order === 2);
  const hasTripleBond = neighbours.some((neighbour) => neighbour.order === 3);
  const alphaToCarbonyl = neighbours.some((neighbour) =>
    isCarbonylCarbon(molecule, neighbour.atom),
  );

  if (hasDoubleBondToOxygen) {
    return 'carbonyl';
  }
  if (hasTripleBond) {
    return 'alkyne';
  }
  if (aromatic) {
    return 'aromatic';
  }
  if (hasDoubleBond) {
    return 'alkene';
  }
  if (heteroNeighbours.length > 0) {
    return 'alphaHetero';
  }
  if (alphaToCarbonyl) {
    return 'alphaCarbonyl';
  }
  return 'alkyl';
}

function estimateBaseProtonShift(
  molecule: OclMolecule,
  atomIndex: number,
  environment: ProtonEnvironment,
) {
  const neighbours = getNeighbourAtoms(molecule, atomIndex);
  const hydrogens = molecule.getAllHydrogens(atomIndex);
  const heteroLabels = neighbours
    .filter((neighbour) => isHeteroAtom(molecule, neighbour.atom))
    .map((neighbour) => molecule.getAtomLabel(neighbour.atom));
  const alphaToCarbonyl = neighbours.some((neighbour) =>
    isCarbonylCarbon(molecule, neighbour.atom),
  );
  const benzylic = neighbours.some((neighbour) => molecule.isAromaticAtom(neighbour.atom));

  switch (environment) {
    case 'aldehyde':
      return 9.75;
    case 'aromatic':
      return 7.15 + heteroLabels.length * 0.35;
    case 'vinylic':
      return heteroLabels.length > 0 ? 5.9 : 5.35;
    case 'terminalAlkyne':
      return 2.45;
    case 'hydroxyl':
      return neighbours.some((neighbour) => molecule.getAtomicNo(neighbour.atom) === 6) ? 2.4 : 4.3;
    case 'amine':
      return neighbours.some((neighbour) => molecule.getAtomicNo(neighbour.atom) === 6) ? 3.2 : 1.7;
    case 'thiol':
      return 2.1;
    default: {
      let shift = 0.92;
      shift += heteroContribution(heteroLabels) * 0.065;
      shift += alphaToCarbonyl ? 1.1 : 0;
      shift += benzylic ? 1.2 : 0;
      shift += hydrogens === 1 ? 0.18 : hydrogens === 2 ? 0.08 : 0;
      if (environment === 'allylic') {
        shift += 0.65;
      }
      if (environment === 'benzylic') {
        shift += 0.25;
      }
      if (environment === 'alphaCarbonyl') {
        shift += 0.7;
      }
      return clamp(shift, 0.6, 6.4);
    }
  }
}

function estimateGroupProtonShift(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  group: Pick<ProtonGroup, 'atomLabel' | 'environment' | 'hostAtomIndices' | 'protonAtomIndices'>,
) {
  if (group.atomLabel !== 'C') {
    return estimateBaseProtonShift(molecule, group.hostAtomIndices[0], group.environment);
  }

  if (group.environment === 'aromatic') {
    const aromaticShifts = group.hostAtomIndices.map((atomIndex) =>
      estimateAromaticHostShift(molecule, atomIndex),
    );
    return averageValues(aromaticShifts, 7.15);
  }

  if (group.environment === 'vinylic') {
    return estimateVinylicGroupShift(
      molecule,
      protonProbe,
      group.hostAtomIndices,
      group.protonAtomIndices,
    );
  }

  const atomShifts = group.hostAtomIndices.map((atomIndex) =>
    estimateBaseProtonShift(molecule, atomIndex, group.environment),
  );
  return averageValues(
    atomShifts,
    estimateBaseProtonShift(molecule, group.hostAtomIndices[0], group.environment),
  );
}

function estimateAromaticHostShift(molecule: OclMolecule, atomIndex: number) {
  const ringAtoms = getAromaticSixMemberedRingAtoms(molecule, atomIndex);
  if (!ringAtoms) {
    return 7.15;
  }

  let shift = 7.15;
  for (const ringAtom of ringAtoms) {
    if (ringAtom === atomIndex) {
      continue;
    }

    const distance = getRingDistance(ringAtoms, atomIndex, ringAtom);
    if (distance <= 0 || distance > 3) {
      continue;
    }

    const substituentClasses = getAromaticSubstituentClasses(molecule, ringAtoms, ringAtom);
    for (const substituentClass of substituentClasses) {
      shift += aromaticSubstituentEffect(substituentClass, distance);
    }
  }

  return clamp(shift, 6.45, 8.55);
}

function estimateVinylicGroupShift(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  hostAtomIndices: number[],
  protonAtomIndices: number[],
) {
  const shifts = hostAtomIndices.map((hostAtomIndex, index) => {
    const protonAtomIndex =
      protonAtomIndices[Math.min(index, protonAtomIndices.length - 1)] ??
      protonAtomIndices[0] ??
      -1;
    return estimateVinylicHostShift(molecule, protonProbe, hostAtomIndex, protonAtomIndex);
  });

  return averageValues(shifts, 5.35);
}

function estimateVinylicHostShift(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  atomIndex: number,
  protonAtomIndex: number,
) {
  const partnerAtom = getVinylicPartnerAtom(molecule, atomIndex);
  if (partnerAtom === null) {
    return estimateBaseProtonShift(molecule, atomIndex, 'vinylic');
  }

  const atomHydrogens = molecule.getAllHydrogens(atomIndex);
  const partnerHydrogens = molecule.getAllHydrogens(partnerAtom);
  const hostClass = getPrimaryVinylicSubstituentClass(molecule, atomIndex, partnerAtom);
  const partnerClass = getPrimaryVinylicSubstituentClass(molecule, partnerAtom, atomIndex);

  if (atomHydrogens >= 2 && protonAtomIndex >= 0) {
    const oppositeSubstituent = getRepresentativeVinylicSubstituent(
      molecule,
      partnerAtom,
      atomIndex,
    );
    const relation =
      oppositeSubstituent === null
        ? null
        : classifyPointRelationshipAcrossDoubleBond(
            protonProbe,
            atomIndex,
            protonAtomIndex,
            partnerAtom,
            oppositeSubstituent,
          );
    return estimateTerminalVinylicMethyleneShift(partnerClass, relation);
  }

  if (atomHydrogens === 1) {
    return estimateSubstitutedVinylicMethineShift(hostClass, partnerClass, partnerHydrogens);
  }

  return estimateBaseProtonShift(molecule, atomIndex, 'vinylic');
}

function estimateExplicitVinylicCoupling(
  molecule: OclMolecule,
  protonProbe: EnhancedMolecule,
  source: ProtonGroup,
  target: ProtonGroup,
  protonDistance: number,
) {
  if (
    protonDistance !== 3 ||
    source.environment !== 'vinylic' ||
    target.environment !== 'vinylic'
  ) {
    return null;
  }

  if (source.hostAtomIndices.length !== 1 || target.hostAtomIndices.length !== 1) {
    return null;
  }

  if (source.protonAtomIndices.length !== 1 || target.protonAtomIndices.length !== 1) {
    return null;
  }

  const sourceHost = source.hostAtomIndices[0];
  const targetHost = target.hostAtomIndices[0];
  if (getBondOrderBetweenAtoms(molecule, sourceHost, targetHost) !== 2) {
    return null;
  }

  const relationship = classifyPointRelationshipAcrossDoubleBond(
    protonProbe,
    sourceHost,
    source.protonAtomIndices[0],
    targetHost,
    target.protonAtomIndices[0],
  );

  if (relationship === 'trans') {
    return 17.2;
  }
  if (relationship === 'cis') {
    return 10.6;
  }
  return 13.4;
}

function estimateBaseCarbonShift(
  molecule: OclMolecule,
  atomIndex: number,
  environment: CarbonEnvironment,
) {
  const neighbours = getNeighbourAtoms(molecule, atomIndex);
  const heteroNeighbours = neighbours.filter((neighbour) => isHeteroAtom(molecule, neighbour.atom));
  const carbonHydrogens = molecule.getAllHydrogens(atomIndex);
  const alphaToCarbonyl = neighbours.some((neighbour) =>
    isCarbonylCarbon(molecule, neighbour.atom),
  );

  switch (environment) {
    case 'carbonyl': {
      const hasHeteroSingleBond =
        heteroNeighbours.some((neighbour) => molecule.getAtomicNo(neighbour.atom) !== 8) ||
        neighbours.some(
          (neighbour) => molecule.getAtomicNo(neighbour.atom) === 8 && neighbour.order === 1,
        );
      return hasHeteroSingleBond ? 168 : carbonHydrogens > 0 ? 196 : 205;
    }
    case 'alkyne':
      return heteroNeighbours.length > 0 ? 84 : 73;
    case 'aromatic':
      return heteroNeighbours.length > 0
        ? 154 - carbonHydrogens * 8
        : carbonHydrogens > 0
          ? 128
          : 138;
    case 'alkene':
      return heteroNeighbours.length > 0
        ? carbonHydrogens > 0
          ? 116
          : 149
        : carbonHydrogens > 0
          ? 126
          : 138;
    default: {
      let shift = 18;
      shift += heteroContribution(
        heteroNeighbours.map((neighbour) => molecule.getAtomLabel(neighbour.atom)),
      );
      shift += alphaToCarbonyl ? 16 : 0;
      shift += Math.max(0, 3 - carbonHydrogens) * 5.5;
      shift +=
        neighbours.filter(
          (neighbour) => neighbour.order === 1 && molecule.getAtomicNo(neighbour.atom) === 6,
        ).length * 1.2;
      if (environment === 'alphaHetero') {
        shift += 8;
      }
      return clamp(shift, 5, 95);
    }
  }
}

function applyProtonSolventCorrection(
  delta: number,
  environment: ProtonEnvironment,
  solventId: NmrSolventId,
) {
  const solvent = SOLVENTS[solventId];
  return Number((delta + (solvent.protonOffsets[environment] ?? 0)).toFixed(3));
}

function applyCarbonSolventCorrection(
  delta: number,
  environment: CarbonEnvironment,
  solventId: NmrSolventId,
) {
  const solvent = SOLVENTS[solventId];
  return Number((delta + (solvent.carbonOffsets[environment] ?? 0)).toFixed(2));
}

function baseProtonConfidence(
  environment: ProtonEnvironment,
  atomLabel: string,
  solventId: NmrSolventId,
) {
  const base = atomLabel === 'C' ? 0.52 : 0.34;
  const solventPenalty = solventId === 'D2O' && atomLabel !== 'C' ? 0.1 : 0;
  const environmentBonus = environment === 'aromatic' || environment === 'aldehyde' ? 0.06 : 0;
  return clamp(base + environmentBonus - solventPenalty, 0.25, 0.72);
}

function baseCarbonConfidence(environment: CarbonEnvironment) {
  return clamp(environment === 'carbonyl' || environment === 'aromatic' ? 0.58 : 0.48, 0.4, 0.76);
}

function databaseConfidence(level: number, ncs: number, fallback: number) {
  const levelBonus = clamp(level / 12, 0, 0.2);
  const populationBonus = clamp(Math.log10(Math.max(1, ncs) + 1) * 0.1, 0, 0.16);
  return clamp(fallback + levelBonus + populationBonus, 0.35, 0.93);
}

function createProtonProbe(molecule: OclMolecule, ocle: ReturnType<typeof getExtendedOcle>) {
  const protonProbe = ocle.Molecule.fromMolfile(molecule.toMolfile());
  protonProbe.addImplicitHydrogens();
  protonProbe.ensureHelperArrays(ocle.Molecule.cHelperCIP);
  return protonProbe as EnhancedMolecule;
}

function getNeighbourAtoms(molecule: OclMolecule, atomIndex: number) {
  const neighbours: Array<{ atom: number; order: number }> = [];
  const neighbourCount = molecule.getAllConnAtoms(atomIndex);

  for (let neighbourIndex = 0; neighbourIndex < neighbourCount; neighbourIndex += 1) {
    neighbours.push({
      atom: molecule.getConnAtom(atomIndex, neighbourIndex),
      order: molecule.getConnBondOrder(atomIndex, neighbourIndex),
    });
  }

  return neighbours;
}

function getBondOrderBetweenAtoms(molecule: OclMolecule, atomA: number, atomB: number) {
  const neighbourCount = molecule.getAllConnAtoms(atomA);
  for (let neighbourIndex = 0; neighbourIndex < neighbourCount; neighbourIndex += 1) {
    if (molecule.getConnAtom(atomA, neighbourIndex) === atomB) {
      return molecule.getConnBondOrder(atomA, neighbourIndex);
    }
  }
  return 0;
}

function getMaximumBondOrderBetweenAtomSets(
  molecule: OclMolecule,
  leftAtoms: number[],
  rightAtoms: number[],
) {
  let maximumBondOrder = 0;

  for (const leftAtom of leftAtoms) {
    for (const rightAtom of rightAtoms) {
      maximumBondOrder = Math.max(
        maximumBondOrder,
        getBondOrderBetweenAtoms(molecule, leftAtom, rightAtom),
      );
    }
  }

  return maximumBondOrder;
}

function getMinimumPathDistance(matrix: number[][], leftAtoms: number[], rightAtoms: number[]) {
  let minimum = Number.POSITIVE_INFINITY;

  for (const leftAtom of leftAtoms) {
    for (const rightAtom of rightAtoms) {
      const distance = matrix[leftAtom]?.[rightAtom] ?? Number.POSITIVE_INFINITY;
      if (distance >= 0 && distance < minimum) {
        minimum = distance;
      }
    }
  }

  return Number.isFinite(minimum) ? minimum : -1;
}

function hasPiCharacter(molecule: OclMolecule, atomIndex: number) {
  if (molecule.isAromaticAtom(atomIndex)) {
    return true;
  }
  return getNeighbourAtoms(molecule, atomIndex).some((neighbour) => neighbour.order >= 2);
}

function isHeteroAtom(molecule: OclMolecule, atomIndex: number) {
  return ![1, 6].includes(molecule.getAtomicNo(atomIndex));
}

function isCarbonylCarbon(molecule: OclMolecule, atomIndex: number) {
  if (molecule.getAtomicNo(atomIndex) !== 6) {
    return false;
  }

  return getNeighbourAtoms(molecule, atomIndex).some(
    (neighbour) => molecule.getAtomicNo(neighbour.atom) === 8 && neighbour.order === 2,
  );
}

function heteroContribution(labels: string[]) {
  return labels.reduce((sum, label) => {
    switch (label) {
      case 'O':
        return sum + 34;
      case 'N':
        return sum + 22;
      case 'S':
        return sum + 14;
      case 'F':
      case 'Cl':
      case 'Br':
      case 'I':
        return sum + 18;
      default:
        return sum + 12;
    }
  }, 0);
}

function getAromaticSixMemberedRingAtoms(molecule: OclMolecule, atomIndex: number) {
  const ringSet = molecule.getRingSet();
  for (let ringIndex = 0; ringIndex < ringSet.getSize(); ringIndex += 1) {
    if (!ringSet.isAromatic(ringIndex) || ringSet.getRingSize(ringIndex) !== 6) {
      continue;
    }

    const ringAtoms = ringSet.getRingAtoms(ringIndex);
    if (ringAtoms.includes(atomIndex)) {
      return ringAtoms;
    }
  }

  return null;
}

function getRingDistance(ringAtoms: number[], atomA: number, atomB: number) {
  const indexA = ringAtoms.indexOf(atomA);
  const indexB = ringAtoms.indexOf(atomB);
  if (indexA < 0 || indexB < 0) {
    return -1;
  }

  const directDistance = Math.abs(indexA - indexB);
  return Math.min(directDistance, ringAtoms.length - directDistance);
}

function getAromaticSubstituentClasses(
  molecule: OclMolecule,
  ringAtoms: number[],
  ringAtom: number,
) {
  return getNeighbourAtoms(molecule, ringAtom)
    .filter(
      (neighbour) =>
        !ringAtoms.includes(neighbour.atom) && molecule.getAtomicNo(neighbour.atom) !== 1,
    )
    .map((neighbour) => classifyAromaticSubstituent(molecule, neighbour.atom));
}

function classifyAromaticSubstituent(
  molecule: OclMolecule,
  atomIndex: number,
): AromaticSubstituentClass {
  const atomicNumber = molecule.getAtomicNo(atomIndex);
  if (atomicNumber === 7 && isNitroLikeAtom(molecule, atomIndex)) {
    return 'strongWithdrawer';
  }
  if (atomicNumber === 7) {
    return 'aminoDonor';
  }
  if ([8, 16, 15].includes(atomicNumber)) {
    return 'strongDonor';
  }
  if ([9, 17, 35, 53].includes(atomicNumber)) {
    return 'weakWithdrawer';
  }
  if (atomicNumber === 6) {
    if (
      isCarbonylCarbon(molecule, atomIndex) ||
      hasStronglyElectronWithdrawingNeighbour(molecule, atomIndex)
    ) {
      return 'strongWithdrawer';
    }
    return hasPiCharacter(molecule, atomIndex) ? 'weakWithdrawer' : 'weakDonor';
  }
  return 'weakWithdrawer';
}

function aromaticSubstituentEffect(
  substituentClass: AromaticSubstituentClass,
  ringDistance: number,
) {
  switch (substituentClass) {
    case 'aminoDonor':
      return ringDistance === 1 ? -0.36 : ringDistance === 2 ? 0.02 : -0.42;
    case 'strongDonor':
      return ringDistance === 1 ? -0.24 : ringDistance === 2 ? 0.12 : -0.26;
    case 'weakDonor':
      return ringDistance === 1 ? 0.02 : ringDistance === 2 ? -0.03 : -0.08;
    case 'weakWithdrawer':
      return ringDistance === 1 ? 0.16 : ringDistance === 2 ? 0.05 : 0.09;
    case 'strongWithdrawer':
      return ringDistance === 1 ? 0.4 : ringDistance === 2 ? 0.11 : 0.2;
    default:
      return 0;
  }
}

function getVinylicPartnerAtom(molecule: OclMolecule, atomIndex: number) {
  for (const neighbour of getNeighbourAtoms(molecule, atomIndex)) {
    if (neighbour.order === 2 && molecule.getAtomicNo(neighbour.atom) === 6) {
      return neighbour.atom;
    }
  }
  return null;
}

function resolveCouplingTargetAtomIds(
  molecule: OclMolecule,
  source: ProtonGroup,
  target: ProtonGroup,
) {
  if (shouldCollapseParaDisubstitutedAromaticCoupling(molecule, source, target)) {
    return target.atomIds.slice(0, 1);
  }

  return [...target.atomIds];
}

function shouldCollapseParaDisubstitutedAromaticCoupling(
  molecule: OclMolecule,
  source: ProtonGroup,
  target: ProtonGroup,
) {
  if (source.environment !== 'aromatic' || target.environment !== 'aromatic') {
    return false;
  }
  if (source.hydrogens !== 2 || target.hydrogens !== 2) {
    return false;
  }

  const ringAtoms = getSharedAromaticSixMemberedRingAtoms(
    molecule,
    source.hostAtomIndices,
    target.hostAtomIndices,
  );
  if (!ringAtoms) {
    return false;
  }

  const substituentAtoms = getRingSubstituentAtoms(molecule, ringAtoms);
  return (
    substituentAtoms.length === 2 &&
    getRingDistance(ringAtoms, substituentAtoms[0], substituentAtoms[1]) === 3
  );
}

function getSharedAromaticSixMemberedRingAtoms(
  molecule: OclMolecule,
  leftAtoms: number[],
  rightAtoms: number[],
) {
  const candidateAtoms = [...new Set([...leftAtoms, ...rightAtoms])];
  if (candidateAtoms.length === 0) {
    return null;
  }

  const ringSet = molecule.getRingSet();
  for (let ringIndex = 0; ringIndex < ringSet.getSize(); ringIndex += 1) {
    if (!ringSet.isAromatic(ringIndex) || ringSet.getRingSize(ringIndex) !== 6) {
      continue;
    }

    const ringAtoms = ringSet.getRingAtoms(ringIndex);
    if (candidateAtoms.every((atomIndex) => ringAtoms.includes(atomIndex))) {
      return ringAtoms;
    }
  }

  return null;
}

function getRingSubstituentAtoms(molecule: OclMolecule, ringAtoms: number[]) {
  return ringAtoms.filter((ringAtom) =>
    getNeighbourAtoms(molecule, ringAtom).some(
      (neighbour) =>
        !ringAtoms.includes(neighbour.atom) && molecule.getAtomicNo(neighbour.atom) !== 1,
    ),
  );
}

function getRepresentativeVinylicSubstituent(
  molecule: OclMolecule,
  atomIndex: number,
  excludeAtom: number,
) {
  const substituents = getNeighbourAtoms(molecule, atomIndex)
    .filter(
      (neighbour) => neighbour.atom !== excludeAtom && molecule.getAtomicNo(neighbour.atom) !== 1,
    )
    .sort(
      (left, right) =>
        getVinylicSubstituentPriority(molecule, right.atom) -
        getVinylicSubstituentPriority(molecule, left.atom),
    );

  return substituents[0]?.atom ?? null;
}

function getPrimaryVinylicSubstituentClass(
  molecule: OclMolecule,
  atomIndex: number,
  excludeAtom: number,
): VinylicSubstituentClass {
  const representative = getRepresentativeVinylicSubstituent(molecule, atomIndex, excludeAtom);
  return representative === null ? 'none' : classifyVinylicSubstituent(molecule, representative);
}

function classifyVinylicSubstituent(
  molecule: OclMolecule,
  atomIndex: number,
): VinylicSubstituentClass {
  const atomicNumber = molecule.getAtomicNo(atomIndex);
  if ([8, 7, 16, 15].includes(atomicNumber)) {
    return 'heteroDonor';
  }
  if ([9, 17, 35, 53].includes(atomicNumber)) {
    return 'halogen';
  }
  if (atomicNumber === 6) {
    if (molecule.isAromaticAtom(atomIndex)) {
      return 'aryl';
    }
    if (
      isCarbonylCarbon(molecule, atomIndex) ||
      hasStronglyElectronWithdrawingNeighbour(molecule, atomIndex)
    ) {
      return 'carbonyl';
    }
    return hasPiCharacter(molecule, atomIndex) ? 'vinyl' : 'alkyl';
  }
  return 'alkyl';
}

function getVinylicSubstituentPriority(molecule: OclMolecule, atomIndex: number) {
  switch (classifyVinylicSubstituent(molecule, atomIndex)) {
    case 'carbonyl':
      return 6;
    case 'heteroDonor':
      return 5;
    case 'aryl':
      return 4;
    case 'halogen':
      return 3;
    case 'vinyl':
      return 2;
    case 'alkyl':
      return 1;
    default:
      return 0;
  }
}

function estimateTerminalVinylicMethyleneShift(
  substituentClass: VinylicSubstituentClass,
  relationship: 'cis' | 'trans' | null,
) {
  const lookup = {
    none: { cis: 4.85, trans: 5.05, average: 4.95 },
    alkyl: { cis: 4.93, trans: 5.12, average: 5.03 },
    aryl: { cis: 5.23, trans: 5.68, average: 5.45 },
    heteroDonor: { cis: 4.18, trans: 4.56, average: 4.37 },
    halogen: { cis: 5.18, trans: 5.52, average: 5.35 },
    carbonyl: { cis: 5.82, trans: 6.34, average: 6.08 },
    vinyl: { cis: 5.08, trans: 5.36, average: 5.22 },
  } satisfies Record<VinylicSubstituentClass, { cis: number; trans: number; average: number }>;

  const selected = lookup[substituentClass];
  if (relationship === 'cis') {
    return selected.cis;
  }
  if (relationship === 'trans') {
    return selected.trans;
  }
  return selected.average;
}

function estimateSubstitutedVinylicMethineShift(
  hostClass: VinylicSubstituentClass,
  partnerClass: VinylicSubstituentClass,
  partnerHydrogens: number,
) {
  let shift = 5.45;
  shift += sameSideVinylicShiftContribution(hostClass);
  shift += oppositeSideVinylicShiftContribution(partnerClass);
  shift += partnerHydrogens >= 2 ? 0.12 : 0;
  return clamp(shift, 5.0, 7.1);
}

function sameSideVinylicShiftContribution(substituentClass: VinylicSubstituentClass) {
  switch (substituentClass) {
    case 'aryl':
      return 1.05;
    case 'heteroDonor':
      return 0.85;
    case 'carbonyl':
      return 0.72;
    case 'halogen':
      return 0.34;
    case 'alkyl':
      return 0.26;
    case 'vinyl':
      return 0.42;
    default:
      return 0;
  }
}

function oppositeSideVinylicShiftContribution(substituentClass: VinylicSubstituentClass) {
  switch (substituentClass) {
    case 'aryl':
      return 0.12;
    case 'heteroDonor':
      return 0.08;
    case 'carbonyl':
      return 0.14;
    case 'halogen':
      return 0.06;
    case 'vinyl':
      return 0.08;
    default:
      return 0;
  }
}

function classifyPointRelationshipAcrossDoubleBond(
  molecule: EnhancedMolecule,
  atomA: number,
  pointA: number,
  atomB: number,
  pointB: number,
) {
  const axisX = molecule.getAtomX(atomB) - molecule.getAtomX(atomA);
  const axisY = molecule.getAtomY(atomB) - molecule.getAtomY(atomA);
  const pointASide =
    axisX * (molecule.getAtomY(pointA) - molecule.getAtomY(atomA)) -
    axisY * (molecule.getAtomX(pointA) - molecule.getAtomX(atomA));
  const pointBSide =
    axisX * (molecule.getAtomY(pointB) - molecule.getAtomY(atomA)) -
    axisY * (molecule.getAtomX(pointB) - molecule.getAtomX(atomA));

  if (Math.abs(pointASide) < 0.0001 || Math.abs(pointBSide) < 0.0001) {
    return null;
  }

  return Math.sign(pointASide) === Math.sign(pointBSide) ? 'cis' : 'trans';
}

function hasStronglyElectronWithdrawingNeighbour(molecule: OclMolecule, atomIndex: number) {
  return getNeighbourAtoms(molecule, atomIndex).some((neighbour) => {
    const atomicNumber = molecule.getAtomicNo(neighbour.atom);
    return [7, 8, 9, 15, 16, 17, 35, 53].includes(atomicNumber) && neighbour.order >= 2;
  });
}

function isNitroLikeAtom(molecule: OclMolecule, atomIndex: number) {
  if (molecule.getAtomicNo(atomIndex) !== 7) {
    return false;
  }

  const oxygenNeighbours = getNeighbourAtoms(molecule, atomIndex).filter(
    (neighbour) => molecule.getAtomicNo(neighbour.atom) === 8,
  );
  const oxygenBondOrderTotal = oxygenNeighbours.reduce(
    (sum, neighbour) => sum + neighbour.order,
    0,
  );

  return oxygenNeighbours.length >= 2 && oxygenBondOrderTotal >= 3;
}

function averageValues(values: number[], fallback: number) {
  if (values.length === 0) {
    return fallback;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function carbonMultiplicityLabel(hydrogens: number) {
  if (hydrogens === 0) {
    return 'Cq';
  }
  if (hydrogens === 1) {
    return 'CH';
  }
  if (hydrogens === 2) {
    return 'CH2';
  }
  return 'CH3';
}

function collapseCouplingConstants(values: number[], sourceSampleCount = 1) {
  const grouped: Array<{ value: number; rawCount: number }> = [];

  for (const value of [...values].sort((left, right) => right - left)) {
    const normalized = Number(value.toFixed(1));
    const existing = grouped.find((entry) => Math.abs(entry.value - normalized) <= 0.15);
    if (existing) {
      existing.rawCount += 1;
    } else {
      grouped.push({ value: normalized, rawCount: 1 });
    }
  }

  return grouped.map((entry) => ({
    value: entry.value,
    count: Math.max(1, Math.round(entry.rawCount / Math.max(1, sourceSampleCount))),
  }));
}

function resolveMultiplicityFromGroups(groups: Array<{ value: number; count: number }>) {
  if (groups.length === 0) {
    return 's';
  }

  if (groups.length === 1) {
    return multiplicityFromCount(groups[0].count);
  }

  if (groups.length === 2) {
    const first = multiplicityCode(groups[0].count);
    const second = multiplicityCode(groups[1].count);
    return first && second ? `${first}${second}` : 'm';
  }

  if (groups.length === 3 && groups.every((group) => group.count === 1)) {
    return 'ddd';
  }

  return 'm';
}

function multiplicityFromCount(count: number) {
  switch (count) {
    case 1:
      return 'd';
    case 2:
      return 't';
    case 3:
      return 'q';
    case 4:
      return 'quint';
    case 5:
      return 'sext';
    case 6:
      return 'sept';
    case 7:
      return 'oct';
    default:
      return 'm';
  }
}

function multiplicityCode(count: number) {
  switch (count) {
    case 1:
      return 'd';
    case 2:
      return 't';
    case 3:
      return 'q';
    default:
      return null;
  }
}

function createAxis(min: number, max: number, points: number) {
  const step = (max - min) / Math.max(1, points - 1);
  return Array.from({ length: points }, (_, index) => min + step * index);
}

function lorentzian(x: number, center: number, lineWidth: number) {
  const gamma = lineWidth / 2;
  return (gamma * gamma) / ((x - center) * (x - center) + gamma * gamma);
}

function normalizeSpectrum(values: number[]) {
  const max = Math.max(...values, 0);
  if (max === 0) {
    return values.map(() => 0);
  }
  return values.map((value) => value / max);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error('Timed out while contacting the prediction service.'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
