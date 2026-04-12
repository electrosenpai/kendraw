import { describe, it, expect, vi } from 'vitest';
import {
  createSceneStore,
  createEmptyDocument,
  NotImplementedError,
} from '../index.js';
import type { Command } from '../index.js';

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
  const placeholder: Command = { type: '__placeholder' };

  describe('getState', () => {
    it('returns the initial empty document when created without args', () => {
      const store = createSceneStore();
      const state = store.getState();
      expect(state.pages).toHaveLength(1);
      expect(state.activePageIndex).toBe(0);
      expect(Object.keys(state.pages[0]!.atoms)).toHaveLength(0);
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

      store.dispatch(placeholder);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(store.getState(), { type: 'noop' });
    });

    it('notifies multiple subscribers', () => {
      const store = createSceneStore();
      const a = vi.fn();
      const b = vi.fn();
      store.subscribe(a);
      store.subscribe(b);

      store.dispatch(placeholder);
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('stops notifying after unsubscribe', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      const unsub = store.subscribe(listener);

      unsub();
      store.dispatch(placeholder);
      expect(listener).not.toHaveBeenCalled();
    });

    it('handles subscribe then immediate unsubscribe', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      const unsub = store.subscribe(listener);
      unsub();

      store.dispatch(placeholder);
      expect(listener).not.toHaveBeenCalled();
    });

    it('double unsubscribe is harmless', () => {
      const store = createSceneStore();
      const listener = vi.fn();
      const unsub = store.subscribe(listener);
      unsub();
      unsub(); // should not throw

      store.dispatch(placeholder);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('dispatch', () => {
    it('does not throw with no subscribers', () => {
      const store = createSceneStore();
      expect(() => store.dispatch(placeholder)).not.toThrow();
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
