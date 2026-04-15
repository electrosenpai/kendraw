import {
  DEFAULT_PAGE,
  DEFAULT_SETTINGS,
  DEFAULT_VIEWPORT,
  BOND_ORDER_BY_TYPE,
  RING_SIZES,
} from './constants';
import { createRegularPolygon } from './geometry';
import type {
  AtomNode,
  BondEdge,
  BondType,
  ChemicalDocument,
  EditorSnapshot,
  Point,
  RingTemplate,
  SelectionBounds,
} from './types';

let idCounter = 0;

export function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

export function createEmptyDocument(name = 'Untitled Structure'): ChemicalDocument {
  return {
    id: createId('doc'),
    name,
    createdAt: new Date().toISOString(),
    page: {
      atoms: [],
      bonds: [],
      texts: [],
      arrows: [],
      size: DEFAULT_PAGE,
      background: '#f7f3ea',
    },
  };
}

export function createEditorSnapshot(document: ChemicalDocument): EditorSnapshot {
  return {
    document,
    selectionIds: [],
    activeTool: 'select',
    activeElement: 'C',
    activeBondType: 'single',
    activeRingTemplate: 'benzene',
    statusText: 'Ready',
    viewport: structuredClone(DEFAULT_VIEWPORT),
    settings: structuredClone(DEFAULT_SETTINGS),
  };
}

export function cloneSnapshot(snapshot: EditorSnapshot) {
  return structuredClone(snapshot);
}

export function findAtom(document: ChemicalDocument, atomId: string) {
  return document.page.atoms.find((atom) => atom.id === atomId) ?? null;
}

export function findBond(document: ChemicalDocument, bondId: string) {
  return document.page.bonds.find((bond) => bond.id === bondId) ?? null;
}

export function removeEntity(document: ChemicalDocument, entityId: string) {
  const atomExists = document.page.atoms.some((atom) => atom.id === entityId);
  if (atomExists) {
    document.page.atoms = document.page.atoms.filter((atom) => atom.id !== entityId);
    document.page.bonds = document.page.bonds.filter(
      (bond) => bond.atomIds[0] !== entityId && bond.atomIds[1] !== entityId,
    );
    return;
  }

  document.page.bonds = document.page.bonds.filter((bond) => bond.id !== entityId);
  document.page.texts = document.page.texts.filter((text) => text.id !== entityId);
  document.page.arrows = document.page.arrows.filter((arrow) => arrow.id !== entityId);
}

export function selectionPoints(document: ChemicalDocument, selectionIds: string[]): Point[] {
  const points: Point[] = [];

  for (const selectionId of selectionIds) {
    const atom = findAtom(document, selectionId);
    if (atom) {
      points.push({ x: atom.x, y: atom.y });
      continue;
    }

    const bond = findBond(document, selectionId);
    if (bond) {
      const begin = findAtom(document, bond.atomIds[0]);
      const end = findAtom(document, bond.atomIds[1]);
      if (begin && end) {
        points.push({ x: begin.x, y: begin.y }, { x: end.x, y: end.y });
      }
      continue;
    }

    const text = document.page.texts.find((entry) => entry.id === selectionId);
    if (text) {
      points.push({ x: text.x, y: text.y });
      continue;
    }

    const arrow = document.page.arrows.find((entry) => entry.id === selectionId);
    if (arrow) {
      points.push(arrow.from, arrow.to);
    }
  }

  return points;
}

export function selectionBounds(
  document: ChemicalDocument,
  selectionIds: string[],
): SelectionBounds | null {
  const points = selectionPoints(document, selectionIds);
  if (points.length === 0) {
    return null;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export function addAtom(document: ChemicalDocument, point: Point, element = 'C'): AtomNode {
  const atom: AtomNode = {
    id: createId('atom'),
    element,
    x: point.x,
    y: point.y,
    charge: 0,
    isotope: null,
    radical: 'none',
    alias: null,
    hydrogens: null,
    stereo: 'none',
    mapNumber: null,
    color: null,
  };

  document.page.atoms.push(atom);
  return atom;
}

export function addBond(
  document: ChemicalDocument,
  atomIds: [string, string],
  type: BondType,
): BondEdge {
  const existing = document.page.bonds.find((bond) => {
    const sameDirection = bond.atomIds[0] === atomIds[0] && bond.atomIds[1] === atomIds[1];
    const oppositeDirection = bond.atomIds[0] === atomIds[1] && bond.atomIds[1] === atomIds[0];
    return sameDirection || oppositeDirection;
  });

  if (existing) {
    existing.type = type;
    existing.order = BOND_ORDER_BY_TYPE[type];
    existing.display = type === 'aromatic' ? 'aromatic' : 'normal';
    return existing;
  }

  const bond: BondEdge = {
    id: createId('bond'),
    atomIds,
    type,
    order: BOND_ORDER_BY_TYPE[type],
    display: type === 'aromatic' ? 'aromatic' : 'normal',
    color: null,
  };

  document.page.bonds.push(bond);
  return bond;
}

export function splitBondWithAtom(
  document: ChemicalDocument,
  bondId: string,
  point: Point,
  element = 'C',
) {
  const bond = findBond(document, bondId);
  if (!bond) {
    return null;
  }

  document.page.bonds = document.page.bonds.filter((entry) => entry.id !== bondId);

  const atom = addAtom(document, point, element);
  const leftBond = addBond(document, [bond.atomIds[0], atom.id], bond.type);
  const rightBond = addBond(document, [atom.id, bond.atomIds[1]], bond.type);

  leftBond.color = bond.color;
  rightBond.color = bond.color;
  leftBond.display = bond.display;
  rightBond.display = bond.display;
  leftBond.order = bond.order;
  rightBond.order = bond.order;

  return {
    atom,
    leftBond,
    rightBond,
  };
}

export function moveSelection(document: ChemicalDocument, selectionIds: string[], delta: Point) {
  const movedAtomIds = new Set<string>();

  for (const id of selectionIds) {
    const atom = document.page.atoms.find((entry) => entry.id === id);
    if (atom) {
      atom.x += delta.x;
      atom.y += delta.y;
      movedAtomIds.add(atom.id);
      continue;
    }

    const bond = document.page.bonds.find((entry) => entry.id === id);
    if (bond) {
      for (const atomId of bond.atomIds) {
        if (movedAtomIds.has(atomId)) {
          continue;
        }
        const bondedAtom = document.page.atoms.find((entry) => entry.id === atomId);
        if (bondedAtom) {
          bondedAtom.x += delta.x;
          bondedAtom.y += delta.y;
          movedAtomIds.add(bondedAtom.id);
        }
      }
      continue;
    }

    const text = document.page.texts.find((entry) => entry.id === id);
    if (text) {
      text.x += delta.x;
      text.y += delta.y;
      continue;
    }

    const arrow = document.page.arrows.find((entry) => entry.id === id);
    if (arrow) {
      arrow.from.x += delta.x;
      arrow.from.y += delta.y;
      arrow.to.x += delta.x;
      arrow.to.y += delta.y;
    }
  }
}

export function createRingAt(point: Point, template: RingTemplate, bondLength: number) {
  const { size, aromatic } = RING_SIZES[template];
  const ringPoints = createRegularPolygon(point, size, bondLength);

  const atoms: AtomNode[] = ringPoints.map((ringPoint) => ({
    id: createId('atom'),
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
    const alternatingDouble = aromatic && index % 2 === 0;
    return {
      id: createId('bond'),
      atomIds: [atom.id, next.id],
      type: aromatic ? 'aromatic' : 'single',
      order: aromatic ? (alternatingDouble ? 2 : 1) : 1,
      display: aromatic ? 'aromatic' : 'normal',
      color: null,
    };
  });

  return { atoms, bonds };
}
