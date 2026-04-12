import type { AtomId } from './types.js';

export type SceneDiff =
  | { type: 'atom-added'; id: AtomId }
  | { type: 'atom-removed'; id: AtomId }
  | { type: 'noop' };

// Discriminated union — expanded in STORY-002 with AddAtomCommand, RemoveAtomCommand
export type Command = { type: '__placeholder' };
