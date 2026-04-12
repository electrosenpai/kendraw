import type { AtomId } from './types.js';
import { createAtom, createBond } from './helpers.js';

export interface RingTemplate {
  id: string;
  name: string;
  shortcut?: string;
  atomCount: number;
  elements: number[];
  bondOrders: (1 | 2 | 1.5)[];
}

export const RING_TEMPLATES: RingTemplate[] = [
  {
    id: 'cyclopropane',
    name: 'Cyclopropane',
    atomCount: 3,
    elements: [6, 6, 6],
    bondOrders: [1, 1, 1],
  },
  {
    id: 'cyclopentane',
    name: 'Cyclopentane',
    atomCount: 5,
    elements: [6, 6, 6, 6, 6],
    bondOrders: [1, 1, 1, 1, 1],
  },
  {
    id: 'cyclohexane',
    name: 'Cyclohexane',
    shortcut: '6',
    atomCount: 6,
    elements: [6, 6, 6, 6, 6, 6],
    bondOrders: [1, 1, 1, 1, 1, 1],
  },
  {
    id: 'benzene',
    name: 'Benzene',
    shortcut: 'B',
    atomCount: 6,
    elements: [6, 6, 6, 6, 6, 6],
    bondOrders: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5],
  },
  {
    id: 'furan',
    name: 'Furan',
    atomCount: 5,
    elements: [8, 6, 6, 6, 6],
    bondOrders: [1, 2, 1, 1, 2],
  },
  {
    id: 'pyridine',
    name: 'Pyridine',
    atomCount: 6,
    elements: [7, 6, 6, 6, 6, 6],
    bondOrders: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5],
  },
  {
    id: 'pyrrole',
    name: 'Pyrrole',
    atomCount: 5,
    elements: [7, 6, 6, 6, 6],
    bondOrders: [1, 2, 1, 1, 2],
  },
  {
    id: 'thiophene',
    name: 'Thiophene',
    atomCount: 5,
    elements: [16, 6, 6, 6, 6],
    bondOrders: [1, 2, 1, 1, 2],
  },
];

export interface GeneratedRing {
  atoms: ReturnType<typeof createAtom>[];
  bonds: ReturnType<typeof createBond>[];
}

export function generateRing(
  template: RingTemplate,
  centerX: number,
  centerY: number,
  radius: number = 60,
): GeneratedRing {
  const atoms = [];
  const bonds = [];
  const n = template.atomCount;

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    atoms.push(createAtom(x, y, template.elements[i] ?? 6));
  }

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const order = template.bondOrders[i] ?? 1;
    const style = order === 1.5 ? 'aromatic' : order === 2 ? 'double' : ('single' as const);
    const fromAtom = atoms[i];
    const toAtom = atoms[next];
    if (!fromAtom || !toAtom) continue;
    bonds.push(createBond(fromAtom.id as AtomId, toAtom.id as AtomId, order as 1 | 2 | 1.5, style));
  }

  return { atoms, bonds };
}
