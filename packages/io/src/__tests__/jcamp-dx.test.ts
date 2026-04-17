import { describe, it, expect } from 'vitest';
import { parseJcampDx1D } from '../jcamp-dx.js';

/**
 * Inline JCAMP-DX fixture builder. Reads like a real file but trims authoring
 * boilerplate so each test makes one specific point.
 */
function jcampFile(opts: {
  title?: string;
  dataType?: string;
  npoints: number;
  firstX: number;
  lastX: number;
  xUnits?: string;
  yUnits?: string;
  observeFreq?: number;
  observeNucleus?: string;
  solvent?: string;
  yFactor?: number;
  ys: number[];
  /** Override the XYDATA= header line for negative tests. */
  xydataHeader?: string;
  /** Skip emitting ##JCAMP-DX= for negative tests. */
  omitJcampDxHeader?: boolean;
}): string {
  const lines: string[] = [];
  lines.push(`##TITLE=${opts.title ?? 'Test fixture'}`);
  if (!opts.omitJcampDxHeader) lines.push('##JCAMP-DX=5.00');
  lines.push(`##DATA TYPE=${opts.dataType ?? 'NMR SPECTRUM'}`);
  lines.push(`##NPOINTS=${opts.npoints}`);
  lines.push(`##FIRSTX=${opts.firstX}`);
  lines.push(`##LASTX=${opts.lastX}`);
  lines.push(`##XUNITS=${opts.xUnits ?? 'PPM'}`);
  lines.push(`##YUNITS=${opts.yUnits ?? 'ARBITRARY'}`);
  if (opts.yFactor !== undefined) lines.push(`##YFACTOR=${opts.yFactor}`);
  if (opts.observeFreq !== undefined) lines.push(`##.OBSERVE FREQUENCY=${opts.observeFreq}`);
  if (opts.observeNucleus !== undefined) lines.push(`##.OBSERVE NUCLEUS=${opts.observeNucleus}`);
  if (opts.solvent !== undefined) lines.push(`##.SOLVENT NAME=${opts.solvent}`);
  lines.push(opts.xydataHeader ?? '##XYDATA=(X++(Y..Y))');
  // Emit one data line per Y, with X as anchor in original units.
  const step = (opts.lastX - opts.firstX) / Math.max(opts.npoints - 1, 1);
  for (let i = 0; i < opts.ys.length; i++) {
    const x = opts.firstX + step * i;
    lines.push(`${x.toFixed(4)} ${opts.ys[i]}`);
  }
  lines.push('##END=');
  return lines.join('\n');
}

describe('parseJcampDx1D — happy path', () => {
  it('parses a 1H NMR spectrum with high→low ppm and flips to ascending', () => {
    const file = jcampFile({
      title: 'Ethanol 1H',
      npoints: 5,
      firstX: 12.0,
      lastX: 0.0,
      observeFreq: 400.13,
      observeNucleus: '1H',
      solvent: 'CDCl3',
      ys: [0.1, 0.2, 1.0, 0.5, 0.05],
    });
    const result = parseJcampDx1D(file);
    expect(result.title).toBe('Ethanol 1H');
    expect(result.nucleus).toBe('1H');
    expect(result.observeFrequencyMhz).toBeCloseTo(400.13, 6);
    expect(result.solvent).toBe('CDCl3');
    expect(result.xPpm).toHaveLength(5);
    expect(result.y).toHaveLength(5);
    // Ascending after the flip — first sample is 0 ppm (was the file's last X).
    expect(result.xPpm[0]).toBeCloseTo(0, 6);
    expect(result.xPpm[4]).toBeCloseTo(12, 6);
    // Y should also be flipped — file emitted [0.1, 0.2, 1.0, 0.5, 0.05]; after
    // flip the first sample (0 ppm in ppm space) is 0.05.
    expect(result.y[0]).toBeCloseTo(0.05, 6);
    expect(result.y[4]).toBeCloseTo(0.1, 6);
  });

  it('preserves ascending ppm without flipping when source already ascending', () => {
    const file = jcampFile({
      npoints: 3,
      firstX: 0.0,
      lastX: 10.0,
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [0, 1, 0],
    });
    const result = parseJcampDx1D(file);
    expect(result.xPpm[0]).toBeCloseTo(0, 6);
    expect(result.xPpm[2]).toBeCloseTo(10, 6);
    expect(result.y[1]).toBeCloseTo(1, 6);
  });

  it('converts XUNITS=HZ to ppm using observe frequency', () => {
    // 4000 Hz / 400 MHz = 10 ppm
    const file = jcampFile({
      npoints: 3,
      firstX: 0,
      lastX: 4000,
      xUnits: 'HZ',
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [0, 1, 0],
    });
    const result = parseJcampDx1D(file);
    expect(result.xPpm[0]).toBeCloseTo(0, 6);
    expect(result.xPpm[2]).toBeCloseTo(10, 6);
  });

  it('applies YFACTOR to scale intensities', () => {
    const file = jcampFile({
      npoints: 2,
      firstX: 0,
      lastX: 10,
      yFactor: 0.5,
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [10, 20],
    });
    const result = parseJcampDx1D(file);
    expect(result.y).toEqual([5, 10]);
  });

  it('normalises 13C nucleus aliases', () => {
    const file = jcampFile({
      npoints: 2,
      firstX: 0,
      lastX: 200,
      observeFreq: 100,
      observeNucleus: 'C-13',
      ys: [0, 1],
    });
    const result = parseJcampDx1D(file);
    expect(result.nucleus).toBe('13C');
  });

  it('treats LDR keys case- and whitespace-insensitively', () => {
    // Replace canonical keys with aliased forms in the file body.
    const file = jcampFile({
      npoints: 2,
      firstX: 0,
      lastX: 10,
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [0, 1],
    })
      .replace('##DATA TYPE=', '##Data-Type=')
      .replace('##NPOINTS=', '##NPoints=');
    const result = parseJcampDx1D(file);
    expect(result.meta.npoints).toBe(2);
  });
});

describe('parseJcampDx1D — error paths', () => {
  it('rejects a non-JCAMP file', () => {
    expect(() => parseJcampDx1D('hello world')).toThrow(/Missing ##JCAMP-DX/);
  });

  it('rejects a non-NMR data type', () => {
    const file = jcampFile({
      dataType: 'INFRARED SPECTRUM',
      npoints: 2,
      firstX: 0,
      lastX: 10,
      ys: [0, 1],
    });
    expect(() => parseJcampDx1D(file)).toThrow(/Unsupported DATA TYPE/);
  });

  it('rejects an unsupported XYDATA format header', () => {
    const file = jcampFile({
      npoints: 2,
      firstX: 0,
      lastX: 10,
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [0, 1],
      xydataHeader: '##XYDATA=(XY..XY)',
    });
    expect(() => parseJcampDx1D(file)).toThrow(/not \(X\+\+\(Y\.\.Y\)\) AFFN/);
  });

  it('rejects ASDF compression markers as non-numeric Y samples', () => {
    // Build a valid file then replace one Y line with an ASDF SQZ digit ("E5"
    // means +5 in SQZ). Our parser refuses rather than guess.
    const file = jcampFile({
      npoints: 3,
      firstX: 0,
      lastX: 10,
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [1, 2, 3],
    }).replace(/^5\.0000 2$/m, '5.0000 E5');
    expect(() => parseJcampDx1D(file)).toThrow(/wave-4 does not decode ASDF/);
  });

  it('rejects HZ axis without observe frequency', () => {
    const file = jcampFile({
      npoints: 2,
      firstX: 0,
      lastX: 4000,
      xUnits: 'HZ',
      observeNucleus: '1H',
      ys: [0, 1],
    });
    expect(() => parseJcampDx1D(file)).toThrow(/requires a positive ##\.OBSERVEFREQUENCY/);
  });

  it('rejects unsupported XUNITS', () => {
    const file = jcampFile({
      npoints: 2,
      firstX: 0,
      lastX: 10,
      xUnits: 'TIME',
      observeFreq: 400,
      observeNucleus: '1H',
      ys: [0, 1],
    });
    expect(() => parseJcampDx1D(file)).toThrow(/Unsupported XUNITS "TIME"/);
  });

  it('rejects empty XYDATA bodies', () => {
    const file = `##TITLE=empty\n##JCAMP-DX=5.00\n##DATA TYPE=NMR SPECTRUM\n##NPOINTS=0\n##FIRSTX=0\n##LASTX=10\n##XUNITS=PPM\n##YUNITS=ARBITRARY\n##XYDATA=(X++(Y..Y))\n##END=\n`;
    expect(() => parseJcampDx1D(file)).toThrow(/contained no Y samples/);
  });
});

describe('parseJcampDx1D — round-trip with real-world quirks', () => {
  it('ignores $$ comment lines', () => {
    const file = `$$ exported by Bruker TopSpin 4.1\n##TITLE=trace\n##JCAMP-DX=5.00\n##DATA TYPE=NMR SPECTRUM\n##NPOINTS=3\n##FIRSTX=0\n##LASTX=10\n##XUNITS=PPM\n##YUNITS=ARBITRARY\n##.OBSERVE FREQUENCY=400\n##.OBSERVE NUCLEUS=1H\n##XYDATA=(X++(Y..Y))\n$$ data block\n0.0000 0.0 1.0 0.0\n##END=\n`;
    const result = parseJcampDx1D(file);
    expect(result.y).toHaveLength(3);
  });
});
