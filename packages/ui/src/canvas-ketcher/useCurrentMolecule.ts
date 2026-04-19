// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as Kendraw's
// drawing engine. Ketcher upstream: https://github.com/epam/ketcher
//
// Hook that returns the current molfile regardless of active drawing mode.
// In Ketcher mode it subscribes to the ketcher bridge; in canvas-new / old
// canvas mode it serializes the active scene store's atoms + bonds to
// MOL V2000 on demand.

import { useSyncExternalStore } from 'react';
import type { SceneStore } from '@kendraw/scene';
import { writeMolV2000 } from '@kendraw/io';
import { FEATURE_FLAGS } from '../config/feature-flags';
import { getKetcherBridgeState, subscribeKetcherBridge } from './ketcherBridge';

function subscribeBridge(onChange: () => void): () => void {
  return subscribeKetcherBridge(onChange);
}

function getBridgeMolfile(): string {
  return getKetcherBridgeState().currentMolfile;
}

export function useCurrentMolecule(store: SceneStore | null): string {
  const ketcherMol = useSyncExternalStore(subscribeBridge, getBridgeMolfile);
  const sceneDoc = useSyncExternalStore(
    (cb) => (store ? store.subscribe(cb) : () => {}),
    () => (store ? store.getState() : null),
  );

  if (FEATURE_FLAGS.useKetcher) return ketcherMol;

  if (!sceneDoc) return '';
  const page = sceneDoc.pages[sceneDoc.activePageIndex];
  if (!page) return '';
  const atoms = Object.values(page.atoms);
  const bonds = Object.values(page.bonds);
  if (atoms.length === 0) return '';
  return writeMolV2000(atoms, bonds);
}
