import { BOND_ORDER_BY_TYPE, DEFAULT_SETTINGS, RING_SIZES } from './constants';
import { angleBetween, createRegularPolygon, distance, polar } from './geometry';
import { cleanUpDocument } from './ocl';
import type { AtomNode, BondEdge, BondType, ChemicalDocument, Point, RingTemplate } from './types';

const DEFAULT_BOND_LENGTH_ANGSTROM = 1.535;
const DEGREE = Math.PI / 180;

type GeometryFamily = 'sp3' | 'sp2' | 'sp';

interface VirtualAtomOptions {
  id?: string;
  point?: Point;
  charge?: number;
}

interface ConstraintFailure {
  ok: false;
  statusText: string;
}

interface ConstraintSuccess {
  ok: true;
  statusText: string;
}

type ValidationResult = ConstraintSuccess | ConstraintFailure;

export interface BondPlacementResult extends ConstraintSuccess {
  ok: true;
  point: Point;
  angle: number;
  length: number;
}

export interface ChainBuildResult extends ConstraintSuccess {
  ok: true;
  points: Point[];
}

export interface ConstrainedRing {
  atoms: AtomNode[];
  bonds: BondEdge[];
  statusText: string;
}

export interface RefineDocumentResult {
  document: ChemicalDocument;
  statusText: string;
}

interface RefineCandidate {
  component: ChemicalDocument;
  score: number;
  displacement: number;
  variant: 'primary' | 'mirrored' | 'rotated';
}

const MAX_BOND_ORDER_SUM: Record<string, number> = {
  H: 1,
  B: 4,
  C: 4,
  N: 4,
  O: 3,
  F: 1,
  Na: 1,
  Mg: 2,
  Si: 4,
  P: 5,
  S: 6,
  Cl: 1,
  Fe: 6,
  Cu: 4,
  Zn: 4,
  Br: 1,
  Pd: 4,
  I: 1,
  Pt: 4,
};

const VAN_DER_WAALS_RADII: Record<string, number> = {
  H: 1.2,
  C: 1.7,
  N: 1.55,
  O: 1.52,
  F: 1.47,
  P: 1.8,
  S: 1.8,
  Cl: 1.75,
  Br: 1.85,
  I: 1.98,
};

const MIN_NON_BONDED_DISTANCES: Record<string, number> = {
  'H-H': 2.0,
  'C-H': 2.4,
  'C-C': 3.0,
  'C-N': 2.9,
  'C-O': 2.8,
  'N-N': 2.7,
  'O-O': 2.6,
};

const SMALL_RING_BOND_LENGTHS: Record<RingTemplate, number> = {
  cyclopropane: 1.51,
  cyclobutane: 1.548,
  cyclopentane: 1.535,
  cyclohexane: 1.535,
  benzene: 1.397,
};

const BOND_LABELS: Record<BondType, string> = {
  single: 'single',
  double: 'double',
  triple: 'triple',
  quadruple: 'quadruple',
  dative: 'dative',
  wedge: 'single',
  dash: 'single',
  wavy: 'single',
  bold: 'single',
  aromatic: 'aromatic',
};

function createVirtualAtom(element: string, options: VirtualAtomOptions = {}): AtomNode {
  return {
    id: options.id ?? `virtual_${element}`,
    element,
    x: options.point?.x ?? 0,
    y: options.point?.y ?? 0,
    charge: options.charge ?? 0,
    isotope: null,
    radical: 'none',
    alias: null,
    hydrogens: null,
    stereo: 'none',
    mapNumber: null,
    color: null,
  };
}

function findAtom(document: ChemicalDocument, atomId: string): AtomNode | null {
  return document.page.atoms.find((atom) => atom.id === atomId) ?? null;
}

function findBond(document: ChemicalDocument, bondId: string): BondEdge | null {
  return document.page.bonds.find((bond) => bond.id === bondId) ?? null;
}

function getConnectedBonds(
  document: ChemicalDocument,
  atomId: string,
  excludingBondId?: string,
): BondEdge[] {
  return document.page.bonds.filter((bond) => {
    if (excludingBondId && bond.id === excludingBondId) {
      return false;
    }
    return bond.atomIds[0] === atomId || bond.atomIds[1] === atomId;
  });
}

function getOtherAtom(document: ChemicalDocument, bond: BondEdge, atomId: string): AtomNode | null {
  const otherId = bond.atomIds[0] === atomId ? bond.atomIds[1] : bond.atomIds[0];
  return findAtom(document, otherId);
}

function canonicalPair(a: string, b: string) {
  return [a, b].sort().join('-');
}

function normalizeAngle(angle: number) {
  let next = angle;
  while (next <= -Math.PI) {
    next += Math.PI * 2;
  }
  while (next > Math.PI) {
    next -= Math.PI * 2;
  }
  return next;
}

function angleDistance(a: number, b: number) {
  return Math.abs(normalizeAngle(a - b));
}

function bondTypeAllowsElement(element: string, type: BondType) {
  if (type === 'quadruple') {
    return element === 'Pd' || element === 'Pt' || element === 'Fe';
  }

  if (element === 'H' || element === 'Na') {
    return (
      type === 'single' || type === 'wedge' || type === 'dash' || type === 'bold' || type === 'wavy'
    );
  }

  if (element === 'F' || element === 'Cl' || element === 'Br' || element === 'I') {
    return (
      type === 'single' || type === 'wedge' || type === 'dash' || type === 'bold' || type === 'wavy'
    );
  }

  if (element === 'O') {
    return type !== 'triple';
  }

  if (
    element === 'Mg' ||
    element === 'Fe' ||
    element === 'Cu' ||
    element === 'Zn' ||
    element === 'Pd' ||
    element === 'Pt'
  ) {
    return type === 'single' || type === 'dative';
  }

  return true;
}

function getMaximumBondOrderSum(atom: AtomNode) {
  const base = MAX_BOND_ORDER_SUM[atom.element] ?? 4;
  if (atom.charge > 0 && (atom.element === 'N' || atom.element === 'O' || atom.element === 'S')) {
    return base + 1;
  }
  return base;
}

function getBondOrderSum(document: ChemicalDocument, atom: AtomNode, excludingBondId?: string) {
  return getConnectedBonds(document, atom.id, excludingBondId).reduce((sum, bond) => {
    return sum + (BOND_ORDER_BY_TYPE[bond.type] ?? bond.order ?? 1);
  }, 0);
}

function inferGeometryFamily(
  document: ChemicalDocument,
  atom: AtomNode,
  incomingType: BondType,
  excludingBondId?: string,
): GeometryFamily {
  const bonds = getConnectedBonds(document, atom.id, excludingBondId);
  const allTypes = [incomingType, ...bonds.map((bond) => bond.type)];

  if (allTypes.some((type) => (BOND_ORDER_BY_TYPE[type] ?? 1) >= 3)) {
    return 'sp';
  }

  if (allTypes.some((type) => type === 'double' || type === 'aromatic')) {
    return 'sp2';
  }

  return 'sp3';
}

function getPreferredHeavyAtomAngleDegrees(
  document: ChemicalDocument,
  atom: AtomNode,
  incomingType: BondType,
  excludingBondId?: string,
) {
  const family = inferGeometryFamily(document, atom, incomingType, excludingBondId);
  if (family === 'sp') {
    return 180;
  }
  if (family === 'sp2') {
    return 120;
  }

  switch (atom.element) {
    case 'N':
      return 110.9;
    case 'O':
      return 111.7;
    case 'S':
      return 99;
    case 'P':
      return 93.3;
    default:
      return 112;
  }
}

function countNeighborElements(
  document: ChemicalDocument,
  atomId: string,
  element: string,
  excludingBondId?: string,
) {
  return getConnectedBonds(document, atomId, excludingBondId).reduce((count, bond) => {
    const other = getOtherAtom(document, bond, atomId);
    return count + (other?.element === element ? 1 : 0);
  }, 0);
}

function hasNeighborBondType(
  document: ChemicalDocument,
  atomId: string,
  type: BondType,
  excludingBondId?: string,
) {
  return getConnectedBonds(document, atomId, excludingBondId).some((bond) => bond.type === type);
}

function hasDoubleBondToElement(
  document: ChemicalDocument,
  atomId: string,
  element: string,
  excludingBondId?: string,
) {
  return getConnectedBonds(document, atomId, excludingBondId).some((bond) => {
    if (bond.type !== 'double') {
      return false;
    }
    const other = getOtherAtom(document, bond, atomId);
    return other?.element === element;
  });
}

function hasSingleBondToElement(
  document: ChemicalDocument,
  atomId: string,
  element: string,
  excludingBondId?: string,
) {
  return getConnectedBonds(document, atomId, excludingBondId).some((bond) => {
    if (
      bond.type !== 'single' &&
      bond.type !== 'wedge' &&
      bond.type !== 'dash' &&
      bond.type !== 'bold' &&
      bond.type !== 'wavy'
    ) {
      return false;
    }
    const other = getOtherAtom(document, bond, atomId);
    return other?.element === element;
  });
}

function isAromaticCenter(document: ChemicalDocument, atom: AtomNode, excludingBondId?: string) {
  return hasNeighborBondType(document, atom.id, 'aromatic', excludingBondId);
}

function getIdealBondLengthAngstrom(
  document: ChemicalDocument,
  left: AtomNode,
  right: AtomNode,
  type: BondType,
  excludingBondId?: string,
) {
  const pair = canonicalPair(left.element, right.element);
  const leftFamily = inferGeometryFamily(document, left, type, excludingBondId);
  const rightFamily = inferGeometryFamily(document, right, type, excludingBondId);
  const leftAromatic = type === 'aromatic' || isAromaticCenter(document, left, excludingBondId);
  const rightAromatic = type === 'aromatic' || isAromaticCenter(document, right, excludingBondId);

  if (pair === 'C-C') {
    if (type === 'aromatic') {
      return 1.397;
    }
    if (type === 'triple') {
      const leftDegree = getConnectedBonds(document, left.id, excludingBondId).length;
      const rightDegree = getConnectedBonds(document, right.id, excludingBondId).length;
      return leftDegree > 0 && rightDegree > 0 ? 1.21 : 1.203;
    }
    if (type === 'double') {
      return leftFamily === 'sp2' && rightFamily === 'sp2' ? 1.349 : 1.337;
    }
    if (leftFamily === 'sp2' && rightFamily === 'sp2') {
      return 1.467;
    }
    if (
      (leftFamily === 'sp2' && rightFamily === 'sp3') ||
      (leftFamily === 'sp3' && rightFamily === 'sp2')
    ) {
      return 1.51;
    }
    return 1.535;
  }

  if (pair === 'C-H') {
    if (leftFamily === 'sp' || rightFamily === 'sp') {
      return 1.063;
    }
    if (leftAromatic || rightAromatic) {
      return 1.084;
    }
    if (leftFamily === 'sp2' || rightFamily === 'sp2') {
      return 1.087;
    }
    return 1.094;
  }

  if (pair === 'C-O') {
    const carbon = left.element === 'C' ? left : right;
    const oxygen = left.element === 'O' ? left : right;
    if (type === 'double') {
      const hasNitrogen = countNeighborElements(document, carbon.id, 'N', excludingBondId) > 0;
      const hasOtherOxygen = countNeighborElements(document, carbon.id, 'O', excludingBondId) > 0;
      if (hasNitrogen) {
        return 1.235;
      }
      if (hasOtherOxygen) {
        return 1.206;
      }
      return 1.21;
    }
    if (leftAromatic || rightAromatic) {
      return 1.362;
    }
    if (
      countNeighborElements(document, carbon.id, 'O', excludingBondId) > 0 ||
      hasDoubleBondToElement(document, carbon.id, 'O', excludingBondId)
    ) {
      if (oxygen.charge < 0 && !hasDoubleBondToElement(document, carbon.id, 'O', excludingBondId)) {
        return 1.25;
      }
      const oxygenDegree = getConnectedBonds(document, oxygen.id, excludingBondId).length;
      return oxygenDegree > 0 ? 1.344 : 1.355;
    }
    return 1.43;
  }

  if (pair === 'C-N') {
    const carbon = left.element === 'C' ? left : right;
    if (type === 'triple') {
      return 1.158;
    }
    if (type === 'double') {
      return 1.279;
    }
    if (type === 'aromatic') {
      return 1.338;
    }
    if (hasDoubleBondToElement(document, carbon.id, 'O', excludingBondId)) {
      return 1.335;
    }
    if (countNeighborElements(document, carbon.id, 'N', excludingBondId) >= 2) {
      return 1.33;
    }
    return 1.474;
  }

  if (pair === 'N-O') {
    if (type === 'double') {
      return 1.226;
    }
    return 1.226;
  }

  if (pair === 'O-H') {
    return 0.96;
  }

  if (pair === 'N-H') {
    return 1.01;
  }

  if (pair === 'S-H') {
    return 1.34;
  }

  if (pair === 'C-S') {
    if (type === 'double') {
      return 1.68;
    }
    if (type === 'aromatic') {
      return 1.714;
    }
    return 1.82;
  }

  if (pair === 'S-S') {
    return 2.05;
  }

  if (pair === 'O-P') {
    if (type === 'double') {
      return 1.485;
    }
    return countNeighborElements(
      document,
      left.element === 'P' ? left.id : right.id,
      'O',
      excludingBondId,
    ) > 1
      ? 1.52
      : 1.593;
  }

  if (pair === 'O-S') {
    if (type === 'double') {
      const sulfur = left.element === 'S' ? left : right;
      return countNeighborElements(document, sulfur.id, 'O', excludingBondId) > 1 ? 1.431 : 1.485;
    }
    return 1.58;
  }

  if (pair === 'C-F') {
    return 1.39;
  }
  if (pair === 'C-Cl') {
    return 1.781;
  }
  if (pair === 'C-Br') {
    return 1.945;
  }
  if (pair === 'C-I') {
    return 2.162;
  }

  const metalLigand = new Map<string, number>([
    ['Fe-N', 2.035],
    ['Fe-O', 1.95],
    ['Zn-N', 2.075],
    ['Zn-S', 2.325],
    ['Zn-O', 2.025],
    ['Mg-O', 2.1],
    ['Ca-O', 2.4],
    ['Cu-N', 2.0],
    ['Cu-S', 2.175],
    ['Pt-N', 2.025],
    ['Pt-Cl', 2.315],
  ]);

  const forward = `${left.element}-${right.element}`;
  const backward = `${right.element}-${left.element}`;
  if (metalLigand.has(forward)) {
    return metalLigand.get(forward)!;
  }
  if (metalLigand.has(backward)) {
    return metalLigand.get(backward)!;
  }

  return DEFAULT_BOND_LENGTH_ANGSTROM;
}

function getCanvasUnitsPerAngstrom(bondLength = DEFAULT_SETTINGS.bondLength) {
  return bondLength / DEFAULT_BOND_LENGTH_ANGSTROM;
}

function toCanvasUnits(angstrom: number, bondLength = DEFAULT_SETTINGS.bondLength) {
  return angstrom * getCanvasUnitsPerAngstrom(bondLength);
}

function formatAngstrom(value: number) {
  return value.toFixed(3);
}

function buildValenceMessage(atom: AtomNode, type: BondType) {
  return `${atom.element} cannot accept a ${BOND_LABELS[type]} bond here without exceeding its allowed valence.`;
}

function buildBondTypeMessage(atom: AtomNode, type: BondType) {
  return `${atom.element} cannot participate in a ${BOND_LABELS[type]} bond in this editor model.`;
}

function validateBondBetweenAtoms(
  document: ChemicalDocument,
  left: AtomNode,
  right: AtomNode,
  type: BondType,
  excludingBondId?: string,
): ValidationResult {
  if (left.id === right.id) {
    return {
      ok: false,
      statusText: 'A bond cannot start and end on the same atom.',
    };
  }

  if (!bondTypeAllowsElement(left.element, type)) {
    return {
      ok: false,
      statusText: buildBondTypeMessage(left, type),
    };
  }

  if (!bondTypeAllowsElement(right.element, type)) {
    return {
      ok: false,
      statusText: buildBondTypeMessage(right, type),
    };
  }

  const order = BOND_ORDER_BY_TYPE[type] ?? 1;
  const leftTotal = left.id.startsWith('virtual_')
    ? 0
    : getBondOrderSum(document, left, excludingBondId);
  const rightTotal = right.id.startsWith('virtual_')
    ? 0
    : getBondOrderSum(document, right, excludingBondId);

  if (leftTotal + order > getMaximumBondOrderSum(left) + 1e-6) {
    return {
      ok: false,
      statusText: buildValenceMessage(left, type),
    };
  }

  if (rightTotal + order > getMaximumBondOrderSum(right) + 1e-6) {
    return {
      ok: false,
      statusText: buildValenceMessage(right, type),
    };
  }

  return {
    ok: true,
    statusText: `${left.element}-${right.element} ${BOND_LABELS[type]} bond is chemically allowed.`,
  };
}

function getCandidateAngles(
  document: ChemicalDocument,
  anchor: AtomNode,
  pointerAngle: number,
  bondType: BondType,
): number[] {
  const bonds = getConnectedBonds(document, anchor.id);
  if (bonds.length === 0) {
    return Array.from({ length: 12 }, (_, index) => normalizeAngle(index * 30 * DEGREE));
  }

  const neighborAngles = bonds
    .map((bond) => getOtherAtom(document, bond, anchor.id))
    .filter((atom): atom is AtomNode => atom !== null)
    .map((atom) => angleBetween(anchor, atom));

  const idealAngle = getPreferredHeavyAtomAngleDegrees(document, anchor, bondType) * DEGREE;

  if (neighborAngles.length === 1) {
    const base = neighborAngles[0];
    const candidates = [base + idealAngle, base - idealAngle];
    if (idealAngle < Math.PI - 0.1) {
      candidates.push(base + Math.PI);
    }
    return candidates.map(normalizeAngle);
  }

  const vectors = neighborAngles.map((angle) => ({ x: Math.cos(angle), y: Math.sin(angle) }));
  const vectorSum = vectors.reduce(
    (sum, vector) => ({
      x: sum.x + vector.x,
      y: sum.y + vector.y,
    }),
    { x: 0, y: 0 },
  );

  if (Math.hypot(vectorSum.x, vectorSum.y) > 1e-6) {
    return [normalizeAngle(Math.atan2(-vectorSum.y, -vectorSum.x))];
  }

  return [pointerAngle];
}

function getGraphDistanceUpTo(
  document: ChemicalDocument,
  startId: string,
  targetId: string,
  maxDepth: number,
) {
  if (startId === targetId) {
    return 0;
  }

  const visited = new Set<string>([startId]);
  const queue: Array<{ atomId: string; depth: number }> = [{ atomId: startId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    if (current.depth >= maxDepth) {
      continue;
    }

    for (const bond of getConnectedBonds(document, current.atomId)) {
      const nextId = bond.atomIds[0] === current.atomId ? bond.atomIds[1] : bond.atomIds[0];
      if (visited.has(nextId)) {
        continue;
      }
      if (nextId === targetId) {
        return current.depth + 1;
      }
      visited.add(nextId);
      queue.push({ atomId: nextId, depth: current.depth + 1 });
    }
  }

  return null;
}

function getMinimumNonBondedDistanceAngstrom(leftElement: string, rightElement: string) {
  const pair = canonicalPair(leftElement, rightElement);
  const explicit = MIN_NON_BONDED_DISTANCES[pair];
  if (explicit) {
    return explicit;
  }

  const leftRadius = VAN_DER_WAALS_RADII[leftElement] ?? 1.7;
  const rightRadius = VAN_DER_WAALS_RADII[rightElement] ?? 1.7;
  return (leftRadius + rightRadius) * 0.85;
}

function getStericPenalty(
  document: ChemicalDocument,
  anchor: AtomNode,
  point: Point,
  element: string,
  bondLength: number,
) {
  let penalty = 0;

  for (const atom of document.page.atoms) {
    if (atom.id === anchor.id) {
      continue;
    }

    const graphDistance = getGraphDistanceUpTo(document, anchor.id, atom.id, 2);
    if (graphDistance === 1) {
      continue;
    }

    const rawMinimum = getMinimumNonBondedDistanceAngstrom(element, atom.element);
    const scaledMinimum = graphDistance === 2 ? rawMinimum * 0.7 : rawMinimum;
    const actual = distance(point, atom) / getCanvasUnitsPerAngstrom(bondLength);
    if (actual < scaledMinimum) {
      const overlap = scaledMinimum - actual;
      penalty += 1 + overlap * overlap * 6;
    }
  }

  return penalty;
}

function buildPlacementStatus(
  document: ChemicalDocument,
  anchor: AtomNode,
  targetElement: string,
  type: BondType,
  length: number,
  stericPenalty: number,
  bondLength: number,
) {
  const target = createVirtualAtom(targetElement);
  const family = inferGeometryFamily(document, anchor, type);
  const stericNote = stericPenalty > 0 ? ' with steric adjustment' : '';
  return `Constraint-aware ${anchor.element}-${target.element} ${BOND_LABELS[type]} placement (${formatAngstrom(length / getCanvasUnitsPerAngstrom(bondLength))} A, ${family}${stericNote}).`;
}

export function validateAtomElementChange(
  document: ChemicalDocument,
  atomId: string,
  nextElement: string,
): ValidationResult {
  const atom = findAtom(document, atomId);
  if (!atom) {
    return {
      ok: false,
      statusText: 'Selected atom could not be found.',
    };
  }

  const virtual = createVirtualAtom(nextElement, { id: atom.id, point: atom });
  const connectedBonds = getConnectedBonds(document, atom.id);
  for (const bond of connectedBonds) {
    const other = getOtherAtom(document, bond, atom.id);
    if (!other) {
      continue;
    }
    const bondCheck = validateBondBetweenAtoms(document, virtual, other, bond.type, bond.id);
    if (!bondCheck.ok) {
      return {
        ok: false,
        statusText: `Changing this atom to ${nextElement} would violate the existing bonding pattern.`,
      };
    }
  }

  return {
    ok: true,
    statusText: `Element changed to ${nextElement} while keeping valence-compatible bonding.`,
  };
}

export function validateBondInsertion(
  document: ChemicalDocument,
  bondId: string,
  element: string,
): ValidationResult {
  const bond = findBond(document, bondId);
  if (!bond) {
    return {
      ok: false,
      statusText: 'Selected bond could not be found.',
    };
  }

  const inserted = createVirtualAtom(element);
  const order = (BOND_ORDER_BY_TYPE[bond.type] ?? bond.order ?? 1) * 2;
  if (!bondTypeAllowsElement(element, bond.type)) {
    return {
      ok: false,
      statusText: `${element} cannot be inserted into a ${BOND_LABELS[bond.type]} bond while preserving both sides.`,
    };
  }

  if (order > getMaximumBondOrderSum(inserted) + 1e-6) {
    return {
      ok: false,
      statusText: `${element} cannot support two ${BOND_LABELS[bond.type]} connections in this context.`,
    };
  }

  return {
    ok: true,
    statusText: `${element} insertion keeps the split bond valence-compatible.`,
  };
}

export function validateBondTypeChange(
  document: ChemicalDocument,
  bondId: string,
  nextType: BondType,
): ValidationResult {
  const bond = findBond(document, bondId);
  if (!bond) {
    return {
      ok: false,
      statusText: 'Selected bond could not be found.',
    };
  }

  const left = findAtom(document, bond.atomIds[0]);
  const right = findAtom(document, bond.atomIds[1]);
  if (!left || !right) {
    return {
      ok: false,
      statusText: 'Bond endpoints could not be found.',
    };
  }

  return validateBondBetweenAtoms(document, left, right, nextType, bond.id);
}

export function validateBondCreation(
  document: ChemicalDocument,
  left: AtomNode,
  right: AtomNode,
  type: BondType,
  excludingBondId?: string,
): ValidationResult {
  return validateBondBetweenAtoms(document, left, right, type, excludingBondId);
}

export function resolveConstrainedBondPlacement(
  document: ChemicalDocument,
  anchor: AtomNode,
  pointer: Point,
  options: {
    targetElement: string;
    bondType: BondType;
    fixedLength: boolean;
    bondLength?: number;
  },
): BondPlacementResult | ConstraintFailure {
  const target = createVirtualAtom(options.targetElement);
  const validation = validateBondBetweenAtoms(document, anchor, target, options.bondType);
  if (!validation.ok) {
    return {
      ok: false,
      statusText: validation.statusText,
    };
  }

  const pointerAngle = angleBetween(anchor, pointer);
  const idealLength = toCanvasUnits(
    getIdealBondLengthAngstrom(document, anchor, target, options.bondType),
    options.bondLength,
  );
  const length = options.fixedLength
    ? idealLength
    : Math.max(idealLength * 0.82, distance(anchor, pointer));
  const baseAngles = getCandidateAngles(document, anchor, pointerAngle, options.bondType);
  const offsets = [0, 3, -3, 6, -6, 10, -10, 14, -14].map((value) => value * DEGREE);

  let best: {
    angle: number;
    point: Point;
    score: number;
    stericPenalty: number;
  } | null = null;

  for (const baseAngle of baseAngles) {
    for (const offset of offsets) {
      const angle = normalizeAngle(baseAngle + offset);
      const point = polar(anchor, length, angle);
      const stericPenalty = getStericPenalty(
        document,
        anchor,
        point,
        options.targetElement,
        options.bondLength ?? DEFAULT_SETTINGS.bondLength,
      );
      const score =
        stericPenalty * 100 + angleDistance(angle, pointerAngle) * 18 + Math.abs(offset) * 4;

      if (!best || score < best.score) {
        best = {
          angle,
          point,
          score,
          stericPenalty,
        };
      }
    }
  }

  if (!best) {
    return {
      ok: false,
      statusText: 'No valid constrained placement could be found for this bond.',
    };
  }

  return {
    ok: true,
    point: best.point,
    angle: best.angle,
    length,
    statusText: buildPlacementStatus(
      document,
      anchor,
      options.targetElement,
      options.bondType,
      length,
      best.stericPenalty,
      options.bondLength ?? DEFAULT_SETTINGS.bondLength,
    ),
  };
}

function createTemporaryAtom(id: string, element: string, point: Point): AtomNode {
  return createVirtualAtom(element, { id, point });
}

function createTemporaryBond(id: string, leftId: string, rightId: string): BondEdge {
  return {
    id,
    atomIds: [leftId, rightId],
    type: 'single',
    order: 1,
    display: 'normal',
    color: null,
  };
}

export function buildConstrainedChain(
  document: ChemicalDocument,
  start: Point,
  pointer: Point,
  segments: number,
  options: {
    anchorAtomId?: string | null;
    fixedLength: boolean;
    bondLength?: number;
  },
): ChainBuildResult | ConstraintFailure {
  const tempDocument = structuredClone(document);
  const points: Point[] = [start];
  const existingAnchor = options.anchorAtomId ? findAtom(tempDocument, options.anchorAtomId) : null;
  let previousAtom = existingAnchor ?? createTemporaryAtom('chain_start', 'C', start);
  let previousAngle = 0;
  let bendSign = 1;

  if (!existingAnchor) {
    tempDocument.page.atoms.push(previousAtom);
  }

  for (let index = 0; index < segments; index += 1) {
    const hintedPointer =
      index === 0
        ? pointer
        : polar(
            previousAtom,
            options.bondLength ?? DEFAULT_SETTINGS.bondLength,
            previousAngle + (index % 2 === 0 ? bendSign : -bendSign) * (Math.PI - 112 * DEGREE),
          );
    const placement = resolveConstrainedBondPlacement(tempDocument, previousAtom, hintedPointer, {
      targetElement: 'C',
      bondType: 'single',
      fixedLength: options.fixedLength,
      bondLength: options.bondLength,
    });

    if (!placement.ok) {
      return {
        ok: false,
        statusText: placement.statusText,
      };
    }

    if (index === 0) {
      const overallAngle = angleBetween(start, pointer);
      const rawSign = Math.sign(Math.sin(overallAngle - placement.angle));
      bendSign = rawSign === 0 ? 1 : rawSign;
    }

    const nextAtom = createTemporaryAtom(`chain_${index + 1}`, 'C', placement.point);
    tempDocument.page.atoms.push(nextAtom);
    tempDocument.page.bonds.push(
      createTemporaryBond(`chain_bond_${index + 1}`, previousAtom.id, nextAtom.id),
    );
    points.push(placement.point);
    previousAtom = nextAtom;
    previousAngle = placement.angle;
  }

  return {
    ok: true,
    points,
    statusText: `Constraint-aware alkyl chain placed with ${segments} bond${segments === 1 ? '' : 's'} and sp3 zig-zag geometry.`,
  };
}

export function createConstrainedRingAt(
  point: Point,
  template: RingTemplate,
  bondLength = DEFAULT_SETTINGS.bondLength,
): ConstrainedRing {
  const ringLength = toCanvasUnits(
    SMALL_RING_BOND_LENGTHS[template] ?? DEFAULT_BOND_LENGTH_ANGSTROM,
    bondLength,
  );
  const { size, aromatic } = RING_SIZES[template];
  const ringPoints = createRegularPolygon(point, size, ringLength);

  const atoms: AtomNode[] = ringPoints.map((ringPoint, index) => ({
    id: `ring_atom_${template}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    element: 'C',
    x: ringPoint.x,
    y: ringPoint.y,
    charge: 0,
    isotope: null,
    radical: 'none',
    alias: null,
    hydrogens: null,
    stereo: 'none',
    mapNumber: null,
    color: null,
  }));

  const bonds: BondEdge[] = atoms.map((atom, index) => {
    const next = atoms[(index + 1) % atoms.length];
    return {
      id: `ring_bond_${template}_${index}_${Math.random().toString(36).slice(2, 8)}`,
      atomIds: [atom.id, next.id],
      type: aromatic ? 'aromatic' : 'single',
      order: aromatic ? 1.5 : 1,
      display: aromatic ? 'aromatic' : 'normal',
      color: null,
    };
  });

  return {
    atoms,
    bonds,
    statusText: `${RING_SIZES[template].label} placed with a target bond length of ${formatAngstrom(SMALL_RING_BOND_LENGTHS[template])} A.`,
  };
}

function positiveAngleGap(start: number, end: number) {
  let gap = end - start;
  while (gap < 0) {
    gap += Math.PI * 2;
  }
  while (gap >= Math.PI * 2) {
    gap -= Math.PI * 2;
  }
  return gap;
}

function getCentroid(atoms: AtomNode[]) {
  if (atoms.length === 0) {
    return { x: 0, y: 0 };
  }

  const total = atoms.reduce(
    (sum, atom) => ({
      x: sum.x + atom.x,
      y: sum.y + atom.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / atoms.length,
    y: total.y / atoms.length,
  };
}

function translateAtoms(atoms: AtomNode[], delta: Point) {
  for (const atom of atoms) {
    atom.x += delta.x;
    atom.y += delta.y;
  }
}

function hasFiniteAtomCoordinates(atoms: AtomNode[]) {
  return atoms.every((atom) => Number.isFinite(atom.x) && Number.isFinite(atom.y));
}

function captureAtomCoordinates(atoms: AtomNode[]) {
  return new Map<string, Point>(
    atoms.map((atom) => [
      atom.id,
      {
        x: atom.x,
        y: atom.y,
      },
    ]),
  );
}

function restoreAtomCoordinates(atoms: AtomNode[], coordinates: Map<string, Point>) {
  for (const atom of atoms) {
    const point = coordinates.get(atom.id);
    if (!point) {
      continue;
    }

    atom.x = point.x;
    atom.y = point.y;
  }
}

function strongestBondType(document: ChemicalDocument, atomId: string): BondType {
  const bonds = getConnectedBonds(document, atomId);
  if (bonds.some((bond) => bond.type === 'triple')) {
    return 'triple';
  }
  if (bonds.some((bond) => bond.type === 'double')) {
    return 'double';
  }
  if (bonds.some((bond) => bond.type === 'aromatic')) {
    return 'aromatic';
  }
  return 'single';
}

function rotatePoint(point: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function alignSeedComponent(seedAtoms: AtomNode[], originalAtoms: AtomNode[]) {
  if (seedAtoms.length !== originalAtoms.length || seedAtoms.length === 0) {
    return;
  }

  const seedCentroid = getCentroid(seedAtoms);
  const originalCentroid = getCentroid(originalAtoms);

  const centeredSeed = seedAtoms.map((atom) => ({
    x: atom.x - seedCentroid.x,
    y: atom.y - seedCentroid.y,
  }));
  const centeredOriginal = originalAtoms.map((atom) => ({
    x: atom.x - originalCentroid.x,
    y: atom.y - originalCentroid.y,
  }));

  let cross = 0;
  let dot = 0;

  for (let index = 0; index < centeredSeed.length; index += 1) {
    const seed = centeredSeed[index];
    const original = centeredOriginal[index];
    dot += seed.x * original.x + seed.y * original.y;
    cross += seed.x * original.y - seed.y * original.x;
  }

  const angle = Math.atan2(cross, dot);

  for (let index = 0; index < seedAtoms.length; index += 1) {
    const rotated = rotatePoint(centeredSeed[index], angle);
    seedAtoms[index].x = rotated.x + originalCentroid.x;
    seedAtoms[index].y = rotated.y + originalCentroid.y;
  }
}

function buildComponentDocument(document: ChemicalDocument, atomIds: string[]) {
  const atomIdSet = new Set(atomIds);
  return {
    ...structuredClone(document),
    page: {
      ...structuredClone(document.page),
      atoms: structuredClone(document.page.atoms.filter((atom) => atomIdSet.has(atom.id))),
      bonds: structuredClone(
        document.page.bonds.filter(
          (bond) => atomIdSet.has(bond.atomIds[0]) && atomIdSet.has(bond.atomIds[1]),
        ),
      ),
      texts: [],
      arrows: [],
    },
  };
}

function hasPathExcludingAtom(
  document: ChemicalDocument,
  startId: string,
  targetId: string,
  blockedId: string,
) {
  if (startId === targetId) {
    return true;
  }

  const visited = new Set<string>([blockedId, startId]);
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const bond of getConnectedBonds(document, current)) {
      const nextId = bond.atomIds[0] === current ? bond.atomIds[1] : bond.atomIds[0];
      if (visited.has(nextId)) {
        continue;
      }
      if (nextId === targetId) {
        return true;
      }
      visited.add(nextId);
      queue.push(nextId);
    }
  }

  return false;
}

function isRingLikeCenter(document: ChemicalDocument, atomId: string) {
  const neighbors = getConnectedBonds(document, atomId)
    .map((bond) => getOtherAtom(document, bond, atomId))
    .filter((neighbor): neighbor is AtomNode => neighbor !== null);

  if (neighbors.length < 2) {
    return false;
  }

  for (let leftIndex = 0; leftIndex < neighbors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < neighbors.length; rightIndex += 1) {
      if (
        hasPathExcludingAtom(document, neighbors[leftIndex].id, neighbors[rightIndex].id, atomId)
      ) {
        return true;
      }
    }
  }

  return false;
}

function getConnectedComponents(document: ChemicalDocument) {
  const adjacency = new Map<string, string[]>();

  for (const atom of document.page.atoms) {
    adjacency.set(atom.id, []);
  }

  for (const bond of document.page.bonds) {
    adjacency.get(bond.atomIds[0])?.push(bond.atomIds[1]);
    adjacency.get(bond.atomIds[1])?.push(bond.atomIds[0]);
  }

  const visited = new Set<string>();
  const components: string[][] = [];

  for (const atom of document.page.atoms) {
    if (visited.has(atom.id)) {
      continue;
    }

    const queue = [atom.id];
    const component: string[] = [];
    visited.add(atom.id);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) {
          continue;
        }
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }

    components.push(component);
  }

  return components;
}

function createSeedGeometry(component: ChemicalDocument) {
  if (component.page.atoms.length <= 1) {
    return structuredClone(component);
  }

  let cleaned: ChemicalDocument;
  try {
    cleaned = cleanUpDocument(component, component.name);
  } catch {
    return structuredClone(component);
  }

  if (!hasFiniteAtomCoordinates(cleaned.page.atoms)) {
    return structuredClone(component);
  }

  const seed = buildComponentDocument(
    cleaned,
    cleaned.page.atoms.map((atom) => atom.id),
  );

  if (seed.page.atoms.length !== component.page.atoms.length) {
    return structuredClone(component);
  }

  const remappedAtoms = seed.page.atoms.map((atom, index) => {
    const original = component.page.atoms[index];
    return {
      ...original,
      x: atom.x,
      y: atom.y,
    };
  });

  const nextSeed = structuredClone(component);
  nextSeed.page.atoms = remappedAtoms;
  alignSeedComponent(nextSeed.page.atoms, component.page.atoms);
  if (!hasFiniteAtomCoordinates(nextSeed.page.atoms)) {
    return structuredClone(component);
  }
  return nextSeed;
}

function buildTargetAngularMap(component: ChemicalDocument, seed: ChemicalDocument) {
  const targetAngles = new Map<
    string,
    Array<{
      leftId: string;
      rightId: string;
      gap: number;
    }>
  >();

  for (const atom of seed.page.atoms) {
    const neighbors = getConnectedBonds(seed, atom.id)
      .map((bond) => getOtherAtom(seed, bond, atom.id))
      .filter((neighbor): neighbor is AtomNode => neighbor !== null)
      .map((neighbor) => ({
        id: neighbor.id,
        angle: angleBetween(atom, neighbor),
      }))
      .sort((left, right) => left.angle - right.angle);

    if (neighbors.length < 2) {
      continue;
    }

    const componentAtom = findAtom(component, atom.id);
    const family = componentAtom
      ? inferGeometryFamily(component, componentAtom, strongestBondType(component, atom.id))
      : 'sp3';
    const ringLike = isRingLikeCenter(component, atom.id);

    if (componentAtom && !ringLike && neighbors.length === 2) {
      const idealGap =
        getPreferredHeavyAtomAngleDegrees(
          component,
          componentAtom,
          strongestBondType(component, atom.id),
        ) * DEGREE;
      const seedGap = positiveAngleGap(neighbors[0].angle, neighbors[1].angle);
      const complement = Math.PI * 2 - seedGap;
      if (seedGap <= complement) {
        targetAngles.set(atom.id, [
          {
            leftId: neighbors[0].id,
            rightId: neighbors[1].id,
            gap: idealGap,
          },
          {
            leftId: neighbors[1].id,
            rightId: neighbors[0].id,
            gap: Math.PI * 2 - idealGap,
          },
        ]);
      } else {
        targetAngles.set(atom.id, [
          {
            leftId: neighbors[0].id,
            rightId: neighbors[1].id,
            gap: Math.PI * 2 - idealGap,
          },
          {
            leftId: neighbors[1].id,
            rightId: neighbors[0].id,
            gap: idealGap,
          },
        ]);
      }
      continue;
    }

    if (!ringLike && neighbors.length === 3 && family === 'sp2') {
      targetAngles.set(
        atom.id,
        neighbors.map((neighbor, index) => ({
          leftId: neighbor.id,
          rightId: neighbors[(index + 1) % neighbors.length].id,
          gap: (Math.PI * 2) / 3,
        })),
      );
      continue;
    }

    const gaps = neighbors.map((neighbor, index) => {
      const next = neighbors[(index + 1) % neighbors.length];
      return {
        leftId: neighbor.id,
        rightId: next.id,
        gap: positiveAngleGap(neighbor.angle, next.angle),
      };
    });

    targetAngles.set(atom.id, gaps);
  }

  return targetAngles;
}

function initializeCollapsedBonds(component: ChemicalDocument, bondLength: number) {
  for (const bond of component.page.bonds) {
    const left = findAtom(component, bond.atomIds[0]);
    const right = findAtom(component, bond.atomIds[1]);
    if (!left || !right) {
      continue;
    }

    if (distance(left, right) > 1e-3) {
      continue;
    }

    const angle = ((component.page.bonds.indexOf(bond) % 12) * Math.PI) / 6;
    const order = strongestBondType(component, left.id);
    const ideal = toCanvasUnits(
      getIdealBondLengthAngstrom(component, left, right, order, bond.id),
      bondLength,
    );
    right.x = left.x + Math.cos(angle) * ideal;
    right.y = left.y + Math.sin(angle) * ideal;
  }
}

function componentHasStereoSensitiveBonds(component: ChemicalDocument) {
  return component.page.bonds.some((bond) => {
    return bond.type === 'wedge' || bond.type === 'dash' || bond.type === 'wavy';
  });
}

function transformSeed(seed: ChemicalDocument, variant: 'mirrored' | 'rotated') {
  const transformed = structuredClone(seed);
  const centroid = getCentroid(transformed.page.atoms);

  for (const atom of transformed.page.atoms) {
    const centered = {
      x: atom.x - centroid.x,
      y: atom.y - centroid.y,
    };

    const next =
      variant === 'mirrored'
        ? { x: -centered.x, y: centered.y }
        : { x: -centered.x, y: -centered.y };

    atom.x = centroid.x + next.x;
    atom.y = centroid.y + next.y;
  }

  return transformed;
}

function calculateAverageDisplacement(reference: ChemicalDocument, candidate: ChemicalDocument) {
  if (reference.page.atoms.length === 0) {
    return 0;
  }

  if (
    !hasFiniteAtomCoordinates(reference.page.atoms) ||
    !hasFiniteAtomCoordinates(candidate.page.atoms)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  let total = 0;
  let count = 0;

  for (const atom of reference.page.atoms) {
    const next = findAtom(candidate, atom.id);
    if (!next) {
      continue;
    }
    if (
      !Number.isFinite(atom.x) ||
      !Number.isFinite(atom.y) ||
      !Number.isFinite(next.x) ||
      !Number.isFinite(next.y)
    ) {
      return Number.POSITIVE_INFINITY;
    }
    total += distance(atom, next);
    count += 1;
  }

  return count === 0 ? 0 : total / count;
}

function scoreComponentGeometry(
  component: ChemicalDocument,
  seed: ChemicalDocument,
  bondLength: number,
) {
  if (
    !hasFiniteAtomCoordinates(component.page.atoms) ||
    !hasFiniteAtomCoordinates(seed.page.atoms)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  let score = 0;
  const targetAngles = buildTargetAngularMap(component, seed);

  for (const bond of component.page.bonds) {
    const left = findAtom(component, bond.atomIds[0]);
    const right = findAtom(component, bond.atomIds[1]);
    if (!left || !right) {
      continue;
    }

    const ideal = toCanvasUnits(
      getIdealBondLengthAngstrom(component, left, right, bond.type, bond.id),
      bondLength,
    );
    const actual = distance(left, right);
    const ratio = ideal > 1e-6 ? Math.abs(actual - ideal) / ideal : 0;
    score += ratio * 16;
  }

  for (const [atomId, pairs] of targetAngles) {
    const atom = findAtom(component, atomId);
    if (!atom) {
      continue;
    }

    const neighborAngles = new Map<string, number>();
    for (const bond of getConnectedBonds(component, atom.id)) {
      const neighbor = getOtherAtom(component, bond, atom.id);
      if (!neighbor) {
        continue;
      }
      neighborAngles.set(neighbor.id, angleBetween(atom, neighbor));
    }

    for (const pair of pairs) {
      const leftAngle = neighborAngles.get(pair.leftId);
      const rightAngle = neighborAngles.get(pair.rightId);
      if (leftAngle === undefined || rightAngle === undefined) {
        continue;
      }

      score += Math.abs(positiveAngleGap(leftAngle, rightAngle) - pair.gap) * 4.2;
    }
  }

  for (let leftIndex = 0; leftIndex < component.page.atoms.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < component.page.atoms.length;
      rightIndex += 1
    ) {
      const left = component.page.atoms[leftIndex];
      const right = component.page.atoms[rightIndex];
      const graphDistance = getGraphDistanceUpTo(component, left.id, right.id, 2);
      if (graphDistance === 1) {
        continue;
      }

      const minimum = toCanvasUnits(
        getMinimumNonBondedDistanceAngstrom(left.element, right.element) *
          (graphDistance === 2 ? 0.72 : 1),
        bondLength,
      );
      const actual = distance(left, right);
      if (actual >= minimum) {
        continue;
      }

      const overlap = (minimum - actual) / Math.max(minimum, 1);
      score += overlap * overlap * 28;
    }
  }

  return score;
}

function isViableRefineCandidate(
  baseComponent: ChemicalDocument,
  candidate: RefineCandidate,
  bondLength: number,
) {
  if (
    !hasFiniteAtomCoordinates(candidate.component.page.atoms) ||
    !Number.isFinite(candidate.score) ||
    !Number.isFinite(candidate.displacement)
  ) {
    return false;
  }

  const centroidShift = distance(
    getCentroid(baseComponent.page.atoms),
    getCentroid(candidate.component.page.atoms),
  );
  const maxAverageDisplacement = Math.max(
    bondLength * 12,
    baseComponent.page.atoms.length * bondLength * 2.2,
  );

  return (
    centroidShift <= Math.max(bondLength * 0.4, 8) &&
    candidate.displacement <= maxAverageDisplacement
  );
}

function relaxComponentGeometry(
  component: ChemicalDocument,
  seed: ChemicalDocument,
  bondLength: number,
  iterations = 140,
) {
  const lockedCentroid = getCentroid(component.page.atoms);
  initializeCollapsedBonds(component, bondLength);
  const targetAngles = buildTargetAngularMap(component, seed);
  const seedById = new Map(seed.page.atoms.map((atom) => [atom.id, atom]));

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const previousCoordinates = captureAtomCoordinates(component.page.atoms);
    const forces = new Map<string, Point>(
      component.page.atoms.map((atom) => [atom.id, { x: 0, y: 0 }]),
    );

    for (const bond of component.page.bonds) {
      const left = findAtom(component, bond.atomIds[0]);
      const right = findAtom(component, bond.atomIds[1]);
      if (!left || !right) {
        continue;
      }

      const rawDx = right.x - left.x;
      const rawDy = right.y - left.y;
      let rawDistance = Math.hypot(rawDx, rawDy);
      if (rawDistance < 1e-6) {
        rawDistance = 1;
      }

      const ideal = toCanvasUnits(
        getIdealBondLengthAngstrom(component, left, right, bond.type, bond.id),
        bondLength,
      );
      const difference = rawDistance - ideal;
      const unitX = rawDx / rawDistance;
      const unitY = rawDy / rawDistance;
      const force = difference * 0.24;
      forces.get(left.id)!.x += unitX * force;
      forces.get(left.id)!.y += unitY * force;
      forces.get(right.id)!.x -= unitX * force;
      forces.get(right.id)!.y -= unitY * force;
    }

    for (const atom of component.page.atoms) {
      const targetPairs = targetAngles.get(atom.id);
      if (!targetPairs || targetPairs.length === 0) {
        continue;
      }

      const neighborAngles = new Map<string, number>();
      for (const bond of getConnectedBonds(component, atom.id)) {
        const neighbor = getOtherAtom(component, bond, atom.id);
        if (!neighbor) {
          continue;
        }
        neighborAngles.set(neighbor.id, angleBetween(atom, neighbor));
      }

      for (const pair of targetPairs) {
        const leftAngle = neighborAngles.get(pair.leftId);
        const rightAngle = neighborAngles.get(pair.rightId);
        const leftAtom = findAtom(component, pair.leftId);
        const rightAtom = findAtom(component, pair.rightId);
        if (leftAngle === undefined || rightAngle === undefined || !leftAtom || !rightAtom) {
          continue;
        }

        const gap = positiveAngleGap(leftAngle, rightAngle);
        const error = gap - pair.gap;
        const leftRadius = Math.max(distance(atom, leftAtom), bondLength * 0.45);
        const rightRadius = Math.max(distance(atom, rightAtom), bondLength * 0.45);
        const angleForce = error * 0.12;

        const leftVector = {
          x: -(leftAtom.y - atom.y) / leftRadius,
          y: (leftAtom.x - atom.x) / leftRadius,
        };
        const rightVector = {
          x: -(rightAtom.y - atom.y) / rightRadius,
          y: (rightAtom.x - atom.x) / rightRadius,
        };

        forces.get(leftAtom.id)!.x += leftVector.x * angleForce * leftRadius;
        forces.get(leftAtom.id)!.y += leftVector.y * angleForce * leftRadius;
        forces.get(rightAtom.id)!.x -= rightVector.x * angleForce * rightRadius;
        forces.get(rightAtom.id)!.y -= rightVector.y * angleForce * rightRadius;
      }
    }

    for (let leftIndex = 0; leftIndex < component.page.atoms.length; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < component.page.atoms.length;
        rightIndex += 1
      ) {
        const left = component.page.atoms[leftIndex];
        const right = component.page.atoms[rightIndex];
        const graphDistance = getGraphDistanceUpTo(component, left.id, right.id, 2);
        if (graphDistance === 1) {
          continue;
        }

        const minimumDistance = toCanvasUnits(
          getMinimumNonBondedDistanceAngstrom(left.element, right.element) *
            (graphDistance === 2 ? 0.72 : 1),
          bondLength,
        );
        const rawDx = right.x - left.x;
        const rawDy = right.y - left.y;
        let rawDistance = Math.hypot(rawDx, rawDy);
        if (rawDistance < 1e-6) {
          rawDistance = 1;
        }

        if (rawDistance >= minimumDistance) {
          continue;
        }

        const overlap = minimumDistance - rawDistance;
        const repulsion = overlap * 0.18;
        const unitX = rawDx / rawDistance;
        const unitY = rawDy / rawDistance;
        forces.get(left.id)!.x -= unitX * repulsion;
        forces.get(left.id)!.y -= unitY * repulsion;
        forces.get(right.id)!.x += unitX * repulsion;
        forces.get(right.id)!.y += unitY * repulsion;
      }
    }

    for (const atom of component.page.atoms) {
      const seedAtom = seedById.get(atom.id);
      if (seedAtom) {
        forces.get(atom.id)!.x += (seedAtom.x - atom.x) * 0.08;
        forces.get(atom.id)!.y += (seedAtom.y - atom.y) * 0.08;
      }
    }

    for (const atom of component.page.atoms) {
      const force = forces.get(atom.id);
      if (!force) {
        continue;
      }

      const magnitude = Math.hypot(force.x, force.y);
      const scale = magnitude > 1.85 ? 1.85 / magnitude : 1;
      atom.x += force.x * scale;
      atom.y += force.y * scale;
    }

    if (!hasFiniteAtomCoordinates(component.page.atoms)) {
      restoreAtomCoordinates(component.page.atoms, previousCoordinates);
      break;
    }

    const centroid = getCentroid(component.page.atoms);
    translateAtoms(component.page.atoms, {
      x: lockedCentroid.x - centroid.x,
      y: lockedCentroid.y - centroid.y,
    });

    if (!hasFiniteAtomCoordinates(component.page.atoms)) {
      restoreAtomCoordinates(component.page.atoms, previousCoordinates);
      break;
    }
  }
}

function buildRefineCandidate(
  baseComponent: ChemicalDocument,
  seed: ChemicalDocument,
  bondLength: number,
  iterations: number,
  variant: RefineCandidate['variant'],
): RefineCandidate {
  const candidate = structuredClone(baseComponent);
  relaxComponentGeometry(candidate, seed, bondLength, iterations);
  return {
    component: candidate,
    score: scoreComponentGeometry(candidate, seed, bondLength),
    displacement: calculateAverageDisplacement(baseComponent, candidate),
    variant,
  };
}

export function refineDocumentWithConstraints(
  document: ChemicalDocument,
  options: {
    bondLength?: number;
    iterations?: number;
  } = {},
): RefineDocumentResult {
  const refined = structuredClone(document);
  const components = getConnectedComponents(refined);
  const bondLength = options.bondLength ?? DEFAULT_SETTINGS.bondLength;
  const iterations = options.iterations ?? 140;
  let alternativeLayouts = 0;
  let refinedAtomCount = 0;

  if (components.length === 0) {
    return {
      document: refined,
      statusText: 'Nothing to refine yet.',
    };
  }

  for (const atomIds of components) {
    if (atomIds.length <= 1) {
      continue;
    }

    const component = buildComponentDocument(refined, atomIds);
    const seed = createSeedGeometry(component);
    const currentScore = scoreComponentGeometry(component, seed, bondLength);
    const candidates: RefineCandidate[] = [
      buildRefineCandidate(component, seed, bondLength, iterations, 'primary'),
    ];

    if (!componentHasStereoSensitiveBonds(component)) {
      candidates.push(
        buildRefineCandidate(
          component,
          transformSeed(seed, 'mirrored'),
          bondLength,
          iterations,
          'mirrored',
        ),
      );
    }

    candidates.push(
      buildRefineCandidate(
        component,
        transformSeed(seed, 'rotated'),
        bondLength,
        iterations,
        'rotated',
      ),
    );

    const viableCandidates = candidates.filter((candidate) =>
      isViableRefineCandidate(component, candidate, bondLength),
    );
    if (viableCandidates.length === 0) {
      continue;
    }

    const bestScore = Math.min(...viableCandidates.map((candidate) => candidate.score));
    const currentIsAlreadyGood =
      currentScore <= bestScore * 1.15 + Math.max(0.8, atomIds.length * 0.08);
    const meaningfulAlternatives = viableCandidates
      .filter((candidate) => {
        return (
          candidate.displacement >= bondLength * 0.32 &&
          candidate.score <= bestScore * 1.12 + Math.max(0.4, atomIds.length * 0.04)
        );
      })
      .sort((left, right) => right.displacement - left.displacement || left.score - right.score);

    const selected =
      currentIsAlreadyGood && meaningfulAlternatives.length > 0
        ? meaningfulAlternatives[0]
        : viableCandidates.sort(
            (left, right) => left.score - right.score || left.displacement - right.displacement,
          )[0];

    if (selected.variant !== 'primary') {
      alternativeLayouts += 1;
    }

    const coordinates = new Map(selected.component.page.atoms.map((atom) => [atom.id, atom]));
    for (const atom of refined.page.atoms) {
      const next = coordinates.get(atom.id);
      if (!next) {
        continue;
      }
      atom.x = next.x;
      atom.y = next.y;
    }

    refinedAtomCount += atomIds.length;
  }

  return {
    document: refined,
    statusText:
      alternativeLayouts > 0
        ? `Refined ${refinedAtomCount} atom${refinedAtomCount === 1 ? '' : 's'} in place and proposed ${alternativeLayouts} alternate valid layout${alternativeLayouts === 1 ? '' : 's'}.`
        : `Refined ${refinedAtomCount} atom${refinedAtomCount === 1 ? '' : 's'} in place with the recorded geometry constraints.`,
  };
}
