// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-01 — shell component for the new canvas.
// Wave-4 W4-R-02 — wired to the Tool dispatcher and a default registry.
// Wave-4 W4-R-03 — render parity: mounts the shared CanvasRenderer and
// subscribes to the SceneStore so existing molecules draw identically to the
// legacy Canvas. Hit-testing and interactive tools land in W4-R-04+.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SceneStore, AtomId, BondId, Point } from '@kendraw/scene';
import { CanvasRenderer } from '@kendraw/renderer-canvas';
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
  const { store, theme = 'dark', highlightedAtomIds } = props;
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

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
    requestRepaint: () => {
      const r = rendererRef.current;
      if (r) r.render(store.getState());
    },
  }), [store]);

  useToolDispatcher({ target: canvasEl, registry, context });

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    if (typeof document === 'undefined') return;
    const renderer = new CanvasRenderer();
    renderer.setTheme(theme);
    renderer.attach(host);
    rendererRef.current = renderer;
    renderer.render(store.getState());
    const unsubscribe = store.subscribe(() => {
      renderer.render(store.getState());
    });
    return () => {
      unsubscribe();
      renderer.detach();
      rendererRef.current = null;
    };
  }, [canvasEl, store, theme]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.setHighlightedAtoms(highlightedAtomIds ?? new Set<AtomId>());
  }, [highlightedAtomIds]);

  return (
    <>
      <div style={{ gridArea: 'toolbar' }} data-testid="canvas-new-toolbar" />
      <div
        ref={(el) => {
          canvasHostRef.current = el;
          setCanvasEl(el);
        }}
        style={{
          gridArea: 'canvas',
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          touchAction: 'none',
        }}
        data-testid="canvas-new-root"
        data-active-tool={registry.getActiveId() ?? ''}
        role="region"
        aria-label="New canvas (wave-4 redraw)"
      />
      <div style={{ gridArea: 'properties' }} data-testid="canvas-new-properties" />
      <div style={{ gridArea: 'status' }} data-testid="canvas-new-status" />
    </>
  );
}

export default CanvasNew;
