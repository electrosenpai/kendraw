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

interface NmrPanelProps {
  store: SceneStore;
  onClose: () => void;
  height: number;
  onHeightChange: (h: number) => void;
}

const apiClient = new KendrawApiClient();
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

export default function NmrPanel({ store, onClose, height, onHeightChange }: NmrPanelProps) {
  const [nucleus, setNucleus] = useState<Nucleus>('1H');
  const [prediction, setPrediction] = useState<NmrPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number | null>(null);
  const [viewport, setViewport] = useState<SpectrumViewport>({ minPpm: -0.5, maxPpm: 12 });
  const [dragSelect, setDragSelect] = useState<{ startX: number; endX: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef<{ startX: number; startVp: SpectrumViewport } | null>(null);

  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitBoxesRef = useRef<PeakHitBox[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const predictAbortRef = useRef<AbortController | null>(null);

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

    // Abort previous in-flight request
    predictAbortRef.current?.abort();
    const controller = new AbortController();
    predictAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.predictNmr(molBlock, 'mol', nucleus);
      if (controller.signal.aborted) return;
      setPrediction(result);
      setViewport(computeDefaultViewport(result));
      store.dispatch({ type: 'set-nmr-prediction', prediction: result });
    } catch (e) {
      if (controller.signal.aborted) return;
      const msg = e instanceof Error ? e.message : 'Prediction failed';
      setError(msg);
      setPrediction(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [store, nucleus]);

  // Predict on mount
  useEffect(() => {
    void predict();
  }, [predict]);

  // Re-predict on document change (debounced)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = store.subscribe((_doc, diff) => {
      // Only re-predict on structural changes, not on nmr-prediction-set
      if (diff.type === 'nmr-prediction-set') return;
      clearTimeout(timer);
      timer = setTimeout(() => void predict(), 500);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [store, predict]);

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
      hoveredPeakIdx,
      selectedPeakIdx,
    });
  }, [prediction, viewport, hoveredPeakIdx, selectedPeakIdx, height]);

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
          (rect.width - 88); // margins
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

      // Right-click or middle-click for pan
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        e.preventDefault();
        setIsPanning(true);
        panRef.current = { startX: x, startVp: { ...viewport } };
        return;
      }

      const hit = hitTestPeaks(hitBoxesRef.current, x, y);
      if (hit !== null) {
        setSelectedPeakIdx(hit);
        // Highlight atoms on canvas
        if (prediction) {
          const peak = prediction.peaks[hit];
          if (peak) {
            // Dispatch highlighted atoms via nmr-prediction-set
            // The atom_indices from the prediction refer to H atoms in the AddHs molecule,
            // but we need the parent heavy-atom indices from the scene
            // For now, use the peak data as-is — the atom_indices are AddHs indices
            // TODO: map to scene atom IDs in Epic 2
          }
        }
      } else {
        setSelectedPeakIdx(null);
        // Start drag-select for zoom
        setDragSelect({ startX: x, endX: x });
      }
    },
    [viewport, prediction],
  );

  const handleCanvasMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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

          // Only zoom if drag was significant (>10px)
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

  // Double-click to reset zoom
  const handleCanvasDoubleClick = useCallback(() => {
    if (prediction) {
      setViewport(computeDefaultViewport(prediction));
    }
  }, [prediction]);

  // Scroll to zoom
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

  return (
    <div
      ref={panelRef}
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--kd-glass-bg, rgba(30, 30, 30, 0.75))',
        backdropFilter: 'var(--kd-glass-blur, blur(12px))',
        borderTop: '1px solid var(--kd-glass-border, rgba(255, 255, 255, 0.06))',
        overflow: 'hidden',
        animation: 'nmr-slide-up 320ms ease-out',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--kd-color-text-primary, #e0e0e0)',
              letterSpacing: '0.02em',
            }}
          >
            NMR Prediction
            {loading && (
              <span
                style={{
                  marginLeft: 8,
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
                onClick={() => n === '1H' && setNucleus(n)}
                disabled={n === '13C'}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  fontFamily: 'var(--kd-font-mono, monospace)',
                  border: 'none',
                  borderRadius: 'var(--kd-radius-sm, 4px)',
                  cursor: n === '13C' ? 'not-allowed' : 'pointer',
                  background:
                    nucleus === n
                      ? 'var(--kd-color-accent-muted, rgba(77, 171, 247, 0.15))'
                      : 'transparent',
                  color:
                    n === '13C'
                      ? 'var(--kd-color-text-muted, #666)'
                      : nucleus === n
                        ? 'var(--kd-color-accent, #4dabf7)'
                        : 'var(--kd-color-text-secondary, #a0a0a0)',
                  opacity: n === '13C' ? 0.5 : 1,
                }}
              >
                {n === '1H' ? '\u00B9H' : '\u00B9\u00B3C'}
              </button>
            ))}
          </div>

          {/* Peak count */}
          {prediction && prediction.peaks.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--kd-color-text-muted, #666)' }}>
              {prediction.peaks.length} peak{prediction.peaks.length !== 1 ? 's' : ''}
            </span>
          )}
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
          title="Close NMR panel (Ctrl+Shift+N)"
        >
          \u00D7
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

      {/* Spectrum canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
        style={{ flex: 1, width: '100%', minHeight: 0 }}
      />

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
