import type { AtomId, BondId } from './types.js';

export type Selection = {
  atomIds: AtomId[];
  bondIds: BondId[];
};

export function createSelection(): Selection {
  return { atomIds: [], bondIds: [] };
}

export function addToSelection(
  sel: Selection,
  ids: { atomIds?: AtomId[]; bondIds?: BondId[] },
): Selection {
  const atomSet = new Set(sel.atomIds);
  const bondSet = new Set(sel.bondIds);

  for (const id of ids.atomIds ?? []) atomSet.add(id);
  for (const id of ids.bondIds ?? []) bondSet.add(id);

  return { atomIds: [...atomSet], bondIds: [...bondSet] };
}

export function removeFromSelection(
  sel: Selection,
  ids: { atomIds?: AtomId[]; bondIds?: BondId[] },
): Selection {
  const removeAtoms = new Set(ids.atomIds ?? []);
  const removeBonds = new Set(ids.bondIds ?? []);
  return {
    atomIds: sel.atomIds.filter((id) => !removeAtoms.has(id)),
    bondIds: sel.bondIds.filter((id) => !removeBonds.has(id)),
  };
}

export function toggleInSelection(
  sel: Selection,
  ids: { atomIds?: AtomId[]; bondIds?: BondId[] },
): Selection {
  const atomSet = new Set(sel.atomIds);
  const bondSet = new Set(sel.bondIds);

  for (const id of ids.atomIds ?? []) {
    if (atomSet.has(id)) atomSet.delete(id);
    else atomSet.add(id);
  }
  for (const id of ids.bondIds ?? []) {
    if (bondSet.has(id)) bondSet.delete(id);
    else bondSet.add(id);
  }

  return { atomIds: [...atomSet], bondIds: [...bondSet] };
}

export function clearSelection(_sel: Selection): Selection {
  return createSelection();
}

export function isSelected(sel: Selection, id: AtomId | BondId): boolean {
  return sel.atomIds.includes(id as AtomId) || sel.bondIds.includes(id as BondId);
}
