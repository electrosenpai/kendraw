import type { AtomId, Page } from './types.js';

/**
 * BFS from a start atom through bonds to select the entire connected molecule.
 */
export function floodSelectMolecule(page: Page, startId: AtomId): AtomId[] {
  // Build adjacency from bonds
  const adj = new Map<AtomId, AtomId[]>();
  for (const bond of Object.values(page.bonds)) {
    if (!adj.has(bond.fromAtomId)) adj.set(bond.fromAtomId, []);
    if (!adj.has(bond.toAtomId)) adj.set(bond.toAtomId, []);
    adj.get(bond.fromAtomId)?.push(bond.toAtomId);
    adj.get(bond.toAtomId)?.push(bond.fromAtomId);
  }

  const visited = new Set<AtomId>();
  const queue: AtomId[] = [startId];
  visited.add(startId);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur) break;
    const neighbors = adj.get(cur) ?? [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }

  return [...visited];
}
