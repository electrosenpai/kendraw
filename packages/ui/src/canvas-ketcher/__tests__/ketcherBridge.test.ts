// Attribution: Integrates Ketcher (EPAM Systems, Apache 2.0) as Kendraw's
// drawing engine. Ketcher upstream: https://github.com/epam/ketcher

import { beforeEach, describe, expect, it } from 'vitest';
import {
  getKetcherBridgeState,
  resetKetcherBridge,
  setKetcherMolfile,
  setKetcherSelection,
  subscribeKetcherBridge,
} from '../ketcherBridge';

describe('ketcherBridge', () => {
  beforeEach(() => {
    resetKetcherBridge();
  });

  it('starts with an empty molfile and empty selection', () => {
    const state = getKetcherBridgeState();
    expect(state.currentMolfile).toBe('');
    expect(state.selection.atoms).toEqual([]);
    expect(state.ketcher).toBeNull();
  });

  it('notifies subscribers when the molfile changes', () => {
    let notifications = 0;
    subscribeKetcherBridge(() => {
      notifications += 1;
    });
    setKetcherMolfile('mol-body');
    setKetcherMolfile('mol-body'); // no-op: identical
    setKetcherMolfile('mol-body-2');
    expect(notifications).toBe(2);
    expect(getKetcherBridgeState().currentMolfile).toBe('mol-body-2');
  });

  it('stores selection atoms and dedupes identical updates', () => {
    let notifications = 0;
    subscribeKetcherBridge(() => {
      notifications += 1;
    });
    setKetcherSelection([0, 1, 2]);
    setKetcherSelection([0, 1, 2]); // no-op
    setKetcherSelection([]);
    setKetcherSelection([]); // no-op
    expect(notifications).toBe(2);
    expect(getKetcherBridgeState().selection.atoms).toEqual([]);
  });

  it('subscribe() returns an unsubscribe function', () => {
    let calls = 0;
    const unsub = subscribeKetcherBridge(() => {
      calls += 1;
    });
    setKetcherMolfile('a');
    unsub();
    setKetcherMolfile('b');
    expect(calls).toBe(1);
  });
});
