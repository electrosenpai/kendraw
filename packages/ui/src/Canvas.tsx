import { useRef, useEffect, useCallback, useSyncExternalStore } from 'react';
import { createSceneStore, createAtom, type SceneStore, type Document } from '@kendraw/scene';
import { CanvasRenderer } from '@kendraw/renderer-canvas';

// Singleton store — lives outside React to be framework-agnostic
const store: SceneStore = createSceneStore();

// Expose store for E2E testing in dev mode
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__kendraw_store__ = store;
}

function subscribeToStore(onStoreChange: () => void) {
  return store.subscribe(onStoreChange);
}

function getSnapshot(): Document {
  return store.getState();
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Subscribe to store via useSyncExternalStore (React 18 concurrent-safe)
  const doc = useSyncExternalStore(subscribeToStore, getSnapshot);

  // Attach renderer on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new CanvasRenderer();
    renderer.attach(container);
    rendererRef.current = renderer;

    // Initial render
    renderer.render(store.getState());

    return () => {
      renderer.detach();
      rendererRef.current = null;
    };
  }, []);

  // Re-render when document changes
  useEffect(() => {
    rendererRef.current?.render(doc);
  }, [doc]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const atom = createAtom(x, y, 6); // carbon
    store.dispatch({ type: 'add-atom', atom });
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        cursor: 'crosshair',
      }}
    />
  );
}
