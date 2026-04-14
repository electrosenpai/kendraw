import { describe, it, expect } from 'vitest';
import { computeDefaultViewport, hitTestPeaks, type PeakHitBox } from '../SpectrumRenderer.js';
import type { NmrPrediction } from '@kendraw/scene';

describe('computeDefaultViewport', () => {
  it('returns default range for empty peaks', () => {
    const pred: NmrPrediction = {
      nucleus: '1H',
      solvent: 'CDCl3',
      peaks: [],
      metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
    };
    const vp = computeDefaultViewport(pred);
    expect(vp.minPpm).toBeLessThan(vp.maxPpm);
    expect(vp.maxPpm).toBeGreaterThanOrEqual(12);
  });

  it('pads around peak range', () => {
    const pred: NmrPrediction = {
      nucleus: '1H',
      solvent: 'CDCl3',
      peaks: [
        { atom_index: 0, atom_indices: [0], parent_indices: [0], shift_ppm: 2.0, integral: 1, multiplicity: 's', coupling_hz: [], environment: 'methyl', confidence: 3, method: 'additive', proton_group_id: 1 },
        { atom_index: 1, atom_indices: [1], parent_indices: [1], shift_ppm: 7.0, integral: 1, multiplicity: 's', coupling_hz: [], environment: 'aromatic', confidence: 3, method: 'additive', proton_group_id: 1 },
      ],
      metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
    };
    const vp = computeDefaultViewport(pred);
    expect(vp.minPpm).toBeLessThan(2.0);
    expect(vp.maxPpm).toBeGreaterThan(7.0);
  });
});

describe('hitTestPeaks', () => {
  it('returns null when no peaks hit', () => {
    const boxes: PeakHitBox[] = [{ peakIdx: 0, x: 100, y: 50, radius: 10 }];
    expect(hitTestPeaks(boxes, 200, 200)).toBeNull();
  });

  it('returns peak index when inside radius', () => {
    const boxes: PeakHitBox[] = [
      { peakIdx: 0, x: 100, y: 50, radius: 10 },
      { peakIdx: 1, x: 200, y: 50, radius: 10 },
    ];
    expect(hitTestPeaks(boxes, 102, 48)).toBe(0);
    expect(hitTestPeaks(boxes, 198, 52)).toBe(1);
  });

  it('returns first match for overlapping peaks', () => {
    const boxes: PeakHitBox[] = [
      { peakIdx: 0, x: 100, y: 50, radius: 20 },
      { peakIdx: 1, x: 105, y: 50, radius: 20 },
    ];
    expect(hitTestPeaks(boxes, 103, 50)).toBe(0);
  });
});
