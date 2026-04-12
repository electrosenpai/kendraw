/**
 * Lightweight SMILES parser that converts SMILES strings to atoms + bonds
 * with 2D coordinate generation. Handles organic subset SMILES.
 *
 * Supports: atoms (CNOSPF, Cl, Br, I, halogens), bonds (single, double,
 * triple, aromatic), branches (), rings (digits), aromatic lowercase,
 * charges [N+], stereo (@/@@ ignored for coords).
 */

import type { Atom, AtomId, Bond, BondId } from '@kendraw/scene';

interface ParsedAtom {
  element: number;
  charge: number;
  aromatic: boolean;
}

interface ParsedBond {
  from: number;
  to: number;
  order: 1 | 2 | 3 | 1.5;
}

const ORGANIC_SUBSET: Record<string, number> = {
  B: 5,
  C: 6,
  N: 7,
  O: 8,
  P: 15,
  S: 16,
  F: 9,
  I: 53,
  b: 5,
  c: 6,
  n: 7,
  o: 8,
  p: 15,
  s: 16,
};

const BRACKET_ELEMENTS: Record<string, number> = {
  H: 1,
  He: 2,
  Li: 3,
  Be: 4,
  B: 5,
  C: 6,
  N: 7,
  O: 8,
  F: 9,
  Ne: 10,
  Na: 11,
  Mg: 12,
  Al: 13,
  Si: 14,
  P: 15,
  S: 16,
  Cl: 17,
  Ar: 18,
  K: 19,
  Ca: 20,
  Fe: 26,
  Cu: 29,
  Zn: 30,
  Br: 35,
  I: 53,
};

export interface SmilesParseResult {
  atoms: Atom[];
  bonds: Bond[];
}

export function parseSmiles(smiles: string): SmilesParseResult {
  const atoms: ParsedAtom[] = [];
  const bonds: ParsedBond[] = [];
  const stack: number[] = []; // branch stack
  const ringOpens = new Map<number, { atomIdx: number; bondOrder: 1 | 2 | 3 | 1.5 }>();
  let current = -1;
  let nextBondOrder: 1 | 2 | 3 | 1.5 = 1;
  let i = 0;

  while (i < smiles.length) {
    const ch = smiles[i];
    if (!ch) break;

    // Branch open
    if (ch === '(') {
      stack.push(current);
      i++;
      continue;
    }

    // Branch close
    if (ch === ')') {
      current = stack.pop() ?? current;
      i++;
      continue;
    }

    // Bond order
    if (ch === '=') {
      nextBondOrder = 2;
      i++;
      continue;
    }
    if (ch === '#') {
      nextBondOrder = 3;
      i++;
      continue;
    }
    if (ch === ':') {
      nextBondOrder = 1.5;
      i++;
      continue;
    }
    if (ch === '-') {
      nextBondOrder = 1;
      i++;
      continue;
    }
    if (ch === '/' || ch === '\\') {
      i++;
      continue;
    } // stereo ignored

    // Dot (disconnected fragment)
    if (ch === '.') {
      current = -1;
      i++;
      continue;
    }

    // Ring closure digit
    if (ch >= '0' && ch <= '9') {
      const ringNum = parseInt(ch, 10);
      handleRing(ringNum, current, nextBondOrder, atoms, bonds, ringOpens);
      nextBondOrder = 1;
      i++;
      continue;
    }
    if (ch === '%') {
      const ringNum = parseInt(smiles.substring(i + 1, i + 3), 10);
      handleRing(ringNum, current, nextBondOrder, atoms, bonds, ringOpens);
      nextBondOrder = 1;
      i += 3;
      continue;
    }

    // Bracket atom [...]
    if (ch === '[') {
      const close = smiles.indexOf(']', i);
      if (close === -1) break;
      const bracket = smiles.substring(i + 1, close);
      const parsed = parseBracketAtom(bracket);
      const newIdx = atoms.length;
      atoms.push(parsed);
      if (current >= 0) {
        bonds.push({ from: current, to: newIdx, order: nextBondOrder });
      }
      current = newIdx;
      nextBondOrder = 1;
      i = close + 1;
      continue;
    }

    // Two-letter atoms: Cl, Br
    if (ch === 'C' && smiles[i + 1] === 'l') {
      const newIdx = atoms.length;
      atoms.push({ element: 17, charge: 0, aromatic: false });
      if (current >= 0) bonds.push({ from: current, to: newIdx, order: nextBondOrder });
      current = newIdx;
      nextBondOrder = 1;
      i += 2;
      continue;
    }
    if (ch === 'B' && smiles[i + 1] === 'r') {
      const newIdx = atoms.length;
      atoms.push({ element: 35, charge: 0, aromatic: false });
      if (current >= 0) bonds.push({ from: current, to: newIdx, order: nextBondOrder });
      current = newIdx;
      nextBondOrder = 1;
      i += 2;
      continue;
    }

    // Organic subset atom
    const element = ORGANIC_SUBSET[ch];
    if (element !== undefined) {
      const isAromatic = ch >= 'a' && ch <= 'z';
      const newIdx = atoms.length;
      atoms.push({ element, charge: 0, aromatic: isAromatic });
      if (current >= 0) {
        const order = isAromatic && atoms[current]?.aromatic ? (1.5 as const) : nextBondOrder;
        bonds.push({ from: current, to: newIdx, order });
      }
      current = newIdx;
      nextBondOrder = 1;
      i++;
      continue;
    }

    // Skip unknown
    i++;
  }

  // Generate 2D coordinates
  const coords = layout2D(atoms.length, bonds);

  // Convert to scene types
  const sceneAtoms: Atom[] = atoms.map((a, idx) => {
    const coord = coords[idx] ?? { x: 0, y: 0 };
    return {
      id: crypto.randomUUID() as AtomId,
      x: coord.x,
      y: coord.y,
      element: a.element,
      charge: a.charge,
      radicalCount: 0 as const,
      lonePairs: 0,
    };
  });

  const sceneBonds: Bond[] = [];
  for (const b of bonds) {
    const fromAtom = sceneAtoms[b.from];
    const toAtom = sceneAtoms[b.to];
    if (!fromAtom || !toAtom) continue;
    const style: Bond['style'] =
      b.order === 2 ? 'double' : b.order === 3 ? 'triple' : b.order === 1.5 ? 'aromatic' : 'single';
    sceneBonds.push({
      id: crypto.randomUUID() as BondId,
      fromAtomId: fromAtom.id,
      toAtomId: toAtom.id,
      order: b.order,
      style,
    });
  }

  return { atoms: sceneAtoms, bonds: sceneBonds };
}

function handleRing(
  ringNum: number,
  current: number,
  bondOrder: 1 | 2 | 3 | 1.5,
  atoms: ParsedAtom[],
  bonds: ParsedBond[],
  ringOpens: Map<number, { atomIdx: number; bondOrder: 1 | 2 | 3 | 1.5 }>,
): void {
  const existing = ringOpens.get(ringNum);
  if (existing) {
    // Close ring
    const order =
      bondOrder !== 1
        ? bondOrder
        : atoms[existing.atomIdx]?.aromatic && atoms[current]?.aromatic
          ? (1.5 as const)
          : existing.bondOrder;
    bonds.push({ from: existing.atomIdx, to: current, order });
    ringOpens.delete(ringNum);
  } else {
    // Open ring
    ringOpens.set(ringNum, { atomIdx: current, bondOrder });
  }
}

function parseBracketAtom(bracket: string): ParsedAtom {
  let charge = 0;
  let element = 6;
  let aromatic = false;

  // Strip isotope prefix (digits at start)
  let s = bracket.replace(/^[0-9]+/, '');
  // Strip @ stereo
  s = s.replace(/@+/g, '');
  // Strip H count
  s = s.replace(/H[0-9]*/g, '');

  // Parse charge
  const chargeMatch = s.match(/([+-])([0-9]*)/);
  if (chargeMatch) {
    const sign = chargeMatch[1] === '+' ? 1 : -1;
    const mag = chargeMatch[2] ? parseInt(chargeMatch[2], 10) : 1;
    charge = sign * mag;
    s = s.replace(/[+-][0-9]*/g, '');
  }

  // What remains should be element symbol
  s = s.trim();
  if (s.length > 0) {
    const upper = s.charAt(0).toUpperCase() + s.slice(1);
    aromatic = s.charAt(0) >= 'a' && s.charAt(0) <= 'z';
    element = BRACKET_ELEMENTS[upper] ?? BRACKET_ELEMENTS[s.charAt(0).toUpperCase()] ?? 6;
  }

  return { element, charge, aromatic };
}

/**
 * Simple force-directed 2D layout.
 * Places atoms using adjacency info to create reasonable molecular layouts.
 */
function layout2D(atomCount: number, bonds: ParsedBond[]): { x: number; y: number }[] {
  if (atomCount === 0) return [];

  const adj: number[][] = Array.from({ length: atomCount }, () => []);
  for (const b of bonds) {
    adj[b.from]?.push(b.to);
    adj[b.to]?.push(b.from);
  }

  const BOND_LEN = 40;
  const cx = Array.from({ length: atomCount }, () => 0);
  const cy = Array.from({ length: atomCount }, () => 0);
  const placed = new Set<number>();
  const queue: number[] = [0];
  placed.add(0);
  cx[0] = 300;
  cy[0] = 300;

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    const neighbors = adj[cur] ?? [];
    const placedNeighbors = neighbors.filter((n) => placed.has(n));
    let baseAngle = 0;

    if (placedNeighbors.length > 0) {
      const pn = placedNeighbors[0] ?? 0;
      baseAngle = Math.atan2((cy[cur] ?? 0) - (cy[pn] ?? 0), (cx[cur] ?? 0) - (cx[pn] ?? 0));
    }

    const unplaced = neighbors.filter((n) => !placed.has(n));
    const spread = Math.PI * 0.6;
    const startAngle = baseAngle - (spread * (unplaced.length - 1)) / 2;

    for (let j = 0; j < unplaced.length; j++) {
      const n = unplaced[j];
      if (n === undefined) continue;
      const angle =
        unplaced.length === 1
          ? baseAngle + (Math.PI / 3) * (j % 2 === 0 ? 1 : -1)
          : startAngle + spread * j;
      cx[n] = (cx[cur] ?? 0) + BOND_LEN * Math.cos(angle);
      cy[n] = (cy[cur] ?? 0) + BOND_LEN * Math.sin(angle);
      placed.add(n);
      queue.push(n);
    }
  }

  // Place disconnected atoms
  let offsetX = 0;
  for (let i = 0; i < atomCount; i++) {
    if (!placed.has(i)) {
      cx[i] = 300 + offsetX;
      cy[i] = 400;
      offsetX += BOND_LEN;
      placed.add(i);
    }
  }

  // Spring relaxation (20 iterations)
  const fx = Array.from({ length: atomCount }, () => 0);
  const fy = Array.from({ length: atomCount }, () => 0);

  for (let iter = 0; iter < 20; iter++) {
    fx.fill(0);
    fy.fill(0);

    // Repulsion
    for (let a = 0; a < atomCount; a++) {
      for (let b = a + 1; b < atomCount; b++) {
        const dx = (cx[b] ?? 0) - (cx[a] ?? 0);
        const dy = (cy[b] ?? 0) - (cy[a] ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        if (dist < BOND_LEN * 2) {
          const f = (BOND_LEN * 2 - dist) * 0.1;
          const ffx = (dx / dist) * f;
          const ffy = (dy / dist) * f;
          fx[a] = (fx[a] ?? 0) - ffx;
          fy[a] = (fy[a] ?? 0) - ffy;
          fx[b] = (fx[b] ?? 0) + ffx;
          fy[b] = (fy[b] ?? 0) + ffy;
        }
      }
    }

    // Spring attraction
    for (const b of bonds) {
      const dx = (cx[b.to] ?? 0) - (cx[b.from] ?? 0);
      const dy = (cy[b.to] ?? 0) - (cy[b.from] ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const f = (dist - BOND_LEN) * 0.05;
      const ffx = (dx / dist) * f;
      const ffy = (dy / dist) * f;
      fx[b.from] = (fx[b.from] ?? 0) + ffx;
      fy[b.from] = (fy[b.from] ?? 0) + ffy;
      fx[b.to] = (fx[b.to] ?? 0) - ffx;
      fy[b.to] = (fy[b.to] ?? 0) - ffy;
    }

    // Apply
    for (let a = 0; a < atomCount; a++) {
      cx[a] = (cx[a] ?? 0) + (fx[a] ?? 0);
      cy[a] = (cy[a] ?? 0) + (fy[a] ?? 0);
    }
  }

  return cx.map((x, i) => ({ x, y: cy[i] ?? 0 }));
}
