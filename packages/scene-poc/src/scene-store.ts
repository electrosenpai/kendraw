import { produce, type Draft } from 'immer';
import type { Atom, Bond, Page } from './types.js';

export type Command =
  | { type: 'add-atom'; atom: Atom }
  | { type: 'remove-atom'; id: string }
  | { type: 'move-atom'; id: string; dx: number; dy: number }
  | { type: 'add-bond'; bond: Bond };

export function applyCommand(state: Page, cmd: Command): Page {
  return produce(state, (draft: Draft<Page>) => {
    switch (cmd.type) {
      case 'add-atom':
        draft.atoms[cmd.atom.id] = cmd.atom;
        break;
      case 'remove-atom':
        delete draft.atoms[cmd.id];
        break;
      case 'move-atom': {
        const atom = draft.atoms[cmd.id];
        if (atom) {
          atom.x += cmd.dx;
          atom.y += cmd.dy;
        }
        break;
      }
      case 'add-bond':
        draft.bonds[cmd.bond.id] = cmd.bond;
        break;
    }
  });
}

export function createEmptyPage(): Page {
  return { atoms: {}, bonds: {} };
}
