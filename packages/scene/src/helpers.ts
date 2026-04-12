import type { Atom, AtomId } from './types.js';

export function createAtom(
  x: number,
  y: number,
  element: number = 6, // carbon
): Atom {
  return {
    id: crypto.randomUUID() as AtomId,
    x,
    y,
    element,
    charge: 0,
    radicalCount: 0,
    lonePairs: 0,
  };
}
