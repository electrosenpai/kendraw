// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as Kendraw's
// drawing engine. Ketcher upstream: https://github.com/epam/ketcher

import { beforeEach, describe, expect, it } from 'vitest';
import { writeMolV2000 } from '@kendraw/io';
import { createAtom, createBond, type NmrPrediction } from '@kendraw/scene';
import { resetKetcherBridge, setKetcherMolfile } from '../ketcherBridge';
import { createKetcherSceneStore } from '../ketcherSceneStore';

function buildCCOMol(): string {
  const c1 = createAtom(0, 0, 6);
  const c2 = createAtom(40, 0, 6);
  const o = createAtom(80, 0, 8);
  const b1 = createBond(c1.id, c2.id, 1);
  const b2 = createBond(c2.id, o.id, 1);
  return writeMolV2000([c1, c2, o], [b1, b2]);
}

describe('createKetcherSceneStore', () => {
  beforeEach(() => {
    resetKetcherBridge();
  });

  it('exposes an empty document when the bridge has no molfile', () => {
    const { store, dispose } = createKetcherSceneStore();
    const doc = store.getState();
    const page = doc.pages[0];
    expect(page).toBeDefined();
    expect(Object.keys(page?.atoms ?? {})).toHaveLength(0);
    expect(Object.keys(page?.bonds ?? {})).toHaveLength(0);
    dispose();
  });

  it('rebuilds the document when the bridge molfile changes', () => {
    const { store, dispose } = createKetcherSceneStore();
    let notifications = 0;
    store.subscribe(() => {
      notifications += 1;
    });
    setKetcherMolfile(buildCCOMol());
    const page = store.getState().pages[0];
    expect(Object.keys(page?.atoms ?? {})).toHaveLength(3);
    expect(Object.keys(page?.bonds ?? {})).toHaveLength(2);
    expect(notifications).toBe(1);
    dispose();
  });

  it('handles set-nmr-prediction commands and ignores everything else', () => {
    const { store, dispose } = createKetcherSceneStore();
    // Non-NMR commands are silently dropped.
    store.dispatch({
      type: 'add-atom',
      atom: createAtom(0, 0, 6),
    });
    expect(Object.keys(store.getState().pages[0]?.atoms ?? {})).toHaveLength(0);

    // NMR predictions land on the active page.
    const prediction = {
      nucleus: '1H',
      solvent: 'cdcl3',
      peaks: [],
      metadata: {
        engine: 'shim',
        engine_version: '0',
        data_version: null,
        method: 'test',
      },
    } as NmrPrediction;
    store.dispatch({ type: 'set-nmr-prediction', prediction });
    expect(store.getState().pages[0]?.nmrPrediction).toEqual(prediction);

    store.dispatch({ type: 'set-nmr-prediction', prediction: undefined });
    expect(store.getState().pages[0]?.nmrPrediction).toBeUndefined();
    dispose();
  });
});
