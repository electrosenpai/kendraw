/**
 * NMR prediction scope: derive the atoms/bonds to predict on from the
 * current canvas selection.
 *
 * - No selection → full canvas
 * - Valid connected selection → filtered subset
 * - Disconnected selection → caller is expected to warn and skip prediction
 *
 * Ordering note: atoms are emitted in the same key-order as `page.atoms`
 * (filtered by selection when applicable) so that backend-returned
 * `parent_indices` map back to scene atom IDs consistently.
 */
import type { Atom, AtomId, Bond, Page } from '@kendraw/scene';
import { floodSelectMolecule } from '@kendraw/scene';

export type NmrScope =
  | { kind: 'full'; atoms: Atom[]; bonds: Bond[]; atomIds: AtomId[] }
  | { kind: 'selection'; atoms: Atom[]; bonds: Bond[]; atomIds: AtomId[] }
  | { kind: 'disconnected' };

export function computeScope(
  page: Page,
  selection: AtomId[] | undefined,
): NmrScope {
  const allAtomEntries = Object.entries(page.atoms) as [AtomId, Atom][];
  const allBonds = Object.values(page.bonds);

  if (!selection || selection.length === 0) {
    return {
      kind: 'full',
      atoms: allAtomEntries.map(([, a]) => a),
      bonds: allBonds,
      atomIds: allAtomEntries.map(([id]) => id),
    };
  }

  const selSet = new Set(selection);
  const anchor = selection[0];
  if (!anchor || !page.atoms[anchor]) {
    return {
      kind: 'full',
      atoms: allAtomEntries.map(([, a]) => a),
      bonds: allBonds,
      atomIds: allAtomEntries.map(([id]) => id),
    };
  }

  // Connectivity: flood from an anchor atom of the selection. Every selected
  // atom must be reachable from the anchor through bonds that connect
  // selected atoms to each other. A single-atom selection is trivially
  // connected.
  const reachable = new Set(floodSelectMolecule(page, anchor));
  for (const id of selSet) {
    if (!reachable.has(id)) {
      return { kind: 'disconnected' };
    }
  }

  const filteredAtomEntries = allAtomEntries.filter(([id]) => selSet.has(id));
  const filteredBonds = allBonds.filter(
    (b) => selSet.has(b.fromAtomId) && selSet.has(b.toAtomId),
  );
  return {
    kind: 'selection',
    atoms: filteredAtomEntries.map(([, a]) => a),
    bonds: filteredBonds,
    atomIds: filteredAtomEntries.map(([id]) => id),
  };
}
