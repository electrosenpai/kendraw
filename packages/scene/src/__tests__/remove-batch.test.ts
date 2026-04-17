import { describe, it, expect } from 'vitest';
import { createSceneStore, createAtom, createBond } from '../index.js';
import type { AtomId } from '../types.js';

describe('remove-batch command (W4-R-11)', () => {
  it('removes the listed atoms and cascades incident bonds', () => {
    const store = createSceneStore();
    const a = createAtom(0, 0);
    const b = createAtom(40, 0);
    const c = createAtom(80, 0);
    store.dispatch({ type: 'add-atom', atom: a });
    store.dispatch({ type: 'add-atom', atom: b });
    store.dispatch({ type: 'add-atom', atom: c });
    const ab = createBond(a.id, b.id);
    const bc = createBond(b.id, c.id);
    store.dispatch({ type: 'add-bond', bond: ab });
    store.dispatch({ type: 'add-bond', bond: bc });

    store.dispatch({ type: 'remove-batch', atomIds: [b.id], bondIds: [] });

    const page = store.getState().pages[0];
    if (!page) throw new Error('expected page');
    expect(Object.keys(page.atoms)).toEqual([a.id, c.id]);
    expect(Object.keys(page.bonds)).toEqual([]); // both bonds cascaded
  });

  it('removes explicit bonds without their atoms when only bondIds is set', () => {
    const store = createSceneStore();
    const a = createAtom(0, 0);
    const b = createAtom(40, 0);
    store.dispatch({ type: 'add-atom', atom: a });
    store.dispatch({ type: 'add-atom', atom: b });
    const bond = createBond(a.id, b.id);
    store.dispatch({ type: 'add-bond', bond });

    store.dispatch({
      type: 'remove-batch',
      atomIds: [],
      bondIds: [bond.id],
    });

    const page = store.getState().pages[0];
    if (!page) throw new Error('expected page');
    expect(Object.keys(page.atoms)).toEqual([a.id, b.id]);
    expect(Object.keys(page.bonds)).toEqual([]);
  });

  it('is a single undo step', () => {
    const store = createSceneStore();
    const a = createAtom(0, 0);
    const b = createAtom(40, 0);
    store.dispatch({ type: 'add-atom', atom: a });
    store.dispatch({ type: 'add-atom', atom: b });
    const bond = createBond(a.id, b.id);
    store.dispatch({ type: 'add-bond', bond });

    store.dispatch({
      type: 'remove-batch',
      atomIds: [a.id, b.id],
      bondIds: [],
    });
    const removed = store.getState().pages[0];
    if (!removed) throw new Error('expected page');
    expect(removed.atoms).toEqual({});

    store.undo();
    const restored = store.getState().pages[0];
    if (!restored) throw new Error('expected page');
    expect(Object.keys(restored.atoms)).toEqual([a.id, b.id]);
    expect(Object.keys(restored.bonds)).toEqual([bond.id]);
  });

  it('empty payload is a no-op', () => {
    const store = createSceneStore();
    const before = store.getState();
    store.dispatch({
      type: 'remove-batch',
      atomIds: [] as AtomId[],
      bondIds: [],
    });
    // The state itself is replaced by produce, but content is identical.
    const after = store.getState().pages[0];
    const initial = before.pages[0];
    if (!after || !initial) throw new Error('expected page');
    expect(after.atoms).toEqual(initial.atoms);
    expect(after.bonds).toEqual(initial.bonds);
  });
});
