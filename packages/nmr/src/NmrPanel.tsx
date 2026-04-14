import { useState, useEffect, useRef, useCallback } from 'react';
import type { SceneStore, NmrPrediction, Page, AtomId } from '@kendraw/scene';
import { KendrawApiClient } from '@kendraw/api-client';
import { writeMolV2000 } from '@kendraw/io';
import {
  renderSpectrum,
  hitTestPeaks,
  computeDefaultViewport,
  type PeakHitBox,
  type SpectrumViewport,
} from './SpectrumRenderer.js';

type Nucleus = '1H' | '13C';
type SolventId = 'CDCl3' | 'DMSO-d6' | 'CD3OD' | 'acetone-d6' | 'C6D6' | 'D2O';

const SOLVENTS: Array<{ id: SolventId; label: string }> = [
  { id: 'CDCl3', label: 'CDCl3' },
  { id: 'DMSO-d6', label: 'DMSO-d6' },
  { id: 'CD3OD', label: 'CD3OD' },
  { id: 'acetone-d6', label: 'acetone-d6' },
  { id: 'C6D6', label: 'C\u2086D\u2086' },
  { id: 'D2O', label: 'D\u2082O' },
];

interface NmrPanelProps {
  store: SceneStore;
  onClose: () => void;
  height: number;
  onHeightChange: (h: number) => void;
  highlightedAtomIds?: Set<AtomId>;
  onHighlightAtoms?: (ids: Set<AtomId>) => void;
}

const apiClient = new KendrawApiClient('/api');
const MIN_HEIGHT = 120;
const MAX_HEIGHT_RATIO = 0.6;

function getMolBlock(page: Page): string | null {
  const atoms = Object.values(page.atoms);
  const bonds = Object.values(page.bonds);
  if (atoms.length === 0) return null;
  try {
    return writeMolV2000(atoms, bonds);
  } catch {
    return null;
  }
}

function formatMultiplicity(mult: string, coupling: number[]): string {
  const LABELS: Record<string, string> = {
    s: 'singlet', d: 'doublet', t: 'triplet', q: 'quartet',
    quint: 'quintet', sext: 'sextet', sept: 'septet', m: 'multiplet',
    dd: 'doublet of doublets', dt: 'doublet of triplets',
    td: 'triplet of doublets', dq: 'doublet of quartets',
    tt: 'triplet of triplets', ddd: 'doublet of doublet of doublets',
  };
  const label = LABELS[mult] ?? mult;
  if (coupling.length > 0) {
    return `${label} (J = ${coupling.map(j => j.toFixed(1)).join(', ')} Hz)`;
  }
  return label;
}

const CONF_LABELS: Record<number, { label: string; color: string }> = {
  3: { label: 'High confidence', color: '#51cf66' },
  2: { label: 'Moderate \u2014 heterocyclic correction', color: '#ffd43b' },
  1: { label: 'Low \u2014 fused heterocyclic extrapolation', color: '#ff6b6b' },
};

function formatEnvironment(env: string): string {
  return env.replace(/_/g, ' ').replace(/\balpha\b/, '\u03B1').replace(/\bbeta\b/, '\u03B2');
}

function exportPng(
  prediction: NmrPrediction,
  viewport: SpectrumViewport,
): void {
  const W = 1200;
  const H = 500;
  const canvas = document.createElement('canvas');
  const dpr = 2; // high-res export
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // White background for publication
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Render spectrum with white-bg color overrides
  renderSpectrum(ctx, prediction, {
    width: W,
    height: H - 40, // leave room for metadata footer
    dpr,
    viewport,
    hoveredPeakIdx: null,
    selectedPeakIdx: null,
    exportMode: true,
  });

  // Metadata footer
  ctx.fillStyle = '#333333';
  ctx.font = '11px "IBM Plex Mono", "Fira Code", monospace';
  ctx.textAlign = 'left';
  const meta = `${prediction.nucleus} NMR | Solvent: ${prediction.solvent} | ${prediction.peaks.length} peaks | Kendraw`;
  ctx.fillText(meta, 20, H - 12);

  // Trigger download
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `nmr_${prediction.nucleus}_${prediction.solvent}.png`;
  a.click();
}

function exportSvg(
  prediction: NmrPrediction,
  viewport: SpectrumViewport,
): void {
  const W = 800;
  const H = 400;
  const M = { top: 24, right: 44, bottom: 34, left: 44 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const { minPpm, maxPpm } = viewport;
  const ppmRange = maxPpm - minPpm;
  const ppmToX = (ppm: number) => M.left + ((maxPpm - ppm) / ppmRange) * plotW;
  const gamma = 0.04;

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<!-- Kendraw NMR ${prediction.nucleus} | Solvent: ${prediction.solvent} | ${prediction.peaks.length} peaks -->`);
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Helvetica Neue', Helvetica, sans-serif">`);
  lines.push(`<rect width="${W}" height="${H}" fill="white"/>`);

  // X-axis
  lines.push(`<line x1="${M.left}" y1="${M.top + plotH}" x2="${M.left + plotW}" y2="${M.top + plotH}" stroke="#333" stroke-width="1"/>`);
  const labelStep = ppmRange > 10 ? 2 : 1;
  for (let ppm = Math.ceil(minPpm); ppm <= Math.floor(maxPpm); ppm += labelStep) {
    const x = ppmToX(ppm);
    lines.push(`<line x1="${x}" y1="${M.top + plotH}" x2="${x}" y2="${M.top + plotH + 4}" stroke="#333" stroke-width="0.5"/>`);
    lines.push(`<text x="${x}" y="${M.top + plotH + 16}" text-anchor="middle" font-size="10" fill="#555">${ppm}</text>`);
  }
  lines.push(`<text x="${M.left + plotW / 2}" y="${M.top + plotH + 30}" text-anchor="middle" font-size="9" fill="#777">\u03B4 (ppm)</text>`);

  // Compute envelope
  const nPts = 500;
  const spectrum = new Float64Array(nPts);
  let maxI = 0;
  for (const pk of prediction.peaks) {
    const nH = pk.atom_indices.length;
    for (let i = 0; i < nPts; i++) {
      const ppm = maxPpm - (i / (nPts - 1)) * ppmRange;
      const dx = ppm - pk.shift_ppm;
      const prev = spectrum[i] ?? 0;
      spectrum[i] = prev + nH / (1 + (dx / gamma) ** 2);
      const cur = spectrum[i] ?? 0;
      if (cur > maxI) maxI = cur;
    }
  }

  if (maxI > 0) {
    // Envelope path
    let d = '';
    for (let i = 0; i < nPts; i++) {
      const x = M.left + (i / (nPts - 1)) * plotW;
      const y = M.top + plotH - ((spectrum[i] ?? 0) / maxI) * plotH * 0.85;
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    d += `L${M.left + plotW},${M.top + plotH}L${M.left},${M.top + plotH}Z`;
    lines.push(`<path d="${d}" fill="rgba(30,100,200,0.08)" stroke="rgba(30,100,200,0.4)" stroke-width="1"/>`);

    // Peak stems + labels
    for (const pk of prediction.peaks) {
      const cx = ppmToX(pk.shift_ppm);
      const nH = pk.atom_indices.length;
      const peakY = M.top + plotH - (nH / (1 + 0) / maxI) * plotH * 0.85;
      const color = pk.confidence === 3 ? '#2b8a3e' : pk.confidence === 2 ? '#e67700' : '#c92a2a';
      lines.push(`<line x1="${cx}" y1="${M.top + plotH}" x2="${cx}" y2="${peakY}" stroke="${color}" stroke-width="1"/>`);
      lines.push(`<text x="${cx}" y="${peakY - 8}" text-anchor="middle" font-size="9" fill="#333">${pk.shift_ppm.toFixed(2)} ${pk.multiplicity}</text>`);
      lines.push(`<text x="${cx}" y="${M.top + plotH + 4}" text-anchor="middle" font-size="8" fill="#777">${nH}H</text>`);
    }
  }

  // Metadata footer
  lines.push(`<text x="20" y="${H - 8}" font-size="9" fill="#999">${prediction.nucleus} NMR | Solvent: ${prediction.solvent} | ${prediction.peaks.length} peaks | Kendraw</text>`);
  lines.push(`</svg>`);

  const blob = new Blob([lines.join('\n')], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nmr_${prediction.nucleus}_${prediction.solvent}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(prediction: NmrPrediction): void {
  const header = 'delta_ppm,multiplicity,J_Hz,integral,environment,confidence,method\n';
  const rows = prediction.peaks.map(p =>
    `${p.shift_ppm.toFixed(2)},${p.multiplicity},"${p.coupling_hz.map(j => j.toFixed(1)).join(';')}",${p.integral},${p.environment},${p.confidence},${p.method}`
  ).join('\n');
  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nmr_${prediction.nucleus}_${prediction.solvent}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function NmrPanel({ store, onClose, height, onHeightChange, highlightedAtomIds, onHighlightAtoms }: NmrPanelProps) {
  const [nucleus, setNucleus] = useState<Nucleus>('1H');
  const [solvent, setSolvent] = useState<SolventId>('CDCl3');
  const [prediction, setPrediction] = useState<NmrPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState<SpectrumViewport>({ minPpm: -0.5, maxPpm: 12 });
  const [dragSelect, setDragSelect] = useState<{ startX: number; endX: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [pinnedPeakIdx, setPinnedPeakIdx] = useState<number | null>(null);
  const [showNoise, setShowNoise] = useState(false);
  const panRef = useRef<{ startX: number; startVp: SpectrumViewport } | null>(null);

  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitBoxesRef = useRef<PeakHitBox[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const predictAbortRef = useRef<AbortController | null>(null);

  // Map mol block atom index → scene AtomId (mol block order = Object.values(page.atoms) order)
  const getAtomIds = useCallback((): AtomId[] => {
    const doc = store.getState();
    const page = doc.pages[doc.activePageIndex];
    if (!page) return [];
    return Object.keys(page.atoms) as AtomId[];
  }, [store]);

  // Peak click → highlight atoms on the molecule
  const handlePeakHighlight = useCallback((peakIdx: number | null) => {
    setSelectedPeakIdx(peakIdx);
    if (!onHighlightAtoms || !prediction) return;
    if (peakIdx === null) {
      onHighlightAtoms(new Set());
      return;
    }
    const peak = prediction.peaks[peakIdx];
    if (!peak?.parent_indices) {
      onHighlightAtoms(new Set());
      return;
    }
    const atomIds = getAtomIds();
    const highlighted = new Set<AtomId>();
    for (const pi of peak.parent_indices) {
      const id = atomIds[pi];
      if (id) highlighted.add(id);
    }
    onHighlightAtoms(highlighted);
  }, [onHighlightAtoms, prediction, getAtomIds]);

  // Reverse: when highlightedAtomIds changes from canvas → find matching peak
  useEffect(() => {
    if (!highlightedAtomIds || highlightedAtomIds.size === 0 || !prediction) return;
    const atomIds = getAtomIds();
    // Build reverse map: AtomId → mol block index
    const idToIdx = new Map<AtomId, number>();
    atomIds.forEach((id, i) => idToIdx.set(id, i));
    // Find which peak matches
    const highlightedIndices = new Set<number>();
    for (const id of highlightedAtomIds) {
      const idx = idToIdx.get(id);
      if (idx !== undefined) highlightedIndices.add(idx);
    }
    for (let pi = 0; pi < prediction.peaks.length; pi++) {
      const peak = prediction.peaks[pi];
      if (!peak?.parent_indices) continue;
      if (peak.parent_indices.some(idx => highlightedIndices.has(idx))) {
        setSelectedPeakIdx(pi);
        return;
      }
    }
  }, [highlightedAtomIds, prediction, getAtomIds]);

  // Signal navigation
  const navigateSignal = useCallback((direction: 1 | -1) => {
    if (!prediction || prediction.peaks.length === 0) return;
    const count = prediction.peaks.length;
    if (selectedPeakIdx === null) {
      setSelectedPeakIdx(direction === 1 ? 0 : count - 1);
    } else {
      setSelectedPeakIdx((selectedPeakIdx + direction + count) % count);
    }
  }, [prediction, selectedPeakIdx]);

  // Predict NMR
  const predict = useCallback(async () => {
    const doc = store.getState();
    const page = doc.pages[doc.activePageIndex];
    if (!page) return;

    const molBlock = getMolBlock(page);
    if (!molBlock) {
      setPrediction(null);
      setError(null);
      return;
    }

    predictAbortRef.current?.abort();
    const controller = new AbortController();
    predictAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.predictNmr(molBlock, 'mol', nucleus, solvent);
      if (controller.signal.aborted) return;
      setPrediction(result);
      setViewport(computeDefaultViewport(result));
      setSelectedPeakIdx(null);
      onHighlightAtoms?.(new Set());
      store.dispatch({ type: 'set-nmr-prediction', prediction: result });
    } catch (e) {
      if (controller.signal.aborted) return;
      const msg = e instanceof Error ? e.message : 'Prediction failed';
      setError(msg);
      setPrediction(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [store, nucleus, solvent]);

  // Predict on mount and when solvent changes
  useEffect(() => {
    void predict();
  }, [predict]);

  // Re-predict on document change (debounced)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = store.subscribe((_doc, diff) => {
      if (diff.type === 'nmr-prediction-set') return;
      clearTimeout(timer);
      timer = setTimeout(() => void predict(), 500);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [store, predict]);

  // Keyboard shortcuts for signal navigation + QW-8: Ctrl+Shift+E for PNG export
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab' && panelRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        navigateSignal(e.shiftKey ? -1 : 1);
      }
      if (e.key === 'E' && e.ctrlKey && e.shiftKey && prediction) {
        e.preventDefault();
        exportPng(prediction, viewport);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateSignal, prediction, viewport]);

  // Render spectrum
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    hitBoxesRef.current = renderSpectrum(ctx, prediction, {
      width: rect.width,
      height: rect.height,
      dpr,
      viewport,
      hoveredPeakIdx: pinnedPeakIdx ?? hoveredPeakIdx,
      selectedPeakIdx,
      solvent,
      showNoise,
    });
  }, [prediction, viewport, hoveredPeakIdx, selectedPeakIdx, height, solvent, showNoise, pinnedPeakIdx]);

  // Canvas mouse interactions
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isPanning && panRef.current) {
        const dx = x - panRef.current.startX;
        const ppmPerPx =
          (panRef.current.startVp.maxPpm - panRef.current.startVp.minPpm) /
          (rect.width - 88);
        const ppmDelta = dx * ppmPerPx;
        setViewport({
          minPpm: panRef.current.startVp.minPpm + ppmDelta,
          maxPpm: panRef.current.startVp.maxPpm + ppmDelta,
        });
        return;
      }

      if (dragSelect) {
        setDragSelect({ ...dragSelect, endX: x });
        return;
      }

      const hit = hitTestPeaks(hitBoxesRef.current, x, y);
      setHoveredPeakIdx(hit);
      setTooltipPos(hit !== null ? { x: e.clientX, y: e.clientY } : null);
      canvas.style.cursor = hit !== null ? 'pointer' : 'default';
    },
    [isPanning, dragSelect],
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsPanning(true);
        panRef.current = { startX: x, startVp: { ...viewport } };
        return;
      }

      const hit = hitTestPeaks(hitBoxesRef.current, x, y);
      if (hit !== null) {
        // QW-5: Toggle pin on click
        setPinnedPeakIdx(prev => prev === hit ? null : hit);
        handlePeakHighlight(hit);
      } else {
        setPinnedPeakIdx(null);
        handlePeakHighlight(null);
        setDragSelect({ startX: x, endX: x });
      }
    },
    [viewport],
  );

  const handleCanvasMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        setIsPanning(false);
        panRef.current = null;
        return;
      }

      if (dragSelect) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const plotW = rect.width - 88;
          const minX = Math.min(dragSelect.startX, dragSelect.endX) - 44;
          const maxX = Math.max(dragSelect.startX, dragSelect.endX) - 44;

          if (Math.abs(dragSelect.endX - dragSelect.startX) > 10) {
            const ppmRange = viewport.maxPpm - viewport.minPpm;
            const newMax = viewport.maxPpm - (minX / plotW) * ppmRange;
            const newMin = viewport.maxPpm - (maxX / plotW) * ppmRange;
            if (newMax > newMin) {
              setViewport({ minPpm: newMin, maxPpm: newMax });
            }
          }
        }
        setDragSelect(null);
      }
    },
    [isPanning, dragSelect, viewport],
  );

  const handleCanvasDoubleClick = useCallback(() => {
    if (prediction) {
      setViewport(computeDefaultViewport(prediction));
    }
  }, [prediction]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const frac = (x - 44) / (rect.width - 88);
      const ppmRange = viewport.maxPpm - viewport.minPpm;
      const centerPpm = viewport.maxPpm - frac * ppmRange;
      const factor = e.deltaY > 0 ? 1.15 : 0.87;
      const newRange = ppmRange * factor;
      setViewport({
        minPpm: centerPpm - (1 - frac) * newRange,
        maxPpm: centerPpm + frac * newRange,
      });
    },
    [viewport],
  );

  // Resize drag handle
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startH: height };
      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = dragRef.current.startY - ev.clientY;
        const maxH = window.innerHeight * MAX_HEIGHT_RATIO;
        onHeightChange(Math.max(MIN_HEIGHT, Math.min(maxH, dragRef.current.startH + delta)));
      };
      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [height, onHeightChange],
  );

  const selectedPeak = prediction && selectedPeakIdx !== null ? prediction.peaks[selectedPeakIdx] : null;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--kd-glass-bg, rgba(30, 30, 30, 0.75))',
        backdropFilter: 'var(--kd-glass-blur, blur(12px))',
        borderTop: '1px solid var(--kd-glass-border, rgba(255, 255, 255, 0.06))',
        overflow: 'hidden',
        animation: 'nmr-slide-up 320ms ease-out',
        outline: 'none',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        style={{
          height: 6,
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 32, height: 3, borderRadius: 2, background: 'var(--kd-color-border, #333)' }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          height: 32,
          flexShrink: 0,
          borderBottom: '1px solid var(--kd-color-border-subtle, #2a2a2a)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--kd-color-text-primary, #e0e0e0)',
              letterSpacing: '0.02em',
            }}
          >
            NMR
            {loading && (
              <span
                style={{
                  marginLeft: 6,
                  color: 'var(--kd-color-accent, #4dabf7)',
                  animation: 'nmr-pulse 1.5s ease-in-out infinite',
                }}
              >
                ...
              </span>
            )}
          </span>

          {/* Nucleus tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {(['1H', '13C'] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNucleus(n)}
                disabled={false}
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  fontFamily: 'var(--kd-font-mono, monospace)',
                  border: 'none',
                  borderRadius: 'var(--kd-radius-sm, 4px)',
                  cursor: 'pointer',
                  background:
                    nucleus === n
                      ? 'var(--kd-color-accent-muted, rgba(77, 171, 247, 0.15))'
                      : 'transparent',
                  color:
                    nucleus === n
                      ? 'var(--kd-color-accent, #4dabf7)'
                      : 'var(--kd-color-text-secondary, #a0a0a0)',
                  opacity: 1,
                }}
              >
                {n === '1H' ? '\u00B9H' : '\u00B9\u00B3C'}
              </button>
            ))}
          </div>

          {/* Solvent dropdown */}
          <select
            value={solvent}
            onChange={(e) => setSolvent(e.target.value as SolventId)}
            style={{
              padding: '2px 4px',
              fontSize: 10,
              fontFamily: 'var(--kd-font-mono, monospace)',
              background: 'var(--kd-color-bg-secondary, #1a1a1a)',
              color: 'var(--kd-color-text-secondary, #a0a0a0)',
              border: '1px solid var(--kd-color-border, #333)',
              borderRadius: 'var(--kd-radius-sm, 4px)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {SOLVENTS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Peak count */}
          {prediction && prediction.peaks.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--kd-color-text-muted, #666)' }}>
              {prediction.peaks.length} peak{prediction.peaks.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Signal navigation */}
          {prediction && prediction.peaks.length > 1 && (
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <button
                onClick={() => navigateSignal(-1)}
                style={{
                  width: 20, height: 20,
                  border: '1px solid var(--kd-color-border, #333)',
                  borderRadius: 'var(--kd-radius-sm, 4px)',
                  background: 'transparent',
                  color: 'var(--kd-color-text-secondary, #a0a0a0)',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                title="Previous signal (Shift+Tab)"
              >
                {'\u25C0'}
              </button>
              <span style={{ fontSize: 9, color: 'var(--kd-color-text-muted, #666)', minWidth: 24, textAlign: 'center' }}>
                {selectedPeakIdx !== null ? `${selectedPeakIdx + 1}/${prediction.peaks.length}` : '-'}
              </span>
              <button
                onClick={() => navigateSignal(1)}
                style={{
                  width: 20, height: 20,
                  border: '1px solid var(--kd-color-border, #333)',
                  borderRadius: 'var(--kd-radius-sm, 4px)',
                  background: 'transparent',
                  color: 'var(--kd-color-text-secondary, #a0a0a0)',
                  cursor: 'pointer',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                title="Next signal (Tab)"
              >
                {'\u25B6'}
              </button>
            </div>
          )}

          {/* CSV export */}
          {prediction && prediction.peaks.length > 0 && (
            <button
              onClick={() => exportCsv(prediction)}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                border: '1px solid var(--kd-color-border, #333)',
                borderRadius: 'var(--kd-radius-sm, 4px)',
                background: 'transparent',
                color: 'var(--kd-color-text-secondary, #a0a0a0)',
                cursor: 'pointer',
              }}
              title="Export signal table as CSV"
            >
              CSV
            </button>
          )}

          {/* PNG export */}
          {prediction && prediction.peaks.length > 0 && (
            <button
              onClick={() => exportPng(prediction, viewport)}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                border: '1px solid var(--kd-color-border, #333)',
                borderRadius: 'var(--kd-radius-sm, 4px)',
                background: 'transparent',
                color: 'var(--kd-color-text-secondary, #a0a0a0)',
                cursor: 'pointer',
              }}
              title="Export spectrum as PNG (Ctrl+Shift+E)"
            >
              PNG
            </button>
          )}

          {/* F-2: SVG export */}
          {prediction && prediction.peaks.length > 0 && (
            <button
              onClick={() => exportSvg(prediction, viewport)}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                border: '1px solid var(--kd-color-border, #333)',
                borderRadius: 'var(--kd-radius-sm, 4px)',
                background: 'transparent',
                color: 'var(--kd-color-text-secondary, #a0a0a0)',
                cursor: 'pointer',
              }}
              title="Export spectrum as SVG for publication"
            >
              SVG
            </button>
          )}

          {/* QW-10: Noise toggle */}
          <button
            onClick={() => setShowNoise(n => !n)}
            style={{
              padding: '2px 6px',
              fontSize: 10,
              border: '1px solid var(--kd-color-border, #333)',
              borderRadius: 'var(--kd-radius-sm, 4px)',
              background: showNoise ? 'var(--kd-color-accent-muted, rgba(77, 171, 247, 0.15))' : 'transparent',
              color: showNoise ? 'var(--kd-color-accent, #4dabf7)' : 'var(--kd-color-text-secondary, #a0a0a0)',
              cursor: 'pointer',
            }}
            title="Toggle baseline noise simulation"
          >
            Noise
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--kd-color-text-muted, #666)',
            cursor: 'pointer',
            fontSize: 16,
            padding: '0 4px',
            lineHeight: 1,
          }}
          title="Close NMR panel (Ctrl+M)"
        >
          {'\u00D7'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: '4px 12px',
            fontSize: 11,
            color: 'var(--kd-color-danger, #ff6b6b)',
            background: 'rgba(255, 107, 107, 0.08)',
          }}
        >
          {error}
        </div>
      )}

      {/* Selected peak info bar */}
      {selectedPeak && (
        <div
          style={{
            padding: '3px 12px',
            fontSize: 10,
            fontFamily: 'var(--kd-font-mono, monospace)',
            color: 'var(--kd-color-text-secondary, #a0a0a0)',
            background: 'rgba(77, 171, 247, 0.05)',
            borderBottom: '1px solid var(--kd-color-border-subtle, #2a2a2a)',
            display: 'flex',
            gap: 12,
          }}
        >
          <span style={{ color: 'var(--kd-color-accent, #4dabf7)', fontWeight: 600 }}>H{selectedPeak.proton_group_id}</span>
          <span>{'\u03B4'} {selectedPeak.shift_ppm.toFixed(2)} ppm</span>
          <span>{selectedPeak.integral}H</span>
          <span>{formatMultiplicity(selectedPeak.multiplicity, selectedPeak.coupling_hz)}</span>
          <span style={{ color: 'var(--kd-color-text-muted, #666)' }}>{selectedPeak.environment}</span>
        </div>
      )}

      {/* Spectrum canvas with tooltip overlay */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
          onWheel={handleWheel}
          onMouseLeave={() => { setHoveredPeakIdx(null); setTooltipPos(null); }}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Confidence tooltip — Sally's 3-tier design (with pin support QW-5) */}
        {(pinnedPeakIdx ?? hoveredPeakIdx) !== null && tooltipPos && prediction && (() => {
          const activeIdx = pinnedPeakIdx ?? hoveredPeakIdx;
          if (activeIdx === null) return null;
          const peak = prediction.peaks[activeIdx];
          if (!peak) return null;
          const conf = CONF_LABELS[peak.confidence] ?? { label: 'Unknown', color: '#888888' };
          const panelRect = panelRef.current?.getBoundingClientRect();
          if (!panelRect) return null;
          const tx = tooltipPos.x - panelRect.left + 16;
          const ty = tooltipPos.y - panelRect.top - 80;
          return (
            <div
              style={{
                position: 'absolute',
                left: Math.min(tx, panelRect.width - 220),
                top: Math.max(ty, 4),
                width: 200,
                padding: '8px 10px',
                background: 'rgba(20, 20, 20, 0.88)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderLeft: `3px solid ${conf.color}`,
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                pointerEvents: pinnedPeakIdx !== null ? 'auto' : 'none',
                zIndex: 10,
                fontFamily: 'var(--kd-font-mono, monospace)',
              }}
            >
              {/* Tier 1: Headline — H# + shift + assignment */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>
                <span style={{ color: '#4dabf7', marginRight: 4 }}>H{peak.proton_group_id}</span>
                {peak.shift_ppm.toFixed(2)} ppm
                <span style={{ fontWeight: 400, color: '#a0a0a0', marginLeft: 6, fontSize: 11 }}>
                  {peak.integral}H {formatEnvironment(peak.environment)}
                </span>
              </div>

              {/* Tier 2: Signal — multiplicity + J */}
              <div style={{ fontSize: 10, color: '#999', marginBottom: 6 }}>
                {formatMultiplicity(peak.multiplicity, peak.coupling_hz)}
              </div>

              {/* Tier 3: Trust layer — confidence bar + label + method */}
              <div style={{ marginBottom: 4 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {/* Confidence bar */}
                  <div style={{
                    width: 48, height: 5, borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(peak.confidence / 3) * 100}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: conf.color,
                    }} />
                  </div>
                  <span style={{ fontSize: 9, color: conf.color }}>
                    {conf.label}
                  </span>
                </div>
              </div>

              {/* Method line */}
              <div style={{ fontSize: 9, color: '#666' }}>
                {peak.method}
              </div>
            </div>
          );
        })()}
      </div>

      {/* F-5: Enhanced signal table */}
      {prediction && prediction.peaks.length > 0 && (
        <div style={{
          maxHeight: Math.max(height * 0.3, 60),
          overflowY: 'auto',
          borderTop: '1px solid var(--kd-color-border-subtle, #2a2a2a)',
          flexShrink: 0,
        }}>
          <table style={{
            width: '100%',
            fontSize: 9,
            fontFamily: 'var(--kd-font-mono, monospace)',
            borderCollapse: 'collapse',
            color: 'var(--kd-color-text-secondary, #a0a0a0)',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--kd-color-border-subtle, #2a2a2a)' }}>
                <th style={{ padding: '2px 6px', textAlign: 'left', color: 'var(--kd-color-text-muted, #666)' }}>H#</th>
                <th style={{ padding: '2px 6px', textAlign: 'right', color: 'var(--kd-color-text-muted, #666)' }}>{'\u03B4'} (ppm)</th>
                <th style={{ padding: '2px 6px', textAlign: 'center', color: 'var(--kd-color-text-muted, #666)' }}>Mult.</th>
                <th style={{ padding: '2px 6px', textAlign: 'right', color: 'var(--kd-color-text-muted, #666)' }}>J (Hz)</th>
                <th style={{ padding: '2px 6px', textAlign: 'center', color: 'var(--kd-color-text-muted, #666)' }}>Int.</th>
                <th style={{ padding: '2px 6px', textAlign: 'left', color: 'var(--kd-color-text-muted, #666)' }}>Assignment</th>
                <th style={{ padding: '2px 6px', textAlign: 'center', color: 'var(--kd-color-text-muted, #666)' }}>Conf.</th>
              </tr>
            </thead>
            <tbody>
              {prediction.peaks.map((pk, idx) => {
                const confInfo = CONF_LABELS[pk.confidence] ?? { label: '?', color: '#888' };
                const isActive = selectedPeakIdx === idx;
                return (
                  <tr
                    key={idx}
                    onClick={() => handlePeakHighlight(idx)}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? 'rgba(77, 171, 247, 0.1)' : 'transparent',
                      borderBottom: '1px solid var(--kd-color-border-subtle, #1a1a1a)',
                    }}
                  >
                    <td style={{ padding: '2px 6px', color: 'var(--kd-color-accent, #4dabf7)', fontWeight: 600 }}>H{pk.proton_group_id}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{pk.shift_ppm.toFixed(2)}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'center' }}>{pk.multiplicity}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'right' }}>{pk.coupling_hz.length > 0 ? pk.coupling_hz.map(j => j.toFixed(1)).join(', ') : '\u2014'}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'center' }}>{pk.integral}H</td>
                    <td style={{ padding: '2px 6px' }}>{formatEnvironment(pk.environment)}</td>
                    <td style={{ padding: '2px 6px', textAlign: 'center', color: confInfo.color }}>{pk.confidence === 3 ? '\u25CF' : pk.confidence === 2 ? '\u25D1' : '\u25CB'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QW-6: Version footer */}
      <div style={{
        padding: '2px 12px',
        fontSize: 8,
        color: 'var(--kd-color-text-muted, #555)',
        textAlign: 'right',
        flexShrink: 0,
        borderTop: '1px solid var(--kd-color-border-subtle, #1a1a1a)',
      }}>
        Kendraw NMR v0.2.0 — Additive prediction engine
      </div>

      <style>{`
        @keyframes nmr-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes nmr-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes nmr-slide-up { from { opacity: 0; } to { opacity: 1; } }
          @keyframes nmr-pulse { from { opacity: 1; } to { opacity: 1; } }
        }
      `}</style>
    </div>
  );
}
