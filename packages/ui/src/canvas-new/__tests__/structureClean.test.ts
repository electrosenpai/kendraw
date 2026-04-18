// Wave-7 HF-3 — unit tests for cleanStructure.

import { describe, it, expect } from 'vitest';
import type {
  Atom,
  AtomId,
  Bond,
  BondId,
  Command,
} from '@kendraw/scene';
import { cleanStructure, type CleanEndpointResponse } from '../structureClean';

function makeAtom(id: string, x: number, y: number, element = 6): Atom {
  return {
    id: id as AtomId,
    x,
    y,
    element,
    charge: 0,
    radicalCount: 0,
    lonePairs: 0,
  };
}

function makeBond(id: string, from: string, to: string): Bond {
  return {
    id: id as BondId,
    fromAtomId: from as AtomId,
    toAtomId: to as AtomId,
    order: 1,
    style: 'single',
  };
}

function responseOk(mol: string): Response {
  return new Response(JSON.stringify({ mol_block: mol, mode: 'quick', success: true, changed: true } satisfies CleanEndpointResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const MINIMAL_MOL = `  Kendraw
     Kendraw  0.0.0

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
M  END`;

describe('cleanStructure', () => {
  it('short-circuits when the page has no atoms', async () => {
    const dispatched: Command[] = [];
    const result = await cleanStructure(
      { atoms: [], bonds: [], dispatch: (c) => dispatched.push(c) },
      'quick',
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('empty');
    expect(dispatched).toEqual([]);
  });

  it('replaces atoms + bonds with the cleaned MOL result on success', async () => {
    const atoms = [makeAtom('a1', 0, 0), makeAtom('a2', 100, 0)];
    const bonds = [makeBond('b1', 'a1', 'a2')];
    const dispatched: Command[] = [];
    const result = await cleanStructure(
      {
        atoms,
        bonds,
        dispatch: (c) => dispatched.push(c),
        fetchImpl: async () => responseOk(MINIMAL_MOL),
      },
      'quick',
    );
    expect(result.ok).toBe(true);
    // first dispatch is remove-batch, then adds
    expect(dispatched[0]?.type).toBe('remove-batch');
    if (dispatched[0]?.type === 'remove-batch') {
      expect(dispatched[0].atomIds).toHaveLength(2);
      expect(dispatched[0].bondIds).toHaveLength(1);
    }
    const addAtoms = dispatched.filter((c) => c.type === 'add-atom');
    const addBonds = dispatched.filter((c) => c.type === 'add-bond');
    expect(addAtoms).toHaveLength(2);
    expect(addBonds).toHaveLength(1);
  });

  it('sends the configured mode to the backend', async () => {
    let bodyMode: string | null = null;
    await cleanStructure(
      {
        atoms: [makeAtom('a1', 0, 0)],
        bonds: [],
        dispatch: () => {},
        fetchImpl: async (_url, init) => {
          const body = JSON.parse(String(init?.body));
          bodyMode = body.mode;
          return responseOk(MINIMAL_MOL);
        },
      },
      'full',
    );
    expect(bodyMode).toBe('full');
  });

  it('does nothing on network failure', async () => {
    const dispatched: Command[] = [];
    const result = await cleanStructure(
      {
        atoms: [makeAtom('a1', 0, 0)],
        bonds: [],
        dispatch: (c) => dispatched.push(c),
        fetchImpl: async () => {
          throw new Error('offline');
        },
      },
      'quick',
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('network');
    expect(dispatched).toEqual([]);
  });

  it('does nothing when the endpoint reports failure', async () => {
    const dispatched: Command[] = [];
    const response = new Response(
      JSON.stringify({ mol_block: '', mode: 'quick', success: false, error: 'RDKit not available' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
    const result = await cleanStructure(
      {
        atoms: [makeAtom('a1', 0, 0)],
        bonds: [],
        dispatch: (c) => dispatched.push(c),
        fetchImpl: async () => response,
      },
      'quick',
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('rdkit');
    expect(dispatched).toEqual([]);
  });

  it('does nothing when the cleaned MOL has no atoms', async () => {
    const dispatched: Command[] = [];
    const emptyMol = `  Kendraw
     Kendraw  0.0.0

  0  0  0  0  0  0  0  0  0  0999 V2000
M  END`;
    const result = await cleanStructure(
      {
        atoms: [makeAtom('a1', 0, 0)],
        bonds: [],
        dispatch: (c) => dispatched.push(c),
        fetchImpl: async () => responseOk(emptyMol),
      },
      'quick',
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('noop');
    expect(dispatched).toEqual([]);
  });
});
