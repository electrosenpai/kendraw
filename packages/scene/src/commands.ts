import type { Atom, AtomId } from './types.js';

export type AddAtomCommand = {
  type: 'add-atom';
  atom: Atom;
};

export type RemoveAtomCommand = {
  type: 'remove-atom';
  id: AtomId;
};

export type Command = AddAtomCommand | RemoveAtomCommand;

export type SceneDiff = { type: 'atom-added'; id: AtomId } | { type: 'atom-removed'; id: AtomId };
