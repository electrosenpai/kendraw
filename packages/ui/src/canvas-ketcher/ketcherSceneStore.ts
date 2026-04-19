// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as Kendraw's
// drawing engine. Ketcher upstream: https://github.com/epam/ketcher
//
// SceneStore shim that lets Kendraw panels (NmrPanel, anything else that
// expects `SceneStore`) consume Ketcher-authored molecules without
// modification. Pattern:
//   1. Subscribe to the ketcher bridge.
//   2. On currentMolfile change, parse MOL V2000 into a synthetic
//      Document and notify listeners with a `state-restored` diff.
//   3. The `set-nmr-prediction` command is the only command we honour —
//      we store the prediction in the page so NmrPanel can read it back.
//      Every other mutation is ignored: Ketcher owns the canvas.
//
// Undo/redo are not supported via this shim — NmrPanel does not call them
// and Ketcher has its own history stack accessible via ketcher.editor.

import { produce } from 'immer';
import type {
  Command,
  Document,
  SceneDiff,
  SceneListener,
  SceneStore,
  Unsubscribe,
} from '@kendraw/scene';
import { createEmptyDocument } from '@kendraw/scene';
import { parseMolV2000 } from '@kendraw/io';
import { getKetcherBridgeState, subscribeKetcherBridge } from './ketcherBridge';

function buildDocumentFromMolfile(molfile: string): Document {
  const doc = createEmptyDocument();
  if (!molfile.trim()) return doc;
  try {
    const { atoms, bonds } = parseMolV2000(molfile);
    return produce(doc, (draft: Document) => {
      const page = draft.pages[0];
      if (!page) return;
      for (const atom of atoms) page.atoms[atom.id] = atom;
      for (const bond of bonds) page.bonds[bond.id] = bond;
    });
  } catch {
    return doc;
  }
}

export function createKetcherSceneStore(): { store: SceneStore; dispose: () => void } {
  let cachedMolfile = '';
  let cachedDoc = createEmptyDocument();
  const listeners = new Set<SceneListener>();

  const notify = (diff: SceneDiff): void => {
    for (const listener of listeners) listener(cachedDoc, diff);
  };

  const refresh = (molfile: string): void => {
    if (molfile === cachedMolfile) return;
    cachedMolfile = molfile;
    cachedDoc = buildDocumentFromMolfile(molfile);
    notify({ type: 'state-restored' });
  };

  refresh(getKetcherBridgeState().currentMolfile);
  const bridgeUnsub = subscribeKetcherBridge((s) => refresh(s.currentMolfile));

  const store: SceneStore = {
    getState(): Document {
      return cachedDoc;
    },
    subscribe(listener: SceneListener): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(command: Command): void {
      if (command.type !== 'set-nmr-prediction') return;
      cachedDoc = produce(cachedDoc, (draft: Document) => {
        const page = draft.pages[draft.activePageIndex];
        if (!page) return;
        if (command.prediction === undefined) {
          delete page.nmrPrediction;
        } else {
          page.nmrPrediction = command.prediction;
        }
      });
      notify({ type: 'nmr-prediction-set' });
    },
    undo(): void {
      /* Ketcher owns history; no-op here. */
    },
    redo(): void {
      /* Ketcher owns history; no-op here. */
    },
    canUndo(): boolean {
      return false;
    },
    canRedo(): boolean {
      return false;
    },
  };

  return {
    store,
    dispose(): void {
      bridgeUnsub();
      listeners.clear();
    },
  };
}
