import { useState } from 'react';
import { cloneSnapshot } from '../chem/document';
import type { EditorSnapshot, SnapshotCommand } from '../chem/types';

interface EditorStore {
  snapshot: EditorSnapshot;
  history: SnapshotCommand[];
  future: SnapshotCommand[];
}

function snapshotsMatch(a: EditorSnapshot, b: EditorSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useEditorStore(initialSnapshot: EditorSnapshot) {
  const [store, setStore] = useState<EditorStore>({
    snapshot: initialSnapshot,
    history: [],
    future: [],
  });

  function patch(transform: (draft: EditorSnapshot) => void) {
    setStore((current) => {
      const nextSnapshot = cloneSnapshot(current.snapshot);
      transform(nextSnapshot);
      return {
        ...current,
        snapshot: nextSnapshot,
      };
    });
  }

  function commit(label: string, before: EditorSnapshot, after: EditorSnapshot) {
    if (snapshotsMatch(before, after)) {
      setStore((current) => ({
        ...current,
        snapshot: after,
      }));
      return;
    }

    const command: SnapshotCommand = {
      label,
      apply() {
        return cloneSnapshot(after);
      },
      revert() {
        return cloneSnapshot(before);
      },
    };

    setStore((current) => ({
      snapshot: command.apply(),
      history: [...current.history.slice(-99), command],
      future: [],
    }));
  }

  function execute(label: string, transform: (draft: EditorSnapshot) => void) {
    const before = cloneSnapshot(store.snapshot);
    const after = cloneSnapshot(store.snapshot);
    transform(after);
    commit(label, before, after);
  }

  function undo() {
    setStore((current) => {
      const command = current.history.at(-1);
      if (!command) {
        return current;
      }

      return {
        snapshot: command.revert(),
        history: current.history.slice(0, -1),
        future: [command, ...current.future],
      };
    });
  }

  function redo() {
    setStore((current) => {
      const command = current.future[0];
      if (!command) {
        return current;
      }

      return {
        snapshot: command.apply(),
        history: [...current.history, command].slice(-100),
        future: current.future.slice(1),
      };
    });
  }

  function reset(snapshot: EditorSnapshot) {
    setStore({
      snapshot,
      history: [],
      future: [],
    });
  }

  return {
    snapshot: store.snapshot,
    canUndo: store.history.length > 0,
    canRedo: store.future.length > 0,
    history: store.history,
    patch,
    commit,
    execute,
    undo,
    redo,
    reset,
  };
}
