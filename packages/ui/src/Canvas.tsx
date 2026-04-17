import { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import {
  createAtom,
  createBond,
  createAnnotation,
  SpatialIndex,
  createSelection,
  addToSelection,
  toggleInSelection,
  clearSelection,
  copySelection,
  prepareForPaste,
  validateValence,
  generateRing,
  generateFusedRing,
  RING_TEMPLATES,
  FUSED_RING_TEMPLATES,
  computeCenter,
  rotateAtoms,
  mirrorAtomsH,
  mirrorAtomsV,
  defaultCurlyGeometry,
  floodSelectMolecule,
  calculateBondTarget,
  getNextChainPosition,
  formulaMode,
  type SceneStore,
  type Selection,
  type ClipboardData,
  type AtomId,
  type ArrowId,
  type AnnotationId,
  type Bond,
  type Annotation,
} from '@kendraw/scene';
import { CanvasRenderer } from '@kendraw/renderer-canvas';
import { ToolPalette, DEFAULT_TOOL_STATE, type ToolState } from './ToolPalette';
import { PropertyPanel } from './PropertyPanel';
import { StatusBar } from './StatusBar';
import { isEditingTextNow } from './hooks/useIsEditingText';
import {
  getGraphicOverlays,
  getCdxmlDocumentSettings,
  toRenderSettings,
  onGraphicOverlaysChange,
} from './graphic-overlays';

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
  nmrOpen?: boolean | undefined;
  onNmrToggle?: (() => void) | undefined;
  highlightedAtomIds?: Set<AtomId> | undefined;
  onHighlightAtoms?: ((ids: Set<AtomId>) => void) | undefined;
  onSelectionChange?: ((atomIds: AtomId[]) => void) | undefined;
  theme?: 'dark' | 'light' | undefined;
}

export function Canvas({
  store,
  onMoleculeSearch,
  onImportFile,
  showPropertyPanel = true,
  nmrOpen = false,
  onNmrToggle,
  highlightedAtomIds,
  onHighlightAtoms,
  onSelectionChange,
  theme = 'dark',
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
  const [textEditing, setTextEditing] = useState<{
    x: number;
    y: number;
    text: string;
    annotationId?: AnnotationId;
  } | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

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
  const spaceHeldRef = useRef(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const updateToolState = useCallback((partial: Partial<ToolState>) => {
    if (partial.tool) bondStartAtomRef.current = null;
    setToolState((s) => ({ ...s, ...partial }));
  }, []);

  const confirmText = useCallback(() => {
    if (!textEditing) return;
    const text = textEditing.text.trim();
    if (text) {
      const richText = formulaMode(text);
      if (textEditing.annotationId) {
        store.dispatch({
          type: 'update-annotation',
          id: textEditing.annotationId,
          changes: { richText },
        });
      } else {
        const ann = createAnnotation(textEditing.x, textEditing.y, richText);
        store.dispatch({ type: 'add-annotation', annotation: ann });
      }
    } else if (textEditing.annotationId) {
      store.dispatch({ type: 'remove-annotation', id: textEditing.annotationId });
    }
    setTextEditing(null);
  }, [textEditing, store]);

  const cancelText = useCallback(() => {
    setTextEditing(null);
  }, []);

  // Explicitly focus the textarea when text-editing starts.
  // autoFocus alone is unreliable for dynamically mounted textareas in React.
  useEffect(() => {
    if (!textEditing) return;
    const el = textInputRef.current;
    if (!el) return;
    // rAF ensures the element is mounted and laid out before focus
    const raf = requestAnimationFrame(() => {
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [textEditing]);

  const hitTestAnnotation = useCallback(
    (x: number, y: number): Annotation | null => {
      const page = store.getState().pages[store.getState().activePageIndex];
      if (!page) return null;
      for (const ann of Object.values(page.annotations)) {
        const dx = x - ann.x;
        const dy = y - ann.y;
        const textWidth = ann.richText.reduce((w, s) => w + s.text.length * 8, 0);
        const fontSize = ann.fontSize ?? 14;
        if (dx >= -4 && dx <= Math.max(textWidth, 20) && dy >= -4 && dy <= fontSize + 4) {
          return ann;
        }
      }
      return null;
    },
    [store],
  );

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

  // Notify parent of selection changes (for NMR scope, etc.)
  useEffect(() => {
    onSelectionChange?.(selection.atomIds);
  }, [selection.atomIds, onSelectionChange]);

  // Sync NMR highlights to renderer
  useEffect(() => {
    rendererRef.current?.setHighlightedAtoms(highlightedAtomIds ?? new Set());
  }, [highlightedAtomIds]);

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

  // Keep a ref to the current theme so the attach effect can pick it up on
  // mount without re-attaching the renderer every time the theme flips.
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Attach renderer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const renderer = new CanvasRenderer();
    renderer.setTheme(themeRef.current);
    renderer.attach(container);
    rendererRef.current = renderer;
    renderer.render(store.getState());
    return () => {
      renderer.detach();
      rendererRef.current = null;
    };
  }, [store]);

  // Propagate theme changes to the renderer (re-renders internally).
  useEffect(() => {
    rendererRef.current?.setTheme(theme);
  }, [theme]);

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

  // Space key tracking for Photoshop-style pan
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditingTextNow()) return;
      if (e.isComposing) return;
      if (e.key === ' ' && !e.repeat) {
        spaceHeldRef.current = true;
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (isEditingTextNow()) return;
      if (e.isComposing) return;
      if (e.key === ' ') {
        spaceHeldRef.current = false;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      // Gate: when a text input has focus (annotation textarea, dialogs,
      // rename fields, etc.) all canvas hotkeys are disabled. The input
      // element itself still receives the keystroke — we simply do not
      // react to it at the window level.
      if (isEditingTextNow()) return;
      if (e.isComposing) return;

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

      // Paste (Ctrl+V, not Shift+Ctrl+V which is flip vertical)
      if (isMod && !e.shiftKey && e.key === 'v') {
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

      // Flip horizontal (Shift+Ctrl+H)
      if (isMod && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          const atoms = selection.atomIds
            .map((id) => page.atoms[id])
            .filter((a): a is NonNullable<typeof a> => !!a);
          const center = computeCenter(atoms);
          const flipped = mirrorAtomsH(atoms, center.x);
          for (const fa of flipped) {
            const orig = page.atoms[fa.id];
            if (orig) {
              store.dispatch({
                type: 'move-atom',
                id: fa.id,
                dx: fa.x - orig.x,
                dy: fa.y - orig.y,
              });
            }
          }
          // Recalculate stereochemistry: flip wedge ↔ dash on affected bonds
          const selSet = new Set(selection.atomIds);
          for (const bond of Object.values(page.bonds)) {
            if (selSet.has(bond.fromAtomId) && selSet.has(bond.toAtomId)) {
              const stereoFlip: Record<string, Bond['style']> = {
                wedge: 'dash',
                dash: 'wedge',
                'wedge-end': 'dash',
                'hashed-wedge': 'hollow-wedge',
                'hashed-wedge-end': 'hollow-wedge-end',
                'hollow-wedge': 'hashed-wedge',
                'hollow-wedge-end': 'hashed-wedge-end',
              };
              const newStyle = stereoFlip[bond.style];
              if (newStyle) {
                store.dispatch({
                  type: 'set-bond-style',
                  id: bond.id,
                  style: newStyle,
                  order: bond.order,
                });
              }
            }
          }
        }
        return;
      }

      // Flip vertical (Shift+Ctrl+V — note: no conflict because Ctrl+V alone is paste)
      if (isMod && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          const atoms = selection.atomIds
            .map((id) => page.atoms[id])
            .filter((a): a is NonNullable<typeof a> => !!a);
          const center = computeCenter(atoms);
          const flipped = mirrorAtomsV(atoms, center.y);
          for (const fa of flipped) {
            const orig = page.atoms[fa.id];
            if (orig) {
              store.dispatch({
                type: 'move-atom',
                id: fa.id,
                dx: fa.x - orig.x,
                dy: fa.y - orig.y,
              });
            }
          }
        }
        return;
      }

      // Ctrl+M is now handled at App level for NMR panel toggle

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

      // ChemDraw atom hotkeys — change element of selected atoms (Section 9 PDF)
      // Full ChemDraw set: a-z + Shift modifiers
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
          L: 17, // Chlorine (ChemDraw: L=Cl)
          p: 15,
          P: 15, // Phosphorus (Shift+P → label "Ph" handled below)
          b: 35, // Bromine (ChemDraw: b=Br)
          B: 5, // Shift+B → Boron
          h: 1,
          H: 1, // Hydrogen
          k: 19,
          K: 19, // Potassium
          r: 0, // R-group (generic label)
          R: 0,
        };
        const newElement = atomHotkeys[e.key];
        if (newElement !== undefined) {
          if (newElement === 0) {
            // R-group: set label to "R" instead of element
            for (const id of selection.atomIds) {
              store.dispatch({
                type: 'update-atom',
                id,
                changes: { element: 6, label: 'R' },
              });
            }
          } else {
            for (const id of selection.atomIds) {
              store.dispatch({ type: 'update-atom', id, changes: { element: newElement } });
            }
          }
          return;
        }

        // Label-based hotkeys (set element + label text)
        const labelHotkeys: Record<string, { element: number; label: string }> = {
          a: { element: 6, label: 'Ac' }, // Acetyl
          d: { element: 1, label: 'D' }, // Deuterium
          e: { element: 6, label: 'Et' }, // Ethyl
          m: { element: 6, label: 'Me' }, // Methyl
          M: { element: 6, label: 'Me' },
          t: { element: 6, label: 'tBu' }, // tert-Butyl
        };
        const lh = labelHotkeys[e.key];
        if (lh) {
          for (const id of selection.atomIds) {
            store.dispatch({
              type: 'update-atom',
              id,
              changes: { element: lh.element, label: lh.label },
            });
          }
          return;
        }

        // ChemDraw bond hotkeys (Section 5.4)
        // 1=single, 2=double, 3=triple, b=bold, d=dash, h=hashed, w=wedge, y=wavy
        const bondStyleKeys: Record<string, ToolState['bondStyle']> = {
          '1': 'single',
          '2': 'double',
          '3': 'triple',
          b: 'bold',
          d: 'dash',
          h: 'hashed-wedge',
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
          t: { tool: 'text' },
          T: { tool: 'text' },
          u: { tool: 'curly-arrow' },
          U: { tool: 'curly-arrow' },
        };
        const mapped = toolMap[e.key];
        if (mapped) {
          updateToolState(mapped);
          return;
        }

        // Ring template shortcuts (3-8, n, q, i) when ring tool is active
        if (toolState.tool === 'ring') {
          const ringMap: Record<string, string> = {
            '3': 'cyclopropane',
            '4': 'cyclobutane',
            '5': 'cyclopentane',
            '6': 'cyclohexane',
            '7': 'cycloheptane',
            '8': 'cyclooctane',
            n: 'naphthalene',
            N: 'naphthalene',
            q: 'quinoline',
            Q: 'quinoline',
            i: 'indole',
            I: 'indole',
          };
          const rt = ringMap[e.key];
          if (rt) {
            updateToolState({ ringTemplate: rt });
            return;
          }
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
  }, [selection, store, updateToolState, toolState.tool]);

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

      // Pan with middle button, pan tool, or space+drag (Photoshop-style)
      if (e.button === 1 || toolState.tool === 'pan' || spaceHeldRef.current) {
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
          // NMR bidirectional highlight: clicking an atom highlights the corresponding peak
          if (nmrOpen && onHighlightAtoms) {
            onHighlightAtoms(new Set([hitId]));
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
          // Try annotation hit-test
          const hitAnn = hitTestAnnotation(x, y);
          if (hitAnn) {
            store.dispatch({ type: 'remove-annotation', id: hitAnn.id });
            return;
          }
        }
        return;
      }

      // Text tool: click to create text, or click on existing to edit
      if (toolState.tool === 'text') {
        // Prevent the browser's default mousedown behavior (focus stealing).
        // Without this, the click that creates the textarea also triggers a
        // focus change on mouseup that blurs the freshly-mounted textarea,
        // firing onBlur → confirmText → immediate removal.
        e.preventDefault();
        if (textEditing) {
          confirmText();
          return;
        }
        const existingAnn = hitTestAnnotation(x, y);
        if (existingAnn) {
          const plainText = existingAnn.richText.map((s) => s.text).join('');
          setTextEditing({
            x: existingAnn.x,
            y: existingAnn.y,
            text: plainText,
            annotationId: existingAnn.id,
          });
        } else {
          setTextEditing({ x, y, text: '' });
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
          } else {
            const fused = FUSED_RING_TEMPLATES.find((t) => t.id === toolState.ringTemplate);
            if (fused) {
              const ring = generateFusedRing(fused, x, y);
              for (const a of ring.atoms) store.dispatch({ type: 'add-atom', atom: a });
              for (const b of ring.bonds) store.dispatch({ type: 'add-bond', bond: b });
            }
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
          // Try annotation hit-test
          const hitAnn = hitTestAnnotation(x, y);
          if (hitAnn) {
            store.dispatch({ type: 'remove-annotation', id: hitAnn.id });
            dragStartRef.current = null;
            isDraggingRef.current = false;
            return;
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
          type: toolState.arrowType as 'forward' | 'equilibrium' | 'reversible' | 'retro',
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
      case 'text':
        return 'text';
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
          onNmrToggle={onNmrToggle}
          nmrOpen={nmrOpen}
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
          data-testid="drawing-canvas"
          data-canvas-root
          tabIndex={0}
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
        {textEditing && (
          <textarea
            ref={textInputRef}
            autoFocus
            data-text-editing="true"
            data-testid="text-annotation-input"
            value={textEditing.text}
            onChange={(e) => setTextEditing((s) => (s ? { ...s, text: e.target.value } : null))}
            onKeyDown={(e) => {
              // Defense in depth: window-level handlers already gate on
              // isEditingTextNow(), but we also stop propagation for
              // single-character keystrokes so any future listener cannot
              // intercept. Commit keys (Enter/Tab), cancel (Escape), and
              // browser-default editing combos (Ctrl+A/C/V/X/Z/Y, arrows,
              // Home/End) are handled explicitly or left untouched.
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                cancelText();
                document.querySelector<HTMLElement>('[data-canvas-root]')?.focus();
                return;
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                confirmText();
                document.querySelector<HTMLElement>('[data-canvas-root]')?.focus();
                return;
              }
              if (e.key === 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                confirmText();
                document.querySelector<HTMLElement>('[data-canvas-root]')?.focus();
                return;
              }
              const isMod = e.ctrlKey || e.metaKey;
              const isNav =
                e.key === 'ArrowLeft' ||
                e.key === 'ArrowRight' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown' ||
                e.key === 'Home' ||
                e.key === 'End';
              if (isMod || isNav) return;
              e.stopPropagation();
            }}
            onBlur={confirmText}
            placeholder="Type text..."
            style={{
              position: 'absolute',
              left: textEditing.x * zoom + pan.x,
              top: textEditing.y * zoom + pan.y,
              minWidth: 120,
              minHeight: 24,
              background: 'rgba(0,0,0,0.8)',
              color: '#e0e0e0',
              border: '1px solid var(--kd-color-accent)',
              borderRadius: 3,
              padding: '2px 4px',
              fontSize: 14,
              fontFamily: 'Arial, system-ui, sans-serif',
              outline: 'none',
              resize: 'both',
              zIndex: 30,
            }}
          />
        )}
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
