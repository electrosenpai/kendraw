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

const ATOM_RADIUS = 14;

interface CanvasProps {
  store: SceneStore;
}

export function Canvas({ store }: CanvasProps) {
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
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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

  // Convert screen coords to canvas coords (with zoom/pan)
  const toCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
    },
    [zoom, pan],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;

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

      // Copy
      if (isMod && e.key === 'c') {
        e.preventDefault();
        const page = store.getState().pages[store.getState().activePageIndex];
        if (page && selection.atomIds.length > 0) {
          clipboardRef.current = copySelection(page, selection.atomIds);
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

      // Tool shortcuts (non-modifier)
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

      // Space+drag for pan (handled by tool=pan)
      if (toolState.tool === 'select') {
        dragStartRef.current = { x, y };
        isDraggingRef.current = false;
      }
    },
    [toolState.tool, toCanvasCoords, pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Panning
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
        return;
      }

      if (!dragStartRef.current || toolState.tool !== 'select') return;
      const { x, y } = toCanvasCoords(e);
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
        rendererRef.current?.setSelectionRect({
          x1: dragStartRef.current.x,
          y1: dragStartRef.current.y,
          x2: x,
          y2: y,
        });
      }
    },
    [toolState.tool, toCanvasCoords],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // End panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        return;
      }

      const { x, y } = toCanvasCoords(e);

      // --- ATOM TOOL ---
      if (toolState.tool === 'add-atom') {
        const atom = createAtom(x, y, toolState.element);
        store.dispatch({ type: 'add-atom', atom });
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- BOND TOOL ---
      if (toolState.tool === 'add-bond') {
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (bondStartAtomRef.current === null) {
          // First click: select start atom, or create one
          if (hitId) {
            bondStartAtomRef.current = hitId;
          } else {
            const atom = createAtom(x, y, toolState.element);
            store.dispatch({ type: 'add-atom', atom });
            bondStartAtomRef.current = atom.id;
          }
        } else {
          // Second click: connect to target atom
          let targetId = hitId;
          if (!targetId) {
            const atom = createAtom(x, y, toolState.element);
            store.dispatch({ type: 'add-atom', atom });
            targetId = atom.id;
          }
          if (targetId !== bondStartAtomRef.current) {
            // Check if bond already exists between these atoms
            const page = store.getState().pages[store.getState().activePageIndex];
            const existingBond = page
              ? Object.values(page.bonds).find(
                  (b) =>
                    (b.fromAtomId === bondStartAtomRef.current && b.toAtomId === targetId) ||
                    (b.toAtomId === bondStartAtomRef.current && b.fromAtomId === targetId),
                )
              : undefined;
            if (existingBond) {
              store.dispatch({ type: 'cycle-bond', id: existingBond.id });
            } else {
              const order =
                toolState.bondStyle === 'double'
                  ? 2
                  : toolState.bondStyle === 'triple'
                    ? 3
                    : toolState.bondStyle === 'aromatic'
                      ? (1.5 as Bond['order'])
                      : 1;
              const bond = createBond(
                bondStartAtomRef.current,
                targetId,
                order,
                toolState.bondStyle,
              );
              store.dispatch({ type: 'add-bond', bond });
            }
          }
          bondStartAtomRef.current = null;
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- RING TOOL ---
      if (toolState.tool === 'ring') {
        const template = RING_TEMPLATES.find((t) => t.id === toolState.ringTemplate);
        if (template) {
          const ring = generateRing(template, x, y, 50);
          for (const a of ring.atoms) store.dispatch({ type: 'add-atom', atom: a });
          for (const b of ring.bonds) store.dispatch({ type: 'add-bond', bond: b });
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      // --- ERASER TOOL ---
      if (toolState.tool === 'eraser') {
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (hitId) {
          // Remove bonds connected to this atom first
          const page = store.getState().pages[store.getState().activePageIndex];
          if (page) {
            for (const bond of Object.values(page.bonds)) {
              if (bond.fromAtomId === hitId || bond.toAtomId === hitId) {
                store.dispatch({ type: 'remove-bond', id: bond.id });
              }
            }
          }
          store.dispatch({ type: 'remove-atom', id: hitId });
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
    switch (toolState.tool) {
      case 'select':
        return 'default';
      case 'pan':
        return 'grab';
      case 'eraser':
        return 'pointer';
      default:
        return 'crosshair';
    }
  })();

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <ToolPalette toolState={toolState} onToolStateChange={updateToolState} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Status bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 8,
            fontSize: 10,
            color: 'var(--kd-color-text-muted)',
            zIndex: 10,
            display: 'flex',
            gap: 12,
          }}
        >
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          {selection.atomIds.length > 0 && <span>{selection.atomIds.length} selected</span>}
          {valenceIssues.size > 0 && (
            <span style={{ color: 'var(--kd-color-warning)' }}>
              {valenceIssues.size} valence warning{valenceIssues.size > 1 ? 's' : ''}
            </span>
          )}
          {bondStartAtomRef.current && (
            <span style={{ color: 'var(--kd-color-accent)' }}>Click target atom for bond</span>
          )}
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--kd-color-bg-primary)',
            cursor: cursorStyle,
          }}
        />

        <PropertyPanel doc={doc} visible={showProperties} />
      </div>
    </div>
  );
}
