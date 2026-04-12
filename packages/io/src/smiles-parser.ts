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
 * 2D layout with ring detection and polygon placement.
 * 1. Detect all rings via DFS back-edges
 * 2. Place ring atoms as regular polygons
 * 3. Place chain atoms via BFS with chemical angles
 * 4. Spring relaxation to resolve overlaps
 */
function layout2D(atomCount: number, bonds: ParsedBond[]): { x: number; y: number }[] {
  if (atomCount === 0) return [];

  const adj: number[][] = Array.from({ length: atomCount }, () => []);
  for (const b of bonds) {
    adj[b.from]?.push(b.to);
    adj[b.to]?.push(b.from);
  }

  const BOND_LEN = 40;
  const posX = Array.from({ length: atomCount }, () => 0);
  const posY = Array.from({ length: atomCount }, () => 0);
  const placed = new Set<number>();

  // --- Step 1: Find rings via DFS ---
  const rings = findRings(atomCount, adj);

  // --- Step 2: Place ring atoms as regular polygons ---
  const ringPlaced = new Set<number>();
  let ringOffsetX = 300;
  for (const ring of rings) {
    // Check if any atom in this ring is already placed
    let anchorIdx = -1;
    const anchorAngle = -Math.PI / 2; // default: first atom at top
    for (const atomIdx of ring) {
      if (ringPlaced.has(atomIdx)) {
        anchorIdx = atomIdx;
        break;
      }
    }

    const n = ring.length;
    const radius = BOND_LEN / (2 * Math.sin(Math.PI / n)); // polygon circumradius

    let centerX: number;
    let centerY: number;

    if (anchorIdx >= 0) {
      // Compute center from the anchor atom position
      const ai = ring.indexOf(anchorIdx);
      const aAngle = anchorAngle + (2 * Math.PI * ai) / n;
      centerX = (posX[anchorIdx] ?? 0) - radius * Math.cos(aAngle);
      centerY = (posY[anchorIdx] ?? 0) - radius * Math.sin(aAngle);
    } else {
      centerX = ringOffsetX;
      centerY = 300;
      ringOffsetX += radius * 2.5;
    }

    for (let i = 0; i < n; i++) {
      const atomIdx = ring[i];
      if (atomIdx === undefined) continue;
      if (ringPlaced.has(atomIdx)) continue; // already placed by another ring
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      posX[atomIdx] = centerX + radius * Math.cos(angle);
      posY[atomIdx] = centerY + radius * Math.sin(angle);
      placed.add(atomIdx);
      ringPlaced.add(atomIdx);
    }
  }

  // --- Step 3: BFS for chain atoms (non-ring) ---
  // Start from ring atoms or atom 0
  const bfsStart: number[] = [];
  for (const atomIdx of placed) bfsStart.push(atomIdx);
  if (bfsStart.length === 0) {
    bfsStart.push(0);
    posX[0] = 300;
    posY[0] = 300;
    placed.add(0);
  }

  const queue = [...bfsStart];
  let zigzagSign = 1;

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === undefined) break;
    const neighbors = adj[cur] ?? [];
    const unplaced = neighbors.filter((n) => !placed.has(n));
    if (unplaced.length === 0) continue;

    // Find angle away from placed neighbors
    const placedNbrs = neighbors.filter((n) => placed.has(n));
    let baseAngle = 0;
    if (placedNbrs.length > 0) {
      // Average angle FROM cur TO placed neighbors, then go opposite
      let sumSin = 0;
      let sumCos = 0;
      for (const pn of placedNbrs) {
        const a = Math.atan2(
          (posY[pn] ?? 0) - (posY[cur] ?? 0),
          (posX[pn] ?? 0) - (posX[cur] ?? 0),
        );
        sumSin += Math.sin(a);
        sumCos += Math.cos(a);
      }
      baseAngle = Math.atan2(sumSin, sumCos) + Math.PI; // opposite direction
    }

    const chemAngle = (2 * Math.PI) / 3; // 120° default

    for (let j = 0; j < unplaced.length; j++) {
      const n = unplaced[j];
      if (n === undefined) continue;

      let angle: number;
      if (unplaced.length === 1) {
        angle = baseAngle + (chemAngle / 3) * zigzagSign;
        zigzagSign *= -1;
      } else {
        const totalArc = chemAngle * (unplaced.length - 1);
        angle = baseAngle - totalArc / 2 + chemAngle * j;
      }

      posX[n] = (posX[cur] ?? 0) + BOND_LEN * Math.cos(angle);
      posY[n] = (posY[cur] ?? 0) + BOND_LEN * Math.sin(angle);
      placed.add(n);
      queue.push(n);
    }
  }

  // Place any remaining disconnected atoms
  let offsetX = 0;
  for (let i = 0; i < atomCount; i++) {
    if (!placed.has(i)) {
      posX[i] = 500 + offsetX;
      posY[i] = 300;
      offsetX += BOND_LEN;
      placed.add(i);
    }
  }

  // --- Step 4: Spring relaxation (30 iterations) ---
  const fx = Array.from({ length: atomCount }, () => 0);
  const fy = Array.from({ length: atomCount }, () => 0);

  for (let iter = 0; iter < 30; iter++) {
    fx.fill(0);
    fy.fill(0);

    // Repulsion between non-bonded close atoms
    for (let a = 0; a < atomCount; a++) {
      for (let b = a + 1; b < atomCount; b++) {
        const dx = (posX[b] ?? 0) - (posX[a] ?? 0);
        const dy = (posY[b] ?? 0) - (posY[a] ?? 0);
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        if (dist < BOND_LEN * 1.8) {
          const f = (BOND_LEN * 1.8 - dist) * 0.08;
          const ffx = (dx / dist) * f;
          const ffy = (dy / dist) * f;
          fx[a] = (fx[a] ?? 0) - ffx;
          fy[a] = (fy[a] ?? 0) - ffy;
          fx[b] = (fx[b] ?? 0) + ffx;
          fy[b] = (fy[b] ?? 0) + ffy;
        }
      }
    }

    // Spring attraction for bonds
    for (const b of bonds) {
      const dx = (posX[b.to] ?? 0) - (posX[b.from] ?? 0);
      const dy = (posY[b.to] ?? 0) - (posY[b.from] ?? 0);
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      const f = (dist - BOND_LEN) * 0.03;
      const ffx = (dx / dist) * f;
      const ffy = (dy / dist) * f;
      fx[b.from] = (fx[b.from] ?? 0) + ffx;
      fy[b.from] = (fy[b.from] ?? 0) + ffy;
      fx[b.to] = (fx[b.to] ?? 0) - ffx;
      fy[b.to] = (fy[b.to] ?? 0) - ffy;
    }

    for (let a = 0; a < atomCount; a++) {
      // Ring atoms get reduced force (preserve polygon shape)
      const damping = ringPlaced.has(a) ? 0.2 : 1.0;
      posX[a] = (posX[a] ?? 0) + (fx[a] ?? 0) * damping;
      posY[a] = (posY[a] ?? 0) + (fy[a] ?? 0) * damping;
    }
  }

  return posX.map((x, i) => ({ x, y: posY[i] ?? 0 }));
}

/**
 * Find rings using DFS back-edge detection.
 * Returns arrays of atom indices forming each ring.
 */
function findRings(atomCount: number, adj: number[][]): number[][] {
  const rings: number[][] = [];
  const visited = new Set<number>();
  const parent = new Map<number, number>();

  function dfs(node: number, par: number): void {
    visited.add(node);
    parent.set(node, par);
    for (const neighbor of adj[node] ?? []) {
      if (neighbor === par) continue;
      if (visited.has(neighbor)) {
        // Back edge found — extract ring
        const ring: number[] = [neighbor];
        let cur = node;
        while (cur !== neighbor) {
          ring.push(cur);
          cur = parent.get(cur) ?? neighbor;
          if (ring.length > atomCount) break; // safety
        }
        if (ring.length >= 3 && ring.length <= 8) {
          rings.push(ring);
        }
      } else {
        dfs(neighbor, node);
      }
    }
  }

  for (let i = 0; i < atomCount; i++) {
    if (!visited.has(i)) dfs(i, -1);
  }

  // Remove duplicate rings (same atoms, different order)
  const unique: number[][] = [];
  const seen = new Set<string>();
  for (const ring of rings) {
    const key = [...ring].sort((a, b) => a - b).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ring);
    }
  }

  return unique;
}
