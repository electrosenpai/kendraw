/**
 * Pure Canvas 2D spectrum renderer for NMR predictions.
 *
 * Conventions:
 * - ppm axis inverted: high values (downfield) on left, low (upfield) on right
 * - Lorentzian line shapes for peak visualization
 * - Confidence coloring: 3=green, 2=yellow, 1=red
 * - Colorblind-friendly shapes: filled circle (3), half circle (2), hollow circle (1)
 */

import type { NmrPrediction, NmrPeak } from '@kendraw/scene';
import {
  expandMultiplet,
  isUnresolvedMultiplet,
  MULTIPLET_BROADENING_FACTOR,
  type SubLine,
} from './multiplet.js';

export interface SpectrumViewport {
  minPpm: number;
  maxPpm: number;
}

/**
 * Wave-4 P1-01: explicit NMR display mode.
 *
 * - `off`     — standard ¹H or ¹³C spectrum (every peak above baseline).
 * - `dept-90` — DEPT-90: only CH carbons visible (CH₂, CH₃, quaternary absent).
 * - `dept-135`— DEPT-135: CH and CH₃ point up, CH₂ inverted (down), quaternary absent.
 *
 * The boolean `deptMode` legacy flag is mapped to `dept-135` when true so existing
 * call sites keep working until callers migrate.
 */
export type NmrMode = 'off' | 'dept-90' | 'dept-135';

export interface RenderOptions {
  width: number;
  height: number;
  dpr: number;
  viewport: SpectrumViewport;
  hoveredPeakIdx: number | null;
  selectedPeakIdx: number | null;
  exportMode?: boolean;
  solvent?: string;
  showNoise?: boolean;
  /** @deprecated since wave-4 — pass `nmrMode: 'dept-135'` instead. */
  deptMode?: boolean;
  /** Wave-4 P1-01: explicit display mode; takes precedence over `deptMode`. */
  nmrMode?: NmrMode;
  /**
   * Spectrometer frequency in MHz for multiplet expansion. Defaults to 400.
   * Higher frequency compresses J-couplings on the ppm axis (Δppm = J_hz / ν₀).
   */
  frequencyMhz?: number;
  /**
   * When true, publishes the computed sub-lines and per-peak indexing to
   * `window.__nmrDebugData` so Playwright E2E tests can assert visual state
   * without relying on pixel-level canvas hit-testing. Tree-shaken in
   * production call sites that pass `false` (default).
   */
  exposeDebug?: boolean;
  /**
   * When true, overlays a cumulative integration step curve on the spectrum
   * — the classic NMR "integral trace" rising at each peak by its proton
   * count. Wave-2 A3.
   */
  showIntegration?: boolean;
  /**
   * Wave-4 P1-03: experimental spectrum overlay imported from a JCAMP-DX file.
   * When present, drawn as a thin contrasting line on top of the synthetic
   * envelope so the chemist can compare prediction vs. real data side-by-side.
   * `xPpm` must be sorted ascending and aligned with `y`.
   */
  experimentalOverlay?: { xPpm: number[]; y: number[] } | null;
}

/** Default spectrometer frequency in MHz used when the caller omits it. */
export const DEFAULT_FREQUENCY_MHZ = 400;

/**
 * Debug snapshot exposed on `window.__nmrDebugData` when
 * {@link RenderOptions.exposeDebug} is true. Contains the last-computed
 * expansion so E2E tests can count sub-lines in a ppm range without relying
 * on canvas pixel assertions.
 */
export interface NmrDebugData {
  frequencyMhz: number;
  peaks: Array<{
    peakIdx: number;
    shiftPpm: number;
    multiplicity: string;
    couplingHz: number[];
    subLines: SubLine[];
  }>;
  /** Flat list of all sub-lines across all peaks, with parent peakIdx. */
  allSubLines: Array<SubLine & { peakIdx: number }>;
}

export interface PeakHitBox {
  peakIdx: number;
  x: number;
  y: number;
  radius: number;
}

const CONF_COLORS: Record<number, string> = {
  3: '#51cf66',
  2: '#ffd43b',
  1: '#ff6b6b',
};

// DEPT carbon type colors
const DEPT_COLORS: Record<string, string> = {
  CH3: '#3b82f6', // blue
  CH: '#22c55e', // green
  CH2: '#ef4444', // red
  C: '#888888', // gray (invisible in DEPT)
};

// Solvent residual proton peaks — dashed marker + label on spectrum
const SOLVENT_RESIDUAL_PEAKS: Record<string, { shift: number; label: string }[]> = {
  CDCl3: [{ shift: 7.26, label: 'CHCl\u2083' }],
  'DMSO-d6': [{ shift: 2.5, label: 'DMSO' }],
  CD3OD: [{ shift: 3.31, label: 'CHD\u2082OD' }],
  'acetone-d6': [{ shift: 2.05, label: 'acetone' }],
  C6D6: [{ shift: 7.16, label: 'C\u2086D\u2085H' }],
  D2O: [{ shift: 4.79, label: 'HDO' }],
};

const MARGIN = { top: 24, right: 44, bottom: 34, left: 44 };
const LORENTZIAN_HALF_WIDTH_PPM = 0.04;

function lorentzian(x: number, x0: number, gamma: number): number {
  const dx = x - x0;
  return 1 / (1 + (dx / gamma) ** 2);
}

/**
 * Wave-4 P1-01: DEPT phase sign per Al-Rashid's spec.
 *
 * Returns the phase multiplier for a peak under the given display mode:
 *  - `+1` — peak is visible above baseline
 *  - `-1` — peak is inverted (below baseline). Only DEPT-135 / CH₂.
 *  - ` 0` — peak is absent under this mode (do not render).
 *
 * DEPT-90 nulls everything except CH (single-bond methine carbons), which
 * matches the standard 90° pulse experiment used to disambiguate CH from
 * CH₂/CH₃ in congested aliphatic regions.
 */
export function peakPhaseSign(deptClass: string | null | undefined, mode: NmrMode): -1 | 0 | 1 {
  if (mode === 'off') return 1;
  if (!deptClass || deptClass === 'C') return 0;
  if (mode === 'dept-90') return deptClass === 'CH' ? 1 : 0;
  // dept-135
  return deptClass === 'CH2' ? -1 : 1;
}

/**
 * One multiplet sub-line with its parent peak index — internal struct used
 * by the renderer to iterate lines while keeping bidirectional mapping to
 * the source NmrPeak for hit-testing and highlighting.
 */
interface RenderLine extends SubLine {
  peakIdx: number;
  halfWidthPpm: number;
}

/** Build the flat list of sub-lines for all peaks at a given frequency. */
function expandAllPeaks(peaks: NmrPeak[], frequencyMhz: number): RenderLine[] {
  const out: RenderLine[] = [];
  for (let pi = 0; pi < peaks.length; pi++) {
    const peak = peaks[pi];
    if (!peak) continue;
    const lines = expandMultiplet(peak, frequencyMhz);
    const hw = isUnresolvedMultiplet(peak)
      ? LORENTZIAN_HALF_WIDTH_PPM * MULTIPLET_BROADENING_FACTOR
      : LORENTZIAN_HALF_WIDTH_PPM;
    for (const l of lines) {
      out.push({ ...l, peakIdx: pi, halfWidthPpm: hw });
    }
  }
  return out;
}

export function computeDefaultViewport(prediction: NmrPrediction): SpectrumViewport {
  const is13C = prediction.nucleus === '13C';
  if (prediction.peaks.length === 0) {
    return is13C ? { minPpm: -5, maxPpm: 220 } : { minPpm: -0.5, maxPpm: 12 };
  }
  const shifts = prediction.peaks.map((p) => p.shift_ppm);
  const lo = Math.min(...shifts);
  const hi = Math.max(...shifts);
  const pad = Math.max((hi - lo) * 0.15, is13C ? 5 : 0.5);
  return {
    minPpm: Math.max(is13C ? -5 : -0.5, lo - pad),
    maxPpm: hi + pad,
  };
}

export function renderSpectrum(
  ctx: CanvasRenderingContext2D,
  prediction: NmrPrediction | null,
  options: RenderOptions,
): PeakHitBox[] {
  const {
    width,
    height,
    dpr,
    viewport,
    hoveredPeakIdx,
    selectedPeakIdx,
    exportMode,
    solvent,
    showNoise,
    deptMode,
    nmrMode,
    frequencyMhz = DEFAULT_FREQUENCY_MHZ,
    exposeDebug = false,
    showIntegration = false,
    experimentalOverlay = null,
  } = options;
  const hitBoxes: PeakHitBox[] = [];

  const mode: NmrMode = nmrMode ?? (deptMode ? 'dept-135' : 'off');
  const isDept = mode === 'dept-90' || mode === 'dept-135';

  // Color scheme: dark UI vs white-bg export
  const bg = exportMode ? '#ffffff' : '#0a0a0a';
  const gridColor = exportMode ? '#e0e0e0' : '#1a1a1a';
  const axisColor = exportMode ? '#333333' : '#444444';
  const labelColor = exportMode ? '#555555' : '#888888';
  const titleColor = exportMode ? '#777777' : '#666666';
  const emptyColor = exportMode ? '#aaaaaa' : '#555555';
  const envelopeFill = exportMode ? 'rgba(30, 100, 200, 0.08)' : 'rgba(77, 171, 247, 0.06)';
  const envelopeStroke = exportMode ? 'rgba(30, 100, 200, 0.4)' : 'rgba(77, 171, 247, 0.3)';
  const peakLabelDefault = exportMode ? '#333333' : '#cccccc';
  const peakLabelHover = exportMode ? '#111111' : '#eeeeee';
  const peakLabelSelected = exportMode ? '#000000' : '#ffffff';
  const nHColor = exportMode ? '#777777' : '#888888';

  // Setup canvas
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  if (plotW <= 0 || plotH <= 0) return hitBoxes;

  const { minPpm, maxPpm } = viewport;
  const ppmRange = maxPpm - minPpm;
  if (ppmRange <= 0) return hitBoxes;

  // ppm to pixel (inverted: high ppm on left)
  const ppmToX = (ppm: number) => MARGIN.left + ((maxPpm - ppm) / ppmRange) * plotW;

  // Draw grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  const gridStep = ppmRange > 10 ? 2 : ppmRange > 4 ? 1 : 0.5;
  for (let ppm = Math.ceil(minPpm / gridStep) * gridStep; ppm <= maxPpm; ppm += gridStep) {
    const x = ppmToX(ppm);
    ctx.beginPath();
    ctx.moveTo(x, MARGIN.top);
    ctx.lineTo(x, MARGIN.top + plotH);
    ctx.stroke();
  }

  // Draw x-axis
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN.left, MARGIN.top + plotH);
  ctx.lineTo(MARGIN.left + plotW, MARGIN.top + plotH);
  ctx.stroke();

  // Axis tick labels
  ctx.fillStyle = labelColor;
  ctx.font = '11px "IBM Plex Mono", "Fira Code", monospace';
  ctx.textAlign = 'center';
  const labelStep = ppmRange > 10 ? 2 : 1;
  for (let ppm = Math.ceil(minPpm); ppm <= Math.floor(maxPpm); ppm += labelStep) {
    const x = ppmToX(ppm);
    ctx.fillText(String(ppm), x, MARGIN.top + plotH + 16);
    ctx.beginPath();
    ctx.strokeStyle = axisColor;
    ctx.moveTo(x, MARGIN.top + plotH);
    ctx.lineTo(x, MARGIN.top + plotH + 4);
    ctx.stroke();
  }

  // Axis title
  ctx.fillStyle = titleColor;
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.fillText('\u03B4 (ppm)', MARGIN.left + plotW / 2, MARGIN.top + plotH + 30);

  if (!prediction || prediction.peaks.length === 0) {
    ctx.fillStyle = emptyColor;
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No peaks to display', width / 2, height / 2);
    return hitBoxes;
  }

  // Expand every peak into its constituent multiplet sub-lines, then draw
  // the envelope by Lorentzian summation over the sub-lines. Each sub-line
  // carries its share of the parent peak's nH (intensity is conserved).
  const renderLines = expandAllPeaks(prediction.peaks, frequencyMhz);

  // Optional debug snapshot for E2E tests — published via window.__nmrDebugData
  if (exposeDebug && typeof window !== 'undefined') {
    const debug: NmrDebugData = {
      frequencyMhz,
      peaks: prediction.peaks.map((p, pi) => ({
        peakIdx: pi,
        shiftPpm: p.shift_ppm,
        multiplicity: p.multiplicity ?? 's',
        couplingHz: p.coupling_hz ?? [],
        subLines: expandMultiplet(p, frequencyMhz),
      })),
      allSubLines: renderLines.map(({ shiftPpm, intensity, peakIdx }) => ({
        shiftPpm,
        intensity,
        peakIdx,
      })),
    };
    (window as unknown as { __nmrDebugData: NmrDebugData }).__nmrDebugData = debug;
  }

  // Compute composite spectrum via Lorentzian summation over sub-lines.
  const nPoints = Math.min(plotW * 2, 2000);
  const spectrum = new Float64Array(nPoints);
  let maxIntensity = 0;

  for (const line of renderLines) {
    const peak = prediction.peaks[line.peakIdx];
    if (!peak) continue;
    const sign = peakPhaseSign(peak.dept_class, mode);
    if (sign === 0) continue;
    for (let i = 0; i < nPoints; i++) {
      const ppm = maxPpm - (i / (nPoints - 1)) * ppmRange;
      const val = sign * line.intensity * lorentzian(ppm, line.shiftPpm, line.halfWidthPpm);
      const prev = spectrum[i] ?? 0;
      spectrum[i] = prev + val;
      const absVal = Math.abs(spectrum[i] ?? 0);
      if (absVal > maxIntensity) maxIntensity = absVal;
    }
  }

  if (maxIntensity === 0) return hitBoxes;

  if (isDept) {
    // DEPT mode: draw baseline at center, envelope above/below
    const baselineY = MARGIN.top + plotH * 0.5;

    // Draw horizontal baseline
    ctx.strokeStyle = exportMode ? '#999999' : '#555555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, baselineY);
    ctx.lineTo(MARGIN.left + plotW, baselineY);
    ctx.stroke();

    // Draw positive envelope (above baseline)
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, baselineY);
    for (let i = 0; i < nPoints; i++) {
      const x = MARGIN.left + (i / (nPoints - 1)) * plotW;
      const val = spectrum[i] ?? 0;
      const posVal = Math.max(val, 0);
      const y = baselineY - (posVal / maxIntensity) * plotH * 0.42;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(MARGIN.left + plotW, baselineY);
    ctx.closePath();
    ctx.fillStyle = exportMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)';
    ctx.fill();
    ctx.strokeStyle = exportMode ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw negative envelope (below baseline)
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, baselineY);
    for (let i = 0; i < nPoints; i++) {
      const x = MARGIN.left + (i / (nPoints - 1)) * plotW;
      const val = spectrum[i] ?? 0;
      const negVal = Math.min(val, 0);
      const y = baselineY - (negVal / maxIntensity) * plotH * 0.42;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(MARGIN.left + plotW, baselineY);
    ctx.closePath();
    ctx.fillStyle = exportMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)';
    ctx.fill();
    ctx.strokeStyle = exportMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    // Normal mode: single envelope from bottom
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, MARGIN.top + plotH);
    for (let i = 0; i < nPoints; i++) {
      const x = MARGIN.left + (i / (nPoints - 1)) * plotW;
      const y = MARGIN.top + plotH - ((spectrum[i] ?? 0) / maxIntensity) * plotH * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(MARGIN.left + plotW, MARGIN.top + plotH);
    ctx.closePath();
    ctx.fillStyle = envelopeFill;
    ctx.fill();
    ctx.strokeStyle = envelopeStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Wave-4 P1-03: experimental JCAMP-DX overlay on top of the synthetic envelope.
  // Drawn as a thin orange line so it pops against the blue prediction. We
  // re-normalise the imported intensity to the same maxIntensity so the two
  // envelopes share a vertical scale; this is purely visual — quantitative
  // overlay alignment is out of scope for wave-4.
  if (
    experimentalOverlay &&
    experimentalOverlay.xPpm.length > 0 &&
    experimentalOverlay.xPpm.length === experimentalOverlay.y.length
  ) {
    const overlayY = experimentalOverlay.y;
    let overlayMax = 0;
    for (const v of overlayY) {
      const a = Math.abs(v);
      if (a > overlayMax) overlayMax = a;
    }
    if (overlayMax > 0) {
      const baselineY = isDept ? MARGIN.top + plotH * 0.5 : MARGIN.top + plotH;
      const ampScale = (isDept ? plotH * 0.42 : plotH * 0.85) / overlayMax;
      const overlayX = experimentalOverlay.xPpm;
      ctx.save();
      ctx.strokeStyle = exportMode ? 'rgba(217, 119, 6, 0.85)' : 'rgba(251, 146, 60, 0.85)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < overlayX.length; i++) {
        const ppm = overlayX[i] ?? 0;
        if (ppm < minPpm || ppm > maxPpm) {
          started = false;
          continue;
        }
        const x = ppmToX(ppm);
        const y = baselineY - (overlayY[i] ?? 0) * ampScale;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();
      // Tiny legend swatch so the user knows what the orange line is.
      ctx.save();
      ctx.fillStyle = exportMode ? 'rgba(217, 119, 6, 0.85)' : 'rgba(251, 146, 60, 0.85)';
      ctx.fillRect(MARGIN.left + 6, MARGIN.top + 4, 10, 2);
      ctx.fillStyle = exportMode ? '#666666' : '#aaaaaa';
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('exp', MARGIN.left + 20, MARGIN.top + 8);
      ctx.restore();
    }
  }

  // QW-1: Solvent label (top-right) + residual peak markers (dashed vertical lines)
  if (solvent) {
    // Solvent label top-right
    const solventDisplay =
      solvent === 'C6D6'
        ? 'C\u2086D\u2086'
        : solvent === 'D2O'
          ? 'D\u2082O'
          : solvent === 'DMSO-d6'
            ? 'DMSO-d\u2086'
            : solvent === 'acetone-d6'
              ? 'Acetone-d\u2086'
              : solvent;
    ctx.fillStyle = exportMode ? '#999999' : '#555555';
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(solventDisplay, MARGIN.left + plotW - 4, MARGIN.top + 12);

    // Residual peak dashed lines
    const residuals = SOLVENT_RESIDUAL_PEAKS[solvent];
    if (residuals) {
      for (const rp of residuals) {
        if (rp.shift >= minPpm && rp.shift <= maxPpm) {
          const rx = ppmToX(rp.shift);
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = exportMode ? '#cccccc' : '#333333';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(rx, MARGIN.top);
          ctx.lineTo(rx, MARGIN.top + plotH);
          ctx.stroke();
          ctx.restore();
          // Label above axis
          ctx.fillStyle = exportMode ? '#aaaaaa' : '#555555';
          ctx.font = '8px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(rp.label, rx, MARGIN.top + plotH + 26);
        }
      }
    }
  }

  // QW-7: TMS reference marker at 0 ppm
  if (minPpm <= 0 && maxPpm >= 0) {
    const tmsX = ppmToX(0);
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = exportMode ? '#bbbbbb' : '#444444';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(tmsX, MARGIN.top);
    ctx.lineTo(tmsX, MARGIN.top + plotH);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = exportMode ? '#999999' : '#666666';
    ctx.font = '8px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TMS', tmsX, MARGIN.top - 2);
  }

  // QW-9: NS = 1 (simulated) label
  ctx.fillStyle = exportMode ? '#aaaaaa' : '#555555';
  ctx.font = '8px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NS = 1 (simulated)', MARGIN.left + 4, MARGIN.top + 12);

  // QW-10: Baseline noise (optional)
  if (showNoise) {
    ctx.save();
    ctx.strokeStyle = exportMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    const baseY = MARGIN.top + plotH;
    let seed = 42;
    for (let i = 0; i < nPoints; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const noise = (seed / 0x7fffffff - 0.5) * plotH * 0.015;
      const x = MARGIN.left + (i / (nPoints - 1)) * plotW;
      if (i === 0) ctx.moveTo(x, baseY + noise);
      else ctx.lineTo(x, baseY + noise);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Draw individual peaks — stems are per sub-line (multiplet pattern is
  // visible), marker + label stay at peak centroid (one UI anchor per peak).
  const baselineY = isDept ? MARGIN.top + plotH * 0.5 : MARGIN.top + plotH;

  // Group sub-lines by parent peakIdx so we draw all stems for peak[pi]
  // before its marker/label (keeps z-order clean).
  const linesByPeak = new Map<number, RenderLine[]>();
  for (const line of renderLines) {
    const arr = linesByPeak.get(line.peakIdx) ?? [];
    arr.push(line);
    linesByPeak.set(line.peakIdx, arr);
  }

  for (let pi = 0; pi < prediction.peaks.length; pi++) {
    const peak = prediction.peaks[pi];
    if (!peak) continue;

    // Wave-4 P1-01: phase sign is the single source of truth for visibility +
    // up/down phasing. sign === 0 means "absent in this mode" (DEPT-90 hides
    // CH₂ and CH₃; both DEPT modes hide quaternary C).
    const phaseSign = peakPhaseSign(peak.dept_class, mode);
    if (phaseSign === 0) continue;

    const cx = ppmToX(peak.shift_ppm);
    const nH = peak.atom_indices.length;

    // DEPT mode uses dept_class colors; normal uses confidence colors
    const deptClass = peak.dept_class ?? 'C';
    const color = isDept
      ? (DEPT_COLORS[deptClass] ?? '#888888')
      : (CONF_COLORS[peak.confidence] ?? '#888888');
    const isDeptInverted = phaseSign === -1;
    const deptSign = phaseSign;

    const isHovered = hoveredPeakIdx === pi;
    const isSelected = selectedPeakIdx === pi;

    // Stem per sub-line. Height = that sub-line's Lorentzian peak value
    // (lorentzian is 1 at its own center, so y ∝ subLine.intensity).
    const peakLines = linesByPeak.get(pi) ?? [];
    const stemStroke = isSelected ? '#ffffff' : isHovered ? color : color + '88';
    const stemWidth = isSelected ? 2 : isHovered ? 1.5 : 1;
    let centroidY = baselineY; // updated to the centroid line's top below
    for (const line of peakLines) {
      const lineX = ppmToX(line.shiftPpm);
      const lineYMag = (line.intensity / maxIntensity) * plotH * (isDept ? 0.42 : 0.85);
      const lineTopY = baselineY - deptSign * lineYMag;
      ctx.beginPath();
      ctx.moveTo(lineX, baselineY);
      ctx.lineTo(lineX, lineTopY);
      ctx.strokeStyle = stemStroke;
      ctx.lineWidth = stemWidth;
      ctx.stroke();
      // Record the tallest line's y as the centroid marker anchor.
      // For symmetric multiplets the tallest line is at the shift centroid,
      // which is what we want for the marker.
      if (Math.abs(lineX - cx) < 1e-3) {
        centroidY = lineTopY;
      }
    }

    // Centroid anchor: for multiplets with an EVEN number of lines (doublet,
    // quartet, …), no line falls exactly at peak.shift_ppm, so derive the
    // marker's Y from the summed spectrum at the centroid ppm.
    if (centroidY === baselineY && peakLines.length > 0) {
      // Estimate envelope height at the centroid ppm.
      let sum = 0;
      for (const line of peakLines) {
        sum += line.intensity * lorentzian(peak.shift_ppm, line.shiftPpm, line.halfWidthPpm);
      }
      const sumN = (sum / maxIntensity) * plotH * (isDept ? 0.42 : 0.85);
      centroidY = baselineY - deptSign * sumN;
    }

    // Confidence shape at centroid (above for normal/CH3/CH, below for CH2)
    const r = isHovered || isSelected ? 6 : 4;
    const markerY = isDeptInverted ? centroidY + r + 2 : centroidY - r - 2;
    drawConfidenceMarker(ctx, cx, markerY, r, peak.confidence, color, isSelected, bg);

    // Peak label — shift + dept class (DEPT mode) or shift + multiplicity (normal)
    ctx.fillStyle = isSelected ? peakLabelSelected : isHovered ? peakLabelHover : peakLabelDefault;
    ctx.font = `${isHovered || isSelected ? 11 : 10}px "JetBrains Mono", "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    const labelText = isDept
      ? `${peak.shift_ppm.toFixed(1)} ${deptClass}`
      : `${peak.shift_ppm.toFixed(2)} ${peak.multiplicity ?? 's'}`;
    const labelY = isDeptInverted ? centroidY + r + 16 : centroidY - r - 8;
    ctx.fillText(labelText, cx, labelY);

    // nH indicator (at axis for normal, at baseline for DEPT)
    if (!isDept) {
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.fillStyle = nHColor;
      ctx.fillText(`${nH}H`, cx, MARGIN.top + plotH + 4);
    }

    hitBoxes.push({ peakIdx: pi, x: cx, y: centroidY, radius: Math.max(r + 4, 10) });
  }

  // DEPT legend (top-left area). Wave-4 P1-01: legend tracks the active mode
  // so users always know whether they're looking at DEPT-90 or DEPT-135.
  if (isDept) {
    const legendX = MARGIN.left + 8;
    let legendY = MARGIN.top + 28;
    ctx.font = '9px Inter, system-ui, sans-serif';
    // Mode header
    ctx.fillStyle = exportMode ? '#444444' : '#bbbbbb';
    ctx.textAlign = 'left';
    ctx.fillText(mode === 'dept-90' ? 'DEPT-90' : 'DEPT-135', legendX, legendY);
    legendY += 13;
    const legendItems: Array<{ label: string; color: string; symbol: string }> =
      mode === 'dept-90'
        ? [
            { label: 'CH', color: DEPT_COLORS['CH'] ?? '#22c55e', symbol: '\u25CF' },
            { label: 'CH\u2082 (absent)', color: exportMode ? '#aaaaaa' : '#555555', symbol: '\u25CB' },
            { label: 'CH\u2083 (absent)', color: exportMode ? '#aaaaaa' : '#555555', symbol: '\u25CB' },
            { label: 'C (absent)', color: exportMode ? '#aaaaaa' : '#555555', symbol: '\u25CB' },
          ]
        : [
            { label: 'CH\u2083', color: DEPT_COLORS['CH3'] ?? '#3b82f6', symbol: '\u25CF' },
            { label: 'CH', color: DEPT_COLORS['CH'] ?? '#22c55e', symbol: '\u25CF' },
            { label: 'CH\u2082 (inv.)', color: DEPT_COLORS['CH2'] ?? '#ef4444', symbol: '\u25CF' },
            { label: 'C (absent)', color: exportMode ? '#aaaaaa' : '#555555', symbol: '\u25CB' },
          ];
    for (const item of legendItems) {
      ctx.fillStyle = item.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${item.symbol} ${item.label}`, legendX, legendY);
      legendY += 13;
    }
  }

  // F-3: Integration bars below peaks (skip in DEPT mode)
  if (!isDept) {
    const totalH = prediction.peaks.reduce((s, p) => s + p.atom_indices.length, 0);
    if (totalH > 0) {
      const maxBarW = 40;
      const barY = MARGIN.top + plotH + 18;
      for (const peak of prediction.peaks) {
        const nH = peak.atom_indices.length;
        const cx = ppmToX(peak.shift_ppm);
        const scaledW = Math.min(Math.max(nH * 8, 6), maxBarW);
        ctx.fillStyle = exportMode ? 'rgba(30, 100, 200, 0.25)' : 'rgba(77, 171, 247, 0.2)';
        ctx.fillRect(cx - scaledW / 2, barY, scaledW, 3);
        ctx.fillStyle = exportMode ? '#888888' : '#666666';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${nH}H`, cx, barY + 12);
      }
    }
  }

  // Wave-2 A3: cumulative integration trace
  // Classic NMR convention: integral rises left→right (high ppm → low ppm)
  // at each peak by the peak's proton count, then plateaus until the next
  // peak. The curve sits in the upper third of the plot so it doesn't
  // collide with peak labels.
  if (showIntegration && prediction && prediction.peaks.length > 0) {
    const totalH = prediction.peaks.reduce((s, p) => s + Math.max(p.integral, 0), 0);
    if (totalH > 0) {
      // Sort peaks left→right (descending shift_ppm)
      const sorted = [...prediction.peaks].sort((a, b) => b.shift_ppm - a.shift_ppm);
      const traceTop = MARGIN.top + 14;
      const traceHeight = Math.min(plotH * 0.35, 80);
      const traceBaseline = traceTop + traceHeight;
      const yForCum = (cum: number) => traceBaseline - (cum / totalH) * traceHeight;

      ctx.save();
      ctx.strokeStyle = exportMode ? 'rgba(180, 60, 30, 0.9)' : 'rgba(255, 140, 90, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      // Start at the leftmost edge of the plot at baseline (cum = 0)
      let cum = 0;
      ctx.moveTo(MARGIN.left, yForCum(cum));
      for (const peak of sorted) {
        const x = ppmToX(peak.shift_ppm);
        // Walk flat to the peak's x at the previous cumulative value
        ctx.lineTo(x, yForCum(cum));
        cum += Math.max(peak.integral, 0);
        // Step up vertically at the peak's ppm
        ctx.lineTo(x, yForCum(cum));
      }
      // Continue flat to right edge
      ctx.lineTo(MARGIN.left + plotW, yForCum(cum));
      ctx.stroke();

      // Per-peak integration value text under each step
      ctx.fillStyle = exportMode ? '#a04020' : '#ff9966';
      ctx.font = '8px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      let cumLabel = 0;
      for (const peak of sorted) {
        const x = ppmToX(peak.shift_ppm);
        cumLabel += Math.max(peak.integral, 0);
        ctx.fillText(peak.integral.toFixed(1), x, yForCum(cumLabel) - 3);
      }
      ctx.restore();
    }
  }

  return hitBoxes;
}

function drawConfidenceMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  confidence: number,
  color: string,
  selected: boolean,
  bgColor = '#0a0a0a',
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);

  if (confidence === 3) {
    // Filled circle
    ctx.fillStyle = selected ? '#ffffff' : color;
    ctx.fill();
  } else if (confidence === 2) {
    // Half-filled circle
    ctx.fillStyle = selected ? '#ffffff' : color;
    ctx.fill();
    // Clear top half
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - r - 1, y - r - 1, r * 2 + 2, r + 1);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.restore();
    // Outline
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = selected ? '#ffffff' : color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // Hollow circle
    ctx.strokeStyle = selected ? '#ffffff' : color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function hitTestPeaks(hitBoxes: PeakHitBox[], x: number, y: number): number | null {
  for (const box of hitBoxes) {
    const dx = x - box.x;
    const dy = y - box.y;
    if (dx * dx + dy * dy <= box.radius * box.radius) {
      return box.peakIdx;
    }
  }
  return null;
}
