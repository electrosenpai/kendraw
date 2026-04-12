import { describe, it, expect } from 'vitest';
import { createSceneStore, createAtom, createBond, floodSelectMolecule } from '../index.js';
import type { Page, ArrowId, AnnotationId, GroupId } from '../types.js';

describe('move-batch command', () => {
  it('moves multiple atoms by the same delta', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 100);
    const a2 = createAtom(200, 200);
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'add-atom', atom: a2 });

    store.dispatch({ type: 'move-batch', ids: [a1.id, a2.id], dx: 50, dy: -30 });

    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(150);
    expect(page?.atoms[a1.id]?.y).toBe(70);
    expect(page?.atoms[a2.id]?.x).toBe(250);
    expect(page?.atoms[a2.id]?.y).toBe(170);
  });

  it('undo reverses batch move', () => {
    const store = createSceneStore();
    const a1 = createAtom(100, 100);
    store.dispatch({ type: 'add-atom', atom: a1 });
    store.dispatch({ type: 'move-batch', ids: [a1.id], dx: 50, dy: 50 });
    store.undo();

    const page = store.getState().pages[0];
    expect(page?.atoms[a1.id]?.x).toBe(100);
    expect(page?.atoms[a1.id]?.y).toBe(100);
  });
});

describe('floodSelectMolecule', () => {
  function makePage(
    atoms: ReturnType<typeof createAtom>[],
    bonds: ReturnType<typeof createBond>[] = [],
  ): Page {
    const atomMap = {} as Page['atoms'];
    for (const a of atoms) atomMap[a.id] = a;
    const bondMap = {} as Page['bonds'];
    for (const b of bonds) bondMap[b.id] = b;
    return {
      id: 'test',
      atoms: atomMap,
      bonds: bondMap,
      arrows: {} as Record<ArrowId, never>,
      annotations: {} as Record<AnnotationId, never>,
      groups: {} as Record<GroupId, never>,
      viewport: { x: 0, y: 0, zoom: 1 },
    };
  }

  it('selects all atoms in a connected molecule', () => {
    const a1 = createAtom(0, 0);
    const a2 = createAtom(50, 0);
    const a3 = createAtom(100, 0);
    const b1 = createBond(a1.id, a2.id);
    const b2 = createBond(a2.id, a3.id);
    const page = makePage([a1, a2, a3], [b1, b2]);

    const selected = floodSelectMolecule(page, a1.id);
    expect(selected).toContain(a1.id);
    expect(selected).toContain(a2.id);
    expect(selected).toContain(a3.id);
  });

  it('does not select disconnected atoms', () => {
    const a1 = createAtom(0, 0);
    const a2 = createAtom(50, 0);
    const a3 = createAtom(200, 200); // disconnected
    const b1 = createBond(a1.id, a2.id);
    const page = makePage([a1, a2, a3], [b1]);

    const selected = floodSelectMolecule(page, a1.id);
    expect(selected).toContain(a1.id);
    expect(selected).toContain(a2.id);
    expect(selected).not.toContain(a3.id);
  });

  it('returns single atom if no bonds', () => {
    const a1 = createAtom(0, 0);
    const page = makePage([a1]);
    const selected = floodSelectMolecule(page, a1.id);
    expect(selected).toEqual([a1.id]);
  });
});
