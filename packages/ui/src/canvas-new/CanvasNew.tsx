// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
//
// Wave-4 W4-R-01 — shell component for the new canvas.
// Wave-4 W4-R-02 — wired to the Tool dispatcher and a default registry.
// Wave-4 W4-R-03 — render parity: mounts the shared CanvasRenderer and
// subscribes to the SceneStore so existing molecules draw identically to the
// legacy Canvas. Hit-testing and interactive tools land in W4-R-04+.
// Wave-5 W4-R-04 — bond-tool hover preview overlay (SVG above the canvas).
// Wave-5 W4-R-07 — drag-move ghost overlay (transient atom translation
// without store mutation; single move-batch dispatched on pointerup).
// Wave-5 W4-R-08 — quick-edit hotkeys driven by hovered atom.
// Wave-5 W4-R-11 — Delete / Backspace removes current selection.
// Wave-5 W4-R-12 — wheel-to-zoom anchored at the cursor.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AtomId,
  BondId,
  Command,
  Document,
  Page,
  Point,
  SceneStore,
} from '@kendraw/scene';
import { SpatialIndex } from '@kendraw/scene';
import { CanvasRenderer } from '@kendraw/renderer-canvas';
import { ToolRegistry } from './toolRegistry';
import type { DragOffset, SelectionRect, ToolContext } from './types';
import { useToolDispatcher } from './useToolDispatcher';
import { createMarqueeSelectTool } from './tools/marqueeSelectTool';
import { createBondTool } from './tools/bondTool';
import { createAtomTool } from './tools/atomTool';
import { createRingTool } from './tools/ringTool';
import { createEraseTool } from './tools/eraseTool';
import { createTextTool } from './tools/textTool';
import { createArrowTool } from './tools/arrowTool';
import { hitTestBond, type HoverPreview } from './bondPreview';
import { HoverIconOverlay } from './HoverIconOverlay';
import { resolveQuickEditCommand } from './quickEdit';
import { computeFitViewport } from './fitToView';
import { isEditingTextNow } from '../hooks/useIsEditingText';

export type CanvasNewToolId =
  | 'select'
  | 'bond-single'
  | 'bond-double'
  | 'bond-triple'
  | 'atom-c'
  | 'atom-h'
  | 'atom-n'
  | 'atom-o'
  | 'atom-s'
  | 'ring-benzene'
  | 'ring-cyclohexane'
  | 'text'
  | 'arrow'
  | 'erase';

/** Imperative handle exposed to the App shell so the wave-7 toolbox's
 *  fit-to-view action can recenter the scene without the canvas having to
 *  subscribe to a shared store. */
export interface CanvasNewHandle {
  fitToView: () => void;
}

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
  /** Active tool on mount. Defaults to 'select'. Wave-5 stories make 'bond'
   *  and 'quick-edit' available; the toolbar UI lands in wave-6. */
  defaultToolId?: CanvasNewToolId;
  /** Controlled active tool — when provided, overrides `defaultToolId` and
   *  syncs the registry on every change. Used by the wave-5 hotfix so an
   *  external <NewToolbox /> can drive tool selection. */
  activeToolId?: CanvasNewToolId | undefined;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.1;

export const CanvasNew = forwardRef<CanvasNewHandle, CanvasNewProps>(function CanvasNew(
  props,
  ref,
): JSX.Element {
  const {
    store,
    theme = 'dark',
    highlightedAtomIds,
    onSelectionChange,
    defaultToolId = 'select',
    activeToolId,
  } = props;
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const spatialRef = useRef<SpatialIndex>(new SpatialIndex());
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [dragOffset, setDragOffset] = useState<DragOffset | null>(null);
  const dragOffsetRef = useRef<DragOffset | null>(null);
  dragOffsetRef.current = dragOffset;
  const viewportRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const overlaySizeRef = useRef({ w: 0, h: 0 });
  const [overlayTick, setOverlayTick] = useState(0);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const selectedAtomsRef = useRef<Set<AtomId>>(new Set());
  // Passive hover tracking for keyboard-driven shortcuts (R-08, R-11).
  // Updated on every pointermove regardless of which tool is active.
  const hoveredAtomIdRef = useRef<AtomId | null>(null);
  const hoveredBondIdRef = useRef<BondId | null>(null);

  const registry = useMemo(() => {
    const r = new ToolRegistry();
    r.register(createMarqueeSelectTool());
    r.register(createBondTool({ id: 'bond-single', bondOrder: 1 }));
    r.register(createBondTool({ id: 'bond-double', bondOrder: 2 }));
    r.register(createBondTool({ id: 'bond-triple', bondOrder: 3 }));
    r.register(createAtomTool({ id: 'atom-c', element: 6 }));
    r.register(createAtomTool({ id: 'atom-h', element: 1 }));
    r.register(createAtomTool({ id: 'atom-n', element: 7 }));
    r.register(createAtomTool({ id: 'atom-o', element: 8 }));
    r.register(createAtomTool({ id: 'atom-s', element: 16 }));
    r.register(createRingTool({ id: 'ring-benzene', templateId: 'benzene' }));
    r.register(createRingTool({ id: 'ring-cyclohexane', templateId: 'cyclohexane' }));
    r.register(createTextTool());
    r.register(createArrowTool());
    r.register(createEraseTool());
    r.activate(defaultToolId);
    return r;
  }, [defaultToolId]);

  // Wave-5 hotfix: when `activeToolId` is provided (controlled mode), keep
  // the registry in sync with the parent. Uncontrolled mode keeps the
  // existing wave-4 default behavior.
  useEffect(() => {
    if (activeToolId !== undefined) {
      registry.activate(activeToolId);
    }
  }, [activeToolId, registry]);

  const renderEffective = useCallback((): void => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const doc = store.getState();
    const offset = dragOffsetRef.current;
    if (!offset || (offset.dx === 0 && offset.dy === 0)) {
      renderer.render(doc);
      return;
    }
    renderer.render(applyDragOffsetDoc(doc, offset));
  }, [store]);

  const context = useMemo<ToolContext>(() => ({
    store,
    worldFromScreen: (x: number, y: number): Point => {
      const v = viewportRef.current;
      return { x: (x - v.panX) / v.zoom, y: (y - v.panY) / v.zoom };
    },
    hitTestAtom: (world: Point): AtomId | null =>
      spatialRef.current.hitTest(world.x, world.y),
    hitTestBond: (world: Point): BondId | null => {
      const doc = store.getState();
      const page = doc.pages[doc.activePageIndex];
      if (!page) return null;
      return hitTestBond(page, world);
    },
    searchAtomsInRect: (p1: Point, p2: Point): readonly AtomId[] =>
      spatialRef.current.searchRect(p1.x, p1.y, p2.x, p2.y),
    setSelectedAtoms: (ids: ReadonlySet<AtomId>) => {
      selectedAtomsRef.current = new Set(ids);
      rendererRef.current?.setSelectedAtoms(new Set(ids));
      onSelectionChangeRef.current?.([...ids]);
    },
    getSelectedAtoms: (): ReadonlySet<AtomId> => selectedAtomsRef.current,
    setSelectionRect: (rect: SelectionRect | null) => {
      rendererRef.current?.setSelectionRect(rect);
    },
    requestRepaint: () => renderEffective(),
    setHoverPreview: (preview: HoverPreview | null) => {
      setHoverPreview(preview);
    },
    getActivePage: (): Page | null => {
      const doc = store.getState();
      return doc.pages[doc.activePageIndex] ?? null;
    },
    dispatch: (cmd: Command): void => {
      store.dispatch(cmd);
    },
    setDragOffset: (offset: DragOffset | null) => {
      dragOffsetRef.current = offset;
      setDragOffset(offset);
      renderEffective();
    },
    getViewport: () => ({ ...viewportRef.current }),
    setViewport: (view) => {
      viewportRef.current = { ...view };
      rendererRef.current?.setViewport(view.zoom, view.panX, view.panY);
      setOverlayTick((t) => t + 1);
    },
  }), [store, renderEffective]);

  useToolDispatcher({ target: canvasEl, registry, context });

  useImperativeHandle(
    ref,
    () => ({
      fitToView: (): void => {
        const host = canvasHostRef.current;
        if (!host) return;
        const rect = host.getBoundingClientRect === undefined
          ? { width: 0, height: 0 }
          : host.getBoundingClientRect();
        const doc = store.getState();
        const page = doc.pages[doc.activePageIndex] ?? null;
        const view = computeFitViewport(page, rect.width, rect.height);
        context.setViewport?.(view);
      },
    }),
    [context, store],
  );

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;
    if (typeof document === 'undefined') return;
    const renderer = new CanvasRenderer();
    renderer.setTheme(theme);
    renderer.attach(host);
    rendererRef.current = renderer;
    const rebuildIndex = (): void => {
      const doc = store.getState();
      const page = doc.pages[doc.activePageIndex];
      if (page) spatialRef.current.rebuild(page);
    };
    rebuildIndex();
    renderEffective();
    const unsubscribe = store.subscribe(() => {
      rebuildIndex();
      renderEffective();
    });
    return () => {
      unsubscribe();
      renderer.detach();
      rendererRef.current = null;
    };
  }, [canvasEl, store, theme, renderEffective]);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    r.setHighlightedAtoms(highlightedAtomIds ?? new Set<AtomId>());
  }, [highlightedAtomIds]);

  // Passive hover tracking — runs in addition to the active tool's
  // pointermove handler so quick-edit and delete shortcuts know which atom
  // / bond is currently under the cursor.
  useEffect(() => {
    const el = canvasEl;
    if (!el) return;
    const onMove = (e: PointerEvent): void => {
      const rect = el.getBoundingClientRect === undefined
        ? { left: 0, top: 0 }
        : el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const v = viewportRef.current;
      const wx = (sx - v.panX) / v.zoom;
      const wy = (sy - v.panY) / v.zoom;
      hoveredAtomIdRef.current = spatialRef.current.hitTest(wx, wy);
      const doc = store.getState();
      const page = doc.pages[doc.activePageIndex];
      hoveredBondIdRef.current = page ? hitTestBond(page, { x: wx, y: wy }) : null;
    };
    const onLeave = (): void => {
      hoveredAtomIdRef.current = null;
      hoveredBondIdRef.current = null;
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [canvasEl, store]);

  // Quick-edit (R-08) + Delete (R-11) keyboard handler. Respects the
  // wave-3 hotkey gating so typing into a text input never fires these.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isEditingTextNow()) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selected = [...selectedAtomsRef.current];
        if (selected.length === 0) return;
        e.preventDefault();
        store.dispatch({
          type: 'remove-batch',
          atomIds: selected,
          bondIds: [],
        });
        selectedAtomsRef.current = new Set();
        rendererRef.current?.setSelectedAtoms(new Set());
        onSelectionChangeRef.current?.([]);
        return;
      }
      const doc = store.getState();
      const page = doc.pages[doc.activePageIndex];
      if (!page) return;
      const cmd = resolveQuickEditCommand(
        e.key,
        {
          atomId: hoveredAtomIdRef.current,
          bondId: hoveredBondIdRef.current,
        },
        page,
      );
      if (cmd) {
        e.preventDefault();
        store.dispatch(cmd);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  // Cursor-centered wheel zoom (W4-R-12). Updates viewport via the
  // ToolContext setter so renderer and SVG overlay stay in sync.
  useEffect(() => {
    const el = canvasEl;
    if (!el) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const v = viewportRef.current;
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const nextZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v.zoom * factor));
      if (nextZoom === v.zoom) return;
      const rect = el.getBoundingClientRect === undefined
        ? { left: 0, top: 0 }
        : el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      // Anchor: world-space point under cursor stays fixed during the zoom.
      const wx = (sx - v.panX) / v.zoom;
      const wy = (sy - v.panY) / v.zoom;
      const nextPanX = sx - wx * nextZoom;
      const nextPanY = sy - wy * nextZoom;
      context.setViewport?.({ zoom: nextZoom, panX: nextPanX, panY: nextPanY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [canvasEl, context]);

  // Track the canvas size so the SVG overlay matches.
  useEffect(() => {
    const el = canvasEl;
    if (!el) return;
    const measure = (): void => {
      const rect = el.getBoundingClientRect === undefined
        ? { width: 0, height: 0 }
        : el.getBoundingClientRect();
      overlaySizeRef.current = { w: rect.width, h: rect.height };
      setOverlayTick((t) => t + 1);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasEl]);

  // Re-publish overlay tick when hoverPreview / dragOffset change to ensure
  // the SVG layer above re-flows after a viewport update.
  useEffect(() => {
    setOverlayTick((t) => t + 1);
  }, [hoverPreview, dragOffset]);

  // Wave-7 HF-6: the wave-4 shell mounted its own toolbar/properties/status
  // placeholders alongside the canvas root. Under the wave-5 hotfix,
  // App.tsx/NewCanvasMode now fills those grid cells with the real shell
  // (NewToolbox, PropertyPanel, StatusBar). Leaving the placeholders here
  // made them sit on top of the real widgets in the same CSS grid areas,
  // silently intercepting pointer events and breaking toolbox clicks.
  // Only the canvas cell belongs to CanvasNew now.
  return (
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
      data-active-tool={activeToolId ?? registry.getActiveId() ?? ''}
      data-overlay-tick={overlayTick}
      role="region"
      aria-label="New canvas (wave-4 redraw)"
    >
      <HoverIconOverlay
        preview={projectPreviewToScreen(hoverPreview, viewportRef.current)}
        width={overlaySizeRef.current.w}
        height={overlaySizeRef.current.h}
        theme={theme}
      />
    </div>
  );
});

export default CanvasNew;

/** Project a hover preview from world space into screen space so the SVG
 *  overlay (which uses container-local pixels) lines up with the canvas. */
function projectPreviewToScreen(
  preview: HoverPreview | null,
  v: { zoom: number; panX: number; panY: number },
): HoverPreview | null {
  if (!preview) return null;
  const toScreen = (p: Point): Point => ({
    x: p.x * v.zoom + v.panX,
    y: p.y * v.zoom + v.panY,
  });
  return {
    kind: preview.kind,
    sourceId: preview.sourceId,
    angle: preview.angle,
    anchor: toScreen(preview.anchor),
    iconAt: toScreen(preview.iconAt),
    endpoint: toScreen(preview.endpoint),
  };
}

/** Apply a transient drag offset to the document so the renderer paints the
 *  dragged atoms at their displaced position — no store mutation occurs. */
function applyDragOffsetDoc(doc: Document, offset: DragOffset): Document {
  const page = doc.pages[doc.activePageIndex];
  if (!page) return doc;
  const ids = offset.atomIds;
  if (ids.size === 0) return doc;
  const nextAtoms: Page['atoms'] = { ...page.atoms };
  for (const id of ids) {
    const a = nextAtoms[id];
    if (!a) continue;
    nextAtoms[id] = { ...a, x: a.x + offset.dx, y: a.y + offset.dy };
  }
  const nextPage: Page = { ...page, atoms: nextAtoms };
  const nextPages = [...doc.pages];
  nextPages[doc.activePageIndex] = nextPage;
  return { ...doc, pages: nextPages };
}
