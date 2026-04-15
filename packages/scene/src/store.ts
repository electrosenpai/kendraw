import { produce } from 'immer';
import type { Bond, Document, Page } from './types.js';
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
    case 'move-batch': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          for (const id of command.ids) {
            const atom = page.atoms[id];
            if (atom) {
              atom.x += command.dx;
              atom.y += command.dy;
            }
          }
        }
      });
      return { next, diff: { type: 'batch-moved' } };
    }
    case 'update-atom': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const atom = page.atoms[command.id];
          if (atom) {
            Object.assign(atom, command.changes);
          }
        }
      });
      return { next, diff: { type: 'atom-updated', id: command.id } };
    }
    case 'add-bond': {
      // Guard: no self-bonds
      if (command.bond.fromAtomId === command.bond.toAtomId) {
        return { next: state, diff: { type: 'bond-added', id: command.bond.id } };
      }
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          page.bonds[command.bond.id] = command.bond;
        }
      });
      return { next, diff: { type: 'bond-added', id: command.bond.id } };
    }
    case 'remove-bond': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const { [command.id]: _, ...rest } = page.bonds;
          page.bonds = rest as typeof page.bonds;
        }
      });
      return { next, diff: { type: 'bond-removed', id: command.id } };
    }
    case 'cycle-bond': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const bond = page.bonds[command.id];
          if (bond) {
            const cycleMap: Record<string, { order: Bond['order']; style: Bond['style'] }> = {
              single: { order: 2, style: 'double' },
              double: { order: 3, style: 'triple' },
              triple: { order: 1, style: 'single' },
              aromatic: { order: 1, style: 'single' },
              wedge: { order: 1, style: 'dash' },
              dash: { order: 1, style: 'single' },
              wavy: { order: 1, style: 'single' },
              dative: { order: 1, style: 'single' },
              bold: { order: 1, style: 'single' },
            };
            const cycled = cycleMap[bond.style] ?? { order: 1 as const, style: 'single' as const };
            bond.order = cycled.order;
            bond.style = cycled.style;
          }
        }
      });
      return { next, diff: { type: 'bond-cycled', id: command.id } };
    }
    case 'set-bond-style': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const bond = page.bonds[command.id];
          if (bond) {
            bond.style = command.style;
            bond.order = command.order;
          }
        }
      });
      return { next, diff: { type: 'bond-style-set', id: command.id } };
    }
    case 'add-arrow': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          page.arrows[command.arrow.id] = command.arrow;
        }
      });
      return { next, diff: { type: 'arrow-added', id: command.arrow.id } };
    }
    case 'remove-arrow': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const { [command.id]: _, ...rest } = page.arrows;
          page.arrows = rest as typeof page.arrows;
        }
      });
      return { next, diff: { type: 'arrow-removed', id: command.id } };
    }
    case 'add-annotation': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          page.annotations[command.annotation.id] = command.annotation;
        }
      });
      return { next, diff: { type: 'annotation-added', id: command.annotation.id } };
    }
    case 'remove-annotation': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          const { [command.id]: _, ...rest } = page.annotations;
          page.annotations = rest as typeof page.annotations;
        }
      });
      return { next, diff: { type: 'annotation-removed', id: command.id } };
    }
    case 'update-annotation': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        const ann = page?.annotations[command.id];
        if (ann) {
          Object.assign(ann, command.changes);
        }
      });
      return { next, diff: { type: 'annotation-updated', id: command.id } };
    }
    case 'move-annotation': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        const ann = page?.annotations[command.id];
        if (ann) {
          ann.x += command.dx;
          ann.y += command.dy;
        }
      });
      return { next, diff: { type: 'annotation-moved', id: command.id } };
    }
    case 'set-nmr-prediction': {
      const next = produce(state, (draft) => {
        const page = draft.pages[pageIndex];
        if (page) {
          if (command.prediction === undefined) {
            delete page.nmrPrediction;
          } else {
            page.nmrPrediction = command.prediction;
          }
        }
      });
      return { next, diff: { type: 'nmr-prediction-set' } };
    }
  }
}

export function createSceneStore(initialDoc?: Document): SceneStore {
  let state: Document = initialDoc ?? createEmptyDocument();
  const listeners = new Set<SceneListener>();

  // Undo/redo: snapshot-based history stack (capped at 200)
  const MAX_UNDO_DEPTH = 200;
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
      if (undoStack.length > MAX_UNDO_DEPTH) undoStack.shift();
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
