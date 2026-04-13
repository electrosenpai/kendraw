import { useState, useEffect, useRef, useCallback } from 'react';
import type { SceneStore, NmrPrediction, Page } from '@kendraw/scene';
import { KendrawApiClient } from '@kendraw/api-client';
import { writeMolV2000 } from '@kendraw/io';

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

function getPageSmiles(page: Page): string | null {
  const atoms = Object.values(page.atoms);
  const bonds = Object.values(page.bonds);
  if (atoms.length === 0) return null;
  try {
    const molBlock = writeMolV2000(atoms, bonds);
    return molBlock;
  } catch {
    return null;
  }
}

export default function NmrPanel({ store, onClose, height, onHeightChange }: NmrPanelProps) {
  const [nucleus, setNucleus] = useState<Nucleus>('1H');
  const [prediction, setPrediction] = useState<NmrPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-predict on mount and when document changes
  const predict = useCallback(async () => {
    const doc = store.getState();
    const page = doc.pages[doc.activePageIndex];
    if (!page) return;

    const molBlock = getPageSmiles(page);
    if (!molBlock) {
      setPrediction(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.predictNmr(molBlock, 'mol', nucleus);
      setPrediction(result);
      store.dispatch({ type: 'set-nmr-prediction', prediction: result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Prediction failed';
      setError(msg);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  }, [store, nucleus]);

  // Predict on mount
  useEffect(() => {
    void predict();
  }, [predict]);

  // Re-predict when document changes
  useEffect(() => {
    return store.subscribe(() => {
      void predict();
    });
  }, [store, predict]);

  // Resize drag handle
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startH: height };

      const handleDragMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const delta = dragRef.current.startY - ev.clientY;
        const maxH = window.innerHeight * MAX_HEIGHT_RATIO;
        const newH = Math.max(MIN_HEIGHT, Math.min(maxH, dragRef.current.startH + delta));
        onHeightChange(newH);
      };

      const handleDragEnd = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };

      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    },
    [height, onHeightChange],
  );

  // Simple spectrum rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'var(--kd-color-bg-primary, #0a0a0a)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (!prediction || prediction.peaks.length === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        loading ? 'Predicting...' : 'Draw a molecule to see its NMR spectrum',
        rect.width / 2,
        rect.height / 2,
      );
      return;
    }

    // Determine ppm range
    const shifts = prediction.peaks.map((p) => p.shift_ppm);
    const minPpm = Math.max(0, Math.min(...shifts) - 1);
    const maxPpm = Math.max(...shifts) + 1;

    const margin = { top: 20, right: 40, bottom: 30, left: 40 };
    const plotW = rect.width - margin.left - margin.right;
    const plotH = rect.height - margin.top - margin.bottom;

    // ppm to x (inverted: high ppm on left)
    const ppmToX = (ppm: number) => margin.left + ((maxPpm - ppm) / (maxPpm - minPpm)) * plotW;

    // Draw axis
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#888888';
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    const step = maxPpm - minPpm > 8 ? 2 : 1;
    for (let ppm = Math.ceil(minPpm); ppm <= Math.floor(maxPpm); ppm += step) {
      const x = ppmToX(ppm);
      ctx.fillText(`${ppm}`, x, margin.top + plotH + 16);
      ctx.beginPath();
      ctx.moveTo(x, margin.top + plotH);
      ctx.lineTo(x, margin.top + plotH + 4);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#666666';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('δ (ppm)', margin.left + plotW / 2, margin.top + plotH + 28);

    // Draw Lorentzian peaks
    const confColors: Record<number, string> = {
      3: '#51cf66', // green — high confidence
      2: '#ffd43b', // yellow — medium
      1: '#ff6b6b', // red — low
    };

    for (const peak of prediction.peaks) {
      const cx = ppmToX(peak.shift_ppm);
      const color = confColors[peak.confidence] ?? '#888888';
      const peakHeight = plotH * 0.8;

      // Lorentzian shape
      const halfWidth = 0.03 * (plotW / (maxPpm - minPpm));
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top + plotH);
      for (let px = margin.left; px <= margin.left + plotW; px += 1) {
        const dx = px - cx;
        const lor = peakHeight / (1 + (dx / halfWidth) ** 2);
        ctx.lineTo(px, margin.top + plotH - lor);
      }
      ctx.lineTo(margin.left + plotW, margin.top + plotH);
      ctx.closePath();
      ctx.fillStyle = color + '30';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Peak label
      ctx.fillStyle = '#cccccc';
      ctx.font = '10px "JetBrains Mono", "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${peak.shift_ppm.toFixed(1)}`, cx, margin.top + plotH - peakHeight - 4);
    }
  }, [prediction, loading, height]);

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
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 3,
            borderRadius: 2,
            background: 'var(--kd-color-border, #333)',
          }}
        />
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
                {n === '1H' ? '¹H' : '¹³C'}
              </button>
            ))}
          </div>
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
          ×
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
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
        }}
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
          @keyframes nmr-slide-up {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes nmr-pulse {
            from { opacity: 1; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
