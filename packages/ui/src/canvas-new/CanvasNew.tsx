// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-01 — shell component for the new canvas.
// Wave-4 W4-R-02 — wired to the Tool dispatcher and a default registry.

import { useMemo, useRef, useState } from 'react';
import type { SceneStore, AtomId, BondId, Point } from '@kendraw/scene';
import { ToolRegistry, noopSelectTool } from './toolRegistry';
import type { ToolContext } from './types';
import { useToolDispatcher } from './useToolDispatcher';

export interface CanvasNewProps {
  store: SceneStore;
  onMoleculeSearch?: (() => void) | undefined;
  onImportFile?: (() => void) | undefined;
  showPropertyPanel?: boolean | undefined;
  nmrOpen?: boolean | undefined;
  onNmrToggle?: (() => void) | undefined;
  highlightedAtomIds?: Set<AtomId> | undefined;
  onHighlightAtoms?: ((ids: Set<AtomId>) => void) | undefined;
  onSelectionChange?: ((atomIds: AtomId[]) => void) | undefined;
  theme?: 'dark' | 'light' | undefined;
}

export function CanvasNew(props: CanvasNewProps): JSX.Element {
  const { store } = props;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);

  const registry = useMemo(() => {
    const r = new ToolRegistry();
    r.register(noopSelectTool);
    r.activate('select');
    return r;
  }, []);

  const context = useMemo<ToolContext>(() => ({
    store,
    worldFromScreen: (x: number, y: number): Point => ({ x, y }),
    hitTestAtom: (_world: Point): AtomId | null => null,
    hitTestBond: (_world: Point): BondId | null => null,
    requestRepaint: () => { /* no-op until W4-R-03 */ },
  }), [store]);

  useToolDispatcher({ target: canvasEl, registry, context });

  return (
    <>
      <div style={{ gridArea: 'toolbar' }} data-testid="canvas-new-toolbar" />
      <div
        ref={(el) => {
          canvasRef.current = el;
          setCanvasEl(el);
        }}
        style={{
          gridArea: 'canvas',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: 'var(--kd-color-text-muted)',
          fontFamily: 'system-ui, sans-serif',
          touchAction: 'none',
        }}
        data-testid="canvas-new-root"
        data-active-tool={registry.getActiveId() ?? ''}
        role="region"
        aria-label="New canvas (wave-4 redraw, shell)"
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          Kendraw new canvas — wave-4 redraw
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Shell + tool dispatcher (W4-R-01/R-02). Rendering lands in W4-R-03.
        </div>
      </div>
      <div style={{ gridArea: 'properties' }} data-testid="canvas-new-properties" />
      <div style={{ gridArea: 'status' }} data-testid="canvas-new-status" />
    </>
  );
}

export default CanvasNew;
