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
import { ToolPalette, type ToolId } from './ToolPalette';

const ATOM_RADIUS = 14;

interface CanvasProps {
  store: SceneStore;
}

export function Canvas({ store }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const spatialIndexRef = useRef(new SpatialIndex());
  const [tool, setTool] = useState<ToolId>('add-atom');
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
      if (!isMod) {
        const toolMap: Record<string, ToolId> = {
          v: 'select',
          V: 'select',
          a: 'add-atom',
          A: 'add-atom',
          e: 'eraser',
          E: 'eraser',
          h: 'pan',
          H: 'pan',
        };
        const mapped = toolMap[e.key];
        if (mapped) {
          setTool(mapped);
          return;
        }
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
        dragStartRef.current = null;
        isDraggingRef.current = false;
        return;
      }

      if (tool === 'eraser') {
        const hitId = spatialIndexRef.current.hitTest(x, y, ATOM_RADIUS);
        if (hitId) {
          store.dispatch({ type: 'remove-atom', id: hitId });
        }
        dragStartRef.current = null;
        isDraggingRef.current = false;
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
      <ToolPalette activeTool={tool} onToolChange={setTool} />

      {/* Selection indicator */}
      {selection.atomIds.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 60,
            color: 'var(--kd-color-text-muted)',
            fontSize: 'var(--kd-font-size-sm)',
            zIndex: 10,
          }}
        >
          {selection.atomIds.length} selected
        </div>
      )}

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
          cursor:
            tool === 'select'
              ? 'default'
              : tool === 'pan'
                ? 'grab'
                : tool === 'eraser'
                  ? 'pointer'
                  : 'crosshair',
        }}
      />
    </div>
  );
}
