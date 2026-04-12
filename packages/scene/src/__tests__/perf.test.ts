import { describe, it, expect } from 'vitest';
import { createSceneStore, createAtom, SpatialIndex } from '../index.js';

describe('Performance benchmarks (codified)', () => {
  it('dispatches 500 add-atom commands in < 500ms', () => {
    const store = createSceneStore();
    const start = performance.now();
    for (let i = 0; i < 500; i++) {
      store.dispatch({ type: 'add-atom', atom: createAtom(i * 2, i * 2) });
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
    expect(Object.keys(store.getState().pages[0]?.atoms ?? {})).toHaveLength(500);
  });

  it('spatial index rebuild at 500 atoms in < 50ms', () => {
    const store = createSceneStore();
    for (let i = 0; i < 500; i++) {
      store.dispatch({ type: 'add-atom', atom: createAtom(i * 2, i * 2) });
    }

    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');

    const idx = new SpatialIndex();
    const start = performance.now();
    idx.rebuild(page);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('hitTest at 500 atoms in < 5ms', () => {
    const store = createSceneStore();
    for (let i = 0; i < 500; i++) {
      store.dispatch({ type: 'add-atom', atom: createAtom(i * 2, i * 2) });
    }

    const page = store.getState().pages[0];
    if (!page) throw new Error('no page');

    const idx = new SpatialIndex();
    idx.rebuild(page);

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      idx.hitTest(250, 250, 14);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5);
  });

  it('undo/redo 100 operations in < 50ms', () => {
    const store = createSceneStore();
    for (let i = 0; i < 100; i++) {
      store.dispatch({ type: 'add-atom', atom: createAtom(i, i) });
    }

    const start = performance.now();
    for (let i = 0; i < 100; i++) store.undo();
    for (let i = 0; i < 100; i++) store.redo();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
