import type { Atom, AtomId, Bond, BondId } from './types.js';

export type AddAtomCommand = {
  type: 'add-atom';
  atom: Atom;
};

export type RemoveAtomCommand = {
  type: 'remove-atom';
  id: AtomId;
};

export type MoveAtomCommand = {
  type: 'move-atom';
  id: AtomId;
  dx: number;
  dy: number;
};

export type UpdateAtomCommand = {
  type: 'update-atom';
  id: AtomId;
  changes: Partial<Pick<Atom, 'element' | 'charge' | 'label' | 'radicalCount' | 'lonePairs'>>;
};

export type AddBondCommand = {
  type: 'add-bond';
  bond: Bond;
};

export type RemoveBondCommand = {
  type: 'remove-bond';
  id: BondId;
};

export type CycleBondCommand = {
  type: 'cycle-bond';
  id: BondId;
};

export type Command =
  | AddAtomCommand
  | RemoveAtomCommand
  | MoveAtomCommand
  | UpdateAtomCommand
  | AddBondCommand
  | RemoveBondCommand
  | CycleBondCommand;

export type SceneDiff =
  | { type: 'atom-added'; id: AtomId }
  | { type: 'atom-removed'; id: AtomId }
  | { type: 'atom-moved'; id: AtomId }
  | { type: 'atom-updated'; id: AtomId }
  | { type: 'bond-added'; id: BondId }
  | { type: 'bond-removed'; id: BondId }
  | { type: 'bond-cycled'; id: BondId }
  | { type: 'state-restored' };
