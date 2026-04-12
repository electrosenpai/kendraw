import { useRef, useEffect, useCallback, useState, useSyncExternalStore } from 'react';
import {
  createAtom,
  SpatialIndex,
  createSelection,
  addToSelection,
  toggleInSelection,
  clearSelection,
  type SceneStore,
  type Selection,
} from '@kendraw/scene';
import { CanvasRenderer } from '@kendraw/renderer-canvas';

type Tool = 'select' | 'add-atom';

const ATOM_RADIUS = 14;

interface CanvasProps {
  store: SceneStore;
}

export function Canvas({ store }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const spatialIndexRef = useRef(new SpatialIndex());
  const [tool, setTool] = useState<Tool>('add-atom');
  const [selection, setSelection] = useState<Selection>(createSelection());
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    [store],
  );
  const getSnapshot = useCallback(() => store.getState(), [store]);

  const doc = useSyncExternalStore(subscribe, getSnapshot);

  // Rebuild spatial index when doc changes
  useEffect(() => {
    const page = doc.pages[doc.activePageIndex];
    if (page) spatialIndexRef.current.rebuild(page);
  }, [doc]);

  // Sync selection to renderer
  useEffect(() => {
    rendererRef.current?.setSelectedAtoms(new Set(selection.atomIds));
  }, [selection]);

  // Attach renderer on mount
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

  // Re-render when document changes
  useEffect(() => {
    rendererRef.current?.render(doc);
  }, [doc]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;

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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.atomIds.length > 0) {
          e.preventDefault();
          for (const id of selection.atomIds) {
            store.dispatch({ type: 'remove-atom', id });
          }
          setSelection(clearSelection(selection));
        }
        return;
      }
      if (e.key === 'Escape') {
        setSelection(clearSelection(selection));
        return;
      }
      if ((e.key === 'v' || e.key === 'V') && !isMod) {
        setTool('select');
        return;
      }
      if ((e.key === 'a' || e.key === 'A') && !isMod) {
        setTool('add-atom');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, store]);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (tool !== 'select') return;
      const { x, y } = getCanvasCoords(e);
      dragStartRef.current = { x, y };
      isDraggingRef.current = false;
    },
    [tool, getCanvasCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragStartRef.current || tool !== 'select') return;
      const { x, y } = getCanvasCoords(e);
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
    [tool, getCanvasCoords],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { x, y } = getCanvasCoords(e);

      if (tool === 'add-atom') {
        const atom = createAtom(x, y, 6);
        store.dispatch({ type: 'add-atom', atom });
        return;
      }

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
    [tool, getCanvasCoords, store],
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Tool indicator bar */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          gap: 4,
          zIndex: 10,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
        }}
      >
        <button
          onClick={() => setTool('select')}
          style={{
            padding: '4px 10px',
            background: tool === 'select' ? '#4dabf7' : '#2a2a2a',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Select (V)
        </button>
        <button
          onClick={() => setTool('add-atom')}
          style={{
            padding: '4px 10px',
            background: tool === 'add-atom' ? '#4dabf7' : '#2a2a2a',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          Atom (A)
        </button>
        {selection.atomIds.length > 0 && (
          <span style={{ color: '#888', lineHeight: '28px', marginLeft: 8 }}>
            {selection.atomIds.length} selected
          </span>
        )}
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
          cursor: tool === 'select' ? 'default' : 'crosshair',
        }}
      />
    </div>
  );
}
