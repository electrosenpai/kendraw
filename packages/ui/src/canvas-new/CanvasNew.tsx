// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-01 — shell component for the new canvas. Accepts the same
// props as the legacy <Canvas/> so App.tsx can swap between them via the
// VITE_ENABLE_NEW_CANVAS feature flag without touching any other wiring.
// Parity rendering, tool abstraction, hoverIcon etc. land in subsequent
// wave-4 stories (R-02 to R-08).

import type { SceneStore, AtomId } from '@kendraw/scene';

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

export function CanvasNew(_props: CanvasNewProps): JSX.Element {
  return (
    <>
      <div style={{ gridArea: 'toolbar' }} data-testid="canvas-new-toolbar" />
      <div
        style={{
          gridArea: 'canvas',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          color: 'var(--kd-color-text-muted)',
          fontFamily: 'system-ui, sans-serif',
        }}
        data-testid="canvas-new-root"
        role="region"
        aria-label="New canvas (wave-4 redraw, shell)"
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          Kendraw new canvas — wave-4 redraw
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Shell only (W4-R-01). Interactions land in W4-R-02+.
        </div>
      </div>
      <div style={{ gridArea: 'properties' }} data-testid="canvas-new-properties" />
      <div style={{ gridArea: 'status' }} data-testid="canvas-new-status" />
    </>
  );
}

export default CanvasNew;
