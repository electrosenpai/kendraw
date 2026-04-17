import { describe, it, expect } from 'vitest';
import {
  computeDefaultViewport,
  hitTestPeaks,
  renderSpectrum,
  type PeakHitBox,
} from '../SpectrumRenderer.js';
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
        {
          atom_index: 0,
          atom_indices: [0],
          parent_indices: [0],
          shift_ppm: 2.0,
          integral: 1,
          multiplicity: 's',
          coupling_hz: [],
          environment: 'methyl',
          confidence: 3,
          method: 'additive',
          proton_group_id: 1,
          dept_class: null,
        },
        {
          atom_index: 1,
          atom_indices: [1],
          parent_indices: [1],
          shift_ppm: 7.0,
          integral: 1,
          multiplicity: 's',
          coupling_hz: [],
          environment: 'aromatic',
          confidence: 3,
          method: 'additive',
          proton_group_id: 1,
          dept_class: null,
        },
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

// Minimal CanvasRenderingContext2D stub for DEPT rendering tests
function createMockCtx(): CanvasRenderingContext2D {
  const noop = () => {};
  return {
    setTransform: noop,
    clearRect: noop,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    arc: noop,
    rect: noop,
    clip: noop,
    save: noop,
    restore: noop,
    setLineDash: noop,
    fillText: noop,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'center' as CanvasTextAlign,
  } as unknown as CanvasRenderingContext2D;
}

function makePeak(shift: number, dept: string | null, idx: number): NmrPrediction['peaks'][number] {
  return {
    atom_index: idx,
    atom_indices: [idx],
    parent_indices: [idx],
    shift_ppm: shift,
    integral: 1,
    multiplicity: 's',
    coupling_hz: [],
    environment: 'test',
    confidence: 3,
    method: 'additive',
    proton_group_id: idx + 1,
    dept_class: dept,
  };
}

describe('DEPT mode rendering', () => {
  const ethanol13C: NmrPrediction = {
    nucleus: '13C',
    solvent: 'CDCl3',
    peaks: [makePeak(15.0, 'CH3', 0), makePeak(65.0, 'CH2', 1)],
    metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
  };

  const acetone13C: NmrPrediction = {
    nucleus: '13C',
    solvent: 'CDCl3',
    peaks: [makePeak(30.0, 'CH3', 0), makePeak(205.0, 'C', 1)],
    metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
  };

  it('returns hitBoxes for all peaks in normal mode', () => {
    const ctx = createMockCtx();
    const hitBoxes = renderSpectrum(ctx, ethanol13C, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -5, maxPpm: 220 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      deptMode: false,
    });
    expect(hitBoxes).toHaveLength(2);
  });

  it('hides quaternary C peaks in DEPT mode', () => {
    const ctx = createMockCtx();
    const hitBoxes = renderSpectrum(ctx, acetone13C, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -5, maxPpm: 220 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      deptMode: true,
    });
    // Only CH3 should have a hitBox; C (quaternary) is invisible
    expect(hitBoxes).toHaveLength(1);
    const first = hitBoxes[0];
    expect(first).toBeDefined();
    expect(first?.peakIdx).toBe(0);
  });

  it('keeps CH3 and CH2 visible in DEPT mode', () => {
    const ctx = createMockCtx();
    const hitBoxes = renderSpectrum(ctx, ethanol13C, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -5, maxPpm: 220 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      deptMode: true,
    });
    expect(hitBoxes).toHaveLength(2);
  });

  it('inverts CH2 peaks (y below baseline)', () => {
    const ctx = createMockCtx();
    const hitBoxes = renderSpectrum(ctx, ethanol13C, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -5, maxPpm: 220 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      deptMode: true,
    });
    const baselineY = 24 + (400 - 24 - 34) * 0.5; // MARGIN.top + plotH * 0.5
    const ch3Box = hitBoxes.find((b) => b.peakIdx === 0); // CH3 at 15 ppm
    const ch2Box = hitBoxes.find((b) => b.peakIdx === 1); // CH2 at 65 ppm
    expect(ch3Box).toBeDefined();
    expect(ch2Box).toBeDefined();
    // CH3 should be above baseline (lower y value)
    expect(ch3Box?.y).toBeLessThan(baselineY);
    // CH2 should be below baseline (higher y value, inverted)
    expect(ch2Box?.y).toBeGreaterThan(baselineY);
  });

  it('renders all peaks normally when deptMode is off', () => {
    const ctx = createMockCtx();
    const hitBoxes = renderSpectrum(ctx, acetone13C, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -5, maxPpm: 220 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      deptMode: false,
    });
    // Both CH3 and C should be visible in normal mode
    expect(hitBoxes).toHaveLength(2);
  });
});

// Wave-2 A3: cumulative integration trace overlay
function createSpyCtx(): {
  ctx: CanvasRenderingContext2D;
  calls: { stroke: number; fillText: string[] };
} {
  const calls = { stroke: 0, fillText: [] as string[] };
  const noop = () => {};
  const ctx = {
    setTransform: noop,
    clearRect: noop,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    fill: noop,
    stroke: () => {
      calls.stroke += 1;
    },
    arc: noop,
    rect: noop,
    clip: noop,
    save: noop,
    restore: noop,
    setLineDash: noop,
    fillText: (text: string) => {
      calls.fillText.push(text);
    },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'miter' as CanvasLineJoin,
    font: '',
    textAlign: 'center' as CanvasTextAlign,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('showIntegration trace', () => {
  const ethanol1H: NmrPrediction = {
    nucleus: '1H',
    solvent: 'CDCl3',
    peaks: [
      { ...makePeak(1.25, null, 0), integral: 3, environment: 'CH3' },
      { ...makePeak(3.72, null, 1), integral: 2, environment: 'CH2' },
      { ...makePeak(2.5, null, 2), integral: 1, environment: 'OH' },
    ],
    metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
  };

  it('emits extra stroke calls when showIntegration is true', () => {
    const baseline = createSpyCtx();
    renderSpectrum(baseline.ctx, ethanol1H, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -1, maxPpm: 12 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      showIntegration: false,
    });

    const withTrace = createSpyCtx();
    renderSpectrum(withTrace.ctx, ethanol1H, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -1, maxPpm: 12 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      showIntegration: true,
    });

    // Integration trace adds exactly one extra stroke() call
    expect(withTrace.calls.stroke).toBeGreaterThan(baseline.calls.stroke);
  });

  it('labels each peak with its integral value when enabled', () => {
    const spy = createSpyCtx();
    renderSpectrum(spy.ctx, ethanol1H, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -1, maxPpm: 12 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      showIntegration: true,
    });
    // Integral labels "3.0", "2.0", "1.0" should be emitted
    expect(spy.calls.fillText).toEqual(expect.arrayContaining(['3.0', '2.0', '1.0']));
  });

  it('draws no integration labels when all integrals are zero', () => {
    const zero: NmrPrediction = {
      nucleus: '1H',
      solvent: 'CDCl3',
      peaks: [{ ...makePeak(2.0, null, 0), integral: 0 }],
      metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
    };
    const spy = createSpyCtx();
    renderSpectrum(spy.ctx, zero, {
      width: 800,
      height: 400,
      dpr: 1,
      viewport: { minPpm: -1, maxPpm: 12 },
      hoveredPeakIdx: null,
      selectedPeakIdx: null,
      showIntegration: true,
    });
    // No "0.0" label should appear — trace skipped entirely when totalH=0
    expect(spy.calls.fillText).not.toContain('0.0');
  });

  it('does not throw with empty prediction', () => {
    const empty: NmrPrediction = {
      nucleus: '1H',
      solvent: 'CDCl3',
      peaks: [],
      metadata: { engine_version: '0.2.0', data_version: null, method: 'additive' },
    };
    const spy = createSpyCtx();
    expect(() =>
      renderSpectrum(spy.ctx, empty, {
        width: 800,
        height: 400,
        dpr: 1,
        viewport: { minPpm: -1, maxPpm: 12 },
        hoveredPeakIdx: null,
        selectedPeakIdx: null,
        showIntegration: true,
      }),
    ).not.toThrow();
  });
});
