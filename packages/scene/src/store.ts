import { produce } from 'immer';
import type { Document, Page } from './types.js';
import type { Command, SceneDiff } from './commands.js';
import { NotImplementedError } from './errors.js';

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
          delete page.atoms[command.id];
        }
      });
      return { next, diff: { type: 'atom-removed', id: command.id } };
    }
  }
}

export function createSceneStore(initialDoc?: Document): SceneStore {
  let state: Document = initialDoc ?? createEmptyDocument();
  const listeners = new Set<SceneListener>();
  const history: Command[] = [];

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
      const { next, diff } = applyCommand(state, command);
      state = next;
      history.push(command);
      for (const listener of listeners) {
        listener(state, diff);
      }
    },

    undo(): void {
      throw new NotImplementedError('undo');
    },

    redo(): void {
      throw new NotImplementedError('redo');
    },

    canUndo(): boolean {
      return false;
    },

    canRedo(): boolean {
      return false;
    },
  };
}
