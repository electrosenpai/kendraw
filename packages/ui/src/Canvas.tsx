import { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import {
  createAtom,
  createBond,
  SpatialIndex,
  createSelection,
  addToSelection,
  toggleInSelection,
  clearSelection,
  copySelection,
  prepareForPaste,
  validateValence,
  generateRing,
  RING_TEMPLATES,
  computeCenter,
  rotateAtoms,
  mirrorAtomsH,
  mirrorAtomsV,
  defaultCurlyGeometry,
  floodSelectMolecule,
  calculateBondTarget,
  getNextChainPosition,
  type SceneStore,
  type Selection,
  type ClipboardData,
  type AtomId,
  type ArrowId,
  type Bond,
} from '@kendraw/scene';
import { CanvasRenderer } from '@kendraw/renderer-canvas';
import { ToolPalette, DEFAULT_TOOL_STATE, type ToolState } from './ToolPalette';
import { PropertyPanel } from './PropertyPanel';
import { StatusBar } from './StatusBar';
import { getGraphicOverlays, getCdxmlDocumentSettings, toRenderSettings, onGraphicOverlaysChange } from './graphic-overlays';

const ATOM_RADIUS = 14;

function getBondOrder(style: string): Bond['order'] {
  if (style === 'double') return 2;
  if (style === 'triple') return 3;
  if (style === 'aromatic') return 1.5;
  return 1;
}

/** Distance from point (px,py) to line segment (x1,y1)-(x2,y2). */
function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}

interface CanvasProps {
  store: SceneStore;
  onMoleculeSearch?: (() => void) | undefined;
  onImportFile?: (() => void) | undefined;
  showPropertyPanel?: boolean | undefined;
}

export function Canvas({
  store,
  onMoleculeSearch,
  onImportFile,
  showPropertyPanel = true,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const spatialIndexRef = useRef(new SpatialIndex());
  const [toolState, setToolState] = useState<ToolState>(DEFAULT_TOOL_STATE);
  const [selection, setSelection] = useState<Selection>(createSelection());
  const [showProperties, setShowProperties] = useState(true);
  const [valenceIssues, setValenceIssues] = useState<Set<AtomId>>(new Set());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const clipboardRef = useRef<ClipboardData | null>(null);
  const bondStartAtomRef = useRef<AtomId | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const fitToScreen = useCallback(() => {
    const page = store.getState().pages[store.getState().activePageIndex];
    if (!page) return;
    const atoms = Object.values(page.atoms);
    if (atoms.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    // Compute bounding box of all atoms
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const a of atoms) {
      if (a.x < minX) minX = a.x;
      if (a.y < minY) minY = a.y;
      if (a.x > maxX) maxX = a.x;
      if (a.y > maxY) maxY = a.y;
    }
    const padding = 60;
    const bboxW = maxX - minX + padding * 2;
    const bboxH = maxY - minY + padding * 2;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const canvasW = rect.width;
    const canvasH = rect.height;

    // Compute zoom to fit bbox in canvas
    const newZoom = Math.min(canvasW / bboxW, canvasH / bboxH, 3);
    // Compute pan to center the bbox
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newPanX = canvasW / 2 - centerX * newZoom;
    const newPanY = canvasH / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [store]);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const isMovingRef = useRef(false);
  const moveStartRef = useRef({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const updateToolState = useCallback((partial: Partial<ToolState>) => {
    if (partial.tool) bondStartAtomRef.current = null;
    setToolState((s) => ({ ...s, ...partial }));
  }, []);

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    [store],
  );
  const getSnapshot = useCallback(() => store.getState(), [store]);
  const doc = useSyncExternalStore(subscribe, getSnapshot);

  // Rebuild spatial index + validate valence on doc change
  useEffect(() => {
    const page = doc.pages[doc.activePageIndex];
    if (page) {
      spatialIndexRef.current.rebuild(page);
      const issues = validateValence(page);
      setValenceIssues(new Set(issues.map((i) => i.atomId)));
    }
  }, [doc]);

  // Sync selection to renderer
  useEffect(() => {
    rendererRef.current?.setSelectedAtoms(new Set(selection.atomIds));
  }, [selection]);

  // Sync zoom/pan to renderer
  useEffect(() => {
    rendererRef.current?.setViewport(zoom, pan.x, pan.y);
  }, [zoom, pan]);

  // Sync valence issues to renderer
  useEffect(() => {
    rendererRef.current?.setValenceIssues(valenceIssues);
  }, [valenceIssues]);

  // Sync graphic overlays and document settings from CDXML imports
  useEffect(() => {
    const update = () => {
      rendererRef.current?.setGraphics(getGraphicOverlays());
      const settings = getCdxmlDocumentSettings();
      if (settings) {
        rendererRef.current?.setDocumentStyle(toRenderSettings(settings));
      }
    };
    update();
    return onGraphicOverlaysChange(update);
  }, []);

  // Attach renderer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const renderer = new CanvasRenderer();
    renderer.attach(container);
    rendererRef.current = renderer;
    renderer.render(store.getState());
    return () => {
      renderer.detach();
      rendererRef.current = null;
    };
  }, [store]);

  // Re-render on doc change
  useEffect(() => {
    rendererRef.current?.render(doc);
  }, [doc]);

  // Convert screen coords to world coords (accounting for container offset, zoom, pan)
  const toCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      // Use the actual event target's bounding rect for pixel-perfect positioning
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      // CSS pixels relative to container top-left
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      // Invert the renderer's transform: ctx.translate(panX, panY) then ctx.scale(zoom, zoom)
      // screen = world * zoom + pan  =>  world = (screen - pan) / zoom
      const worldX = (cssX - pan.x) / zoom;
      const worldY = (cssY - pan.y) / zoom;
      return { x: worldX, y: worldY };
    },
    [zoom, pan],
  );

  // Keyboard shortcuts
  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;

      // Fit to screen (Ctrl+0)
      if (isMod && e.key === '0') {
        e.preventDefault();
        fitToScreen();
        return;
      }

      // Structure cleanup (Shift+Ctrl+K, reference Section 4.1)
      if (isMod && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        try {
          const { cleanup } = await import('@kendraw/constraints');
          const pg = store.getState().pages[store.getState().activePageIndex];
          if (pg) {
            const result = cleanup(pg);
            for (const [id, correction] of result.corrections) {
              if (Math.abs(correction.dx) > 0.5 || Math.abs(correction.dy) > 0.5) {
                store.dispatch({ type: 'move-atom', id, dx: correction.dx, dy: correction.dy });
              }
            }
          }
        } catch {
          // constraints package not available
        }
        return;
      }

      // Undo/Redo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        setSelection(clearSelection(selection));
        return;
      }
      if (isMod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        store.redo();
        setSelection(clearSelection(selection));
        return;
      }

      // Copy — internal + multi-format system clipboard (Section 5.6)
      if (isMod && e.key === 'c') {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          clipboardRef.current = copySelection(page, selection.atomIds);
          // Multi-format clipboard: SVG + MOL as text
          try {
            const { exportToSVG } = await import('@kendraw/renderer-svg');
            const { writeMolV2000 } = await import('@kendraw/io');
            const selAtoms = selection.atomIds
              .map((id) => page.atoms[id])
              .filter((a): a is NonNullable<typeof a> => !!a);
            const selBonds = Object.values(page.bonds).filter(
              (b) =>
                selection.atomIds.includes(b.fromAtomId) && selection.atomIds.includes(b.toAtomId),
            );
            const svg = exportToSVG(page);
            const mol = writeMolV2000(selAtoms, selBonds);
            // Write SVG as image + MOL as text to clipboard
            const items: Record<string, Blob> = {
              'text/plain': new Blob([mol], { type: 'text/plain' }),
            };
            // Try adding SVG as image (not all browsers support this)
            items['image/svg+xml'] = new Blob([svg], { type: 'image/svg+xml' });
            void navigator.clipboard.write([new ClipboardItem(items)]).catch(() => {
              // Fallback: just copy MOL as text
              void navigator.clipboard.writeText(mol);
            });
          } catch {
            // Imports failed — internal clipboard only
          }
        }
        return;
      }

      // Cut
      if (isMod && e.key === 'x') {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          clipboardRef.current = copySelection(page, selection.atomIds);
          for (const id of selection.atomIds) store.dispatch({ type: 'remove-atom', id });
          setSelection(clearSelection(selection));
        }
        return;
      }

      // Paste
      if (isMod && e.key === 'v') {
        e.preventDefault();
        if (clipboardRef.current) {
          const { atoms, bonds } = prepareForPaste(clipboardRef.current, 20, 20);
          for (const a of atoms) store.dispatch({ type: 'add-atom', atom: a });
          for (const b of bonds) store.dispatch({ type: 'add-bond', bond: b });
        }
        return;
      }

      // Duplicate
      if (isMod && e.key === 'd') {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          const data = copySelection(page, selection.atomIds);
          const { atoms, bonds } = prepareForPaste(data, 30, 30);
          for (const a of atoms) store.dispatch({ type: 'add-atom', atom: a });
          for (const b of bonds) store.dispatch({ type: 'add-bond', bond: b });
        }
        return;
      }

      // Rotate selection (Ctrl+R)
      if (isMod && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          const atoms = selection.atomIds
            .map((id) => page.atoms[id])
            .filter((a): a is NonNullable<typeof a> => !!a);
          const center = computeCenter(atoms);
          const rotated = rotateAtoms(atoms, center.x, center.y, (15 * Math.PI) / 180);
          for (const ra of rotated) {
            const orig = page.atoms[ra.id];
            if (orig) {
              store.dispatch({
                type: 'move-atom',
                id: ra.id,
                dx: ra.x - orig.x,
                dy: ra.y - orig.y,
              });
            }
          }
        }
        return;
      }

      // Mirror H (Ctrl+M)
      if (isMod && e.key === 'm') {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          const atoms = selection.atomIds
            .map((id) => page.atoms[id])
            .filter((a): a is NonNullable<typeof a> => !!a);
          const center = computeCenter(atoms);
          const mirrored = e.shiftKey
            ? mirrorAtomsV(atoms, center.y)
            : mirrorAtomsH(atoms, center.x);
          for (const ma of mirrored) {
            const orig = page.atoms[ma.id];
            if (orig) {
              store.dispatch({
                type: 'move-atom',
                id: ma.id,
                dx: ma.x - orig.x,
                dy: ma.y - orig.y,
              });
            }
          }
        }
        return;
      }

      // Select all (Ctrl+A)
      if (isMod && e.key === 'a') {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page) {
          const allIds = Object.keys(page.atoms) as AtomId[];
          setSelection(addToSelection(createSelection(), { atomIds: allIds }));
        }
        return;
      }

      // Delete (cascade: remove connected bonds first, then atoms)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.atomIds.length > 0) {
          e.preventDefault();
          const page = store.getState().pages[store.getState().activePageIndex];
          if (page) {
            const atomSet = new Set(selection.atomIds);
            for (const bond of Object.values(page.bonds)) {
              if (atomSet.has(bond.fromAtomId) || atomSet.has(bond.toAtomId)) {
                store.dispatch({ type: 'remove-bond', id: bond.id });
              }
            }
          }
          for (const id of selection.atomIds) store.dispatch({ type: 'remove-atom', id });
          setSelection(clearSelection(selection));
        }
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        setSelection(clearSelection(selection));
        bondStartAtomRef.current = null;
        return;
      }

      // Toggle property panel
      if (e.key === 'p' || e.key === 'P') {
        if (!isMod) {
          setShowProperties((s) => !s);
          return;
        }
      }

      // Charge shortcuts (+ / -), clamped to [-4, +4]
      if ((e.key === '+' || e.key === '=') && selection.atomIds.length > 0) {
        for (const id of selection.atomIds) {
          const pg = store.getState().pages[store.getState().activePageIndex];
          const atom = pg?.atoms[id];
          if (atom && atom.charge < 4) {
            store.dispatch({ type: 'update-atom', id, changes: { charge: atom.charge + 1 } });
          }
        }
        return;
      }
      if (e.key === '-' && !isMod && selection.atomIds.length > 0) {
        for (const id of selection.atomIds) {
          const pg = store.getState().pages[store.getState().activePageIndex];
          const atom = pg?.atoms[id];
          if (atom && atom.charge > -4) {
            store.dispatch({ type: 'update-atom', id, changes: { charge: atom.charge - 1 } });
          }
        }
        return;
      }

      // ChemDraw atom hotkeys — change element of selected atoms (Section 5.4)
      if (!isMod && selection.atomIds.length > 0) {
        const atomHotkeys: Record<string, number> = {
          c: 6,
          C: 6, // Carbon
          n: 7,
          N: 7, // Nitrogen
          o: 8,
          O: 8, // Oxygen
          s: 16,
          S: 16, // Sulfur
          f: 9,
          F: 9, // Fluorine
          i: 53,
          I: 53, // Iodine
          l: 17,
          L: 17, // Chlorine (ChemDraw convention: L=Cl)
          p: 15,
          P: 15, // Phosphorus
          b: 5,
          B: 5, // Boron
          h: 1,
          H: 1, // Hydrogen
        };
        const newElement = atomHotkeys[e.key];
        if (newElement !== undefined) {
          for (const id of selection.atomIds) {
            store.dispatch({ type: 'update-atom', id, changes: { element: newElement } });
          }
          return;
        }

        // M/m → Methyl (Carbon, ChemDraw convention)
        if (e.key === 'm' || e.key === 'M') {
          for (const id of selection.atomIds) {
            store.dispatch({ type: 'update-atom', id, changes: { element: 6 } });
          }
          return;
        }

        // ChemDraw bond hotkeys (Section 5.4)
        // 1=single, 2=double, 3=triple, b=bold, d=dash, h=hashed, w=wedge, y=wavy
        const bondStyleKeys: Record<string, ToolState['bondStyle']> = {
          '1': 'single',
          '2': 'double',
          '3': 'triple',
          d: 'dash',
          w: 'wedge',
          y: 'wavy',
        };
        const bStyle = bondStyleKeys[e.key];
        if (bStyle) {
          updateToolState({ tool: 'add-bond', bondStyle: bStyle });
          return;
        }
      }

      // Tool shortcuts (non-modifier, no selection)
      if (!isMod) {
        const toolMap: Record<string, Partial<ToolState>> = {
          v: { tool: 'select' },
          V: { tool: 'select' },
          a: { tool: 'add-atom' },
          A: { tool: 'add-atom' },
          b: { tool: 'add-bond' },
          B: { tool: 'add-bond' },
          r: { tool: 'ring' },
          R: { tool: 'ring' },
          e: { tool: 'eraser' },
          E: { tool: 'eraser' },
          h: { tool: 'pan' },
          H: { tool: 'pan' },
          w: { tool: 'arrow' },
          W: { tool: 'arrow' },
          u: { tool: 'curly-arrow' },
          U: { tool: 'curly-arrow' },
        };
        const mapped = toolMap[e.key];
        if (mapped) {
          updateToolState(mapped);
          return;
        }

        // Element shortcuts (number keys map to COMMON_ELEMENTS)
        const elementMap: Record<string, number> = {
          '1': 6,
          '2': 7,
          '3': 8,
          '4': 16,
          '5': 15,
          '6': 9,
          '7': 17,
          '8': 35,
          '9': 53,
          '0': 1,
        };
        const el = elementMap[e.key];
        if (el !== undefined) {
          updateToolState({ tool: 'add-atom', element: el });
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, store, updateToolState]);

  // Zoom via wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.min(5, Math.max(0.1, z * factor)));
    }
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { x, y } = toCanvasCoords(e);

      // Pan with middle button or pan tool
      if (e.button === 1 || toolState.tool === 'pan') {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        return;
      }

      // Select tool: click on atom → select it + prepare for move drag
      if (toolState.tool === 'select') {
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (hitId) {
          // If atom is already selected, just start move
          // If not selected, select it first then prepare move
          if (!selection.atomIds.includes(hitId)) {
            if (e.shiftKey) {
              setSelection((s) => addToSelection(s, { atomIds: [hitId] }));
            } else {
              setSelection(addToSelection(createSelection(), { atomIds: [hitId] }));
            }
          }
          // In all cases, prepare for potential move drag
          isMovingRef.current = true;
          moveStartRef.current = { x, y };
          dragStartRef.current = { x, y };
          isDraggingRef.current = false;
          return;
        }
      }

      // Eraser: fire on mouseDown for instant feedback (like Photoshop)
      if (toolState.tool === 'eraser') {
        const page = store.getState().pages[store.getState().activePageIndex];
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (hitId) {
          if (page) {
            for (const bond of Object.values(page.bonds)) {
              if (bond.fromAtomId === hitId || bond.toAtomId === hitId) {
                store.dispatch({ type: 'remove-bond', id: bond.id });
              }
            }
          }
          store.dispatch({ type: 'remove-atom', id: hitId });
          return;
        }
        // Try bond hit-test
        if (page) {
          for (const bond of Object.values(page.bonds)) {
            const fa = page.atoms[bond.fromAtomId];
            const ta = page.atoms[bond.toAtomId];
            if (fa && ta && pointToSegmentDist(x, y, fa.x, fa.y, ta.x, ta.y) < 8) {
              store.dispatch({ type: 'remove-bond', id: bond.id });
              return;
            }
          }
          for (const arrow of Object.values(page.arrows)) {
            const { start, end } = arrow.geometry;
            if (pointToSegmentDist(x, y, start.x, start.y, end.x, end.y) < 10) {
              store.dispatch({ type: 'remove-arrow', id: arrow.id });
              return;
            }
          }
        }
        return;
      }

      // Track mouse-down position for all tools (drag guard)
      dragStartRef.current = { x, y };
      isDraggingRef.current = false;
    },
    [toolState.tool, toCanvasCoords, pan, selection],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Track cursor position for status bar
      const worldPos = toCanvasCoords(e);
      setCursorPos(worldPos);

      // Panning
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
        return;
      }

      // Moving selected atoms
      if (isMovingRef.current && selection.atomIds.length > 0) {
        const { x: mx, y: my } = toCanvasCoords(e);
        const mdx = mx - moveStartRef.current.x;
        const mdy = my - moveStartRef.current.y;
        if (Math.abs(mdx) > 1 || Math.abs(mdy) > 1) {
          store.dispatch({ type: 'move-batch', ids: selection.atomIds, dx: mdx, dy: mdy });
          moveStartRef.current = { x: mx, y: my };
          isDraggingRef.current = true;
        }
        return;
      }

      if (!dragStartRef.current) return;
      const { x, y } = toCanvasCoords(e);
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
        // Only show selection rect for select tool (not moving)
        if (toolState.tool === 'select') {
          rendererRef.current?.setSelectionRect({
            x1: dragStartRef.current.x,
            y1: dragStartRef.current.y,
            x2: x,
            y2: y,
          });
        }
      }
    },
    [toolState.tool, toCanvasCoords, selection, store],
  );

  // Double-click handler for flood-select molecule
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (toolState.tool !== 'select') return;
      const { x, y } = toCanvasCoords(e);
      const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
      if (!hitId) return;
      const page = store.getState().pages[store.getState().activePageIndex];
      if (!page) return;
      const moleculeIds = floodSelectMolecule(page, hitId);
      setSelection(addToSelection(createSelection(), { atomIds: moleculeIds }));
    },
    [toolState.tool, toCanvasCoords, store],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // End panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }

      // End move drag
      if (isMovingRef.current) {
        isMovingRef.current = false;
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      const { x, y } = toCanvasCoords(e);

      // --- ATOM TOOL --- (only on click, not drag)
      if (toolState.tool === 'add-atom') {
        if (!isDraggingRef.current) {
          const atom = createAtom(x, y, toolState.element);
          store.dispatch({ type: 'add-atom', atom });
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- BOND TOOL (ChemDraw-style: fixed length + angle snapping) ---
      if (toolState.tool === 'add-bond') {
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        const page = store.getState().pages[store.getState().activePageIndex];
        const freeAngle = e.shiftKey;

        if (hitId && bondStartAtomRef.current === null) {
          // Click on existing atom → start bond from it, auto-place target
          if (!isDraggingRef.current && page) {
            // Quick click: auto-place at ideal angle + fixed length
            const pos = getNextChainPosition(page, hitId);
            const existTarget = spatialIndexRef.current.hitTest(pos.x, pos.y, ATOM_RADIUS);
            if (existTarget && existTarget !== hitId) {
              // Target position has an atom — bond to it or cycle
              const existing = page
                ? Object.values(page.bonds).find(
                    (b) =>
                      (b.fromAtomId === hitId && b.toAtomId === existTarget) ||
                      (b.toAtomId === hitId && b.fromAtomId === existTarget),
                  )
                : undefined;
              if (existing) {
                store.dispatch({ type: 'cycle-bond', id: existing.id });
              } else {
                const bond = createBond(
                  hitId,
                  existTarget,
                  getBondOrder(toolState.bondStyle),
                  toolState.bondStyle,
                );
                store.dispatch({ type: 'add-bond', bond });
              }
            } else {
              // Create new atom at ideal position
              const atom = createAtom(pos.x, pos.y, toolState.element);
              store.dispatch({ type: 'add-atom', atom });
              store.dispatch({
                type: 'add-bond',
                bond: createBond(
                  hitId,
                  atom.id,
                  getBondOrder(toolState.bondStyle),
                  toolState.bondStyle,
                ),
              });
            }
          }
        } else if (hitId && bondStartAtomRef.current !== null) {
          // Second click on an atom → connect bond
          if (hitId !== bondStartAtomRef.current) {
            const existing = page
              ? Object.values(page.bonds).find(
                  (b) =>
                    (b.fromAtomId === bondStartAtomRef.current && b.toAtomId === hitId) ||
                    (b.toAtomId === bondStartAtomRef.current && b.fromAtomId === hitId),
                )
              : undefined;
            if (existing) {
              store.dispatch({ type: 'cycle-bond', id: existing.id });
            } else {
              const bond = createBond(
                bondStartAtomRef.current,
                hitId,
                getBondOrder(toolState.bondStyle),
                toolState.bondStyle,
              );
              store.dispatch({ type: 'add-bond', bond });
            }
          }
          bondStartAtomRef.current = null;
        } else if (bondStartAtomRef.current !== null && page) {
          // Click on empty space with a start atom → place at snapped position
          const pos = calculateBondTarget(page, bondStartAtomRef.current, x, y, { freeAngle });
          const atom = createAtom(pos.x, pos.y, toolState.element);
          store.dispatch({ type: 'add-atom', atom });
          store.dispatch({
            type: 'add-bond',
            bond: createBond(
              bondStartAtomRef.current,
              atom.id,
              getBondOrder(toolState.bondStyle),
              toolState.bondStyle,
            ),
          });
          bondStartAtomRef.current = null;
        } else {
          // Click on empty space, no start atom → create a full bond (2 atoms)
          const a1 = createAtom(x, y, toolState.element);
          const a2 = createAtom(x + 40, y, toolState.element); // horizontal
          store.dispatch({ type: 'add-atom', atom: a1 });
          store.dispatch({ type: 'add-atom', atom: a2 });
          store.dispatch({
            type: 'add-bond',
            bond: createBond(a1.id, a2.id, getBondOrder(toolState.bondStyle), toolState.bondStyle),
          });
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- RING TOOL --- (only on click, not drag)
      if (toolState.tool === 'ring') {
        if (!isDraggingRef.current) {
          const template = RING_TEMPLATES.find((t) => t.id === toolState.ringTemplate);
          if (template) {
            const ring = generateRing(template, x, y, 50);
            for (const a of ring.atoms) store.dispatch({ type: 'add-atom', atom: a });
            for (const b of ring.bonds) store.dispatch({ type: 'add-bond', bond: b });
          }
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- ERASER TOOL ---
      if (toolState.tool === 'eraser') {
        const page = store.getState().pages[store.getState().activePageIndex];
        // Try atom first
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (hitId) {
          if (page) {
            for (const bond of Object.values(page.bonds)) {
              if (bond.fromAtomId === hitId || bond.toAtomId === hitId) {
                store.dispatch({ type: 'remove-bond', id: bond.id });
              }
            }
          }
          store.dispatch({ type: 'remove-atom', id: hitId });
          dragStartRef.current = null;
          isDraggingRef.current = false;
          return;
        }
        // Try bond hit-test (point-to-segment distance)
        if (page) {
          for (const bond of Object.values(page.bonds)) {
            const fa = page.atoms[bond.fromAtomId];
            const ta = page.atoms[bond.toAtomId];
            if (fa && ta && pointToSegmentDist(x, y, fa.x, fa.y, ta.x, ta.y) < 8) {
              store.dispatch({ type: 'remove-bond', id: bond.id });
              dragStartRef.current = null;
              isDraggingRef.current = false;
              return;
            }
          }
          // Try arrow hit-test
          for (const arrow of Object.values(page.arrows)) {
            const { start, end } = arrow.geometry;
            if (pointToSegmentDist(x, y, start.x, start.y, end.x, end.y) < 10) {
              store.dispatch({ type: 'remove-arrow', id: arrow.id });
              dragStartRef.current = null;
              isDraggingRef.current = false;
              return;
            }
          }
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- ARROW TOOL ---
      if (toolState.tool === 'arrow') {
        if (!dragStartRef.current) {
          dragStartRef.current = { x, y };
          return;
        }
        // Skip zero-length arrows
        const adx = x - dragStartRef.current.x;
        const ady = y - dragStartRef.current.y;
        if (Math.sqrt(adx * adx + ady * ady) < 5) {
          dragStartRef.current = null;
          return;
        }
        const arrow = {
          id: crypto.randomUUID() as ArrowId,
          type: toolState.arrowType as 'forward' | 'equilibrium' | 'reversible',
          geometry: {
            start: { x: dragStartRef.current.x, y: dragStartRef.current.y },
            c1: {
              x: dragStartRef.current.x + (x - dragStartRef.current.x) * 0.33,
              y: dragStartRef.current.y + (y - dragStartRef.current.y) * 0.33,
            },
            c2: {
              x: dragStartRef.current.x + (x - dragStartRef.current.x) * 0.66,
              y: dragStartRef.current.y + (y - dragStartRef.current.y) * 0.66,
            },
            end: { x, y },
          },
          startAnchor: { kind: 'free' as const },
          endAnchor: { kind: 'free' as const },
        };
        store.dispatch({ type: 'add-arrow', arrow });
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- CURLY ARROW TOOL ---
      if (toolState.tool === 'curly-arrow') {
        if (!dragStartRef.current) {
          dragStartRef.current = { x, y };
          return;
        }
        const cdx = x - dragStartRef.current.x;
        const cdy = y - dragStartRef.current.y;
        if (Math.sqrt(cdx * cdx + cdy * cdy) < 5) {
          dragStartRef.current = null;
          return;
        }
        const geom = defaultCurlyGeometry(dragStartRef.current, { x, y });
        const arrowType = toolState.curlyType === 'radical' ? 'curly-radical' : 'curly-pair';
        const arrow = {
          id: crypto.randomUUID() as ArrowId,
          type: arrowType as 'curly-radical' | 'curly-pair',
          geometry: geom,
          startAnchor: { kind: 'free' as const },
          endAnchor: { kind: 'free' as const },
        };
        store.dispatch({ type: 'add-arrow', arrow });
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- SELECT TOOL ---
      if (isDraggingRef.current && dragStartRef.current) {
        const atomIds = spatialIndexRef.current.searchRect(
          dragStartRef.current.x,
          dragStartRef.current.y,
          x,
          y,
        );
        if (e.shiftKey) {
          setSelection((s) => addToSelection(s, { atomIds }));
        } else {
          setSelection(addToSelection(createSelection(), { atomIds }));
        }
        rendererRef.current?.setSelectionRect(null);
      } else {
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (hitId) {
          if (e.shiftKey) {
            setSelection((s) => toggleInSelection(s, { atomIds: [hitId] }));
          } else {
            setSelection(addToSelection(createSelection(), { atomIds: [hitId] }));
          }
        } else if (!e.shiftKey) {
          setSelection(createSelection());
        }
      }

      dragStartRef.current = null;
      isDraggingRef.current = false;
    },
    [toolState, toCanvasCoords, store],
  );

  const cursorStyle = (() => {
    if (isPanningRef.current) return 'grabbing';
    switch (toolState.tool) {
      case 'select':
        return 'default';
      case 'pan':
        return 'grab';
      case 'eraser':
        return 'crosshair';
      case 'add-atom':
      case 'add-bond':
      case 'ring':
      case 'arrow':
      case 'curly-arrow':
        return 'crosshair';
      default:
        return 'default';
    }
  })();

  return (
    <>
      {/* Toolbar */}
      <div style={{ gridArea: 'toolbar', overflow: 'hidden' }}>
        <ToolPalette
          toolState={toolState}
          onToolStateChange={updateToolState}
          onUndo={() => {
            store.undo();
            setSelection(clearSelection(selection));
          }}
          onRedo={() => {
            store.redo();
            setSelection(clearSelection(selection));
          }}
          onMoleculeSearch={onMoleculeSearch}
          onImportFile={onImportFile}
          onFitToScreen={fitToScreen}
          canUndo={store.canUndo()}
          canRedo={store.canRedo()}
        />
      </div>

      {/* Canvas */}
      <div
        style={{
          gridArea: 'canvas',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            onImportFile?.();
          }}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--kd-color-bg-primary)',
            cursor: isMovingRef.current ? 'grabbing' : cursorStyle,
          }}
        />
      </div>

      {/* Properties panel */}
      <div style={{ gridArea: 'properties', overflow: 'auto' }}>
        <PropertyPanel doc={doc} visible={showPropertyPanel && showProperties} />
      </div>

      {/* Status bar */}
      <div style={{ gridArea: 'status' }}>
        <StatusBar
          toolState={toolState}
          zoom={zoom}
          atomCount={Object.keys(doc.pages[doc.activePageIndex]?.atoms ?? {}).length}
          bondCount={Object.keys(doc.pages[doc.activePageIndex]?.bonds ?? {}).length}
          selectionCount={selection.atomIds.length}
          valenceWarnings={valenceIssues.size}
          cursorPos={cursorPos}
        />
      </div>
    </>
  );
}
