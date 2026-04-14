/**
 * Pure Canvas 2D spectrum renderer for NMR predictions.
 *
 * Conventions:
 * - ppm axis inverted: high values (downfield) on left, low (upfield) on right
 * - Lorentzian line shapes for peak visualization
 * - Confidence coloring: 3=green, 2=yellow, 1=red
 * - Colorblind-friendly shapes: filled circle (3), half circle (2), hollow circle (1)
 */

import type { NmrPrediction } from '@kendraw/scene';

export interface SpectrumViewport {
  minPpm: number;
  maxPpm: number;
}

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

// Solvent residual proton peaks — dashed marker + label on spectrum
const SOLVENT_RESIDUAL_PEAKS: Record<string, { shift: number; label: string }[]> = {
  CDCl3: [{ shift: 7.26, label: 'CHCl\u2083' }],
  'DMSO-d6': [{ shift: 2.50, label: 'DMSO' }],
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

export function computeDefaultViewport(prediction: NmrPrediction): SpectrumViewport {
  if (prediction.peaks.length === 0) return { minPpm: -0.5, maxPpm: 12 };
  const shifts = prediction.peaks.map((p) => p.shift_ppm);
  const lo = Math.min(...shifts);
  const hi = Math.max(...shifts);
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  return {
    minPpm: Math.max(-0.5, lo - pad),
    maxPpm: hi + pad,
  };
}

export function renderSpectrum(
  ctx: CanvasRenderingContext2D,
  prediction: NmrPrediction | null,
  options: RenderOptions,
): PeakHitBox[] {
  const { width, height, dpr, viewport, hoveredPeakIdx, selectedPeakIdx, exportMode, solvent, showNoise } = options;
  const hitBoxes: PeakHitBox[] = [];

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

  // Compute composite spectrum via Lorentzian summation
  const nPoints = Math.min(plotW * 2, 2000);
  const spectrum = new Float64Array(nPoints);
  let maxIntensity = 0;

  for (const peak of prediction.peaks) {
    const nH = peak.atom_indices.length;
    for (let i = 0; i < nPoints; i++) {
      const ppm = maxPpm - (i / (nPoints - 1)) * ppmRange;
      const val = nH * lorentzian(ppm, peak.shift_ppm, LORENTZIAN_HALF_WIDTH_PPM);
      const prev = spectrum[i] ?? 0;
      spectrum[i] = prev + val;
      const cur = spectrum[i] ?? 0;
      if (cur > maxIntensity) maxIntensity = cur;
    }
  }

  if (maxIntensity === 0) return hitBoxes;

  // Draw composite envelope
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

  // QW-1: Solvent label (top-right) + residual peak markers (dashed vertical lines)
  if (solvent) {
    // Solvent label top-right
    const solventDisplay = solvent === 'C6D6' ? 'C\u2086D\u2086'
      : solvent === 'D2O' ? 'D\u2082O'
      : solvent === 'DMSO-d6' ? 'DMSO-d\u2086'
      : solvent === 'acetone-d6' ? 'Acetone-d\u2086'
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
      const noise = ((seed / 0x7fffffff) - 0.5) * plotH * 0.015;
      const x = MARGIN.left + (i / (nPoints - 1)) * plotW;
      if (i === 0) ctx.moveTo(x, baseY + noise);
      else ctx.lineTo(x, baseY + noise);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Draw individual peaks
  for (let pi = 0; pi < prediction.peaks.length; pi++) {
    const peak = prediction.peaks[pi];
    if (!peak) continue;
    const cx = ppmToX(peak.shift_ppm);
    const color = CONF_COLORS[peak.confidence] ?? '#888888';
    const nH = peak.atom_indices.length;
    const peakTopY =
      MARGIN.top + plotH - (nH * lorentzian(peak.shift_ppm, peak.shift_ppm, LORENTZIAN_HALF_WIDTH_PPM) / maxIntensity) * plotH * 0.85;

    const isHovered = hoveredPeakIdx === pi;
    const isSelected = selectedPeakIdx === pi;

    // Stem line
    ctx.beginPath();
    ctx.moveTo(cx, MARGIN.top + plotH);
    ctx.lineTo(cx, peakTopY);
    ctx.strokeStyle = isSelected ? '#ffffff' : isHovered ? color : color + '88';
    ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 1;
    ctx.stroke();

    // Confidence shape at peak top
    const r = isHovered || isSelected ? 6 : 4;
    drawConfidenceMarker(ctx, cx, peakTopY - r - 2, r, peak.confidence, color, isSelected, bg);

    // Peak label — shift + multiplicity
    ctx.fillStyle = isSelected ? peakLabelSelected : isHovered ? peakLabelHover : peakLabelDefault;
    ctx.font = `${isHovered || isSelected ? 11 : 10}px "JetBrains Mono", "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    const mult = peak.multiplicity ?? 's';
    const label = `${peak.shift_ppm.toFixed(2)} ${mult}`;
    ctx.fillText(label, cx, peakTopY - r - 8);

    // nH indicator
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.fillStyle = nHColor;
    ctx.fillText(`${nH}H`, cx, MARGIN.top + plotH + 4);

    hitBoxes.push({ peakIdx: pi, x: cx, y: peakTopY, radius: Math.max(r + 4, 10) });
  }

  // F-3: Integration bars below peaks
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

export function hitTestPeaks(
  hitBoxes: PeakHitBox[],
  x: number,
  y: number,
): number | null {
  for (const box of hitBoxes) {
    const dx = x - box.x;
    const dy = y - box.y;
    if (dx * dx + dy * dy <= box.radius * box.radius) {
      return box.peakIdx;
    }
  }
  return null;
}
