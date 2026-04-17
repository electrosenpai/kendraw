import { describe, it, expect } from 'vitest';
import { createSceneStore, createAtom } from '../index.js';

describe('align-atoms command — wave-2 B1', () => {
  function makeStoreWithThreeAtoms() {
    const store = createSceneStore();
    const a1 = createAtom(100, 200); // top-left-ish
    const a2 = createAtom(150, 50); // highest (smallest y)
    const a3 = createAtom(250, 350); // right-bottom
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'add-atom', atom: a2 });
    store.dispatch({ type: 'add-atom', atom: a3 });
    return { store, a1, a2, a3 };
  }

  it('align left snaps all x to min x', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'left' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(100);
    expect(page?.atoms[a2.id]?.x).toBe(100);
    expect(page?.atoms[a3.id]?.x).toBe(100);
  });

  it('align right snaps all x to max x', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'right' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(250);
    expect(page?.atoms[a2.id]?.x).toBe(250);
    expect(page?.atoms[a3.id]?.x).toBe(250);
  });

  it('align center-x snaps x to bbox midpoint', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'center-x' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(175);
    expect(page?.atoms[a2.id]?.x).toBe(175);
    expect(page?.atoms[a3.id]?.x).toBe(175);
  });

  it('align top snaps all y to min y', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'top' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.y).toBe(50);
    expect(page?.atoms[a2.id]?.y).toBe(50);
    expect(page?.atoms[a3.id]?.y).toBe(50);
  });

  it('align bottom snaps all y to max y', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'bottom' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.y).toBe(350);
    expect(page?.atoms[a2.id]?.y).toBe(350);
    expect(page?.atoms[a3.id]?.y).toBe(350);
  });

  it('align center-y snaps y to bbox midpoint', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'center-y' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.y).toBe(200);
    expect(page?.atoms[a2.id]?.y).toBe(200);
    expect(page?.atoms[a3.id]?.y).toBe(200);
  });

  it('is a no-op for fewer than 2 atoms', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'align-atoms', ids: [a1.id], axis: 'left' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(100);
    expect(page?.atoms[a1.id]?.y).toBe(100);
  });

  it('skips missing ids gracefully', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    const bogus = a1.id.replace(/.$/, '!') as typeof a1.id;
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id, bogus], axis: 'top' });
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.y).toBe(50);
  });

  it('undo reverses alignment', () => {
    const { store, a1, a2, a3 } = makeStoreWithThreeAtoms();
    const beforeA1 = store.getState().pages[0]?.atoms[a1.id]?.x;
    const beforeA2 = store.getState().pages[0]?.atoms[a2.id]?.x;
    const beforeA3 = store.getState().pages[0]?.atoms[a3.id]?.x;
    store.dispatch({ type: 'align-atoms', ids: [a1.id, a2.id, a3.id], axis: 'left' });
    store.undo();
    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(beforeA1);
    expect(page?.atoms[a2.id]?.x).toBe(beforeA2);
    expect(page?.atoms[a3.id]?.x).toBe(beforeA3);
  });
});
