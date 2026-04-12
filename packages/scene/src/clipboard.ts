import type { Atom, AtomId, Bond, BondId, Page } from './types.js';

export interface ClipboardData {
  atoms: Atom[];
  bonds: Bond[];
}

export function copySelection(page: Page, selectedAtomIds: AtomId[]): ClipboardData {
  const atomSet = new Set(selectedAtomIds);
  const atoms = selectedAtomIds
    .map((id) => page.atoms[id])
    .filter((a): a is Atom => a !== undefined);

  // Include bonds where both endpoints are selected
  const bonds = Object.values(page.bonds).filter(
    (b) => atomSet.has(b.fromAtomId) && atomSet.has(b.toAtomId),
  );

  return { atoms, bonds };
}

export function prepareForPaste(
  data: ClipboardData,
  offsetX: number,
  offsetY: number,
): { atoms: Atom[]; bonds: Bond[] } {
  // Generate new IDs and remap
  const idMap = new Map<AtomId, AtomId>();

  const atoms = data.atoms.map((a) => {
    const newId = crypto.randomUUID() as AtomId;
    idMap.set(a.id, newId);
    return { ...a, id: newId, x: a.x + offsetX, y: a.y + offsetY };
  });

  const bonds = data.bonds
    .map((b) => {
      const newFromId = idMap.get(b.fromAtomId);
      const newToId = idMap.get(b.toAtomId);
      if (!newFromId || !newToId) return null;
      return {
        ...b,
        id: crypto.randomUUID() as BondId,
        fromAtomId: newFromId,
        toAtomId: newToId,
      };
    })
    .filter((b): b is Bond => b !== null);

  return { atoms, bonds };
}
