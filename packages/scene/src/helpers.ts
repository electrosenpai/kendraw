import type { Atom, AtomId, Bond, BondId } from './types.js';

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

export function createBond(
  fromAtomId: AtomId,
  toAtomId: AtomId,
  order: Bond['order'] = 1,
  style: Bond['style'] = 'single',
): Bond {
  return {
    id: crypto.randomUUID() as BondId,
    fromAtomId,
    toAtomId,
    order,
    style,
  };
}
