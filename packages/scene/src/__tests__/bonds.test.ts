import { describe, it, expect } from 'vitest';
import { createSceneStore, createAtom, createBond } from '../index.js';

describe('Bond commands', () => {
  describe('add-bond', () => {
    it('adds a bond between two atoms', () => {
      const store = createSceneStore();
      const a1 = createAtom(0, 0);
      const a2 = createAtom(100, 0);
      store.dispatch({ type: 'add-atom', atom: a1 });
      store.dispatch({ type: 'add-atom', atom: a2 });

      const bond = createBond(a1.id, a2.id);
      store.dispatch({ type: 'add-bond', bond });

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.bonds[bond.id]).toEqual(bond);
    });
  });

  describe('remove-bond', () => {
    it('removes a bond', () => {
      const store = createSceneStore();
      const a1 = createAtom(0, 0);
      const a2 = createAtom(100, 0);
      store.dispatch({ type: 'add-atom', atom: a1 });
      store.dispatch({ type: 'add-atom', atom: a2 });

      const bond = createBond(a1.id, a2.id);
      store.dispatch({ type: 'add-bond', bond });
      store.dispatch({ type: 'remove-bond', id: bond.id });

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.bonds[bond.id]).toBeUndefined();
    });
  });

  describe('cycle-bond', () => {
    it('cycles single -> double -> triple -> single', () => {
      const store = createSceneStore();
      const a1 = createAtom(0, 0);
      const a2 = createAtom(100, 0);
      store.dispatch({ type: 'add-atom', atom: a1 });
      store.dispatch({ type: 'add-atom', atom: a2 });

      const bond = createBond(a1.id, a2.id, 1, 'single');
      store.dispatch({ type: 'add-bond', bond });

      // single -> double
      store.dispatch({ type: 'cycle-bond', id: bond.id });
      let page = store.getState().pages[0];
      expect(page?.bonds[bond.id]?.order).toBe(2);
      expect(page?.bonds[bond.id]?.style).toBe('double');

      // double -> triple
      store.dispatch({ type: 'cycle-bond', id: bond.id });
      page = store.getState().pages[0];
      expect(page?.bonds[bond.id]?.order).toBe(3);
      expect(page?.bonds[bond.id]?.style).toBe('triple');

      // triple -> single
      store.dispatch({ type: 'cycle-bond', id: bond.id });
      page = store.getState().pages[0];
      expect(page?.bonds[bond.id]?.order).toBe(1);
      expect(page?.bonds[bond.id]?.style).toBe('single');
    });
  });

  describe('update-atom', () => {
    it('updates atom element', () => {
      const store = createSceneStore();
      const atom = createAtom(0, 0, 6);
      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'update-atom', id: atom.id, changes: { element: 7 } });

      const page = store.getState().pages[0];
      expect(page?.atoms[atom.id]?.element).toBe(7);
    });

    it('updates atom charge', () => {
      const store = createSceneStore();
      const atom = createAtom(0, 0);
      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'update-atom', id: atom.id, changes: { charge: -1 } });

      const page = store.getState().pages[0];
      expect(page?.atoms[atom.id]?.charge).toBe(-1);
    });

    it('updates atom label', () => {
      const store = createSceneStore();
      const atom = createAtom(0, 0);
      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'update-atom', id: atom.id, changes: { label: 'R1' } });

      const page = store.getState().pages[0];
      expect(page?.atoms[atom.id]?.label).toBe('R1');
    });
  });
});
