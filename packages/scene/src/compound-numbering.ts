import type { AtomId, Page } from './types.js';

export type CompoundComponent = {
  atomIds: AtomId[];
  bbox: { x: number; y: number; w: number; h: number };
};

export type CompoundLabel = {
  number: number;
  atomIds: AtomId[];
  bbox: { x: number; y: number; w: number; h: number };
};

export function findConnectedComponents(page: Page): CompoundComponent[] {
  const atomIds = Object.keys(page.atoms) as AtomId[];
  if (atomIds.length === 0) return [];

  const adjacency = new Map<AtomId, Set<AtomId>>();
  for (const id of atomIds) adjacency.set(id, new Set());
  for (const bond of Object.values(page.bonds)) {
    if (bond.fromAtomId === bond.toAtomId) continue;
    adjacency.get(bond.fromAtomId)?.add(bond.toAtomId);
    adjacency.get(bond.toAtomId)?.add(bond.fromAtomId);
  }

  const visited = new Set<AtomId>();
  const components: CompoundComponent[] = [];
  for (const start of atomIds) {
    if (visited.has(start)) continue;
    const stack: AtomId[] = [start];
    const group: AtomId[] = [];
    while (stack.length > 0) {
      const id = stack.pop() as AtomId;
      if (visited.has(id)) continue;
      visited.add(id);
      group.push(id);
      const neighbors = adjacency.get(id);
      if (neighbors) for (const n of neighbors) if (!visited.has(n)) stack.push(n);
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const id of group) {
      const a = page.atoms[id];
      if (!a) continue;
      if (a.x < minX) minX = a.x;
      if (a.y < minY) minY = a.y;
      if (a.x > maxX) maxX = a.x;
      if (a.y > maxY) maxY = a.y;
    }
    components.push({
      atomIds: group,
      bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    });
  }
  return components;
}

function readingOrder(a: CompoundComponent, b: CompoundComponent): number {
  const ay = a.bbox.y;
  const by = b.bbox.y;
  const rowTol = 60;
  if (Math.abs(ay - by) > rowTol) return ay - by;
  return a.bbox.x - b.bbox.x;
}

export function reconcileCompoundNumbers(page: Page): void {
  const n = page.compoundNumbering;
  if (!n || !n.enabled) return;
  const components = findConnectedComponents(page);
  const validAtomIds = new Set<AtomId>();
  for (const c of components) for (const id of c.atomIds) validAtomIds.add(id);

  // Drop assignments for atoms that no longer exist
  n.assignments = Object.fromEntries(
    Object.entries(n.assignments).filter(([aid]) => validAtomIds.has(aid as AtomId)),
  ) as Record<AtomId, number>;

  // For each component, keep at most one assignment (the minimum number)
  for (const comp of components) {
    const existing: Array<{ aid: AtomId; num: number }> = [];
    for (const aid of comp.atomIds) {
      const num = n.assignments[aid];
      if (typeof num === 'number') existing.push({ aid, num });
    }
    if (existing.length > 1) {
      existing.sort((a, b) => a.num - b.num);
      const toDrop = new Set(existing.slice(1).map((e) => e.aid));
      n.assignments = Object.fromEntries(
        Object.entries(n.assignments).filter(([aid]) => !toDrop.has(aid as AtomId)),
      ) as Record<AtomId, number>;
    }
    if (existing.length === 0) {
      // Assign next number to canonical atom (reading order: top-left)
      const sorted = comp.atomIds
        .map((id) => ({ id, atom: page.atoms[id] }))
        .filter((e): e is { id: AtomId; atom: NonNullable<(typeof e)['atom']> } => !!e.atom)
        .sort((a, b) => a.atom.y - b.atom.y || a.atom.x - b.atom.x);
      const canonical = sorted[0];
      if (canonical) {
        n.assignments[canonical.id] = n.nextNumber;
        n.nextNumber += 1;
      }
    }
  }
}

export function repackCompoundNumbers(page: Page): void {
  const n = page.compoundNumbering;
  if (!n) return;
  const components = findConnectedComponents(page);
  const ordered = [...components].sort(readingOrder);
  n.assignments = {};
  let counter = 1;
  for (const comp of ordered) {
    const sorted = comp.atomIds
      .map((id) => ({ id, atom: page.atoms[id] }))
      .filter((e): e is { id: AtomId; atom: NonNullable<(typeof e)['atom']> } => !!e.atom)
      .sort((a, b) => a.atom.y - b.atom.y || a.atom.x - b.atom.x);
    const canonical = sorted[0];
    if (canonical) {
      n.assignments[canonical.id] = counter;
      counter += 1;
    }
  }
  n.nextNumber = counter;
}

export function computeCompoundLabels(page: Page): CompoundLabel[] {
  const n = page.compoundNumbering;
  if (!n || !n.enabled) return [];
  const components = findConnectedComponents(page);
  const labels: CompoundLabel[] = [];
  for (const comp of components) {
    let number: number | undefined;
    for (const aid of comp.atomIds) {
      const num = n.assignments[aid];
      if (typeof num === 'number' && (number === undefined || num < number)) number = num;
    }
    if (number !== undefined) labels.push({ number, atomIds: comp.atomIds, bbox: comp.bbox });
  }
  return labels;
}
