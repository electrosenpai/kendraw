import { describe, expect, it } from 'vitest';
import { predictNmrSpectra } from './nmr';
import { calculateChemicalInsights, createExampleDocument } from './ocl';
import { NMR_BENCHMARK_FIXTURES, type NmrBenchmarkSignal } from './nmr.benchmark.fixtures';
import type { NmrSignal } from './types';

describe('NMR proton benchmark (deterministic local mode)', () => {
  for (const fixture of NMR_BENCHMARK_FIXTURES) {
    it(fixture.name, async () => {
      const document = createExampleDocument(fixture.smiles, fixture.name);
      const prediction = await predictNmrSpectra(document, {
        solvent: fixture.solvent,
        mode: 'local',
      });

      expect(prediction.status).toBe('ready');
      expect(prediction.error).toBeNull();
      expect(prediction.proton).not.toBeNull();
      expect(containsSimplifiedEnvelopeWarning(prediction.warnings)).toBe(false);

      const protonSpectrum = prediction.proton!;
      expect(protonSpectrum.nucleus).toBe('1H');

      const remainingSignals = [...protonSpectrum.signals];
      for (const expectedSignal of fixture.expectedSignals) {
        const matchIndex = remainingSignals.findIndex((signal) =>
          matchesExpectedSignal(signal, expectedSignal),
        );
        expect(
          matchIndex,
          formatAvailableSignals(fixture.name, remainingSignals, expectedSignal),
        ).toBeGreaterThanOrEqual(0);

        if (matchIndex >= 0) {
          remainingSignals.splice(matchIndex, 1);
        }
      }
    });
  }
});

describe('NMR local simulation fidelity', () => {
  it('renders resolved ethanol splitting instead of a simplified envelope', async () => {
    const prediction = await predictNmrSpectra(createExampleDocument('CCO', 'Ethanol'), {
      solvent: 'CDCl3',
      mode: 'local',
    });

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(containsSimplifiedEnvelopeWarning(prediction.warnings)).toBe(false);
    expect(prediction.proton).not.toBeNull();

    const protonSpectrum = prediction.proton!;
    const methylSignal = protonSpectrum.signals.find(
      (signal) => signal.integral === 3 && signal.multiplicity === 't',
    );
    const methyleneSignal = protonSpectrum.signals.find(
      (signal) => signal.integral === 2 && signal.multiplicity === 'q',
    );

    expect(methylSignal).toBeDefined();
    expect(methyleneSignal).toBeDefined();

    expect(countResolvedPeaks(protonSpectrum, methylSignal!.delta, 0.05)).toBe(3);
    expect(countResolvedPeaks(protonSpectrum, methyleneSignal!.delta, 0.06)).toBe(4);
  });

  it('preserves aromatic valence while predicting ethylbenzene locally', async () => {
    const document = createExampleDocument('CCc1ccccc1', 'Ethylbenzene');

    expect(calculateChemicalInsights(document).formula).toBe('C8H10');

    const prediction = await predictNmrSpectra(document, {
      solvent: 'CDCl3',
      mode: 'local',
    });

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(containsSimplifiedEnvelopeWarning(prediction.warnings)).toBe(false);
    expect(prediction.proton).not.toBeNull();
    expect(prediction.proton!.signals.reduce((total, signal) => total + signal.integral, 0)).toBe(
      10,
    );
  });

  it('keeps the toluene methyl as a singlet and spreads the aromatic envelope', async () => {
    const prediction = await predictNmrSpectra(createExampleDocument('Cc1ccccc1', 'Toluene'), {
      solvent: 'CDCl3',
      mode: 'local',
    });

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const protonSpectrum = prediction.proton!;
    const methylSignal = protonSpectrum.signals.find(
      (signal) => signal.integral === 3 && signal.delta >= 2.1 && signal.delta <= 2.6,
    );
    expect(methylSignal?.multiplicity).toBe('s');

    const aromaticSignals = protonSpectrum.signals
      .filter((signal) => signal.delta >= 6.8 && signal.delta <= 7.3)
      .map((signal) => signal.delta)
      .sort((left, right) => left - right);

    expect(aromaticSignals.length).toBeGreaterThanOrEqual(3);
    expect((aromaticSignals.at(-1) ?? 0) - (aromaticSignals[0] ?? 0)).toBeGreaterThan(0.08);
  });

  it('models anisole donor-driven aromatic shielding', async () => {
    const prediction = await predictNmrSpectra(createExampleDocument('COc1ccccc1', 'Anisole'), {
      solvent: 'CDCl3',
      mode: 'local',
    });

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const protonSpectrum = prediction.proton!;
    expect(
      protonSpectrum.signals.some(
        (signal) => signal.integral === 2 && signal.delta >= 6.8 && signal.delta <= 7.0,
      ),
    ).toBe(true);
    expect(
      protonSpectrum.signals.some(
        (signal) => signal.integral === 2 && signal.delta >= 7.2 && signal.delta <= 7.35,
      ),
    ).toBe(true);
  });

  it('distinguishes cis and trans vinylic couplings in styrene', async () => {
    const prediction = await predictNmrSpectra(createExampleDocument('C=Cc1ccccc1', 'Styrene'), {
      solvent: 'CDCl3',
      mode: 'local',
    });

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const vinylicSignals = prediction.proton!.signals.filter(
      (signal) => signal.delta >= 5 && signal.delta <= 6.8,
    );
    expect(vinylicSignals.length).toBeGreaterThanOrEqual(3);
    expect(vinylicSignals.some((signal) => hasCouplingNear(signal, 17.2, 0.7))).toBe(true);
    expect(vinylicSignals.some((signal) => hasCouplingNear(signal, 10.6, 0.5))).toBe(true);
    expect(
      vinylicSignals.some(
        (signal) => signal.delta >= 6.45 && signal.delta <= 6.75 && signal.multiplicity === 'dd',
      ),
    ).toBe(true);
  });

  it('places vinyl acetate terminal alkene protons in distinct activated-vinyl windows', async () => {
    const prediction = await predictNmrSpectra(
      createExampleDocument('CC(=O)OC=C', 'Vinyl acetate'),
      {
        solvent: 'CDCl3',
        mode: 'local',
      },
    );

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const vinylicSignals = prediction.proton!.signals.filter(
      (signal) => signal.delta >= 4 && signal.delta <= 6.6,
    );
    expect(
      vinylicSignals.some(
        (signal) =>
          signal.delta >= 6.2 &&
          signal.delta <= 6.55 &&
          hasCouplingNear(signal, 17.2, 0.7) &&
          hasCouplingNear(signal, 10.6, 0.5),
      ),
    ).toBe(true);
    expect(vinylicSignals.some((signal) => signal.delta >= 4.45 && signal.delta <= 4.7)).toBe(true);
    expect(vinylicSignals.some((signal) => signal.delta >= 4.05 && signal.delta <= 4.3)).toBe(true);
  });

  it('renders para-ethylanisole as two aromatic doublets with separated donor-driven shifts', async () => {
    const prediction = await predictNmrSpectra(
      createExampleDocument('CCc1ccc(OC)cc1', 'p-Ethylanisole'),
      {
        solvent: 'CDCl3',
        mode: 'local',
      },
    );

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const aromaticSignals = prediction.proton!.signals.filter(
      (signal) => signal.integral === 2 && signal.delta >= 6.7 && signal.delta <= 7.4,
    );
    expect(aromaticSignals).toHaveLength(2);
    expect(aromaticSignals.every((signal) => signal.multiplicity === 'd')).toBe(true);
    expect(aromaticSignals.some((signal) => signal.delta >= 7.2 && signal.delta <= 7.35)).toBe(
      true,
    );
    expect(aromaticSignals.some((signal) => signal.delta >= 6.8 && signal.delta <= 6.95)).toBe(
      true,
    );
  });

  it('renders para-nitroanisole as a donor-acceptor aromatic doublet pair', async () => {
    const prediction = await predictNmrSpectra(
      createExampleDocument('COc1ccc([N+](=O)[O-])cc1', 'p-Nitroanisole'),
      {
        solvent: 'CDCl3',
        mode: 'local',
      },
    );

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const aromaticSignals = prediction.proton!.signals.filter(
      (signal) => signal.integral === 2 && signal.delta >= 6.8 && signal.delta <= 7.8,
    );
    expect(aromaticSignals).toHaveLength(2);
    expect(aromaticSignals.every((signal) => signal.multiplicity === 'd')).toBe(true);
    expect(aromaticSignals.some((signal) => signal.delta >= 7.55 && signal.delta <= 7.75)).toBe(
      true,
    );
    expect(aromaticSignals.some((signal) => signal.delta >= 6.95 && signal.delta <= 7.1)).toBe(
      true,
    );
  });

  it('keeps ortho-anisidine in a compact donor-rich aromatic window', async () => {
    const prediction = await predictNmrSpectra(
      createExampleDocument('COc1ccccc1N', 'o-Anisidine'),
      {
        solvent: 'CDCl3',
        mode: 'local',
      },
    );

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const aromaticSignals = prediction.proton!.signals.filter(
      (signal) => signal.integral === 1 && signal.delta >= 6.8 && signal.delta <= 7.0,
    );
    const deltas = aromaticSignals
      .map((signal) => signal.delta)
      .sort((left, right) => left - right);

    expect(aromaticSignals).toHaveLength(4);
    expect(deltas[0]).toBeGreaterThanOrEqual(6.84);
    expect(deltas.at(-1) ?? 0).toBeLessThanOrEqual(6.94);
  });

  it('renders meta-anisidine with one downfield aromatic proton and three strongly shielded ones', async () => {
    const prediction = await predictNmrSpectra(
      createExampleDocument('COc1cccc(N)c1', 'm-Anisidine'),
      {
        solvent: 'CDCl3',
        mode: 'local',
      },
    );

    expect(prediction.status).toBe('ready');
    expect(prediction.error).toBeNull();
    expect(prediction.proton).not.toBeNull();

    const aromaticSignals = prediction.proton!.signals.filter(
      (signal) => signal.integral === 1 && signal.delta >= 6.4 && signal.delta <= 7.4,
    );
    expect(aromaticSignals).toHaveLength(4);
    expect(aromaticSignals.some((signal) => signal.delta >= 7.24 && signal.delta <= 7.33)).toBe(
      true,
    );
    expect(
      aromaticSignals.filter((signal) => signal.delta >= 6.45 && signal.delta <= 6.58).length,
    ).toBeGreaterThanOrEqual(3);
  });
});

function matchesExpectedSignal(signal: NmrSignal, expectedSignal: NmrBenchmarkSignal) {
  const expectedMultiplicities = Array.isArray(expectedSignal.multiplicity)
    ? expectedSignal.multiplicity
    : [expectedSignal.multiplicity];

  return (
    signal.integral === expectedSignal.integral &&
    expectedMultiplicities.includes(signal.multiplicity) &&
    signal.delta >= expectedSignal.deltaRange[0] &&
    signal.delta <= expectedSignal.deltaRange[1]
  );
}

function formatAvailableSignals(
  fixtureName: string,
  signals: NmrSignal[],
  expectedSignal: NmrBenchmarkSignal,
) {
  const availableSignals = signals
    .map((signal) => `${signal.integral}H ${signal.multiplicity} at ${signal.delta.toFixed(3)} ppm`)
    .join(' | ');
  const expectedMultiplicity = Array.isArray(expectedSignal.multiplicity)
    ? expectedSignal.multiplicity.join(' or ')
    : expectedSignal.multiplicity;

  return `${fixtureName}: expected ${expectedSignal.label} (${expectedSignal.integral}H ${expectedMultiplicity} in ${expectedSignal.deltaRange[0]}-${expectedSignal.deltaRange[1]} ppm), got [${availableSignals}]`;
}

function containsSimplifiedEnvelopeWarning(warnings: string[]) {
  return warnings.some((warning) => warning.includes('simplified envelope'));
}

function hasCouplingNear(signal: NmrSignal, target: number, tolerance: number) {
  return signal.couplingConstants.some((value) => Math.abs(value - target) <= tolerance);
}

function countResolvedPeaks(
  spectrum: { x: number[]; y: number[] },
  center: number,
  halfWindow: number,
) {
  const points = spectrum.x
    .map((ppm, index) => ({ ppm, intensity: spectrum.y[index] ?? 0 }))
    .filter((point) => point.ppm >= center - halfWindow && point.ppm <= center + halfWindow);

  if (points.length < 3) {
    return 0;
  }

  const maxIntensity = Math.max(...points.map((point) => point.intensity), 0);
  if (maxIntensity <= 0) {
    return 0;
  }

  const threshold = maxIntensity * 0.08;
  const mergeDistance = 0.0018;
  const peaks: Array<{ ppm: number; intensity: number }> = [];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    if (current.intensity < threshold) {
      continue;
    }
    if (current.intensity <= previous.intensity || current.intensity < next.intensity) {
      continue;
    }

    const lastPeak = peaks[peaks.length - 1];
    if (lastPeak && Math.abs(current.ppm - lastPeak.ppm) <= mergeDistance) {
      if (current.intensity > lastPeak.intensity) {
        peaks[peaks.length - 1] = current;
      }
      continue;
    }

    peaks.push(current);
  }

  return peaks.length;
}
