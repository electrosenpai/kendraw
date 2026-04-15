import {
  buildProtonDisplayModel,
  normalizeProtonAtomKey,
  type ProtonDisplayModel,
} from './proton-numbering';
import type {
  ChemicalDocument,
  ChemicalInsights,
  NmrPredictionResult,
  NmrSignal,
  NmrSpectrum,
  NmrSolventId,
} from './types';

interface AnalyticalExportOptions {
  document: ChemicalDocument;
  insights: ChemicalInsights;
  prediction: NmrPredictionResult;
  solvent: NmrSolventId;
  generatedAt?: Date;
}

interface SpectrumCsvExportOptions {
  document: ChemicalDocument;
  spectrum: NmrSpectrum | null;
  generatedAt?: Date;
}

export function createAnalyticalJsonExport(options: AnalyticalExportOptions) {
  const generatedAt = (options.generatedAt ?? new Date()).toISOString();
  const protonDisplay = safeBuildProtonDisplayModel(options.document);

  const payload = {
    schemaVersion: 1,
    generatedAt,
    solvent: options.solvent,
    document: {
      id: options.document.id,
      name: options.document.name,
      createdAt: options.document.createdAt,
      chemcanvas: options.document,
    },
    insights: {
      ...options.insights,
      adducts: options.insights.adducts.map((adduct) => ({
        ...adduct,
        mz: Number(adduct.mz.toFixed(4)),
      })),
      elementalAnalysis: options.insights.elementalAnalysis.map((entry) => ({
        ...entry,
        percent: Number(entry.percent.toFixed(2)),
      })),
    },
    nmr: {
      status: options.prediction.status,
      updatedAt: options.prediction.updatedAt,
      warnings: [...options.prediction.warnings],
      error: options.prediction.error,
      proton: serializeSpectrum(options.prediction.proton, protonDisplay),
      carbon: serializeSpectrum(options.prediction.carbon, protonDisplay),
    },
  };

  return JSON.stringify(payload, null, 2);
}

export function createSpectrumCsvExport(options: SpectrumCsvExportOptions) {
  const protonDisplay = safeBuildProtonDisplayModel(options.document);
  const headers = [
    'assignment',
    'nucleus',
    'shift_ppm',
    'multiplicity',
    'integral',
    'coupling_constants_hz',
    'confidence_percent',
    'atom_ids',
    'solvent',
    'frequency_mhz',
    'method_label',
    'source',
    'generated_at',
  ];

  if (!options.spectrum || options.spectrum.signals.length === 0) {
    return `${headers.join(',')}\n`;
  }

  const generatedAt = (options.generatedAt ?? new Date()).toISOString();
  const rows = options.spectrum.signals.map((signal) => {
    const assignment = resolveSignalAssignment(
      signal,
      options.spectrum?.nucleus ?? '1H',
      protonDisplay,
    );
    return [
      assignment,
      options.spectrum?.nucleus ?? '',
      signal.delta.toFixed(options.spectrum?.nucleus === '1H' ? 3 : 2),
      signal.multiplicity,
      options.spectrum?.nucleus === '1H' ? `${signal.integral}H` : '1C',
      signal.couplingConstants.length > 0
        ? signal.couplingConstants.map((value) => value.toFixed(1)).join('; ')
        : '',
      signal.confidence !== null ? `${Math.round(signal.confidence * 100)}` : '',
      signal.atomIds.join(';'),
      options.spectrum?.solvent ?? '',
      options.spectrum?.frequencyMHz.toFixed(2) ?? '',
      options.spectrum?.methodLabel ?? '',
      options.spectrum?.source ?? '',
      generatedAt,
    ]
      .map(escapeCsvField)
      .join(',');
  });

  return `${headers.join(',')}\n${rows.join('\n')}\n`;
}

function serializeSpectrum(spectrum: NmrSpectrum | null, protonDisplay: ProtonDisplayModel | null) {
  if (!spectrum) {
    return null;
  }

  return {
    nucleus: spectrum.nucleus,
    source: spectrum.source,
    methodLabel: spectrum.methodLabel,
    frequencyMHz: spectrum.frequencyMHz,
    solvent: spectrum.solvent,
    range: {
      min: spectrum.range.min,
      max: spectrum.range.max,
    },
    signalCount: spectrum.signals.length,
    signals: spectrum.signals.map((signal) => ({
      ...signal,
      assignment: resolveSignalAssignment(signal, spectrum.nucleus, protonDisplay),
      couplingConstants: signal.couplingConstants.map((value) => Number(value.toFixed(1))),
      confidence: signal.confidence !== null ? Number(signal.confidence.toFixed(4)) : null,
    })),
    plot: {
      x: spectrum.x.map((value) => Number(value.toFixed(spectrum.nucleus === '1H' ? 4 : 3))),
      y: spectrum.y.map((value) => Number(value.toFixed(6))),
    },
  };
}

function resolveSignalAssignment(
  signal: NmrSignal,
  nucleus: '1H' | '13C',
  protonDisplay: ProtonDisplayModel | null,
) {
  if (nucleus === '13C') {
    return signal.assignment;
  }

  const mapped = protonDisplay?.assignmentByKey.get(normalizeProtonAtomKey(signal.atomIds));
  return mapped?.assignment ?? signal.assignment;
}

function safeBuildProtonDisplayModel(document: ChemicalDocument) {
  try {
    return buildProtonDisplayModel(document);
  } catch {
    return null;
  }
}

function escapeCsvField(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
