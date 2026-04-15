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
    shortcut: '3',
    atomCount: 3,
    elements: [6, 6, 6],
    bondOrders: [1, 1, 1],
  },
  {
    id: 'cyclobutane',
    name: 'Cyclobutane',
    shortcut: '4',
    atomCount: 4,
    elements: [6, 6, 6, 6],
    bondOrders: [1, 1, 1, 1],
  },
  {
    id: 'cyclopentane',
    name: 'Cyclopentane',
    shortcut: '5',
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
  {
    id: 'cycloheptane',
    name: 'Cycloheptane',
    shortcut: '7',
    atomCount: 7,
    elements: [6, 6, 6, 6, 6, 6, 6],
    bondOrders: [1, 1, 1, 1, 1, 1, 1],
  },
  {
    id: 'cyclooctane',
    name: 'Cyclooctane',
    shortcut: '8',
    atomCount: 8,
    elements: [6, 6, 6, 6, 6, 6, 6, 6],
    bondOrders: [1, 1, 1, 1, 1, 1, 1, 1],
  },
];

// ── Fused ring templates with pre-computed coordinates ────

export interface FusedRingTemplate {
  id: string;
  name: string;
  category: 'aromatic' | 'heterocyclic' | 'biological';
  atoms: Array<{ dx: number; dy: number; element: number }>;
  bonds: Array<{ from: number; to: number; order: 1 | 2 | 1.5; style: 'single' | 'double' | 'aromatic' }>;
}

// Hex geometry constants (bond length = 50, matching default ring radius)
const B = 50;
const H = B * Math.cos(Math.PI / 6); // √3/2 * B ≈ 43.30
const HH = B * 0.5; // 25

// Pentagon geometry for 5-ring fusion (circumradius & apothem)
const R5 = B / (2 * Math.sin(Math.PI / 5)); // ≈ 42.53
const A5 = B / (2 * Math.tan(Math.PI / 5)); // ≈ 34.41

// Pentagon vertices when fused to right side of hex (sharing atoms at (0,-HH) and (0,HH))
// Pentagon center at (A5, 0), vertices at angles 216°,288°,0°,72°,144° from center
const P5_TOP_X = A5 + R5 * Math.cos((-72 * Math.PI) / 180);    // ≈ 47.55
const P5_TOP_Y = R5 * Math.sin((-72 * Math.PI) / 180);          // ≈ -40.45
const P5_MID_X = A5 + R5;                                        // ≈ 76.94
const P5_BOT_X = P5_TOP_X;                                       // ≈ 47.55
const P5_BOT_Y = -P5_TOP_Y;                                      // ≈ 40.45

// Helper: all aromatic bonds
const aro = (from: number, to: number) =>
  ({ from, to, order: 1.5 as const, style: 'aromatic' as const });
const sng = (from: number, to: number) =>
  ({ from, to, order: 1 as const, style: 'single' as const });
const dbl = (from: number, to: number) =>
  ({ from, to, order: 2 as const, style: 'double' as const });

export const FUSED_RING_TEMPLATES: FusedRingTemplate[] = [
  // ══════════════════ AROMATIC FUSED ══════════════════
  {
    id: 'naphthalene',
    name: 'Naphthalene',
    category: 'aromatic',
    // Two fused hexagons, symmetric about origin
    // Ring A centered at (-H, 0), Ring B at (H, 0)
    atoms: [
      { dx: -H, dy: -B, element: 6 },     // 0: A-top
      { dx: 0, dy: -HH, element: 6 },     // 1: shared top
      { dx: 0, dy: HH, element: 6 },      // 2: shared bottom
      { dx: -H, dy: B, element: 6 },      // 3: A-bottom
      { dx: -2 * H, dy: HH, element: 6 }, // 4: A-bottom-left
      { dx: -2 * H, dy: -HH, element: 6 },// 5: A-top-left
      { dx: H, dy: -B, element: 6 },      // 6: B-top
      { dx: 2 * H, dy: -HH, element: 6 }, // 7: B-top-right
      { dx: 2 * H, dy: HH, element: 6 },  // 8: B-bottom-right
      { dx: H, dy: B, element: 6 },       // 9: B-bottom
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      aro(1, 6), aro(6, 7), aro(7, 8), aro(8, 9), aro(9, 2),
    ],
  },
  {
    id: 'anthracene',
    name: 'Anthracene',
    category: 'aromatic',
    // Three linear fused hexagons: A at (-2H,0), B at (0,0), C at (2H,0)
    atoms: [
      { dx: -2 * H, dy: -B, element: 6 },  // 0: A-top
      { dx: -H, dy: -HH, element: 6 },     // 1: A/B shared top
      { dx: -H, dy: HH, element: 6 },      // 2: A/B shared bottom
      { dx: -2 * H, dy: B, element: 6 },    // 3: A-bottom
      { dx: -3 * H, dy: HH, element: 6 },   // 4: A-far-left-bot
      { dx: -3 * H, dy: -HH, element: 6 },  // 5: A-far-left-top
      { dx: 0, dy: -B, element: 6 },        // 6: B-top
      { dx: H, dy: -HH, element: 6 },       // 7: B/C shared top
      { dx: H, dy: HH, element: 6 },        // 8: B/C shared bottom
      { dx: 0, dy: B, element: 6 },         // 9: B-bottom
      { dx: 2 * H, dy: -B, element: 6 },    // 10: C-top
      { dx: 3 * H, dy: -HH, element: 6 },   // 11: C-far-right-top
      { dx: 3 * H, dy: HH, element: 6 },    // 12: C-far-right-bot
      { dx: 2 * H, dy: B, element: 6 },     // 13: C-bottom
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      aro(1, 6), aro(6, 7), aro(7, 8), aro(8, 9), aro(9, 2),
      aro(7, 10), aro(10, 11), aro(11, 12), aro(12, 13), aro(13, 8),
    ],
  },
  // ══════════════════ HETEROCYCLIC FUSED ══════════════════
  {
    id: 'indole',
    name: 'Indole',
    category: 'heterocyclic',
    // Benzene (left) + pyrrole (right), N in 5-ring
    // Benzene centered at (-H, 0); pyrrole shares atoms 1,2
    atoms: [
      { dx: -H, dy: -B, element: 6 },      // 0: benz-top
      { dx: 0, dy: -HH, element: 6 },      // 1: shared top (7a)
      { dx: 0, dy: HH, element: 6 },       // 2: shared bot (3a)
      { dx: -H, dy: B, element: 6 },       // 3: benz-bot
      { dx: -2 * H, dy: HH, element: 6 },  // 4: benz-bot-left
      { dx: -2 * H, dy: -HH, element: 6 }, // 5: benz-top-left
      { dx: P5_TOP_X, dy: P5_TOP_Y, element: 7 },  // 6: N (pos 1)
      { dx: P5_MID_X, dy: 0, element: 6 },          // 7: C-2
      { dx: P5_BOT_X, dy: P5_BOT_Y, element: 6 },  // 8: C-3
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      sng(1, 6), dbl(6, 7), sng(7, 8), dbl(8, 2),
    ],
  },
  {
    id: 'quinoline',
    name: 'Quinoline',
    category: 'heterocyclic',
    // Same as naphthalene but atom 6 is N (pyridine ring)
    atoms: [
      { dx: -H, dy: -B, element: 6 },
      { dx: 0, dy: -HH, element: 6 },
      { dx: 0, dy: HH, element: 6 },
      { dx: -H, dy: B, element: 6 },
      { dx: -2 * H, dy: HH, element: 6 },
      { dx: -2 * H, dy: -HH, element: 6 },
      { dx: H, dy: -B, element: 7 },       // N at position 1
      { dx: 2 * H, dy: -HH, element: 6 },
      { dx: 2 * H, dy: HH, element: 6 },
      { dx: H, dy: B, element: 6 },
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      aro(1, 6), aro(6, 7), aro(7, 8), aro(8, 9), aro(9, 2),
    ],
  },
  {
    id: 'isoquinoline',
    name: 'Isoquinoline',
    category: 'heterocyclic',
    // Same as naphthalene but atom 7 is N
    atoms: [
      { dx: -H, dy: -B, element: 6 },
      { dx: 0, dy: -HH, element: 6 },
      { dx: 0, dy: HH, element: 6 },
      { dx: -H, dy: B, element: 6 },
      { dx: -2 * H, dy: HH, element: 6 },
      { dx: -2 * H, dy: -HH, element: 6 },
      { dx: H, dy: -B, element: 6 },
      { dx: 2 * H, dy: -HH, element: 7 },  // N at position 2
      { dx: 2 * H, dy: HH, element: 6 },
      { dx: H, dy: B, element: 6 },
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      aro(1, 6), aro(6, 7), aro(7, 8), aro(8, 9), aro(9, 2),
    ],
  },
  {
    id: 'benzimidazole',
    name: 'Benzimidazole',
    category: 'heterocyclic',
    // Benzene + imidazole (two N in 5-ring)
    atoms: [
      { dx: -H, dy: -B, element: 6 },
      { dx: 0, dy: -HH, element: 6 },
      { dx: 0, dy: HH, element: 6 },
      { dx: -H, dy: B, element: 6 },
      { dx: -2 * H, dy: HH, element: 6 },
      { dx: -2 * H, dy: -HH, element: 6 },
      { dx: P5_TOP_X, dy: P5_TOP_Y, element: 7 },  // N-1
      { dx: P5_MID_X, dy: 0, element: 6 },          // C-2
      { dx: P5_BOT_X, dy: P5_BOT_Y, element: 7 },  // N-3
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      sng(1, 6), dbl(6, 7), sng(7, 8), dbl(8, 2),
    ],
  },
  {
    id: 'benzofuran',
    name: 'Benzofuran',
    category: 'heterocyclic',
    // Benzene + furan (O in 5-ring)
    atoms: [
      { dx: -H, dy: -B, element: 6 },
      { dx: 0, dy: -HH, element: 6 },
      { dx: 0, dy: HH, element: 6 },
      { dx: -H, dy: B, element: 6 },
      { dx: -2 * H, dy: HH, element: 6 },
      { dx: -2 * H, dy: -HH, element: 6 },
      { dx: P5_TOP_X, dy: P5_TOP_Y, element: 8 },  // O
      { dx: P5_MID_X, dy: 0, element: 6 },
      { dx: P5_BOT_X, dy: P5_BOT_Y, element: 6 },
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      sng(1, 6), dbl(6, 7), sng(7, 8), dbl(8, 2),
    ],
  },
  {
    id: 'benzothiophene',
    name: 'Benzothiophene',
    category: 'heterocyclic',
    // Benzene + thiophene (S in 5-ring)
    atoms: [
      { dx: -H, dy: -B, element: 6 },
      { dx: 0, dy: -HH, element: 6 },
      { dx: 0, dy: HH, element: 6 },
      { dx: -H, dy: B, element: 6 },
      { dx: -2 * H, dy: HH, element: 6 },
      { dx: -2 * H, dy: -HH, element: 6 },
      { dx: P5_TOP_X, dy: P5_TOP_Y, element: 16 }, // S
      { dx: P5_MID_X, dy: 0, element: 6 },
      { dx: P5_BOT_X, dy: P5_BOT_Y, element: 6 },
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      sng(1, 6), dbl(6, 7), sng(7, 8), dbl(8, 2),
    ],
  },
  // ══════════════════ BIOLOGICAL ══════════════════
  {
    id: 'purine',
    name: 'Purine',
    category: 'biological',
    // Pyrimidine (6-ring, 2N) + imidazole (5-ring, 2N)
    atoms: [
      { dx: -H, dy: -B, element: 7 },      // 0: N-1
      { dx: 0, dy: -HH, element: 6 },      // 1: C-2 (shared)
      { dx: 0, dy: HH, element: 6 },       // 2: C-5 (shared)
      { dx: -H, dy: B, element: 6 },       // 3: C-6
      { dx: -2 * H, dy: HH, element: 7 },  // 4: N-3 (was C → N)
      { dx: -2 * H, dy: -HH, element: 6 }, // 5: C-4 (wait numbering...)
      // Imidazole ring
      { dx: P5_TOP_X, dy: P5_TOP_Y, element: 7 },  // 6: N-7
      { dx: P5_MID_X, dy: 0, element: 6 },          // 7: C-8
      { dx: P5_BOT_X, dy: P5_BOT_Y, element: 7 },  // 8: N-9
    ],
    bonds: [
      aro(0, 1), aro(1, 2), aro(2, 3), aro(3, 4), aro(4, 5), aro(5, 0),
      sng(1, 6), dbl(6, 7), sng(7, 8), dbl(8, 2),
    ],
  },
  {
    id: 'steroid',
    name: 'Steroid Skeleton',
    category: 'biological',
    // ABCD ring system: three 6-rings (A-B-C) + one 5-ring (D)
    // A at (-2H,0), B at (0,0), C at (2H,0), D fused to right of C
    atoms: [
      // Ring A
      { dx: -2 * H, dy: -B, element: 6 },   // 0
      { dx: -H, dy: -HH, element: 6 },      // 1: A/B shared
      { dx: -H, dy: HH, element: 6 },       // 2: A/B shared
      { dx: -2 * H, dy: B, element: 6 },    // 3
      { dx: -3 * H, dy: HH, element: 6 },   // 4
      { dx: -3 * H, dy: -HH, element: 6 },  // 5
      // Ring B (shares 1,2)
      { dx: 0, dy: -B, element: 6 },        // 6
      { dx: H, dy: -HH, element: 6 },       // 7: B/C shared
      { dx: H, dy: HH, element: 6 },        // 8: B/C shared
      { dx: 0, dy: B, element: 6 },         // 9
      // Ring C (shares 7,8)
      { dx: 2 * H, dy: -B, element: 6 },    // 10
      { dx: 3 * H, dy: -HH, element: 6 },   // 11: C/D shared
      { dx: 3 * H, dy: HH, element: 6 },    // 12: C/D shared
      { dx: 2 * H, dy: B, element: 6 },     // 13
      // Ring D (5-ring, shares 11,12)
      { dx: 3 * H + P5_TOP_X, dy: P5_TOP_Y, element: 6 },  // 14
      { dx: 3 * H + P5_MID_X, dy: 0, element: 6 },         // 15
      { dx: 3 * H + P5_BOT_X, dy: P5_BOT_Y, element: 6 },  // 16
    ],
    bonds: [
      // Ring A
      sng(0, 1), sng(1, 2), sng(2, 3), sng(3, 4), sng(4, 5), sng(5, 0),
      // Ring B
      sng(1, 6), sng(6, 7), sng(7, 8), sng(8, 9), sng(9, 2),
      // Ring C
      sng(7, 10), sng(10, 11), sng(11, 12), sng(12, 13), sng(13, 8),
      // Ring D
      sng(11, 14), sng(14, 15), sng(15, 16), sng(16, 12),
    ],
  },
];

export interface GeneratedRing {
  atoms: ReturnType<typeof createAtom>[];
  bonds: ReturnType<typeof createBond>[];
}

export function generateFusedRing(
  template: FusedRingTemplate,
  centerX: number,
  centerY: number,
): GeneratedRing {
  // Compute center of template for centering
  let cx = 0;
  let cy = 0;
  for (const a of template.atoms) {
    cx += a.dx;
    cy += a.dy;
  }
  cx /= template.atoms.length;
  cy /= template.atoms.length;

  const atoms = template.atoms.map((a) =>
    createAtom(centerX + a.dx - cx, centerY + a.dy - cy, a.element),
  );

  const bonds = template.bonds.map((b) => {
    const fromAtom = atoms[b.from];
    const toAtom = atoms[b.to];
    if (!fromAtom || !toAtom) {
      throw new Error(`Invalid bond index in template ${template.id}`);
    }
    return createBond(fromAtom.id as AtomId, toAtom.id as AtomId, b.order, b.style);
  });

  return { atoms, bonds };
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
