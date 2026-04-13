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
  const { width, height, dpr, viewport, hoveredPeakIdx, selectedPeakIdx } = options;
  const hitBoxes: PeakHitBox[] = [];

  // Setup canvas
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#0a0a0a';
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
  ctx.strokeStyle = '#1a1a1a';
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
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN.left, MARGIN.top + plotH);
  ctx.lineTo(MARGIN.left + plotW, MARGIN.top + plotH);
  ctx.stroke();

  // Axis tick labels
  ctx.fillStyle = '#888888';
  ctx.font = '11px "IBM Plex Mono", "Fira Code", monospace';
  ctx.textAlign = 'center';
  const labelStep = ppmRange > 10 ? 2 : 1;
  for (let ppm = Math.ceil(minPpm); ppm <= Math.floor(maxPpm); ppm += labelStep) {
    const x = ppmToX(ppm);
    ctx.fillText(String(ppm), x, MARGIN.top + plotH + 16);
    ctx.beginPath();
    ctx.strokeStyle = '#444444';
    ctx.moveTo(x, MARGIN.top + plotH);
    ctx.lineTo(x, MARGIN.top + plotH + 4);
    ctx.stroke();
  }

  // Axis title
  ctx.fillStyle = '#666666';
  ctx.font = '10px Inter, system-ui, sans-serif';
  ctx.fillText('\u03B4 (ppm)', MARGIN.left + plotW / 2, MARGIN.top + plotH + 30);

  if (!prediction || prediction.peaks.length === 0) {
    ctx.fillStyle = '#555555';
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
  ctx.fillStyle = 'rgba(77, 171, 247, 0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(77, 171, 247, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

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
    drawConfidenceMarker(ctx, cx, peakTopY - r - 2, r, peak.confidence, color, isSelected);

    // Peak label — shift + multiplicity
    ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#eeeeee' : '#cccccc';
    ctx.font = `${isHovered || isSelected ? 11 : 10}px "JetBrains Mono", "IBM Plex Mono", monospace`;
    ctx.textAlign = 'center';
    const mult = peak.multiplicity ?? 's';
    const label = `${peak.shift_ppm.toFixed(2)} ${mult}`;
    ctx.fillText(label, cx, peakTopY - r - 8);

    // nH indicator
    ctx.font = '9px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText(`${nH}H`, cx, MARGIN.top + plotH + 4);

    hitBoxes.push({ peakIdx: pi, x: cx, y: peakTopY, radius: Math.max(r + 4, 10) });
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
    ctx.fillStyle = '#0a0a0a';
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
