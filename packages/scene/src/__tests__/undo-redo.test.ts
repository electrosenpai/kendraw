import { describe, it, expect, vi } from 'vitest';
import { createSceneStore, createAtom } from '../index.js';

describe('Undo/Redo', () => {
  describe('canUndo / canRedo', () => {
    it('canUndo is false initially', () => {
      const store = createSceneStore();
      expect(store.canUndo()).toBe(false);
    });

    it('canRedo is false initially', () => {
      const store = createSceneStore();
      expect(store.canRedo()).toBe(false);
    });

    it('canUndo is true after a dispatch', () => {
      const store = createSceneStore();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      expect(store.canUndo()).toBe(true);
    });

    it('canRedo is true after an undo', () => {
      const store = createSceneStore();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      store.undo();
      expect(store.canRedo()).toBe(true);
    });

    it('canRedo becomes false after new dispatch', () => {
      const store = createSceneStore();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      store.undo();
      store.dispatch({ type: 'add-atom', atom: createAtom(10, 10) });
      expect(store.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('reverses an add-atom', () => {
      const store = createSceneStore();
      const atom = createAtom(100, 200);
      store.dispatch({ type: 'add-atom', atom });

      store.undo();

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.atoms[atom.id]).toBeUndefined();
    });

    it('reverses a remove-atom', () => {
      const store = createSceneStore();
      const atom = createAtom(100, 200);
      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'remove-atom', id: atom.id });

      store.undo();

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.atoms[atom.id]).toEqual(atom);
    });

    it('multiple undos work in order', () => {
      const store = createSceneStore();
      const a1 = createAtom(10, 20);
      const a2 = createAtom(30, 40);
      store.dispatch({ type: 'add-atom', atom: a1 });
      store.dispatch({ type: 'add-atom', atom: a2 });

      store.undo(); // remove a2
      const page1 = store.getState().pages[0];
      expect(page1).toBeDefined();
      if (!page1) return;
      expect(page1.atoms[a2.id]).toBeUndefined();
      expect(page1.atoms[a1.id]).toEqual(a1);

      store.undo(); // remove a1
      const page2 = store.getState().pages[0];
      expect(page2).toBeDefined();
      if (!page2) return;
      expect(page2.atoms[a1.id]).toBeUndefined();
    });

    it('undo at the beginning is a no-op', () => {
      const store = createSceneStore();
      const stateBefore = store.getState();
      store.undo();
      expect(store.getState()).toBe(stateBefore);
    });

    it('undo notifies listeners', () => {
      const store = createSceneStore();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });

      const listener = vi.fn();
      store.subscribe(listener);
      store.undo();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('redo', () => {
    it('redoes an undone add-atom', () => {
      const store = createSceneStore();
      const atom = createAtom(100, 200);
      store.dispatch({ type: 'add-atom', atom });

      store.undo();
      store.redo();

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.atoms[atom.id]).toEqual(atom);
    });

    it('redo at end is a no-op', () => {
      const store = createSceneStore();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      const stateAfter = store.getState();
      store.redo();
      expect(store.getState()).toBe(stateAfter);
    });

    it('redo notifies listeners', () => {
      const store = createSceneStore();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      store.undo();

      const listener = vi.fn();
      store.subscribe(listener);
      store.redo();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('new dispatch after undo clears redo stack', () => {
      const store = createSceneStore();
      const a1 = createAtom(10, 20);
      const a2 = createAtom(30, 40);
      store.dispatch({ type: 'add-atom', atom: a1 });
      store.undo();
      store.dispatch({ type: 'add-atom', atom: a2 });

      expect(store.canRedo()).toBe(false);
      store.redo(); // should be no-op
      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.atoms[a1.id]).toBeUndefined();
      expect(page.atoms[a2.id]).toEqual(a2);
    });
  });

  describe('move-atom command + undo', () => {
    it('undo reverses a move', () => {
      const store = createSceneStore();
      const atom = createAtom(100, 200);
      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'move-atom', id: atom.id, dx: 50, dy: -30 });

      store.undo();

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      const restored = page.atoms[atom.id];
      expect(restored?.x).toBe(100);
      expect(restored?.y).toBe(200);
    });
  });
});
