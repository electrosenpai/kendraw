import { produce } from 'immer';
import type { Document, Page } from './types.js';
import type { Command, SceneDiff } from './commands.js';

export type Unsubscribe = () => void;
export type SceneListener = (doc: Document, diff: SceneDiff) => void;

export interface SceneStore {
  getState(): Document;
  subscribe(listener: SceneListener): Unsubscribe;
  dispatch(command: Command): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

function createEmptyPage(): Page {
  return {
    id: crypto.randomUUID(),
    atoms: {} as Page['atoms'],
    bonds: {} as Page['bonds'],
    arrows: {} as Page['arrows'],
    annotations: {} as Page['annotations'],
    groups: {} as Page['groups'],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

export function createEmptyDocument(): Document {
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    metadata: {
      title: 'Untitled',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      appVersion: '0.0.0',
    },
    pages: [createEmptyPage()],
    activePageIndex: 0,
  };
}

function applyCommand(state: Document, command: Command): { next: Document; diff: SceneDiff } {
  const pageIndex = state.activePageIndex;

  switch (command.type) {
    case 'add-atom': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          page.atoms[command.atom.id] = command.atom;
        }
      });
      return { next, diff: { type: 'atom-added', id: command.atom.id } };
    }
    case 'remove-atom': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const { [command.id]: _, ...rest } = page.atoms;
          page.atoms = rest as typeof page.atoms;
        }
      });
      return { next, diff: { type: 'atom-removed', id: command.id } };
    }
    case 'move-atom': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const atom = page.atoms[command.id];
          if (atom) {
            atom.x += command.dx;
            atom.y += command.dy;
          }
        }
      });
      return { next, diff: { type: 'atom-moved', id: command.id } };
    }
  }
}

export function createSceneStore(initialDoc?: Document): SceneStore {
  let state: Document = initialDoc ?? createEmptyDocument();
  const listeners = new Set<SceneListener>();

  // Undo/redo: snapshot-based history stack
  const undoStack: Document[] = [];
  const redoStack: Document[] = [];

  function notify(diff: SceneDiff): void {
    for (const listener of listeners) {
      listener(state, diff);
    }
  }

  return {
    getState(): Document {
      return state;
    },

    subscribe(listener: SceneListener): Unsubscribe {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dispatch(command: Command): void {
      undoStack.push(state);
      redoStack.length = 0; // new action clears redo
      const { next, diff } = applyCommand(state, command);
      state = next;
      notify(diff);
    },

    undo(): void {
      const prev = undoStack.pop();
      if (!prev) return;
      redoStack.push(state);
      state = prev;
      notify({ type: 'state-restored' });
    },

    redo(): void {
      const next = redoStack.pop();
      if (!next) return;
      undoStack.push(state);
      state = next;
      notify({ type: 'state-restored' });
    },

    canUndo(): boolean {
      return undoStack.length > 0;
    },

    canRedo(): boolean {
      return redoStack.length > 0;
    },
  };
}
