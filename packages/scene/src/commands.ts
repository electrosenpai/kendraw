import type { Atom, AtomId } from './types.js';

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

export type Command = AddAtomCommand | RemoveAtomCommand | MoveAtomCommand;

export type SceneDiff =
  | { type: 'atom-added'; id: AtomId }
  | { type: 'atom-removed'; id: AtomId }
  | { type: 'atom-moved'; id: AtomId }
  | { type: 'state-restored' };
