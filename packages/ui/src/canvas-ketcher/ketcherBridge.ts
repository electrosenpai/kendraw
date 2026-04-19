// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as Kendraw's
// drawing engine. Ketcher upstream: https://github.com/epam/ketcher
//
// The bridge is a lightweight module-level store that tracks the live
// Ketcher instance, the current molfile exported from the canvas, and the
// current selection (atom indexes). Panels read from this bridge via
// useCurrentMolecule() / useKetcherSelection() instead of reaching into the
// Ketcher API directly, which keeps React components free of async Ketcher
// calls.

import type { Ketcher } from 'ketcher-core';

export interface KetcherSelection {
  atoms: readonly number[];
}

export interface KetcherBridgeState {
  ketcher: Ketcher | null;
  currentMolfile: string;
  selection: KetcherSelection;
}

type Listener = (state: KetcherBridgeState) => void;

const EMPTY_SELECTION: KetcherSelection = { atoms: [] };

let state: KetcherBridgeState = {
  ketcher: null,
  currentMolfile: '',
  selection: EMPTY_SELECTION,
};

const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) listener(state);
}

export function getKetcherBridgeState(): KetcherBridgeState {
  return state;
}

export function subscribeKetcherBridge(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setKetcherInstance(ketcher: Ketcher | null): void {
  if (state.ketcher === ketcher) return;
  state = { ...state, ketcher };
  notify();
}

export function setKetcherMolfile(molfile: string): void {
  if (state.currentMolfile === molfile) return;
  state = { ...state, currentMolfile: molfile };
  notify();
}

export function setKetcherSelection(atoms: readonly number[]): void {
  const next = atoms.length === 0 ? EMPTY_SELECTION : { atoms: [...atoms] };
  if (
    next.atoms.length === state.selection.atoms.length &&
    next.atoms.every((id, i) => id === state.selection.atoms[i])
  ) {
    return;
  }
  state = { ...state, selection: next };
  notify();
}

export function resetKetcherBridge(): void {
  state = { ketcher: null, currentMolfile: '', selection: EMPTY_SELECTION };
  notify();
}
