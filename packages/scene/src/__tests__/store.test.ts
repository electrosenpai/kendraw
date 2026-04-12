import { describe, it, expect, vi } from 'vitest';
import {
  createSceneStore,
  createEmptyDocument,
  createAtom,
  NotImplementedError,
} from '../index.js';

describe('createEmptyDocument', () => {
  it('returns a valid document with one page', () => {
    const doc = createEmptyDocument();
    expect(doc.id).toBeDefined();
    expect(doc.schemaVersion).toBe(1);
    expect(doc.pages).toHaveLength(1);
    expect(doc.activePageIndex).toBe(0);
    expect(doc.metadata.title).toBe('Untitled');
  });

  it('generates unique IDs across calls', () => {
    const a = createEmptyDocument();
    const b = createEmptyDocument();
    expect(a.id).not.toBe(b.id);
  });
});

describe('SceneStore', () => {
  describe('getState', () => {
    it('returns the initial empty document when created without args', () => {
      const store = createSceneStore();
      const state = store.getState();
      expect(state.pages).toHaveLength(1);
      expect(state.activePageIndex).toBe(0);
      expect(Object.keys(state.pages[0]?.atoms ?? {})).toHaveLength(0);
    });

    it('returns the provided initial document', () => {
      const doc = createEmptyDocument();
      doc.metadata.title = 'Test Doc';
      const store = createSceneStore(doc);
      expect(store.getState().metadata.title).toBe('Test Doc');
    });
  });

  describe('subscribe / unsubscribe', () => {
    it('notifies a subscriber on dispatch', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      store.subscribe(listener);

      const atom = createAtom(10, 20);
      store.dispatch({ type: 'add-atom', atom });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(store.getState(), { type: 'atom-added', id: atom.id });
    });

    it('notifies multiple subscribers', () => {
      const store = createSceneStore();
      const a = vi.fn();
      const b = vi.fn();
      store.subscribe(a);
      store.subscribe(b);

      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('stops notifying after unsubscribe', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      const unsub = store.subscribe(listener);

      unsub();
      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      expect(listener).not.toHaveBeenCalled();
    });

    it('handles subscribe then immediate unsubscribe', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      const unsub = store.subscribe(listener);
      unsub();

      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      expect(listener).not.toHaveBeenCalled();
    });

    it('double unsubscribe is harmless', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      const unsub = store.subscribe(listener);
      unsub();
      unsub();

      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('dispatch with no subscribers', () => {
    it('does not throw', () => {
      const store = createSceneStore();
      expect(() => store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) })).not.toThrow();
    });
  });

  describe('AddAtomCommand', () => {
    it('adds an atom to the active page', () => {
      const store = createSceneStore();
      const atom = createAtom(100, 200, 8); // oxygen

      store.dispatch({ type: 'add-atom', atom });

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.atoms[atom.id]).toEqual(atom);
    });

    it('adds multiple atoms', () => {
      const store = createSceneStore();
      const a1 = createAtom(10, 20, 6);
      const a2 = createAtom(30, 40, 7);
      const a3 = createAtom(50, 60, 8);

      store.dispatch({ type: 'add-atom', atom: a1 });
      store.dispatch({ type: 'add-atom', atom: a2 });
      store.dispatch({ type: 'add-atom', atom: a3 });

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(Object.keys(page.atoms)).toHaveLength(3);
      expect(page.atoms[a1.id]).toEqual(a1);
      expect(page.atoms[a2.id]).toEqual(a2);
      expect(page.atoms[a3.id]).toEqual(a3);
    });

    it('emits atom-added diff', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      store.subscribe(listener);

      const atom = createAtom(0, 0);
      store.dispatch({ type: 'add-atom', atom });

      expect(listener).toHaveBeenCalledWith(expect.anything(), { type: 'atom-added', id: atom.id });
    });
  });

  describe('RemoveAtomCommand', () => {
    it('removes an atom from the active page', () => {
      const store = createSceneStore();
      const atom = createAtom(10, 20);

      store.dispatch({ type: 'add-atom', atom });
      store.dispatch({ type: 'remove-atom', id: atom.id });

      const page = store.getState().pages[0];
      expect(page).toBeDefined();
      if (!page) return;
      expect(page.atoms[atom.id]).toBeUndefined();
    });

    it('emits atom-removed diff', () => {
      const store = createSceneStore();
      const atom = createAtom(0, 0);
      store.dispatch({ type: 'add-atom', atom });

      const listener = vi.fn();
      store.subscribe(listener);
      store.dispatch({ type: 'remove-atom', id: atom.id });

      expect(listener).toHaveBeenCalledWith(expect.anything(), {
        type: 'atom-removed',
        id: atom.id,
      });
    });

    it('removing non-existent atom does not throw', () => {
      const store = createSceneStore();
      const atom = createAtom(0, 0);
      expect(() => store.dispatch({ type: 'remove-atom', id: atom.id })).not.toThrow();
    });
  });

  describe('structural sharing (Immer)', () => {
    it('produces a new state reference on dispatch', () => {
      const store = createSceneStore();
      const prev = store.getState();

      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      const next = store.getState();

      expect(next).not.toBe(prev);
    });

    it('preserves metadata reference when only atoms change', () => {
      const store = createSceneStore();
      const prev = store.getState();

      store.dispatch({ type: 'add-atom', atom: createAtom(0, 0) });
      const next = store.getState();

      expect(next.metadata).toBe(prev.metadata);
    });
  });

  describe('undo / redo', () => {
    it('undo throws NotImplementedError', () => {
      const store = createSceneStore();
      expect(() => store.undo()).toThrow(NotImplementedError);
    });

    it('redo throws NotImplementedError', () => {
      const store = createSceneStore();
      expect(() => store.redo()).toThrow(NotImplementedError);
    });

    it('canUndo returns false', () => {
      const store = createSceneStore();
      expect(store.canUndo()).toBe(false);
    });

    it('canRedo returns false', () => {
      const store = createSceneStore();
      expect(store.canRedo()).toBe(false);
    });
  });
});

describe('createAtom', () => {
  it('creates a carbon atom by default', () => {
    const atom = createAtom(10, 20);
    expect(atom.element).toBe(6);
    expect(atom.x).toBe(10);
    expect(atom.y).toBe(20);
    expect(atom.charge).toBe(0);
    expect(atom.radicalCount).toBe(0);
    expect(atom.id).toBeDefined();
  });

  it('creates atom with custom element', () => {
    const atom = createAtom(0, 0, 8);
    expect(atom.element).toBe(8);
  });

  it('generates unique IDs', () => {
    const a = createAtom(0, 0);
    const b = createAtom(0, 0);
    expect(a.id).not.toBe(b.id);
  });
});
